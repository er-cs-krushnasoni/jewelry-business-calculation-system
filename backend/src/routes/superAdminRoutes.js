const express = require('express');
const router = express.Router();
const {
  getAllShops,
  createShop,
  updateShop,
  updateShopAdminCredentials,
  resetShopAdminPassword,
  deleteShop,
  getShopDetails,
  getDashboardStats
} = require('../controllers/superAdminController');
const { 
  authenticate, 
  authorizeSuperAdmin
} = require('../middleware/auth');

// All routes require Super Admin authentication
router.use(authenticate);
router.use(authorizeSuperAdmin);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

// Shop management
router.get('/shops', getAllShops);
router.post('/shops', createShop);
router.get('/shops/:shopId', getShopDetails);
router.put('/shops/:shopId', updateShop);
router.delete('/shops/:shopId', deleteShop);

// Shop admin credential management
router.put('/shops/:shopId/admin-credentials', updateShopAdminCredentials); // New route
router.post('/shops/:shopId/reset-password', resetShopAdminPassword); // Deprecated

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Super Admin routes working',
    superAdmin: req.user.username,
    timestamp: new Date().toISOString(),
    capabilities: {
      shops: 'Create, update, delete shops',
      shopAdmins: 'Update shop admin usernames and passwords',
      monitoring: 'View all shop activities and statistics'
    }
  });
});

module.exports = router;