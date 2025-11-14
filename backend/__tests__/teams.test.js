import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const { User, Team } = db;

describe('Teams API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User'
    });
    userId = user.id;

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

  it('should create a team', async () => {
    const response = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test Team')
      .field('description', 'A test team')
      .field('created_by_user_id', userId);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should get teams', async () => {
    const response = await request(app)
      .get('/api/teams')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get team by id', async () => {
    const team = await Team.create({
      name: 'Test Team 2',
      description: 'Another test team',
      created_by_user_id: userId
    });
    const response = await request(app)
      .get(`/api/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Test Team 2');
  });

  it('should update team', async () => {
    const team = await Team.create({
      name: 'Test Team 3',
      description: 'Team to update',
      created_by_user_id: userId
    });
    const response = await request(app)
      .put(`/api/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Updated Team')
      .field('description', 'Updated description');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Team');
  });

  it('should delete team', async () => {
    const team = await Team.create({
      name: 'Test Team 4',
      description: 'Team to delete',
      created_by_user_id: userId
    });
    const response = await request(app)
      .delete(`/api/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});