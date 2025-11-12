import request from 'supertest';
import app from '../index.js'; // Adjust path if needed
import db from '../models/index.js';

const { User } = db;

describe('User API', () => {
  beforeAll(async () => {
    // Setup test database if needed
    await db.sequelize.sync({ force: true }); // For testing, reset DB
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should get user by id', async () => {
    const user = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password_hash: 'hash',
      first_name: 'Test2',
      last_name: 'User2'
    });
    const response = await request(app)
      .get(`/api/users/${user.id}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser2');
  });
});