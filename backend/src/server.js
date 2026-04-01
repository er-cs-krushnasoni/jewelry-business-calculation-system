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

// Production logging helper
const isProd = process.env.NODE_ENV === 'production';
const log = {
  info: (...args) => !isProd && console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => !isProd && console.warn('[WARN]', ...args)
};

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

// Initialize Shop Scheduler
const ShopScheduler = require('./utils/shopScheduler');
const shopScheduler = new ShopScheduler(io);
shopScheduler.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM signal received: closing HTTP server');
  shopScheduler.stop();
  server.close(() => {
    log.info('HTTP server closed');
  });
});

// Connect to MongoDB
connectDB();

// Make io available to routes
app.set('io', io);

// Basic middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  // log.info('New socket connection:', socket.id);

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
    
    // log.info(`User ${username} (${role}) joined shop ${shopId} room`);
    
    // Confirm successful join
    socket.emit('joined-shop', { 
      shopId, 
      roomName,
      message: 'Successfully connected to real-time updates' 
    });
    
    // Notify others in the shop
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
      
      socket.to(roomName).emit('user-disconnected', {
        username: socket.username,
        role: socket.role,
        timestamp: new Date().toISOString()
      });
      
      log.info(`User ${socket.username} left shop ${socket.shopId} room`);
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
      
      log.info(`User ${socket.username} disconnected from shop ${socket.shopId}`);
    }
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
  
  log.info(`Broadcasting rate update to shop ${shopId}`);
};

// Utility function to broadcast system blocking status
const broadcastSystemBlocking = (shopId, blockingStatus) => {
  const roomName = `shop_${shopId}`;
  io.to(roomName).emit('system-blocking-changed', {
    isBlocked: blockingStatus.shouldBlock,
    message: blockingStatus.message,
    timestamp: new Date().toISOString()
  });
  
  log.info(`Broadcasting system blocking update to shop ${shopId}:`, blockingStatus.shouldBlock);
};

const broadcastRateTableUpdate = (shopId, metalType, tableData) => {
  const roomName = `shop_${shopId}`;
  io.to(roomName).emit('rate-table-updated', {
    metalType,
    ...tableData,
    timestamp: new Date().toISOString()
  });
  
  log.info(`Broadcasting rate table update to shop ${shopId} for ${metalType}`);
};

// Make these functions available globally
global.broadcastRateUpdate = broadcastRateUpdate;
global.broadcastSystemBlocking = broadcastSystemBlocking;
global.broadcastRateTableUpdate = broadcastRateTableUpdate;

// Simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
    environment: process.env.NODE_ENV
  });
});

// Load routes
const loadRoute = (path, mountPath) => {
  try {
    const route = require(path);
    app.use(mountPath, route);
    // log.info(`✓ Route loaded: ${mountPath}`);
  } catch (error) {
    log.error(`✗ Error loading route ${mountPath}:`, error.message);
  }
};

loadRoute('./routes/authRoutes', '/api/auth');
loadRoute('./routes/superAdminRoutes', '/api/super-admin');
loadRoute('./routes/userRoutes', '/api/users');
loadRoute('./routes/rateRoutes', '/api/rates');
loadRoute('./routes/calculatorRoutes', '/api/calculator');
loadRoute('./routes/categoryRoutes', '/api/categories');
loadRoute('./routes/rateTableRoutes', '/api/rate-tables');

// 404 handler
app.use((req, res) => {
  log.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  log.error('Global error handler:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: isProd ? undefined : err.stack
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  if (!isProd) {
    console.log('=================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.IO ready for connections`);
    console.log('=================================');
  } else {
    console.log(`✅ Production server running on port ${PORT}`);
  }
});

module.exports = { app, server, io };