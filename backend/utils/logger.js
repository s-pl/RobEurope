import winston from 'winston';
import path from 'path';

/**
 * @fileoverview
 * Central Winston logger configuration.
 *
 * On Vercel (read-only filesystem) only the Console transport is used.
 * Locally, rotating file transports are added when DailyRotateFile is available.
 */

const commonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const isVercel = !!process.env.VERCEL;

const transports = [
  new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
  })
];

let exceptionHandlers;

if (!isVercel) {
  // Only use file transports when the filesystem is writable (local / VPS)
  const { default: DailyRotateFile } = await import('winston-daily-rotate-file');
  const logDir = path.resolve('logs');

  transports.push(
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
    })
  );

  exceptionHandlers = [
    new DailyRotateFile({ filename: path.join(logDir, 'exceptions-%DATE%.log'), datePattern: 'YYYY-MM-DD' })
  ];
}

const logger = winston.createLogger({
  level: 'info',
  format: commonFormat,
  transports,
  ...(exceptionHandlers ? { exceptionHandlers } : {}),
});

/**
 * Shared logger instance.
 * @type {object}
 */
export default logger;