import express from 'express';
import { createTeam, getTeams, getTeamById, updateTeam, deleteTeam } from '../../controller/teams.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
const router = express.Router();

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'logo' }), createTeam);
router.put('/:id', authenticateToken, requireOwnership('Team'), uploadMiddleware({ fieldName: 'logo' }), updateTeam);
router.delete('/:id', authenticateToken, requireOwnership('Team'), deleteTeam);

export default router;
