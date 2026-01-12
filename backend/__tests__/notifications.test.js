import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification
} from '../controller/notifications.controller.js';
import db from '../models/index.js';

// Mock Sequelize models
vi.mock('../models/index.js', () => {
  const Notification = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    default: {
      Notification,
    },
  };
});

describe('Notifications Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification and return 201', async () => {
      const mockNotification = { id: 1, title: 'Test', message: 'Test message' };
      db.Notification.create.mockResolvedValue(mockNotification);
      req.body = { title: 'Test', message: 'Test message' };

      await createNotification(req, res);

      expect(db.Notification.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Notification.create.mockRejectedValue(error);

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('getNotifications', () => {
    it('should return a list of notifications', async () => {
      const mockNotifications = [{ id: 1, title: 'Test' }];
      db.Notification.findAll.mockResolvedValue(mockNotifications);
      req.query = { user_id: 'user1' };

      await getNotifications(req, res);

      expect(db.Notification.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { user_id: 'user1' }
      }));
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });
  });

  describe('updateNotification', () => {
    it('should update a notification and return it', async () => {
      const mockNotification = { id: 1, is_read: true };
      db.Notification.update.mockResolvedValue([1]); // 1 row affected
      db.Notification.findByPk.mockResolvedValue(mockNotification);
      req.params = { id: 1 };
      req.body = { is_read: true };

      await updateNotification(req, res);

      expect(db.Notification.update).toHaveBeenCalledWith(req.body, { where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should return 404 if notification not found', async () => {
      db.Notification.update.mockResolvedValue([0]); // 0 rows affected
      req.params = { id: 1 };

      await updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Notification.update.mockRejectedValue(error);
      req.params = { id: 1 };

      await updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('getNotificationById', () => {
    it('should return a notification by id', async () => {
      const mockNotification = { id: 1, title: 'Test', message: 'Test message' };
      db.Notification.findByPk.mockResolvedValue(mockNotification);
      req.params = { id: 1 };

      await getNotificationById(req, res);

      expect(db.Notification.findByPk).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockNotification);
    });

    it('should return 404 if notification not found', async () => {
      db.Notification.findByPk.mockResolvedValue(null);
      req.params = { id: 999 };

      await getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Notification.findByPk.mockRejectedValue(error);
      req.params = { id: 1 };

      await getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification and return success message', async () => {
      db.Notification.destroy.mockResolvedValue(1); // 1 row deleted
      req.params = { id: 1 };

      await deleteNotification(req, res);

      expect(db.Notification.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification deleted' });
    });

    it('should return 404 if notification not found', async () => {
      db.Notification.destroy.mockResolvedValue(0); // 0 rows deleted
      req.params = { id: 999 };

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Notification.destroy.mockRejectedValue(error);
      req.params = { id: 1 };

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe('getNotifications - advanced filtering', () => {
    it('should filter by is_read=true', async () => {
      const mockNotifications = [{ id: 1, is_read: true }];
      db.Notification.findAll.mockResolvedValue(mockNotifications);
      req.query = { is_read: 'true' };

      await getNotifications(req, res);

      expect(db.Notification.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { is_read: true }
      }));
      expect(res.json).toHaveBeenCalledWith(mockNotifications);
    });

    it('should filter by is_read=false (string "0")', async () => {
      const mockNotifications = [{ id: 2, is_read: false }];
      db.Notification.findAll.mockResolvedValue(mockNotifications);
      req.query = { is_read: '0' };

      await getNotifications(req, res);

      expect(db.Notification.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { is_read: false }
      }));
    });

    it('should apply limit and offset', async () => {
      const mockNotifications = [{ id: 1 }];
      db.Notification.findAll.mockResolvedValue(mockNotifications);
      req.query = { limit: '10', offset: '5' };

      await getNotifications(req, res);

      expect(db.Notification.findAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 10,
        offset: 5
      }));
    });

    it('should use default limit and offset', async () => {
      db.Notification.findAll.mockResolvedValue([]);
      req.query = {};

      await getNotifications(req, res);

      expect(db.Notification.findAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 50,
        offset: 0
      }));
    });

    it('should handle errors in getNotifications', async () => {
      const error = new Error('Database error');
      db.Notification.findAll.mockRejectedValue(error);

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
