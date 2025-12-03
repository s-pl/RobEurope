import { getPublicKey, saveSubscription, removeSubscription, sendPushToUser } from '../utils/push.js';

export const getVapidPublicKey = async (req, res) => {
  res.json({ publicKey: getPublicKey() });
};

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

export const sendTestPush = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = {
      title: '🔔 Test push',
      body: 'Esto es una notificación push de prueba',
      data: { ts: Date.now() }
    };
    const result = await sendPushToUser(userId, payload);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
