import express from 'express';
import { register, login, logout, me, changePassword, forgotPassword, resetPassword, resetPasswordWithCode } from '../../controller/auth.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password-code', resetPasswordWithCode);

export default router;
