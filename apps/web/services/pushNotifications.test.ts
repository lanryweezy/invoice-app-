import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendLocalNotification } from './pushNotifications';

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
