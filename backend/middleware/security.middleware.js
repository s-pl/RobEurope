/**
 * @fileoverview
 * Security middleware and utilities for enhanced protection.
 * @module middleware/security
 */

import prisma from '../lib/prisma.js';

export const VALID_ROLES = ['user', 'center_admin', 'super_admin'];

export const ROLE_HIERARCHY = {
  user: 1,
  center_admin: 2,
  super_admin: 3,
};

export async function verifyRoleFromDatabase(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, role: true, is_active: true, educational_center_id: true },
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!dbUser.is_active) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }

    req.user.role = dbUser.role;
    req.user.educational_center_id = dbUser.educational_center_id;
    req.user.is_active = dbUser.is_active;

    if (!VALID_ROLES.includes(req.user.role)) {
      console.error(`Invalid role detected for user ${req.user.id}: ${req.user.role}`);
      return res.status(403).json({ error: 'Rol inválido' });
    }

    next();
  } catch (err) {
    console.error('Error verifying role:', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
}

export function requireMinimumRole(minimumRole) {
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;

    if (userLevel < minimumLevel) {
      return res.status(403).json({
        error: `Permisos insuficientes. Se requiere al menos rol: ${minimumRole}`,
      });
    }

    next();
  };
}

export function requireOwnershipOrAdmin(resourceUserIdField = 'user_id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (req.user.role === 'super_admin') return next();

    const ownerId =
      req.params[resourceUserIdField] ||
      req.body[resourceUserIdField] ||
      req.params.userId ||
      req.params.id;

    if (ownerId && ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
    }

    next();
  };
}

export function requireCenterOwnership() {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (req.user.role === 'super_admin') return next();

    if (req.user.role !== 'center_admin') {
      return res.status(403).json({ error: 'Se requiere rol de administrador de centro' });
    }

    if (!req.user.educational_center_id) {
      return res.status(403).json({ error: 'No tienes un centro educativo asignado' });
    }

    const centerId = parseInt(
      req.params.centerId ||
        req.params.educational_center_id ||
        req.body.educational_center_id ||
        req.query.educational_center_id
    );

    if (centerId && centerId !== req.user.educational_center_id) {
      return res.status(403).json({ error: 'No tienes permisos para este centro educativo' });
    }

    next();
  };
}

export function requireTeamAccess() {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const teamId = parseInt(req.params.teamId || req.params.id || req.body.team_id);

    if (!teamId) {
      return res.status(400).json({ error: 'ID de equipo requerido' });
    }

    try {
      const team = await prisma.team.findUnique({ where: { id: teamId } });

      if (!team) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }

      if (req.user.role === 'super_admin') {
        req.team = team;
        return next();
      }

      if (team.created_by_user_id === req.user.id) {
        req.team = team;
        return next();
      }

      if (
        req.user.role === 'center_admin' &&
        team.educational_center_id &&
        team.educational_center_id === req.user.educational_center_id
      ) {
        req.team = team;
        return next();
      }

      return res.status(403).json({ error: 'No tienes permisos para gestionar este equipo' });
    } catch (err) {
      console.error('Error checking team access:', err);
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const fieldsToSanitize = ['title', 'name', 'description', 'content', 'message'];
    for (const field of fieldsToSanitize) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = sanitizeInput(req.body[field]);
      }
    }
  }
  next();
}

export function preventRoleElevation(req, res, next) {
  if (!req.body) return next();

  if (req.body.role && req.user?.role !== 'super_admin') {
    delete req.body.role;
  }

  if (req.body.educational_center_id && req.user?.role !== 'super_admin') {
    if (req.user?.role === 'center_admin') {
      req.body.educational_center_id = req.user.educational_center_id;
    } else {
      delete req.body.educational_center_id;
    }
  }

  next();
}

export function logSecurityEvent(action, details) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${action}:`, JSON.stringify(details));
}

export function auditLog(action) {
  return (req, res, next) => {
    logSecurityEvent(action, {
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
    });
    next();
  };
}
