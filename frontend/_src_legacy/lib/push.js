/**
 * @fileoverview Browser Push Notification helpers.
 *
 * Registers the service worker and manages Web Push subscriptions.
 * Uses the backend notification push endpoints under `/api/notifications/push/*`.
 */

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

/**
 * Subscribe the current browser to push notifications.
 *
 * Preconditions:
 * - a valid ServiceWorker registration
 * - secure context (HTTPS) unless localhost
 * - Notifications permission granted
 *
 * @param {ServiceWorkerRegistration} registration
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(registration) {
  if (!registration || !('pushManager' in registration)) return null;
  // Must be secure context unless localhost
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (!window.isSecureContext && !isLocalhost) {
    console.warn('Push disabled: insecure context. Use HTTPS');
    return null;
  }
  // Require notifications permission
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    console.warn('Push subscribe skipped: Notification permission not granted');
    return null;
  }
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
    if (e?.name === 'AbortError') {
      console.error('Push subscribe failed (AbortError): likely invalid VAPID key or browser push service error. Check backend VAPID keys and HTTPS.', e);
    } else if (e?.name === 'NotAllowedError') {
      console.warn('Push subscribe not allowed by the browser (permission).');
    } else {
      console.error('Push subscribe failed', e);
    }
    return null;
  }
}

/**
 * Unsubscribe the current browser from push notifications.
 *
 * @param {ServiceWorkerRegistration} registration
 * @returns {Promise<void>}
 */
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
