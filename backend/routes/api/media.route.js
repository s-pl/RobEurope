import express from 'express';
import { getAllMedia, getMediaById, uploadMedia, deleteMedia } from '../../controller/media.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();

// All media routes require authentication
router.use(authenticateToken);

// GET /api/media - Get all media with pagination
router.get('/', getAllMedia);

// GET /api/media/:id - Get specific media
router.get('/:id', getMediaById);

// POST /api/media - Upload new media
router.post('/', uploadMedia);

// DELETE /api/media/:id - Delete media
router.delete('/:id', deleteMedia);

export default router;