/**
 * @fileoverview Team log endpoints.
 */

import prisma from '../lib/prisma.js';

/**
 * Create a team log entry.
 *
 * @route POST /api/team_log
 */
export const createLogEntry = async (req, res) => {
  try {
    const { team_id, competition_id, content } = req.body;

    // Check permissions
    const membership = await prisma.teamMember.findFirst({
      where: { team_id: Number(team_id), user_id: req.user.id, left_at: null }
    });

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const log = await prisma.teamLog.create({
      data: {
        team_id: Number(team_id),
        competition_id: Number(competition_id),
        content,
        author_id: req.user.id
      }
    });

    const logWithAuthor = await prisma.teamLog.findUnique({
      where: { id: log.id },
      include: { author: { select: { username: true } } }
    });

    res.status(201).json(logWithAuthor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get team log entries for a team and competition.
 *
 * @route GET /api/team_log
 */
export const getTeamLogs = async (req, res) => {
  try {
    const { team_id, competition_id } = req.query;

    if (!team_id || !competition_id) {
      return res.status(400).json({ error: 'team_id and competition_id are required' });
    }

    const logs = await prisma.teamLog.findMany({
      where: { team_id: Number(team_id), competition_id: Number(competition_id) },
      include: { author: { select: { username: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a team log entry.
 *
 * @route DELETE /api/team_log/:id
 */
export const deleteLogEntry = async (req, res) => {
  try {
    const logId = Number(req.params.id);
    const log = await prisma.teamLog.findUnique({ where: { id: logId } });
    if (!log) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    // Check permissions
    const membership = await prisma.teamMember.findFirst({
      where: { team_id: log.team_id, user_id: req.user.id, left_at: null }
    });
    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }
    await prisma.teamLog.delete({ where: { id: logId } });
    res.json({ message: 'Log entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
