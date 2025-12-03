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
import authenticateToken from '../../middleware/auth.middleware.js';
import adminApiRouter from './admin.route.js';
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

// Protect all routes after this middleware: only authenticated users can access
router.use(authenticateToken);

// Diagnostic: current authenticated user/session
router.get('/whoami', (req, res) => {
	return res.json({ user: req.user || null });
});

router.use('/notifications', notificationsRouter);
router.use('/notifications/push', pushRouter);
router.use('/registrations', registrationRouter);
router.use('/system-logs', systemLogRouter);
router.use('/robot-files', robotFilesRouter);
router.use('/team-logs', teamLogsRouter);
router.use('/admin', adminApiRouter);


export default router;
