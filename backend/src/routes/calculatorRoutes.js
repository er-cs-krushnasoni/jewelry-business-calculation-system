const express = require('express');
const { authenticate } = require('../middleware/auth');
const { rateBlockingMiddleware } = require('../middleware/rateBlocking');
const {
  testCalculator,
  getNewJewelryOptions,
  getOldJewelryOptions,
  calculateNewJewelryPrice,
  calculateOldJewelryPrice
} = require('../controllers/calculatorController');

const router = express.Router();

// All calculator routes require authentication and rate blocking check
// Apply middleware to all routes in this router
router.use(authenticate);
router.use(rateBlockingMiddleware); // This will block calculator access at 1:00 PM

// ============================================
// CALCULATOR TEST ROUTES
// ============================================

// @route   GET /api/calculator/test
// @desc    Test calculator access (blocked by rate middleware)
// @access  Private (Shop users only, blocked if rates not updated)
router.get('/test', testCalculator);

// @route   GET /api/calculator/status
// @desc    Get calculator system status
// @access  Private (Shop users only)
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      calculatorAvailable: true,
      message: 'Calculator is ready for use',
      userRole: req.user.role,
      canCalculate: ['admin', 'manager', 'pro_client', 'client'].includes(req.user.role),
      rateInfo: req.rateInfo // Added by rate blocking middleware
    }
  });
});

// ============================================
// NEW JEWELRY CALCULATION ROUTES
// ============================================

// @route   GET /api/calculator/new-jewelry/options
// @desc    Get available categories and codes for new jewelry
// @access  Private (Shop users only, blocked if rates not updated)
router.get('/new-jewelry/options', getNewJewelryOptions);

// @route   POST /api/calculator/new-jewelry/calculate
// @desc    Calculate new jewelry prices
// @access  Private (Shop users only, blocked if rates not updated)
router.post('/new-jewelry/calculate', calculateNewJewelryPrice);

// ============================================
// OLD JEWELRY CALCULATION ROUTES
// ============================================

// @route   GET /api/calculator/old-jewelry/options
// @desc    Get available codes for old jewelry
// @access  Private (Shop users only, blocked if rates not updated)
router.get('/old-jewelry/options', getOldJewelryOptions);

// @route   POST /api/calculator/old-jewelry/calculate
// @desc    Calculate old jewelry prices (scrap/resale)
// @access  Private (Shop users only, blocked if rates not updated)
router.post('/old-jewelry/calculate', calculateOldJewelryPrice);

// ============================================
// UTILITY ROUTES
// ============================================

// @route   GET /api/calculator/user-permissions
// @desc    Get user's calculation permissions and visibility
// @access  Private (Shop users only)
router.get('/user-permissions', (req, res) => {
  const role = req.user.role;
  
  const permissions = {
    admin: {
      canViewMargins: true,
      canViewPurity: true,
      canViewWholesaleRates: true,
      canAccessResale: true,
      canSeeAllDetails: true,
      calculationLevel: 'full'
    },
    manager: {
      canViewMargins: true,
      canViewPurity: true,
      canViewWholesaleRates: true,
      canAccessResale: true,
      canSeeAllDetails: true,
      calculationLevel: 'full'
    },
    pro_client: {
      canViewMargins: true,
      canViewPurity: false,
      canViewWholesaleRates: false,
      canAccessResale: true,
      canSeeAllDetails: false,
      calculationLevel: 'margin'
    },
    client: {
      canViewMargins: false,
      canViewPurity: false,
      canViewWholesaleRates: false,
      canAccessResale: false,
      canSeeAllDetails: false,
      calculationLevel: 'basic'
    }
  };
  
  res.status(200).json({
    success: true,
    data: {
      role: role,
      permissions: permissions[role] || permissions.client,
      shopId: req.user.shopId
    }
  });
});

module.exports = router;