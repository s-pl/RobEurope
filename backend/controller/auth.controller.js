import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import SystemLogger from '../utils/systemLogger.js';
import crypto from 'crypto';
import redisClient from '../utils/redis.js';
import { sendPasswordResetEmail, sendPasswordResetCodeEmail } from '../utils/email.js';

const { User } = db;

/**
 * @fileoverview
 * Authentication and account management handlers.
 *
 * The backend uses cookie-based sessions (`express-session`).
 * These handlers set/clear `req.session.user`.
 */

function isBase64(str) {
  return typeof str === 'string' && /^[A-Za-z0-9+/=]+$/.test(str) && (str.length % 4 === 0); // got it from stackoverflow, rlly dont know how it works
}

/**
 * Decodes a value if it appears to be base64.
 *
 * Some clients may send credentials encoded; this keeps the API tolerant.
 *
 * @param {string} value Input value.
 * @returns {string} Decoded or original value.
 */
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

/**
 * Validates password strength.
 *
 * @param {string} password Raw password.
 * @returns {string|null} Returns a localized error message or null when valid.
 */
function validatePasswordStrength(password) {
  if (typeof password !== 'string') return 'Password inválida';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const groups = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (groups < 3) return 'La contraseña debe incluir al menos 3 tipos: mayúsculas, minúsculas, números o símbolos';
  return null;
}

/**
 * Registers a new user and creates a session.
 *
 * @route POST /api/auth/register
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
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

  // Password strength validation
  const pwError = validatePasswordStrength(password);
  if (pwError) return res.status(400).json({ error: pwError });

    // Force default role to 'user' regardless of input
    const role = 'user';

    // Check uniqueness on email and username
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(409).json({ error: 'Username already taken' });

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date();

    let educationalCenterId = null;
    if (req.body.educational_center_id) {
      const { EducationalCenter } = db;
      const centerId = Number(req.body.educational_center_id);
      if (!Number.isInteger(centerId)) {
        return res.status(400).json({ error: 'Invalid educational_center_id' });
      }
      const center = await EducationalCenter.findByPk(centerId);
      if (!center || center.approval_status !== 'approved') {
        return res.status(400).json({ error: 'Educational center not found or not approved' });
      }
      educationalCenterId = centerId;
    }

    // Model defines created_at (snake_case) and does not use Sequelize's updatedAt by default
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      username,
      phone: phone || null,
      role,
      educational_center_id: educationalCenterId,
      created_at: now
    });

    // Handle educational center admin request if provided
    const { educational_center_request, requested_role } = req.body;
    if (requested_role === 'center_admin' && educational_center_request) {
      const { EducationalCenter, CenterAdminRequest } = db;

      if (educational_center_request.action === 'create' && educational_center_request.center_data) {
        // Create a new educational center with pending status
        const centerData = educational_center_request.center_data;
        const newCenter = await EducationalCenter.create({
          name: centerData.name,
          city: centerData.city || null,
          contact_email: centerData.contact_email || null,
          website: centerData.website || null,
          approval_status: 'pending',
          created_by_user_id: user.id,
          created_at: now
        });

        // Create a request for center_admin role
        if (CenterAdminRequest) {
          await CenterAdminRequest.create({
            user_id: user.id,
            educational_center_id: newCenter.id,
            status: 'pending',
            request_type: 'create_center',
            created_at: now
          });
        }

        // Update user with pending center admin role request
        await user.update({ pending_role: 'center_admin', educational_center_id: newCenter.id });

      } else if (educational_center_request.action === 'join' && educational_center_request.center_id) {
        // User wants to join an existing center as admin
        const centerId = educational_center_request.center_id;
        const existingCenter = await EducationalCenter.findByPk(centerId);
        
        if (existingCenter && existingCenter.approval_status === 'approved') {
          // Create a request for center_admin role at this center
          if (CenterAdminRequest) {
            await CenterAdminRequest.create({
              user_id: user.id,
              educational_center_id: centerId,
              status: 'pending',
              request_type: 'join_center',
              created_at: now
            });
          }

          // Update user with pending center admin role request
          await user.update({ pending_role: 'center_admin', educational_center_id: centerId });
        }
      }
    }

    // Set session user
    const userSession = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, username: user.username, role: user.role, educational_center_id: user.educational_center_id };
    req.session.user = userSession;

    // Log user registration
    await SystemLogger.logCreate('User', user.id, {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      role: user.role
    }, req, 'User registration');

    // Explicitly save session
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      return res.status(201).json({
        user: userSession
      });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Logs a user in by email/password and creates a session.
 * Includes basic throttling/lockout via Redis.
 *
 * @route POST /api/auth/login
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password son obligatorios' });

    // decode if sent base64
    email = decodeIfBase64(email);
    password = decodeIfBase64(password);

    // Throttling/lockout per email
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const lockKey = `login:lock:${email}`;
    const attemptsKey = `login:attempts:${email}`;
    const locked = await redisClient.get(lockKey);
    if (locked) {
      return res.status(429).json({ error: 'Demasiados intentos. Inténtalo más tarde.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Log failed login attempt
      await SystemLogger.logAuth('LOGIN', null, req, `Failed login attempt for email: ${email}`);
      const attempts = await redisClient.incr(attemptsKey);
      if (attempts === 1) await redisClient.expire(attemptsKey, 10 * 60); // window 10 min
      if (attempts >= 5) {
        await redisClient.set(lockKey, '1', { EX: 10 * 60 });
      }
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      // Log failed login attempt
      await SystemLogger.logAuth('LOGIN', user.id, req, 'Failed login attempt - wrong password');
      const attempts = await redisClient.incr(attemptsKey);
      if (attempts === 1) await redisClient.expire(attemptsKey, 10 * 60);
      if (attempts >= 5) {
        await redisClient.set(lockKey, '1', { EX: 10 * 60 });
      }
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // success: reset attempts
    await redisClient.del(attemptsKey);

    // Set session user
    const userSession = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, educational_center_id: user.educational_center_id };
    req.session.user = userSession;

    // Log successful login
    await SystemLogger.logAuth('LOGIN', user.id, req, 'User login successful');

    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      return res.json({
        user: userSession
      });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Destroys the current session.
 * @route POST /api/auth/logout
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {void}
 */
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully' });
  });
};

