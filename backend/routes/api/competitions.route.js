import express from 'express';
import { createCompetition, getCompetitions, getCompetitionById, updateCompetition, deleteCompetition } from '../../controller/competitions.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.get('/', getCompetitions);
router.get('/:id', getCompetitionById);
router.post('/', authenticateToken, requireRole('admin'), createCompetition);
router.put('/:id', authenticateToken, requireRole('admin'), updateCompetition);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteCompetition);

export default router;
