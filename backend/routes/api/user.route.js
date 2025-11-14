import express from 'express';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import {
  searchUsers,
  getUserById,
  deleteUser,
  updateUser,
  getSelf,
  updateSelf,
  deleteSelf
} from '../../controller/user.controller.js';

const router = express.Router();

router.get('/', searchUsers);

// rutas para el usuario autenticado: MUST be before "/:id"
router.get('/me', authenticateToken, getSelf);
router.patch('/me', authenticateToken, uploadMiddleware({ fieldName: 'profile_photo' }), updateSelf);
router.delete('/me', authenticateToken, deleteSelf);

// rutas por id (solo después de /me)
router.get('/:id', getUserById);
router.put('/:id', authenticateToken, requireOwnership('User'), uploadMiddleware({ fieldName: 'profile_photo' }), updateUser);
router.delete('/:id', authenticateToken, requireOwnership('User'), deleteUser);

export default router;
