const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const CONSTANTS = require('./config/constants');
const { initializeDatabase } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { setSocketIo } = require('./utils/geofencing');

const app = express();
const server = http.createServer(app);

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

logger.info('Allowed CORS origins:', { origins: allowedOrigins });

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      // Allow any localhost origin in development
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Setup Socket.IO with CORS
const io = socketIo(server, {
  cors: corsOptions
});

// Store io instance for use in routes
app.set('io', io);

// Set Socket.IO instance for geofencing real-time alerts
setSocketIo(io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.LOGIN_RATE_LIMIT_MAX,
  message: { success: false, error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all API routes (DISABLED for easier development)
// app.use(`/api/${CONSTANTS.API_VERSION}/`, generalLimiter);

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    message: 'Smart People Tracking API',
    version: '1.0.0',
    apiVersion: CONSTANTS.API_VERSION,
    endpoints: {
      health: `/api/${CONSTANTS.API_VERSION}/health`,
      auth: `/api/${CONSTANTS.API_VERSION}/auth`,
      locations: `/api/${CONSTANTS.API_VERSION}/locations`,
      geofences: `/api/${CONSTANTS.API_VERSION}/geofences`,
      alerts: `/api/${CONSTANTS.API_VERSION}/alerts`
    },
    documentation: 'See README.md for API documentation'
  });
});

// Health check endpoint
app.get(`/api/${CONSTANTS.API_VERSION}/health`, (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');
const geofenceRoutes = require('./routes/geofences');
const alertRoutes = require('./routes/alerts');

// Mount routes with versioning (auth limiter removed for easier login)
app.use(`/api/${CONSTANTS.API_VERSION}/auth`, authRoutes);
app.use(`/api/${CONSTANTS.API_VERSION}/locations`, locationRoutes);
app.use(`/api/${CONSTANTS.API_VERSION}/geofences`, geofenceRoutes);
app.use(`/api/${CONSTANTS.API_VERSION}/alerts`, alertRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });

  // Join room for specific user updates
  socket.on('subscribe_user', (userId) => {
    socket.join(`user_${userId}`);
    logger.debug(`Socket subscribed to user updates`, { socketId: socket.id, userId });
  });

  // Handle connection errors
  socket.on('error', (error) => {
    logger.error('Socket error', { socketId: socket.id, error: error.message });
  });
});

// Broadcast location updates to all connected clients
io.engine.on('connection_error', (err) => {
  logger.error('Socket.IO connection error', {
    code: err.code,
    message: err.message,
    context: err.context
  });
});

// Session cleanup - run every hour
setInterval(async () => {
  try {
    const pool = require('./config/database');
    const [result] = await pool.execute('DELETE FROM sessions WHERE expires_at < NOW()');
    if (result.affectedRows > 0) {
      logger.info('Cleaned up expired sessions', { count: result.affectedRows });
    }
  } catch (error) {
    logger.error('Error cleaning up sessions', { error: error.message });
  }
}, CONSTANTS.SESSION_CLEANUP_INTERVAL_MS);

// Error handling middleware (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Server initialization
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Initialize database connection first
    logger.info('Initializing database connection...');
    await initializeDatabase();

    // Start server
    server.listen(PORT, HOST, () => {
      logger.info('🚀 Server started successfully', {
        host: HOST,
        port: PORT,
        url: `http://${HOST}:${PORT}`,
        apiVersion: CONSTANTS.API_VERSION,
        environment: process.env.NODE_ENV || 'development'
      });

      // Log Hamachi IP if configured
      if (process.env.HAMACHI_IP) {
        logger.info('📡 Accessible via Hamachi', {
          url: `http://${process.env.HAMACHI_IP}:${PORT}`
        });
      }

      logger.info('📡 Socket.IO server ready');
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();


