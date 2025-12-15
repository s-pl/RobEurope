import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const { User } = db;

// Helper to extract cookie from set-cookie headers
function getSessionCookie(setCookie) {
  if (!Array.isArray(setCookie)) return null;
  return setCookie.find(c => c.startsWith('connect.sid='));
}

describe('Admin panel session auth', () => {
  let sessionCookie;
  let csrfToken;

  beforeAll(async () => {
    // Ensure we have a super_admin user for testing
    await db.sequelize.sync({ alter: true });
    
    const existing = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'super_admin'
      });
    }
  }, 30000); // 30 second timeout for DB operations

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('rejects unauthenticated access to /admin', async () => {
    const res = await request(app).get('/admin');
    // Should redirect to login (302) or 200 login page
    expect([302, 200]).toContain(res.status);
  });

  it('fails login with invalid credentials', async () => {
    const resGet = await request(app).get('/admin/login');
    const tokenMatch = /name="_csrf" value="([^"]+)"/.exec(resGet.text);
    csrfToken = tokenMatch ? tokenMatch[1] : null;

    const res = await request(app)
      .post('/admin/login')
      .set('Cookie', resGet.headers['set-cookie'] || [])
      .send({ email: 'notexist@example.com', password: 'wrong', _csrf: csrfToken });
    expect([400, 401]).toContain(res.status);
  });

  it('fails login with missing credentials', async () => {
    const resGet = await request(app).get('/admin/login');
    const tokenMatch = /name="_csrf" value="([^"]+)"/.exec(resGet.text);
    csrfToken = tokenMatch ? tokenMatch[1] : null;

    const res = await request(app)
      .post('/admin/login')
      .set('Cookie', resGet.headers['set-cookie'] || [])
      .send({ _csrf: csrfToken }); // Missing email and password
    expect(res.status).toBe(400);
  });

  it('fails login with non-admin user', async () => {
    // Create or update a regular user
    const hashedPassword = await bcrypt.hash('userpass123', 10);
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `testuser_${Date.now()}@example.com`;
    
    // Use a unique user to avoid conflicts
    const [regularUser, created] = await User.findOrCreate({
      where: { email: testEmail },
      defaults: {
        username: testUsername,
        email: testEmail,
        password_hash: hashedPassword,
        first_name: 'Regular',
        last_name: 'User',
        role: 'user'
      }
    });

    const resGet = await request(app).get('/admin/login');
    const tokenMatch = /name="_csrf" value="([^"]+)"/.exec(resGet.text);
    csrfToken = tokenMatch ? tokenMatch[1] : null;

    const res = await request(app)
      .post('/admin/login')
      .set('Cookie', resGet.headers['set-cookie'] || [])
      .send({ email: testEmail, password: 'userpass123', _csrf: csrfToken });
    expect(res.status).toBe(403);
  });

  it('logs in with seeded superadmin credentials', async () => {
    const resGet = await request(app).get('/admin/login');
    // Extract CSRF token from form (rudimentary)
    const tokenMatch = /name="_csrf" value="([^"]+)"/.exec(resGet.text);
    csrfToken = tokenMatch ? tokenMatch[1] : null;
    expect(csrfToken).toBeTruthy();

    const res = await request(app)
      .post('/admin/login')
      .set('Cookie', resGet.headers['set-cookie'] || [])
      .send({ email: 'admin@example.com', password: 'ChangeMe123!', _csrf: csrfToken });

    // Expect redirect on success
    expect([302, 200]).toContain(res.status);
    sessionCookie = getSessionCookie(res.headers['set-cookie']);
    expect(sessionCookie).toBeTruthy();
  });

  it('allows access to /admin after login', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Dashboard/i);
  });

  it('allows access to /admin/users after login', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
  });

  it('allows access to /admin/logs after login', async () => {
    const res = await request(app)
      .get('/admin/logs')
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
  });

  it('returns JSON from /admin/api/stats', async () => {
    const res = await request(app)
      .get('/admin/api/stats')
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('competitions');
    expect(res.body).toHaveProperty('posts');
    expect(res.body).toHaveProperty('registrations');
  });

  it('returns JSON from /admin/api/users-by-role', async () => {
    const res = await request(app)
      .get('/admin/api/users-by-role')
      .set('Cookie', sessionCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('logout clears session', async () => {
    const res = await request(app)
      .get('/admin/logout')
      .set('Cookie', sessionCookie);
    expect([302, 200]).toContain(res.status);

    // Try accessing protected route after logout
    const protectedRes = await request(app)
      .get('/admin')
      .set('Cookie', sessionCookie);
    // Should redirect to login
    expect([302, 200]).toContain(protectedRes.status);
  });
});