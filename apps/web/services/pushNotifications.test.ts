import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendLocalNotification,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
  onForegroundMessage,
} from './pushNotifications';
import { getDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { getToken, getMessaging, onMessage } from 'firebase/messaging';

vi.mock('./firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

describe('pushNotifications', () => {
  let consoleSpyWarn: any;
  let consoleSpyError: any;

  beforeEach(() => {
    consoleSpyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleSpyError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('returns denied and warns when Notification is not supported', async () => {
      // Temporarily remove Notification from global scope
      const originalNotification = global.Notification;
      // @ts-ignore
      delete global.Notification;
      // We also need to remove it from window if we are in jsdom
      const originalWindowNotification = window.Notification;
      // @ts-ignore
      delete window.Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe('denied');
      expect(consoleSpyWarn).toHaveBeenCalledWith('Notifications not supported');

      global.Notification = originalNotification;
      window.Notification = originalWindowNotification;
    });

    it('returns the permission result from Notification.requestPermission', async () => {
      const originalNotification = global.Notification;
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as any;

      const originalWindowNotification = window.Notification;
      window.Notification = global.Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe('granted');
      expect(global.Notification.requestPermission).toHaveBeenCalled();

      global.Notification = originalNotification;
      window.Notification = originalWindowNotification;
    });
  });

  describe('subscribeToPushNotifications', () => {
    let originalNotification: any;
    let originalWindowNotification: any;

    beforeEach(() => {
      originalNotification = global.Notification;
      originalWindowNotification = window.Notification;
    });

    afterEach(() => {
      global.Notification = originalNotification;
      window.Notification = originalWindowNotification;
    });

    it('returns false if permission is denied', async () => {
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('denied'),
      } as any;
      window.Notification = global.Notification;

      const result = await subscribeToPushNotifications('user-1');

      expect(result).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
    });

    it('returns false if getToken returns null', async () => {
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as any;
      window.Notification = global.Notification;

      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.mocked(getToken).mockResolvedValue('');

      const result = await subscribeToPushNotifications('user-1');

      expect(result).toBe(false);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('returns false and logs error if an exception is thrown', async () => {
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as any;
      window.Notification = global.Notification;

      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.mocked(getToken).mockRejectedValue(new Error('Network error'));

      const result = await subscribeToPushNotifications('user-1');

      expect(result).toBe(false);
      expect(consoleSpyError).toHaveBeenCalledWith('Failed to subscribe:', expect.any(Error));
    });

    it('returns true and saves token to Firestore on success', async () => {
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as any;
      window.Notification = global.Notification;

      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.mocked(getToken).mockResolvedValue('mock-token-123');
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);

      const result = await subscribeToPushNotifications('user-1');

      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
        token: 'mock-token-123',
        createdAt: expect.any(String),
        userAgent: expect.any(String),
      });
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('deletes token document if it exists and returns true', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

      const result = await unsubscribeFromPushNotifications('user-1');

      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-1', 'fcmTokens', 'current');
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('returns true without deleting if document does not exist', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const result = await unsubscribeFromPushNotifications('user-1');

      expect(result).toBe(true);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('returns false and logs error if an exception is thrown', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      const result = await unsubscribeFromPushNotifications('user-1');

      expect(result).toBe(false);
      expect(consoleSpyError).toHaveBeenCalledWith('Failed to unsubscribe:', expect.any(Error));
    });
  });

  describe('isPushNotificationSubscribed', () => {
    it('returns true if getToken returns a token', async () => {
      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.mocked(getToken).mockResolvedValue('mock-token');

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(true);
    });

    it('returns false if getToken returns null/empty string', async () => {
      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.mocked(getToken).mockResolvedValue('');

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(false);
    });

    it('returns false if getToken throws an error', async () => {
      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.mocked(getToken).mockRejectedValue(new Error('Permission denied'));

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('sets up a message listener and calls the callback with correct payload', () => {
      const mockCallback = vi.fn();
      vi.mocked(getMessaging).mockReturnValue({} as any);

      // We want to simulate the behavior of onMessage calling its callback
      vi.mocked(onMessage).mockImplementation((messaging, callback) => {
        // Immediately invoke the callback with a mock payload
        callback({
          notification: { title: 'Test Title', body: 'Test Body' }
        });
        return () => {}; // return mock unsubscribe function
      });

      onForegroundMessage(mockCallback);

      expect(onMessage).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Test Title',
        body: 'Test Body',
      });
    });

    it('handles payload with missing notification data gracefully', () => {
      const mockCallback = vi.fn();
      vi.mocked(getMessaging).mockReturnValue({} as any);

      vi.mocked(onMessage).mockImplementation((messaging, callback) => {
        callback({}); // Empty payload
        return () => {};
      });

      onForegroundMessage(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        title: '',
        body: '',
      });
    });
  });

  describe('sendLocalNotification', () => {
    let originalNotification: any;

    beforeEach(() => {
      originalNotification = global.Notification;
      global.Notification = vi.fn() as any;
      (global.Notification as any).permission = 'granted';
    });

    afterEach(() => {
      global.Notification = originalNotification;
    });

    it('creates a Notification if permission is granted', () => {
      sendLocalNotification('Test Title', 'Test Body', '/custom-icon.png');
      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/custom-icon.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      });
    });

    it('uses default icon if not provided', () => {
      sendLocalNotification('Test Title', 'Test Body');
      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      });
    });

    it('does not create a Notification if permission is not granted', () => {
      (global.Notification as any).permission = 'denied';
      sendLocalNotification('Test Title', 'Test Body');
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });
});