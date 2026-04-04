import express from 'express';
import { handleAiAction } from '../../controller/ai.controller.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ active: !!process.env.OPENROUTER_API_KEY });
});

router.post('/action', handleAiAction);

export default router;
