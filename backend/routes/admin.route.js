import { Router } from 'express';
import { requireAdminSession, redirectIfAuthenticated } from '../middleware/session.middleware.js';
import { renderLogin, handleLogin, handleLogout, renderDashboard, listUsers, promoteUser } from '../controller/admin.controller.js';

const router = Router();

// Login/logout
router.get('/login', redirectIfAuthenticated, renderLogin);
router.post('/login', handleLogin);
router.get('/logout', handleLogout);

// Protected admin panel routes
router.get('/', requireAdminSession, renderDashboard);
router.get('/users', requireAdminSession, listUsers);
router.post('/users/:id/promote', requireAdminSession, promoteUser);

export default router;