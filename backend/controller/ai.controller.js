/**
 * @fileoverview AI action endpoint powered by OpenRouter SDK.
 * POST /api/ai/action — streams AI response via SSE.
 *
 * Note: The handleAiChat endpoint was removed when the Conversations/DirectMessages
 * tables were dropped (migration 20260327-drop-conversations-tables.js).
 */

import { OpenRouter } from '@openrouter/sdk';
import { emitToUser } from '../utils/realtime.js';

async function streamOpenRouter(res, messages) {
  const openrouter = new OpenRouter({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const stream = await openrouter.chat.send({
    chatGenerationParams: {
      model: 'openrouter/free',
      messages,
      stream: true,
    },
  });

  let fullContent = '';
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
  return fullContent;
}

export async function handleAiAction(req, res) {
  const { prompt, systemPrompt } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service not configured. Set OPENROUTER_API_KEY.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const messages = [];
  if (systemPrompt?.trim()) messages.push({ role: 'system', content: systemPrompt.trim() });
  messages.push({ role: 'user', content: prompt.trim() });

  try {
    await streamOpenRouter(res, messages);
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}
