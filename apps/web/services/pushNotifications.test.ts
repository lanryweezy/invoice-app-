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

    const MockNotification = vi.fn() as any;
    MockNotification.permission = 'granted';
    MockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

    global.Notification = MockNotification;
    window.Notification = MockNotification;
  });

  afterEach(() => {
    global.Notification = originalGlobalNotification;
    window.Notification = originalWindowNotification;
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('requestNotificationPermission', () => {
    it('returns denied when Notification is not supported', async () => {
      // Arrange
      // @ts-ignore
      delete window.Notification;
      // @ts-ignore
      delete global.Notification;

      // Act
      const result = await requestNotificationPermission();

      // Assert
      expect(result).toBe('denied');
    });

    it('returns granted when permission is requested successfully', async () => {
      // Arrange
      // Notification is set to granted in beforeEach

      // Act
      const result = await requestNotificationPermission();

      // Assert
      expect(result).toBe('granted');
    });
  });

  describe('subscribeToPushNotifications', () => {
    beforeEach(() => {
      vi.mocked(getMessaging).mockReturnValue({} as any);
      vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'test-vapid-key');
    });

    it('returns false when notification permission is denied', async () => {
      // Arrange
      (window.Notification as any).requestPermission.mockResolvedValue('denied');

      // Act
      const result = await subscribeToPushNotifications('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when FCM token generation returns null', async () => {
      // Arrange
      vi.mocked(getToken).mockResolvedValue(null as any);

      // Act
      const result = await subscribeToPushNotifications('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('saves the token to Firestore and returns true when subscription is successful', async () => {
      // Arrange
      vi.mocked(getToken).mockResolvedValue('mock-fcm-token');
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act
      const result = await subscribeToPushNotifications('user-123');

      // Assert
      expect(result).toBe(true);
      expect(getToken).toHaveBeenCalledWith({}, { vapidKey: 'test-vapid-key' });
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
        token: 'mock-fcm-token',
        userAgent: navigator.userAgent
      }));
    });

    it('returns false when an unexpected error occurs during subscription', async () => {
      // Arrange
      vi.mocked(getToken).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await subscribeToPushNotifications('user-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    beforeEach(() => {
      vi.mocked(doc).mockReturnValue('mock-doc-ref' as any);
    });

    it('deletes the FCM token document when it exists in Firestore', async () => {
      // Arrange
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      // Act
      const result = await unsubscribeFromPushNotifications('user-123');

      // Assert
      expect(result).toBe(true);
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('returns true without calling deleteDoc when the token document does not exist', async () => {
      // Arrange
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      // Act
      const result = await unsubscribeFromPushNotifications('user-123');

      // Assert
      expect(result).toBe(true);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('returns false when an unexpected error occurs during unsubscription', async () => {
      // Arrange
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      // Act
      const result = await unsubscribeFromPushNotifications('user-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isPushNotificationSubscribed', () => {
    beforeEach(() => {
      vi.mocked(getMessaging).mockReturnValue({} as any);
    });

    it('returns true when a valid FCM token is retrieved', async () => {
      // Arrange
      vi.mocked(getToken).mockResolvedValue('existing-token');

      // Act
      const result = await isPushNotificationSubscribed();

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the retrieved token is null', async () => {
      // Arrange
      vi.mocked(getToken).mockResolvedValue(null as any);

      // Act
      const result = await isPushNotificationSubscribed();

      // Assert
      expect(result).toBe(false);
    });

    it('returns false when an unexpected error occurs during token retrieval', async () => {
      // Arrange
      vi.mocked(getToken).mockRejectedValue(new Error('Permission denied'));

      // Act
      const result = await isPushNotificationSubscribed();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    beforeEach(() => {
      vi.mocked(getMessaging).mockReturnValue({} as any);
    });

    it('invokes the provided callback with the correct payload when a complete message is received', () => {
      // Arrange
      const mockCallback = vi.fn();
      let capturedOnMessageCallback: any;
      vi.mocked(onMessage).mockImplementation((_messaging, cb) => {
        capturedOnMessageCallback = cb;
        return vi.fn();
      });

      // Act
      onForegroundMessage(mockCallback);
      capturedOnMessageCallback({
        notification: {
          title: 'New Invoice',
          body: 'You received $500',
        }
      });

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        title: 'New Invoice',
        body: 'You received $500',
      });
    });

    it('invokes the provided callback with empty strings when the notification payload is missing title and body', () => {
      // Arrange
      const mockCallback = vi.fn();
      let capturedOnMessageCallback: any;
      vi.mocked(onMessage).mockImplementation((_messaging, cb) => {
        capturedOnMessageCallback = cb;
        return vi.fn();
      });

      // Act
      onForegroundMessage(mockCallback);
      capturedOnMessageCallback({});

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        title: '',
        body: '',
      });
    });
  });

  describe('sendLocalNotification', () => {
    it('creates a Notification instance when permission is granted', () => {
      // Arrange
      // Permission is already 'granted' in beforeEach

      // Act
      sendLocalNotification('Test Title', 'Test Body', '/custom-icon.png');

      // Assert
      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/custom-icon.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      });
    });

    it('uses the default icon when no custom icon is provided', () => {
      // Arrange
      // Permission is already 'granted' in beforeEach

      // Act
      sendLocalNotification('Test Title', 'Test Body');

      // Assert
      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
      });
    });

    it('does not create a Notification instance when permission is denied', () => {
      // Arrange
      (global.Notification as any).permission = 'denied';

      // Act
      sendLocalNotification('Test Title', 'Test Body');

      // Assert
      expect(global.Notification).not.toHaveBeenCalled();
    });
  });
});
