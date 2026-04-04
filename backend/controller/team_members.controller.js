/**
 * @fileoverview Team membership CRUD endpoints.
 */

import prisma from '../lib/prisma.js';

/**
 * Create a team member record.
 *
 * @route POST /api/team_members
 */
export const createTeamMember = async (req, res) => {
  try {
    const item = await prisma.teamMember.create({ data: req.body });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * List team members.
 *
 * Optional query filters: `team_id`, `user_id`.
 *
 * @route GET /api/team_members
 */
export const getTeamMembers = async (req, res) => {
  try {
    const { team_id, user_id, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (team_id) where.team_id = Number(team_id);
    if (user_id) where.user_id = user_id;

    const items = await prisma.teamMember.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { joined_at: 'desc' },
      include: {
        team: { select: { id: true, name: true, logo_url: true } }
      }
    });

    // Enrich with user basic info
    const userIds = [...new Set(items.map(i => i.user_id))];
    let usersById = {};
    if (userIds.length) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, email: true, first_name: true, last_name: true, profile_photo_url: true }
      });
      usersById = Object.fromEntries(users.map(u => [u.id, u]));
    }
    const enriched = items.map(i => {
      const u = usersById[i.user_id];
      return {
        ...i,
        user_username: u?.username || null,
        user_email: u?.email || null,
        user_name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : null,
        user_photo: u?.profile_photo_url || null
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a team member record by id.
 *
 * @route GET /api/team_members/:id
 */
export const getTeamMemberById = async (req, res) => {
  try {
    const item = await prisma.teamMember.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'TeamMember not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a team member record by id.
 *
 * @route PUT /api/team_members/:id
 */
export const updateTeamMember = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'TeamMember not found' });
    const updatedItem = await prisma.teamMember.update({ where: { id }, data: req.body });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a team member record by id.
 *
 * @route DELETE /api/team_members/:id
 */
export const deleteTeamMember = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'TeamMember not found' });
    await prisma.teamMember.delete({ where: { id } });
    res.json({ message: 'TeamMember deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
