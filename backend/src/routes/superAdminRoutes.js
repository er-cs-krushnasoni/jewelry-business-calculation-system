const express = require('express');
const router = express.Router();
const {
  getAllShops,
  createShop,
  updateShop,
  resetShopAdminPassword,
  deleteShop,
  getShopDetails,
  getDashboardStats
} = require('../controllers/superAdminController');
const { 
  authenticate, 
  authorizeSuperAdmin,
  checkPasswordChangeRequired 
} = require('../middleware/auth');

// All routes require Super Admin authentication
router.use(authenticate);
router.use(checkPasswordChangeRequired);
router.use(authorizeSuperAdmin);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

// Shop management
router.get('/shops', getAllShops);
router.post('/shops', createShop);
router.get('/shops/:shopId', getShopDetails);
router.put('/shops/:shopId', updateShop);
router.delete('/shops/:shopId', deleteShop);

// Shop admin management
router.post('/shops/:shopId/reset-password', resetShopAdminPassword);

module.exports = router;