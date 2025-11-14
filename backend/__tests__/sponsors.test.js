import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const { User, Sponsor } = db;

describe('Sponsors API', () => {
  let token;
  let superAdminToken;
  let userId;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Create a regular user
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

    // Create a super admin user
    const superAdmin = await User.create({
      id: 'super-admin-id',
      username: 'superadmin',
      email: 'admin@example.com',
      password_hash: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin'
    });

    // Login as regular user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      token = loginResponse.body.token;
    }

    // Login as super admin
    const superAdminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });

    if (superAdminLoginResponse.status === 200) {
      superAdminToken = superAdminLoginResponse.body.token;
    }
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should create a sponsor', async () => {
    const response = await request(app)
      .post('/api/sponsors')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Test Sponsor')
      .field('description', 'A test sponsor')
      .field('website', 'https://testsponsor.com');
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should get sponsors', async () => {
    const response = await request(app)
      .get('/api/sponsors')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get sponsor by id', async () => {
    const sponsor = await Sponsor.create({
      name: 'Test Sponsor 2',
      description: 'Another test sponsor',
      website: 'https://testsponsor2.com'
    });
    const response = await request(app)
      .get(`/api/sponsors/${sponsor.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Test Sponsor 2');
  });

  it('should update sponsor as super admin', async () => {
    const sponsor = await Sponsor.create({
      name: 'Test Sponsor 3',
      description: 'Sponsor to update',
      website: 'https://testsponsor3.com'
    });
    const response = await request(app)
      .put(`/api/sponsors/${sponsor.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .field('name', 'Updated Sponsor')
      .field('description', 'Updated description');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Sponsor');
  });

  it('should delete sponsor as super admin', async () => {
    const sponsor = await Sponsor.create({
      name: 'Test Sponsor 4',
      description: 'Sponsor to delete',
      website: 'https://testsponsor4.com'
    });
    const response = await request(app)
      .delete(`/api/sponsors/${sponsor.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(response.status).toBe(200);
  });
});