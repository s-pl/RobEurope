import db from '../models/index.js';
const { Team, User, Country } = db;
import { Op } from 'sequelize';

export const createTeam = async (req, res) => {
  try {
    // Validate foreign keys before attempting insert to return a friendly 400
    const { created_by_user_id, country_id } = req.body;
    if (created_by_user_id) {
      const u = await User.findByPk(created_by_user_id);
      if (!u) return res.status(400).json({ error: `created_by_user_id '${created_by_user_id}' does not exist` });
    }
    if (country_id) {
      // Country may be optional in some deployments
      if (Country) {
        const c = await Country.findByPk(country_id);
        if (!c) return res.status(400).json({ error: `country_id '${country_id}' does not exist` });
      }
    }

    const item = await Team.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    // Map common DB constraint errors to 400 for better client experience
    if (err && err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const { q, country_id, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (country_id) where.country_id = country_id;

    const items = await Team.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const item = await Team.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Team not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const [updated] = await Team.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Team not found' });
    const updatedItem = await Team.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const deleted = await Team.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
