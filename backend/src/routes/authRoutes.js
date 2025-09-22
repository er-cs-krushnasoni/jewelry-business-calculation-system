const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import middleware
const { authenticate, authorize, authorizeSuperAdmin } = require('../middleware/auth');

// Import controller
const {
  login,
  getMe,
  getMyProfile,
  changePassword,
  logout,
  createSuperAdmin,
  checkSuperAdmin,
  verifyAccess,      // NEW
  validateToken      // NEW  
} = require('../controllers/authController');

// Validation middleware
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const passwordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

const superAdminValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Login
router.post('/login', loginValidation, login);

// Check if Super Admin exists (for initial setup)
router.get('/check-super-admin', checkSuperAdmin);

// Create Super Admin (for initial setup only)
router.post('/create-super-admin', superAdminValidation, createSuperAdmin);

// ============================================
// AUTHENTICATED ROUTES (Token required)
// ============================================

// Get current user info with fresh database lookup
router.get('/me', authenticate, getMe);

// Get current user profile
router.get('/profile', authenticate, getMyProfile);

// Change password (Admin and Super Admin only)
router.put('/change-password', authenticate, authorize('super_admin', 'admin'), passwordValidation, changePassword);

// Logout (client-side token cleanup)
router.post('/logout', authenticate, logout);

// ============================================
// NEW SECURITY ROUTES
// ============================================

// Validate token and get fresh user data
router.post('/validate-token', authenticate, validateToken);

// Verify access for specific roles/requirements
router.post('/verify-access', authenticate, verifyAccess);

// ============================================
// ADMIN ROUTES
// ============================================

// Super Admin only routes would go here
// Example: router.get('/admin/users', authenticate, authorizeSuperAdmin, getAllUsers);

// ============================================
// UTILITY ROUTES
// ============================================

// Get auth system info
router.get('/system-info', (req, res) => {
  res.json({
    success: true,
    data: {
      authSystem: 'JWT with role-based access control',
      roles: ['super_admin', 'admin', 'manager', 'pro_client', 'client'],
      features: {
        multiDeviceLogin: true,
        globalUniqueUsernames: true,
        shopIsolation: true,
        tokenExpiration: process.env.JWT_EXPIRE || '30d',
        securityFeatures: [
          'Server-side role verification',
          'Periodic token validation',
          'Fresh database lookups',
          'Access verification endpoints'
        ]
      }
    }
  });
});

// Debug route to check authentication status
router.get('/debug/status', authenticate, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role,
      shopId: req.user.shopId || null,
      isActive: req.user.isActive
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Auth routes error:', error);
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'Authentication system error'
  });
});

module.exports = router;