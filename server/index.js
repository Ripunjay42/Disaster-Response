// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { sequelize } from './models/index.js';
import { logger } from './utils/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';

// Routes
import authRoutes from './routes/auth.js';
import disasterRoutes from './routes/disasters.js';
import resourceRoutes from './routes/resources.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://disaster-res-client.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

app.set('io', io);

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'https://disaster-res-client.vercel.app'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined'));

// Basic in-memory rate limiting
const rateLimitRequests = (req, res, next) => {
  if (!req.ip) return next();
  if (!global.requestCounts) global.requestCounts = {};
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 100;

  if (!global.lastCleanup || now - global.lastCleanup > 10 * 60 * 1000) {
    const cutoff = now - windowMs;
    for (const ip in global.requestCounts) {
      if (global.requestCounts[ip].timestamp < cutoff) {
        delete global.requestCounts[ip];
      }
    }
    global.lastCleanup = now;
  }

  const entry = global.requestCounts[req.ip] || { count: 0, timestamp: now };
  if (now - entry.timestamp > windowMs) {
    entry.count = 1;
    entry.timestamp = now;
  } else {
    entry.count++;
  }

  global.requestCounts[req.ip] = entry;

  if (entry.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests, try again later' });
  }
  next();
};

app.use(rateLimitRequests);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiRequest(req.path, req.method, res.statusCode, { duration });
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Disaster Response API' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message || 'Unknown error',
    stack: err.stack || 'No stack trace',
    path: req.path,
    method: req.method
  });
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.IO handling
io.on('connection', (socket) => {
  logger.info('User connected to websocket', { socketId: socket.id });

  socket.on('join_disaster', (disasterId) => {
    socket.join(`disaster:${disasterId}`);
    logger.info('User joined disaster room', { socketId: socket.id, disasterId });
  });

  socket.on('leave_disaster', (disasterId) => {
    socket.leave(`disaster:${disasterId}`);
    logger.info('User left disaster room', { socketId: socket.id, disasterId });
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected from websocket', { socketId: socket.id });
  });
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate().then(async () => {
  logger.info('✅ Database connected');
  await sequelize.sync({ alter: true });
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  logger.error('❌ Database connection failed', { error: err.message });
});
