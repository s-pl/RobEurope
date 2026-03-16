import express from 'express';
import { getMyData, deleteMyAccount } from '../../controller/gdpr.controller.js';

const router = express.Router();

router.get('/my-data', getMyData);
router.delete('/my-account', deleteMyAccount);

export default router;
