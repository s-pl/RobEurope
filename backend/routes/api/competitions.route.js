import express from 'express';
import { createCompetition, getCompetitions, getCompetitionById, updateCompetition, deleteCompetition } from '../../controller/competitions.controller.js';
import { getMessages, sendMessage, addReaction, removeReaction } from '../../controller/competition_chat.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getCompetitions);
router.get('/:id', getCompetitionById);
router.post('/', authenticateToken, requireRole('admin'), createCompetition);
router.put('/:id', authenticateToken, requireRole('admin'), updateCompetition);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteCompetition);

// Chat routes
router.get('/:competitionId/messages', authenticateToken, getMessages);
router.post('/:competitionId/messages', authenticateToken, uploadMiddleware({ 
    fieldName: 'files', 
    type: 'array', 
    allowedTypes: /.*/, 
    maxSize: 50 * 1024 * 1024 
}), sendMessage);
router.post('/:competitionId/messages/:messageId/reactions', authenticateToken, addReaction);
router.delete('/:competitionId/messages/:messageId/reactions', authenticateToken, removeReaction);

export default router;
