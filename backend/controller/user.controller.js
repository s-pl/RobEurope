import prisma from '../lib/prisma.js';

import bcrypt from 'bcryptjs';
import { getFileInfo } from '../middleware/upload.middleware.js';
import { sanitizeUser } from '../utils/sanitize.js';

/**
 * @fileoverview
 * User API handlers.
 *
 * Routes:
 * - Public search: GET /api/users?q=...
 * - Authenticated self endpoints: GET/PATCH/DELETE /api/users/me
 * - By-id endpoints require ownership checks at the router level.
 */

/**
 * Creates a user.
 *
 * Note: This handler is not currently exposed in the API router.
 */
export const createUser = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({ data: { ...req.body, password_hash: hashedPassword } });
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Lists users.
 *
 * Note: This handler is not currently exposed in the API router.
 */
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const mapped_users = users.map(user => {
      const { password_hash, phone, role, email, ...userData } = user;
      return userData;
    });
    res.json(mapped_users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Retrieves a user by id.
 * @route GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Updates a user by id.
 *
 * Supports optional profile photo upload via multipart/form-data.
 *
 * @route PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.profile_photo_url = fileInfo.url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updates
    }).catch(() => null);
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Searches users by query string.
 * @route GET /api/users?q=...
 */
export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const where = q ? {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { first_name: { contains: q, mode: 'insensitive' } },
        { last_name: { contains: q, mode: 'insensitive' } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where,
      select: { id: true, username: true, email: true, first_name: true, last_name: true, profile_photo_url: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Searches users by username, first_name, or last_name for team invitations.
 *
 * Requires authentication. Returns sanitized user data, limited to 10 results.
 *
 * @route GET /api/users/search?q=term
 */
export const searchUsersForInvite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { first_name: { contains: q, mode: 'insensitive' } },
          { last_name: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 10
    });
    res.json(users.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Returns the current authenticated user.
 * @route GET /api/users/me
 */
export const getSelf = async (req, res) => {
  try {
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ error: 'No autorizado' });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Updates the current authenticated user.
 *
 * Supports optional profile photo upload via multipart/form-data.
 *
 * @route PATCH /api/users/me
 */
export const updateSelf = async (req, res) => {
  try {
    const id = req.user && req.user.id;
    if (!id) return res.status(401).json({ error: 'No autorizado' });

    // Allowed fields to update by user themselves
    const allowed = ['first_name', 'last_name', 'phone', 'profile_photo_url', 'country_id', 'is_active', 'educational_center_id'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
    }

    // Validate country if requested
    if (Object.prototype.hasOwnProperty.call(updates, 'country_id')) {
      if (updates.country_id == null || updates.country_id === '') {
        updates.country_id = null;
      } else {
        const exists = await prisma.country.findUnique({ where: { id: Number(updates.country_id) } });
        if (!exists) return res.status(400).json({ error: 'Invalid country_id' });
        updates.country_id = Number(updates.country_id);
      }
    }

    // Validate educational center if requested
    if (Object.prototype.hasOwnProperty.call(updates, 'educational_center_id')) {
      if (updates.educational_center_id == null || updates.educational_center_id === '') {
        updates.educational_center_id = null;
      } else {
        const centerId = Number(updates.educational_center_id);
        if (!Number.isInteger(centerId)) return res.status(400).json({ error: 'Invalid educational_center_id' });
        const center = await prisma.educationalCenter.findUnique({ where: { id: centerId } });
        if (!center || center.approval_status !== 'approved') {
          return res.status(400).json({ error: 'Educational center not found or not approved' });
        }
        updates.educational_center_id = centerId;
      }
    }

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.profile_photo_url = fileInfo.url;
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No hay campos válidos para actualizar' });

    const updatedUser = await prisma.user.update({ where: { id }, data: updates });
    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/**
 * Deletes the current authenticated user.
 * @route DELETE /api/users/me
 */
export const deleteSelf = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id: userId } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a user by numeric id.
 *
 * Note: Ownership enforcement is performed in the router.
 *
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const idParam = req.params.id;
    // protect against receiving 'me' or invalid strings
    if (idParam === 'me') return res.status(400).json({ error: "Use /me endpoint to delete your own account" });

    const user = await prisma.user.findUnique({ where: { id: idParam } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.delete({ where: { id: idParam } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
