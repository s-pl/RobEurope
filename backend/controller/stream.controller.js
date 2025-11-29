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

    // Check access permissions
    let isApproved = false;
    if (competition_id && req.user) {
      const userTeams = await TeamMembers.findAll({ where: { user_id: req.user.id, left_at: null } });
      const teamIds = userTeams.map(tm => tm.team_id);
      
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

    // If not approved (guest or unapproved user), sanitize stream_url
    if (!isApproved) {
      const sanitized = items.map(s => {
        const json = s.toJSON();
        delete json.stream_url;
        return json;
      });
      return res.json(sanitized);
    }

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
    const stream = await Stream.findByPk(req.params.id);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    // Check permissions
    if (req.user.role !== 'admin') {
      // If not admin, check if user is owner of the team associated with the stream
      if (!stream.team_id) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const membership = await TeamMembers.findOne({
        where: {
          team_id: stream.team_id,
          user_id: req.user.id,
          role: 'owner',
          left_at: null
        }
      });

      if (!membership) {
        return res.status(403).json({ error: 'Permission denied: You must be the team owner' });
      }
    }

    await stream.destroy();
    res.json({ message: 'Stream deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
