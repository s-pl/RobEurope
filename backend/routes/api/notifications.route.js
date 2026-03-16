import express from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAllAsRead,
  markAsRead
} from '../../controller/notifications.controller.js';

const router = express.Router();

// Mark-all must come before /:id to avoid treating "read-all" as an id param
router.put('/read-all', markAllAsRead);

router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.patch('/:id/read', markAsRead);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.delete('/:id', deleteNotification);

export default router;
