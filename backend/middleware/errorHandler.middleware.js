/**
 * Global Express error handler.
 *
 * Usage — register as the LAST middleware in index.js:
 *   app.use(errorHandler);
 *
 * Catches errors thrown from controllers (including via asyncHandler).
 * Operational AppErrors produce clean JSON responses.
 * Unexpected errors are logged and return a generic 500 in production.
 */

import { AppError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.message };
    if (err instanceof ValidationError && err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors?.map((e) => e.message) ?? [err.message];
    return res.status(400).json({ error: messages[0], errors: messages });
  }

  // Log unexpected errors with context
  logger.error({
    err: { message: err.message, stack: err.stack, name: err.name },
    req: { method: req.method, url: req.originalUrl, id: req.id },
  });

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
  });
}
