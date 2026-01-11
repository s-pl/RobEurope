/**
 * @fileoverview Web Push subscription and test endpoints.
 *
 * Exposes the VAPID public key and authenticated endpoints to subscribe/unsubscribe
 * push subscriptions, plus a test-send helper.
 */

import { getPublicKey, saveSubscription, removeSubscription, sendPushToUser } from '../utils/push.js';

/**
 * Express request.
 * @typedef {object} Request
 * @property {object} [user]
 * @property {number} [user.id]
 * @property {object} body
 */

/**
 * Express response.
 * @typedef {object} Response
 * @property {(status:number)=>Response} status
 * @property {(body:any)=>void} json
 */

/**
 * Get the VAPID public key used by the browser to subscribe.
 *
 * @route GET /api/push/vapidPublicKey
 * @param {Request} req
 * @param {Response} res
 */
export const getVapidPublicKey = async (req, res) => {
  res.json({ publicKey: getPublicKey() });
};

/**
 * Save a push subscription for the authenticated user.
 *
 * @route POST /api/push/subscribe
 * @param {Request} req
 * @param {Response} res
 */
export const subscribePush = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const subscription = req.body;
    await saveSubscription(userId, subscription);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Remove a push subscription for the authenticated user.
 *
 * @route POST /api/push/unsubscribe
 * @param {Request} req
 * @param {Response} res
 */
export const unsubscribePush = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    await removeSubscription(userId, endpoint);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Send a test push notification to the authenticated user.
 *
 * @route POST /api/push/test
 * @param {Request} req
 * @param {Response} res
 */
export const sendTestPush = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = {
      title: 'Test push',
      body: 'Esto es una notificación push de prueba',
      data: { ts: Date.now() }
    };
    const result = await sendPushToUser(userId, payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
