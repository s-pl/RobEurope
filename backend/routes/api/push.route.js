import express from 'express';
import authenticateToken from '../../middleware/auth.middleware.js';
import { getVapidPublicKey, subscribePush, unsubscribePush, sendTestPush } from '../../controller/push.controller.js';

const router = express.Router();

router.get('/vapidPublicKey', getVapidPublicKey);
router.post('/subscribe', authenticateToken, subscribePush);
router.post('/unsubscribe', authenticateToken, unsubscribePush);
router.post('/test', authenticateToken, sendTestPush);

export default router;
