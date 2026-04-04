/**
 * @fileoverview Admin dashboard controllers.
 *
 * This file contains both server-rendered admin pages and JSON API endpoints
 * used by the admin dashboard (charts/stats). API routes are protected by
 * authentication and `super_admin` role at the router level.
 */

import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import si from 'systeminformation';
import redisClient from '../utils/redis.js';
import { setAuthCookie, clearAuthCookie } from '../utils/signToken.js';

// Helper reused to support base64 obfuscated inputs
function isBase64(str) {
  return typeof str === 'string' && /^[A-Za-z0-9+/=]+$/.test(str) && (str.length % 4 === 0);
}
function decodeIfBase64(value) {
  try {
    if (!value || typeof value !== 'string') return value;
    if (!isBase64(value)) return value;
    return Buffer.from(value, 'base64').toString('utf8');
  } catch (e) {
    return value;
  }
}

export async function renderLogin(req, res) {
  return res.render('login', { title: req.__('auth.metaTitle'), pageKey: 'login' });
}

export async function handleLogin(req, res) {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render('login', { title: req.__('auth.metaTitle'), pageKey: 'login', error: req.__('auth.errors.missing') });
    }
    email = decodeIfBase64(email.trim()).toLowerCase();
    password = decodeIfBase64(password.trim());

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).render('login', { title: req.__('auth.metaTitle'), pageKey: 'login', error: req.__('auth.errors.invalid') });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).render('login', { title: req.__('auth.metaTitle'), pageKey: 'login', error: req.__('auth.errors.invalid') });
    }
    if (user.role !== 'super_admin') {
      return res.status(403).render('login', { title: req.__('auth.metaTitle'), pageKey: 'login', error: req.__('auth.errors.role') });
    }
    setAuthCookie(res, { id: user.id, email: user.email, role: user.role, username: user.username });
    return res.redirect('/admin');
  } catch (e) {
    return res.status(500).render('login', { title: req.__('auth.metaTitle'), pageKey: 'login', error: req.__('auth.errors.unexpected') });
  }
}

export async function handleLogout(req, res) {
  clearAuthCookie(res);
  res.redirect('/admin/login');
}

export async function renderDashboard(req, res) {
  const [users, competitions, posts, registrations] = await Promise.all([
    prisma.user.count(),
    prisma.competition.count(),
    prisma.post.count(),
    prisma.registration.count()
  ]);
  res.render('dashboard', {
    title: req.__('dashboard.metaTitle'),
    pageKey: 'dashboard',
    stats: { users, competitions, posts, registrations }
  });
}

export async function listUsers(req, res) {
  const all = await prisma.user.findMany({
    select: { id: true, email: true, username: true, first_name: true, last_name: true, role: true, is_active: true, created_at: true }
  });
  res.render('users', { title: req.__('users.metaTitle'), pageKey: 'users', users: all });
}

export async function promoteUser(req, res) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).send('User not found');
  await prisma.user.update({ where: { id }, data: { role: 'super_admin' } });
  res.redirect('/admin/users');
}

