/**
 * @fileoverview Team chat endpoints (messages + attachments).
 *
 * Provides message history for a team and allows posting messages (text and/or
 * attachments). Messages are emitted via Socket.IO to the `team_<teamId>` room
 * and create notifications for other team members.
 */

import db from '../models/index.js';
import { getIO } from '../utils/realtime.js';

const { TeamMessage, TeamMembers, User, Notification } = db;

/**
 * Express request.
 * @typedef {object} Request
 * @property {object} params
 * @property {object} query
 * @property {object} body
 * @property {object} user
 * @property {number} user.id
 * @property {string} [user.role]
 * @property {string} [user.first_name]
 * @property {Array<any>} [files]
 */

/**
 * Express response.
 * @typedef {object} Response
 * @property {Function} status
 * @property {Function} json
 */

/**
 * Get message history for a team.
 *
 * Requires team membership (unless admin).
 *
 * @route GET /api/teams/:teamId/messages
 * @param {Request} req
 * @param {Response} res
 */
export const getMessages = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Check if user is member of the team
        const isMember = await TeamMembers.findOne({
            where: { 
                team_id: Number(teamId), 
                user_id: req.user.id, 
                left_at: null 
            }
        });

        console.log(`Checking membership for user ${req.user.id} in team ${teamId}: ${!!isMember}`);

        if (!isMember && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not a member of this team' });
        }

        const messages = await TeamMessage.findAll({
            where: { team_id: teamId },
            include: [{
                model: User,
                attributes: ['id', 'first_name', 'last_name', 'profile_photo_url']
            }],
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset: Number(offset)
        });

        res.json(messages.reverse()); // Return oldest first for chat history
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Send a message to a team.
 *
 * Accepts `content` and/or attachments. Attachments may be provided by the route
 * upload middleware as `req.files` (array). Creates notifications for other team
 * members and emits the message via Socket.IO.
 *
 * @route POST /api/teams/:teamId/messages
 * @param {Request} req
 * @param {Response} res
 */
export const sendMessage = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Check if user is member
        const isMember = await TeamMembers.findOne({
            where: { 
                team_id: Number(teamId), 
                user_id: userId, 
                left_at: null 
            }
        });

        if (!isMember && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not a member of this team' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        }

        const message = await TeamMessage.create({
            team_id: teamId,
            user_id: userId,
            content: content.trim(),
            type: 'text',
            file_url: null,
            attachments: [],
        });

        // Fetch full message with user info
        const fullMessage = await TeamMessage.findByPk(message.id, {
            include: [{
                model: User,
                attributes: ['id', 'first_name', 'last_name', 'profile_photo_url']
            }]
        });

        // Emit to socket room
        const io = getIO();
        if (io) {
            io.to(`team_${teamId}`).emit('team_message', fullMessage);
        }

        // Notify other members (fire-and-forget)
        const members = await TeamMembers.findAll({
            where: { team_id: teamId, left_at: null }
        });

        const notificationPayloads = members
            .filter(m => m.user_id !== userId)
            .map(m => ({
                user_id: m.user_id,
                type: 'team_message',
                title: 'Nuevo mensaje de equipo',
                message: `${req.user.first_name}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
                data: { team_id: teamId, message_id: message.id }
            }));

        if (notificationPayloads.length > 0) {
            Notification.bulkCreate(notificationPayloads).then((created) => {
                const io = getIO();
                if (io) created.forEach((n) => io.emit(`notification:${n.user_id}`, n.toJSON()));
            }).catch((err) => console.error('Failed to create notifications', err));
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
