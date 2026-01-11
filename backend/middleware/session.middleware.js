/**
 * @fileoverview
 * Session helpers for server-rendered admin pages.
 *
 * Note: These middlewares are intended for the EJS admin panel (HTML redirects),
 * not JSON APIs.
 */

/**
 * Protects admin routes using session-based authentication.
 *
 * - Redirects unauthenticated users to `/admin/login`.
 * - Enforces `super_admin` role.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next.
 * @returns {any}
 */
export function requireAdminSession(req, res, next) {
  const user = req.session && req.session.user;
  if (!user) return res.redirect('/admin/login');
  if (user.role !== 'super_admin') {
    return res.status(403).send(`
      <h1>Forbidden access</h1>
      <p>Your current user (${user.email}) is not super_admin.</p>
      <p><a href="/admin/logout">Log out</a> to sign in with a different account.</p>
      <p><a href="/">Return to home</a></p>
    `);
  }
  next();
}

/**
 * Redirects authenticated super admins away from the login page.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next.
 * @returns {any}
 */
export function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user?.role === 'super_admin') {
    return res.redirect('/admin');
  }
  next();
}