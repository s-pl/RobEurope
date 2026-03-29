import express from 'express';
import { Op, Sequelize } from 'sequelize';
import { requireRole } from '../../middleware/role.middleware.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import {
  getStatsData, getUsersByRole, getUsersTimeline, getRegistrationStats,
  getCompetitionStats, getLogsStats, getDetailedUsers,
} from '../../controller/admin.controller.js';
import db from '../../models/index.js';

const router = express.Router();

// All admin API routes require super_admin
router.use(authenticateToken, requireRole('super_admin'));

// ── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats/overview', getStatsData);
router.get('/stats/users/by-role', getUsersByRole);
router.get('/stats/users/timeline', getUsersTimeline);
router.get('/stats/registrations/by-status', getRegistrationStats);
router.get('/stats/competitions/registrations', getCompetitionStats);
router.get('/stats/logs', getLogsStats);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { User, Country, EducationalCenter, TeamMembers, Team } = db;

    const [users, memberships] = await Promise.all([
      User.findAll({
        attributes: { exclude: ['password_hash'] },
        include: [
          { model: Country, attributes: ['name', 'code'], required: false },
          { model: EducationalCenter, as: 'educationalCenter', attributes: ['name'], required: false },
        ],
        order: [['created_at', 'DESC']],
      }),
      TeamMembers.findAll({ where: { left_at: null } }),
    ]);

    // Fetch teams separately to avoid alias issues
    const teamIds = [...new Set(memberships.map(m => m.team_id).filter(Boolean))];
    const teams = teamIds.length
      ? await Team.findAll({ where: { id: teamIds }, attributes: ['id', 'name'] })
      : [];
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.toJSON()]));
    const membershipMap = Object.fromEntries(memberships.map(m => [m.user_id, m]));

    res.json(users.map(u => ({
      ...u.toJSON(),
      team:      membershipMap[u.id] ? (teamMap[membershipMap[u.id].team_id] ?? null) : null,
      team_role: membershipMap[u.id]?.role ?? null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { User, SystemLog } = db;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { username, email, first_name, last_name, role, is_active } = req.body;
    const oldRole = user.role;
    await user.update({ username, email, first_name, last_name, role, is_active });
    if (oldRole !== role) {
      await SystemLog.create({
        action: 'ROLE_CHANGED', entity_type: 'User', entity_id: user.id,
        user_id: req.user.id, ip_address: req.ip,
        details: `Role changed from ${oldRole} to ${role}`,
      });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ban / unban toggle
router.post('/users/:id/ban', async (req, res) => {
  try {
    const { User, SystemLog } = db;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super_admin') return res.status(403).json({ error: 'Cannot ban a super_admin' });
    await user.update({ is_active: !user.is_active });
    await SystemLog.create({
      action: 'UPDATE', entity_type: 'User', entity_id: user.id,
      user_id: req.user.id, ip_address: req.ip,
      details: user.is_active ? `Unbanned user ${user.username}` : `Banned user ${user.username}`,
    });
    res.json({ is_active: user.is_active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { User, SystemLog } = db;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super_admin') return res.status(403).json({ error: 'Cannot delete a super_admin account' });
    await SystemLog.create({
      action: 'DELETE', entity_type: 'User', entity_id: user.id,
      user_id: req.user.id, ip_address: req.ip,
      details: `Deleted user ${user.username} (${user.email})`,
    });
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams', async (req, res) => {
  try {
    const { Team, TeamMembers, User, Registration, Competition, Country } = db;
    const teams = await Team.findAll({
      include: [
        { model: Country, as: 'Country', attributes: ['name', 'code'], required: false },
        {
          model: TeamMembers,
          as: 'TeamMembers',
          required: false,
          include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'username', 'role', 'profile_photo_url'] }],
        },
        {
          model: Registration,
          as: 'registrations',
          required: false,
          include: [{ model: Competition, attributes: ['id', 'title', 'status'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    // Filter members client-side (left_at null) to avoid LEFT JOIN where clause issues
    const result = teams.map(t => {
      const plain = t.toJSON();
      plain.TeamMembers = (plain.TeamMembers ?? []).filter(m => !m.left_at);
      return plain;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const { Team, SystemLog } = db;
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    await SystemLog.create({
      action: 'DELETE', entity_type: 'Team', entity_id: String(team.id),
      user_id: req.user.id, ip_address: req.ip,
      details: `Admin deleted team "${team.name}"`,
    });
    await team.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Registrations ─────────────────────────────────────────────────────────────
router.get('/registrations', async (req, res) => {
  try {
    const { Registration, Team, Competition, User } = db;
    const { status, competition_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (competition_id) where.competition_id = competition_id;
    const rows = await Registration.findAll({
      where,
      include: [
        { model: Team, attributes: ['id', 'name', 'logo_url'] },
        { model: Competition, attributes: ['id', 'title', 'status', 'start_date', 'end_date'] },
      ],
      order: [['registration_date', 'DESC']],
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registrations/:id/approve', async (req, res) => {
  try {
    const { Registration, Team, Notification } = db;
    const reg = await Registration.findByPk(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    await reg.update({ status: 'approved', decision_reason: req.body.reason ?? null });
    try {
      const team = await Team.findByPk(reg.team_id);
      if (team?.created_by_user_id) {
        await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Registro aprobado',
          message: `Tu equipo ha sido aprobado para la competición`,
          type: 'competition_registration',
        });
      }
    } catch (_) {}
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registrations/:id/reject', async (req, res) => {
  try {
    const { Registration, Team, Notification } = db;
    const reg = await Registration.findByPk(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    const reason = req.body.reason ?? null;
    await reg.update({ status: 'rejected', decision_reason: reason });
    try {
      const team = await Team.findByPk(reg.team_id);
      if (team?.created_by_user_id) {
        await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Registro rechazado',
          message: reason ? `Tu registro fue rechazado: ${reason}` : 'Tu registro fue rechazado',
          type: 'competition_registration',
        });
      }
    } catch (_) {}
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Competitions ──────────────────────────────────────────────────────────────
router.get('/competitions', async (req, res) => {
  try {
    const { Competition, Registration } = db;
    const rows = await Competition.findAll({
      include: [{
        model: Registration,
        as: 'registrations',
        attributes: ['id', 'status'],
        required: false,
      }],
      order: [['id', 'DESC']],
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/competitions/:id', async (req, res) => {
  try {
    const { Competition } = db;
    const comp = await Competition.findByPk(req.params.id);
    if (!comp) return res.status(404).json({ error: 'Competition not found' });
    const allowed = ['title', 'description', 'status', 'location', 'max_teams',
      'registration_start', 'registration_end', 'start_date', 'end_date',
      'rules_url', 'is_active'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    await comp.update(updates);
    res.json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── System Logs ───────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const { SystemLog, User } = db;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.action)      where.action      = req.query.action;
    if (req.query.entity_type) where.entity_type = req.query.entity_type;

    const { count, rows } = await SystemLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['username', 'email', 'role'], required: false }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    res.json({ total: count, page, pages: Math.ceil(count / limit), rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
