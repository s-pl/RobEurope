import './env.js';
import express from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api/index.js';
import cronRoutes from './routes/api/cron.route.js';
import rateLimit from './middleware/rateLimit.middleware.js';
import timeoutMiddleware from './middleware/timeout.middleware.js';
import morgan from 'morgan';
import logger from './utils/logger.js';
import streamRoutes from './routes/api/stream.route.js';
import mediaRoutes from './routes/api/media.route.js';
import swaggerRouter from './swagger.js';
import cors from 'cors';
import helmet from 'helmet';
import db from './models/index.js';
import adminRoutes from './routes/admin.route.js';
import adminApiRoutes from './routes/admin.routes.js';
import requestId from './middleware/requestId.middleware.js';
import responseTime from './middleware/responseTime.middleware.js';
import i18n, { supportedLocales } from './config/i18n.js';
import healthDeployRouter from './routes/api/health.route.js';
import errorHandler from './middleware/errorHandler.middleware.js';

const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/46\.101\.255\.106(?::85)?$/,
  /^http:\/\/46\.101\.255\.106:5173$/,
  /^https?:\/\/(?:[a-z0-9-]+\.)?robeurope\.samuelponce\.es(?::\d+)?$/,
];

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 85;

const app = express();

app.use(requestId());
app.use(responseTime());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        ...(isProduction && { upgradeInsecureRequests: [] }),
      },
    },
  })
);

// --- View Engine (EJS for admin panel) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Trust proxy (Vercel / NGINX / Caddy) ---
app.set('trust proxy', 1);

// --- Cookie parser (needed for JWT cookie auth) ---
app.use(cookieParser());

// --- i18n ---
app.use(i18n.init);
app.use((req, res, next) => {
  const queryLocale = typeof req.query.lang === 'string' ? req.query.lang : null;
  let locale = queryLocale && supportedLocales.includes(queryLocale) ? queryLocale : i18n.getLocale();
  req.setLocale(locale);
  res.locals.locale = locale;
  res.locals.availableLocales = supportedLocales;
  res.locals.currentUser = req.user || null;
  res.locals.currentPath = req.originalUrl || '/';
  res.locals.pageKey = null;
  res.locals.t = (...args) => (res.__ ? res.__.apply(res, args) : i18n.__.apply(i18n, args));
  res.locals.clientTranslations = i18n.getCatalog(locale) || {};
  next();
});

// --- Passport (OAuth strategies only — no sessions) ---
// --- Request logging ---
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// --- CORS ---
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((p) => (p instanceof RegExp ? p.test(origin) : p === origin));
    if (allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use('/api', cors(corsOptions));
app.use('/api/streams', cors(corsOptions));
app.use('/api/media', cors(corsOptions));
app.use('/api-docs', cors(corsOptions));
app.options('*', cors(corsOptions));

// --- Health (public, no auth) ---
app.use('/health/deploy/actions', healthDeployRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(timeoutMiddleware);
app.use(express.static('public'));
app.use('/api-docs', swaggerRouter);

// --- Locale switch ---
app.get('/locale/:locale', (req, res) => {
  const { locale } = req.params;
  if (supportedLocales.includes(locale)) req.setLocale(locale);
  const redirectParam =
    typeof req.query.redirect === 'string' &&
    req.query.redirect.startsWith('/') &&
    !req.query.redirect.startsWith('//')
      ? req.query.redirect
      : null;
  let fallback = '/admin';
  if (!redirectParam) {
    const referer = req.get('Referer');
    if (referer) {
      try {
        const u = new URL(referer);
        if (u.host === req.get('host')) fallback = `${u.pathname}${u.search}${u.hash}`;
      } catch (_) {}
    }
  }
  res.redirect(redirectParam || fallback);
});

// --- Rate limits ---
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }));
app.use('/api/gdpr/my-account', rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }));
app.use('/api/notifications', rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }), apiRoutes);
app.use('/api/admin', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }), adminApiRoutes);
app.use('/api/streams', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }), streamRoutes);
app.use('/api/media', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }), mediaRoutes);
app.use('/api/cron', cronRoutes);
app.use('/health', rateLimit({ windowMs: 15 * 60 * 1000, max: 60 }));

// --- Admin panel (EJS, JWT-protected via cookie) ---
app.use('/admin', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/admin', adminRoutes);

// --- Manual ---
app.get('/manual', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/manual/user-manual.html'));
});

// --- Error handlers ---
app.use(errorHandler);
app.use((err, req, res, next) => {
  const isSequelize = err?.name?.startsWith('Sequelize');
  if (isSequelize) {
    logger.error({ sequelize: true, name: err.name, message: err.message, errors: err.errors, stack: err.stack, path: req.originalUrl, method: req.method });
    if (!res.headersSent) {
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Validation Error', details: err.errors });
      }
      return res.status(500).json({ error: 'Database Error' });
    }
    return;
  }
  logger.error({ message: err?.message || String(err), stack: err?.stack, path: req.originalUrl, method: req.method });
  if (!res.headersSent) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message });
  }
});

// --- Global unhandled error handlers ---
process.on('uncaughtException', (err) => {
  logger.error({ unhandled: 'uncaughtException', message: err?.message, stack: err?.stack });
  setTimeout(() => process.exit(1), 500);
});
process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error) {
    logger.error({ unhandled: 'unhandledRejection', message: reason.message, stack: reason.stack });
  } else {
    logger.error({ unhandled: 'unhandledRejection', reason });
  }
  setTimeout(() => process.exit(1), 500);
});

// --- Start server (local dev only — Vercel handles listen() itself) ---
if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;
