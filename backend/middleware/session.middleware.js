// Middleware to protect admin routes using session-based authentication
export function requireAdminSession(req, res, next) {
  const user = req.session && req.session.user;
  if (!user) {
    return res.redirect('/admin/login');
  }
  if (user.role !== 'super_admin') {
    // If user is logged in but not admin, allow them to see a "Forbidden" page with a logout link
    // or redirect to a specific error page. For now, we'll render a simple error with a link.
    return res.status(403).send(`
      <h1>Acceso Denegado</h1>
      <p>Tu usuario actual (${user.email}) no tiene permisos de administrador.</p>
      <p><a href="/admin/logout">Cerrar sesión</a> para entrar con otra cuenta.</p>
      <p><a href="/">Volver al inicio</a></p>
    `);
  }
  next();
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    // Only redirect if the user is actually an admin
    if (req.session.user.role === 'super_admin') {
      return res.redirect('/admin');
    }
    // If regular user, let them proceed to login page (to switch accounts)
  }
  next();
}