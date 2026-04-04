import express from 'express';
import { requireRole } from '../../middleware/role.middleware.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import {
  getStatsData, getUsersByRole, getUsersTimeline, getRegistrationStats,
  getCompetitionStats, getLogsStats, getDetailedUsers,
} from '../../controller/admin.controller.js';
import prisma from '../../lib/prisma.js';

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
    const [users, memberships] = await Promise.all([
      prisma.user.findMany({
        omit: { password_hash: true },
        include: {
          country: { select: { name: true, code: true } },
          educationalCenter: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.teamMember.findMany({ where: { left_at: null } }),
    ]);

    const teamIds = [...new Set(memberships.map(m => m.team_id).filter(Boolean))];
    const teams = teamIds.length
      ? await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } })
      : [];
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
    const membershipMap = Object.fromEntries(memberships.map(m => [m.user_id, m]));

    res.json(users.map(u => ({
      ...u,
      team:      membershipMap[u.id] ? (teamMap[membershipMap[u.id].team_id] ?? null) : null,
      team_role: membershipMap[u.id]?.role ?? null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { username, email, first_name, last_name, role, is_active } = req.body;
    const oldRole = user.role;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username, email, first_name, last_name, role, is_active },
    });

    if (oldRole !== role) {
      await prisma.systemLog.create({
        data: {
          action: 'UPDATE',
          entity_type: 'User',
          entity_id: user.id,
          user_id: req.user.id,
          ip_address: req.ip,
          details: `Role changed from ${oldRole} to ${role}`,
        },
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/ban', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super_admin') return res.status(403).json({ error: 'Cannot ban a super_admin' });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { is_active: !user.is_active },
    });

    await prisma.systemLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'User',
        entity_id: user.id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: updated.is_active ? `Unbanned user ${user.username}` : `Banned user ${user.username}`,
      },
    });

    res.json({ is_active: updated.is_active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super_admin') return res.status(403).json({ error: 'Cannot delete a super_admin account' });

    await prisma.systemLog.create({
      data: {
        action: 'DELETE',
        entity_type: 'User',
        entity_id: user.id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: `Deleted user ${user.username} (${user.email})`,
      },
    });

    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Teams ─────────────────────────────────────────────────────────────────────
router.get('/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        country: { select: { name: true, code: true } },
        teamMembers: {
          where: { left_at: null },
          include: {
            user: { select: { id: true, first_name: true, last_name: true, username: true, role: true, profile_photo_url: true } },
          },
        },
        registrations: {
          include: {
            competition: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: Number(req.params.id) } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    await prisma.systemLog.create({
      data: {
        action: 'DELETE',
        entity_type: 'Team',
        entity_id: String(team.id),
        user_id: req.user.id,
        ip_address: req.ip,
        details: `Admin deleted team "${team.name}"`,
      },
    });

    await prisma.team.delete({ where: { id: team.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Registrations ─────────────────────────────────────────────────────────────
router.get('/registrations', async (req, res) => {
  try {
    const { status, competition_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (competition_id) where.competition_id = Number(competition_id);

    const rows = await prisma.registration.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, logo_url: true } },
        competition: { select: { id: true, title: true, status: true, start_date: true, end_date: true } },
      },
      orderBy: { registration_date: 'desc' },
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registrations/:id/approve', async (req, res) => {
  try {
    const reg = await prisma.registration.findUnique({ where: { id: Number(req.params.id) } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    const updated = await prisma.registration.update({
      where: { id: reg.id },
      data: { status: 'approved', decision_reason: req.body.reason ?? null },
    });

    try {
      const team = reg.team_id ? await prisma.team.findUnique({ where: { id: reg.team_id } }) : null;
      if (team?.created_by_user_id) {
        await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Registro aprobado',
            message: 'Tu equipo ha sido aprobado para la competición',
            type: 'registration_team_status',
          },
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/registrations/:id/reject', async (req, res) => {
  try {
    const reg = await prisma.registration.findUnique({ where: { id: Number(req.params.id) } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });

    const reason = req.body.reason ?? null;
    const updated = await prisma.registration.update({
      where: { id: reg.id },
      data: { status: 'rejected', decision_reason: reason },
    });

    try {
      const team = reg.team_id ? await prisma.team.findUnique({ where: { id: reg.team_id } }) : null;
      if (team?.created_by_user_id) {
        await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Registro rechazado',
            message: reason ? `Tu registro fue rechazado: ${reason}` : 'Tu registro fue rechazado',
            type: 'registration_team_status',
          },
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Competitions ──────────────────────────────────────────────────────────────
router.get('/competitions', async (req, res) => {
  try {
    const rows = await prisma.competition.findMany({
      include: {
        registrations: { select: { id: true, status: true } },
      },
      orderBy: { id: 'desc' },
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/competitions/:id', async (req, res) => {
  try {
    const comp = await prisma.competition.findUnique({ where: { id: Number(req.params.id) } });
    if (!comp) return res.status(404).json({ error: 'Competition not found' });

    const allowed = ['title', 'description', 'status', 'location', 'max_teams',
      'registration_start', 'registration_end', 'start_date', 'end_date',
      'rules_url', 'is_active'];
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const updated = await prisma.competition.update({ where: { id: comp.id }, data });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── System Logs ───────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;
    const where = {};
    if (req.query.action)      where.action      = req.query.action;
    if (req.query.entity_type) where.entity_type = req.query.entity_type;

    const [total, rows] = await prisma.$transaction([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        include: { user: { select: { username: true, email: true, role: true } } },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
