import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, logout, me, changePassword } from '../controller/auth.controller.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('../models/index.js', () => {
  const User = {
    findOne: vi.fn(),
    create: vi.fn(),
  };
  return {
    default: { User },
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('../utils/systemLogger.js', () => ({
  default: {
    logCreate: vi.fn(),
    logAccess: vi.fn(),
    logUpdate: vi.fn(),
    logAuth: vi.fn(),
  },
}));

vi.mock('../utils/redis.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue(null),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
    set: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(true),
  },
}));

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      session: {
        user: null,
        save: vi.fn((cb) => cb()),
        destroy: vi.fn((cb) => cb()),
      },
      ip: '127.0.0.1',
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      clearCookie: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      req.body = { email: 'test@example.com' };
      
      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/Missing required fields/)
      }));
    });

    it('should return 409 if email already exists', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      };
      db.User.findOne.mockResolvedValueOnce({ id: '1' }); // Email exists

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('should return 409 if username already exists', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User',
        username: 'existinguser'
      };
      db.User.findOne
        .mockResolvedValueOnce(null) // Email doesn't exist
        .mockResolvedValueOnce({ id: '1' }); // Username exists

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username already taken' });
    });

    it('should return 400 if password is too weak', async () => {
      req.body = {
        email: 'test@example.com',
        password: '123', // Too weak
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/contraseña/)
      }));
    });

    it('should create user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        role: 'user'
      };
      
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      };
      
      db.User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      db.User.create.mockResolvedValue(mockUser);

      await register(req, res);

      expect(db.User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' })
      }));
    });
  });

  describe('login', () => {
    it('should return 400 if email or password missing', async () => {
      req.body = { email: 'test@example.com' };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      req.body = { email: 'notfound@example.com', password: 'password' };
      db.User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if password incorrect', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      db.User.findOne.mockResolvedValue({ id: '1', password_hash: 'hashed' });
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        role: 'user'
      };
      
      req.body = { email: 'test@example.com', password: 'Password123!' };
      db.User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      // login returns res.json (200 by default), and in this controller it only sets status explicitly on error
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' })
      }));
    });
  });

  describe('logout', () => {
    it('should destroy session and return success', () => {
      req.session.user = { id: 'user-1' };
      
      logout(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
    });
  });

  describe('me', () => {
    it('should return current user from session', () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      req.session.user = user;

      me(req, res);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    it('should return 401 if no user in session', () => {
      req.session.user = null;

      me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });
  });

  describe('changePassword', () => {
    it('should return 401 if no user in session', async () => {
      req.session.user = null;
      req.body = { currentPassword: 'old', newPassword: 'New123!' };

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if current password incorrect', async () => {
      req.session.user = { id: 'user-1' };
      req.body = { current_password: 'wrong', new_password: 'New123!' };
      db.User.findByPk = vi.fn().mockResolvedValue({ id: 'user-1', password_hash: 'hashed', update: vi.fn() });
      bcrypt.compare.mockResolvedValue(false);

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-1',
        password_hash: 'old_hash',
        update: vi.fn().mockResolvedValue(true)
      };
      
      req.session.user = { id: 'user-1' };
      req.body = { current_password: 'OldPass123!', new_password: 'NewPass123!' };
      db.User.findByPk = vi.fn().mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new_hashed');

      await changePassword(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ password_hash: 'new_hashed' });
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});