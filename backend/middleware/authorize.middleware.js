/**
 * Role-based authorization middleware.
 * @param {...string} roles - Allowed roles (e.g. 'super_admin', 'center_admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (roles.length > 0 && !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

export default authorize;
