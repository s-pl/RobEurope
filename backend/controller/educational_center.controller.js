/**
 * @fileoverview
 * API handlers for Educational Centers.
 *
 * Educational Centers are institutions/schools that teams belong to.
 * Center admins can manage their center and approve/reject team registrations.
 * @module controller/EducationalCenterController
 */

import prisma from '../lib/prisma.js';

const isSuperAdmin = (user) => user?.role === 'super_admin';
const isCenterAdminFor = (user, centerId) =>
  user?.role === 'center_admin' && user?.educational_center_id === centerId;

/**
 * Lists all educational centers.
 *
 * @route GET /api/educational-centers
 */
export const listEducationalCenters = async (req, res) => {
  try {
    const { status, country_id, search, limit = 50, offset = 0 } = req.query;
    const where = {};

    // Non-admins can only see approved centers
    if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'center_admin')) {
      where.approval_status = 'approved';
    } else if (status) {
      where.approval_status = status;
    }

    if (country_id) {
      where.country_id = Number(country_id);
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await prisma.$transaction([
      prisma.educationalCenter.findMany({
        where,
        include: {
          country: { select: { id: true, name: true, code: true } },
          admin: { select: { id: true, username: true, first_name: true, last_name: true, email: true } }
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { name: 'asc' }
      }),
      prisma.educationalCenter.count({ where })
    ]);

    res.json({
      items,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (err) {
    console.error('Error listing educational centers:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets a single educational center by ID.
 *
 * @route GET /api/educational-centers/:id
 */
export const getEducationalCenterById = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await prisma.educationalCenter.findUnique({
      where: { id: Number(id) },
      include: {
        country: { select: { id: true, name: true, code: true } },
        admin: { select: { id: true, username: true, first_name: true, last_name: true, email: true } },
        teams: { select: { id: true, name: true, logo_url: true, created_at: true } },
        streams: { select: { id: true, title: true, stream_url: true, status: true } }
      }
    });

    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    // Non-admins can only see approved centers
    if (center.approval_status !== 'approved') {
      if (!req.user || (!isSuperAdmin(req.user) && !isCenterAdminFor(req.user, center.id))) {
        return res.status(404).json({ error: 'Centro educativo no encontrado' });
      }
    }

    res.json(center);
  } catch (err) {
    console.error('Error getting educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a new educational center.
 *
 * @route POST /api/educational-centers
 */
export const createEducationalCenter = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const { name, country_id, city, address, website_url, phone, email, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del centro es requerido' });
    }

    // Check if center already exists
    const existing = await prisma.educationalCenter.findFirst({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un centro educativo con este nombre' });
    }

    const centerData = {
      name: name.trim(),
      country_id: country_id ? Number(country_id) : null,
      city: city?.trim() || null,
      address: address?.trim() || null,
      website_url: website_url?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      description: description?.trim() || null,
      admin_user_id: req.user.id,
      approval_status: isSuperAdmin(req.user) ? 'approved' : 'pending',
      approved_at: isSuperAdmin(req.user) ? new Date() : null
    };

    const center = await prisma.educationalCenter.create({ data: centerData });

    // If not super_admin, update the requesting user's educational_center_id
    if (!isSuperAdmin(req.user)) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { educational_center_id: center.id }
      });
    }

    res.status(201).json(center);
  } catch (err) {
    console.error('Error creating educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates an educational center.
 *
 * @route PUT /api/educational-centers/:id
 */
export const updateEducationalCenter = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const { id } = req.params;
    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });

    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    if (!isSuperAdmin(req.user) && !isCenterAdminFor(req.user, center.id)) {
      return res.status(403).json({ error: 'No tienes permisos para editar este centro' });
    }

    const { name, country_id, city, address, website_url, phone, email, description, logo_url } = req.body;

    // Check name uniqueness if changing
    if (name && name.trim() !== center.name) {
      const existing = await prisma.educationalCenter.findFirst({
        where: { name: name.trim(), id: { not: Number(id) } }
      });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un centro educativo con este nombre' });
      }
    }

    const updateData = {
      name: name?.trim() || center.name,
      country_id: country_id !== undefined ? (country_id ? Number(country_id) : null) : center.country_id,
      city: city !== undefined ? city?.trim() : center.city,
      address: address !== undefined ? address?.trim() : center.address,
      website_url: website_url !== undefined ? website_url?.trim() : center.website_url,
      phone: phone !== undefined ? phone?.trim() : center.phone,
      email: email !== undefined ? email?.trim() : center.email,
      description: description !== undefined ? description?.trim() : center.description,
      logo_url: logo_url !== undefined ? logo_url?.trim() : center.logo_url,
    };

    const updated = await prisma.educationalCenter.update({ where: { id: Number(id) }, data: updateData });
    res.json(updated);
  } catch (err) {
    console.error('Error updating educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approves an educational center (super_admin only).
 *
 * @route POST /api/educational-centers/:id/approve
 */
export const approveEducationalCenter = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede aprobar centros' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const updated = await prisma.educationalCenter.update({
      where: { id: Number(id) },
      data: {
        approval_status: 'approved',
        approval_reason: reason || 'Aprobado',
        approved_at: new Date()
      }
    });

    // Update the center admin's role to center_admin
    if (center.admin_user_id) {
      await prisma.user.update({
        where: { id: center.admin_user_id },
        data: { role: 'center_admin' }
      });
    }

    res.json({ message: 'Centro educativo aprobado', center: updated });
  } catch (err) {
    console.error('Error approving educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects an educational center (super_admin only).
 *
 * @route POST /api/educational-centers/:id/reject
 */
export const rejectEducationalCenter = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede rechazar centros' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Se requiere una razón para el rechazo' });
    }

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const updated = await prisma.educationalCenter.update({
      where: { id: Number(id) },
      data: { approval_status: 'rejected', approval_reason: reason.trim() }
    });

    res.json({ message: 'Centro educativo rechazado', center: updated });
  } catch (err) {
    console.error('Error rejecting educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes an educational center (super_admin only).
 *
 * @route DELETE /api/educational-centers/:id
 */
export const deleteEducationalCenter = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede eliminar centros' });
    }

    const { id } = req.params;
    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });

    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    // Remove association from users
    await prisma.user.updateMany({
      where: { educational_center_id: Number(id) },
      data: { educational_center_id: null, role: 'user' }
    });

    // Remove association from teams
    await prisma.team.updateMany({
      where: { educational_center_id: Number(id) },
      data: { educational_center_id: null }
    });

    // Remove association from streams
    await prisma.stream.updateMany({
      where: { educational_center_id: Number(id) },
      data: { educational_center_id: null }
    });

    await prisma.educationalCenter.delete({ where: { id: Number(id) } });

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets teams for a specific educational center.
 *
 * @route GET /api/educational-centers/:id/teams
 */
