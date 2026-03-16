import db from '../models/index.js';
const { Notification } = db;
import { Op } from 'sequelize';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

/**
 * @fileoverview
 * CRUD handlers for in-app notifications.
 *
 * Every endpoint enforces ownership: users can only access their own notifications.
 *
 * INDEX RECOMMENDATION:
 * For optimal query performance on the getNotifications endpoint (which filters by
 * user_id + is_read and orders by created_at DESC), add a composite index:
 *
 *   CREATE INDEX idx_notifications_user_read_created
 *     ON Notifications (user_id, is_read, created_at DESC);
 *
 * This covers the most frequent query pattern and avoids full table scans as the
 * notifications table grows.
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
 * Lists notifications for the authenticated user with pagination.
 *
 * Supported query params:
 * - `is_read`: boolean filter
 * - `page`, `limit`/`pageSize`: pagination
 *
 * @route GET /api/notifications
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { is_read } = req.query;
    const where = { user_id: userId };
    if (typeof is_read !== 'undefined') where.is_read = is_read === 'true' || is_read === '1';

    const { limit, offset, page, pageSize } = parsePagination(req.query);

    const result = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json(paginatedResponse(result, { page, pageSize }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a single notification by id (ownership enforced).
 * @route GET /api/notifications/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getNotificationById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a notification (ownership enforced).
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
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Marks all notifications as read for the authenticated user.
 * @route PUT /api/notifications/read-all
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const [updatedCount] = await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({ message: 'All notifications marked as read', updated: updatedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Marks a single notification as read (ownership enforced).
 *
 * This is a lightweight endpoint for one-click "mark as read" in the UI.
 *
 * @route PATCH /api/notifications/:id/read
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    await item.update({ is_read: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a notification (ownership enforced).
 * @route DELETE /api/notifications/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await Notification.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    await item.destroy();
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
