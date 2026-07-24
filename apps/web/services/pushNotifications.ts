// Push Notification Service for InvoiceApp
// Handles subscription, permission, and sending notifications

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = 'BAUEx1mLeML6y9WXuzC3roP8-vt8WBiuXZ3oZiXauGdQil_FIcohJh7nIXh9R66hEy90wDgat2Yd-1YVMEOAQPU';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }
  return await Notification.requestPermission();
}

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Save subscription to Firestore
    const subRef = doc(db, 'users', userId, 'pushSubscriptions', 'current');
    await setDoc(subRef, {
      subscription: JSON.parse(JSON.stringify(subscription)),
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    const subRef = doc(db, 'users', userId, 'pushSubscriptions', 'current');
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(subRef);
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

export async function isPushNotificationSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// Send local notification (for offline reminders)
export function sendLocalNotification(title: string, body: string, icon?: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
    });
  }
}
