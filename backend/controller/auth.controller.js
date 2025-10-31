import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import signToken from '../utils/signToken.js';

const { User } = db;

function isBase64(str) {
  return typeof str === 'string' && /^[A-Za-z0-9+/=]+$/.test(str) && (str.length % 4 === 0);
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
    let { email, password, first_name, last_name, phone, country_id } = req.body;
    if (!email || !password || !first_name || !last_name || !phone || !country_id) {
      return res.status(400).json({ error: 'Missing required fields: first_name, last_name, email, password, phone, country_id' });
    }

    // decode if sent base64
    email = decodeIfBase64(email);
    password = decodeIfBase64(password);

    // Force default role to 'user' regardless of input
    const role = 'user';

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date();
    const user = await User.create({ email, password_hash, first_name, last_name, phone, country_id, role, created_at: now, updated_at: now });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role }
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
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
