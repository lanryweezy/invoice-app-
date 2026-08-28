import { getErrorMessage } from '../utils/error';
// Push Notification Service for InvoiceApp
// Uses Firebase Cloud Messaging (FCM) — no VAPID keys needed

import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { trackEvent } from '../utils/analytics';
import { getErrorMessage as getErrorMsg } from '../utils/error';

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }
  return await Notification.requestPermission();
}

// Subscribe to push notifications via FCM
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    });

    if (!token) return false;

    // Save FCM token to Firestore
    const tokenRef = doc(db, 'users', userId, 'fcmTokens', 'current');
    await setDoc(tokenRef, {
      token,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications', { event: 'push.subscribe.failed', userId, error: getErrorMsg(error) });
    try { trackEvent('push_notification_subscribe_failed', { user_id: userId, error: getErrorMsg(error) }); } catch {}
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const tokenRef = doc(db, 'users', userId, 'fcmTokens', 'current');
    const snap = await getDoc(tokenRef);
    if (snap.exists()) {
      await deleteDoc(tokenRef);
    }
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications', { event: 'push.unsubscribe.failed', userId, error: getErrorMsg(error) });
    try { trackEvent('push_notification_unsubscribe_failed', { user_id: userId, error: getErrorMsg(error) }); } catch {}
    return false;
  }
}

// Check if user is subscribed
export async function isPushNotificationSubscribed(): Promise<boolean> {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    return !!token;
  } catch {
    return false;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: { title: string; body: string }) => void) {
  const messaging = getMessaging();
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title || '',
      body: payload.notification?.body || '',
    });
  });
}

// Send local notification (for offline reminders)
export function sendLocalNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      // // // vibrate: [200, 100, 200],
    });
  }
}


