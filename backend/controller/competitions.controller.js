import db from '../models/index.js';
const { Competition } = db;
import { Op } from 'sequelize';

export const createCompetition = async (req, res) => {
  try {
    const comp = await Competition.create(req.body);
    res.status(201).json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompetitions = async (req, res) => {
  try {
    const { q, country_id, limit = 50, offset = 0, sort = 'id' } = req.query;
    const where = {};
    if (q) where.title = { [Op.like]: `%${q}%` };
    if (country_id) where.country_id = country_id;

    const items = await Competition.findAll({ where, limit: Number(limit), offset: Number(offset), order: [[sort, 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompetitionById = async (req, res) => {
  try {
    const item = await Competition.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Competition not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCompetition = async (req, res) => {
  try {
    const [updated] = await Competition.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Competition not found' });
    const updatedItem = await Competition.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCompetition = async (req, res) => {
  try {
    const deleted = await Competition.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Competition not found' });
    res.json({ message: 'Competition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
