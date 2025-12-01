import db from '../models/index.js';
import { getIO } from '../utils/realtime.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

const { CompetitionMessage, CompetitionMessageReaction, User, Notification } = db;

export const getMessages = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // For now, allow any authenticated user to view messages
        // In future, we might restrict to participants

        const messages = await CompetitionMessage.findAll({
            where: { competition_id: competitionId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'profile_photo_url']
                },
                {
                    model: CompetitionMessageReaction,
                    as: 'Reactions',
                    include: [{
                        model: User,
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset: Number(offset)
        });

        res.json(messages.reverse());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

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
            type = attachments[0].type;
            fileUrl = attachments[0].url;
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

        const message = await CompetitionMessage.create({
            competition_id: competitionId,
            user_id: userId,
            content,
            type,
            file_url: fileUrl,
            attachments
        });

        const fullMessage = await CompetitionMessage.findByPk(message.id, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'first_name', 'last_name', 'profile_photo_url']
                },
                {
                    model: CompetitionMessageReaction,
                    as: 'Reactions',
                    include: [{
                        model: User,
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                }
            ]
        });

        const io = getIO();
        if (io) {
            io.to(`competition_${competitionId}`).emit('competition_message', fullMessage);
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { competitionId, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const reaction = await CompetitionMessageReaction.create({
            message_id: messageId,
            user_id: userId,
            emoji
        });

        const io = getIO();
        if (io) {
            io.to(`competition_${competitionId}`).emit('competition_message_reaction_added', {
                messageId: Number(messageId),
                reaction: {
                    ...reaction.toJSON(),
                    user_id: userId
                }
            });
        }

        res.status(201).json(reaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const removeReaction = async (req, res) => {
    try {
        const { competitionId, messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        await CompetitionMessageReaction.destroy({
            where: {
                message_id: messageId,
                user_id: userId,
                emoji
            }
        });

        const io = getIO();
        if (io) {
            io.to(`competition_${competitionId}`).emit('competition_message_reaction_removed', {
                messageId: Number(messageId),
                userId,
                emoji
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
