import jwt from 'jsonwebtoken';
import { hydrateRequestUser } from './attachUser.middleware.js';

/**
 * @fileoverview Supabase JWT validation middleware.
 *
 * Validates Bearer tokens issued by Supabase (HS256, signed with SUPABASE_JWT_SECRET).
 * Sets req.auth.payload with the decoded token and hydrates req.user from the DB.
 *
 * Required env var:
 *   SUPABASE_JWT_SECRET — from Supabase Dashboard → Settings → API → JWT Secret
 */

function getSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET env var is not set');
  return secret;
}

function extractBearerToken(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

/**
 * Enforces a valid Supabase JWT. Returns 401 if missing/invalid.
 */
export default function authenticateToken(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  let payload;
  try {
    payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: 'Unauthorized', message });
  }

  req.auth = { payload };

  hydrateRequestUser(req)
    .then(() => next())
    .catch((err) => {
      if (err?.status === 403) {
        return res.status(403).json({ error: 'Cuenta desactivada' });
      }
      return next(err);
    });
}

/**
 * Optional auth — populates req.auth/req.user if a valid token is present,
 * but does NOT reject unauthenticated requests.
 */
export function optionalAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    req.auth = null;
    req.user = null;
    return next();
  }

  let payload;
  try {
    payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  } catch {
    req.auth = null;
    req.user = null;
    return next();
  }

  req.auth = { payload };

  hydrateRequestUser(req, { allowInactive: true })
    .then(() => {
      if (req.user?.is_active === false) {
        req.auth = null;
        req.user = null;
      }
      return next();
    })
    .catch(() => {
      req.auth = null;
      req.user = null;
      return next();
    });
}
