import express from 'express';
import { getRequests, approveRequest, rejectRequest } from '../controller/center_admin_request.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/center-requests:
 *   get:
 *     summary: Get all center admin requests
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of center admin requests
 */
router.get('/center-requests', requireAuth, requireRole(['super_admin']), getRequests);

/**
 * @swagger
 * /api/admin/center-requests/{id}/approve:
 *   patch:
 *     summary: Approve a center admin request
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request approved
 */
router.patch('/center-requests/:id/approve', requireAuth, requireRole(['super_admin']), approveRequest);

/**
 * @swagger
 * /api/admin/center-requests/{id}/reject:
 *   patch:
 *     summary: Reject a center admin request
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.patch('/center-requests/:id/reject', requireAuth, requireRole(['super_admin']), rejectRequest);

export default router;
