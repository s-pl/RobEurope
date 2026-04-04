import prisma from '../lib/prisma.js';
import { Parser as Json2CsvParser } from 'json2csv';

/**
 * @fileoverview
 * API handlers for competition registrations.
 *
 * Registrations are protected by session auth at the API router level.
 * Admin actions (approve/reject/export) are further protected via `requireRole('super_admin')`.
 * Center admins can approve/reject registrations for teams in their center.
 */

const isSuperAdmin = (user) => user?.role === 'super_admin';
const isCenterAdmin = (user) => user?.role === 'center_admin';
const isCenterAdminForTeam = (user, team) => {
  if (!isCenterAdmin(user)) return false;
  return user.educational_center_id && user.educational_center_id === team?.educational_center_id;
};

/**
 * Creates a registration.
 *
 * @route POST /api/registrations
 */
export const createRegistration = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      registration_date: new Date(),
      status: 'pending'
    };

    // Prevent duplicate registrations
    if (payload.team_id && payload.competition_id) {
      const existing = await prisma.registration.findFirst({
        where: { team_id: Number(payload.team_id), competition_id: Number(payload.competition_id) }
      });
      if (existing) {
        return res.status(409).json({ error: 'Este equipo ya está inscrito en esta competición' });
      }
    }

    if (payload.team_id) payload.team_id = Number(payload.team_id);
    if (payload.competition_id) payload.competition_id = Number(payload.competition_id);

    const item = await prisma.registration.create({ data: payload });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lists registrations.
 *
 * @route GET /api/registrations
 */
