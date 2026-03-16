/**
 * @fileoverview AI chat endpoint powered by OpenRouter SDK.
 * POST /api/ai/chat — streams AI response via SSE, saves message to DB,
 * and emits to other conversation participants via Socket.IO.
 */

import { OpenRouter } from '@openrouter/sdk';
import db from '../models/index.js';
import { emitToUser } from '../utils/realtime.js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded even when this module is imported before env.js runs
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

// ── Shared SSE streaming helper ──────────────────────────────────────────────
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

// ── General AI action (no conversation context) ───────────────────────────────
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

export async function handleAiChat(req, res) {
  const userId = req.user.id;
  const { conversationId, prompt } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI service not configured. Set OPENROUTER_API_KEY.' });
  }

  // Verify user is a participant
  const participant = await db.ConversationParticipant.findOne({
    where: { conversation_id: conversationId, user_id: userId, left_at: null },
  });
  if (!participant) {
    return res.status(403).json({ error: 'Not a participant of this conversation' });
  }

  // Get all participants for broadcasting
  const allParticipants = await db.ConversationParticipant.findAll({
    where: { conversation_id: conversationId, left_at: null },
    attributes: ['user_id'],
  });

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let fullContent = '';

  try {
    fullContent = await streamOpenRouter(res, [{ role: 'user', content: prompt.trim() }]);
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
    return;
  }

  // Save AI message to DB after streaming completes
  if (!fullContent) return;

  try {
    const aiMessage = await db.DirectMessage.create({
      conversation_id: conversationId,
      sender_id: null,
      content: fullContent,
      type: 'ai',
    });

    await db.Conversation.update(
      { last_message_at: new Date() },
      { where: { id: conversationId } }
    );

    const fullMessage = await db.DirectMessage.findByPk(aiMessage.id, {
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_photo_url'],
        },
      ],
    });

    // Emit to all OTHER participants
    for (const p of allParticipants) {
      if (String(p.user_id) !== String(userId)) {
        emitToUser(p.user_id, 'dm_message', {
          conversation_id: conversationId,
          message: fullMessage.toJSON(),
        });
      }
    }
  } catch {
    // Non-fatal: streaming already completed
  }
}
