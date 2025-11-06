import db from '../models/index.js';
const { TeamMembers } = db;
import { Op } from 'sequelize';

export const createTeamMember = async (req, res) => {
  try {
    const item = await TeamMembers.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const { team_id, user_id, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (team_id) where.team_id = team_id;
    if (user_id) where.user_id = user_id;

    const items = await TeamMembers.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['joined_at', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamMemberById = async (req, res) => {
  try {
    const item = await TeamMembers.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'TeamMember not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    const [updated] = await TeamMembers.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'TeamMember not found' });
    const updatedItem = await TeamMembers.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    const deleted = await TeamMembers.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'TeamMember not found' });
    res.json({ message: 'TeamMember deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
