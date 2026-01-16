
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

    
vi.mock('../models/index.js', () => {
  const User = {
    findOne: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const Post = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
  };
  const Team = {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
  };
  return {
    default: {
      User,
      Post,
      Team,
      Country: { findByPk: vi.fn() },
      PostLike: {},
      Comment: {},
      TeamMembers: {},
      sequelize: { close: vi.fn() },
    },
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
    logDelete: vi.fn(),
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

vi.mock('../middleware/upload.middleware.js', () => ({
  getFileInfo: vi.fn(() => null),
}));

vi.mock('../utils/realtime.js', () => ({
  getIO: vi.fn(() => ({ emit: vi.fn() })),
  emitToUser: vi.fn(),
}));

import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import { register, login, logout, me } from '../controller/auth.controller.js';
import { getUsers, getUserById, deleteUser } from '../controller/user.controller.js';
import { getTeams, getTeamById, deleteTeam } from '../controller/teams.controller.js';
import { createPost, getPosts, getPostById } from '../controller/posts.controller.js';


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

  it('register: returns 400 if required fields are missing', async () => {
    req.body = { email: 'test@example.com' };
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('register: creates user successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      role: 'user',
    };
    req.body = {
      email: 'test@example.com',
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    };
    db.User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_password');
    db.User.create.mockResolvedValue(mockUser);

    await register(req, res);

    expect(db.User.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('login: returns 401 if user not found', async () => {
    req.body = { email: 'notfound@example.com', password: 'password' };
    db.User.findOne.mockResolvedValue(null);
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('login: succeeds with correct credentials', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      role: 'user',
    };
    req.body = { email: 'test@example.com', password: 'Password123!' };
    db.User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
      })
    );
  });

  it('logout: destroys session and clears cookie', () => {
    req.session.user = { id: 'user-1' };
    logout(req, res);
    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
  });

  it('me: returns current user from session', () => {
    const user = { id: 'user-1', email: 'test@example.com' };
    req.session.user = user;
    me(req, res);
    expect(res.json).toHaveBeenCalledWith(user);
  });
});


describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('getUsers: returns a list of users', async () => {
    const mockUsers = [
      { toJSON: () => ({ id: 'u1', username: 'user1', email: 'a@b.c', password_hash: 'h', phone: '1', role: 'user' }) },
    ];
    db.User.findAll.mockResolvedValue(mockUsers);
    await getUsers(req, res);
    expect(db.User.findAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('getUserById: returns 404 if not found', async () => {
    db.User.findByPk.mockResolvedValue(null);
    req.params = { id: 'x' };
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteUser: returns 404 if not found', async () => {
    db.User.findByPk.mockResolvedValue(null);
    req.params = { id: '999' };
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});


describe('Teams Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('getTeams: returns a list of teams', async () => {
    const mockTeams = [{ id: 1, name: 'Team1' }];
    db.Team.findAll.mockResolvedValue(mockTeams);
    await getTeams(req, res);
    expect(db.Team.findAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockTeams);
  });

  it('getTeamById: returns 404 if not found', async () => {
    db.Team.findByPk.mockResolvedValue(null);
    req.params = { id: 'x' };
    await getTeamById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteTeam: deletes a team successfully', async () => {
    db.Team.destroy.mockResolvedValue(1);
    req.params = { id: '1' };
    await deleteTeam(req, res);
    expect(db.Team.destroy).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Team deleted' });
  });
});


describe('Posts Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      file: null,
      session: { user: { id: 'user-1' } },
    };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('createPost: creates a post and returns 201', async () => {
    const mockPost = { id: 1, title: 'Test Post', content: 'Content' };
    db.Post.create.mockResolvedValue(mockPost);
    db.Post.findByPk.mockResolvedValue(mockPost);
    req.body = { title: 'Test Post', content: 'Content', author_id: 'user-1' };

    await createPost(req, res);

    expect(db.Post.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getPosts: returns a list of posts', async () => {
    const mockPosts = [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }];
    db.Post.findAll.mockResolvedValue(mockPosts);
    await getPosts(req, res);
    expect(db.Post.findAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockPosts);
  });

  it('getPostById: returns 404 if post not found', async () => {
    db.Post.findByPk.mockResolvedValue(null);
    req.params = { id: 999 };
    await getPostById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
