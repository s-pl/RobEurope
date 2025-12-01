import db from '../models/index.js';
import { getIO } from '../utils/realtime.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

const { TeamMessage, TeamMembers, User, Notification } = db;

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
            }, {
                model: db.TeamMessageReaction,
                as: 'Reactions',
                include: [{
                    model: User,
                    attributes: ['id', 'first_name', 'last_name']
                }]
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

        let type = 'text';
        let fileUrl = null;
        let attachments = [];

        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                url: `/uploads/${file.filename}`,
                name: file.originalname,
                type: file.mimetype.startsWith('image/') ? 'image' : 'file',
                mimetype: file.mimetype
            }));
            type = attachments[0].type; // Main type based on first file
            fileUrl = attachments[0].url; // Backward compatibility
        } else {
            const fileInfo = getFileInfo(req);
            if (fileInfo && fileInfo.url) {
                fileUrl = fileInfo.url;
                type = fileInfo.mimetype.startsWith('image/') ? 'image' : 'file';
                attachments.push({
                    url: fileUrl,
                    name: fileInfo.originalname,
                    type: type,
                    mimetype: fileInfo.mimetype
                });
            }
        }

        if (!content && attachments.length === 0) {
            return res.status(400).json({ error: 'Message content or file required' });
        }

        const message = await TeamMessage.create({
            team_id: teamId,
            user_id: userId,
            content,
            type,
            file_url: fileUrl,
            attachments
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

        // Create notifications for other members
        const members = await TeamMembers.findAll({
            where: { team_id: teamId, left_at: null }
        });

        const notifications = members
            .filter(m => m.user_id !== userId)
            .map(m => ({
                user_id: m.user_id,
                type: 'team_message',
                title: 'Nuevo mensaje de equipo',
                message: `${req.user.first_name}: ${type === 'text' ? (content.substring(0, 30) + (content.length > 30 ? '...' : '')) : 'Archivo adjunto'}`,
                data: { team_id: teamId, message_id: message.id }
            }));

        if (notifications.length > 0) {
            await Notification.bulkCreate(notifications);
            // Emit notifications
            notifications.forEach(n => {
                if (io) io.emit(`notification:${n.user_id}`, n);
            });
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { teamId, messageId } = req.params;
        const { emoji } = req.body;
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

        const reaction = await db.TeamMessageReaction.create({
            message_id: messageId,
            user_id: userId,
            emoji
        });

        // Emit socket event
        const io = getIO();
        if (io) {
            io.to(`team_${teamId}`).emit('message_reaction_added', {
                messageId: Number(messageId),
                reaction: {
                    ...reaction.toJSON(),
                    User: {
                        id: req.user.id,
                        first_name: req.user.first_name,
                        last_name: req.user.last_name
                    }
                }
            });
        }

        res.status(201).json(reaction);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(400).json({ error: 'Reaction already exists' });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const removeReaction = async (req, res) => {
    try {
        const { teamId, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const deleted = await db.TeamMessageReaction.destroy({
            where: {
                message_id: messageId,
                user_id: userId,
                emoji
            }
        });

        if (deleted) {
             const io = getIO();
            if (io) {
                io.to(`team_${teamId}`).emit('message_reaction_removed', {
                    messageId: Number(messageId),
                    userId,
                    emoji
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
