import express from 'express';
import { createTeamMember, getTeamMembers, getTeamMemberById, updateTeamMember, deleteTeamMember } from '../../controller/team_members.controller.js';
const router = express.Router();

router.get('/', getTeamMembers);
router.get('/:id', getTeamMemberById);
router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
