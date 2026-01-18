/**
 * @fileoverview
 * Routes for Educational Centers API.
 * @module routes/api/educational-center
 */

import express from 'express';
import {
  listEducationalCenters,
  getEducationalCenterById,
  createEducationalCenter,
  updateEducationalCenter,
  approveEducationalCenter,
  rejectEducationalCenter,
  deleteEducationalCenter,
  getEducationalCenterTeams,
  getEducationalCenterStreams
} from '../../controller/educational_center.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole, requireCenterAdmin } from '../../middleware/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/educational-centers:
 *   get:
 *     summary: List educational centers
 *     tags: [Educational Centers]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get('/', listEducationalCenters);

/**
 * @swagger
 * /api/educational-centers/{id}:
 *   get:
 *     summary: Get educational center by ID
 *     tags: [Educational Centers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', getEducationalCenterById);

/**
 * @swagger
 * /api/educational-centers/{id}/teams:
 *   get:
 *     summary: Get teams for an educational center
 *     tags: [Educational Centers]
 */
router.get('/:id/teams', getEducationalCenterTeams);

/**
 * @swagger
 * /api/educational-centers/{id}/streams:
 *   get:
 *     summary: Get streams for an educational center
 *     tags: [Educational Centers]
 */
router.get('/:id/streams', getEducationalCenterStreams);

// Protected routes - require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/educational-centers:
 *   post:
 *     summary: Create a new educational center
 *     tags: [Educational Centers]
 *     security:
 *       - sessionAuth: []
 */
router.post('/', createEducationalCenter);

/**
 * @swagger
 * /api/educational-centers/{id}:
 *   put:
 *     summary: Update an educational center
 *     tags: [Educational Centers]
 *     security:
 *       - sessionAuth: []
 */
router.put('/:id', requireCenterAdmin(), updateEducationalCenter);

/**
 * @swagger
 * /api/educational-centers/{id}/approve:
 *   post:
 *     summary: Approve an educational center (super_admin only)
 *     tags: [Educational Centers]
 *     security:
 *       - sessionAuth: []
 */
router.post('/:id/approve', requireRole('super_admin'), approveEducationalCenter);

/**
 * @swagger
 * /api/educational-centers/{id}/reject:
 *   post:
 *     summary: Reject an educational center (super_admin only)
 *     tags: [Educational Centers]
 *     security:
 *       - sessionAuth: []
 */
router.post('/:id/reject', requireRole('super_admin'), rejectEducationalCenter);

/**
 * @swagger
 * /api/educational-centers/{id}:
 *   delete:
 *     summary: Delete an educational center (super_admin only)
 *     tags: [Educational Centers]
 *     security:
 *       - sessionAuth: []
 */
router.delete('/:id', requireRole('super_admin'), deleteEducationalCenter);

export default router;
