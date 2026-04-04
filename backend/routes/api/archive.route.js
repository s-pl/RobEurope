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
import { optionalAuth } from '../../middleware/auth.middleware.js';
import { requireAnyRole } from '../../middleware/role.middleware.js';
import { uploadFile, handleUploadErrors } from '../../middleware/upload.middleware.js';

const uploadFileWithErrorHandling = (field) => [
  uploadFile.single(field),
  handleUploadErrors,
];

const router = express.Router();

// Helper to allow both center_admin and super_admin
const requireAdminRole = requireAnyRole(['center_admin', 'super_admin']);
router.get('/', optionalAuth, listArchives);
router.get('/by-competition', optionalAuth, getArchivesByCompetition);
router.get('/:id', optionalAuth, getArchiveById);

// Protected routes - require authentication
router.use(authenticateToken);
router.post('/', requireAdminRole, ...uploadFileWithErrorHandling('file'), createArchive);
router.post('/reorder', requireAdminRole, reorderArchives);
router.put('/:id', requireAdminRole, ...uploadFileWithErrorHandling('file'), updateArchive);
router.patch('/:id/visibility', requireAdminRole, updateArchiveVisibility);
router.delete('/:id', requireAdminRole, deleteArchive);

export default router;
