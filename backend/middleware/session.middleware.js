// Middleware to protect admin routes using session-based authentication
export function requireAdminSession(req, res, next) {
  const user = req.session && req.session.user;
  if (!user) {
    return res.redirect('/admin/login');
  }
  if (user.role !== 'super_admin') {
    return res.status(403).send('Forbidden: admin role required');
  }
  next();
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  next();
}