import webpush from 'web-push';
import redisClient from './redis.js';

/**
 * @fileoverview
 * Web Push notification utilities using VAPID protocol.
 * Manages push subscriptions stored in Redis and sends notifications.
 * @module utils/push
 */

/**
 * @typedef {Object} PushSubscription
 * @property {string} endpoint - The push service endpoint URL.
 * @property {Object} keys - The subscription keys.
 * @property {string} keys.p256dh - The P-256 ECDH public key.
 * @property {string} keys.auth - The authentication secret.
 */

/**
 * @typedef {Object} PushPayload
 * @property {string} title - Notification title.
 * @property {string} body - Notification body text.
 * @property {Object} [data] - Additional data for the notification.
 * @property {string} [data.url] - URL to open when notification is clicked.
 */

/**
 * @typedef {Object} PushResult
 * @property {boolean} ok - Whether the operation succeeded.
 * @property {string} [error] - Error message if failed.
 * @property {number} [count] - Number of notifications processed.
 * @property {Array<Object>} [results] - Individual results per subscription.
 */

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const PUSH_DISABLED = !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY;

if (PUSH_DISABLED) {
  console.warn('[push] VAPID keys not set. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env. Push sending will be disabled.');
} else {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    console.error('[push] Invalid VAPID keys in env. Push sending disabled.', e?.message || e);
  }
}

// Key helpers
/**
 * Generates Redis key for user's push subscriptions.
 * @private
 * @param {string} userId - The user ID.
 * @returns {string} Redis key string.
 */
const subsKeyForUser = (userId) => `push:subs:${userId}`;

/**
 * Redis hash key for endpoint-to-user mapping.
 * @private
 * @constant {string}
 */
const subsIndexKey = 'push:subs:index'; // endpoint -> userId mapping to simplify cleanup

/**
 * Returns the public VAPID key for client subscription.
 * @returns {string} The VAPID public key or empty string if not configured.
 */
export function getPublicKey() {
  return VAPID_PUBLIC_KEY || '';
}

/**
 * Saves a push subscription for a user.
 * Stores in Redis Set to avoid duplicates.
 * @async
 * @param {string} userId - The user ID to associate with the subscription.
 * @param {PushSubscription} subscription - The push subscription object.
 * @throws {Error} If userId or subscription is invalid.
 * @returns {Promise<void>}
 */
export async function saveSubscription(userId, subscription) {
  if (!userId || !subscription?.endpoint) throw new Error('Invalid subscription payload');
  const key = subsKeyForUser(userId);
  const subStr = JSON.stringify(subscription);
  // Use a Redis Set to avoid duplicates
  await redisClient.sAdd(key, subStr);
  await redisClient.hSet(subsIndexKey, subscription.endpoint, String(userId));
}

/**
 * Removes a push subscription for a user.
 * @async
 * @param {string} userId - The user ID.
 * @param {string} endpoint - The push service endpoint URL to remove.
 * @throws {Error} If userId or endpoint is invalid.
 * @returns {Promise<void>}
 */
export async function removeSubscription(userId, endpoint) {
  if (!userId || !endpoint) throw new Error('Invalid unsubscribe payload');
  const key = subsKeyForUser(userId);
  const members = await redisClient.sMembers(key);
  const toRemove = members.find(m => {
    try { const j = JSON.parse(m); return j.endpoint === endpoint; } catch { return false; }
  });
  if (toRemove) {
    await redisClient.sRem(key, toRemove);
  }
  await redisClient.hDel(subsIndexKey, endpoint);
}

/**
 * Lists all push subscriptions for a user.
 * @async
 * @param {string} userId - The user ID.
 * @returns {Promise<Array<PushSubscription>>} Array of subscription objects.
 */
export async function listSubscriptions(userId) {
  const key = subsKeyForUser(userId);
  const members = await redisClient.sMembers(key);
  return members.map(m => { try { return JSON.parse(m); } catch { return null; } }).filter(Boolean);
}

/**
 * Sends a push notification to all subscriptions for a user.
 * Automatically cleans up expired or invalid subscriptions.
 * @async
 * @param {string} userId - The target user ID.
 * @param {PushPayload} payload - The notification payload.
 * @returns {Promise<PushResult>} Result object with delivery status.
 */
export async function sendPushToUser(userId, payload) {
  if (PUSH_DISABLED) return { ok: false, error: 'VAPID keys missing' };
  const subs = await listSubscriptions(userId);
  const results = [];
  for (const sub of subs) {
    try {
      const res = await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ endpoint: sub.endpoint, status: 'sent' });
    } catch (err) {
      // Clean up gone subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removeSubscription(userId, sub.endpoint);
        results.push({ endpoint: sub.endpoint, status: 'removed' });
      } else {
        results.push({ endpoint: sub.endpoint, status: 'error', error: err.message });
      }
    }
  }
  return { ok: true, count: results.length, results };
}
