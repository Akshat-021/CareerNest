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

// Initialize app
const app = express();
const server = http.createServer(app);

// Connect database
connectDB();

// Initialize Socket.io
initSocket(server);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local images on localhost
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

// Base route test
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI-Powered Course Recommendation & Mentorship Portal API' });
});

// Error handling middleware
app.use(errorHandler);

// Set Port and start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
