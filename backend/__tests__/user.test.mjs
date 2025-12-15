import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsers, getUserById, updateUser, deleteUser } from '../controller/user.controller.js';

vi.mock('../models/index.js', () => {
  const User = {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    update: vi.fn(),
  };
  return { default: { User, Country: { findByPk: vi.fn() } } };
});

vi.mock('../middleware/upload.middleware.js', () => ({ getFileInfo: vi.fn(() => null) }));

import db from '../models/index.js';

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return a list of users', async () => {
      const mockUsers = [
        { toJSON: () => ({ id: 'u1', username: 'user1', email: 'a@b.c', password_hash: 'h', phone: '1', role: 'user' }) }
      ];
      db.User.findAll.mockResolvedValue(mockUsers);
      await getUsers(req, res);
      expect(db.User.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([{ id: 'u1', username: 'user1' }]);
    });

    it('should handle errors', async () => {
      db.User.findAll.mockRejectedValue(new Error('DB error'));
      await getUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: 'u1', username: 'test' };
      db.User.findByPk.mockResolvedValue(mockUser);
      req.params = { id: 'u1' };
      await getUserById(req, res);
      expect(db.User.findByPk).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if not found', async () => {
      db.User.findByPk.mockResolvedValue(null);
      req.params = { id: 'x' };
      await getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      db.User.update.mockResolvedValue([1]);
      db.User.findByPk.mockResolvedValue({ id: 1, username: 'updated' });
      req.params = { id: '1' };
      req.body = { username: 'updated' };
      await updateUser(req, res);
      expect(db.User.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ id: 1, username: 'updated' });
    });

    it('should return 404 if not found', async () => {
      db.User.update.mockResolvedValue([0]);
      req.params = { id: 'x' };
      req.body = { username: 't' };
      await updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockUser = { id: 1, destroy: vi.fn().mockResolvedValue(true) };
      db.User.findByPk.mockResolvedValue(mockUser);
      req.params = { id: '1' };
      await deleteUser(req, res);
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 400 for invalid id', async () => {
      req.params = { id: 'invalid' };
      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if not found', async () => {
      db.User.findByPk.mockResolvedValue(null);
      req.params = { id: '999' };
      await deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
