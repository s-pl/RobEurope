import express from 'express';
import { createPost, getPosts, getPostById, updatePost, deletePost, toggleLike, addComment, getComments, deleteComment, togglePin } from '../../controller/posts.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { requireRole, requireAnyRole } from '../../middleware/role.middleware.js';
const router = express.Router();

// Helper to allow both center_admin and super_admin
const requireAdminRole = requireAnyRole(['center_admin', 'super_admin']);

// Multiple image upload middleware (up to 5 images)
const multiImageUpload = uploadMiddleware({ type: 'array', fieldName: 'images', maxSize: 5 * 1024 * 1024, allowedTypes: /image\/*/ });

router.get('/', getPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/', authenticateToken, requireAdminRole, ...multiImageUpload, createPost);
router.put('/:id', authenticateToken, requireOwnership('Post'), ...multiImageUpload, updatePost);
router.delete('/:id', authenticateToken, requireOwnership('Post'), deletePost);

router.post('/:id/like', authenticateToken, toggleLike);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments);
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment);
router.post('/:id/pin', authenticateToken, requireRole('super_admin'), togglePin);

export default router;
