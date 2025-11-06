import express from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification
} from '../../controller/notifications.controller.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.delete('/:id', deleteNotification);

export default router;
