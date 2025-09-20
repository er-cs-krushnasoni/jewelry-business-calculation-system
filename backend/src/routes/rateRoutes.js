const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { rateBlockingMiddleware, checkBlockingStatus } = require('../middleware/rateBlocking');
const {
  getCurrentRates,
  getMyShopRates,
  updateRates,
  updateMyShopRates,
  checkRateSetup,
  checkMyShopSetup,
  getRateUpdateInfo,
  checkDailyRateUpdate,
  getHeaderRateInfo
} = require('../controllers/rateController');

const router = express.Router();

// Validation middleware for rate updates
const validateRateUpdate = [
  body('goldBuy')
    .isInt({ min: 1 })
    .withMessage('Gold buying rate must be a positive integer'),
  body('goldSell')
    .isInt({ min: 1 })
    .withMessage('Gold selling rate must be a positive integer'),
  body('silverBuy')
    .isInt({ min: 1 })
    .withMessage('Silver buying rate must be a positive integer'),
  body('silverSell')
    .isInt({ min: 1 })
    .withMessage('Silver selling rate must be a positive integer'),
  
  // Custom validation to ensure selling rates > buying rates
  body('goldSell').custom((goldSell, { req }) => {
    const goldBuy = parseInt(req.body.goldBuy);
    if (parseInt(goldSell) < goldBuy) {
      throw new Error('Gold selling rate must be higher than gold buying rate');
    }
    return true;
  }),
  
  body('silverSell').custom((silverSell, { req }) => {
    const silverBuy = parseInt(req.body.silverBuy);
    if (parseInt(silverSell) < silverBuy) {
      throw new Error('Silver selling rate must be higher than silver buying rate');
    }
    return true;
  })
];

// ============================================
// BLOCKING STATUS ROUTES
// ============================================

// @route   GET /api/rates/blocking-status
// @desc    Check if system is blocked due to rate update requirements
// @access  Private (Shop users only)
router.get('/blocking-status', authenticate, checkBlockingStatus);

// ============================================
// USER'S OWN SHOP RATE ROUTES (Most Common)
// ============================================

// @route   GET /api/rates/my-rates
// @desc    Get current user's shop rates
// @access  Private (Shop users only)
router.get('/my-rates', authenticate, getMyShopRates);

// @route   PUT /api/rates/my-rates
// @desc    Update current user's shop rates (bypasses blocking for unblocking)
// @access  Private (Admin/Manager only)
router.put('/my-rates', authenticate, validateRateUpdate, updateMyShopRates);

// @route   GET /api/rates/my-setup
// @desc    Check if current user's shop needs rate setup
// @access  Private (Shop users only)
router.get('/my-setup', authenticate, checkMyShopSetup);

// @route   GET /api/rates/my-daily-check
// @desc    Check if today's rates are updated for current user's shop
// @access  Private (Shop users only)
router.get('/my-daily-check', authenticate, (req, res, next) => {
  if (req.user.role === 'super_admin') {
    return res.status(400).json({
      success: false,
      message: 'Super admin does not have shop-specific rates'
    });
  }
  req.params.shopId = req.user.shopId.toString();
  checkDailyRateUpdate(req, res, next);
});

// @route   GET /api/rates/header-info
// @desc    Get rate update info for header display
// @access  Private (All authenticated users)
router.get('/header-info', authenticate, getHeaderRateInfo);

// ============================================
// SPECIFIC SHOP RATE ROUTES
// ============================================

// @route   GET /api/rates/shop/:shopId
// @desc    Get current rates for a specific shop
// @access  Private (Shop users only, must have access to the shop)
router.get('/shop/:shopId', authenticate, getCurrentRates);

// @route   PUT /api/rates/shop/:shopId
// @desc    Update rates for a specific shop (bypasses blocking for unblocking)
// @access  Private (Admin/Manager only, must have access to the shop)
router.put('/shop/:shopId', authenticate, validateRateUpdate, updateRates);

// @route   GET /api/rates/check-setup/:shopId
// @desc    Check if shop needs rate setup
// @access  Private (Shop users only, must have access to the shop)
router.get('/check-setup/:shopId', authenticate, checkRateSetup);

// @route   GET /api/rates/update-info/:shopId
// @desc    Get rate update info for display (who updated, when)
// @access  Private (Shop users only, must have access to the shop)
router.get('/update-info/:shopId', authenticate, getRateUpdateInfo);

// @route   GET /api/rates/check-daily/:shopId
// @desc    Check if today's rates are updated (for 1:00 PM blocking logic)
// @access  Private (Shop users only, must have access to the shop)
router.get('/check-daily/:shopId', authenticate, checkDailyRateUpdate);

// ============================================
// UTILITY ROUTES
// ============================================

// @route   GET /api/rates/validation-rules
// @desc    Get rate validation rules for frontend
// @access  Private
router.get('/validation-rules', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      goldRates: {
        unit: 'per 10 grams',
        type: 'integer',
        min: 1,
        validation: 'Selling rate must be higher than buying rate'
      },
      silverRates: {
        unit: 'per 1 kg',
        type: 'integer', 
        min: 1,
        validation: 'Selling rate must be higher than buying rate'
      },
      updatePermissions: ['admin', 'manager'],
      viewPermissions: ['admin', 'manager', 'pro_client', 'client'],
      blockingInfo: {
        dailyDeadline: '1:00 PM IST',
        timezone: 'Asia/Kolkata',
        blockingReason: 'Rates must be updated daily before 1:00 PM IST'
      }
    }
  });
});

// @route   GET /api/rates/rate-format-info
// @desc    Get information about rate formats and units
// @access  Private
router.get('/rate-format-info', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      rateStructure: {
        goldBuy: {
          label: 'Gold Buying Rate',
          unit: '₹ per 10 grams',
          description: 'Rate at which gold is purchased'
        },
        goldSell: {
          label: 'Gold Selling Rate', 
          unit: '₹ per 10 grams',
          description: 'Rate at which gold is sold'
        },
        silverBuy: {
          label: 'Silver Buying Rate',
          unit: '₹ per kg',
          description: 'Rate at which silver is purchased'
        },
        silverSell: {
          label: 'Silver Selling Rate',
          unit: '₹ per kg', 
          description: 'Rate at which silver is sold'
        }
      },
      calculationInfo: {
        goldPerGram: 'Gold rates divided by 10 for per-gram calculations',
        silverPerGram: 'Silver rates divided by 1000 for per-gram calculations',
        roundingRules: {
          selling: 'Round UP for selling rates',
          buying: 'Round DOWN for buying rates'
        }
      },
      blockingSystem: {
        deadline: '1:00 PM IST daily',
        timezone: 'Asia/Kolkata',
        requirement: 'Rates must be updated on the same day',
        unblockingRoles: ['admin', 'manager']
      }
    }
  });
});

// Error handling for invalid shop ID format
router.use('/shop/:shopId', (err, req, res, next) => {
  if (err.name === 'CastError' && err.path === 'shopId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid shop ID format'
    });
  }
  next(err);
});

module.exports = router;