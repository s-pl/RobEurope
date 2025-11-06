import express from 'express';
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../../controller/posts.controller.js';
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
