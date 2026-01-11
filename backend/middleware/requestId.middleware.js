import { randomUUID } from 'crypto';

/**
 * @fileoverview
 * Request id middleware.
 */

/**
 * Adds a unique request id to each incoming request.
 *
 * - Sets `req.id`
 * - Sets `res.locals.requestId`
 * - Adds `X-Request-Id` response header
 *
 * @returns {Express.RequestHandler}
 */
export default function requestId() {
  return (req, res, next) => {
    const id = randomUUID();
    req.id = id;
    res.locals.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}