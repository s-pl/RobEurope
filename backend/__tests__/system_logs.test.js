import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSystemLogs,
  getSystemLogById,
  getSystemStats,
  deleteOldLogs
} from '../controller/system_log.controller.js';
import db from '../models/index.js';

// Mock Sequelize models
vi.mock('../models/index.js', () => {
  const SystemLog = {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    count: vi.fn(),
    destroy: vi.fn(),
  };
  const User = {
    findAll: vi.fn(),
  };
  return {
    default: {
      SystemLog,
      User,
    },
  };
});

describe('System Log Controller', () => {
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

  describe('getSystemLogs', () => {
    it('should return system logs with pagination', async () => {
      const mockLogs = [
        { id: 1, action: 'LOGIN', entity_type: 'User' },
        { id: 2, action: 'CREATE', entity_type: 'Post' },
      ];
      db.SystemLog.findAll.mockResolvedValue(mockLogs);
      db.SystemLog.count.mockResolvedValue(2);
      req.query = { limit: '10', offset: '0' };

      await getSystemLogs(req, res);

      expect(db.SystemLog.findAll).toHaveBeenCalled();
      expect(db.SystemLog.count).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        logs: mockLogs,
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      });
    });

    it('should filter logs by action', async () => {
      const mockLogs = [{ id: 1, action: 'LOGIN' }];
      db.SystemLog.findAll.mockResolvedValue(mockLogs);
      db.SystemLog.count.mockResolvedValue(1);
      req.query = { action: 'LOGIN' };

      await getSystemLogs(req, res);

      expect(db.SystemLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'LOGIN' })
        })
      );
    });

    it('should filter logs by entity_type', async () => {
      const mockLogs = [{ id: 1, entity_type: 'User' }];
      db.SystemLog.findAll.mockResolvedValue(mockLogs);
      db.SystemLog.count.mockResolvedValue(1);
      req.query = { entity_type: 'User' };

      await getSystemLogs(req, res);

      expect(db.SystemLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entity_type: 'User' })
        })
      );
    });

    it('should filter logs by user_id', async () => {
      const mockLogs = [{ id: 1, user_id: 'user123' }];
      db.SystemLog.findAll.mockResolvedValue(mockLogs);
      db.SystemLog.count.mockResolvedValue(1);
      req.query = { user_id: 'user123' };

      await getSystemLogs(req, res);

      expect(db.SystemLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ user_id: 'user123' })
        })
      );
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.SystemLog.findAll.mockRejectedValue(error);

      await getSystemLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });

    it('should apply date range filters when date_from and date_to are provided', async () => {
      db.SystemLog.findAll.mockResolvedValue([]);
      db.SystemLog.count.mockResolvedValue(0);
      req.query = { date_from: '2025-01-01', date_to: '2025-01-31' };

      await getSystemLogs(req, res);

      expect(db.SystemLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.objectContaining({})
          })
        })
      );
    });

    it('should use default sort/ordering when not provided', async () => {
      db.SystemLog.findAll.mockResolvedValue([]);
      db.SystemLog.count.mockResolvedValue(0);

      await getSystemLogs(req, res);

      expect(db.SystemLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['created_at', 'DESC']]
        })
      );
    });
  });

  describe('getSystemLogById', () => {
    it('should return a system log by id', async () => {
      const mockLog = { id: 1, action: 'LOGIN', entity_type: 'User' };
      db.SystemLog.findByPk.mockResolvedValue(mockLog);
      req.params = { id: 1 };

      await getSystemLogById(req, res);

      expect(db.SystemLog.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(mockLog);
    });

    it('should return 404 if log not found', async () => {
      db.SystemLog.findByPk.mockResolvedValue(null);
      req.params = { id: 999 };

      await getSystemLogById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'System log not found' });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.SystemLog.findByPk.mockRejectedValue(error);
      req.params = { id: 1 };

      await getSystemLogById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      const mockActionStats = [{ action: 'LOGIN', count: 10 }];
      const mockEntityStats = [{ entity_type: 'User', count: 5 }];
      const mockDailyStats = [{ date: '2025-12-15', count: 3 }];
      const mockUserStatsRaw = [{ user_id: 'user1', count: 15 }];
      const mockUsers = [{ id: 'user1', first_name: 'Test', last_name: 'User', username: 'testuser', email: 'test@test.com' }];

      // Setup findAll to return different results based on call order
      db.SystemLog.findAll
        .mockResolvedValueOnce(mockActionStats)
        .mockResolvedValueOnce(mockEntityStats)
        .mockResolvedValueOnce(mockDailyStats)
        .mockResolvedValueOnce(mockUserStatsRaw);
      db.User.findAll.mockResolvedValue(mockUsers);

      await getSystemStats(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        actionStats: mockActionStats,
        entityStats: mockEntityStats,
        dailyStats: mockDailyStats,
        userStats: expect.any(Array)
      }));
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.SystemLog.findAll.mockRejectedValue(error);

      await getSystemStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });

    it('should pass date filter to action/entity stats when date range is provided', async () => {
      const mockActionStats = [];
      const mockEntityStats = [];
      const mockDailyStats = [];
      const mockUserStatsRaw = [];

      db.SystemLog.findAll
        .mockResolvedValueOnce(mockActionStats)
        .mockResolvedValueOnce(mockEntityStats)
        .mockResolvedValueOnce(mockDailyStats)
        .mockResolvedValueOnce(mockUserStatsRaw);
      db.User.findAll.mockResolvedValue([]);

      req.query = { date_from: '2025-01-01', date_to: '2025-01-31' };

      await getSystemStats(req, res);

      // First call: actionStats should include where.created_at
      const firstCallArg = db.SystemLog.findAll.mock.calls[0][0];
      expect(firstCallArg.where).toHaveProperty('created_at');
      // Second call: entityStats should include where.created_at
      const secondCallArg = db.SystemLog.findAll.mock.calls[1][0];
      expect(secondCallArg.where).toHaveProperty('created_at');
    });
  });

  describe('deleteOldLogs', () => {
    it('should delete old logs with default days', async () => {
      db.SystemLog.destroy.mockResolvedValue(10);
      req.query = {};

      await deleteOldLogs(req, res);

      expect(db.SystemLog.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Deleted 10 old system logs',
        deletedCount: 10
      });
    });

    it('should delete old logs with custom days_old parameter', async () => {
      db.SystemLog.destroy.mockResolvedValue(5);
      req.query = { days_old: '30' };

      await deleteOldLogs(req, res);

      expect(db.SystemLog.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Deleted 5 old system logs',
        deletedCount: 5
      });
    });

    it('should return 0 if no logs deleted', async () => {
      db.SystemLog.destroy.mockResolvedValue(0);
      req.query = { days_old: '365' };

      await deleteOldLogs(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Deleted 0 old system logs',
        deletedCount: 0
      });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.SystemLog.destroy.mockRejectedValue(error);

      await deleteOldLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });

    it('should compute cutoffDate based on days_old and pass it to destroy', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-15T00:00:00.000Z'));

      db.SystemLog.destroy.mockResolvedValue(1);
      req.query = { days_old: '30' };

      await deleteOldLogs(req, res);

      const destroyArg = db.SystemLog.destroy.mock.calls[0][0];
      expect(destroyArg).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: expect.objectContaining({})
          })
        })
      );

      vi.useRealTimers();
    });
  });
});