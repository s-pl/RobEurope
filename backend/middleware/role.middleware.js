/**
 * @fileoverview
 * Role-based access control middleware.
 */

/**
 * Creates a middleware that enforces a specific role on `req.user`.
 *
 * This project primarily uses `user` and `super_admin` roles.
 *
 * @param {string} role Required role.
 * @returns {import('express').RequestHandler}
 */
export function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    if (!user.role) return res.status(403).json({ error: 'Acceso denegado' });
    if (user.role !== role) return res.status(403).json({ error: 'Se requiere rol: ' + role });
    next();
  };
}
