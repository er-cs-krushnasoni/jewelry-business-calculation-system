const Rate = require('../models/Rate');
// const Category = require('../models/Category'); // Will be implemented in future phases

// @desc    Test calculator access (this route is protected by rate blocking middleware)
// @route   GET /api/calculator/test
// @access  Private (Shop users only, blocked if rates not updated)
const testCalculator = async (req, res) => {
  try {
    // If we reach here, it means rate blocking middleware passed
    const rates = await Rate.getCurrentRatesForShop(req.user.shopId);
    
    res.status(200).json({
      success: true,
      message: 'Calculator access granted - rates are up to date',
      data: {
        userRole: req.user.role,
        shopId: req.user.shopId,
        calculatorAvailable: true,
        ratesAvailable: !!rates,
        currentRates: rates ? {
          gold: {
            buy: rates.goldBuy,
            sell: rates.goldSell
          },
          silver: {
            buy: rates.silverBuy,
            sell: rates.silverSell
          }
        } : null,
        lastRateUpdate: rates ? rates.getUpdateInfo('Asia/Kolkata') : null
      }
    });
  } catch (error) {
    console.error('Error in calculator test:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to access calculator'
    });
  }
};

// @desc    Get available categories and codes for new jewelry calculation
// @route   GET /api/calculator/new-jewelry/options
// @access  Private (Shop users only, blocked if rates not updated)
const getNewJewelryOptions = async (req, res) => {
  try {
    // For now, return placeholder data
    // In future phases, this will fetch from Category model
    
    res.status(200).json({
      success: true,
      message: 'New jewelry options (placeholder data)',
      data: {
        metals: ['gold', 'silver'],
        categories: {
          gold: ['chain', 'bracelet', 'mangalsutra', 'ring', 'earring'],
          silver: ['chain', 'bracelet', 'ring', 'anklet']
        },
        placeholder: true,
        note: 'Category management will be implemented in future phases'
      }
    });
  } catch (error) {
    console.error('Error fetching new jewelry options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch new jewelry options'
    });
  }
};

// @desc    Get available codes for old jewelry calculation
// @route   GET /api/calculator/old-jewelry/options
// @access  Private (Shop users only, blocked if rates not updated)
const getOldJewelryOptions = async (req, res) => {
  try {
    // For now, return placeholder data
    // In future phases, this will fetch from Category model
    
    res.status(200).json({
      success: true,
      message: 'Old jewelry options (placeholder data)',
      data: {
        metals: ['gold', 'silver'],
        sources: ['own', 'other'],
        placeholder: true,
        note: 'Category management will be implemented in future phases'
      }
    });
  } catch (error) {
    console.error('Error fetching old jewelry options:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch old jewelry options'
    });
  }
};

// @desc    Calculate new jewelry price
// @route   POST /api/calculator/new-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateNewJewelryPrice = async (req, res) => {
  try {
    // For now, return placeholder calculation
    // In future phases, this will use actual category data and business logic
    
    const { metal, category, weight, code } = req.body;
    
    if (!metal || !category || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Metal, category, and weight are required'
      });
    }
    
    const rates = await Rate.getCurrentRatesForShop(req.user.shopId);
    if (!rates) {
      return res.status(400).json({
        success: false,
        message: 'No rates available for calculation'
      });
    }
    
    // Placeholder calculation logic
    const isGold = metal.toLowerCase() === 'gold';
    const baseRate = isGold ? rates.goldSell : rates.silverSell;
    const perGramRate = isGold ? rates.getGoldRatePerGram().sell : rates.getSilverRatePerGram().sell;
    
    // Simple calculation for demonstration
    const totalAmount = Math.floor(perGramRate * parseFloat(weight));
    
    res.status(200).json({
      success: true,
      message: 'New jewelry calculation completed (placeholder)',
      data: {
        calculation: {
          metal,
          category,
          weight: parseFloat(weight),
          code: code || 'DEMO001',
          ratePerGram: perGramRate,
          totalAmount,
          placeholder: true
        },
        userRole: req.user.role,
        visibilityLevel: getUserVisibilityLevel(req.user.role),
        note: 'Actual calculation logic will be implemented in future phases'
      }
    });
    
  } catch (error) {
    console.error('Error calculating new jewelry price:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate new jewelry price'
    });
  }
};

// @desc    Calculate old jewelry price (scrap/resale)
// @route   POST /api/calculator/old-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateOldJewelryPrice = async (req, res) => {
  try {
    // For now, return placeholder calculation
    // In future phases, this will use actual category data and business logic
    
    const { metal, source, weight, code } = req.body;
    
    if (!metal || !source || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Metal, source, and weight are required'
      });
    }
    
    const rates = await Rate.getCurrentRatesForShop(req.user.shopId);
    if (!rates) {
      return res.status(400).json({
        success: false,
        message: 'No rates available for calculation'
      });
    }
    
    // Placeholder calculation logic
    const isGold = metal.toLowerCase() === 'gold';
    const baseRate = isGold ? rates.goldBuy : rates.silverBuy;
    const perGramRate = isGold ? rates.getGoldRatePerGram().buy : rates.getSilverRatePerGram().buy;
    
    // Simple scrap value calculation for demonstration
    const scrapValue = Math.floor(perGramRate * parseFloat(weight) * 0.85); // 85% of buying rate
    
    res.status(200).json({
      success: true,
      message: 'Old jewelry calculation completed (placeholder)',
      data: {
        calculation: {
          metal,
          source,
          weight: parseFloat(weight),
          code: code || 'OLD001',
          ratePerGram: perGramRate,
          scrapValue,
          placeholder: true
        },
        userRole: req.user.role,
        visibilityLevel: getUserVisibilityLevel(req.user.role),
        note: 'Actual calculation logic will be implemented in future phases'
      }
    });
    
  } catch (error) {
    console.error('Error calculating old jewelry price:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate old jewelry price'
    });
  }
};

// Helper function to determine user's visibility level for calculations
const getUserVisibilityLevel = (role) => {
  const visibilityLevels = {
    admin: 'full', // Can see everything
    manager: 'full', // Can see everything
    pro_client: 'margin', // Can see margins but not internal details
    client: 'basic' // Can only see final amounts
  };
  
  return visibilityLevels[role] || 'basic';
};

module.exports = {
  testCalculator,
  getNewJewelryOptions,
  getOldJewelryOptions,
  calculateNewJewelryPrice,
  calculateOldJewelryPrice
};