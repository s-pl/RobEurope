import express from 'express';
import { getStats } from '../../controller/stats.controller.js';

const router = express.Router();

router.get('/', getStats);

export default router;
