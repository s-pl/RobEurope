import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma.js', () => {
  const mockModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  });

  return {
    default: {
      user: mockModel(),
      team: mockModel(),
      post: mockModel(),
      postLike: mockModel(),
      comment: mockModel(),
      teamMember: mockModel(),
      country: mockModel(),
      notification: mockModel(),
      systemLog: mockModel(),
      competition: mockModel(),
      registration: mockModel(),
      $transaction: vi.fn((fns) =>
        Array.isArray(fns) ? Promise.all(fns) : fns({ user: mockModel() })
      ),
    },
  };
});

vi.mock('../utils/systemLogger.js', () => ({
  default: {
    logCreate: vi.fn(),
    logAccess: vi.fn(),
    logUpdate: vi.fn(),
    logDelete: vi.fn(),
    logAuth: vi.fn(),
    log: vi.fn(),
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

vi.mock('../middleware/auth.middleware.js', () => ({
  default: vi.fn((req, res, next) => {
    req.user = { id: 'user-1', role: 'user' };
    next();
  }),
  optionalAuth: vi.fn((req, res, next) => {
    req.user = { id: 'user-1', role: 'user' };
    next();
  }),
}));

import prisma from '../lib/prisma.js';
import { getUsers, getUserById, deleteUser } from '../controller/user.controller.js';
import { getTeams, getTeamById } from '../controller/teams.controller.js';
import { getPosts, getPostById } from '../controller/posts.controller.js';
import { getMe } from '../controller/auth.controller.js';

// ── User Controller ───────────────────────────────────────────────────────────
describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1', role: 'user' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('getUsers: returns a list of users', async () => {
    const mockUsers = [{ id: 'u1', username: 'user1', email: 'a@b.c', role: 'user' }];
    prisma.user.findMany.mockResolvedValue(mockUsers);
    await getUsers(req, res);
    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('getUserById: returns 404 if not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    req.params = { id: 'x' };
    await getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getUserById: returns user when found', async () => {
    const userObj = { id: 'u2', username: 'user2' };
    prisma.user.findUnique.mockResolvedValue(userObj);
    req.params = { id: 'u2' };
    await getUserById(req, res);
    expect(res.json).toHaveBeenCalledWith(userObj);
  });

  it('getUsers: returns empty list when none', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await getUsers(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('deleteUser: returns 404 if not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    req.params = { id: '999' };
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteUser: deletes user successfully', async () => {
    const mockUser = { id: 'u1', username: 'user1', role: 'user' };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.user.delete.mockResolvedValue(mockUser);
    req.params = { id: 'u1' };
    await deleteUser(req, res);
    expect(prisma.user.delete).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

// ── Teams Controller ──────────────────────────────────────────────────────────
describe('Teams Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1', role: 'user' } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('getTeams: returns a list of teams', async () => {
    const mockTeams = [{ id: 1, name: 'Team1' }];
    prisma.team.findMany.mockResolvedValue(mockTeams);
    await getTeams(req, res);
    expect(prisma.team.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockTeams);
  });

  it('getTeams: returns empty list when none', async () => {
    prisma.team.findMany.mockResolvedValue([]);
    await getTeams(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('getTeamById: returns 404 if not found', async () => {
    prisma.team.findUnique.mockResolvedValue(null);
    req.params = { id: '99' };
    await getTeamById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getTeamById: returns team when found', async () => {
    const team = { id: 2, name: 'TeamTwo' };
    prisma.team.findUnique.mockResolvedValue(team);
    req.params = { id: '2' };
    await getTeamById(req, res);
    expect(res.json).toHaveBeenCalledWith(team);
  });
});

// ── Posts Controller ──────────────────────────────────────────────────────────
describe('Posts Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, user: { id: 'user-1', role: 'user' }, ip: '127.0.0.1' };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.clearAllMocks();
  });

  it('getPosts: returns a list of posts', async () => {
    const mockPosts = [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }];
    prisma.post.findMany.mockResolvedValue(mockPosts);
    prisma.post.count.mockResolvedValue(2);
    await getPosts(req, res);
    expect(prisma.post.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('getPosts: returns empty list when none', async () => {
    prisma.post.findMany.mockResolvedValue([]);
    prisma.post.count.mockResolvedValue(0);
    await getPosts(req, res);
    expect(prisma.post.findMany).toHaveBeenCalled();
  });

  it('getPostById: returns 404 if post not found', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    req.params = { id: '999' };
    const next = vi.fn();
    await getPostById(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('getPostById: returns post when found', async () => {
    const post = { id: 5, title: 'Found', author: null, postLikes: [], comments: [] };
    prisma.post.findUnique.mockResolvedValue(post);
    req.params = { id: '5' };
    await getPostById(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
