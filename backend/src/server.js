const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import configuration
const connectDB = require('./config/database');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Make io available to routes
app.set('io', io);

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);

  // Handle user joining their shop room
  socket.on('join-shop', (data) => {
    const { shopId, userId, username, role } = data;
    
    if (!shopId || !userId) {
      socket.emit('join-error', { message: 'Missing shop or user information' });
      return;
    }
    
    // Join shop-specific room
    const roomName = `shop_${shopId}`;
    socket.join(roomName);
    socket.shopId = shopId;
    socket.userId = userId;
    socket.username = username;
    socket.role = role;
    
    console.log(`User ${username} (${role}) joined shop ${shopId} room`);
    
    // Confirm successful join
    socket.emit('joined-shop', { 
      shopId, 
      roomName,
      message: 'Successfully connected to real-time updates' 
    });
    
    // Notify others in the shop (optional)
    socket.to(roomName).emit('user-connected', {
      username,
      role,
      timestamp: new Date().toISOString()
    });
  });

  // Handle user leaving shop room
  socket.on('leave-shop', () => {
    if (socket.shopId) {
      const roomName = `shop_${socket.shopId}`;
      socket.leave(roomName);
      
      // Notify others in the shop
      socket.to(roomName).emit('user-disconnected', {
        username: socket.username,
        role: socket.role,
        timestamp: new Date().toISOString()
      });
      
      console.log(`User ${socket.username} left shop ${socket.shopId} room`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.shopId && socket.username) {
      const roomName = `shop_${socket.shopId}`;
      socket.to(roomName).emit('user-disconnected', {
        username: socket.username,
        role: socket.role,
        timestamp: new Date().toISOString()
      });
      
      console.log(`User ${socket.username} disconnected from shop ${socket.shopId}`);
    }
    console.log('Socket disconnected:', socket.id);
  });

  // Handle connection status requests
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
});

// Utility function to broadcast rate updates to shop
const broadcastRateUpdate = (shopId, rateData, updateInfo) => {
  const roomName = `shop_${shopId}`;
  io.to(roomName).emit('rate-updated', {
    rates: rateData,
    updateInfo,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasting rate update to shop ${shopId}, room: ${roomName}`);
};

// Utility function to broadcast system blocking status
const broadcastSystemBlocking = (shopId, blockingStatus) => {
  const roomName = `shop_${shopId}`;
  io.to(roomName).emit('system-blocking-changed', {
    isBlocked: blockingStatus.shouldBlock,
    message: blockingStatus.message,
    timestamp: new Date().toISOString()
  });
  
  console.log(`Broadcasting system blocking update to shop ${shopId}:`, blockingStatus.shouldBlock);
};

// Make these functions available globally
global.broadcastRateUpdate = broadcastRateUpdate;
global.broadcastSystemBlocking = broadcastSystemBlocking;

// Simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount
  });
});

// Load routes with error handling
console.log('Loading routes...');

// Auth routes
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading auth routes:', error.message);
}

// Super admin routes
try {
  const superAdminRoutes = require('./routes/superAdminRoutes');
  app.use('/api/super-admin', superAdminRoutes);
  console.log('✓ Super admin routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading super admin routes:', error.message);
}

// User management routes
try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/users', userRoutes);
  console.log('✓ User management routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading user management routes:', error.message);
}

// Rate management routes - CRITICAL FIX
try {
  const rateRoutes = require('./routes/rateRoutes');
  app.use('/api/rates', rateRoutes);
  console.log('✓ Rate management routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading rate management routes:', error.message);
  console.error('Full error:', error);
}

// Calculator routes
try {
  const calculatorRoutes = require('./routes/calculatorRoutes');
  app.use('/api/calculator', calculatorRoutes);
  console.log('✓ Calculator routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading calculator routes:', error.message);
}

// Category management routes
try {
  const categoryRoutes = require('./routes/categoryRoutes');
  app.use('/api/categories', categoryRoutes);
  console.log('✓ Category management routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading category management routes:', error.message);
}

// Test routes
app.get('/api/test/server', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server test route working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test/socket', (req, res) => {
  res.json({
    success: true,
    message: 'Socket.IO is running',
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// List all registered routes for debugging
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  try {
    app._router.stack.forEach((middleware) => {
      if (middleware.route) { 
        // routes registered directly on the app
        routes.push({
          path: middleware.route.path,
          method: Object.keys(middleware.route.methods)[0].toUpperCase()
        });
      } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) { 
        // router middleware with proper error checking
        const baseUrl = middleware.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace('^', '')
          .replace('\\', '');
        
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: baseUrl + handler.route.path,
              method: Object.keys(handler.route.methods)[0].toUpperCase(),
              baseUrl: baseUrl
            });
          }
        });
      }
    });
  } catch (error) {
    console.error('Error collecting routes:', error);
  }
  
  res.json({
    success: true,
    registeredRoutes: routes,
    totalRoutes: routes.length,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/auth/*',
      'GET /api/super-admin/*',
      'GET /api/users/*',
      'GET /api/rates/*',
      'GET /api/calculator/*',
      'GET /api/categories/*', // Add this line
      'GET /api/debug/routes'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Debug routes: http://localhost:${PORT}/api/debug/routes`);
  console.log(`🔌 Socket.IO test: http://localhost:${PORT}/api/test/socket`);
  console.log('=================================');
  console.log('📍 Available API endpoints:');
  console.log(`   - Authentication: /api/auth/*`);
  console.log(`   - Super Admin: /api/super-admin/*`);
  console.log(`   - User Management: /api/users/*`);
  console.log(`   - Rate Management: /api/rates/*`);
  console.log(`   - Calculator: /api/calculator/*`);
  console.log(`   - Category Management: /api/categories/*`);
  console.log('=================================');
  console.log('✅ Socket.IO server ready for connections');
  console.log('=================================');
});

module.exports = { app, server, io };