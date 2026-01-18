/**
 * @fileoverview
 * Routes for Archive (Global Information Page) API.
 * @module routes/api/archive
 */

import express from 'express';
import {
  listArchives,
  getArchivesByCompetition,
  getArchiveById,
  createArchive,
  updateArchive,
  updateArchiveVisibility,
  deleteArchive,
  reorderArchives
} from '../../controller/archive.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireAnyRole } from '../../middleware/role.middleware.js';
import { uploadFile } from '../../middleware/upload.middleware.js';

const router = express.Router();

// Helper to allow both center_admin and super_admin
const requireAdminRole = requireAnyRole(['center_admin', 'super_admin']);

/**
 * @swagger
 * /api/archives:
 *   get:
 *     summary: List archive items
 *     tags: [Archives]
 *     parameters:
 *       - in: query
 *         name: competition_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: content_type
 *         schema:
 *           type: string
 *           enum: [file, text, mixed]
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [hidden, public, restricted]
 */
router.get('/', listArchives);

/**
 * @swagger
 * /api/archives/by-competition:
 *   get:
 *     summary: Get archives grouped by competition
 *     tags: [Archives]
 */
router.get('/by-competition', getArchivesByCompetition);

/**
 * @swagger
 * /api/archives/{id}:
 *   get:
 *     summary: Get archive by ID
 *     tags: [Archives]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/:id', getArchiveById);

// Protected routes - require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/archives:
 *   post:
 *     summary: Create a new archive item (super_admin only)
 *     tags: [Archives]
 *     security:
 *       - sessionAuth: []
 */
router.post('/', requireAdminRole, uploadFile.single('file'), createArchive);

/**
 * @swagger
 * /api/archives/reorder:
 *   post:
 *     summary: Reorder archive items (super_admin only)
 *     tags: [Archives]
 *     security:
 *       - sessionAuth: []
 */
router.post('/reorder', requireAdminRole, reorderArchives);

/**
 * @swagger
 * /api/archives/{id}:
 *   put:
 *     summary: Update an archive item (super_admin only)
 *     tags: [Archives]
 *     security:
 *       - sessionAuth: []
 */
router.put('/:id', requireAdminRole, uploadFile.single('file'), updateArchive);

/**
 * @swagger
 * /api/archives/{id}/visibility:
 *   patch:
 *     summary: Update archive visibility (super_admin only)
 *     tags: [Archives]
 *     security:
 *       - sessionAuth: []
 */
router.patch('/:id/visibility', requireAdminRole, updateArchiveVisibility);

/**
 * @swagger
 * /api/archives/{id}:
 *   delete:
 *     summary: Delete an archive item (super_admin only)
 *     tags: [Archives]
 *     security:
 *       - sessionAuth: []
 */
router.delete('/:id', requireAdminRole, deleteArchive);

export default router;
