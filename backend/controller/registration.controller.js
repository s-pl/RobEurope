import db from '../models/index.js';
const { Registration, Team, Notification } = db;
import { Op } from 'sequelize';
import { Parser as Json2CsvParser } from 'json2csv';

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

export const getRegistrationById = async (req, res) => {
  try {
    const item = await Registration.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Registration not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

export const deleteRegistration = async (req, res) => {
  try {
    const deleted = await Registration.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Registration not found' });
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve registration (admin only)
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

// Reject registration (admin only)
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
