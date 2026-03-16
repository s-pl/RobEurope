import express from 'express';
import {
    getConversations,
    getOrCreateDirect,
    createGroup,
    getMessages,
    sendMessage,
    markAsRead,
    updateGroup,
    addParticipants,
    removeParticipant,
    searchUsers
} from '../../controller/conversations.controller.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';

const router = express.Router();

// User search (must be before /:conversationId routes)
router.get('/users/search', searchUsers);

// Conversation listing & creation
router.get('/', getConversations);
router.post('/direct', getOrCreateDirect);
router.post('/group', createGroup);

// Per-conversation routes
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', uploadMiddleware({
    fieldName: 'file',
    allowedTypes: /.*/,
    maxSize: 25 * 1024 * 1024
}), sendMessage);
router.patch('/:conversationId/read', markAsRead);
router.put('/:conversationId', updateGroup);
router.post('/:conversationId/participants', addParticipants);
router.delete('/:conversationId/participants/:userId', removeParticipant);

export default router;
