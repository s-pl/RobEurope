// Simple Web Notifications helper
export function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

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
