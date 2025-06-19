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
  cors: { origin: '*' }
});

// Store io instance for use in controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet()); // Security headers
app.use(morgan('combined')); // HTTP request logging

// Basic rate limiting
const rateLimitRequests = (req, res, next) => {
  if (!req.ip) return next();
  
  // Create a temporary in-memory store for rate limiting
  // In production, use Redis or similar
  if (!global.requestCounts) global.requestCounts = {};
  
  const now = Date.now();
  const windowSizeMs = 60 * 1000; // 1 minute window
  const maxRequestsPerWindow = 100;
  
  // Clean up old entries
  if (!global.lastCleanup || now - global.lastCleanup > 10 * 60 * 1000) {
    const windowStart = now - windowSizeMs;
    Object.keys(global.requestCounts).forEach(key => {
      if (global.requestCounts[key].timestamp < windowStart) {
        delete global.requestCounts[key];
      }
    });
    global.lastCleanup = now;
  }
  
  // Check rate limit
  if (!global.requestCounts[req.ip]) {
    global.requestCounts[req.ip] = { count: 1, timestamp: now };
  } else {
    // Reset if outside window
    if (now - global.requestCounts[req.ip].timestamp > windowSizeMs) {
      global.requestCounts[req.ip] = { count: 1, timestamp: now };
    } else {
      global.requestCounts[req.ip].count++;
      if (global.requestCounts[req.ip].count > maxRequestsPerWindow) {
        return res.status(429).json({ 
          error: 'Too many requests, please try again later'
        });
      }
    }
  }
  
  next();
};

app.use(rateLimitRequests);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiRequest(req.path, req.method, res.statusCode, { duration });
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Disaster Response API' });
});

// Socket.IO connection
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
  
  // Sync models with database
  await sequelize.sync({ alter: true }); // Use { alter: true } for development
  
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  logger.error('❌ Database connection failed', { error: err.message });
});
