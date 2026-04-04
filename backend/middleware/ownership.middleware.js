/**
 * @fileoverview
 * Ownership enforcement middleware.
 */

import prisma from '../lib/prisma.js';

// Map of model name → Prisma client key
const MODEL_MAP = {
  User: 'user',
  Team: 'team',
  Post: 'post',
  Archive: 'archive',
  Competition: 'competition',
  Stream: 'stream',
  Sponsor: 'sponsor',
  Gallery: 'gallery',
  RobotFile: 'robotFile',
  Registration: 'registration',
  TeamLog: 'teamLog',
  TeamFile: 'teamFile',
  Media: 'media',
};

/**
 * Ensures the authenticated user owns the record referenced by `req.params.id`.
 * - `super_admin` bypasses ownership checks.
 * - `center_admin` bypasses for Post and Archive.
 * - Ownership is inferred from `created_by_user_id` or `author_id`.
 */
export function requireOwnership(modelName) {
  return async (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });

    if (user.role === 'super_admin') return next();

    if (user.role === 'center_admin' && (modelName === 'Post' || modelName === 'Archive')) {
      return next();
    }

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const prismaKey = MODEL_MAP[modelName];
    if (!prismaKey) return res.status(500).json({ error: 'Modelo no encontrado' });

    try {
      const parsedId = isNaN(Number(id)) ? id : Number(id);
      const record = await prisma[prismaKey].findUnique({ where: { id: parsedId } });

      if (!record) return res.status(404).json({ error: 'Registro no encontrado' });

      let ownerId;
      if (modelName === 'User') {
        ownerId = record.id;
      } else if (record.created_by_user_id) {
        ownerId = record.created_by_user_id;
      } else if (record.author_id) {
        ownerId = record.author_id;
      } else if (record.uploaded_by) {
        ownerId = record.uploaded_by;
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
