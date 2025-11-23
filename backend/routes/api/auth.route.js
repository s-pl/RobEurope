import express from 'express';
import { register, login, logout, me } from '../../controller/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);

export default router;
