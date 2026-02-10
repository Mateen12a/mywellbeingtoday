import api from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Push] Service worker registered');
    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push] Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Push] Notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    const response = await api.getVapidPublicKey();
    const vapidPublicKey = response.data?.publicKey;
    
    if (!vapidPublicKey) {
      console.log('[Push] VAPID public key not available');
      return false;
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await api.subscribeToPush(existingSubscription);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    await api.subscribeToPush(subscription);
    console.log('[Push] Push subscription created');
    return true;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await api.unsubscribeFromPush(subscription.endpoint);
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed from push notifications');
    }
    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermissionStatus(): string {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
