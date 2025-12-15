import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost, getPosts, getPostById, updatePost, deletePost } from '../controller/posts.controller.js';
import db from '../models/index.js';

// Mock dependencies
vi.mock('../models/index.js', () => {
  const Post = {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
  const User = {};
  const PostLike = {};
  const Comment = {};
  return {
    default: { Post, User, PostLike, Comment },
  };
});

vi.mock('../middleware/upload.middleware.js', () => ({
  getFileInfo: vi.fn(() => null),
}));

vi.mock('../utils/systemLogger.js', () => ({
  default: {
    logCreate: vi.fn(),
    logUpdate: vi.fn(),
    logDelete: vi.fn(),
  },
}));

vi.mock('../utils/realtime.js', () => ({
  getIO: vi.fn(() => ({ emit: vi.fn() })),
}));

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
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post and return 201', async () => {
      const mockPost = { id: 1, title: 'Test Post', content: 'Content' };
      db.Post.create.mockResolvedValue(mockPost);
      db.Post.findByPk.mockResolvedValue(mockPost);
      
      req.body = { title: 'Test Post', content: 'Content', author_id: 'user-1' };

      await createPost(req, res);

      expect(db.Post.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return 413 if content is too large', async () => {
      const largeContent = 'x'.repeat(300 * 1024); // 300KB
      req.body = { title: 'Test', content: largeContent };

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringMatching(/Content too large/)
      }));
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Post.create.mockRejectedValue(error);
      req.body = { title: 'Test', content: 'Content' };

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getPosts', () => {
    it('should return a list of posts', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ];
      db.Post.findAll.mockResolvedValue(mockPosts);

      await getPosts(req, res);

      expect(db.Post.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should filter posts by author_id', async () => {
      const mockPosts = [{ id: 1, title: 'Post 1', author_id: 'user-1' }];
      db.Post.findAll.mockResolvedValue(mockPosts);
      req.query = { author_id: 'user-1' };

      await getPosts(req, res);

      expect(db.Post.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ author_id: 'user-1' })
        })
      );
    });

    it('should apply limit and offset', async () => {
      db.Post.findAll.mockResolvedValue([]);
      req.query = { limit: '10', offset: '5' };

      await getPosts(req, res);

      expect(db.Post.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 5
        })
      );
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Post.findAll.mockRejectedValue(error);

      await getPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getPostById', () => {
    it('should return a post by id', async () => {
      const mockPost = { id: 1, title: 'Test Post' };
      db.Post.findByPk.mockResolvedValue(mockPost);
      req.params = { id: 1 };

      await getPostById(req, res);

      expect(db.Post.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return 404 if post not found', async () => {
      db.Post.findByPk.mockResolvedValue(null);
      req.params = { id: 999 };

      await getPostById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Post not found' });
    });

    it('should handle errors and return 500', async () => {
      const error = new Error('Database error');
      db.Post.findByPk.mockRejectedValue(error);
      req.params = { id: 1 };

      await getPostById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});