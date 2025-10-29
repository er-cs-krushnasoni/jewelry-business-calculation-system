const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// FIXED: Import authenticate (not auth) from middleware
const { authenticate } = require('../middleware/auth');

// Import controller with error handling
let rateController;
try {
  rateController = require('../controllers/rateController');
  // console.log('Rate controller imported successfully');
  
  // Check if all required functions exist
  const requiredFunctions = [
    'getCurrentRates',
    'getMyShopRates', 
    'updateRates',
    'updateMyShopRates',
    'checkRateSetup',
    'checkMyShopSetup',
    'getRateUpdateInfo',
    'checkDailyRateUpdate',
    'getHeaderRateInfo',
    'getBlockingStatus'
  ];
  
  const missingFunctions = requiredFunctions.filter(fn => typeof rateController[fn] !== 'function');
  if (missingFunctions.length > 0) {
    console.error('Missing controller functions:', missingFunctions);
    throw new Error(`Missing functions: ${missingFunctions.join(', ')}`);
  }
  
  // console.log('All rate controller functions verified');
  
} catch (error) {
  console.error('Error importing rate controller:', error);
  // Create fallback functions to prevent route loading failure
  rateController = {};
  const fallbackFunction = (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Rate controller not available',
      error: 'Controller functions not loaded properly'
    });
  };
  
  rateController.getCurrentRates = fallbackFunction;
  rateController.getMyShopRates = fallbackFunction;
  rateController.updateRates = fallbackFunction;
  rateController.updateMyShopRates = fallbackFunction;
  rateController.checkRateSetup = fallbackFunction;
  rateController.checkMyShopSetup = fallbackFunction;
  rateController.getRateUpdateInfo = fallbackFunction;
  rateController.checkDailyRateUpdate = fallbackFunction;
  rateController.getHeaderRateInfo = fallbackFunction;
  rateController.getBlockingStatus = fallbackFunction;
}

// Destructure after verification
const {
  getCurrentRates,
  getMyShopRates,
  updateRates,
  updateMyShopRates,
  checkRateSetup,
  checkMyShopSetup,
  getRateUpdateInfo,
  checkDailyRateUpdate,
  getHeaderRateInfo,
  getBlockingStatus
} = rateController;

// Rate validation middleware
const rateValidation = [
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
    body('goldSell')
    .custom((value, { req }) => {
      if (parseInt(value) < parseInt(req.body.goldBuy)) {
        throw new Error('Gold selling rate must be equal to or higher than buying rate');
      }
      return true;
    }),
  body('silverSell')
    .custom((value, { req }) => {
      if (parseInt(value) < parseInt(req.body.silverBuy)) {
        throw new Error('Silver selling rate must be equal to or higher than buying rate');
      }
      return true;
    })
];

// ============================================
// CRITICAL ROUTES (Fix the 404 errors)
// ============================================

// Test route first to verify routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rate routes are working perfectly!',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/rates/test',
      'GET /api/rates/header-info',
      'GET /api/rates/blocking-status',
      'GET /api/rates/my-rates',
      'PUT /api/rates/my-rates',
      'GET /api/rates/my-setup',
      'GET /api/rates/shop/:shopId',
      'PUT /api/rates/shop/:shopId',
      'GET /api/rates/check-setup/:shopId',
      'GET /api/rates/update-info/:shopId',
      'GET /api/rates/check-daily/:shopId',
      'GET /api/rates/validation-rules'
    ]
  });
});

// FIXED: Header display route - authenticate instead of auth
router.get('/header-info', authenticate, getHeaderRateInfo);

// FIXED: Blocking status route - authenticate instead of auth
router.get('/blocking-status', authenticate, getBlockingStatus);

// ============================================
// USER'S OWN SHOP ROUTES
// ============================================

// User's own shop rates
router.get('/my-rates', authenticate, getMyShopRates);
router.put('/my-rates', authenticate, rateValidation, updateMyShopRates);
router.get('/my-setup', authenticate, checkMyShopSetup);

// ============================================
// SHOP-SPECIFIC ROUTES
// ============================================

// Shop-specific routes (admin access required)
router.get('/shop/:shopId', authenticate, getCurrentRates);
router.put('/shop/:shopId', authenticate, rateValidation, updateRates);
router.get('/check-setup/:shopId', authenticate, checkRateSetup);
router.get('/update-info/:shopId', authenticate, getRateUpdateInfo);
router.get('/check-daily/:shopId', authenticate, checkDailyRateUpdate);

// ============================================
// UTILITY AND INFORMATION ROUTES
// ============================================

// Get rate validation rules for frontend
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

// Get information about rate formats and units
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

// Debug route to check if all controller functions are available
router.get('/debug/functions', (req, res) => {
  const controllerFunctions = {
    getCurrentRates: typeof getCurrentRates,
    getMyShopRates: typeof getMyShopRates,
    updateRates: typeof updateRates,
    updateMyShopRates: typeof updateMyShopRates,
    checkRateSetup: typeof checkRateSetup,
    checkMyShopSetup: typeof checkMyShopSetup,
    getRateUpdateInfo: typeof getRateUpdateInfo,
    checkDailyRateUpdate: typeof checkDailyRateUpdate,
    getHeaderRateInfo: typeof getHeaderRateInfo,
    getBlockingStatus: typeof getBlockingStatus
  };

  res.json({
    success: true,
    message: 'Rate controller function check',
    functions: controllerFunctions,
    allFunctionsAvailable: Object.values(controllerFunctions).every(type => type === 'function'),
    timestamp: new Date().toISOString()
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

// Route-specific error handler
router.use((err, req, res, next) => {
  console.error('Rate routes error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Rate routes internal error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// console.log('Rate routes module loaded successfully');

module.exports = router;