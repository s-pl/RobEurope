import prisma from '../lib/prisma.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

/**
 * @fileoverview
 * CRUD handlers for in-app notifications.
 *
 * Every endpoint enforces ownership: users can only access their own notifications.
 */

/**
 * Creates a notification.
 *
 * @route POST /api/notifications
 */
export const createNotification = async (req, res) => {
  try {
    const item = await prisma.notification.create({ data: req.body });
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
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { is_read } = req.query;
    const where = { user_id: userId };
    if (typeof is_read !== 'undefined') where.is_read = is_read === 'true' || is_read === '1';

    const { limit, offset, page, pageSize } = parsePagination(req.query);

    const [rows, count] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { created_at: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    res.json(paginatedResponse({ rows, count }, { page, pageSize }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a single notification by id (ownership enforced).
 * @route GET /api/notifications/:id
 */
export const getNotificationById = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
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
 */
export const updateNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    const updated = await prisma.notification.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Marks all notifications as read for the authenticated user.
 * @route PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const result = await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });

    res.json({ message: 'All notifications marked as read', updated: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Marks a single notification as read (ownership enforced).
 *
 * @route PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { is_read: true } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a notification (ownership enforced).
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Notification not found' });
    if (item.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
