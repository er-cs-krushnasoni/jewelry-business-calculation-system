const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import configuration
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple routes first
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Add routes one by one to debug
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.error('Error loading auth routes:', error.message);
}

// In server.js, add after auth routes:
try {
  const superAdminRoutes = require('./routes/superAdminRoutes');
  app.use('/api/super-admin', superAdminRoutes);
  console.log('Super admin routes loaded successfully');
} catch (error) {
  console.error('Error loading super admin routes:', error.message);
}

// Test super admin routes
app.get('/api/super-admin/test', (req, res) => {
  res.json({ success: true, message: 'Super admin test route working' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;