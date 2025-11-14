import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';

const { SystemLog } = db;

describe('System Logs API', () => {
  let server;
  let superAdminToken;
  let regularUserToken;

  beforeAll(async () => {
    // Start server
    server = app.listen(85);

    // Create a super admin user first
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'superadmin',
        email: 'superadmin@robeurope.com',
        password: 'SuperAdmin123!',
        first_name: 'Super',
        last_name: 'Admin'
      });

    // Update the user to be super admin (this would normally be done by another super admin)
    const { User } = db;
    await User.update(
      { role: 'super_admin' },
      { where: { email: 'superadmin@robeurope.com' } }
    );

    // Login as super admin
    const superAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'superadmin@robeurope.com',
        password: 'SuperAdmin123!'
      });

    superAdminToken = superAdminLogin.body.token;

    // Create and login as regular user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'regularuser',
        email: 'regular@example.com',
        password: 'RegularPass123!',
        first_name: 'Regular',
        last_name: 'User'
      });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'regular@example.com',
        password: 'RegularPass123!'
      });

    regularUserToken = userLogin.body.token;
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Access Control', () => {
    it('should deny access to regular users', async () => {
      const response = await request(app)
        .get('/api/system-logs')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow access to super admins', async () => {
      const response = await request(app)
        .get('/api/system-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });
  });

  describe('Log Retrieval', () => {
    it('should return system logs with pagination', async () => {
      const response = await request(app)
        .get('/api/system-logs?limit=10&offset=0')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should filter logs by action', async () => {
      const response = await request(app)
        .get('/api/system-logs?action=LOGIN')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);

      // All returned logs should have LOGIN action
      response.body.logs.forEach(log => {
        expect(log.action).toBe('LOGIN');
      });
    });

    it('should filter logs by entity type', async () => {
      const response = await request(app)
        .get('/api/system-logs?entity_type=User')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);

      // All returned logs should have User entity type
      response.body.logs.forEach(log => {
        expect(log.entity_type).toBe('User');
      });
    });
  });

  describe('System Statistics', () => {
    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/system-logs/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('actionStats');
      expect(response.body).toHaveProperty('entityStats');
      expect(response.body).toHaveProperty('dailyStats');
      expect(response.body).toHaveProperty('userStats');

      expect(Array.isArray(response.body.actionStats)).toBe(true);
      expect(Array.isArray(response.body.entityStats)).toBe(true);
      expect(Array.isArray(response.body.dailyStats)).toBe(true);
      expect(Array.isArray(response.body.userStats)).toBe(true);
    });
  });

  describe('Log Cleanup', () => {
    it('should cleanup old logs', async () => {
      const response = await request(app)
        .delete('/api/system-logs/cleanup?days_old=365')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deletedCount');
      expect(typeof response.body.deletedCount).toBe('number');
    });
  });
});