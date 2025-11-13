import express from 'express';
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../../controller/posts.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'image' }), createPost);
router.put('/:id', authenticateToken, requireOwnership('Post'), uploadMiddleware({ fieldName: 'image' }), updatePost);
router.delete('/:id', authenticateToken, requireOwnership('Post'), deletePost);

export default router;
