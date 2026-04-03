import express from 'express';

import countriesRouter from './country.route.js';
import usersRouter from './user.route.js';
import streamsRouter from './stream.route.js';
import authRouter from './auth.route.js';
import competitionsRouter from './competitions.route.js';
import postsRouter from './posts.route.js';
import notificationsRouter from './notifications.route.js';
import pushRouter from './push.route.js';
import registrationRouter from './registration.route.js';
import sponsorsRouter from './sponsors.route.js';
import teamsRouter from './teams.route.js';
import teamMembersRouter from './team_members.route.js';
import systemLogRouter from './system_log.route.js';
import robotFilesRouter from './robot_file.route.js';
import teamLogsRouter from './team_log.route.js';
import galleryRouter from './gallery.route.js';
import educationalCenterRouter from './educational_center.route.js';
import archiveRouter from './archive.route.js';
import contactRouter from './contact.route.js';
import statsRouter from './stats.route.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import adminApiRouter from './admin.route.js';
import gdprRouter from './gdpr.route.js';
const router = express.Router();

// Public routes (GET usually public, POST/PUT/DELETE protected inside)
router.use('/auth', authRouter);
router.use('/posts', postsRouter);
router.use('/countries', countriesRouter);
router.use('/users', usersRouter);
router.use('/streams', streamsRouter);
router.use('/competitions', competitionsRouter);
router.use('/sponsors', sponsorsRouter);
router.use('/teams', teamsRouter);
router.use('/team-members', teamMembersRouter);
router.use('/gallery', galleryRouter);
router.use('/educational-centers', educationalCenterRouter);
router.use('/archives', archiveRouter);
router.use('/contact', contactRouter);
router.use('/stats', statsRouter);

// Public: feature flags
router.get('/features', (req, res) => {
  const v = (k) => (process.env[k] || '').trim();
  res.json({
    r2: !!(v('R2_ACCOUNT_ID') && v('R2_ACCESS_KEY_ID') && v('R2_SECRET_ACCESS_KEY') && v('R2_BUCKET')),
    email: !!v('RESEND_API_KEY'),
    push: !!(v('VAPID_PUBLIC_KEY') && v('VAPID_PRIVATE_KEY')),
  });
});

// Protect all routes after this middleware: only authenticated users can access
router.use(authenticateToken);

// Diagnostic: current authenticated user/session
router.get('/whoami', (req, res) => {
	return res.json({ user: req.user || null });
});

router.use('/gdpr', gdprRouter);
router.use('/notifications', notificationsRouter);
router.use('/notifications/push', pushRouter);
router.use('/registrations', registrationRouter);
router.use('/system-logs', systemLogRouter);
router.use('/robot-files', robotFilesRouter);
router.use('/team-logs', teamLogsRouter);
router.use('/admin', adminApiRouter);

export default router;
