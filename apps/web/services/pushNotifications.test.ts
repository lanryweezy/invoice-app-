import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendLocalNotification,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
  onForegroundMessage
} from './pushNotifications';

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestNotificationPermission', () => {
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

    it('returns denied if Notification is not in window', async () => {
      // @ts-ignore
      delete window.Notification;
      // Also delete from global to be safe
      // @ts-ignore
      delete global.Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });

    it('requests permission if Notification is supported', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('granted');
      global.Notification = { requestPermission: requestPermissionMock } as any;
      window.Notification = { requestPermission: requestPermissionMock } as any;
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
      expect(requestPermissionMock).toHaveBeenCalled();
    });
  });

  describe('subscribeToPushNotifications', () => {
    let originalNotification: any;

    beforeEach(() => {
      originalNotification = global.Notification;
      const mockNotification = { requestPermission: vi.fn().mockResolvedValue('granted') };
      global.Notification = mockNotification as any;
      window.Notification = mockNotification as any;
      vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'test-key');
    });

    afterEach(() => {
      global.Notification = originalNotification;
      window.Notification = originalNotification;
      vi.unstubAllEnvs();
    });

    it('returns false if permission is denied', async () => {
      const mockNotification = { requestPermission: vi.fn().mockResolvedValue('denied') };
      global.Notification = mockNotification as any;
      window.Notification = mockNotification as any;
      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
    });

    it('returns false if token is not returned', async () => {
      vi.mocked(getToken).mockResolvedValue('');
      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
    });

    it('returns true and saves token to firestore if successful', async () => {
      vi.mocked(getToken).mockResolvedValue('mock-token');
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);

      const result = await subscribeToPushNotifications('user123');

      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
        token: 'mock-token',
        userAgent: expect.any(String),
      }));
    });

    it('returns false and logs error on catch', async () => {
      vi.mocked(getToken).mockRejectedValue(new Error('Fetch failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await subscribeToPushNotifications('user123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('deletes doc if it exists and returns true', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

      const result = await unsubscribeFromPushNotifications('user123');

      expect(result).toBe(true);
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('does not delete doc if it does not exist but returns true', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const result = await unsubscribeFromPushNotifications('user123');

      expect(result).toBe(true);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('returns false on error', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Fetch failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await unsubscribeFromPushNotifications('user123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('isPushNotificationSubscribed', () => {
    it('returns true if token exists', async () => {
      vi.mocked(getToken).mockResolvedValue('token');
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(true);
    });

    it('returns false if token does not exist', async () => {
      vi.mocked(getToken).mockResolvedValue('');
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });

    it('returns false if getToken throws', async () => {
      vi.mocked(getToken).mockRejectedValue(new Error('fail'));
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('sets up message listener and triggers callback with payload', () => {
      const callback = vi.fn();
      vi.mocked(onMessage).mockImplementation((messaging, cb) => {
        cb({ notification: { title: 'T', body: 'B' } } as any);
        return vi.fn();
      });

      onForegroundMessage(callback);

      expect(onMessage).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith({ title: 'T', body: 'B' });
    });

    it('handles empty payload gracefully', () => {
      const callback = vi.fn();
      vi.mocked(onMessage).mockImplementation((messaging, cb) => {
        cb({} as any);
        return vi.fn();
      });

      onForegroundMessage(callback);

      expect(callback).toHaveBeenCalledWith({ title: '', body: '' });
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