export const getRegistrations = async (req, res) => {
  try {
    const { competition_id, team_id, status, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (competition_id) where.competition_id = Number(competition_id);
    if (team_id) where.team_id = Number(team_id);
    if (status) where.status = status;

    const items = await prisma.registration.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { registration_date: 'desc' },
      include: { team: true }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Exports registrations as a CSV.
 * @route GET /api/registrations/export
 */
export const exportRegistrationsCSV = async (req, res) => {
  try {
    const { competition_id, status } = req.query;
    const where = {};
    if (competition_id) where.competition_id = Number(competition_id);
    if (status) where.status = status;

    const items = await prisma.registration.findMany({
      where,
      include: { team: { select: { id: true, name: true } } },
      orderBy: { registration_date: 'desc' }
    });

    const rows = items.map(r => ({
      id: r.id,
      competition_id: r.competition_id,
      team_id: r.team_id,
      team_name: r.team ? r.team.name : '',
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
 */
export const getRegistrationById = async (req, res) => {
  try {
    const item = await prisma.registration.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Registration not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a registration by id.
 * @route PUT /api/registrations/:id
 */
export const updateRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.registration.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Registration not found' });
    const updatedItem = await prisma.registration.update({ where: { id }, data: req.body });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a registration by id.
 * @route DELETE /api/registrations/:id
 */
export const deleteRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.registration.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Registration not found' });
    await prisma.registration.delete({ where: { id } });
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approves a pending registration.
 * @route POST /api/registrations/:id/approve
 */
export const approveRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { decision_reason } = req.body || {};
    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'approved', decision_reason: decision_reason || null }
    });

    // Notify team owner
    try {
      const team = await prisma.team.findUnique({ where: { id: reg.team_id } });
      if (team && team.created_by_user_id) {
        await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Registro aprobado',
            message: `Tu equipo ha sido aprobado para la competición ${reg.competition_id}`,
            type: 'registration_team_status'
          }
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rejects a pending registration.
 * @route POST /api/registrations/:id/reject
 */
export const rejectRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { decision_reason } = req.body || {};
    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });

    const updated = await prisma.registration.update({
      where: { id },
      data: { status: 'rejected', decision_reason: decision_reason || null }
    });

    // Notify team owner
    try {
      const team = await prisma.team.findUnique({ where: { id: reg.team_id } });
      if (team && team.created_by_user_id) {
        await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Registro rechazado',
            message: `Tu equipo fue rechazado en la competición ${reg.competition_id}`,
            type: 'registration_team_status'
          }
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Center admin approves a registration for a team in their center.
 * @route POST /api/registrations/:id/center-approve
 */
export const centerApproveRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { center_approval_reason } = req.body || {};

    const reg = await prisma.registration.findUnique({
      where: { id },
      include: { team: true }
    });

    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    if (!isSuperAdmin(req.user) && !isCenterAdminForTeam(req.user, reg.team)) {
      return res.status(403).json({ error: 'No tienes permisos para aprobar esta inscripción' });
    }

    if (reg.center_approval_status !== 'pending') {
      return res.status(400).json({ error: 'La aprobación del centro ya no está pendiente' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        center_approval_status: 'approved',
        center_approval_reason: center_approval_reason || 'Aprobado por el centro',
        center_approved_by: req.user.id,
        center_approved_at: new Date()
      },
      include: { team: true }
    });

    // Notify team owner
    try {
      if (reg.team && reg.team.created_by_user_id) {
        await prisma.notification.create({
          data: {
            user_id: reg.team.created_by_user_id,
            title: 'Inscripción aprobada por el centro',
            message: `Tu equipo ha sido aprobado por el centro educativo para la competición ${reg.competition_id}`,
            type: 'registration_team_status'
          }
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Center admin rejects a registration for a team in their center.
 * @route POST /api/registrations/:id/center-reject
 */
export const centerRejectRegistration = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { center_approval_reason } = req.body || {};

    if (!center_approval_reason || !center_approval_reason.trim()) {
      return res.status(400).json({ error: 'Se requiere una razón para el rechazo' });
    }

    const reg = await prisma.registration.findUnique({
      where: { id },
      include: { team: true }
    });

    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    if (!isSuperAdmin(req.user) && !isCenterAdminForTeam(req.user, reg.team)) {
      return res.status(403).json({ error: 'No tienes permisos para rechazar esta inscripción' });
    }

    if (reg.center_approval_status !== 'pending') {
      return res.status(400).json({ error: 'La aprobación del centro ya no está pendiente' });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        center_approval_status: 'rejected',
        center_approval_reason: center_approval_reason.trim(),
        center_approved_by: req.user.id,
        center_approved_at: new Date()
      },
      include: { team: true }
    });

    // Notify team owner
    try {
      if (reg.team && reg.team.created_by_user_id) {
        await prisma.notification.create({
          data: {
            user_id: reg.team.created_by_user_id,
            title: 'Inscripción rechazada por el centro',
            message: `Tu equipo fue rechazado por el centro educativo: ${center_approval_reason}`,
            type: 'registration_team_status'
          }
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets registrations for the current center admin's educational center.
 * @route GET /api/registrations/my-center
 */
export const getMyCenterRegistrations = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (!isCenterAdmin(req.user) && !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol de administrador de centro' });
    }

    const { competition_id, center_approval_status, limit = 50, offset = 0 } = req.query;

    // Build team filter
    const teamWhere = {};
    if (!isSuperAdmin(req.user)) {
      teamWhere.educational_center_id = req.user.educational_center_id;
    }

    // Get matching teams first
    const teams = await prisma.team.findMany({ where: teamWhere, select: { id: true } });
    const teamIds = teams.map(t => t.id);

    const where = { team_id: { in: teamIds } };
    if (competition_id) where.competition_id = Number(competition_id);
    if (center_approval_status) where.center_approval_status = center_approval_status;

    const items = await prisma.registration.findMany({
      where,
      include: { team: true, competition: true },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { registration_date: 'desc' }
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a registration with optional password-based registration.
 * @route POST /api/registrations/with-password
 */
export const createPasswordRegistration = async (req, res) => {
  try {
    const { team_id, competition_id, registration_password } = req.body;

    if (!registration_password || !registration_password.trim()) {
      return res.status(400).json({ error: 'Se requiere la contraseña de inscripción' });
    }

    const payload = {
      team_id: Number(team_id),
      competition_id: Number(competition_id),
      registration_date: new Date(),
      status: 'pending',
      center_approval_status: 'approved',
      is_password_registration: true,
      registration_password: registration_password.trim()
    };

    const item = await prisma.registration.create({ data: payload });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
