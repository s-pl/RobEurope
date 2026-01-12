/**
 * @fileoverview System log querying and stats endpoints.
 *
 * These endpoints are intended to be protected by route-level middleware
 * (authentication + `super_admin`).
 */

import db from '../models/index.js';
const { SystemLog, User } = db;
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

/**
 * Express request.
 * @typedef {object} Request
 * @property {object} params
 * @property {object} query
 */

/**
 * Express response.
 * @typedef {object} Response
 * @property {Function} status
 * @property {Function} json
 */

/**
 * Get system logs with filtering and pagination.
 *
 * Supports filters: `user_id`, `action`, `entity_type`, `entity_id`, `date_from`, `date_to`.
 *
 * @route GET /api/system_log
 * @param {Request} req
 * @param {Response} res
 */
export const getSystemLogs = async (req, res) => {
  try {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      date_from,
      date_to,
      limit = 50,
      offset = 0,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const where = {};

    // Apply filters
    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = entity_id;

    // Date range filter
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }

    const logs = await SystemLog.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [[sort, order.toUpperCase()]],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'role']
        }
      ]
    });

    // Get total count for pagination
    const total = await SystemLog.count({ where });

    res.json({
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: (Number(offset) + logs.length) < total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a single system log entry by id.
 *
 * @route GET /api/system_log/:id
 * @param {Request} req
 * @param {Response} res
 */
export const getSystemLogById = async (req, res) => {
  try {
    const log = await SystemLog.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'role']
        }
      ]
    });

    if (!log) return res.status(404).json({ error: 'System log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get aggregated system log statistics.
 *
 * Returns action counts, entity-type counts, daily counts, and top users.
 *
 * @route GET /api/system_log/stats
 * @param {Request} req
 * @param {Response} res
 */
export const getSystemStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Build date filter
    const dateWhere = {};
    if (date_from || date_to) {
      dateWhere.created_at = {};
      if (date_from) dateWhere.created_at[Op.gte] = new Date(date_from);
      if (date_to) dateWhere.created_at[Op.lte] = new Date(date_to);
    }

    // Get action counts
    const actionStats = await SystemLog.findAll({
      attributes: [
        'action',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: dateWhere,
      group: ['action'],
      raw: true
    });

    // Get entity type counts
    const entityStats = await SystemLog.findAll({
      attributes: [
        'entity_type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: dateWhere,
      group: ['entity_type'],
      raw: true
    });

    // Get daily activity for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await SystemLog.findAll({
      attributes: [
        [Sequelize.literal('DATE(created_at)'), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        },
        ...dateWhere
      },
      group: [Sequelize.literal('DATE(created_at)')],
      order: [[Sequelize.literal('DATE(created_at)'), 'ASC']],
      raw: true
    });

    // Get top active users
    const userWhere = {
      user_id: { [Op.ne]: null }
    };
    if (dateWhere.created_at) {
      userWhere.created_at = dateWhere.created_at;
    }

    const userStatsRaw = await SystemLog.findAll({
      attributes: [
        'user_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: userWhere,
      group: ['user_id'],
      order: [[Sequelize.literal('COUNT(id)'), 'DESC']],
      limit: 10,
      raw: true
    });

    // Get user details for the top users
    const userIds = userStatsRaw.map(stat => stat.user_id);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'first_name', 'last_name', 'username', 'email']
    });

    // Combine the stats with user info
    const userStats = userStatsRaw.map(stat => {
      const user = users.find(u => u.id === stat.user_id);
      return {
        ...stat,
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          email: user.email
        } : null
      };
    });

    res.json({
      actionStats,
      entityStats,
      dailyStats,
      userStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete system logs older than N days.
 *
 * @route DELETE /api/system_log/cleanup
 * @param {Request} req
 * @param {Response} res
 */
export const deleteOldLogs = async (req, res) => {
  try {
    const { days_old = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days_old));

    const deletedCount = await SystemLog.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    res.json({
      message: `Deleted ${deletedCount} old system logs`,
      deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};