import db from '../models/index.js';
import bcrypt from 'bcryptjs';
const { User, Competition, Post } = db;

export async function renderLogin(req, res) {
  return res.render('login', { title: 'Admin Login' });
}

export async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render('login', { title: 'Admin Login', error: 'Email and password required' });
    }
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
  const [users, competitions, posts] = await Promise.all([
    User.count(),
    Competition.count(),
    Post.count()
  ]);
  res.render('dashboard', {
    title: 'Admin Dashboard',
    stats: { users, competitions, posts }
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