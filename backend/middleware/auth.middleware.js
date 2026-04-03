import { verifyToken, COOKIE_NAME } from '../utils/signToken.js';

/**
 * @fileoverview JWT-based authentication middleware.
 *
 * Reads the auth token from the `auth_token` httpOnly cookie or, as fallback,
 * from the `Authorization: Bearer <token>` header.
 */

function extractToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

/**
 * Ensures the request is authenticated via JWT.
 * Populates `req.user` with the decoded token payload.
 */
export default function authenticateToken(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized: token required' });

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

/**
 * Optional authentication — populates `req.user` if a valid token is present
 * but does NOT reject unauthenticated requests.
 */
export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  return next();
}
