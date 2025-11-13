import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const { User, Post } = db;

describe('Posts API', () => {
  let token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      token = loginResponse.body.token;
    }
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should create a post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Test Post')
      .field('content', 'This is a test post')
      .field('author_id', 'test-user-id');
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should get posts', async () => {
    const response = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get post by id', async () => {
    const post = await Post.create({
      title: 'Test Post 2',
      content: 'Content',
      author_id: 'test-user-id'
    });
    const response = await request(app)
      .get(`/api/posts/${post.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Test Post 2');
  });
});