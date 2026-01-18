import db from '../models/index.js';
const { Registration, Team, Notification, EducationalCenter, User } = db;
import { Op } from 'sequelize';
import { Parser as Json2CsvParser } from 'json2csv';

/**
 * @fileoverview
 * API handlers for competition registrations.
 *
 * Registrations are protected by session auth at the API router level.
 * Admin actions (approve/reject/export) are further protected via `requireRole('super_admin')`.
 * Center admins can approve/reject registrations for teams in their center.
 */

/**
 * Checks if user is super_admin.
 * @param {Object} user - Session user.
 * @returns {boolean}
 */
const isSuperAdmin = (user) => user?.role === 'super_admin';

/**
 * Checks if user is center_admin.
 * @param {Object} user - Session user.
 * @returns {boolean}
 */
const isCenterAdmin = (user) => user?.role === 'center_admin';

/**
 * Checks if user is center_admin for a specific team's educational center.
 * @param {Object} user - Session user.
 * @param {Object} team - Team object.
 * @returns {boolean}
 */
const isCenterAdminForTeam = (user, team) => {
  if (!isCenterAdmin(user)) return false;
  return user.educational_center_id && user.educational_center_id === team?.educational_center_id;
};
 */

/**
 * Creates a registration.
 *
 * Sets `registration_date` and forces `status = 'pending'`.
 *
 * @route POST /api/registrations
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const createRegistration = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      registration_date: new Date(),
      status: 'pending' // Ensure status is pending for new registrations
    };
    const item = await Registration.create(payload);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lists registrations.
 *
 * Query params:
 * - `competition_id`, `team_id`, `status`
 * - `limit`, `offset`
 *
 * @route GET /api/registrations
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getRegistrations = async (req, res) => {
  try {
    const { competition_id, team_id, status, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (competition_id) where.competition_id = competition_id;
    if (team_id) where.team_id = team_id;
    if (status) where.status = status;

    const items = await Registration.findAll({ 
      where, 
      limit: Number(limit), 
      offset: Number(offset), 
      order: [['registration_date', 'DESC']],
      include: [{ model: Team }]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Exports registrations as a CSV.
 * @route GET /api/registrations/export
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<any>}
 */
