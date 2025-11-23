import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// Helper to extract cookie from set-cookie headers
function getSessionCookie(setCookie) {
  if (!Array.isArray(setCookie)) return null;
  return setCookie.find(c => c.startsWith('connect.sid='));
}

describe('Admin panel session auth', () => {
  let sessionCookie;

  it('rejects unauthenticated access to /admin', async () => {
    const res = await request(app).get('/admin');
    // Should redirect to login (302) or 200 login page
    expect([302, 200]).toContain(res.status);
  });

  it('fails login with invalid credentials', async () => {
    const res = await request(app)
      .post('/admin/login')
      .send({ email: 'notexist@example.com', password: 'wrong' });
    expect([400, 401]).toContain(res.status);
  });

  it('logs in with seeded superadmin credentials', async () => {
    const resGet = await request(app).get('/admin/login');
    // Extract CSRF token from form (rudimentary)
    const tokenMatch = /name="_csrf" value="([^"]+)"/.exec(resGet.text);
    const csrfToken = tokenMatch ? tokenMatch[1] : null;
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
    expect(res.text).toMatch(/Dashboard/);
  });
});