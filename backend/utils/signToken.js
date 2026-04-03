import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;
const COOKIE_NAME = 'auth_token';

/**
 * Signs a JWT with a 7-day expiration.
 *
 * @param {object} payload Token payload (user id, email, role, etc.)
 * @returns {string} Signed JWT.
 */
export default function signToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
}

/**
 * Verifies a JWT and returns the decoded payload.
 *
 * @param {string} token JWT string.
 * @returns {object} Decoded payload.
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

/**
 * Sets the auth JWT as an httpOnly cookie on the response.
 *
 * @param {Express.Response} res
 * @param {object} userPayload User data to embed in the token.
 */
export function setAuthCookie(res, userPayload) {
  const token = signToken(userPayload);
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    ...(isProduction && process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {}),
  });
}

/**
 * Clears the auth cookie.
 *
 * @param {Express.Response} res
 */
export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(isProduction && process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {}),
  });
}

export { COOKIE_NAME };
