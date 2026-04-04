import express from 'express';
import { getRequests, approveRequest, rejectRequest } from '../controller/center_admin_request.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();
router.get('/center-requests', authenticateToken, requireRole('super_admin'), getRequests);
router.patch('/center-requests/:id/approve', authenticateToken, requireRole('super_admin'), approveRequest);
router.patch('/center-requests/:id/reject', authenticateToken, requireRole('super_admin'), rejectRequest);

export default router;
