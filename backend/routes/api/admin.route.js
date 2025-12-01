import express from 'express';
import { requireRole } from '../../middleware/role.middleware.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { getStatsData, getUsersByRole, getUsersTimeline, getRegistrationStats, getCompetitionStats, getLogsStats } from '../../controller/admin.controller.js';

const router = express.Router();

// All admin api routes require auth + super_admin role
router.use(authenticateToken, requireRole('super_admin'));

router.get('/stats/overview', getStatsData);
router.get('/stats/users/by-role', getUsersByRole);
router.get('/stats/users/timeline', getUsersTimeline);
router.get('/stats/registrations/by-status', getRegistrationStats);
router.get('/stats/competitions/registrations', getCompetitionStats);
router.get('/stats/logs', getLogsStats);

export default router;