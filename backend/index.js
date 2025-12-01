import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api/index.js';
import rateLimit from './middleware/rateLimit.middleware.js';
import timeoutMiddleware from './middleware/timeout.middleware.js';
import morgan from 'morgan';
import logger from './utils/logger.js';
import dotenv from 'dotenv';
import streamRoutes from './routes/api/stream.route.js';
import mediaRoutes from './routes/api/media.route.js';
import swaggerRouter from './swagger.js';
import cors from 'cors';
import helmet from 'helmet';
import csrf from 'csurf';
import session from 'express-session';
import SequelizeStoreInit from 'connect-session-sequelize';
import fs from 'fs';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';
import { setIO } from './utils/realtime.js';
import { startSchedulers } from './utils/scheduler.js';
import db from './models/index.js';
import adminRoutes from './routes/admin.route.js';
import requestId from './middleware/requestId.middleware.js';
import redisClient from './utils/redis.js';
dotenv.config();
// import userRoutes from './routes/userRoutes.js';
const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/46\.101\.255\.106(?::85)?$/,
  /^http:\/\/46\.101\.255\.106:5173$/,
  /^https?:\/\/(?:[a-z0-9-]+\.)?robeurope\.samuelponce\.es(?::\d+)?$/
];

const app = express();

// --- Request ID ---
app.use(requestId());

// --- Security Headers (Helmet) ---
app.use(helmet({
  crossOriginResourcePolicy: false, // allow serving uploads/static to other origins if needed
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://d3js.org", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  }
}));

// --- View Engine (EJS) ---
app.set('view engine', 'ejs');
// Resolve views relative to this file's directory to avoid double 'backend/backend' when cwd is already backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, 'views'));

// --- Sessions (Sequelize Store) ---
const SequelizeStore = SequelizeStoreInit(session.Store);
const sessionStore = new SequelizeStore({
  db: db.sequelize,
  tableName: 'Session'
});


sessionStore.sync();
app.use(session({
  secret: process.env.SESSION_SECRET || 'Session123456789100000',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // set true behind HTTPS reverse proxy with trust proxy
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Simple helper to expose session user to templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
});
const PORT = process.env.PORT || 85;

// registrar peticiones (access logs) vía winston
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));





// CORS only for API & real-time connections; admin panel (server-rendered) should not require CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser or same-origin requests
    const allowed = allowedOrigins.some((pattern) => (pattern instanceof RegExp ? pattern.test(origin) : pattern === origin));
    if (allowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use('/api', cors(corsOptions));
app.use('/api/streams', cors(corsOptions));
app.use('/api/media', cors(corsOptions));
app.use('/api-docs', cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use('/api/media', mediaRoutes); 

// --- CSRF (only for admin panel forms) ---
// Apply CSRF after session; limit to /admin paths
app.use('/admin', csrf({ cookie: false }));
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
  }
  next();
});
// Admin panel (session-based) routes
app.use('/admin', adminRoutes);

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send('Invalid CSRF token');
  }
  next(err);
});

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

// Start background schedulers
try { startSchedulers(); } catch (_) {}
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


// Create HTTP/HTTPS server and attach Socket.IO so ws://.../socket.io is available
let server;
server = http.createServer(app); // simple HTTP server - https is already handled by a reverse proxy in production

// Socket.IO with CORS matching the same allowed origins as Express CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((pattern) => (pattern instanceof RegExp ? pattern.test(origin) : pattern === origin));
      if (allowed) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});
setIO(io);