/**
 * Returns the current authenticated user session payload.
 * @route GET /api/auth/me
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {any}
 */
export const me = (req, res) => {
  if (req.session && req.session.user) {
    return res.json(req.session.user);
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

/**
 * Changes the current user's password.
 *
 * @route POST /api/auth/change-password
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const changePassword = async (req, res) => {
  try {
    if (!req.session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    let { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) return res.status(400).json({ error: 'Campos requeridos: current_password y new_password' });

    // decode if base64
    current_password = decodeIfBase64(current_password);
    new_password = decodeIfBase64(new_password);

    if (current_password === new_password) return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual' });

    // Validate new password strength
    const pwError = validatePasswordStrength(new_password);
    if (pwError) return res.status(400).json({ error: pwError });

    const user = await User.findByPk(req.session.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'La contraseña actual no es correcta' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash });

    // Log password change
  await SystemLogger.logAuth('PW_CHG', user.id, req, 'User changed password');

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Initiates a password reset using a one-time code.
 *
 * This endpoint is designed to not reveal whether a user exists.
 *
 * @route POST /api/auth/forgot-password
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    email = decodeIfBase64(email);
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Do not reveal user existence
      return res.json({ success: true });
    }
    // Generate 6-digit one-time code and store keyed by email
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const key = `pwreset:code:${email}`;
    await redisClient.set(key, JSON.stringify({ userId: user.id, code }), { EX: 15 * 60 });
    const sendResult = await sendPasswordResetCodeEmail({ to: email, code });
    return res.json({ success: true, emailSent: !!sendResult?.sent });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Completes a password reset given a valid token.
 *
 * @route POST /api/auth/reset-password
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const resetPassword = async (req, res) => {
  try {
    let { token, new_password } = req.body || {};
    if (!token || !new_password) return res.status(400).json({ error: 'Campos requeridos: token y new_password' });
    new_password = decodeIfBase64(new_password);
    const pwError = validatePasswordStrength(new_password);
    if (pwError) return res.status(400).json({ error: pwError });
    const key = `pwreset:token:${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(400).json({ error: 'Token inválido o expirado' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash });
    await redisClient.del(key);
  await SystemLogger.logAuth('PWRES', user.id, req, 'User reset password via token');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const resetPasswordWithCode = async (req, res) => {
  try {
    let { email, code, new_password } = req.body || {};
    if (!email || !code || !new_password) return res.status(400).json({ error: 'Campos requeridos: email, code y new_password' });
    email = decodeIfBase64(email);
    new_password = decodeIfBase64(new_password);

    const pwError = validatePasswordStrength(new_password);
    if (pwError) return res.status(400).json({ error: pwError });

    const key = `pwreset:code:${email}`;
    const payload = await redisClient.get(key);
    if (!payload) return res.status(400).json({ error: 'Código inválido o expirado' });
    let parsed;
    try { parsed = JSON.parse(payload); } catch { return res.status(400).json({ error: 'Código inválido o expirado' }); }
    if (parsed.code !== code) return res.status(400).json({ error: 'Código inválido o expirado' });

    const user = await User.findByPk(parsed.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash });
    await redisClient.del(key);
  await SystemLogger.logAuth('PWRES', user.id, req, 'User reset password via one-time code');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
