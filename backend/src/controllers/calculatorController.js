const Rate = require('../models/Rate');
const Category = require('../models/Category');

// NEW Jewelry Rounding Logic (Phase 4B)
// Ceiling-based rounding: 01-49 → 50, 51-99 → +100, 00/50 → no change
const applyNewJewelryRounding = (amount) => {
  const lastTwoDigits = Math.floor(amount) % 100;
  
  if (lastTwoDigits === 0 || lastTwoDigits === 50) {
    return Math.floor(amount);
  }
  
  if (lastTwoDigits >= 1 && lastTwoDigits <= 49) {
    return Math.floor(amount / 100) * 100 + 50;
  }
  
  if (lastTwoDigits >= 51 && lastTwoDigits <= 99) {
    return Math.floor(amount / 100) * 100 + 100;
  }
  
  return Math.floor(amount);
};

// OLD Jewelry Rounding Logic (Phase 5A)
// Floor-based rounding to nearest 50
const applyOldJewelryRounding = (amount) => {
  return Math.floor(amount / 50) * 50;
};

// @desc    Test calculator access
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

    const filters = {
      shopId,
      type: 'NEW',
      isActive: true
    };

    if (metal) {
      filters.metal = metal.toUpperCase();
    }

    const categories = await Category.findWithFilters(filters);

    // PHASE 5A UPDATE: Get BOTH universal AND role-based descriptions
    const transformedCategories = categories.map(category => {
      const descriptions = [];
      
      // Add universal description if exists
      if (category.descriptions.universal && category.descriptions.universal.trim()) {
        descriptions.push({
          type: 'universal',
          text: category.descriptions.universal.trim()
        });
      }
      
      // Add role-based description if exists
      const roleMap = {
        'admin': category.descriptions.admin,
        'manager': category.descriptions.manager,
        'pro_client': category.descriptions.proClient,
        'client': category.descriptions.client
      };
      
      const roleDescription = roleMap[userRole];
      if (roleDescription && roleDescription.trim()) {
        descriptions.push({
          type: 'role',
          text: roleDescription.trim()
        });
      }
      
      return {
        _id: category._id,
        code: category.code,
        metal: category.metal,
        itemCategory: category.itemCategory,
        descriptions: descriptions,
        displayText: `${category.code} - ${category.itemCategory}`,
        purityPercentage: category.purityPercentage,
        buyingFromWholesalerPercentage: category.buyingFromWholesalerPercentage,
        sellingPercentage: category.sellingPercentage
      };
    });

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

