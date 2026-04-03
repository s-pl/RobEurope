import { sendPushToUser } from './push.js';

/**
 * @fileoverview
 * Realtime event emission.
 *
 * Socket.IO has been removed in favour of Supabase Realtime:
 * - The frontend subscribes to Postgres Changes on the `Notification` table.
 * - Ephemeral events (typing indicators, presence) use Supabase Broadcast channels directly
 *   from client to client — no backend involvement required.
 *
 * This module keeps the `emitToUser` interface so callers (scheduler, controllers) need
 * no changes. The only side-effect retained is the Web Push mirror for mobile/PWA users.
 */

/**
 * Emits a logical event to a user.
 *
 * In the Supabase Realtime architecture the frontend picks up DB-backed events
 * (notifications, messages) via Postgres Changes subscriptions, so the Socket.IO
 * emit is no longer needed. Web Push is still fired as a best-effort fallback.
 *
 * @param {string|number} userId Recipient user id.
 * @param {string} eventName Logical event name (e.g. 'notification').
 * @param {object} payload Event payload.
 */
export function emitToUser(userId, eventName, payload) {
  if (eventName === 'notification' && userId) {
    const title = payload?.title || 'Nueva notificación';
    const body = payload?.message || '';
    const url = payload?.meta?.url || payload?.data?.url;
    sendPushToUser(userId, { title, body, data: { url } }).catch(() => {});
  }
}

// Legacy exports kept for any caller that still imports these
export function setIO() {}
export function getIO() { return null; }
