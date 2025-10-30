import express from 'express';
import healthRouter from './dbhealt.api.js';
import countriesRouter from './country.route.js';
import usersRouter from './user.route.js';

import authRouter from './auth.route.js';
const router = express.Router();

router.use('/health', healthRouter);
router.use('/countries', countriesRouter);
router.use('/users', usersRouter);

router.use('/auth', authRouter);


export default router;
