/**
 * @fileoverview Competition CRUD and discovery endpoints.
 *
 * Includes listing/searching competitions, reading a competition (with access-based
 * hiding of sensitive fields), admin-only CRUD, and per-user favorites stored in Redis.
 */

import prisma from '../lib/prisma.js';
import redisClient from '../utils/redis.js';
import { getIO } from '../utils/realtime.js';

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const createCompetition = async (req, res) => {
  try {
    if (req.body.is_active) {
      await prisma.competition.updateMany({ data: { is_active: false } });
    }

    let slug = req.body.slug;
    if (!slug && req.body.title) {
      slug = generateSlug(req.body.title);
    }

    if (slug) {
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.competition.findFirst({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      req.body.slug = uniqueSlug;
    }

    const comp = await prisma.competition.create({ data: req.body });
    getIO()?.emit('competition_created', comp);
    res.status(201).json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * List competitions with optional filtering.
 *
 * @route GET /api/competitions
 */
export const getCompetitions = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0, sort = 'id', order = 'ASC', is_active, start_date_from, start_date_to, withCount } = req.query;
    const where = {};
    if (q) where.title = { contains: q, mode: 'insensitive' };
    if (typeof is_active !== 'undefined') where.is_active = String(is_active) === 'true';
    if (start_date_from || start_date_to) {
      where.start_date = {};
      if (start_date_from) where.start_date.gte = new Date(start_date_from);
      if (start_date_to) where.start_date.lte = new Date(start_date_to);
    }

    const orderBy = { [sort]: String(order).toLowerCase() === 'desc' ? 'desc' : 'asc' };

    if (String(withCount) === 'true') {
      const [items, total] = await prisma.$transaction([
        prisma.competition.findMany({ where, take: Number(limit), skip: Number(offset), orderBy }),
        prisma.competition.count({ where })
      ]);
      // Attach teams_registered count
      const withRegistered = await Promise.all(items.map(async (comp) => {
        const teams_registered = await prisma.registration.count({
          where: { competition_id: comp.id, status: 'approved' }
        });
        return { ...comp, teams_registered };
      }));
      return res.json({ items: withRegistered, total });
    }

    const items = await prisma.competition.findMany({ where, take: Number(limit), skip: Number(offset), orderBy });
    const withRegistered = await Promise.all(items.map(async (comp) => {
      const teams_registered = await prisma.registration.count({
        where: { competition_id: comp.id, status: 'approved' }
      });
      return { ...comp, teams_registered };
    }));
    return res.json(withRegistered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Favorites (stored in Redis set per user) ---
const favKey = (userId) => `user:${userId}:favorites:competitions`;

/**
 * Add a competition to the current user's favorites (Redis set).
 *
 * @route POST /api/competitions/:id/favorite
 */
export const addFavoriteCompetition = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const compId = String(req.params.id);
    await redisClient.sAdd(favKey(userId), compId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Remove a competition from the current user's favorites (Redis set).
 *
 * @route DELETE /api/competitions/:id/favorite
 */
export const removeFavoriteCompetition = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const compId = String(req.params.id);
    await redisClient.sRem(favKey(userId), compId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * List the current user's favorite competitions.
 *
 * @route GET /api/competitions/favorites/mine
 */
export const listFavoriteCompetitions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const ids = await redisClient.sMembers(favKey(userId));
    if (!ids || !ids.length) return res.json([]);
    const items = await prisma.competition.findMany({ where: { id: { in: ids.map(s => Number(s)) } } });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get a competition by id.
 *
 * If the requesting user is not approved (via an approved team registration),
 * sensitive fields like `stream_url` are omitted.
 *
 * @route GET /api/competitions/:id
 */
export const getCompetitionById = async (req, res) => {
  try {
    const item = await prisma.competition.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Competition not found' });

    // Check if user is approved for this competition
    let isApproved = false;
    const currentUser = req.user || req.session?.user;

    if (currentUser) {
      const userTeams = await prisma.teamMember.findMany({ where: { user_id: currentUser.id, left_at: null } });
      const teamIds = userTeams.map(tm => tm.team_id);

      if (teamIds.length > 0) {
        const registration = await prisma.registration.findFirst({
          where: {
            competition_id: item.id,
            team_id: { in: teamIds },
            status: 'approved'
          }
        });
        if (registration) isApproved = true;
      }
    }

    const result = { ...item, is_approved: isApproved };

    // Hide sensitive info if not approved
    if (!isApproved) {
      delete result.stream_url;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a competition (super_admin only).
 *
 * When `is_active` is set true, this deactivates any other active competition.
 * Emits `competition_updated` via Socket.IO.
 *
 * @route PUT /api/competitions/:id
 */
export const updateCompetition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.competition.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Competition not found' });

    if (req.body.is_active) {
      await prisma.competition.updateMany({ where: { id: { not: id } }, data: { is_active: false } });
    }

    const updatedItem = await prisma.competition.update({ where: { id }, data: req.body });
    getIO()?.emit('competition_updated', updatedItem);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a competition (super_admin only).
 * Emits `competition_deleted` via Socket.IO.
 *
 * @route DELETE /api/competitions/:id
 */
export const deleteCompetition = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.competition.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Competition not found' });
    await prisma.competition.delete({ where: { id } });
    getIO()?.emit('competition_deleted', { id: req.params.id });
    res.json({ message: 'Competition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
