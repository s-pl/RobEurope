import express from 'express';
import { handleAiChat, handleAiAction } from '../../controller/ai.controller.js';

const router = express.Router();

// Public — no auth needed, just checks if AI is configured
router.get('/status', (req, res) => {
  res.json({ active: !!process.env.OPENROUTER_API_KEY });
});

router.post('/chat', handleAiChat);
router.post('/action', handleAiAction);

export default router;
