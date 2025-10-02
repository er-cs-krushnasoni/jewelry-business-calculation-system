// Rate Controller - Safe Implementation
console.log('Loading rate controller...');

const { validationResult } = require('express-validator');

// Import models safely
let Rate, Shop;
try {
  Rate = require('../models/Rate');
  Shop = require('../models/Shop');
  console.log('Rate and Shop models imported successfully');
} catch (error) {
  console.error('Error importing models:', error);
}

// Import rate blocking middleware safely
let checkRateBlocking;
try {
  const rateBlockingMiddleware = require('../middleware/rateBlocking');
  checkRateBlocking = rateBlockingMiddleware.checkRateBlocking;
  console.log('Rate blocking middleware imported successfully');
} catch (error) {
  console.log('Rate blocking middleware not found, using fallback');
  // Fallback function if middleware doesn't exist
  checkRateBlocking = async (shopId) => {
    try {
      const currentTime = new Date();
      const istTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const currentHour = istTime.getHours();
      
      // Check if current time is past 1:00 PM (13:00)
      if (currentHour >= 13) {
        // Check if rates are updated today
        const rates = await Rate.getCurrentRatesForShop(shopId);
        if (!rates || !rates.isUpdatedToday()) {
          return {
            shouldBlock: true,
            message: 'Calculator is blocked. Rates must be updated daily before 1:00 PM IST.'
          };
        }
      }
      
      return {
        shouldBlock: false,
        message: 'Calculator is available'
      };
    } catch (error) {
      console.error('Error in fallback checkRateBlocking:', error);
      return {
        shouldBlock: false,
        message: 'Blocking check failed, allowing access'
      };
    }
  };
}

// @desc    Get current rates for a shop
// @route   GET /api/rates/shop/:shopId
// @access  Private (Shop users only)
const getCurrentRates = async (req, res) => {
  try {
    console.log('getCurrentRates called for shopId:', req.params.shopId);
    
    if (!Rate) {
      return res.status(500).json({
        success: false,
        message: 'Rate model not available'
      });
    }

    const { shopId } = req.params;
    
    // Verify user can access this shop's rates
    if (req.user.role !== 'super_admin' && !req.user.canAccessShop(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your shop\'s rates'
      });
    }
    
    // Get current rates for the shop
    const rates = await Rate.getCurrentRatesForShop(shopId);
    
    if (!rates) {
      return res.status(404).json({
        success: false,
        message: 'No rates found for this shop',
        requireSetup: true
      });
    }
    
    res.status(200).json({
      success: true,
      data: rates.safeRateInfo || {
        shopId: rates.shopId,
        goldBuy: rates.goldBuy,
        goldSell: rates.goldSell,
        silverBuy: rates.silverBuy,
        silverSell: rates.silverSell,
        lastUpdated: rates.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in getCurrentRates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rates'
    });
  }
};

// @desc    Get user's shop rates
// @route   GET /api/rates/my-rates
// @access  Private (Shop users only)
const getMyShopRates = async (req, res) => {
  try {
    console.log('getMyShopRates called for user:', req.user.username);
    
    if (!Rate) {
      return res.status(500).json({
        success: false,
        message: 'Rate model not available'
      });
    }
    
    if (req.user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Super admin does not have shop-specific rates'
      });
    }
    
    const rates = await Rate.getCurrentRatesForShop(req.user.shopId);
    
    if (!rates) {
      return res.status(404).json({
        success: false,
        message: 'No rates set for your shop',
        requireSetup: true
      });
    }
    
    res.status(200).json({
      success: true,
      data: rates.safeRateInfo || {
        shopId: rates.shopId,
        goldBuy: rates.goldBuy,
        goldSell: rates.goldSell,
        silverBuy: rates.silverBuy,
        silverSell: rates.silverSell,
        lastUpdated: rates.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in getMyShopRates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your shop rates'
    });
  }
};

