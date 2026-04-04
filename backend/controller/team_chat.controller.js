/**
 * @fileoverview Team chat endpoints (messages + attachments).
 */

import prisma from '../lib/prisma.js';
import { getIO } from '../utils/realtime.js';

/**
 * Get message history for a team.
 *
 * @route GET /api/teams/:teamId/messages
 */
export const getMessages = async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const { limit = 50, offset = 0 } = req.query;

    const isMember = await prisma.teamMember.findFirst({
      where: { team_id: teamId, user_id: req.user.id, left_at: null }
    });

    console.log(`Checking membership for user ${req.user.id} in team ${teamId}: ${!!isMember}`);

    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const messages = await prisma.teamMessage.findMany({
      where: { team_id: teamId },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, profile_photo_url: true } }
      },
      orderBy: { created_at: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send a message to a team.
 *
 * @route POST /api/teams/:teamId/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);
    const { content } = req.body;
    const userId = req.user.id;

    const isMember = await prisma.teamMember.findFirst({
      where: { team_id: teamId, user_id: userId, left_at: null }
    });

    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    const message = await prisma.teamMessage.create({
      data: {
        team_id: teamId,
        user_id: userId,
        content: content.trim(),
        type: 'text',
        file_url: null,
        attachments: [],
      }
    });

    const fullMessage = await prisma.teamMessage.findUnique({
      where: { id: message.id },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, profile_photo_url: true } }
      }
    });

    const io = getIO();
    if (io) {
      io.to(`team_${teamId}`).emit('team_message', fullMessage);
    }

    // Notify other members (fire-and-forget)
    const members = await prisma.teamMember.findMany({ where: { team_id: teamId, left_at: null } });

    const notificationPayloads = members
      .filter(m => m.user_id !== userId)
      .map(m => ({
        user_id: m.user_id,
        type: 'team_message',
        title: 'Nuevo mensaje de equipo',
        message: `${req.user.first_name}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
        meta: { team_id: teamId, message_id: message.id }
      }));

    if (notificationPayloads.length > 0) {
      prisma.notification.createMany({ data: notificationPayloads }).then(() => {
        // Individual emit for each notification is not needed for createMany
        // but if needed, can query and emit
      }).catch((err) => console.error('Failed to create notifications', err));
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
