/**
 * @fileoverview
 * Ownership enforcement middleware.
 */

/**
 * Creates a middleware that ensures the authenticated user owns the record referenced by `req.params.id`.
 *
 * Rules:
 * - `super_admin` bypasses ownership checks.
 * - Ownership is inferred from common column names:
 *   - `created_by_user_id`
 *   - `author_id`
 * - For the `User` model, the record id is the owner.
 *
 * @param {string} modelName Sequelize model name in the model registry.
 * @returns {import('express').RequestHandler}
 */
export function requireOwnership(modelName) {
  return async (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });

    // Super admin can do all actions
    if (user.role === 'super_admin') {
      return next();
    }

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    try {
      const db = await import('../models/index.js');
      const Model = db.default[modelName];
      if (!Model) return res.status(500).json({ error: 'Modelo no encontrado' });

      const record = await Model.findByPk(id);
      if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

      // Check ownership based on model
      let ownerId;
      if (modelName === 'User') {
        ownerId = record.id;
      } else if (record.created_by_user_id) {
        ownerId = record.created_by_user_id;
      } else if (record.author_id) {
        ownerId = record.author_id;
      } else {
        return res.status(403).json({ error: 'No se puede verificar propiedad' });
      }

      if (ownerId !== user.id) {
        return res.status(403).json({ error: 'Solo puedes modificar tus propios registros' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}