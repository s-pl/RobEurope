import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

/**
 * @fileoverview
 * JWT token signing helper.
 *
 * Note: The main application uses session cookies for auth; JWT is used only
 * where explicitly required.
 */

/**
 * Signs a JWT with a default 1-hour expiration.
 *
 * @param {object} payload Token payload.
 * @returns {string} Signed JWT.
 */
export default function signToken  (payload)  {
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  return token
}