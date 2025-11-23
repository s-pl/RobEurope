import express from 'express';
import { createPost, getPosts, getPostById, updatePost, deletePost, toggleLike, addComment, getComments, togglePin } from '../../controller/posts.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'image' }), createPost);
router.put('/:id', authenticateToken, requireOwnership('Post'), uploadMiddleware({ fieldName: 'image' }), updatePost);
router.delete('/:id', authenticateToken, requireOwnership('Post'), deletePost);

router.post('/:id/like', authenticateToken, toggleLike);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments);
router.post('/:id/pin', authenticateToken, requireRole('admin'), togglePin);

export default router;
