/**
 * @fileoverview System log querying and stats endpoints.
 *
 * These endpoints are intended to be protected by route-level middleware
 * (authentication + `super_admin`).
 */

import prisma from '../lib/prisma.js';

/**
 * Get system logs with filtering and pagination.
 *
 * @route GET /api/system_log
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

    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = entity_id;

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) where.created_at.lte = new Date(date_to);
    }

    const orderBy = { [sort]: String(order).toLowerCase() === 'desc' ? 'desc' : 'asc' };

    const [logs, total] = await prisma.$transaction([
      prisma.systemLog.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy,
        include: {
          user: { select: { id: true, first_name: true, last_name: true, username: true, email: true, role: true } }
        }
      }),
      prisma.systemLog.count({ where })
    ]);

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
 */
export const getSystemLogById = async (req, res) => {
  try {
    const log = await prisma.systemLog.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, first_name: true, last_name: true, username: true, email: true, role: true } }
      }
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
 * @route GET /api/system_log/stats
 */
export const getSystemStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    const dateWhere = {};
    if (date_from || date_to) {
      dateWhere.created_at = {};
      if (date_from) dateWhere.created_at.gte = new Date(date_from);
      if (date_to) dateWhere.created_at.lte = new Date(date_to);
    }

    // Get action counts
    const actionStatsRaw = await prisma.systemLog.groupBy({
      by: ['action'],
      where: dateWhere,
      _count: { id: true }
    });
    const actionStats = actionStatsRaw.map(r => ({ action: r.action, count: r._count.id }));

    // Get entity type counts
    const entityStatsRaw = await prisma.systemLog.groupBy({
      by: ['entity_type'],
      where: dateWhere,
      _count: { id: true }
    });
    const entityStats = entityStatsRaw.map(r => ({ entity_type: r.entity_type, count: r._count.id }));

    // Get daily activity for the last 30 days via raw SQL
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.$queryRaw`
      SELECT DATE("created_at") AS date, COUNT(id)::int AS count
      FROM "SystemLog"
      WHERE "created_at" >= ${thirtyDaysAgo}
      GROUP BY DATE("created_at")
      ORDER BY DATE("created_at") ASC
    `;

    // Get top active users
    const userStatsRaw = await prisma.systemLog.groupBy({
      by: ['user_id'],
      where: { user_id: { not: null }, ...dateWhere },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const userIds = userStatsRaw.map(s => s.user_id).filter(Boolean);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, first_name: true, last_name: true, username: true, email: true }
        })
      : [];

    const userStats = userStatsRaw.map(stat => {
      const user = users.find(u => u.id === stat.user_id) || null;
      return { user_id: stat.user_id, count: stat._count.id, user };
    });

    res.json({ actionStats, entityStats, dailyStats, userStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete system logs older than N days.
 *
 * @route DELETE /api/system_log/cleanup
 */
export const deleteOldLogs = async (req, res) => {
  try {
    const { days_old = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days_old));

    const result = await prisma.systemLog.deleteMany({
      where: { created_at: { lt: cutoffDate } }
    });

    res.json({
      message: `Deleted ${result.count} old system logs`,
      deletedCount: result.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
