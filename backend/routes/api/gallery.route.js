import express from 'express';
import authenticateToken from '../../middleware/auth.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { 
  listGallery, 
  getGalleryByCompetition,
  getGalleryItemById,
  createGalleryItem, 
  updateGalleryItem,
  deleteGalleryItem,
  reorderGalleryItems,
  toggleFeatured
} from '../../controller/gallery.controller.js';

const router = express.Router();

// Public: list gallery with filters
router.get('/', listGallery);

// Public: get gallery grouped by competition
router.get('/by-competition', getGalleryByCompetition);

// Public: get single gallery item
router.get('/:id', getGalleryItemById);

// Admin: upload image or video with optional title/description
router.post(
  '/',
  authenticateToken,
  uploadMiddleware({
    fieldName: 'file',
    maxSize: 100 * 1024 * 1024, // 100MB for videos
    allowedTypes: /^(image|video)\/.*/
  }),
  createGalleryItem
);

// Admin: reorder gallery items
router.post('/reorder', authenticateToken, reorderGalleryItems);

// Admin: toggle featured status
router.post('/:id/toggle-featured', authenticateToken, toggleFeatured);

// Admin: update gallery item
router.put('/:id', authenticateToken, updateGalleryItem);

// Admin: delete gallery item
router.delete('/:id', authenticateToken, deleteGalleryItem);

export default router;
