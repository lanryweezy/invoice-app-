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
  let originalGlobalNotification: any;
  let originalWindowNotification: any;

  beforeEach(() => {
    originalGlobalNotification = global.Notification;
    originalWindowNotification = window.Notification;

    const mockNotification = vi.fn() as any;
    mockNotification.permission = 'granted';
    mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

    global.Notification = mockNotification;
    window.Notification = mockNotification;

    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'test-vapid-key');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    global.Notification = originalGlobalNotification;
    window.Notification = originalWindowNotification;
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('returns denied if Notification is not supported in window', async () => {
      // @ts-ignore
      delete window.Notification;

      const permission = await requestNotificationPermission();
      expect(permission).toBe('denied');
    });

    it('requests permission and returns the result if supported', async () => {
      vi.mocked(window.Notification.requestPermission).mockResolvedValue('granted');
      const permission = await requestNotificationPermission();

      expect(window.Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });
  });

  describe('subscribeToPushNotifications', () => {
    it('returns false if permission is not granted', async () => {
      vi.mocked(window.Notification.requestPermission).mockResolvedValue('denied');

      const result = await subscribeToPushNotifications('user-123');
      expect(result).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
    });

    it('returns false if token generation fails (no token returned)', async () => {
      vi.mocked(window.Notification.requestPermission).mockResolvedValue('granted');
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);
      vi.mocked(getToken).mockResolvedValue('');

      const result = await subscribeToPushNotifications('user-123');
      expect(result).toBe(false);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('saves FCM token to Firestore and returns true on success', async () => {
      vi.mocked(window.Notification.requestPermission).mockResolvedValue('granted');
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);
      vi.mocked(getToken).mockResolvedValue('mock-fcm-token');
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);

      const result = await subscribeToPushNotifications('user-123');

      expect(getToken).toHaveBeenCalledWith('mock-messaging', {
        vapidKey: 'test-vapid-key',
      });
      expect(doc).toHaveBeenCalledWith({}, 'users', 'user-123', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
        token: 'mock-fcm-token',
        createdAt: '2024-01-01T00:00:00.000Z',
        userAgent: navigator.userAgent,
      });
      expect(result).toBe(true);
    });

    it('catches errors and returns false on failure', async () => {
      vi.mocked(window.Notification.requestPermission).mockResolvedValue('granted');
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);
      vi.mocked(getToken).mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await subscribeToPushNotifications('user-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to subscribe:', expect.any(Error));
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('deletes token document if it exists and returns true', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

      const result = await unsubscribeFromPushNotifications('user-123');

      expect(doc).toHaveBeenCalledWith({}, 'users', 'user-123', 'fcmTokens', 'current');
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(result).toBe(true);
    });

    it('does not delete document if it does not exist but returns true', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const result = await unsubscribeFromPushNotifications('user-123');

      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false when getting document fails', async () => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(getDoc).mockRejectedValue(new Error('Permission denied'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await unsubscribeFromPushNotifications('user-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to unsubscribe:', expect.any(Error));
    });
  });

  describe('isPushNotificationSubscribed', () => {
    it('returns true if a token is successfully retrieved', async () => {
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);
      vi.mocked(getToken).mockResolvedValue('mock-token');

      const result = await isPushNotificationSubscribed();

      expect(getMessaging).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalledWith('mock-messaging');
      expect(result).toBe(true);
    });

    it('returns false if no token is returned', async () => {
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);
      vi.mocked(getToken).mockResolvedValue('');

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(false);
    });

    it('returns false if an error is thrown during token retrieval', async () => {
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);
      vi.mocked(getToken).mockRejectedValue(new Error('Not subscribed'));

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('sets up a listener that invokes callback with title and body', () => {
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);

      // We want to capture the callback passed to onMessage
      let onMessageCallback: (payload: any) => void = () => {};
      vi.mocked(onMessage).mockImplementation((messaging, callback) => {
        onMessageCallback = callback as any;
        return vi.fn() as any;
      });

      const subscriberCallback = vi.fn();
      onForegroundMessage(subscriberCallback);

      expect(onMessage).toHaveBeenCalledWith('mock-messaging', expect.any(Function));

      // Trigger the mocked callback with a full payload
      onMessageCallback({
        notification: { title: 'Test Title', body: 'Test Body' }
      });

      expect(subscriberCallback).toHaveBeenCalledWith({
        title: 'Test Title',
        body: 'Test Body'
      });
    });

    it('handles payload without notification gracefully (empty strings)', () => {
      vi.mocked(getMessaging).mockReturnValue('mock-messaging' as any);

      let onMessageCallback: (payload: any) => void = () => {};
      vi.mocked(onMessage).mockImplementation((messaging, callback) => {
        onMessageCallback = callback as any;
        return vi.fn() as any;
      });

      const subscriberCallback = vi.fn();
      onForegroundMessage(subscriberCallback);

      // Trigger with missing title/body
      onMessageCallback({ notification: {} });

      expect(subscriberCallback).toHaveBeenCalledWith({
        title: '',
        body: ''
      });

      // Trigger with undefined notification
      onMessageCallback({});

      expect(subscriberCallback).toHaveBeenCalledWith({
        title: '',
        body: ''
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
