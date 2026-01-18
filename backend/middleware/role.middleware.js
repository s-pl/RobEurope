/**
 * @fileoverview
 * Role-based access control middleware.
 * 
 * Supported roles:
 * - user: Regular participant
 * - center_admin: Educational center administrator
 * - super_admin: Global administrator
 */

/**
 * Creates a middleware that enforces a specific role on `req.user`.
 *
 * @param {string} role Required role.
 * @returns {Express.RequestHandler}
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

/**
 * Creates a middleware that allows any of the specified roles.
 *
 * @param {string[]} roles Array of allowed roles.
 * @returns {Express.RequestHandler}
 */
export function requireAnyRole(roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    if (!user.role) return res.status(403).json({ error: 'Acceso denegado' });
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Se requiere uno de estos roles: ' + roles.join(', ') });
    }
    next();
  };
}

/**
 * Middleware that ensures user is at least a center_admin or super_admin.
 *
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @param {Express.NextFunction} next Express next.
 * @returns {void}
 */
export function requireAdminOrCenterAdmin(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'No autorizado' });
  if (!user.role) return res.status(403).json({ error: 'Acceso denegado' });
  if (user.role !== 'super_admin' && user.role !== 'center_admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' });
  }
  next();
}

/**
 * Middleware that ensures user is a center_admin for a specific educational center.
 *
 * @param {number} centerId The educational center ID to check.
 * @returns {Express.RequestHandler}
 */
export function requireCenterAdminFor(centerId) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    
    // Super admin can access everything
    if (user.role === 'super_admin') return next();
    
    // Center admin can only access their own center
    if (user.role === 'center_admin') {
      if (user.educational_center_id === centerId) {
        return next();
      }
      return res.status(403).json({ error: 'No tienes permisos para este centro educativo' });
    }
    
    return res.status(403).json({ error: 'Se requiere rol de administrador' });
  };
}

/**
 * Factory middleware that checks if user can manage a specific center.
 * Extracts center_id from request params or body.
 *
 * @returns {Express.RequestHandler}
 */
export function requireCenterAdmin() {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    
    // Super admin can access everything
    if (user.role === 'super_admin') return next();
    
    // Center admin must be approved and associated with a center
    if (user.role === 'center_admin') {
      const centerId = parseInt(req.params.centerId || req.params.educational_center_id || req.body.educational_center_id);
      
      if (!user.educational_center_id) {
        return res.status(403).json({ error: 'No tienes un centro educativo asignado' });
      }
      
      // If a specific center is requested, verify it matches
      if (centerId && user.educational_center_id !== centerId) {
        return res.status(403).json({ error: 'No tienes permisos para este centro educativo' });
      }
      
      return next();
    }
    
    return res.status(403).json({ error: 'Se requiere rol de administrador de centro' });
  };
}