// @desc    Update/Create rates for a shop
// @route   PUT /api/rates/shop/:shopId
// @access  Private (Admin/Manager only)
const updateRates = async (req, res) => {
  try {
    console.log('updateRates called for shopId:', req.params.shopId);
    
    if (!Rate || !Shop) {
      return res.status(500).json({
        success: false,
        message: 'Required models not available'
      });
    }
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { shopId } = req.params;
    const { goldBuy, goldSell, silverBuy, silverSell } = req.body;
    
    // Verify user can update rates for this shop
    if (req.user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin cannot update shop rates directly'
      });
    }
    
    if (!req.user.canAccessShop(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only update your shop\'s rates'
      });
    }
    
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only shop admin and manager can update rates'
      });
    }
    
    // Verify shop exists and is active
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    if (!shop.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update rates for inactive shop'
      });
    }
    
    // Update or create rates
    const rateData = {
      goldBuy: parseInt(goldBuy),
      goldSell: parseInt(goldSell),
      silverBuy: parseInt(silverBuy),
      silverSell: parseInt(silverSell)
    };
    
    const updatedRates = await Rate.updateShopRates(shopId, rateData, req.user);
    
    // After successful update, check if this unblocks the system
    let blockingResult = { shouldBlock: false, message: 'Calculator is available' };
    if (checkRateBlocking) {
      try {
        blockingResult = await checkRateBlocking(shopId);
      } catch (error) {
        console.error('Error checking blocking status:', error);
      }
    }
    
    // Prepare response data
    const responseData = {
      success: true,
      message: 'Rates updated successfully',
      data: updatedRates.safeRateInfo || {
        shopId: updatedRates.shopId,
        goldBuy: updatedRates.goldBuy,
        goldSell: updatedRates.goldSell,
        silverBuy: updatedRates.silverBuy,
        silverSell: updatedRates.silverSell,
        lastUpdated: updatedRates.updatedAt
      },
      systemStatus: {
        isBlocked: blockingResult.shouldBlock,
        unblocked: !blockingResult.shouldBlock,
        message: blockingResult.shouldBlock ? blockingResult.message : 'Calculator is now available'
      }
    };
    
    // Broadcast real-time update to all users in the shop
    if (global.broadcastRateUpdate && typeof global.broadcastRateUpdate === 'function') {
      try {
        const updateInfo = updatedRates.getUpdateInfo ? updatedRates.getUpdateInfo() : {
          updatedBy: req.user.username,
          role: req.user.role,
          timestamp: new Date().toISOString(),
          isToday: true
        };
        global.broadcastRateUpdate(shopId, responseData.data, updateInfo);
        
        // Also broadcast system blocking status change
        if (global.broadcastSystemBlocking && typeof global.broadcastSystemBlocking === 'function') {
          global.broadcastSystemBlocking(shopId, blockingResult);
        }
        
        console.log(`Real-time rate update broadcasted for shop ${shopId} by ${req.user.username}`);
      } catch (error) {
        console.error('Error broadcasting update:', error);
      }
    }
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Error in updateRates:', error);
    
    if (error.code === 'RATE_VALIDATION_ERROR') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update rates'
    });
  }
};

// @desc    Update current user's shop rates
// @route   PUT /api/rates/my-rates
// @access  Private (Admin/Manager only)
const updateMyShopRates = async (req, res) => {
  try {
    console.log('updateMyShopRates called for user:', req.user.username);
    
    if (req.user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Super admin does not have shop-specific rates to update'
      });
    }
    
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only shop admin and manager can update rates'
      });
    }
    
    // Use the shop-specific update method
    req.params.shopId = req.user.shopId.toString();
    await updateRates(req, res);
    
  } catch (error) {
    console.error('Error in updateMyShopRates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update your shop rates'
    });
  }
};

// @desc    Check if shop needs rate setup
// @route   GET /api/rates/check-setup/:shopId
// @access  Private (Shop users only)
const checkRateSetup = async (req, res) => {
  try {
    console.log('checkRateSetup called for shopId:', req.params.shopId);
    
    if (!Rate) {
      return res.status(500).json({
        success: false,
        message: 'Rate model not available'
      });
    }
    
    const { shopId } = req.params;
    
    // Verify user can access this shop
    if (req.user.role !== 'super_admin' && !req.user.canAccessShop(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only check your shop\'s rate setup'
      });
    }
    
    const hasRates = await Rate.shopHasRates(shopId);
    const rates = hasRates ? await Rate.getCurrentRatesForShop(shopId) : null;
    
    res.status(200).json({
      success: true,
      data: {
        hasRates,
        requireSetup: !hasRates,
        rates: rates ? (rates.safeRateInfo || {
          shopId: rates.shopId,
          goldBuy: rates.goldBuy,
          goldSell: rates.goldSell,
          silverBuy: rates.silverBuy,
          silverSell: rates.silverSell,
          lastUpdated: rates.updatedAt
        }) : null,
        canUpdateRates: ['admin', 'manager'].includes(req.user.role)
      }
    });
    
  } catch (error) {
    console.error('Error in checkRateSetup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check rate setup'
    });
  }
};

