import express from 'express';
import { createTeam, getTeams, getTeamById, updateTeam, deleteTeam } from '../../controller/teams.controller.js';
const router = express.Router();

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

export default router;
