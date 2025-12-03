import webpush from 'web-push';
import redisClient from './redis.js';

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
const subsKeyForUser = (userId) => `push:subs:${userId}`;
const subsIndexKey = 'push:subs:index'; // endpoint -> userId mapping to simplify cleanup

export function getPublicKey() {
  return VAPID_PUBLIC_KEY || '';
}

export async function saveSubscription(userId, subscription) {
  if (!userId || !subscription?.endpoint) throw new Error('Invalid subscription payload');
  const key = subsKeyForUser(userId);
  const subStr = JSON.stringify(subscription);
  // Use a Redis Set to avoid duplicates
  await redisClient.sAdd(key, subStr);
  await redisClient.hSet(subsIndexKey, subscription.endpoint, String(userId));
}

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

export async function listSubscriptions(userId) {
  const key = subsKeyForUser(userId);
  const members = await redisClient.sMembers(key);
  return members.map(m => { try { return JSON.parse(m); } catch { return null; } }).filter(Boolean);
}

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
