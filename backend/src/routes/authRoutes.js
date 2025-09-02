const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  changePassword,
  logout,
  createSuperAdmin,
  checkSuperAdmin
} = require('../controllers/authController');
const { 
  authenticate,
  checkPasswordChangeRequired 
} = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.get('/check-superadmin', checkSuperAdmin);
router.post('/create-superadmin', createSuperAdmin);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Authentication system working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;