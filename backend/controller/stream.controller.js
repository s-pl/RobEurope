import db from '../models/index.js';
const { Stream } = db;
import { Op } from 'sequelize';

export const createStream = async (req, res) => {
  try {
    const streamData = { ...req.body };
    const item = await Stream.create(streamData);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStreams = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0, status } = req.query;
    const where = {};
    if (q) where.title = { [Op.like]: `%${q}%` };
    if (status) where.status = status;
    const items = await Stream.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
      include: [{
        model: db.Competition,
        as: 'competition',
        required: false
      }, {
        model: db.Team,
        as: 'team',
        required: true
      }]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStreamById = async (req, res) => {
  try {
    const item = await Stream.findByPk(req.params.id, {
      include: [{
        model: db.Competition,
        as: 'competition',
        required: false
      }, {
        model: db.Team,
        as: 'team',
        required: true
      }]
    });
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStream = async (req, res) => {
  try {
    const updates = { ...req.body };
    const [updated] = await Stream.update(updates, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Stream not found' });
    const updatedItem = await Stream.findByPk(req.params.id, {
      include: [{
        model: db.Competition,
        as: 'competition',
        required: false
      }]
    });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStream = async (req, res) => {
  try {
    const deleted = await Stream.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Stream not found' });
    res.json({ message: 'Stream deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