io.on('connection', (socket) => {
  logger.info({ socket: 'connected', id: socket.id, ip: socket.handshake.address });
  
  socket.on('join_team', (data) => {
    // Support both legacy (teamId only) and new ({ teamId, user }) formats
    const teamId = typeof data === 'object' ? data.teamId : data;
    const user = typeof data === 'object' ? data.user : null;

    if (teamId) {
      const room = `team_${teamId}`;
      socket.join(room);
      
      if (user) {
        socket.data.user = user;
        socket.data.teamId = teamId;
        broadcastTeamUsers(room);
      }
      
      logger.info({ socket: 'joined_team', id: socket.id, teamId, userId: user?.id });
    }
  });

  socket.on('typing', (data) => {
    if (data.teamId && data.user) {
      socket.to(`team_${data.teamId}`).emit('user_typing', data.user);
    }
  });

  socket.on('stop_typing', (data) => {
    if (data.teamId && data.user) {
      socket.to(`team_${data.teamId}`).emit('user_stop_typing', data.user);
    }
  });

  // --- Collaborative Coding Events ---
  socket.on('join_code_session', async (data) => {
    const { teamId, user } = data;
    if (teamId) {
      const room = `code_${teamId}`;
      socket.join(room);
      socket.data.codeUser = user;
      socket.data.codeTeamId = teamId;
      
      // Initialize session if not exists
      const sessionKey = `code_session:${teamId}`;
      let sessionData = await redisClient.get(sessionKey);
      
      if (!sessionData) {
        const initialSession = {
          files: [
            { id: '1', name: 'main.js', content: '// Welcome to your team workspace\nconsole.log("Hello World");', language: 'javascript' },
            { id: '2', name: 'README.md', content: '# Team Project\n\nCollaborate here.', language: 'markdown' }
          ]
        };
        await redisClient.set(sessionKey, JSON.stringify(initialSession));
        sessionData = JSON.stringify(initialSession);
      }
      
      // Send current state
      socket.emit('init_code_session', JSON.parse(sessionData));

      broadcastCodeUsers(room);
      logger.info({ socket: 'joined_code', id: socket.id, teamId, userId: user?.id });
    }
  });

  socket.on('file_update', async (data) => {
    const { teamId, fileId, content } = data;
    if (teamId) {
      const sessionKey = `code_session:${teamId}`;
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const file = session.files.find(f => f.id === fileId);
        if (file) {
          file.content = content;
          await redisClient.set(sessionKey, JSON.stringify(session));
          socket.to(`code_${teamId}`).emit('file_content_update', { fileId, content });
        }
      }
    }
  });

  socket.on('create_file', async (data) => {
    const { teamId, name, language, type = 'file' } = data;
    if (teamId) {
      const sessionKey = `code_session:${teamId}`;
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        
        // Check if file already exists
        if (session.files.some(f => f.name === name)) {
            return; // Or emit error
        }

        const newFile = {
          id: Date.now().toString(),
          name,
          content: type === 'folder' ? null : '',
          language: language || 'javascript',
          type
        };
        session.files.push(newFile);
        await redisClient.set(sessionKey, JSON.stringify(session));
        io.to(`code_${teamId}`).emit('file_created', newFile);
      }
    }
  });

  socket.on('delete_file', async (data) => {
    const { teamId, fileId } = data;
    if (teamId) {
      const sessionKey = `code_session:${teamId}`;
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.files = session.files.filter(f => f.id !== fileId);
        await redisClient.set(sessionKey, JSON.stringify(session));
        io.to(`code_${teamId}`).emit('file_deleted', { fileId });
      }
    }
  });

  socket.on('focus_file', (data) => {
    const { teamId, fileId } = data;
    if (teamId) {
      socket.data.focusedFileId = fileId;
      broadcastCodeUsers(`code_${teamId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info({ socket: 'disconnected', id: socket.id, reason });
    if (socket.data.teamId) {
      broadcastTeamUsers(`team_${socket.data.teamId}`);
    }
    if (socket.data.codeTeamId) {
      broadcastCodeUsers(`code_${socket.data.codeTeamId}`);
    }
  });
});

function broadcastCodeUsers(room) {
  const clients = io.sockets.adapter.rooms.get(room);
  if (clients) {
    const users = [];
    for (const clientId of clients) {
      const clientSocket = io.sockets.sockets.get(clientId);
      if (clientSocket && clientSocket.data.codeUser) {
        users.push({
          ...clientSocket.data.codeUser,
          focusedFileId: clientSocket.data.focusedFileId,
          socketId: clientId
        });
      }
    }
    io.to(room).emit('session_users', users);
  }
}

function broadcastTeamUsers(room) {
  const clients = io.sockets.adapter.rooms.get(room);
  if (clients) {
    const users = [];
    for (const clientId of clients) {
      const clientSocket = io.sockets.sockets.get(clientId);
      if (clientSocket && clientSocket.data.user) {
        // Avoid duplicates if same user has multiple tabs open
        if (!users.find(u => u.id === clientSocket.data.user.id)) {
          users.push(clientSocket.data.user);
        }
      }
    }
    io.to(room).emit('team_users_update', users);
  }
}

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at https://0.0.0.0:${PORT}`);
  });
}

export default app;