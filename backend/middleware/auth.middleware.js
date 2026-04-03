import { auth } from 'express-oauth2-jwt-bearer';

/**
 * @fileoverview Auth0 JWT validation middleware.
 *
 * Validates Bearer tokens issued by Auth0.
 * Sets `req.auth` with the decoded payload (sub, email, etc.).
 *
 * Requires env vars:
 *   AUTH0_DOMAIN   — e.g. robeurope.eu.auth0.com
 *   AUTH0_AUDIENCE — API identifier set in Auth0 dashboard
 */

// Lazy init — auth() throws at construction if audience is undefined,
// so we defer creation to first request to survive missing env vars at import time.
let _checkJwt;
function getCheckJwt() {
  if (!_checkJwt) {
    _checkJwt = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
      tokenSigningAlg: 'RS256',
    });
  }
  return _checkJwt;
}

/**
 * Enforces a valid Auth0 JWT. Returns 401 if missing/invalid, 403 if expired.
 */
export default function authenticateToken(req, res, next) {
  getCheckJwt()(req, res, next);
}

/**
 * Optional auth — populates req.auth if a valid token is present,
 * but does NOT reject unauthenticated requests.
 */
export function optionalAuth(req, res, next) {
  getCheckJwt()(req, res, (err) => {
    if (err) {
      req.auth = null;
      req.user = null;
    }
    next();
  });
}
