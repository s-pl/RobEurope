import express from 'express';
import healthRouter from './dbhealt.api.js';
import countriesRouter from './country.route.js';

const router = express.Router();

router.use('/health', healthRouter);
router.use('/countries', countriesRouter);


export default router;
