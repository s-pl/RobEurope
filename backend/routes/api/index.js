import express from 'express';

import countriesRouter from './country.route.js';
import usersRouter from './user.route.js';
import streamsRouter from './stream.route.js';
import authRouter from './auth.route.js';
import competitionsRouter from './competitions.route.js';
import postsRouter from './posts.route.js';
import notificationsRouter from './notifications.route.js';
import registrationRouter from './registration.route.js';
import sponsorsRouter from './sponsors.route.js';
import teamsRouter from './teams.route.js';
import teamMembersRouter from './team_members.route.js';
import systemLogRouter from './system_log.route.js';
import authenticateToken from '../../middleware/auth.middleware.js';
const router = express.Router();

// Public routes: auth (register/login) should be available without token
router.use('/auth', authRouter);

// Protect all routes after this middleware: only authenticated users can access
router.use(authenticateToken);

router.use('/countries', countriesRouter);
router.use('/users', usersRouter);
router.use('/streams', streamsRouter);
router.use('/competitions', competitionsRouter);
router.use('/posts', postsRouter);
router.use('/notifications', notificationsRouter);
router.use('/registrations', registrationRouter);
router.use('/sponsors', sponsorsRouter);
router.use('/teams', teamsRouter);
router.use('/team-members', teamMembersRouter);
router.use('/system-logs', systemLogRouter);


export default router;
