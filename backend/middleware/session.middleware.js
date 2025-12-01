// Middleware to protect admin routes using session-based authentication
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

export function redirectIfAuthenticated(req, res, next) {
  if (req.session?.user?.role === 'super_admin') {
    return res.redirect('/admin');
  }
  next();
}