export const getEducationalCenterTeams = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const teams = await prisma.team.findMany({
      where: { educational_center_id: Number(id) },
      orderBy: { name: 'asc' }
    });

    res.json({ items: teams });
  } catch (err) {
    console.error('Error getting center teams:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets users for a specific educational center.
 *
 * @route GET /api/educational-centers/:id/users
 */
export const getEducationalCenterUsers = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const users = await prisma.user.findMany({
      where: { educational_center_id: Number(id) },
      select: { id: true, first_name: true, last_name: true, email: true, role: true, username: true },
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }]
    });

    res.json({ items: users });
  } catch (err) {
    console.error('Error getting center users:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Removes a user from an educational center (disassociate).
 *
 * @route DELETE /api/educational-centers/:id/users/:userId
 */
export const removeEducationalCenterUser = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (String(user.educational_center_id) !== String(id)) {
      return res.status(400).json({ error: 'El usuario no pertenece a este centro' });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'No se puede modificar un super_admin' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        educational_center_id: null,
        role: user.role === 'center_admin' ? 'user' : user.role
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing center user:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Removes a team from an educational center (disassociate).
 *
 * @route DELETE /api/educational-centers/:id/teams/:teamId
 */
export const removeEducationalCenterTeam = async (req, res) => {
  try {
    const { id, teamId } = req.params;

    const team = await prisma.team.findUnique({ where: { id: Number(teamId) } });
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });

    if (String(team.educational_center_id) !== String(id)) {
      return res.status(400).json({ error: 'El equipo no pertenece a este centro' });
    }

    await prisma.team.update({
      where: { id: Number(teamId) },
      data: { educational_center_id: null }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error removing center team:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets streams for a specific educational center.
 *
 * @route GET /api/educational-centers/:id/streams
 */
export const getEducationalCenterStreams = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const streams = await prisma.stream.findMany({
      where: { educational_center_id: Number(id) },
      orderBy: { created_at: 'desc' }
    });

    res.json({ items: streams });
  } catch (err) {
    console.error('Error getting center streams:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approves an educational center (super_admin only).
 *
 * @route PATCH /api/educational-centers/:id/approve
 */
export const approveCenter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo super_admin puede aprobar centros' });
    }

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const updated = await prisma.educationalCenter.update({
      where: { id: Number(id) },
      data: { approval_status: 'approved', approved_at: new Date() }
    });

    res.json({ message: 'Centro aprobado correctamente', center: updated });
  } catch (err) {
    console.error('Error approving center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects an educational center (super_admin only).
 *
 * @route PATCH /api/educational-centers/:id/reject
 */
export const rejectCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo super_admin puede rechazar centros' });
    }

    const center = await prisma.educationalCenter.findUnique({ where: { id: Number(id) } });
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const updated = await prisma.educationalCenter.update({
      where: { id: Number(id) },
      data: { approval_status: 'rejected', approval_reason: reason || null }
    });

    res.json({ message: 'Centro rechazado', center: updated });
  } catch (err) {
    console.error('Error rejecting center:', err);
    res.status(500).json({ error: err.message });
  }
};
