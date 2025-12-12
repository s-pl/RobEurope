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
      return res.redirect('https://robeurope.samuelponce.es/login?error=session_save_failed');
        }
    res.redirect('https://robeurope.samuelponce.es/');
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
  passport.authenticate('google', { failureRedirect: 'https://robeurope.samuelponce.es/login?error=google_auth_failed' }),
  socialLoginCallback
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: 'https://robeurope.samuelponce.es/login?error=github_auth_failed' }),
  socialLoginCallback
);


router.post('/ldap', (req, res, next) => {
  passport.authenticate('ldapauth', (err, user, info) => {
    if (err) {
      console.error('LDAP error:', err);
      return res.status(500).json({ error: 'LDAP authentication failed' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid LDAP credentials' });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('LDAP session error:', loginErr);
        return res.status(500).json({ error: 'Session error' });
      }
    
      req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        role: user.role
      };
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: 'Session save failed' });
        return res.json({ success: true });
      });
    });
  })(req, res, next);
});



export default router;
