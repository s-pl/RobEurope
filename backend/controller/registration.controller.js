import db from '../models/index.js';
const { Registration } = db;
import { Op } from 'sequelize';

export const createRegistration = async (req, res) => {
  try {
    const item = await Registration.create(req.body);
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

    const items = await Registration.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['registration_date', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
