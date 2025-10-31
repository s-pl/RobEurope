export function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    if (!user.role) return res.status(403).json({ error: 'Acceso denegado' });
    if (user.role !== role) return res.status(403).json({ error: 'Se requiere rol: ' + role });
    next();
  };
}
