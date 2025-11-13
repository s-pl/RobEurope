import express from 'express';
import {
  getSystemLogs,
  getSystemLogById,
  getSystemStats,
  deleteOldLogs
} from '../../controller/system_log.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

// All routes require authentication and super admin role
router.use(authenticateToken);
router.use(requireRole('super_admin'));

// Routes
router.get('/', getSystemLogs);
router.get('/stats', getSystemStats);
router.get('/:id', getSystemLogById);
router.delete('/cleanup', deleteOldLogs);

export default router;