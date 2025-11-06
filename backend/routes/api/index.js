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
const router = express.Router();


router.use('/countries', countriesRouter);
router.use('/users', usersRouter);
router.use('/streams', streamsRouter);
router.use('/auth', authRouter);
router.use('/competitions', competitionsRouter);
router.use('/posts', postsRouter);
router.use('/notifications', notificationsRouter);
router.use('/registrations', registrationRouter);
router.use('/sponsors', sponsorsRouter);
router.use('/teams', teamsRouter);
router.use('/team-members', teamMembersRouter);


export default router;
