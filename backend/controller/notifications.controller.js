import db from '../models/index.js';
const { Notification } = db;
import { Op } from 'sequelize';

/**
 * @fileoverview
 * CRUD handlers for in-app notifications.
 *
 * Notes:
 * - This controller currently does not enforce auth/ownership by itself; routes must protect access.
 * - Notifications are typically created by other business flows (teams, registration, etc.).
 */

/**
 * Creates a notification.
 *
 * @route POST /api/notifications
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const createNotification = async (req, res) => {
  try {
    const item = await Notification.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lists notifications filtered by query params.
 *
 * Supported query params:
 * - `user_id`: filter by recipient
 * - `is_read`: boolean
 * - `limit`, `offset`: pagination
 *
 * @route GET /api/notifications
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
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

/**
 * Retrieves a single notification by id.
 * @route GET /api/notifications/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getNotificationById = async (req, res) => {
  try {
    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a notification.
 *
 * Common usage is to set `{ is_read: true }`.
 *
 * @route PUT /api/notifications/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
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

/**
 * Deletes a notification.
 * @route DELETE /api/notifications/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
