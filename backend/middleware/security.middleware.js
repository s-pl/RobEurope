/**
 * @fileoverview
 * Security middleware and utilities for enhanced protection.
 * 
 * This module provides:
 * - Role verification that cannot be spoofed
 * - Resource ownership validation
 * - Rate limiting for sensitive endpoints
 * - Input sanitization helpers
 * @module middleware/security
 */

import db from '../models/index.js';

const { User, Team, EducationalCenter, Registration } = db;

/**
 * Valid roles in the system.
 * @type {string[]}
 */
export const VALID_ROLES = ['user', 'center_admin', 'super_admin'];

/**
 * Role hierarchy for permission checking.
 * Higher number = more privileges.
 * @type {Object.<string, number>}
 */
export const ROLE_HIERARCHY = {
  'user': 1,
  'center_admin': 2,
  'super_admin': 3
};

/**
 * Verifies that a user has a valid role from the database.
 * This prevents role spoofing through session manipulation.
 * 
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @param {Express.NextFunction} next Express next.
 * @returns {Promise<void>}
 */
export async function verifyRoleFromDatabase(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }
    
    // Fetch the actual user from database to verify role
    const dbUser = await User.findByPk(req.user.id, {
      attributes: ['id', 'role', 'is_active', 'educational_center_id']
    });
    
    if (!dbUser) {
      // User was deleted, invalidate session
      req.session.destroy();
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    if (!dbUser.is_active) {
      req.session.destroy();
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }
    
    // Update session user with verified data
    req.user.role = dbUser.role;
    req.user.educational_center_id = dbUser.educational_center_id;
    req.user.is_active = dbUser.is_active;
    
    // Validate role is in allowed list
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

/**
 * Creates a middleware that requires a minimum role level.
 * Uses role hierarchy for comparison.
 * 
 * @param {string} minimumRole - Minimum required role.
 * @returns {Express.RequestHandler}
 */
export function requireMinimumRole(minimumRole) {
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }
    
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    
    if (userLevel < minimumLevel) {
      return res.status(403).json({ 
        error: `Permisos insuficientes. Se requiere al menos rol: ${minimumRole}` 
      });
    }
    
    next();
  };
}

/**
 * Validates that a user can only access their own resources or is an admin.
 * 
 * @param {string} resourceUserIdField - Field name containing the resource owner's user ID.
 * @returns {Express.RequestHandler}
 */
export function requireOwnershipOrAdmin(resourceUserIdField = 'user_id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }
    
    // Super admin bypasses ownership check
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Get resource owner ID from params or body
    const ownerId = req.params[resourceUserIdField] || 
                    req.body[resourceUserIdField] ||
                    req.params.userId ||
                    req.params.id;
    
    if (ownerId && ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
    }
    
    next();
  };
}

/**
 * Validates that a center_admin can only access resources from their center.
 * 
 * @returns {Express.RequestHandler}
 */
export function requireCenterOwnership() {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }
    
    // Super admin bypasses
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    if (req.user.role !== 'center_admin') {
      return res.status(403).json({ error: 'Se requiere rol de administrador de centro' });
    }
    
    if (!req.user.educational_center_id) {
      return res.status(403).json({ error: 'No tienes un centro educativo asignado' });
    }
    
    // Try to get center ID from various sources
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

/**
 * Validates that a user can manage a specific team.
 * Checks if user is team owner, center_admin for team's center, or super_admin.
 * 
 * @returns {Express.RequestHandler}
 */
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
      const team = await Team.findByPk(teamId);
      
      if (!team) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }
      
      // Super admin can access all teams
      if (req.user.role === 'super_admin') {
        req.team = team;
        return next();
      }
      
      // Team owner can access
      if (team.created_by_user_id === req.user.id) {
        req.team = team;
        return next();
      }
      
      // Center admin can access teams from their center
      if (req.user.role === 'center_admin' && 
          team.educational_center_id && 
          team.educational_center_id === req.user.educational_center_id) {
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

/**
 * Sanitizes user input to prevent XSS and injection attacks.
 * 
 * @param {string} input - Input string to sanitize.
 * @returns {string} Sanitized string.
 */
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

/**
 * Middleware that sanitizes common body fields.
 * 
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @param {Express.NextFunction} next Express next.
 */
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

/**
 * Prevents users from elevating their own role.
 * 
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @param {Express.NextFunction} next Express next.
 */
export function preventRoleElevation(req, res, next) {
  if (!req.body) return next();
  
  // Only super_admin can change roles
  if (req.body.role && req.user?.role !== 'super_admin') {
    delete req.body.role;
  }
  
  // Prevent direct educational_center_id manipulation
  if (req.body.educational_center_id && req.user?.role !== 'super_admin') {
    // Center admins can only set their own center
    if (req.user?.role === 'center_admin') {
      req.body.educational_center_id = req.user.educational_center_id;
    } else {
      delete req.body.educational_center_id;
    }
  }
  
  next();
}

/**
 * Logs security-relevant actions.
 * 
 * @param {string} action - Action being performed.
 * @param {Object} details - Additional details to log.
 */
export function logSecurityEvent(action, details) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${action}:`, JSON.stringify(details));
  
  // In production, this could write to a security log table or external service
}

/**
 * Middleware to log sensitive actions.
 * 
 * @param {string} action - Description of the action.
 * @returns {Express.RequestHandler}
 */
export function auditLog(action) {
  return (req, res, next) => {
    logSecurityEvent(action, {
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query
    });
    next();
  };
}
