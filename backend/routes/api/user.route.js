import express from 'express';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import {
  searchUsers,
  getUserById,
  deleteUser,
  getSelf,
  updateSelf,
  deleteSelf
} from '../../controller/user.controller.js';

const router = express.Router();

router.get('/', searchUsers);

// rutas para el usuario autenticado: MUST be before "/:id"
router.get('/me', authenticateToken, getSelf);
router.patch('/me', authenticateToken, updateSelf);
router.delete('/me', authenticateToken, deleteSelf);

// rutas por id (solo después de /me)
router.get('/:id', getUserById);
router.delete('/:id', authenticateToken, requireOwnership('User'), deleteUser);

export default router;
