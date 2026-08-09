import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent } from '../utils/analytics';

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
  onForegroundMessage,
  sendLocalNotification
} from './pushNotifications';

vi.mock('./firebase', () => ({
  db: {},
}));

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

describe('pushNotifications', () => {
  beforeEach(() => {
    // Reset process.env for tests
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'test-vapid-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('requestNotificationPermission', () => {
    it('returns denied if Notification is not in window', async () => {
      // In JS DOM, Notification is part of the global window object.
      // We can use vi.stubGlobal and set Notification to undefined to test the fallback.
      // We also need to store and replace window since 'in window' check looks at properties
      const originalNotification = window.Notification;
      // @ts-ignore
      delete window.Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');

      // Restore
      if (originalNotification) {
        window.Notification = originalNotification;
      }
    });

    it('requests permission if Notification is supported', async () => {
      const mockNotification = vi.fn() as any;
      mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');
      vi.stubGlobal('Notification', mockNotification);

      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('subscribeToPushNotifications', () => {
    let mockNotification: any;

    beforeEach(() => {
      mockNotification = vi.fn() as any;
      mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');
      vi.stubGlobal('Notification', mockNotification);
      vi.stubGlobal('navigator', { userAgent: 'test-agent' });
    });

    it('returns false if permission is denied', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');
      const result = await subscribeToPushNotifications('user-1');
      expect(result).toBe(false);
    });

    it('subscribes successfully and saves token to Firestore when permission is granted', async () => {
      vi.mocked(getToken).mockResolvedValue('test-fcm-token');
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);

      const result = await subscribeToPushNotifications('user-1');

      expect(result).toBe(true);
      expect(getMessaging).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalledWith(undefined, { vapidKey: 'test-vapid-key' });
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
        token: 'test-fcm-token',
        userAgent: 'test-agent',
      }));
    });

    it('returns false if token generation fails', async () => {
      vi.mocked(getToken).mockResolvedValue('');
      const result = await subscribeToPushNotifications('user-1');
      expect(result).toBe(false);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('catches and returns false if an error is thrown', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getToken).mockRejectedValue(new Error('Network error'));
      const result = await subscribeToPushNotifications('user-1');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to subscribe to push notifications', {
        event: 'push.subscribe.failed',
        userId: 'user-1',
        error: 'Network error',
      });
      expect(trackEvent).toHaveBeenCalledWith('push_notification_subscribe_failed', {
        user_id: 'user-1',
        error: 'Network error',
      });
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('deletes token from Firestore if it exists', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

      const result = await unsubscribeFromPushNotifications('user-1');

      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1', 'fcmTokens', 'current');
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('returns true without deleting if token does not exist', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const result = await unsubscribeFromPushNotifications('user-1');

      expect(result).toBe(true);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('returns false if an error is thrown during unsubscription', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getDoc).mockRejectedValue(new Error('Network error'));
      const result = await unsubscribeFromPushNotifications('user-1');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to unsubscribe from push notifications', {
        event: 'push.unsubscribe.failed',
        userId: 'user-1',
        error: 'Network error',
      });
      expect(trackEvent).toHaveBeenCalledWith('push_notification_unsubscribe_failed', {
        user_id: 'user-1',
        error: 'Network error',
      });
    });
  });

  describe('isPushNotificationSubscribed', () => {
    it('returns true if token exists', async () => {
      vi.mocked(getToken).mockResolvedValue('existing-token');
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(true);
    });

    it('returns false if token does not exist', async () => {
      vi.mocked(getToken).mockResolvedValue('');
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });

    it('returns false if an error is thrown', async () => {
      vi.mocked(getToken).mockRejectedValue(new Error('Error getting token'));
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('registers callback with onMessage and handles payload', () => {
      const mockCallback = vi.fn();

      // Setup the mock to simulate a message being received
      vi.mocked(onMessage).mockImplementation((_messaging, onMsgHandler) => {
        // Trigger the handler immediately to test the callback
        (onMsgHandler as Function)({
          notification: { title: 'Test Title', body: 'Test Body' }
        });
        return vi.fn(); // return mock unsubscribe function
      });

      onForegroundMessage(mockCallback);

      expect(getMessaging).toHaveBeenCalled();
      expect(onMessage).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith({ title: 'Test Title', body: 'Test Body' });
    });

    it('handles payload without notification securely', () => {
      const mockCallback = vi.fn();

      vi.mocked(onMessage).mockImplementation((_messaging, onMsgHandler) => {
        (onMsgHandler as Function)({});
        return vi.fn();
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({ title: '', body: '' });
    });
  });

  describe('sendLocalNotification', () => {
    let mockNotificationClass: any;

    beforeEach(() => {
      mockNotificationClass = vi.fn() as any;
      mockNotificationClass.permission = 'granted';
      vi.stubGlobal('Notification', mockNotificationClass);
    });

    it('creates a Notification if permission is granted', () => {
      sendLocalNotification('Test Title', 'Test Body', '/custom-icon.png');
      expect(mockNotificationClass).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/custom-icon.png',
        badge: '/favicon.svg',
      });
    });

    it('uses default icon if not provided', () => {
      sendLocalNotification('Test Title', 'Test Body');
      expect(mockNotificationClass).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
      });
    });

    it('does not create a Notification if permission is not granted', () => {
      mockNotificationClass.permission = 'denied';
      sendLocalNotification('Test Title', 'Test Body');
      expect(mockNotificationClass).not.toHaveBeenCalled();
    });
  });
});
