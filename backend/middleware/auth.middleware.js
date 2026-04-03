import { auth, claimCheck } from 'express-oauth2-jwt-bearer';

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

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});

/**
 * Enforces a valid Auth0 JWT. Returns 401 if missing/invalid, 403 if expired.
 */
export default function authenticateToken(req, res, next) {
  checkJwt(req, res, next);
}

/**
 * Optional auth — populates req.auth if a valid token is present,
 * but does NOT reject unauthenticated requests.
 */
export function optionalAuth(req, res, next) {
  checkJwt(req, res, (err) => {
    if (err) {
      req.auth = null;
      req.user = null;
    }
    next();
  });
}