export async function getStatsData(req, res) {
  try {
    const [users, competitions, posts, registrations] = await Promise.all([
      prisma.user.count(),
      prisma.competition.count(),
      prisma.post.count(),
      prisma.registration.count()
    ]);

    const mem = await si.mem();
    const load = await si.currentLoad();
    const disk = await si.fsSize();

    // DB Status
    let dbStatus = 'down';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch (e) { dbStatus = 'down'; }

    let redisStatus = 'down';
    try {
      if (redisClient.isOpen) redisStatus = 'up';
    } catch (e) { redisStatus = 'down'; }

    // Active sessions via raw query (table may or may not exist)
    let activeSessions = 0;
    try {
      const rows = await prisma.$queryRaw`SELECT COUNT(*) AS c FROM "Session" WHERE expires > NOW()`;
      activeSessions = rows && rows[0] ? Number(rows[0].c) : 0;
    } catch (_) { activeSessions = 0; }

    res.json({
      users,
      competitions,
      posts,
      registrations,
      activeSessions,
      system: {
        memory: { total: mem.total, used: mem.used, free: mem.free, active: mem.active },
        cpu: { load: load.currentLoad },
        disk: disk[0] ? { size: disk[0].size, used: disk[0].used } : null,
        mysql: dbStatus,
        redis: redisStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUsersByRole(req, res) {
  try {
    const data = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });
    res.json(data.map(d => ({ role: d.role, count: d._count.id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUsersTimeline(req, res) {
  try {
    const data = await prisma.$queryRaw`
      SELECT DATE("created_at") AS date, COUNT(id)::int AS count
      FROM "User"
      GROUP BY DATE("created_at")
      ORDER BY DATE("created_at") ASC
    `;
    res.json(data.map(d => ({ date: d.date, count: Number(d.count) })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getRegistrationStats(req, res) {
  try {
    const data = await prisma.registration.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    res.json(data.map(d => ({ status: d.status, count: d._count.id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getDetailedUsers(req, res) {
  try {
    const all = await prisma.user.findMany({
      select: { id: true, email: true, username: true, first_name: true, last_name: true, role: true, is_active: true, created_at: true }
    });
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listCompetitions(req, res) {
  try {
    const competitions = await prisma.competition.findMany({
      select: { id: true, title: true, slug: true, description: true, start_date: true, end_date: true }
    });
    res.render('competitions', { title: req.__('competitions.metaTitle'), pageKey: 'competitions', competitions });
  } catch (error) {
    res.status(500).render('error', { status: 500, message: 'Error loading competitions', error });
  }
}

export async function getCompetitionStats(req, res) {
  try {
    const data = await prisma.$queryRaw`
      SELECT c.id, c.title, COUNT(r.id)::int AS "registrationCount"
      FROM "Competition" c
      LEFT JOIN "Registration" r ON r.competition_id = c.id
      GROUP BY c.id, c.title
    `;
    res.json(data.map(d => ({
      id: d.id,
      title: d.title,
      registrations: Number(d.registrationCount) || 0
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listSystemLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const [rows, count] = await prisma.$transaction([
      prisma.systemLog.findMany({
        include: { user: { select: { username: true, email: true } } },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip
      }),
      prisma.systemLog.count()
    ]);

    const totalPages = Math.ceil(count / limit);
    res.render('system-logs', {
      title: req.__('logs.metaTitle'),
      pageKey: 'logs',
      logs: rows,
      currentPage: page,
      totalPages,
      totalLogs: count
    });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
}

export async function getLogsStats(req, res) {
  try {
    const [byActionRaw, byEntityRaw, recent] = await Promise.all([
      prisma.systemLog.groupBy({ by: ['action'], _count: { id: true } }),
      prisma.systemLog.groupBy({ by: ['entity_type'], _count: { id: true } }),
      prisma.systemLog.findMany({
        select: { action: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 30
      })
    ]);

    res.json({
      byAction: byActionRaw.map(d => ({ action: d.action, count: d._count.id })),
      byEntity: byEntityRaw.map(d => ({ entity: d.entity_type, count: d._count.id })),
      recentTimeline: recent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function renderEditUser(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).render('error', { status: 404, message: req.__('errors.userNotFound') });
    }
    res.render('edit-user', { title: req.__('editUser.metaTitle'), pageKey: 'users', user });
  } catch (error) {
    res.status(500).render('error', { status: 500, message: error.message });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email, first_name, last_name, role, is_active } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).render('error', { status: 404, message: req.__('errors.userNotFound') });
    }

    const oldRole = user.role;

    const updated = await prisma.user.update({
      where: { id },
      data: { username, email, first_name, last_name, role, is_active: is_active === 'true' }
    });

    // Log action
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'User',
        entity_id: updated.id,
        user_id: req.user.id,
        ip_address: req.ip,
        details: `Updated user ${updated.username} (ID: ${updated.id})`
      }
    });

    // Log role change specifically
    if (oldRole !== updated.role) {
      await prisma.systemLog.create({
        data: {
          action: 'UPDATE',
          entity_type: 'User',
          entity_id: updated.id,
          user_id: req.user.id,
          ip_address: req.ip,
          details: `Role changed from ${oldRole} to ${updated.role}`
        }
      });
    }

    res.redirect('/admin/users');
  } catch (error) {
    res.status(500).render('error', { status: 500, message: error.message });
  }
}

export async function listRegistrations(req, res) {
  try {
    const registrations = await prisma.registration.findMany({
      include: {
        team: { select: { name: true } },
        competition: { select: { title: true } }
      },
      orderBy: { registration_date: 'desc' }
    });
    res.render('registrations', { title: req.__('registrations.metaTitle'), pageKey: 'registrations', registrations });
  } catch (error) {
    res.status(500).render('error', { status: 500, message: error.message });
  }
}

export async function updateRegistrationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const registration = await prisma.registration.findUnique({ where: { id: Number(id) } });
    if (!registration) {
      return res.status(404).send('Registration not found');
    }

    await prisma.registration.update({
      where: { id: Number(id) },
      data: { status, decision_reason: reason }
    });

    await prisma.systemLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'Registration',
        entity_id: String(registration.id),
        user_id: req.user.id,
        ip_address: req.ip,
        details: `Updated registration ${id} status to ${status}`
      }
    });

    res.redirect('/admin/registrations');
  } catch (error) {
    res.status(500).render('error', { status: 500, message: error.message });
  }
}
