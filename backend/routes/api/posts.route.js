import express from 'express';
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../../controller/posts.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', authenticateToken, createPost);
router.put('/:id', authenticateToken, requireOwnership('Post'), updatePost);
router.delete('/:id', authenticateToken, requireOwnership('Post'), deletePost);

export default router;
