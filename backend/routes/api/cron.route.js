import express from 'express';
import { sendCompetitionReminders } from '../../utils/scheduler.js';

const router = express.Router();

/**
 * GET /api/cron/reminders
 *
 * Triggered by Vercel Cron (every hour, see vercel.json).
 * Secured by CRON_SECRET to prevent unauthorized invocations.
 *
 * Vercel sets the `Authorization: Bearer <CRON_SECRET>` header automatically.
 */
router.get('/reminders', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    await sendCompetitionReminders();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
