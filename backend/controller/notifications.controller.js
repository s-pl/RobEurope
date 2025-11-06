import db from '../models/index.js';
const { Notification } = db;
import { Op } from 'sequelize';

export const createNotification = async (req, res) => {
  try {
    const item = await Notification.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { user_id, is_read, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (typeof is_read !== 'undefined') where.is_read = is_read === 'true' || is_read === '1';

    const items = await Notification.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['created_at', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const [updated] = await Notification.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Notification not found' });
    const updatedItem = await Notification.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
