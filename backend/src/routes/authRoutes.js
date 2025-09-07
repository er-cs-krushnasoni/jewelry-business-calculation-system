const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  getMyProfile,
  changePassword,
  logout,
  createSuperAdmin,
  checkSuperAdmin
} = require('../controllers/authController');

const { authenticate, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/login', login);
router.post('/create-super-admin', createSuperAdmin); // Only works if no super admin exists
router.get('/check-super-admin', checkSuperAdmin);

// Protected routes (authentication required)
router.use(authenticate); // All routes below require authentication

// Current user info
router.get('/me', getMe);

// Profile management for Super Admin and Shop Admin
router.get('/profile', authorize('super_admin', 'admin'), getMyProfile);

// Password management for Super Admin and Shop Admin only
router.post('/change-password', authorize('super_admin', 'admin'), changePassword);

// Logout
router.post('/logout', logout);

module.exports = router;