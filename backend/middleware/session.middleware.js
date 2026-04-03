import { verifyToken, COOKIE_NAME } from '../utils/signToken.js';

/**
 * @fileoverview
 * Admin session helpers — now uses JWT cookie instead of express-session.
 */

function getUserFromCookie(req) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAdminSession(req, res, next) {
  const user = getUserFromCookie(req);
  if (!user) return res.redirect('/admin/login');
  if (user.role !== 'super_admin') {
    return res.status(403).send(`
      <h1>Forbidden access</h1>
      <p>Your current user (${user.email}) is not super_admin.</p>
      <p><a href="/admin/logout">Log out</a></p>
    `);
  }
  req.user = user;
  next();
}

export function redirectIfAuthenticated(req, res, next) {
  const user = getUserFromCookie(req);
  if (user?.role === 'super_admin') return res.redirect('/admin');
  next();
}
