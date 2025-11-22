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
  // listCompetitions, // Replaced by generic CRUD
  getCompetitionStats,
  listSystemLogs,
  getLogsStats,
  renderEditUser,
  updateUser
} from '../controller/admin.controller.js';
import * as crudController from '../controller/admin.crud.controller.js';

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
// router.get('/competitions', requireAdminSession, listCompetitions); // Handled by generic CRUD
router.get('/logs', requireAdminSession, listSystemLogs);

// API endpoints for charts (JSON)
router.get('/api/stats', requireAdminSession, getStatsData);
router.get('/api/users-by-role', requireAdminSession, getUsersByRole);
router.get('/api/users-timeline', requireAdminSession, getUsersTimeline);
router.get('/api/registrations-stats', requireAdminSession, getRegistrationStats);
router.get('/api/users-detailed', requireAdminSession, getDetailedUsers);
router.get('/api/competitions-stats', requireAdminSession, getCompetitionStats);
router.get('/api/logs-stats', requireAdminSession, getLogsStats);

// Generic CRUD routes (Must be last to avoid conflicts)
router.get('/:model', requireAdminSession, crudController.list);
router.get('/:model/create', requireAdminSession, crudController.form);
router.get('/:model/edit/:id', requireAdminSession, crudController.form);
router.post('/:model/save', requireAdminSession, crudController.save);
router.post('/:model/save/:id', requireAdminSession, crudController.save);
router.post('/:model/delete/:id', requireAdminSession, crudController.remove);

export default router;