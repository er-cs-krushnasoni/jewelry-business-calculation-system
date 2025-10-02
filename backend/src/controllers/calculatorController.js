const Rate = require('../models/Rate');
const Category = require('../models/Category');

// @desc    Test calculator access (this route is protected by rate blocking middleware)
// @route   GET /api/calculator/test
// @access  Private (Shop users only, blocked if rates not updated)
const testCalculator = async (req, res) => {
  try {
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

// @desc    Get available categories for NEW jewelry calculation
// @route   GET /api/calculator/new-jewelry/categories
// @access  Private (Shop users only, blocked if rates not updated)
const getNewJewelryCategories = async (req, res) => {
  try {
    const { metal } = req.query;
    const shopId = req.user.shopId;
    const userRole = req.user.role;

    // Build filter
    const filters = {
      shopId,
      type: 'NEW',
      isActive: true
    };

    if (metal) {
      filters.metal = metal.toUpperCase();
    }

    // Fetch categories
    const categories = await Category.findWithFilters(filters);

    // Transform categories with role-appropriate descriptions
    const transformedCategories = categories.map(category => {
      const description = category.getDescriptionForRole(userRole);
      
      return {
        _id: category._id,
        code: category.code,
        metal: category.metal,
        itemCategory: category.itemCategory,
        description: description || '',
        displayText: `${category.code} - ${category.itemCategory}`,
        // Include calculation data (percentages)
        purityPercentage: category.purityPercentage,
        buyingFromWholesalerPercentage: category.buyingFromWholesalerPercentage,
        sellingPercentage: category.sellingPercentage
      };
    });

    // Group by metal for easier frontend handling
    const groupedByMetal = {
      GOLD: transformedCategories.filter(cat => cat.metal === 'GOLD'),
      SILVER: transformedCategories.filter(cat => cat.metal === 'SILVER')
    };

    res.status(200).json({
      success: true,
      message: 'NEW jewelry categories fetched successfully',
      data: {
        categories: transformedCategories,
        groupedByMetal,
        totalCount: transformedCategories.length,
        userRole
      }
    });
  } catch (error) {
    console.error('Error fetching NEW jewelry categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch NEW jewelry categories'
    });
  }
};

// @desc    Get unique item categories for NEW jewelry (for filtering)
// @route   GET /api/calculator/new-jewelry/item-categories
// @access  Private (Shop users only, blocked if rates not updated)
const getNewJewelryItemCategories = async (req, res) => {
  try {
    const { metal } = req.query;
    const shopId = req.user.shopId;

    const pipeline = [
      {
        $match: {
          shopId: shopId,
          type: 'NEW',
          isActive: true,
          ...(metal && { metal: metal.toUpperCase() })
        }
      },
      {
        $group: {
          _id: '$itemCategory',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    const result = await Category.aggregate(pipeline);
    const itemCategories = result.map(item => ({
      name: item._id,
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: itemCategories
    });
  } catch (error) {
    console.error('Error fetching item categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch item categories'
    });
  }
};

// @desc    Calculate NEW jewelry price (WITHOUT rounding - Phase 4A)
// @route   POST /api/calculator/new-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateNewJewelryPrice = async (req, res) => {
  try {
    const { categoryId, weight } = req.body;
    const shopId = req.user.shopId;
    const userRole = req.user.role;

    // Validation
    if (!categoryId || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and weight are required'
      });
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a positive number'
      });
    }

    // Fetch category
    const category = await Category.findOne({
      _id: categoryId,
      shopId,
      type: 'NEW',
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or has been deleted'
      });
    }

    // Fetch current rates
    const rates = await Rate.getCurrentRatesForShop(shopId);
    if (!rates) {
      return res.status(400).json({
        success: false,
        message: 'No rates available. Please update rates first.'
      });
    }

    // Get rate per gram based on metal type
    const isGold = category.metal === 'GOLD';
    const dailySellingRate = isGold ? rates.goldSell : rates.silverSell;
    const ratePerGram = isGold 
      ? dailySellingRate / 10  // Gold rate is per 10 grams
      : dailySellingRate / 1000; // Silver rate is per kg (1000 grams)

    // PHASE 4A: Enhanced calculations for new requirements
    
    // Basic rate calculations
    const actualRatePerGram = ratePerGram * (category.purityPercentage / 100);
    const sellingRatePerGram = ratePerGram * (category.sellingPercentage / 100);
    const buyingRatePerGram = ratePerGram * (category.buyingFromWholesalerPercentage / 100);
    
    // Making charges per gram
    const makingChargesPerGram = sellingRatePerGram - actualRatePerGram;
    
    // Total amounts
    const finalSellingAmount = sellingRatePerGram * weightNum;
    const actualValueByPurity = actualRatePerGram * weightNum;
    const purchaseFromWholesaler = buyingRatePerGram * weightNum;
    
    // Margins
    const wholesalerMargin = purchaseFromWholesaler - actualValueByPurity;
    const ourMargin = finalSellingAmount - purchaseFromWholesaler;

    // Prepare calculation result
    const calculationResult = {
      // Input data
      input: {
        categoryId: category._id,
        code: category.code,
        itemCategory: category.itemCategory,
        metal: category.metal,
        weight: weightNum,
        description: category.getDescriptionForRole(userRole)
      },

      // Rate information
      rates: {
        dailySellingRate: dailySellingRate,
        ratePerGram: ratePerGram,
        unit: isGold ? 'per 10g' : 'per kg'
      },

      // Percentages used (for admin/manager reference)
      percentages: {
        purity: category.purityPercentage,
        buying: category.buyingFromWholesalerPercentage,
        selling: category.sellingPercentage
      },

      // Main calculation results
      finalSellingAmount: finalSellingAmount,
      
      // Selling rate breakdown
      sellingRateBreakdown: {
        sellingRatePerGram: sellingRatePerGram,
        actualRatePerGram: actualRatePerGram,
        makingChargesPerGram: makingChargesPerGram
      },

      // Margin breakdown (for authorized users)
      marginBreakdown: {
        ourMargin: ourMargin,
        purchaseFromWholesaler: purchaseFromWholesaler,
        actualValueByPurity: actualValueByPurity,
        wholesalerMargin: wholesalerMargin
      },

      // Calculation metadata
      metadata: {
        userRole,
        calculatedAt: new Date().toISOString(),
        roundingApplied: false,
        phase: '4A'
      }
    };

    res.status(200).json({
      success: true,
      message: 'NEW jewelry calculation completed',
      data: calculationResult
    });

  } catch (error) {
    console.error('Error calculating NEW jewelry price:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate NEW jewelry price'
    });
  }
};

// @desc    Get available codes for old jewelry calculation
// @route   GET /api/calculator/old-jewelry/options
// @access  Private (Shop users only, blocked if rates not updated)
const getOldJewelryOptions = async (req, res) => {
  try {
    // Placeholder for Phase 4B/4C
    res.status(200).json({
      success: true,
      message: 'Old jewelry options (placeholder - will be implemented in Phase 4B/4C)',
      data: {
        metals: ['gold', 'silver'],
        sources: ['own', 'other'],
        placeholder: true,
        note: 'OLD jewelry calculator will be implemented in future phases'
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

// @desc    Calculate old jewelry price (scrap/resale)
// @route   POST /api/calculator/old-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateOldJewelryPrice = async (req, res) => {
  try {
    // Placeholder for Phase 4B/4C
    res.status(200).json({
      success: true,
      message: 'Old jewelry calculation (placeholder - will be implemented in Phase 4B/4C)',
      data: {
        placeholder: true,
        note: 'OLD jewelry calculator will be implemented in future phases'
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

module.exports = {
  testCalculator,
  getNewJewelryCategories,
  getNewJewelryItemCategories,
  calculateNewJewelryPrice,
  getOldJewelryOptions,
  calculateOldJewelryPrice
};