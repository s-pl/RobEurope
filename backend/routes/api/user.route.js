import express from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser, searchUsers, getSelf, updateSelf } from '../../controller/user.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public search endpoint: /api/users?q=term
router.get('/', searchUsers);

// Create user (admin or open) - keep existing create
router.post('/', createUser);

// Authenticated routes for the current user
router.get('/me', authenticateToken, getSelf);
router.patch('/me', authenticateToken, updateSelf);

// Get specific user by id
router.get('/:id', getUserById);

// General admin-style update/delete by id
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
