/**
 * @fileoverview
 * API handlers for Educational Centers.
 * 
 * Educational Centers are institutions/schools that teams belong to.
 * Center admins can manage their center and approve/reject team registrations.
 * @module controller/EducationalCenterController
 */

import db from '../models/index.js';
import { Op } from 'sequelize';

const { EducationalCenter, User, Team, Stream, Country } = db;

/**
 * Checks if user is super_admin.
 * @param {Object} user - Session user.
 * @returns {boolean}
 */
const isSuperAdmin = (user) => user?.role === 'super_admin';

/**
 * Checks if user is center_admin for a specific center.
 * @param {Object} user - Session user.
 * @param {number} centerId - Center ID.
 * @returns {boolean}
 */
const isCenterAdminFor = (user, centerId) => {
  return user?.role === 'center_admin' && user?.educational_center_id === centerId;
};

/**
 * Lists all educational centers.
 * Public users see only approved centers.
 * Admins see all centers.
 *
 * @route GET /api/educational-centers
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
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
      where.country_id = country_id;
    }
    
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    
    const centers = await EducationalCenter.findAndCountAll({
      where,
      include: [
        { model: Country, as: 'country', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'admin', attributes: ['id', 'username', 'first_name', 'last_name', 'email'] }
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [['name', 'ASC']]
    });
    
    res.json({
      items: centers.rows,
      total: centers.count,
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
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getEducationalCenterById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const center = await EducationalCenter.findByPk(id, {
      include: [
        { model: Country, as: 'country', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'admin', attributes: ['id', 'username', 'first_name', 'last_name', 'email'] },
        { 
          model: Team, 
          as: 'teams',
          attributes: ['id', 'name', 'logo_url', 'created_at']
        },
        {
          model: Stream,
          as: 'streams',
          attributes: ['id', 'title', 'stream_url', 'status']
        }
      ]
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
 * Can be created by super_admin or by a user requesting to be center_admin.
 *
 * @route POST /api/educational-centers
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
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
    const existing = await EducationalCenter.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un centro educativo con este nombre' });
    }
    
    const centerData = {
      name: name.trim(),
      country_id: country_id || null,
      city: city?.trim() || null,
      address: address?.trim() || null,
      website_url: website_url?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      description: description?.trim() || null,
      admin_user_id: req.user.id,
      // Super admin can directly approve, others need approval
      approval_status: isSuperAdmin(req.user) ? 'approved' : 'pending',
      approved_at: isSuperAdmin(req.user) ? new Date() : null
    };
    
    const center = await EducationalCenter.create(centerData);
    
    // If not super_admin, update the requesting user's role to center_admin (pending)
    if (!isSuperAdmin(req.user)) {
      await User.update(
        { educational_center_id: center.id },
        { where: { id: req.user.id } }
      );
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
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const updateEducationalCenter = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }
    
    const { id } = req.params;
    const center = await EducationalCenter.findByPk(id);
    
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }
    
    // Check permissions: super_admin or center_admin for this center
    if (!isSuperAdmin(req.user) && !isCenterAdminFor(req.user, center.id)) {
      return res.status(403).json({ error: 'No tienes permisos para editar este centro' });
    }
    
    const { name, country_id, city, address, website_url, phone, email, description, logo_url } = req.body;
    
    // Check name uniqueness if changing
    if (name && name.trim() !== center.name) {
      const existing = await EducationalCenter.findOne({ 
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        } 
      });
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un centro educativo con este nombre' });
      }
    }
    
    const updateData = {
      name: name?.trim() || center.name,
      country_id: country_id !== undefined ? country_id : center.country_id,
      city: city !== undefined ? city?.trim() : center.city,
      address: address !== undefined ? address?.trim() : center.address,
      website_url: website_url !== undefined ? website_url?.trim() : center.website_url,
      phone: phone !== undefined ? phone?.trim() : center.phone,
      email: email !== undefined ? email?.trim() : center.email,
      description: description !== undefined ? description?.trim() : center.description,
      logo_url: logo_url !== undefined ? logo_url?.trim() : center.logo_url,
      updated_at: new Date()
    };
    
    await center.update(updateData);
    
    res.json(center);
  } catch (err) {
    console.error('Error updating educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approves an educational center (super_admin only).
 *
 * @route POST /api/educational-centers/:id/approve
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const approveEducationalCenter = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede aprobar centros' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;
    
    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }
    
    await center.update({
      approval_status: 'approved',
      approval_reason: reason || 'Aprobado',
      approved_at: new Date(),
      updated_at: new Date()
    });
    
    // Update the center admin's role to center_admin
    if (center.admin_user_id) {
      await User.update(
        { role: 'center_admin' },
        { where: { id: center.admin_user_id } }
      );
    }
    
    res.json({ message: 'Centro educativo aprobado', center });
  } catch (err) {
    console.error('Error approving educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects an educational center (super_admin only).
 *
 * @route POST /api/educational-centers/:id/reject
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
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
    
    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }
    
    await center.update({
      approval_status: 'rejected',
      approval_reason: reason.trim(),
      updated_at: new Date()
    });
    
    res.json({ message: 'Centro educativo rechazado', center });
  } catch (err) {
    console.error('Error rejecting educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes an educational center (super_admin only).
 *
 * @route DELETE /api/educational-centers/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const deleteEducationalCenter = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede eliminar centros' });
    }
    
    const { id } = req.params;
    const center = await EducationalCenter.findByPk(id);
    
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }
    
    // Remove association from users
    await User.update(
      { educational_center_id: null, role: 'user' },
      { where: { educational_center_id: id } }
    );
    
    // Remove association from teams
    await Team.update(
      { educational_center_id: null },
      { where: { educational_center_id: id } }
    );
    
    // Remove association from streams
    await Stream.update(
      { educational_center_id: null },
      { where: { educational_center_id: id } }
    );
    
    await center.destroy();
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting educational center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets teams for a specific educational center.
 * Center admins can see all teams, others see only approved.
 *
 * @route GET /api/educational-centers/:id/teams
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getEducationalCenterTeams = async (req, res) => {
  try {
    const { id } = req.params;
    
    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }
    
    const teams = await Team.findAll({
      where: { educational_center_id: id },
      order: [['name', 'ASC']]
    });
    
    res.json({ items: teams });
  } catch (err) {
    console.error('Error getting center teams:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets users for a specific educational center.
 * Center admins can see users from their own center.
 *
 * @route GET /api/educational-centers/:id/users
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getEducationalCenterUsers = async (req, res) => {
  try {
    const { id } = req.params;

    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    const users = await User.findAll({
      where: { educational_center_id: id },
      attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'username'],
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
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
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const removeEducationalCenterUser = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (String(user.educational_center_id) !== String(id)) {
      return res.status(400).json({ error: 'El usuario no pertenece a este centro' });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'No se puede modificar un super_admin' });
    }

    await user.update({ educational_center_id: null, role: user.role === 'center_admin' ? 'user' : user.role });
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
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const removeEducationalCenterTeam = async (req, res) => {
  try {
    const { id, teamId } = req.params;

    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });

    if (String(team.educational_center_id) !== String(id)) {
      return res.status(400).json({ error: 'El equipo no pertenece a este centro' });
    }

    await team.update({ educational_center_id: null });
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
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getEducationalCenterStreams = async (req, res) => {
  try {
    const { id } = req.params;
    
    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }
    
    const streams = await Stream.findAll({
      where: { educational_center_id: id },
      order: [['created_at', 'DESC']]
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
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const approveCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.session?.user?.id;

    if (!isSuperAdmin(req.session?.user)) {
      return res.status(403).json({ error: 'Solo super_admin puede aprobar centros' });
    }

    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    await center.update({
      approval_status: 'approved',
      approved_by_user_id: adminUserId,
      approved_at: new Date()
    });

    res.json({ message: 'Centro aprobado correctamente', center });
  } catch (err) {
    console.error('Error approving center:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects an educational center (super_admin only).
 *
 * @route PATCH /api/educational-centers/:id/reject
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const rejectCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isSuperAdmin(req.session?.user)) {
      return res.status(403).json({ error: 'Solo super_admin puede rechazar centros' });
    }

    const center = await EducationalCenter.findByPk(id);
    if (!center) {
      return res.status(404).json({ error: 'Centro educativo no encontrado' });
    }

    await center.update({
      approval_status: 'rejected',
      rejection_reason: reason || null
    });

    res.json({ message: 'Centro rechazado', center });
  } catch (err) {
    console.error('Error rejecting center:', err);
    res.status(500).json({ error: err.message });
  }
};
