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

try {
  const superAdminRoutes = require('./routes/superAdminRoutes');
  app.use('/api/super-admin', superAdminRoutes);
  console.log('Super admin routes loaded successfully');
} catch (error) {
  console.error('Error loading super admin routes:', error.message);
}

// Add user management routes for shop admins
try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
  console.log('User management routes loaded successfully');
} catch (error) {
  console.error('Error loading user management routes:', error.message);
}

// Add rate management routes
try {
  const rateRoutes = require('./routes/rateRoutes');
  app.use('/api/rates', rateRoutes);
  console.log('Rate management routes loaded successfully');
} catch (error) {
  console.error('Error loading rate management routes:', error.message);
}

// Add calculator routes (with rate blocking middleware)
try {
  const calculatorRoutes = require('./routes/calculatorRoutes');
  app.use('/api/calculator', calculatorRoutes);
  console.log('Calculator routes loaded successfully');
} catch (error) {
  console.error('Error loading calculator routes:', error.message);
}

// Test routes
app.get('/api/super-admin/test', (req, res) => {
  res.json({ success: true, message: 'Super admin test route working' });
});

app.get('/api/test/roles', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Role testing endpoint',
    supportedRoles: ['super_admin', 'admin', 'manager', 'pro_client', 'client'],
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Available routes:`);
  console.log(`- Authentication: http://localhost:${PORT}/api/auth/*`);
  console.log(`- Super Admin: http://localhost:${PORT}/api/super-admin/*`);
  console.log(`- User Management: http://localhost:${PORT}/api/users/*`);
  console.log(`- Rate Management: http://localhost:${PORT}/api/rates/*`);
  console.log(`- Calculator: http://localhost:${PORT}/api/calculator/*`);
});

module.exports = app;