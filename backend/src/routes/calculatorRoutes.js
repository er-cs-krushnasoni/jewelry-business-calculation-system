const express = require('express');
const { authenticate } = require('../middleware/auth');
const { rateBlockingMiddleware } = require('../middleware/rateBlocking');
const {
  testCalculator,
  getNewJewelryCategories,
  getNewJewelryItemCategories,
  calculateNewJewelryPrice,
  getOldJewelryCategories,
  calculateOldJewelryPrice
} = require('../controllers/calculatorController');

const router = express.Router();

// All calculator routes require authentication and rate blocking check
router.use(authenticate);
router.use(rateBlockingMiddleware);

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
      rateInfo: req.rateInfo
    }
  });
});

// ============================================
// NEW JEWELRY CALCULATION ROUTES
// ============================================

// @route   GET /api/calculator/new-jewelry/categories
// @desc    Get available categories for NEW jewelry (with metal filter)
// @access  Private (Shop users only, blocked if rates not updated)
router.get('/new-jewelry/categories', getNewJewelryCategories);

// @route   GET /api/calculator/new-jewelry/item-categories
// @desc    Get unique item categories for filtering
// @access  Private (Shop users only, blocked if rates not updated)
router.get('/new-jewelry/item-categories', getNewJewelryItemCategories);

// @route   POST /api/calculator/new-jewelry/calculate
// @desc    Calculate NEW jewelry prices with rounding
// @access  Private (Shop users only, blocked if rates not updated)
router.post('/new-jewelry/calculate', calculateNewJewelryPrice);

// ============================================
// OLD JEWELRY CALCULATION ROUTES - PHASE 5A
// ============================================

// @route   GET /api/calculator/old-jewelry/categories
// @desc    Get available codes for OLD jewelry (with metal filter)
// @access  Private (Shop users only, blocked if rates not updated)
router.get('/old-jewelry/categories', getOldJewelryCategories);

// @route   POST /api/calculator/old-jewelry/calculate
// @desc    Calculate OLD jewelry scrap prices with Own/Other selection
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
      calculationLevel: 'full',
      canAccessAllCategories: true
    },
    manager: {
      canViewMargins: true,
      canViewPurity: true,
      canViewWholesaleRates: true,
      canAccessResale: true,
      canSeeAllDetails: true,
      calculationLevel: 'full',
      canAccessAllCategories: true
    },
    pro_client: {
      canViewMargins: true,
      canViewPurity: false,
      canViewWholesaleRates: false,
      canAccessResale: true,
      canSeeAllDetails: false,
      calculationLevel: 'margin',
      canAccessAllCategories: true
    },
    client: {
      canViewMargins: false,
      canViewPurity: false,
      canViewWholesaleRates: false,
      canAccessResale: false,
      canSeeAllDetails: false,
      calculationLevel: 'basic',
      canAccessAllCategories: false
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