export const exportRegistrationsCSV = async (req, res) => {
  try {
    const { competition_id, status } = req.query;
    const where = {};
    if (competition_id) where.competition_id = competition_id;
    if (status) where.status = status;

    const items = await Registration.findAll({ 
      where,
      include: [{ model: Team, attributes: ['id', 'name'] }],
      order: [['registration_date', 'DESC']]
    });

    const rows = items.map(r => ({
      id: r.id,
      competition_id: r.competition_id,
      team_id: r.team_id,
      team_name: r.Team ? r.Team.name : '',
      status: r.status,
      decision_reason: r.decision_reason || '',
      registration_date: r.registration_date ? new Date(r.registration_date).toISOString() : ''
    }));

    const parser = new Json2CsvParser({ fields: ['id','competition_id','team_id','team_name','status','decision_reason','registration_date'] });
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a registration by id.
 * @route GET /api/registrations/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getRegistrationById = async (req, res) => {
  try {
    const item = await Registration.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Registration not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a registration by id.
 * @route PUT /api/registrations/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const updateRegistration = async (req, res) => {
  try {
    const [updated] = await Registration.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Registration not found' });
    const updatedItem = await Registration.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a registration by id.
 * @route DELETE /api/registrations/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const deleteRegistration = async (req, res) => {
  try {
    const deleted = await Registration.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Registration not found' });
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approves a pending registration.
 * @route POST /api/registrations/:id/approve
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const approveRegistration = async (req, res) => {
  try {
    const id = req.params.id;
    const { decision_reason } = req.body || {};
    const reg = await Registration.findByPk(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });
    await reg.update({ status: 'approved', decision_reason: decision_reason || null });
    // Notify team owner
    try {
      const team = await Team.findByPk(reg.team_id);
      if (team) {
        const notif = await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Registro aprobado',
          message: `Tu equipo ha sido aprobado para la competición ${reg.competition_id}`,
          type: 'competition_registration'
        });
      }
    } catch (_) {}
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects a pending registration.
 * @route POST /api/registrations/:id/reject
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const rejectRegistration = async (req, res) => {
  try {
    const id = req.params.id;
    const { decision_reason } = req.body || {};
    const reg = await Registration.findByPk(id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });
    await reg.update({ status: 'rejected', decision_reason: decision_reason || null });
    // Notify team owner
    try {
      const team = await Team.findByPk(reg.team_id);
      if (team) {
        const notif = await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Registro rechazado',
          message: `Tu equipo fue rechazado en la competición ${reg.competition_id}`,
          type: 'competition_registration'
        });
      }
    } catch (_) {}
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Center admin approves a registration for a team in their center.
 * @route POST /api/registrations/:id/center-approve
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const centerApproveRegistration = async (req, res) => {
  try {
    const id = req.params.id;
    const { center_approval_reason } = req.body || {};
    
    const reg = await Registration.findByPk(id, {
      include: [{ model: Team }]
    });
    
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    
    // Check if user is center admin for this team's center
    if (!isSuperAdmin(req.user) && !isCenterAdminForTeam(req.user, reg.Team)) {
      return res.status(403).json({ error: 'No tienes permisos para aprobar esta inscripción' });
    }
    
    if (reg.center_approval_status !== 'pending') {
      return res.status(400).json({ error: 'La aprobación del centro ya no está pendiente' });
    }
    
    await reg.update({ 
      center_approval_status: 'approved', 
      center_approval_reason: center_approval_reason || 'Aprobado por el centro',
      center_approved_by: req.user.id,
      center_approved_at: new Date()
    });
    
    // Notify team owner
    try {
      const team = reg.Team;
      if (team) {
        await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Inscripción aprobada por el centro',
          message: `Tu equipo ha sido aprobado por el centro educativo para la competición ${reg.competition_id}`,
          type: 'competition_registration'
        });
      }
    } catch (_) {}
    
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Center admin rejects a registration for a team in their center.
 * @route POST /api/registrations/:id/center-reject
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const centerRejectRegistration = async (req, res) => {
  try {
    const id = req.params.id;
    const { center_approval_reason } = req.body || {};
    
    if (!center_approval_reason || !center_approval_reason.trim()) {
      return res.status(400).json({ error: 'Se requiere una razón para el rechazo' });
    }
    
    const reg = await Registration.findByPk(id, {
      include: [{ model: Team }]
    });
    
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    
    // Check if user is center admin for this team's center
    if (!isSuperAdmin(req.user) && !isCenterAdminForTeam(req.user, reg.Team)) {
      return res.status(403).json({ error: 'No tienes permisos para rechazar esta inscripción' });
    }
    
    if (reg.center_approval_status !== 'pending') {
      return res.status(400).json({ error: 'La aprobación del centro ya no está pendiente' });
    }
    
    await reg.update({ 
      center_approval_status: 'rejected', 
      center_approval_reason: center_approval_reason.trim(),
      center_approved_by: req.user.id,
      center_approved_at: new Date()
    });
    
    // Notify team owner
    try {
      const team = reg.Team;
      if (team) {
        await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Inscripción rechazada por el centro',
          message: `Tu equipo fue rechazado por el centro educativo: ${center_approval_reason}`,
          type: 'competition_registration'
        });
      }
    } catch (_) {}
    
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets registrations for the current center admin's educational center.
 * @route GET /api/registrations/my-center
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getMyCenterRegistrations = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    if (!isCenterAdmin(req.user) && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol de administrador de centro' });
    }
    
    const { competition_id, center_approval_status, limit = 50, offset = 0 } = req.query;
    
    // Get teams from user's educational center
    const teamWhere = {};
    if (!isSuperAdmin(req.user)) {
      teamWhere.educational_center_id = req.user.educational_center_id;
    }
    
    const where = {};
    if (competition_id) where.competition_id = competition_id;
    if (center_approval_status) where.center_approval_status = center_approval_status;
    
    const items = await Registration.findAll({
      where,
      include: [{
        model: Team,
        where: teamWhere,
        required: true
      }],
      limit: Number(limit),
      offset: Number(offset),
      order: [['registration_date', 'DESC']]
    });
    
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a registration with optional password-based registration.
 * @route POST /api/registrations/with-password
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const createPasswordRegistration = async (req, res) => {
  try {
    const { team_id, competition_id, registration_password } = req.body;
    
    if (!registration_password || !registration_password.trim()) {
      return res.status(400).json({ error: 'Se requiere la contraseña de inscripción' });
    }
    
    // Verify the password is correct for the competition
    // This would typically be stored in the Competition model
    // For now, we'll just mark it as a password-based registration
    
    const payload = {
      team_id,
      competition_id,
      registration_date: new Date(),
      status: 'pending',
      center_approval_status: 'approved', // Password bypass center approval
      is_password_registration: true,
      registration_password: registration_password.trim()
    };
    
    const item = await Registration.create(payload);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
