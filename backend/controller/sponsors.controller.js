import db from '../models/index.js';
const { Sponsor } = db;
import { Op } from 'sequelize';

export const createSponsor = async (req, res) => {
  try {
    const item = await Sponsor.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSponsors = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    const items = await Sponsor.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSponsorById = async (req, res) => {
  try {
    const item = await Sponsor.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Sponsor not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSponsor = async (req, res) => {
  try {
    const [updated] = await Sponsor.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Sponsor not found' });
    const updatedItem = await Sponsor.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSponsor = async (req, res) => {
  try {
    const deleted = await Sponsor.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Sponsor not found' });
    res.json({ message: 'Sponsor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
