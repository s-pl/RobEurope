import express from 'express';
import { createLogEntry, getTeamLogs } from '../../controller/team_log.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, createLogEntry);
router.get('/', authenticateToken, getTeamLogs);

export default router;
