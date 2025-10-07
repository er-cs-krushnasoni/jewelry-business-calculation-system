// const express = require('express');
// const router = express.Router();
// const {
//   createShopUser,
//   getShopUsers,
//   updateShopUser,
//   updateUserCredentials,
//   resetUserPassword,
//   deleteShopUser,
//   getUserDetails,
//   getUserWithPassword,        // NEW
//   getShopUsersWithPasswords, // NEW
//   getAvailableRoles,
//   getShopDashboard
// } = require('../controllers/userController');

// const { 
//   authenticate,
//   authorizeShopAdmin,
//   authorizeShopAccess
// } = require('../middleware/auth');

// // All routes require authentication, shop admin role, and shop access
// router.use(authenticate);
// router.use(authorizeShopAdmin); // Only shop admins can access these routes
// router.use(authorizeShopAccess); // Ensure shop access

// // Test route for shop admin functionality
// router.get('/test', (req, res) => {
//   res.json({ 
//     success: true, 
//     message: 'Shop admin user management routes working',
//     shopId: req.user.shopId,
//     adminUsername: req.user.username,
//     timestamp: new Date().toISOString(),
//     capabilities: {
//       users: 'Create, update, delete shop users (manager, pro_client, client)',
//       credentials: 'Update usernames and passwords for shop users',
//       passwords: 'View current passwords for all shop users',
//       roles: 'Maximum one user per role per shop'
//     }
//   });
// });

// // Shop dashboard
// router.get('/dashboard', getShopDashboard);

// // Available roles
// router.get('/available-roles', getAvailableRoles);

// // Get all shop users (without passwords)
// router.get('/', getShopUsers);

// // NEW: Get all shop users WITH their passwords - Shop Admin only
// router.get('/with-passwords', getShopUsersWithPasswords);

// // Create new shop user
// router.post('/', createShopUser);

// // Get specific user details (without password)
// router.get('/:userId', getUserDetails);

// // NEW: Get specific user WITH password - Shop Admin only
// router.get('/:userId/password', getUserWithPassword);

// // Update user (status only)
// router.put('/:userId', updateShopUser);

// // Update user credentials (username/password) - New route
// router.put('/:userId/credentials', updateUserCredentials);

// // Reset user password - Deprecated, use credentials route
// router.post('/:userId/reset-password', resetUserPassword);

// // Delete/deactivate user
// router.delete('/:userId', deleteShopUser);

// module.exports = router;



const express = require('express');
const router = express.Router();
const {
  createShopUser,
  getShopUsers,
  updateShopUser,
  updateUserCredentials,
  resetUserPassword,
  deleteShopUser,
  getUserDetails,
  getUserWithPassword,
  getShopUsersWithPasswords,
  getAvailableRoles,
  getShopDashboard
} = require('../controllers/userController');

const { 
  authenticate,
  authorizeShopAdmin,
  authorizeShopAccess
} = require('../middleware/auth');

// Debugging middleware - BEFORE authentication
router.use((req, res, next) => {
  console.log(`[USER ROUTES DEBUG] ${req.method} ${req.originalUrl}`);
  console.log(`[USER ROUTES DEBUG] Path: ${req.path}`);
  console.log(`[USER ROUTES DEBUG] Base URL: ${req.baseUrl}`);
  next();
});

// Authentication middleware applies to ALL routes below
router.use(authenticate);
router.use(authorizeShopAdmin);
router.use(authorizeShopAccess);

// Test route for shop admin functionality
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Shop admin user management routes working',
    shopId: req.user.shopId,
    adminUsername: req.user.username,
    timestamp: new Date().toISOString(),
    capabilities: {
      users: 'Create, update, delete shop users (manager, pro_client, client)',
      credentials: 'Update usernames and passwords for shop users',
      passwords: 'View current passwords for all shop users',
      roles: 'Maximum one user per role per shop'
    }
  });
});

// Shop dashboard
router.get('/dashboard', getShopDashboard);

// Available roles
router.get('/available-roles', getAvailableRoles);

// Get all shop users WITH their passwords
router.get('/with-passwords', getShopUsersWithPasswords);

// SPECIFIC ROUTES MUST COME BEFORE DYNAMIC :userId ROUTES
// This is critical for Express route matching

// Update user credentials - SPECIFIC ROUTE
router.put('/:userId/credentials', (req, res, next) => {
  console.log('[CREDENTIALS ROUTE] Hit! UserId:', req.params.userId);
  console.log('[CREDENTIALS ROUTE] Body:', req.body);
  next();
}, updateUserCredentials);

// Reset user password - SPECIFIC ROUTE
router.post('/:userId/reset-password', resetUserPassword);

// Get specific user WITH password - SPECIFIC ROUTE
router.get('/:userId/password', getUserWithPassword);

// Get all shop users (without passwords) - GENERAL ROUTE
router.get('/', getShopUsers);

// Create new shop user - GENERAL ROUTE
router.post('/', createShopUser);

// Get specific user details (without password) - DYNAMIC ROUTE
router.get('/:userId', getUserDetails);

// Update user (status only) - DYNAMIC ROUTE
router.put('/:userId', updateShopUser);

// Delete/deactivate user - DYNAMIC ROUTE
router.delete('/:userId', deleteShopUser);

module.exports = router;