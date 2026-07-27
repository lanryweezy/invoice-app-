import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendLocalNotification,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed,
  onForegroundMessage
} from './pushNotifications';

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

  beforeEach(() => {
    vi.clearAllMocks();
    originalNotification = global.Notification;
    global.Notification = vi.fn() as any;
    (global.Notification as any).permission = 'granted';
    (global.Notification as any).requestPermission = vi.fn().mockResolvedValue('granted');
  });

  afterEach(() => {
    global.Notification = originalNotification;
  });

  describe('requestNotificationPermission', () => {
    let consoleWarnSpy: any;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('returns denied and warns if Notification is not supported', async () => {
      delete (global as any).Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe('denied');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Notifications not supported');
    });

    it('requests permission if Notification is supported', async () => {
      const result = await requestNotificationPermission();

      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });
  });

  describe('subscribeToPushNotifications', () => {
    let doc: any, setDoc: any, getToken: any, getMessaging: any;
    let consoleErrorSpy: any;

    beforeEach(async () => {
      const firestore = await import('firebase/firestore');
      const messaging = await import('firebase/messaging');
      doc = firestore.doc;
      setDoc = firestore.setDoc;
      getToken = messaging.getToken;
      getMessaging = messaging.getMessaging;
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('returns false if permission is not granted', async () => {
      (global.Notification as any).requestPermission = vi.fn().mockResolvedValue('denied');

      const result = await subscribeToPushNotifications('user123');

      expect(result).toBe(false);
      expect(getToken).not.toHaveBeenCalled();
    });

    it('returns false if token generation fails', async () => {
      getMessaging.mockReturnValue({});
      getToken.mockResolvedValue(null);

      const result = await subscribeToPushNotifications('user123');

      expect(result).toBe(false);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('returns false and logs error if an exception occurs', async () => {
      getMessaging.mockImplementation(() => { throw new Error('Messaging error'); });

      const result = await subscribeToPushNotifications('user123');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns true and saves token if subscription succeeds', async () => {
      const mockToken = 'mock-fcm-token';
      getMessaging.mockReturnValue({});
      getToken.mockResolvedValue(mockToken);
      doc.mockReturnValue('mock-doc-ref');

      const result = await subscribeToPushNotifications('user123');

      expect(result).toBe(true);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'user123', 'fcmTokens', 'current');
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
        token: mockToken,
        userAgent: navigator.userAgent
      }));
    });
  });

  describe('unsubscribeFromPushNotifications', () => {
    let doc: any, getDoc: any, deleteDoc: any;
    let consoleErrorSpy: any;

    beforeEach(async () => {
      const firestore = await import('firebase/firestore');
      doc = firestore.doc;
      getDoc = firestore.getDoc;
      deleteDoc = firestore.deleteDoc;
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('returns false and logs error if an exception occurs', async () => {
      getDoc.mockImplementation(() => { throw new Error('Firestore error'); });

      const result = await unsubscribeFromPushNotifications('user123');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns true and deletes document if it exists', async () => {
      doc.mockReturnValue('mock-doc-ref');
      getDoc.mockResolvedValue({ exists: () => true });

      const result = await unsubscribeFromPushNotifications('user123');

      expect(result).toBe(true);
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });

    it('returns true and does not delete document if it does not exist', async () => {
      doc.mockReturnValue('mock-doc-ref');
      getDoc.mockResolvedValue({ exists: () => false });

      const result = await unsubscribeFromPushNotifications('user123');

      expect(result).toBe(true);
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(deleteDoc).not.toHaveBeenCalled();
    });
  });

  describe('isPushNotificationSubscribed', () => {
    let getToken: any, getMessaging: any;

    beforeEach(async () => {
      const messaging = await import('firebase/messaging');
      getToken = messaging.getToken;
      getMessaging = messaging.getMessaging;
    });

    it('returns true if a token exists', async () => {
      getMessaging.mockReturnValue({});
      getToken.mockResolvedValue('existing-token');

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(true);
    });

    it('returns false if no token exists', async () => {
      getMessaging.mockReturnValue({});
      getToken.mockResolvedValue(null);

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(false);
    });

    it('returns false if an error occurs', async () => {
      getMessaging.mockImplementation(() => { throw new Error('Messaging error'); });

      const result = await isPushNotificationSubscribed();

      expect(result).toBe(false);
    });
  });

  describe('onForegroundMessage', () => {
    let getMessaging: any, onMessage: any;

    beforeEach(async () => {
      const messaging = await import('firebase/messaging');
      getMessaging = messaging.getMessaging;
      onMessage = messaging.onMessage;
    });

    it('sets up message listener and maps payload correctly', () => {
      const mockCallback = vi.fn();
      getMessaging.mockReturnValue({});

      // We will capture the callback passed to onMessage to test it manually
      let capturedOnMessageCallback: any;
      onMessage.mockImplementation((_, callback) => {
        capturedOnMessageCallback = callback;
        return 'mock-unsubscribe-fn';
      });

      const unsubscribe = onForegroundMessage(mockCallback);

      expect(unsubscribe).toBe('mock-unsubscribe-fn');
      expect(onMessage).toHaveBeenCalled();

      // Test the captured callback mapping
      const mockPayload = {
        notification: { title: 'Test Title', body: 'Test Body' }
      };
      capturedOnMessageCallback(mockPayload);

      expect(mockCallback).toHaveBeenCalledWith({
        title: 'Test Title',
        body: 'Test Body'
      });
    });

    it('maps payload with missing title and body to empty strings', () => {
      const mockCallback = vi.fn();
      getMessaging.mockReturnValue({});

      let capturedOnMessageCallback: any;
      onMessage.mockImplementation((_, callback) => {
        capturedOnMessageCallback = callback;
      });

      onForegroundMessage(mockCallback);

      // Test the captured callback mapping with no notification object
      capturedOnMessageCallback({});

      expect(mockCallback).toHaveBeenCalledWith({
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