// @desc    Check if current user's shop needs rate setup
// @route   GET /api/rates/my-setup
// @access  Private (Shop users only)
const checkMyShopSetup = async (req, res) => {
  try {
    console.log('checkMyShopSetup called for user:', req.user.username);
    
    if (req.user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Super admin does not have shop-specific rates'
      });
    }
    
    req.params.shopId = req.user.shopId.toString();
    await checkRateSetup(req, res);
    
  } catch (error) {
    console.error('Error in checkMyShopSetup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check your shop rate setup'
    });
  }
};

// @desc    Get rate update info for display
// @route   GET /api/rates/update-info/:shopId
// @access  Private (Shop users only)
const getRateUpdateInfo = async (req, res) => {
  try {
    console.log('getRateUpdateInfo called for shopId:', req.params.shopId);
    
    if (!Rate) {
      return res.status(500).json({
        success: false,
        message: 'Rate model not available'
      });
    }
    
    const { shopId } = req.params;
    
    // Verify user can access this shop
    if (req.user.role !== 'super_admin' && !req.user.canAccessShop(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const rates = await Rate.getCurrentRatesForShop(shopId);
    
    if (!rates) {
      return res.status(404).json({
        success: false,
        message: 'No rates found',
        requireSetup: true
      });
    }
    
    // Always use IST for consistency
    const timezone = 'Asia/Kolkata';
    let updateInfo;
    
    if (rates.getUpdateInfo && typeof rates.getUpdateInfo === 'function') {
      updateInfo = rates.getUpdateInfo(timezone);
    } else {
      updateInfo = {
        updatedBy: rates.updatedByUsername || 'Unknown',
        role: rates.updatedByRole || 'unknown',
        timestamp: rates.updatedAt ? rates.updatedAt.toISOString() : new Date().toISOString(),
        isToday: true
      };
    }
    
    res.status(200).json({
      success: true,
      data: updateInfo
    });
    
  } catch (error) {
    console.error('Error in getRateUpdateInfo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rate update info'
    });
  }
};

// @desc    Check if today's rates are updated (for 1:00 PM blocking logic)
// @route   GET /api/rates/check-daily/:shopId
// @access  Private (Shop users only)
const checkDailyRateUpdate = async (req, res) => {
  try {
    console.log('checkDailyRateUpdate called for shopId:', req.params.shopId);
    
    if (!Rate) {
      return res.status(500).json({
        success: false,
        message: 'Rate model not available'
      });
    }
    
    const { shopId } = req.params;
    
    // Verify user can access this shop
    if (req.user.role !== 'super_admin' && !req.user.canAccessShop(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const rates = await Rate.getCurrentRatesForShop(shopId);
    
    if (!rates) {
      return res.status(200).json({
        success: true,
        data: {
          hasRates: false,
          isUpdatedToday: false,
          requireUpdate: true,
          canUpdate: ['admin', 'manager'].includes(req.user.role)
        }
      });
    }
    
    // Always use IST timezone
    const timezone = 'Asia/Kolkata';
    let isUpdatedToday = false;
    
    if (rates.isUpdatedToday && typeof rates.isUpdatedToday === 'function') {
      isUpdatedToday = rates.isUpdatedToday(timezone);
    }
    
    let updateInfo;
    if (rates.getUpdateInfo && typeof rates.getUpdateInfo === 'function') {
      updateInfo = rates.getUpdateInfo(timezone);
    } else {
      updateInfo = {
        updatedBy: rates.updatedByUsername || 'Unknown',
        role: rates.updatedByRole || 'unknown',
        timestamp: rates.updatedAt ? rates.updatedAt.toISOString() : new Date().toISOString(),
        isToday: isUpdatedToday
      };
    }
    
    res.status(200).json({
      success: true,
      data: {
        hasRates: true,
        isUpdatedToday,
        requireUpdate: !isUpdatedToday,
        canUpdate: ['admin', 'manager'].includes(req.user.role),
        updateInfo: updateInfo
      }
    });
    
  } catch (error) {
    console.error('Error in checkDailyRateUpdate:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check daily rate update'
    });
  }
};

// @desc    Get rate update info for header display
// @route   GET /api/rates/header-info
// @access  Private (Shop users only)
const getHeaderRateInfo = async (req, res) => {
  try {
    // console.log('getHeaderRateInfo called for user:', req.user ? req.user.username : 'unknown');
    
    if (!Rate) {
      return res.status(500).json({
        success: false,
        message: 'Rate model not available'
      });
    }
    
    if (req.user.role === 'super_admin') {
      return res.status(200).json({
        success: true,
        data: {
          showRateInfo: false,
          message: 'Super admin - no shop rates'
        }
      });
    }
    
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any shop'
      });
    }
    
    const rates = await Rate.getCurrentRatesForShop(shopId);
    
    if (!rates) {
      return res.status(200).json({
        success: true,
        data: {
          showRateInfo: false,
          hasRates: false,
          message: 'No rates set'
        }
      });
    }
    
    const timezone = 'Asia/Kolkata';
    let updateInfo;
    
    if (rates.getUpdateInfo && typeof rates.getUpdateInfo === 'function') {
      updateInfo = rates.getUpdateInfo(timezone);
    } else {
      updateInfo = {
        updatedBy: rates.updatedByUsername || 'Unknown',
        role: rates.updatedByRole || 'unknown',
        timestamp: rates.updatedAt ? rates.updatedAt.toLocaleString('en-IN', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : 'Unknown',
        isToday: true
      };
    }
    
    res.status(200).json({
      success: true,
      data: {
        showRateInfo: true,
        hasRates: true,
        updateInfo: {
          updatedBy: updateInfo.updatedBy,
          role: updateInfo.role,
          timestamp: updateInfo.timestamp,
          isToday: updateInfo.isToday
        },
        currentRates: {
          gold: {
            buy: rates.goldBuy,
            sell: rates.goldSell
          },
          silver: {
            buy: rates.silverBuy, 
            sell: rates.silverSell
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error in getHeaderRateInfo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch header rate info'
    });
  }
};

// @desc    Get blocking status for current user's shop
// @route   GET /api/rates/blocking-status
// @access  Private (Shop users only)
const getBlockingStatus = async (req, res) => {
  try {
    console.log('getBlockingStatus called for user:', req.user ? req.user.username : 'unknown');
    
    if (req.user.role === 'super_admin') {
      return res.status(200).json({
        success: true,
        data: {
          isBlocked: false,
          message: 'Super admin is never blocked',
          systemStatus: {
            dailyDeadline: '1:00 PM IST',
            currentTimeIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          }
        }
      });
    }

    const shopId = req.user.shopId;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any shop'
      });
    }

    // Use the blocking check function
    let blockingResult = { shouldBlock: false, message: 'Calculator is available' };
    if (checkRateBlocking) {
      try {
        blockingResult = await checkRateBlocking(shopId);
      } catch (error) {
        console.error('Error checking blocking status:', error);
      }
    }

    // Get rate info if available
    let rateInfo = null;
    if (Rate) {
      try {
        const rates = await Rate.getCurrentRatesForShop(shopId);
        if (rates) {
          const timezone = 'Asia/Kolkata';
          if (rates.getUpdateInfo && typeof rates.getUpdateInfo === 'function') {
            rateInfo = rates.getUpdateInfo(timezone);
          } else {
            rateInfo = {
              updatedBy: rates.updatedByUsername || 'Unknown',
              role: rates.updatedByRole || 'unknown',
              timestamp: rates.updatedAt ? rates.updatedAt.toISOString() : new Date().toISOString(),
              isToday: true
            };
          }
        }
      } catch (error) {
        console.log('No rates found for blocking status check');
      }
    }

    const currentTime = new Date();
    const istTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    res.status(200).json({
      success: true,
      data: {
        isBlocked: blockingResult.shouldBlock,
        message: blockingResult.message,
        rateInfo: rateInfo,
        systemStatus: {
          dailyDeadline: '1:00 PM IST',
          currentTimeIST: istTime.toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        }
      }
    });

  } catch (error) {
    console.error('Error in getBlockingStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get blocking status'
    });
  }
};

console.log('Rate controller functions defined successfully');

// Export all functions
module.exports = {
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
};

console.log('Rate controller module exported successfully');