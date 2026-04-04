import prisma from '../lib/prisma.js';

/**
 * @fileoverview
 * Stream API handlers.
 */

/**
 * Creates a stream.
 * @route POST /api/streams
 */
export const createStream = async (req, res) => {
  try {
    const { competition_id, team_id } = req.body;

    if (req.user.role !== 'admin') {
      const membership = await prisma.teamMember.findFirst({
        where: { team_id: Number(team_id), user_id: req.user.id, left_at: null }
      });
      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this team' });
      }
    }

    if (competition_id) {
      const competition = await prisma.competition.findUnique({ where: { id: Number(competition_id) } });
      if (!competition) {
        return res.status(404).json({ error: 'Competition not found' });
      }
      if (!competition.is_active) {
        return res.status(400).json({ error: 'Competition is not active. You cannot start a stream.' });
      }
      const registration = await prisma.registration.findFirst({
        where: { competition_id: Number(competition_id), team_id: Number(team_id), status: 'approved' }
      });
      if (!registration) {
        return res.status(403).json({ error: 'Team is not approved for this competition' });
      }
    }

    const streamData = { ...req.body };
    if (streamData.competition_id) streamData.competition_id = Number(streamData.competition_id);
    if (streamData.team_id) streamData.team_id = Number(streamData.team_id);
    if (streamData.educational_center_id) streamData.educational_center_id = Number(streamData.educational_center_id);

    const item = await prisma.stream.create({ data: streamData });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lists streams.
 * @route GET /api/streams
 */
export const getStreams = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0, status, competition_id } = req.query;
    const where = {};
    if (q) where.title = { contains: q, mode: 'insensitive' };
    if (status) where.status = status;
    if (competition_id) where.competition_id = Number(competition_id);

    let isApproved = false;
    const currentUser = req.user || req.session?.user;

    if (currentUser?.role === 'admin') {
      isApproved = true;
    } else if (competition_id && currentUser) {
      const userTeams = await prisma.teamMember.findMany({ where: { user_id: currentUser.id, left_at: null } });
      const teamIds = userTeams.map(tm => tm.team_id);

      if (teamIds.length > 0) {
        const registration = await prisma.registration.findFirst({
          where: { competition_id: Number(competition_id), team_id: { in: teamIds }, status: 'approved' }
        });
        if (registration) isApproved = true;
      }
    }

    const items = await prisma.stream.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { created_at: 'desc' },
      include: {
        competition: true,
        team: {
          include: { educationalCenter: true }
        }
      }
    });

    if (!isApproved) {
      const sanitized = items.map(s => {
        const { stream_url, ...rest } = s;
        return rest;
      });
      return res.json(sanitized);
    }

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a stream by id.
 * @route GET /api/streams/:id
 */
export const getStreamById = async (req, res) => {
  try {
    const item = await prisma.stream.findUnique({
      where: { id: Number(req.params.id) },
      include: { competition: true, team: true }
    });
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates a stream by id.
 * @route PUT /api/streams/:id
 */
export const updateStream = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.stream.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Stream not found' });
    const updatedItem = await prisma.stream.update({
      where: { id },
      data: req.body,
      include: { competition: true }
    });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes a stream by id.
 * @route DELETE /api/streams/:id
 */
export const deleteStream = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const stream = await prisma.stream.findUnique({ where: { id } });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    if (req.user.role !== 'admin') {
      if (!stream.team_id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      const membership = await prisma.teamMember.findFirst({
        where: { team_id: stream.team_id, user_id: req.user.id, role: 'owner', left_at: null }
      });
      if (!membership) {
        return res.status(403).json({ error: 'Permission denied: You must be the team owner' });
      }
    }

    await prisma.stream.delete({ where: { id } });
    res.json({ message: 'Stream deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
