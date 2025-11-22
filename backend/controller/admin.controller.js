import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
const { User, Competition, Post, Registration, SystemLog } = db;

// Helper reused (similar logic as auth.controller) to support base64 obfuscated inputs
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
  return res.render('login', { title: 'Admin Login' });
}

export async function handleLogin(req, res) {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render('login', { title: 'Admin Login', error: 'Email and password required' });
    }
    // Normalize & decode
    email = decodeIfBase64(email.trim()).toLowerCase();
    password = decodeIfBase64(password.trim());

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).render('login', { title: 'Admin Login', error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).render('login', { title: 'Admin Login', error: 'Invalid credentials' });
    }
    if (user.role !== 'super_admin') {
      return res.status(403).render('login', { title: 'Admin Login', error: 'Admin role required' });
    }
    req.session.user = { id: user.id, email: user.email, role: user.role, username: user.username };
    return res.redirect('/admin');
  } catch (e) {
    return res.status(500).render('login', { title: 'Admin Login', error: e.message });
  }
}

export async function handleLogout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
}

export async function renderDashboard(req, res) {
  // Basic stats for dashboard quick view
  const [users, competitions, posts, registrations] = await Promise.all([
    User.count(),
    Competition.count(),
    Post.count(),
    Registration.count()
  ]);
  res.render('dashboard', {
    title: 'Admin Dashboard',
    stats: { users, competitions, posts, registrations }
  });
}

export async function listUsers(req, res) {
  const all = await User.findAll({ attributes: ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'created_at'] });
  res.render('users', { title: 'Users', users: all });
}

export async function promoteUser(req, res) {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) return res.status(404).send('User not found');
  user.role = 'super_admin';
  await user.save();
  res.redirect('/admin/users');
}

// API endpoints for dashboard charts
export async function getStatsData(req, res) {
  try {
    const [users, competitions, posts, registrations] = await Promise.all([
      User.count(),
      Competition.count(),
      Post.count(),
      Registration.count()
    ]);
    
    res.json({
      users,
      competitions,
      posts,
      registrations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUsersByRole(req, res) {
  try {
    const data = await User.findAll({
      attributes: [
        'role',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });
    
    res.json(data.map(d => ({ role: d.role, count: parseInt(d.count, 10) })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUsersTimeline(req, res) {
  try {
    const data = await User.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
      raw: true
    });
    
    res.json(data.map(d => ({
      date: d.date,
      count: parseInt(d.count, 10)
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getRegistrationStats(req, res) {
  try {
    const data = await Registration.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    res.json(data.map(d => ({ status: d.status, count: parseInt(d.count, 10) })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getDetailedUsers(req, res) {
  try {
    const all = await User.findAll({
      attributes: ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    });
    
    res.json(all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Competiciones
export async function listCompetitions(req, res) {
  try {
    const competitions = await Competition.findAll({
      attributes: ['id', 'title', 'slug', 'description', 'start_date', 'end_date', 'created_at']
    });
    res.render('competitions', { title: 'Competiciones', competitions });
  } catch (error) {
    res.status(500).render('error', { status: 500, message: 'Error loading competitions', error });
  }
}

export async function getCompetitionStats(req, res) {
  try {
    const data = await Competition.findAll({
      attributes: [
        'id',
        'title',
        [Sequelize.fn('COUNT', Sequelize.col('Registrations.id')), 'registrationCount']
      ],
      include: [{
        model: Registration,
        attributes: [],
        required: false
      }],
      group: ['Competition.id'],
      raw: true,
      subQuery: false
    });
    
    res.json(data.map(d => ({
      id: d.id,
      title: d.title,
      registrations: parseInt(d.registrationCount, 10) || 0
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Logs del sistema
export async function listSystemLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await SystemLog.findAndCountAll({
      include: [{
        model: User,
        attributes: ['username', 'email'],
        as: 'user'
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);
    res.render('system-logs', {
      title: 'Logs del Sistema',
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
    const [byAction, byEntity, recent] = await Promise.all([
      SystemLog.findAll({
        attributes: [
          'action',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['action'],
        raw: true
      }),
      SystemLog.findAll({
        attributes: [
          'entity_type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['entity_type'],
        raw: true
      }),
      SystemLog.findAll({
        attributes: ['action', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 30,
        raw: true
      })
    ]);

    res.json({
      byAction: byAction.map(d => ({ action: d.action, count: parseInt(d.count, 10) })),
      byEntity: byEntity.map(d => ({ entity: d.entity_type, count: parseInt(d.count, 10) })),
      recentTimeline: recent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}