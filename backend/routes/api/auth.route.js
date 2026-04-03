import express from 'express';
import passport from 'passport';
import { register, login, logout, me, changePassword, forgotPassword, resetPassword, resetPasswordWithCode } from '../../controller/auth.controller.js';
import authenticateToken, { optionalAuth } from '../../middleware/auth.middleware.js';
import { setAuthCookie } from '../../utils/signToken.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://robeurope.samuelponce.es';

// After OAuth Passport verifies the user, issue a JWT cookie and redirect to frontend
const socialLoginCallback = (req, res) => {
  const user = req.user;
  const userPayload = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    role: user.role,
  };
  setAuthCookie(res, userPayload);
  res.redirect(`${FRONTEND_URL}/`);
};

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', optionalAuth, me);
router.post('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password-code', resetPasswordWithCode);

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`, session: false }),
  socialLoginCallback
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=github_auth_failed`, session: false }),
  socialLoginCallback
);

export default router;
