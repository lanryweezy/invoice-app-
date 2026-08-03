import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
  onForegroundMessage,
  sendLocalNotification
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
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'test-vapid-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('requestNotificationPermission', () => {
    it('returns denied when Notification is not in window', async () => {
      // Temporarily remove Notification from window
      vi.stubGlobal('Notification', undefined);
      // @ts-ignore
      delete window.Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });

    it('requests permission and returns the result', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      const mockNotification = { requestPermission: mockRequestPermission };
      vi.stubGlobal('Notification', mockNotification);
      // @ts-ignore
      window.Notification = mockNotification;

      const result = await requestNotificationPermission();
      expect(mockRequestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });
  });

  describe('subscribeToPushNotifications', () => {
    let mockRequestPermission: Mock;

    beforeEach(() => {
      mockRequestPermission = vi.fn().mockResolvedValue('granted');
      const mockNotification = { requestPermission: mockRequestPermission };
      vi.stubGlobal('Notification', mockNotification);
      // @ts-ignore
      window.Notification = mockNotification;

      (getMessaging as Mock).mockReturnValue('mock-messaging');
    });

    it('returns false if permission is not granted', async () => {
      mockRequestPermission.mockResolvedValue('denied');
      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
    });

    it('returns false if token is not available', async () => {
      (getToken as Mock).mockResolvedValue(null);
      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('subscribes successfully and saves token to Firestore', async () => {
      (getToken as Mock).mockResolvedValue('mock-fcm-token');
      (doc as Mock).mockReturnValue('mock-doc-ref');

      const beforeTime = new Date().toISOString();
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

      const result = await subscribeToPushNotifications('user123');

      expect(getToken).toHaveBeenCalledWith('mock-messaging', {
        vapidKey: 'test-vapid-key'
      });
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', {
        token: 'mock-fcm-token',
        createdAt: '2024-01-01T00:00:00.000Z',
        userAgent: expect.any(String)
      });
      expect(result).toBe(true);

      vi.useRealTimers();
    });

    it('returns false if an error occurs during subscription', async () => {
      (getToken as Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await subscribeToPushNotifications('user123');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to subscribe:', expect.any(Error));
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    it('deletes token document if it exists', async () => {
      (doc as Mock).mockReturnValue('mock-doc-ref');
      (getDoc as Mock).mockResolvedValue({ exists: () => true });

      const result = await unsubscribeFromPushNotifications('user123');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'fcmTokens', 'current');
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(result).toBe(true);
    });

    it('does not delete token document if it does not exist', async () => {
      (doc as Mock).mockReturnValue('mock-doc-ref');
      (getDoc as Mock).mockResolvedValue({ exists: () => false });

      const result = await unsubscribeFromPushNotifications('user123');
      expect(deleteDoc).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false if an error occurs', async () => {
      (getDoc as Mock).mockRejectedValue(new Error('Firebase error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await unsubscribeFromPushNotifications('user123');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to unsubscribe:', expect.any(Error));
    });
  });

  describe('isPushNotificationSubscribed', () => {
    it('returns true if token exists', async () => {
      (getMessaging as Mock).mockReturnValue('mock-messaging');
      (getToken as Mock).mockResolvedValue('existing-token');

      const result = await isPushNotificationSubscribed();
      expect(getMessaging).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalledWith('mock-messaging');
      expect(result).toBe(true);
    });

    it('returns false if token does not exist', async () => {
      (getMessaging as Mock).mockReturnValue('mock-messaging');
      (getToken as Mock).mockResolvedValue(null);

      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });

    it('returns false if an error occurs', async () => {
      (getToken as Mock).mockRejectedValue(new Error('Auth error'));

      const result = await isPushNotificationSubscribed();
      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    it('listens for foreground messages and calls callback with mapped payload', () => {
      (getMessaging as Mock).mockReturnValue('mock-messaging');

      let messageHandler: (payload: any) => void;
      (onMessage as Mock).mockImplementation((messaging, handler) => {
        messageHandler = handler;
        return 'unsubscribe-function';
      });

      const callback = vi.fn();
      const unsubscribe = onForegroundMessage(callback);

      expect(getMessaging).toHaveBeenCalled();
      expect(onMessage).toHaveBeenCalledWith('mock-messaging', expect.any(Function));
      expect(unsubscribe).toBe('unsubscribe-function');

      // Trigger the handler with a mock payload
      messageHandler!({
        notification: {
          title: 'New Invoice',
          body: 'You received a new invoice.'
        }
      });

      expect(callback).toHaveBeenCalledWith({
        title: 'New Invoice',
        body: 'You received a new invoice.'
      });
    });

    it('handles empty notification payload gracefully', () => {
      let messageHandler: (payload: any) => void;
      (onMessage as Mock).mockImplementation((messaging, handler) => {
        messageHandler = handler;
        return 'unsubscribe-function';
      });

      const callback = vi.fn();
      onForegroundMessage(callback);

      // Trigger with missing title/body
      messageHandler!({
        notification: {}
      });

      expect(callback).toHaveBeenCalledWith({
        title: '',
        body: ''
      });
    });
  });

  describe('sendLocalNotification', () => {
    it('creates a Notification if permission is granted', () => {
      const mockNotificationClass = vi.fn();
      vi.stubGlobal('Notification', mockNotificationClass);
      // @ts-ignore
      window.Notification = mockNotificationClass;
      // @ts-ignore
      window.Notification.permission = 'granted';

      sendLocalNotification('Test Title', 'Test Body', '/custom-icon.png');
      expect(mockNotificationClass).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/custom-icon.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      });
    });

    it('uses default icon if not provided', () => {
      const mockNotificationClass = vi.fn();
      vi.stubGlobal('Notification', mockNotificationClass);
      // @ts-ignore
      window.Notification = mockNotificationClass;
      // @ts-ignore
      window.Notification.permission = 'granted';

      sendLocalNotification('Test Title', 'Test Body');
      expect(mockNotificationClass).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      });
    });

    it('does not create a Notification if permission is not granted', () => {
      const mockNotificationClass = vi.fn();
      vi.stubGlobal('Notification', mockNotificationClass);
      // @ts-ignore
      window.Notification = mockNotificationClass;
      // @ts-ignore
      window.Notification.permission = 'denied';

      sendLocalNotification('Test Title', 'Test Body');
      expect(mockNotificationClass).not.toHaveBeenCalled();
    });
  });
});
