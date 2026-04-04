import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';

const ALLOWED_ROLES = new Set(['user', 'center_admin', 'super_admin']);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const safeSlug = (value) =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const getClaim = (payload, claimKey) => {
  if (!claimKey) return undefined;
  return payload?.[claimKey];
};

const getRoleFromToken = (payload) => {
  const appMeta = payload?.app_metadata ?? {};
  const userMeta = payload?.user_metadata ?? {};
  const candidates = [
    appMeta?.role,
    appMeta?.roles,
    userMeta?.role,
    payload?.role,
    payload?.roles,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      for (const role of candidate) {
        if (ALLOWED_ROLES.has(role)) return role;
      }
      continue;
    }
    if (ALLOWED_ROLES.has(candidate)) return candidate;
  }

  return null;
};

const getCenterIdFromToken = (payload) => {
  const appMeta = payload?.app_metadata ?? {};
  const userMeta = payload?.user_metadata ?? {};
  const candidates = [
    appMeta?.educational_center_id,
    userMeta?.educational_center_id,
    payload?.educational_center_id,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === '') continue;
    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  return null;
};

const mapUserForRequest = (user) => ({
  id: user.id,
  auth0_id: user.auth0_id,
  email: user.email,
  username: user.username,
  first_name: user.first_name,
  last_name: user.last_name,
  role: user.role || 'user',
  educational_center_id: user.educational_center_id ?? null,
  profile_photo_url: user.profile_photo_url ?? null,
  is_active: user.is_active !== false,
});

async function generateUniqueUsername(payload, email, auth0Id) {
  const meta = payload?.user_metadata ?? {};
  const fromNickname = normalizeString(meta?.username) || normalizeString(payload?.nickname) || normalizeString(payload?.preferred_username);
  const fromEmail = normalizeString(email).split('@')[0];
  const fromSub = normalizeString(auth0Id).replace(/[^a-z0-9]/gi, '_');
  const base = safeSlug(fromNickname || fromEmail || fromSub || 'user').slice(0, 24) || 'user';

  let username = base;
  let attempts = 0;

  while (await prisma.user.findUnique({ where: { username } })) {
    attempts += 1;
    username = `${base}_${uuidv4().slice(0, 6)}`.slice(0, 30);
    if (attempts >= 8) break;
  }

  return username;
}

async function findOrCreateUserFromAuth(payload) {
  const auth0Id = normalizeString(payload?.sub);
  if (!auth0Id) return null;

  let user = await prisma.user.findUnique({ where: { auth0_id: auth0Id } });

  const tokenEmailRaw = normalizeString(payload?.email).toLowerCase();
  const tokenEmail = tokenEmailRaw || null;

  if (!user && tokenEmail) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: tokenEmail } });
    if (existingByEmail && (!existingByEmail.auth0_id || existingByEmail.auth0_id === auth0Id)) {
      if (!existingByEmail.auth0_id) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { auth0_id: auth0Id },
        });
      } else {
        user = existingByEmail;
      }
    }
  }

  if (!user) {
    const email = tokenEmail || `${auth0Id.replace(/[^a-z0-9]/gi, '_')}@supabase.local`;
    const meta = payload?.user_metadata ?? {};
    const fullName = normalizeString(meta?.full_name || payload?.name);
    const firstName = normalizeString(meta?.first_name || payload?.given_name) || fullName.split(' ')[0] || 'User';
    const lastName =
      normalizeString(meta?.last_name || payload?.family_name) ||
      fullName.split(' ').slice(1).join(' ') ||
      'User';

    const username = await generateUniqueUsername(payload, email, auth0Id);

    user = await prisma.user.create({
      data: {
        auth0_id: auth0Id,
        email,
        first_name: firstName,
        last_name: lastName,
        username,
        password_hash: null,
        role: 'user',
        created_at: new Date(),
      },
    });
  }

  const tokenRole = getRoleFromToken(payload);
  const tokenCenterId = getCenterIdFromToken(payload);
  const updates = {};

  if (tokenRole && tokenRole !== user.role) updates.role = tokenRole;
  if (tokenCenterId && tokenCenterId !== user.educational_center_id) {
    updates.educational_center_id = tokenCenterId;
  }

  if (Object.keys(updates).length > 0) {
    user = await prisma.user.update({ where: { id: user.id }, data: updates });
  }

  return user;
}

export async function hydrateRequestUser(req, { allowInactive = false } = {}) {
  const payload = req.auth?.payload;
  if (!payload) {
    req.user = null;
    return null;
  }

  const user = await findOrCreateUserFromAuth(payload);
  if (!user) {
    req.user = null;
    return null;
  }

  if (!allowInactive && user.is_active === false) {
    const err = new Error('Cuenta desactivada');
    err.status = 403;
    throw err;
  }

  req.user = mapUserForRequest(user);
  return req.user;
}

export default async function attachUser(req, res, next) {
  try {
    await hydrateRequestUser(req);
    return next();
  } catch (err) {
    if (err?.status === 403) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }
    return next(err);
  }
}
