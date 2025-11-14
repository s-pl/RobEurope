import express from 'express';
import apiRoutes from './routes/api/index.js';
import rateLimit from './middleware/rateLimit.middleware.js';
import timeoutMiddleware from './middleware/timeout.middleware.js';
import morgan from 'morgan';
import logger from './utils/logger.js';
import dotenv from 'dotenv';
import streamRoutes from './routes/api/stream.route.js';
import swaggerRouter from './swagger.js';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
dotenv.config();
// import userRoutes from './routes/userRoutes.js';
const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,    
  /^http:\/\/46\.101\.255\.106(:85)?$/ ,
  "http://46.101.255.106:5173"
];

const app = express();
const PORT = process.env.PORT;

// registrar peticiones (access logs) vía winston
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));





app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((pattern) => pattern.test(origin));
    if (allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));


app.use(express.json());
app.use(timeoutMiddleware);
// Serve static files from backend/public so we can host a simple test UI
app.use(express.static('public'));
// Serve uploaded files
app.use('/uploads', express.static('uploads'));
// Serve API documentation (Swagger UI)
app.use('/api-docs', swaggerRouter);
  // Apply rate limiting on API routes
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }), apiRoutes);
app.use('/api/streams', streamRoutes);
export default app; 

// error handler
// centralized error handler
app.use((err, req, res, next) => {
  const isSequelize = err && err.name && err.name.startsWith('Sequelize');
  if (isSequelize) {
    // Log structured Sequelize error (may include err.errors array for validation)
    logger.error({
      sequelize: true,
      name: err.name,
      message: err.message,
      errors: err.errors || undefined,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });

    if (!res.headersSent) {
      // Validation / constraint errors -> 400 with details, else 500
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Validation Error', details: err.errors });
      }
      return res.status(500).json({ error: 'Database Error' });
    }
    return;
  }

  // Generic errors
  logger.error({
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method
  });

  if (!res.headersSent) {
    // If the error object contains a status code use it, else 500
    const status = err && err.status && Number.isInteger(err.status) ? err.status : 500;
    return res.status(status).json({ error: status === 500 ? 'Internal Server Error' : err.message });
  }
});


// register global unhandled error handlers
process.on('uncaughtException', (err) => {
  // Log and exit - process may be in inconsistent state
  logger.error({ unhandled: 'uncaughtException', message: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack : undefined, error: err });
  // Allow logger to flush then exit
  setTimeout(() => process.exit(1), 500);
});
process.on('unhandledRejection', (reason, promise) => {
  // Log detailed rejection reason. If it's an Error include stack.
  if (reason instanceof Error) {
    logger.error({ unhandled: 'unhandledRejection', message: reason.message, stack: reason.stack });
  } else {
    logger.error({ unhandled: 'unhandledRejection', reason });
  }
  // It's safest to exit the process so the application can restart in a clean state
  setTimeout(() => process.exit(1), 500);
});


// add ssl 
// const options = {
//   key: fs.readFileSync('/certs/key.pem'),
//   cert: fs.readFileSync('cert.pem')
// };


// https.createServer(options, app).listen(PORT, () => {
//   console.log(`Server running in https://localhost:${PORT}`);
// });

if(process.env.NODE_ENV === 'production') {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || import.meta.dirname + '/certs/key.pem'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || import.meta.dirname +  '/certs/cert.pem')
  };

  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running in https://localhost:${PORT}`);
  });
} else {
  // In development, ensure models are loaded and DB synced (creates missing tables)
  // try {
  //   const modelsModule = await import('./models/index.js');
  //   const db = modelsModule.default;
  //   console.log('Syncing database (development mode) — this may alter tables...');
  //   await db.sequelize.sync({ alter: true });
  //   console.log('Database sync complete');
  // } catch (err) {
  //   console.error('Database sync failed:', err && err.message ? err.message : err);
  // }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}