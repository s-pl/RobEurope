import express from 'express';
import { createTeamMember, getTeamMembers, getTeamMemberById, updateTeamMember, deleteTeamMember } from '../../controller/team_members.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.get('/', getTeamMembers);
router.get('/:id', getTeamMemberById);
router.post('/', authenticateToken, createTeamMember);
router.put('/:id', authenticateToken, updateTeamMember);
router.delete('/:id', authenticateToken, deleteTeamMember);

export default router;