// @desc    Calculate NEW jewelry price (WITH rounding - Phase 4B)
// @route   POST /api/calculator/new-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateNewJewelryPrice = async (req, res) => {
  try {
    const { categoryId, weight } = req.body;
    const shopId = req.user.shopId;
    const userRole = req.user.role;

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

    const rates = await Rate.getCurrentRatesForShop(shopId);
    if (!rates) {
      return res.status(400).json({
        success: false,
        message: 'No rates available. Please update rates first.'
      });
    }

    const isGold = category.metal === 'GOLD';
    const dailySellingRate = isGold ? rates.goldSell : rates.silverSell;
    const ratePerGram = isGold 
      ? dailySellingRate / 10
      : dailySellingRate / 1000;

    const actualRatePerGram = ratePerGram * (category.purityPercentage / 100);
    const sellingRatePerGram = ratePerGram * (category.sellingPercentage / 100);
    const buyingRatePerGram = ratePerGram * (category.buyingFromWholesalerPercentage / 100);
    
    const makingChargesPerGram = sellingRatePerGram - actualRatePerGram;
    
    const finalSellingAmountBeforeRounding = sellingRatePerGram * weightNum;
    const actualValueByPurity = actualRatePerGram * weightNum;
    const purchaseFromWholesaler = buyingRatePerGram * weightNum;
    
    const finalSellingAmount = applyNewJewelryRounding(finalSellingAmountBeforeRounding);
    
    const wholesalerMargin = purchaseFromWholesaler - actualValueByPurity;
    const ourMargin = finalSellingAmount - purchaseFromWholesaler;

    // PHASE 5A UPDATE: Get BOTH descriptions
    const descriptions = [];
    if (category.descriptions.universal && category.descriptions.universal.trim()) {
      descriptions.push({
        type: 'universal',
        text: category.descriptions.universal.trim()
      });
    }
    
    const roleMap = {
      'admin': category.descriptions.admin,
      'manager': category.descriptions.manager,
      'pro_client': category.descriptions.proClient,
      'client': category.descriptions.client
    };
    
    const roleDescription = roleMap[userRole];
    if (roleDescription && roleDescription.trim()) {
      descriptions.push({
        type: 'role',
        text: roleDescription.trim()
      });
    }

    const calculationResult = {
      input: {
        categoryId: category._id,
        code: category.code,
        itemCategory: category.itemCategory,
        metal: category.metal,
        weight: weightNum,
        descriptions: descriptions
      },

      rates: {
        dailySellingRate: dailySellingRate,
        ratePerGram: ratePerGram,
        unit: isGold ? 'per 10g' : 'per kg'
      },

      percentages: {
        purity: category.purityPercentage,
        buying: category.buyingFromWholesalerPercentage,
        selling: category.sellingPercentage
      },

      finalSellingAmount: finalSellingAmount,
      
      sellingRateBreakdown: {
        sellingRatePerGram: sellingRatePerGram,
        actualRatePerGram: actualRatePerGram,
        makingChargesPerGram: makingChargesPerGram
      },

      marginBreakdown: {
        ourMargin: ourMargin,
        purchaseFromWholesaler: purchaseFromWholesaler,
        actualValueByPurity: actualValueByPurity,
        wholesalerMargin: wholesalerMargin
      },

      roundingInfo: {
        beforeRounding: finalSellingAmountBeforeRounding,
        afterRounding: finalSellingAmount,
        roundingApplied: finalSellingAmountBeforeRounding !== finalSellingAmount
      },

      metadata: {
        userRole,
        calculatedAt: new Date().toISOString(),
        roundingApplied: true
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

// @desc    Get available codes for old jewelry calculation (PHASE 5A)
// @route   GET /api/calculator/old-jewelry/categories
// @access  Private (Shop users only, blocked if rates not updated)
const getOldJewelryCategories = async (req, res) => {
  try {
    const { metal } = req.query;
    const shopId = req.user.shopId;
    const userRole = req.user.role;

    const filters = {
      shopId,
      type: 'OLD',
      isActive: true
    };

    if (metal) {
      filters.metal = metal.toUpperCase();
    }

    const categories = await Category.findWithFilters(filters);

    // Transform categories with BOTH descriptions
    const transformedCategories = categories.map(category => {
      const descriptions = [];
      
      // Add universal description if exists
      if (category.descriptions.universal && category.descriptions.universal.trim()) {
        descriptions.push({
          type: 'universal',
          text: category.descriptions.universal.trim()
        });
      }
      
      // Add role-based description if exists
      const roleMap = {
        'admin': category.descriptions.admin,
        'manager': category.descriptions.manager,
        'pro_client': category.descriptions.proClient,
        'client': category.descriptions.client
      };
      
      const roleDescription = roleMap[userRole];
      if (roleDescription && roleDescription.trim()) {
        descriptions.push({
          type: 'role',
          text: roleDescription.trim()
        });
      }
      
      return {
        _id: category._id,
        code: category.code,
        metal: category.metal,
        descriptions: descriptions,
        displayText: `${category.code} - ${category.metal}`,
        truePurityPercentage: category.truePurityPercentage,
        scrapBuyOwnPercentage: category.scrapBuyOwnPercentage,
        scrapBuyOtherPercentage: category.scrapBuyOtherPercentage,
        resaleEnabled: category.resaleEnabled
      };
    });

    const groupedByMetal = {
      GOLD: transformedCategories.filter(cat => cat.metal === 'GOLD'),
      SILVER: transformedCategories.filter(cat => cat.metal === 'SILVER')
    };

    res.status(200).json({
      success: true,
      message: 'OLD jewelry categories fetched successfully',
      data: {
        categories: transformedCategories,
        groupedByMetal,
        totalCount: transformedCategories.length,
        userRole
      }
    });
  } catch (error) {
    console.error('Error fetching OLD jewelry categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch OLD jewelry categories'
    });
  }
};

// @desc    Calculate old jewelry price (scrap/resale) - PHASE 5A
// @route   POST /api/calculator/old-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateOldJewelryPrice = async (req, res) => {
  try {
    const { categoryId, weight, source } = req.body;
    const shopId = req.user.shopId;
    const userRole = req.user.role;

    // Validation
    if (!categoryId || !weight || !source) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, weight, and source (own/other) are required'
      });
    }

    if (!['own', 'other'].includes(source.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Source must be either "own" or "other"'
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
      type: 'OLD',
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
    const dailyBuyingRate = isGold ? rates.goldBuy : rates.silverBuy;
    const ratePerGram = isGold 
      ? dailyBuyingRate / 10
      : dailyBuyingRate / 1000;

    // Get scrap buy percentage based on source
    const scrapBuyPercentage = source.toLowerCase() === 'own' 
      ? category.scrapBuyOwnPercentage 
      : category.scrapBuyOtherPercentage;

    // SCRAP VALUE CALCULATION
    const scrapValuePerGram = ratePerGram * (scrapBuyPercentage / 100);
    const totalScrapValueBeforeRounding = scrapValuePerGram * weightNum;
    const totalScrapValue = applyOldJewelryRounding(totalScrapValueBeforeRounding);

    // SCRAP MARGIN CALCULATION
    // Formula: (Daily Buying Rate × True Purity % × Weight) - (Daily Buying Rate × Scrap Buy % × Weight)
    const actualValueByPurity = ratePerGram * (category.truePurityPercentage / 100) * weightNum;
    const scrapMargin = actualValueByPurity - totalScrapValue;

    // Get BOTH descriptions
    const descriptions = [];
    if (category.descriptions.universal && category.descriptions.universal.trim()) {
      descriptions.push({
        type: 'universal',
        text: category.descriptions.universal.trim()
      });
    }
    
    const roleMap = {
      'admin': category.descriptions.admin,
      'manager': category.descriptions.manager,
      'pro_client': category.descriptions.proClient,
      'client': category.descriptions.client
    };
    
    const roleDescription = roleMap[userRole];
    if (roleDescription && roleDescription.trim()) {
      descriptions.push({
        type: 'role',
        text: roleDescription.trim()
      });
    }

    // Prepare calculation result
    const calculationResult = {
      // Input data
      input: {
        categoryId: category._id,
        code: category.code,
        metal: category.metal,
        weight: weightNum,
        source: source.toLowerCase(),
        descriptions: descriptions
      },

      // Rate information
      rates: {
        dailyBuyingRate: dailyBuyingRate,
        ratePerGram: ratePerGram,
        unit: isGold ? 'per 10g' : 'per kg'
      },

      // Percentages used
      percentages: {
        truePurity: category.truePurityPercentage,
        scrapBuy: scrapBuyPercentage,
        source: source.toLowerCase()
      },

      // Main calculation results
      totalScrapValue: totalScrapValue,
      
      // Scrap breakdown
      scrapBreakdown: {
        scrapValuePerGram: scrapValuePerGram,
        totalWeight: weightNum
      },

      // Margin breakdown (for authorized users)
      marginBreakdown: {
        scrapMargin: scrapMargin,
        actualValueByPurity: actualValueByPurity,
        totalScrapValue: totalScrapValue
      },

      // Rounding information
      roundingInfo: {
        beforeRounding: totalScrapValueBeforeRounding,
        afterRounding: totalScrapValue,
        roundingApplied: totalScrapValueBeforeRounding !== totalScrapValue
      },

      // Resale availability (for future phase)
      resaleInfo: {
        resaleEnabled: category.resaleEnabled,
        message: category.resaleEnabled 
          ? 'Resale options will be available in the next phase' 
          : 'Resale not enabled for this category'
      },

      // Calculation metadata
      metadata: {
        userRole,
        calculatedAt: new Date().toISOString(),
        calculationType: 'scrap',
        roundingApplied: true
      }
    };

    res.status(200).json({
      success: true,
      message: 'OLD jewelry scrap calculation completed',
      data: calculationResult
    });

  } catch (error) {
    console.error('Error calculating OLD jewelry price:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate OLD jewelry price'
    });
  }
};

module.exports = {
  testCalculator,
  getNewJewelryCategories,
  getNewJewelryItemCategories,
  calculateNewJewelryPrice,
  getOldJewelryCategories,
  calculateOldJewelryPrice
};