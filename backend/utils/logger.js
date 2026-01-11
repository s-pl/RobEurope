import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * @fileoverview
 * Central Winston logger configuration.
 *
 * Logs:
 * - Rotating access logs (info)
 * - Rotating error logs (error)
 * - Console logs (debug)
 */

const logDir = path.resolve('logs');

const commonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: 'info',
  format: commonFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    }),
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({ filename: path.join(logDir, 'exceptions-%DATE%.log'), datePattern: 'YYYY-MM-DD' })
  ]
});

/**
 * Shared logger instance.
 * @type {object}
 */
export default logger;