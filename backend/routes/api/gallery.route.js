import express from 'express';
import authenticateToken from '../../middleware/auth.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { listGallery, createGalleryItem } from '../../controller/gallery.controller.js';

const router = express.Router();

// Public: list gallery
router.get('/', listGallery);

// Admin: upload image with optional title/description
router.post(
  '/',
  authenticateToken,
  uploadMiddleware({
    fieldName: 'image',
    maxSize: 10 * 1024 * 1024,
    allowedTypes: /image\/*/
  }),
  createGalleryItem
);

export default router;
