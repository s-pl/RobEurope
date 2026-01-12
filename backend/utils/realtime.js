/**
 * @fileoverview
 * Realtime utilities for emitting Socket.IO events and mirroring select events as Web Push.
 */

/**
 * @typedef {Object} PushPayload
 * @property {string} [title]
 * @property {string} [message]
 * @property {Object} [meta]
 * @property {string} [meta.url] Optional URL to open on click (if supported by the client).
 * @property {Object} [data] Legacy payload container.
 * @property {string} [data.url] Legacy URL field.
 */

// Simple realtime helper to access Socket.IO instance across modules
let ioInstance = null;
import { sendPushToUser } from './push.js';

/**
 * Sets the global Socket.IO server instance.
 * @param {object} io Socket.IO server.
 */
export function setIO(io) {
  ioInstance = io;
}

/**
 * Returns the current Socket.IO server instance.
 * @returns {object|null}
 */
export function getIO() {
  return ioInstance;
}

// Convenience: emit an event to a specific user's channel
// Frontend listens to `notification:${userId}`
/**
 * Emits a realtime event to a specific user channel.
 *
 * Client convention: listeners subscribe to events in the form `${eventName}:${userId}`.
 *
 * Additionally, when `eventName === 'notification'`, this mirrors the event as a push
 * notification (best-effort).
 *
 * @param {string} userId Recipient user id.
 * @param {string} eventName Base event name.
 * @param {PushPayload} payload Event payload.
 */
export function emitToUser(userId, eventName, payload) {
  if (!ioInstance) return;
  // We emit on an event name scoped by user, as the client listens directly
  // e.g., eventName = 'notification'
  ioInstance.emit(`${eventName}:${userId}`, payload);

  // Also mirror as a push notification when applicable
  if (eventName === 'notification' && userId) {
    const title = payload?.title || 'Nueva notificación';
    const body = payload?.message || '';
    const url = payload?.meta?.url || payload?.data?.url;
    // Fire-and-forget
    sendPushToUser(userId, { title, body, data: { url } }).catch(() => {});
  }
}
