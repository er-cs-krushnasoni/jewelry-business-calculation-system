const Rate = require('../models/Rate');
const Shop = require('../models/Shop');
const { validationResult } = require('express-validator');

// @desc    Get current rates for a shop
// @route   GET /api/rates/shop/:shopId
// @access  Private (Shop users only)
const getCurrentRates = async (req, res) => {
  try {
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
        requireSetup: true // Flag to indicate rate setup is needed
      });
    }
    
    res.status(200).json({
      success: true,
      data: rates.safeRateInfo
    });
  } catch (error) {
    console.error('Error fetching current rates:', error);
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
      data: rates.safeRateInfo
    });
  } catch (error) {
    console.error('Error fetching user shop rates:', error);
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
    
    res.status(200).json({
      success: true,
      message: 'Rates updated successfully',
      data: updatedRates.safeRateInfo
    });
    
  } catch (error) {
    console.error('Error updating rates:', error);
    
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
    console.error('Error updating user shop rates:', error);
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
        rates: rates ? rates.safeRateInfo : null,
        canUpdateRates: ['admin', 'manager'].includes(req.user.role)
      }
    });
    
  } catch (error) {
    console.error('Error checking rate setup:', error);
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
    if (req.user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Super admin does not have shop-specific rates'
      });
    }
    
    req.params.shopId = req.user.shopId.toString();
    await checkRateSetup(req, res);
    
  } catch (error) {
    console.error('Error checking user shop setup:', error);
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
    
    // Get shop for timezone
    const shop = await Shop.findById(shopId);
    const timezone = shop ? shop.timezone : 'Asia/Kolkata';
    
    res.status(200).json({
      success: true,
      data: rates.getUpdateInfo(timezone)
    });
    
  } catch (error) {
    console.error('Error fetching rate update info:', error);
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
    
    // Get shop timezone
    const shop = await Shop.findById(shopId);
    const timezone = shop ? shop.timezone : 'Asia/Kolkata';
    
    const isUpdatedToday = rates.isUpdatedToday(timezone);
    
    res.status(200).json({
      success: true,
      data: {
        hasRates: true,
        isUpdatedToday,
        requireUpdate: !isUpdatedToday,
        canUpdate: ['admin', 'manager'].includes(req.user.role),
        updateInfo: rates.getUpdateInfo(timezone)
      }
    });
    
  } catch (error) {
    console.error('Error checking daily rate update:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check daily rate update'
    });
  }
};

module.exports = {
  getCurrentRates,
  getMyShopRates,
  updateRates,
  updateMyShopRates,
  checkRateSetup,
  checkMyShopSetup,
  getRateUpdateInfo,
  checkDailyRateUpdate
};