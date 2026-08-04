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
  let originalNotification: any;
  let originalWindow: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    originalNotification = global.Notification;
    global.Notification = vi.fn() as any;
    global.Notification.requestPermission = vi.fn();
    (global.Notification as any).permission = 'granted';

    originalWindow = { ...window };

    // Mock navigator.userAgent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Mock)',
      configurable: true,
    });

    // Mock import.meta.env
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'mock-vapid-key');
  });

  afterEach(() => {
    global.Notification = originalNotification;
    // window = originalWindow;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('returns denied when Notification is not in window', async () => {
      // @ts-ignore
      delete window.Notification;
      const originalWarn = console.warn;
      console.warn = vi.fn();

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
      expect(console.warn).toHaveBeenCalledWith('Notifications not supported');

      console.warn = originalWarn;
      window.Notification = global.Notification;
    });

    it('returns requested permission when Notification is supported', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('subscribeToPushNotifications', () => {
    it('returns false if permission is not granted', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('denied');
      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
    });

    it('returns false if getToken fails to return a token', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      vi.mocked(getToken).mockResolvedValue('');

      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
    });

    it('returns true and saves token to firestore if successful', async () => {
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
      vi.mocked(getToken).mockResolvedValue('mock-token-123');
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
        token: 'mock-token-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        userAgent: 'Mozilla/5.0 (Mock)',
      });

      vi.useRealTimers();
    });

    it('returns false and logs error if an exception occurs', async () => {
      global.Notification.requestPermission = vi.fn().mockRejectedValue(new Error('Mock error'));
      const originalError = console.error;
      console.error = vi.fn();

      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to subscribe:', expect.any(Error));

      console.error = originalError;
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('deletes token from firestore if it exists', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

      const result = await unsubscribeFromPushNotifications('user123');
      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'fcmTokens', 'current');
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('does not call deleteDoc if token does not exist', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const result = await unsubscribeFromPushNotifications('user123');
      expect(result).toBe(true);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('returns false and logs error if an exception occurs', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockRejectedValue(new Error('Mock error'));
      const originalError = console.error;
      console.error = vi.fn();

      const result = await unsubscribeFromPushNotifications('user123');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to unsubscribe:', expect.any(Error));

      console.error = originalError;
    });
  });

  describe('isPushNotificationSubscribed', () => {
    it('returns true if token exists', async () => {
      vi.mocked(getToken).mockResolvedValue('mock-token');
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(true);
    });

    it('returns false if token does not exist', async () => {
      vi.mocked(getToken).mockResolvedValue('');
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });

    it('returns false if getToken throws', async () => {
      vi.mocked(getToken).mockRejectedValue(new Error('Mock error'));
      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('calls callback with expected title and body', () => {
      const mockCallback = vi.fn();
      vi.mocked(onMessage).mockImplementation((messaging, cb: any) => {
        cb({
          notification: {
            title: 'Mock Title',
            body: 'Mock Body',
          }
        });
        return vi.fn(); // unsubscribe function
      });

      onForegroundMessage(mockCallback);
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Mock Title',
        body: 'Mock Body',
      });
    });

    it('handles empty notification payload', () => {
      const mockCallback = vi.fn();
      vi.mocked(onMessage).mockImplementation((messaging, cb: any) => {
        cb({ notification: null });
        return vi.fn();
      });

      onForegroundMessage(mockCallback);
      expect(mockCallback).toHaveBeenCalledWith({
        title: '',
        body: '',
      });
    });
  });

  describe('sendLocalNotification', () => {
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
