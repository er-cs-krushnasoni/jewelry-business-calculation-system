const express = require('express');
const router = express.Router();
const {
  getAllShops,
  createShop,
  updateShop,
  updateShopAdminCredentials,
  deleteShop,
  getShopDetails,
  getDashboardStats,
  extendSubscription,
  reduceSubscription,
  bulkActivateShops,
  bulkDeactivateShops,
  getSubscriptionAnalytics,
  updateOwnCredentials  // ADD THIS IMPORT
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
router.get('/subscription-analytics', getSubscriptionAnalytics);

// Profile management - Super Admin's own credentials
router.put('/profile/credentials', updateOwnCredentials);  // ADD THIS ROUTE

// Shop management
router.get('/shops', getAllShops);
router.post('/shops', createShop);
router.get('/shops/:shopId', getShopDetails);
router.put('/shops/:shopId', updateShop);
router.delete('/shops/:shopId', deleteShop);

// Subscription management
router.post('/shops/:shopId/extend-subscription', extendSubscription);
router.post('/shops/:shopId/reduce-subscription', reduceSubscription);

// Bulk operations
router.post('/shops/bulk-activate', bulkActivateShops);
router.post('/shops/bulk-deactivate', bulkDeactivateShops);

// Shop admin credential management
router.put('/shops/:shopId/admin-credentials', updateShopAdminCredentials);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Super Admin routes working',
    superAdmin: req.user.username,
    timestamp: new Date().toISOString(),
    capabilities: {
      shops: 'Create, update, delete shops',
      subscriptions: 'Extend and reduce shop subscriptions',
      bulkOperations: 'Activate/deactivate multiple shops',
      shopAdmins: 'Update shop admin credentials',
      profile: 'Update own credentials with current password',
      monitoring: 'View analytics and statistics'
    }
  });
});

module.exports = router;