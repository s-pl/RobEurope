import { apiRequest } from '../lib/apiClient';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.error('SW register failed', e);
    return null;
  }
}

export async function subscribeToPush(registration) {
  if (!registration || !('pushManager' in registration)) return null;
  try {
  const { publicKey } = await apiRequest('/notifications/push/vapidPublicKey');
    if (!publicKey) {
      console.warn('VAPID public key not available');
      return null;
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    // Send subscription to backend
  await apiRequest('/notifications/push/subscribe', { method: 'POST', body: subscription });
    return subscription;
  } catch (e) {
    console.error('Push subscribe failed', e);
    return null;
  }
}

export async function unsubscribeFromPush(registration) {
  try {
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
  await apiRequest('/notifications/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
  } catch (e) {
    console.error('Unsubscribe failed', e);
  }
}
