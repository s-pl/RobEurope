import express from 'express';
import authenticateToken from '../../middleware/auth.middleware.js';
import { me } from '../../controller/auth.controller.js';

const router = express.Router();

// Auth0 handles login/register/oauth/password-reset.
// The only backend auth endpoint is /me — finds or creates the DB user.
router.get('/me', authenticateToken, me);

export default router;
