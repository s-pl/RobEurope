import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const { User } = db;

describe('User API', () => {
  let token;

  beforeAll(async () => {
    // Setup test database if needed
    await db.sequelize.sync({ force: true }); // For testing, reset DB

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

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        first_name: 'Test2',
        last_name: 'User2'
      });
    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty('id');
  });

  it('should get user by id', async () => {
    const user = await User.create({
      username: 'testuser3',
      email: 'test3@example.com',
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Test3',
      last_name: 'User3'
    });
    const response = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser3');
  });
});