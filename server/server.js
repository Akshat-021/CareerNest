require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const platformRoutes = require('./routes/platformRoutes');
const communityRoutes = require('./routes/communityRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);

// Trust reverse proxy for client IP detection on Vercel and Render
app.set('trust proxy', 1);

// Connect database
connectDB();

// Initialize Socket.io
initSocket(server);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local images on localhost
}));

// CORS Configuration - Permissive for Vercel preview domains and configured CLIENT_URL
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin) return callback(null, true);
    if (
      origin === process.env.CLIENT_URL ||
      origin.startsWith('http://localhost:') ||
      origin.includes('vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Enable pre-flight for all routes
app.options('*', cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database connection for serverless function requests
const mongoose = require('mongoose');
app.use(async (req, res, next) => {
  // Allow health check and root to respond without waiting for database
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      // Handled in connectDB
    }
  }

  // Fast fail if database is not connected instead of hanging 10s on bufferCommands
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please ensure MONGO_URI is configured in Vercel Environment Variables and MongoDB Atlas Network Access allows 0.0.0.0/0.',
      dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      hasMongoUri: Boolean(process.env.MONGO_URI)
    });
  }

  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 2000, // Generous limit in development/test to prevent blocking multi-account browser verification
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/communities', communityRoutes);

// Base route test
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI-Powered Course Recommendation & Mentorship Portal API' });
});

// Health check route
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: readyState === 1 ? 'ok' : 'degraded',
    database: {
      connected: readyState === 1,
      readyState,
      state: states[readyState] || 'unknown',
      hasMongoUri: Boolean(process.env.MONGO_URI)
    },
    cors: {
      configuredClientUrl: process.env.CLIENT_URL || null
    },
    env: process.env.NODE_ENV || 'development'
  });
});

// Validate required secrets
const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingSecrets = requiredSecrets.filter((secretKey) => !process.env[secretKey]);

if (missingSecrets.length > 0) {
  const errMsg = `[SECURITY CONFIG ERROR] Missing required environment variable(s): ${missingSecrets.join(', ')}. Authentication will fail without valid secrets.`;
  if (process.env.NODE_ENV === 'production') {
    console.error(`FATAL: ${errMsg}`);
    process.exit(1);
  } else {
    console.warn(`WARNING: ${errMsg}`);
  }
}

// Error handling middleware
app.use(errorHandler);

// Set Port and start server (standardized default backend port: 5001)
const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`CareerNest server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export express app directly for serverless runtimes (Vercel), while preserving { app, server }
app.app = app;
app.server = server;
module.exports = app;
