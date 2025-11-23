import db from '../models/index.js';
const { TeamMembers, User, Team } = db;
import { Op } from 'sequelize';

export const createTeamMember = async (req, res) => {
  try {
    const item = await TeamMembers.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const { team_id, user_id, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (team_id) where.team_id = team_id;
    if (user_id) where.user_id = user_id;

    const items = await TeamMembers.findAll({ 
      where, 
      limit: Number(limit), 
      offset: Number(offset), 
      order: [['joined_at', 'DESC']],
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name', 'logo_url'] }
      ]
    });
    // Enrich with user basic info
    const userIds = [...new Set(items.map(i => i.user_id))];
    let usersById = {};
    if (userIds.length) {
      const users = await User.findAll({ where: { id: userIds }, attributes: ['id','username','email','first_name','last_name'] });
      usersById = Object.fromEntries(users.map(u => [u.id, u]));
    }
    const enriched = items.map(i => {
      const u = usersById[i.user_id];
      const plain = i.toJSON();
      return { ...plain, user_username: u?.username || null, user_email: u?.email || null, user_name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : null };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamMemberById = async (req, res) => {
  try {
    const item = await TeamMembers.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'TeamMember not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    const [updated] = await TeamMembers.update(req.body, { where: { id: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'TeamMember not found' });
    const updatedItem = await TeamMembers.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    const deleted = await TeamMembers.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'TeamMember not found' });
    res.json({ message: 'TeamMember deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
