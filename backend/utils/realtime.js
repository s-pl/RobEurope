// Simple realtime helper to access Socket.IO instance across modules
let ioInstance = null;
import { sendPushToUser } from './push.js';

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}

// Convenience: emit an event to a specific user's channel
// Frontend listens to `notification:${userId}`
export function emitToUser(userId, eventName, payload) {
  if (!ioInstance) return;
  // We emit on an event name scoped by user, as the client listens directly
  // e.g., eventName = 'notification'
  ioInstance.emit(`${eventName}:${userId}`, payload);

  // Also mirror as a push notification when applicable
  if (eventName === 'notification' && userId) {
    const title = payload?.title || 'Nueva notificación';
    const body = payload?.message || '';
    // Fire-and-forget
    sendPushToUser(userId, { title, body, data: { url: payload?.data?.url } }).catch(() => {});
  }
}
