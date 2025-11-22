import { Router } from 'express';
import { requireAdminSession, redirectIfAuthenticated } from '../middleware/session.middleware.js';
import { 
  renderLogin, 
  handleLogin, 
  handleLogout, 
  renderDashboard, 
  listUsers, 
  promoteUser,
  getStatsData,
  getUsersByRole,
  getUsersTimeline,
  getRegistrationStats,
  getDetailedUsers,
  listCompetitions,
  getCompetitionStats,
  listSystemLogs,
  getLogsStats,
  renderEditUser,
  updateUser
} from '../controller/admin.controller.js';

const router = Router();

// Login/logout
router.get('/login', redirectIfAuthenticated, renderLogin);
router.post('/login', handleLogin);
router.get('/logout', handleLogout);

// Protected admin panel routes
router.get('/', requireAdminSession, renderDashboard);
router.get('/users', requireAdminSession, listUsers);
router.post('/users/:id/promote', requireAdminSession, promoteUser);
router.get('/users/:id/edit', requireAdminSession, renderEditUser);
router.post('/users/:id/edit', requireAdminSession, updateUser);
router.get('/competitions', requireAdminSession, listCompetitions);
router.get('/logs', requireAdminSession, listSystemLogs);

// API endpoints for charts (JSON)
router.get('/api/stats', requireAdminSession, getStatsData);
router.get('/api/users-by-role', requireAdminSession, getUsersByRole);
router.get('/api/users-timeline', requireAdminSession, getUsersTimeline);
router.get('/api/registrations-stats', requireAdminSession, getRegistrationStats);
router.get('/api/users-detailed', requireAdminSession, getDetailedUsers);
router.get('/api/competitions-stats', requireAdminSession, getCompetitionStats);
router.get('/api/logs-stats', requireAdminSession, getLogsStats);

export default router;