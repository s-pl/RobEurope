import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import signToken from '../utils/signToken.js';
import SystemLogger from '../utils/systemLogger.js';

const { User } = db;

function isBase64(str) {
  return typeof str === 'string' && /^[A-Za-z0-9+/=]+$/.test(str) && (str.length % 4 === 0); // got it from stackoverflow, rlly dont know how it works
}
function decodeIfBase64(value) {
  try {
    if (!value || typeof value !== 'string') return value;
    if (!isBase64(value)) return value;
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    // sanity: decoded should contain printable chars and maybe an '@' for email, but accept decoded anyway
    return decoded;
  } catch (e) {
    return value;
  }
}

export const register = async (req, res) => {
  try {
    // Expect username instead of country_id (models use username)
    let { email, password, first_name, last_name, username, phone } = req.body;

    if (!email || !password || !first_name || !last_name || !username) {
      return res.status(400).json({ error: 'Missing required fields: first_name, last_name, username, email, password' });
    }

    // decode if sent base64
    email = decodeIfBase64(email);
    password = decodeIfBase64(password);

    // Force default role to 'user' regardless of input
    const role = 'user';

    // Check uniqueness on email and username
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(409).json({ error: 'Username already taken' });

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date();

    // Model defines created_at (snake_case) and does not use Sequelize's updatedAt by default
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      username,
      phone: phone || null,
      role,
      created_at: now
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    // Log user registration
    await SystemLogger.logCreate('User', user.id, {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      role: user.role
    }, req, 'User registration');

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, username: user.username, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password son obligatorios' });

    // decode if sent base64
    email = decodeIfBase64(email);
    password = decodeIfBase64(password);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Log failed login attempt
      await SystemLogger.logAuth('LOGIN', null, req, `Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      // Log failed login attempt
      await SystemLogger.logAuth('LOGIN', user.id, req, 'Failed login attempt - wrong password');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    // Log successful login
    await SystemLogger.logAuth('LOGIN', user.id, req, 'User login successful');

    return res.json({
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
