/**
 * @fileoverview Web Notifications helper.
 *
 * Provides small wrappers for checking browser support, requesting permission,
 * and showing notifications.
 */

// Simple Web Notifications helper
/**
 * Whether the current runtime supports the Web Notifications API.
 * @returns {boolean}
 */
export function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notifications permission.
 * @returns {Promise<string>} Permission value.
 */
export async function requestNotificationPermission() {
  if (!canUseNotifications()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return Notification.permission;
  }
}

/**
 * Show a browser notification.
 * @param {string} title
 * @param {object} [options]
 * @returns {boolean}
 */
export function showNotification(title, options = {}) {
  if (!canUseNotifications()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
