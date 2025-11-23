import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNotification, getNotifications, updateNotification } from '../controller/notifications.controller.js';
import db from '../models/index.js';

// Mock Sequelize models
vi.mock('../models/index.js', () => {
  const Notification = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    update: vi.fn(),
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
  });
});
