import db from '../models/index.js';
const { Competition, Registration, TeamMembers } = db;
import { Op } from 'sequelize';

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

export const createCompetition = async (req, res) => {
  try {
    if (req.body.is_active) {
      await Competition.update({ is_active: false }, { where: {} });
    }

    let slug = req.body.slug;
    if (!slug && req.body.title) {
      slug = generateSlug(req.body.title);
    }
    
    if (slug) {
      // Ensure uniqueness
      let uniqueSlug = slug;
      let counter = 1;
      while (await Competition.findOne({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      req.body.slug = uniqueSlug;
    }

    const comp = await Competition.create(req.body);
    res.status(201).json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompetitions = async (req, res) => {
  try {
    const { q, country_id, limit = 50, offset = 0, sort = 'id' } = req.query;
    const where = {};
    if (q) where.title = { [Op.like]: `%${q}%` };
    if (country_id) where.country_id = country_id;

    const items = await Competition.findAll({ where, limit: Number(limit), offset: Number(offset), order: [[sort, 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompetitionById = async (req, res) => {
  try {
    const item = await Competition.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Competition not found' });

    // Check if user is approved for this competition
    let isApproved = false;
    const currentUser = req.user || req.session?.user;
    
    if (currentUser) {
      const userTeams = await TeamMembers.findAll({ where: { user_id: currentUser.id, left_at: null } });
      const teamIds = userTeams.map(tm => tm.team_id);
      
      if (teamIds.length > 0) {
        const registration = await Registration.findOne({
          where: {
            competition_id: item.id,
            team_id: { [Op.in]: teamIds },
            status: 'approved'
          }
        });
        if (registration) isApproved = true;
      }
    }

    const result = item.toJSON();
    result.is_approved = isApproved;

    // Hide sensitive info if not approved
    if (!isApproved) {
      delete result.stream_url;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCompetition = async (req, res) => {
  try {
    if (req.body.is_active) {
      await Competition.update({ is_active: false }, { where: { id: { [Op.ne]: req.params.id } } });
    }
    const [updated] = await Competition.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Competition not found' });
    const updatedItem = await Competition.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCompetition = async (req, res) => {
  try {
    const deleted = await Competition.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Competition not found' });
    res.json({ message: 'Competition deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
