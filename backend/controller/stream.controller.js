import db from '../models/index.js';
const { Stream, Registration, TeamMembers } = db;
import { Op } from 'sequelize';

export const createStream = async (req, res) => {
  try {
    const streamData = { ...req.body };
    const item = await Stream.create(streamData);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStreams = async (req, res) => {
  try {
    const { q, limit = 50, offset = 0, status, competition_id } = req.query;
    const where = {};
    if (q) where.title = { [Op.like]: `%${q}%` };
    if (status) where.status = status;
    if (competition_id) where.competition_id = competition_id;

    // If filtering by competition, check access
    if (competition_id && req.user) {
      const userTeams = await TeamMembers.findAll({ where: { user_id: req.user.id, left_at: null } });
      const teamIds = userTeams.map(tm => tm.team_id);
      
      let isApproved = false;
      if (teamIds.length > 0) {
        const registration = await Registration.findOne({
          where: {
            competition_id,
            team_id: { [Op.in]: teamIds },
            status: 'approved'
          }
        });
        if (registration) isApproved = true;
      }

      if (!isApproved) {
        // If not approved, only return streams that are NOT associated with this competition (or handle as forbidden)
        // But usually, if asking for competition streams, we should return empty or error.
        // However, if the user is just browsing "all streams", we might want to hide private ones.
        // For now, if competition_id is explicitly requested and user is not approved, return empty.
        return res.json([]);
      }
    }

    const items = await Stream.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
      include: [{
        model: db.Competition,
        as: 'competition',
        required: false
      }, {
        model: db.Team,
        as: 'team',
        required: true
      }]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStreamById = async (req, res) => {
  try {
    const item = await Stream.findByPk(req.params.id, {
      include: [{
        model: db.Competition,
        as: 'competition',
        required: false
      }, {
        model: db.Team,
        as: 'team',
        required: true
      }]
    });
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStream = async (req, res) => {
  try {
    const updates = { ...req.body };
    const [updated] = await Stream.update(updates, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Stream not found' });
    const updatedItem = await Stream.findByPk(req.params.id, {
      include: [{
        model: db.Competition,
        as: 'competition',
        required: false
      }]
    });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStream = async (req, res) => {
  try {
    const deleted = await Stream.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Stream not found' });
    res.json({ message: 'Stream deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
