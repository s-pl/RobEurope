/**
 * @fileoverview Direct messaging / conversation endpoints.
 *
 * Supports 1-on-1 DMs, group chats, file sharing, read receipts,
 * and real-time delivery via Socket.IO.
 */

import { Op, fn, col, where } from 'sequelize';
import db from '../models/index.js';
import { getIO, emitToUser } from '../utils/realtime.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

const { Conversation, ConversationParticipant, DirectMessage, User } = db;

const USER_ATTRIBUTES = ['id', 'username', 'first_name', 'last_name', 'profile_photo_url'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the ConversationParticipant row for a user in a conversation,
 * or null if they are not an active participant.
 */
async function getActiveParticipant(conversationId, userId) {
    return ConversationParticipant.findOne({
        where: { conversation_id: conversationId, user_id: userId, left_at: null }
    });
}

/**
 * Returns all active participant records for a conversation.
 */
async function getActiveParticipants(conversationId) {
    return ConversationParticipant.findAll({
        where: { conversation_id: conversationId, left_at: null },
        include: [{ model: User, attributes: USER_ATTRIBUTES }]
    });
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * List all conversations for the authenticated user.
 *
 * @route GET /api/conversations?page=1&limit=20
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        // Find conversation IDs where user is active participant
        const participantRows = await ConversationParticipant.findAll({
            where: { user_id: userId, left_at: null },
            attributes: ['conversation_id', 'last_read_at']
        });

        const participantMap = {};
        participantRows.forEach(p => {
            participantMap[p.conversation_id] = p.last_read_at;
        });

        const conversationIds = Object.keys(participantMap).map(Number);

        if (conversationIds.length === 0) {
            return res.json({ conversations: [], total: 0, page, limit });
        }

        const { count, rows: conversations } = await Conversation.findAndCountAll({
            where: { id: { [Op.in]: conversationIds } },
            order: [['last_message_at', 'DESC'], ['id', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: ConversationParticipant,
                    where: { left_at: null },
                    include: [{ model: User, attributes: USER_ATTRIBUTES }]
                }
            ]
        });

        // For each conversation, attach last message + unread count
        const result = await Promise.all(conversations.map(async (conv) => {
            const convJSON = conv.toJSON();
            const lastReadAt = participantMap[conv.id];

            // Last message
            const lastMessage = await DirectMessage.findOne({
                where: { conversation_id: conv.id },
                order: [['created_at', 'DESC']],
                include: [{ model: User, as: 'sender', attributes: USER_ATTRIBUTES }]
            });

            // Unread count
            const unreadWhere = { conversation_id: conv.id };
            if (lastReadAt) {
                unreadWhere.created_at = { [Op.gt]: lastReadAt };
            }
            // Exclude own messages from unread count
            unreadWhere.sender_id = { [Op.ne]: userId };
            const unreadCount = await DirectMessage.count({ where: unreadWhere });

            convJSON.last_message = lastMessage;
            convJSON.unread_count = unreadCount;
            return convJSON;
        }));

        res.json({ conversations: result, total: count, page, limit });
    } catch (error) {
        console.error('getConversations error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Find or create a direct conversation between the authenticated user and another user.
 *
 * @route POST /api/conversations/direct
 * @body { user_id: UUID }
 */
export const getOrCreateDirect = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { user_id: otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ error: 'user_id is required' });
        }
        if (otherUserId === currentUserId) {
            return res.status(400).json({ error: 'Cannot create a conversation with yourself' });
        }

        // Check the other user exists
        const otherUser = await User.findByPk(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Look for an existing direct conversation where both users are active participants
        const participantRows = await ConversationParticipant.findAll({
            attributes: ['conversation_id', 'user_id'],
            where: {
                user_id: { [Op.in]: [currentUserId, otherUserId] },
                left_at: null,
            },
            raw: true,
        });

        const usersByConversation = new Map();
        for (const row of participantRows) {
            const set = usersByConversation.get(row.conversation_id) || new Set();
            set.add(row.user_id);
            usersByConversation.set(row.conversation_id, set);
        }

        const candidateConversationIds = [...usersByConversation.entries()]
            .filter(([, userSet]) => userSet.has(currentUserId) && userSet.has(otherUserId))
            .map(([conversationId]) => conversationId);

        let conversation;

        if (candidateConversationIds.length > 0) {
            conversation = await Conversation.findOne({
                where: {
                    id: { [Op.in]: candidateConversationIds },
                    type: 'direct',
                },
                order: [['id', 'ASC']],
                include: [{
                    model: ConversationParticipant,
                    where: { left_at: null },
                    include: [{ model: User, attributes: USER_ATTRIBUTES }]
                }]
            });
        } else {
            // Create new direct conversation
            conversation = await Conversation.create({
                type: 'direct',
                created_by: currentUserId,
                last_message_at: null
            });

            await ConversationParticipant.bulkCreate([
                { conversation_id: conversation.id, user_id: currentUserId, role: 'member' },
                { conversation_id: conversation.id, user_id: otherUserId, role: 'member' }
            ]);

            conversation = await Conversation.findByPk(conversation.id, {
                include: [{
                    model: ConversationParticipant,
                    where: { left_at: null },
                    include: [{ model: User, attributes: USER_ATTRIBUTES }]
                }]
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('getOrCreateDirect error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new group conversation.
 *
 * @route POST /api/conversations/group
 * @body { name: string, participant_ids: UUID[] }
 */
export const createGroup = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { name, participant_ids } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Group name is required' });
        }
        if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
            return res.status(400).json({ error: 'At least one participant is required' });
        }

        const conversation = await Conversation.create({
            type: 'group',
            name: name.trim(),
            created_by: currentUserId,
            last_message_at: null
        });

        // Creator is admin
        const participantRecords = [
            { conversation_id: conversation.id, user_id: currentUserId, role: 'admin' }
        ];

        // De-duplicate and exclude creator
        const uniqueIds = [...new Set(participant_ids)].filter(id => id !== currentUserId);
        for (const uid of uniqueIds) {
            participantRecords.push({
                conversation_id: conversation.id,
                user_id: uid,
                role: 'member'
            });
        }

        await ConversationParticipant.bulkCreate(participantRecords);

        const fullConversation = await Conversation.findByPk(conversation.id, {
            include: [{
                model: ConversationParticipant,
                where: { left_at: null },
                include: [{ model: User, attributes: USER_ATTRIBUTES }]
            }]
        });

        // Emit socket event to all participants
        const io = getIO();
        if (io) {
            uniqueIds.forEach(uid => {
                emitToUser(uid, 'dm_conversation_created', fullConversation);
            });
        }

        res.status(201).json(fullConversation);
    } catch (error) {
        console.error('createGroup error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get messages for a conversation (cursor-based pagination).
 *
 * @route GET /api/conversations/:conversationId/messages?before=id&limit=50
 */
export const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const before = parseInt(req.query.before) || null;

        // Verify participation
        const participant = await getActiveParticipant(conversationId, userId);
        if (!participant) {
            return res.status(403).json({ error: 'Not a participant in this conversation' });
        }

        const where = { conversation_id: conversationId };
        if (before) {
            where.id = { [Op.lt]: before };
        }

        const messages = await DirectMessage.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            include: [
                { model: User, as: 'sender', attributes: USER_ATTRIBUTES },
                {
                    model: DirectMessage,
                    as: 'replyTo',
                    include: [{ model: User, as: 'sender', attributes: USER_ATTRIBUTES }]
                }
            ]
        });

        res.json(messages.reverse()); // Return oldest first
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Send a message in a conversation.
 *
 * @route POST /api/conversations/:conversationId/messages
 * @body { content, type, reply_to_id }
 */
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { content, reply_to_id } = req.body;

        // Verify participation
        const participant = await getActiveParticipant(conversationId, userId);
        if (!participant) {
            return res.status(403).json({ error: 'Not a participant in this conversation' });
        }

        let type = req.body.type || 'text';
        let fileUrl = null;
        let fileName = null;
        let fileSize = null;
        let fileMimeType = null;

        // Handle file upload
        const fileInfo = getFileInfo(req);
        if (fileInfo && fileInfo.url) {
            fileUrl = fileInfo.url;
            fileName = fileInfo.originalname;
            fileSize = fileInfo.size;
            fileMimeType = fileInfo.mimetype;
            type = fileMimeType.startsWith('image/') ? 'image' : 'file';
        }

        if (!content && !fileUrl) {
            return res.status(400).json({ error: 'Message content or file is required' });
        }

        const message = await DirectMessage.create({
            conversation_id: conversationId,
            sender_id: userId,
            content: content || null,
            type,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_mime_type: fileMimeType,
            reply_to_id: reply_to_id || null
        });

        // Update conversation last_message_at
        await Conversation.update(
            { last_message_at: new Date() },
            { where: { id: conversationId } }
        );

        // Fetch full message with associations
        const fullMessage = await DirectMessage.findByPk(message.id, {
            include: [
                { model: User, as: 'sender', attributes: USER_ATTRIBUTES },
                {
                    model: DirectMessage,
                    as: 'replyTo',
                    include: [{ model: User, as: 'sender', attributes: USER_ATTRIBUTES }]
                }
            ]
        });

        // Emit to all participants via socket
        const participants = await ConversationParticipant.findAll({
            where: { conversation_id: conversationId, left_at: null }
        });

        const io = getIO();
        if (io) {
            participants.forEach(p => {
                if (p.user_id !== userId) {
                    emitToUser(p.user_id, 'dm_message', {
                        conversation_id: parseInt(conversationId),
                        message: fullMessage
                    });
                }
            });
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Mark a conversation as read (update last_read_at).
 *
 * @route PATCH /api/conversations/:conversationId/read
 */
export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const participant = await getActiveParticipant(conversationId, userId);
        if (!participant) {
            return res.status(403).json({ error: 'Not a participant in this conversation' });
        }

        const now = new Date();
        await participant.update({ last_read_at: now });

        // Emit read receipt to other participants
        const participants = await ConversationParticipant.findAll({
            where: { conversation_id: conversationId, left_at: null }
        });

        const io = getIO();
        if (io) {
            participants.forEach(p => {
                if (p.user_id !== userId) {
                    emitToUser(p.user_id, 'dm_read', {
                        conversation_id: parseInt(conversationId),
                        user_id: userId,
                        last_read_at: now
                    });
                }
            });
        }

        res.json({ conversation_id: parseInt(conversationId), last_read_at: now });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a group conversation (name, etc.).
 *
 * @route PUT /api/conversations/:conversationId
 * @body { name }
 */
export const updateGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { name } = req.body;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        if (conversation.type !== 'group') {
            return res.status(400).json({ error: 'Only group conversations can be updated' });
        }

        // Check admin role
        const participant = await getActiveParticipant(conversationId, userId);
        if (!participant || participant.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can update the conversation' });
        }

        if (name !== undefined) {
            conversation.name = name.trim();
        }
        await conversation.save();

        const updated = await Conversation.findByPk(conversationId, {
            include: [{
                model: ConversationParticipant,
                where: { left_at: null },
                include: [{ model: User, attributes: USER_ATTRIBUTES }]
            }]
        });

        // Notify participants
        const io = getIO();
        if (io) {
            updated.ConversationParticipants.forEach(p => {
                if (p.user_id !== userId) {
                    emitToUser(p.user_id, 'dm_conversation_updated', updated);
                }
            });
        }

        res.json(updated);
    } catch (error) {
        console.error('updateGroup error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add participants to a group conversation.
 *
 * @route POST /api/conversations/:conversationId/participants
 * @body { user_ids: UUID[] }
 */
export const addParticipants = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { user_ids } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ error: 'user_ids array is required' });
        }

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        if (conversation.type !== 'group') {
            return res.status(400).json({ error: 'Can only add participants to group conversations' });
        }

        // Check admin
        const participant = await getActiveParticipant(conversationId, userId);
        if (!participant || participant.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can add participants' });
        }

        // Fetch adding user's name
        const addingUser = await User.findByPk(userId, { attributes: USER_ATTRIBUTES });

        const addedUsers = [];
        for (const uid of user_ids) {
            // Skip if already active participant
            const existing = await getActiveParticipant(conversationId, uid);
            if (existing) continue;

            const user = await User.findByPk(uid, { attributes: USER_ATTRIBUTES });
            if (!user) continue;

            await ConversationParticipant.create({
                conversation_id: conversationId,
                user_id: uid,
                role: 'member'
            });
            addedUsers.push(user);
        }

        if (addedUsers.length > 0) {
            // Create system message
            const addedNames = addedUsers.map(u => u.first_name || u.username).join(', ');
            const adderName = addingUser.first_name || addingUser.username;

            const systemMsg = await DirectMessage.create({
                conversation_id: conversationId,
                sender_id: null,
                content: `${adderName} added ${addedNames}`,
                type: 'system'
            });

            await Conversation.update(
                { last_message_at: new Date() },
                { where: { id: conversationId } }
            );

            // Emit to all participants
            const allParticipants = await getActiveParticipants(conversationId);
            const io = getIO();
            if (io) {
                allParticipants.forEach(p => {
                    emitToUser(p.user_id, 'dm_participants_added', {
                        conversation_id: parseInt(conversationId),
                        added_users: addedUsers,
                        system_message: systemMsg
                    });
                });
            }
        }

        const updated = await Conversation.findByPk(conversationId, {
            include: [{
                model: ConversationParticipant,
                where: { left_at: null },
                include: [{ model: User, attributes: USER_ATTRIBUTES }]
            }]
        });

        res.json(updated);
    } catch (error) {
        console.error('addParticipants error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Remove a participant from a group conversation (or leave).
 *
 * @route DELETE /api/conversations/:conversationId/participants/:userId
 */
export const removeParticipant = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { conversationId, userId: targetUserId } = req.params;

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        if (conversation.type !== 'group') {
            return res.status(400).json({ error: 'Can only remove participants from group conversations' });
        }

        const currentParticipant = await getActiveParticipant(conversationId, currentUserId);
        if (!currentParticipant) {
            return res.status(403).json({ error: 'Not a participant in this conversation' });
        }

        const isSelf = currentUserId === targetUserId;

        // If removing someone else, must be admin
        if (!isSelf && currentParticipant.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can remove other participants' });
        }

        const targetParticipant = await getActiveParticipant(conversationId, targetUserId);
        if (!targetParticipant) {
            return res.status(404).json({ error: 'User is not an active participant' });
        }

        // Set left_at instead of deleting
        await targetParticipant.update({ left_at: new Date() });

        // Create system message
        const targetUser = await User.findByPk(targetUserId, { attributes: USER_ATTRIBUTES });
        const targetName = targetUser ? (targetUser.first_name || targetUser.username) : 'Unknown';

        let systemContent;
        if (isSelf) {
            systemContent = `${targetName} left the group`;
        } else {
            const currentUser = await User.findByPk(currentUserId, { attributes: USER_ATTRIBUTES });
            const currentName = currentUser ? (currentUser.first_name || currentUser.username) : 'Unknown';
            systemContent = `${currentName} removed ${targetName}`;
        }

        const systemMsg = await DirectMessage.create({
            conversation_id: conversationId,
            sender_id: null,
            content: systemContent,
            type: 'system'
        });

        await Conversation.update(
            { last_message_at: new Date() },
            { where: { id: conversationId } }
        );

        // Emit to remaining participants + the removed user
        const remainingParticipants = await ConversationParticipant.findAll({
            where: { conversation_id: conversationId, left_at: null }
        });

        const io = getIO();
        if (io) {
            // Notify remaining participants
            remainingParticipants.forEach(p => {
                emitToUser(p.user_id, 'dm_participant_removed', {
                    conversation_id: parseInt(conversationId),
                    removed_user_id: targetUserId,
                    system_message: systemMsg
                });
            });
            // Also notify the removed user
            emitToUser(targetUserId, 'dm_participant_removed', {
                conversation_id: parseInt(conversationId),
                removed_user_id: targetUserId,
                system_message: systemMsg
            });
        }

        res.json({ message: isSelf ? 'Left the conversation' : 'Participant removed' });
    } catch (error) {
        console.error('removeParticipant error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Search users for starting a new conversation.
 *
 * @route GET /api/conversations/users/search?q=query
 */
export const searchUsers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { q } = req.query;

        if (!q || q.trim().length < 1) {
            return res.json([]);
        }

        const normalized = q.trim().toLowerCase();
        const searchTerm = `%${normalized}%`;

        const users = await User.findAll({
            where: {
                id: { [Op.ne]: userId },
                is_active: true,
                [Op.or]: [
                    where(fn('LOWER', col('username')), { [Op.like]: searchTerm }),
                    where(fn('LOWER', col('first_name')), { [Op.like]: searchTerm }),
                    where(fn('LOWER', col('last_name')), { [Op.like]: searchTerm }),
                    where(fn('LOWER', col('email')), { [Op.like]: searchTerm }),
                ]
            },
            attributes: USER_ATTRIBUTES,
            limit: 15
        });

        res.json(users);
    } catch (error) {
        console.error('searchUsers error:', error);
        res.status(500).json({ error: error.message });
    }
};
