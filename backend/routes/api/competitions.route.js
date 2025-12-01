import express from 'express';
import { createCompetition, getCompetitions, getCompetitionById, updateCompetition, deleteCompetition, addFavoriteCompetition, removeFavoriteCompetition, listFavoriteCompetitions } from '../../controller/competitions.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.get('/', getCompetitions);
// Favorites (auth required) - place BEFORE parameterized routes
router.get('/favorites/mine', authenticateToken, listFavoriteCompetitions);
router.post('/:id/favorite', authenticateToken, addFavoriteCompetition);
router.delete('/:id/favorite', authenticateToken, removeFavoriteCompetition);
router.get('/:id', getCompetitionById);
router.post('/', authenticateToken, requireRole('super_admin'), createCompetition);
router.put('/:id', authenticateToken, requireRole('super_admin'), updateCompetition);
router.delete('/:id', authenticateToken, requireRole('super_admin'), deleteCompetition);

// (favorites routes placed above)

export default router;
