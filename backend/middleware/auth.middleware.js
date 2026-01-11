/**
 * @fileoverview Session authentication middleware.
 */

/**
 * Ensures the request is authenticated via server-side session.
 *
 * On success, populates `req.user` from `req.session.user`.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} res Express response.
 * @param {import('express').NextFunction} next Express next.
 * @returns {void}
 */
export default function authenticateToken(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Session required' });
}





