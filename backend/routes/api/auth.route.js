import express from 'express';
import passport from 'passport';
import { register, login, logout, me, changePassword, forgotPassword, resetPassword, resetPasswordWithCode } from '../../controller/auth.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();

// Helper to set session after social login
const socialLoginCallback = (req, res) => {
    const user = req.user;
    req.session.user = { 
        id: user.id, 
        email: user.email, 
        first_name: user.first_name, 
        last_name: user.last_name, 
        username: user.username, 
        role: user.role 
    };
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.redirect('http://localhost:5173/login?error=session_save_failed');
        }
        res.redirect('http://localhost:5173/');
    });
};

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password-code', resetPasswordWithCode);

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=google_auth_failed' }),
  socialLoginCallback
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login?error=github_auth_failed' }),
  socialLoginCallback
);

// Apple (Placeholder - requires more setup)
// router.get('/apple', passport.authenticate('apple'));
// router.post('/apple/callback', passport.authenticate('apple', { failureRedirect: '/login' }), socialLoginCallback);

export default router;
