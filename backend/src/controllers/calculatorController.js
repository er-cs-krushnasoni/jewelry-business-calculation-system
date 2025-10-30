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

// OLD Jewelry Rounding Logic (Phase 5A & 5B)
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

    // Get BOTH universal AND role-based descriptions
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
        wholesalerLabourPerGram: category.wholesalerLabourPerGram,
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

// @desc    Calculate NEW jewelry price (WITH rounding - Phase 4B + Labour)
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
    
    // NEW CALCULATION: Purchase from Wholesaler includes base cost + labour charges
    const purchaseFromWholesalerBaseCost = buyingRatePerGram * weightNum;
    const labourCharges = category.wholesalerLabourPerGram * weightNum;
    const purchaseFromWholesaler = purchaseFromWholesalerBaseCost + labourCharges;
    
    const finalSellingAmount = applyNewJewelryRounding(finalSellingAmountBeforeRounding);
    
    // NEW CALCULATION: Wholesaler Margin breakdown into wastage + labour
    const wastageAmount = purchaseFromWholesalerBaseCost - actualValueByPurity;
    const wholesalerMargin = purchaseFromWholesaler - actualValueByPurity;
    
    const ourMargin = finalSellingAmount - purchaseFromWholesaler;

    // Calculate margin percentages based on finalSellingAmount
    const ourMarginPercentage = (ourMargin / finalSellingAmount) * 100;
    const wholesalerMarginPercentage = (wholesalerMargin / finalSellingAmount) * 100;

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
        ourMarginPercentage: ourMarginPercentage,
        purchaseFromWholesaler: purchaseFromWholesaler,
        purchaseFromWholesalerBreakdown: {
          baseCost: purchaseFromWholesalerBaseCost,
          labourCharges: labourCharges
        },
        actualValueByPurity: actualValueByPurity,
        wholesalerMargin: wholesalerMargin,
        wholesalerMarginPercentage: wholesalerMarginPercentage,
        // Wholesaler Margin Breakdown (Admin/Manager only)
        wholesalerMarginBreakdown: {
          wastageMargin: wastageAmount,
          labourCharges: labourCharges
        }
      },

      labourInfo: {
        labourPerGram: category.wholesalerLabourPerGram,
        totalLabourCharges: labourCharges
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

// @desc    Get available codes for old jewelry calculation with resale categories
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
        resaleEnabled: category.resaleEnabled,
        // Include resale categories for selection (only if user can see resale)
        resaleCategories: category.resaleEnabled && ['admin', 'manager', 'pro_client'].includes(userRole)
          ? category.resaleCategories.map(rc => ({
              _id: rc._id,
              itemCategory: rc.itemCategory,
              directResalePercentage: rc.directResalePercentage,
              directResaleRateType: rc.directResaleRateType || 'SELLING',
              buyingFromWholesalerPercentage: rc.buyingFromWholesalerPercentage,
              wholesalerLabourPerGram: rc.wholesalerLabourPerGram,
              polishRepairResalePercentage: rc.polishRepairResalePercentage,
              polishRepairRateType: rc.polishRepairRateType || 'SELLING',
              polishRepairCostPercentage: rc.polishRepairCostPercentage,
              polishRepairLabourPerGram: rc.polishRepairLabourPerGram,
              polishRepairEnabled: rc.polishRepairEnabled
            }))
          : []
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

// @desc    Calculate old jewelry price (scrap/resale) with resale category support + Labour
// @route   POST /api/calculator/old-jewelry/calculate
// @access  Private (Shop users only, blocked if rates not updated)
const calculateOldJewelryPrice = async (req, res) => {
  try {
    const { categoryId, weight, source, resaleCategoryId } = req.body;
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

    // Validate resale category selection if resale enabled
    let selectedResaleCategory = null;
    if (category.resaleEnabled && resaleCategoryId) {
      selectedResaleCategory = category.resaleCategories.id(resaleCategoryId);
      
      if (!selectedResaleCategory) {
        return res.status(400).json({
          success: false,
          message: 'Selected resale category not found'
        });
      }
    }

    // Fetch current rates
    const rates = await Rate.getCurrentRatesForShop(shopId);
    if (!rates) {
      return res.status(400).json({
        success: false,
        message: 'No rates available. Please update rates first.'
      });
    }

    // Get rates per gram based on metal type
    const isGold = category.metal === 'GOLD';
    const dailyBuyingRate = isGold ? rates.goldBuy : rates.silverBuy;
    const dailySellingRate = isGold ? rates.goldSell : rates.silverSell;
    const buyingRatePerGram = isGold 
      ? dailyBuyingRate / 10
      : dailyBuyingRate / 1000;
    const sellingRatePerGram = isGold
      ? dailySellingRate / 10
      : dailySellingRate / 1000;

    // Get scrap buy percentage based on source
    const scrapBuyPercentage = source.toLowerCase() === 'own' 
      ? category.scrapBuyOwnPercentage 
      : category.scrapBuyOtherPercentage;

    // ========================================
    // SCRAP VALUE CALCULATION (using BUYING rate)
    // ========================================
    const scrapValuePerGram = buyingRatePerGram * (scrapBuyPercentage / 100);
    const totalScrapValueBeforeRounding = scrapValuePerGram * weightNum;
    const totalScrapValue = applyOldJewelryRounding(totalScrapValueBeforeRounding);

    // SCRAP MARGIN CALCULATION (for Admin/Manager only)
    const actualValueByPurity = buyingRatePerGram * (category.truePurityPercentage / 100) * weightNum;
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

    // Base calculation result
    const calculationResult = {
      // Input data
      input: {
        categoryId: category._id,
        code: category.code,
        metal: category.metal,
        weight: weightNum,
        source: source.toLowerCase(),
        descriptions: descriptions,
        // Include selected resale category info if applicable
        ...(selectedResaleCategory && {
          selectedResaleCategory: {
            id: selectedResaleCategory._id,
            itemCategory: selectedResaleCategory.itemCategory
          }
        })
      },

      // Rate information
      rates: {
        dailyBuyingRate: dailyBuyingRate,
        dailySellingRate: dailySellingRate,
        buyingRatePerGram: buyingRatePerGram,
        sellingRatePerGram: sellingRatePerGram,
        unit: isGold ? 'per 10g' : 'per kg'
      },

      // Percentages used
      percentages: {
        truePurity: category.truePurityPercentage,
        scrapBuy: scrapBuyPercentage,
        source: source.toLowerCase()
      },

      // Main scrap calculation results
      totalScrapValue: totalScrapValue,
      
      // Scrap breakdown
      scrapBreakdown: {
        scrapValuePerGram: scrapValuePerGram,
        totalWeight: weightNum
      },

      // Margin breakdown
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

      // Resale info
      resaleEnabled: category.resaleEnabled,
      hasMultipleResaleCategories: category.resaleEnabled && category.resaleCategories.length > 1,

      // Calculation metadata
      metadata: {
        userRole,
        calculatedAt: new Date().toISOString(),
        calculationType: 'scrap',
        roundingApplied: true
      }
    };

    // ========================================
    // RESALE CALCULATIONS (if enabled, category selected, and user has permission)
    // ========================================
    if (category.resaleEnabled && selectedResaleCategory) {
      const canSeeResale = ['admin', 'manager', 'pro_client'].includes(userRole);
      
      if (canSeeResale) {
        // ========================================
        // DIRECT RESALE CALCULATION (with dynamic rate type + Labour)
        // ========================================
        const directResaleRateType = selectedResaleCategory.directResaleRateType || 'SELLING';
        const directResaleBaseRate = directResaleRateType === 'BUYING' ? buyingRatePerGram : sellingRatePerGram;
        
        const directResaleValuePerGram = directResaleBaseRate * (selectedResaleCategory.directResalePercentage / 100);
        const totalDirectResaleBeforeRounding = directResaleValuePerGram * weightNum;
        const totalDirectResaleValue = applyOldJewelryRounding(totalDirectResaleBeforeRounding);
        // CALCULATION: Wholesaler Cost includes base cost + labour charges
        const directResaleWholesalerBaseCost = directResaleBaseRate * (selectedResaleCategory.buyingFromWholesalerPercentage / 100) * weightNum;
        const directResaleLabourCharges = selectedResaleCategory.wholesalerLabourPerGram * weightNum;
        const directResaleWholesalerCost = directResaleWholesalerBaseCost + directResaleLabourCharges;
        
        const directResaleMargin = directResaleWholesalerCost - totalDirectResaleValue;
        const directResaleMarginPercentage = (directResaleMargin / totalDirectResaleValue) * 100;

        // Add direct resale to result
        calculationResult.resaleCalculations = {
          // Direct Resale
          directResale: {
            totalAmount: totalDirectResaleValue,
            margin: directResaleMargin,
            marginPercentage: directResaleMarginPercentage,
            breakdown: {
              beforeRounding: totalDirectResaleBeforeRounding,
              afterRounding: totalDirectResaleValue,
              roundingApplied: totalDirectResaleBeforeRounding !== totalDirectResaleValue,
              wholesalerCost: directResaleWholesalerCost,
              wholesalerCostBreakdown: {
                baseCost: directResaleWholesalerBaseCost,
                labourCharges: directResaleLabourCharges
              },
              // Wholesaler Margin Breakdown (Admin/Manager only)
              wholesalerMarginBreakdown: {
                wastageMargin: directResaleWholesalerBaseCost - totalDirectResaleValue,
                labourCharges: directResaleLabourCharges
              }
            },
            labourInfo: {
              labourPerGram: selectedResaleCategory.wholesalerLabourPerGram,
              totalLabourCharges: directResaleLabourCharges
            }
          },

          // Resale percentages
          percentages: {
            directResale: selectedResaleCategory.directResalePercentage,
            directResaleRateType: directResaleRateType,
            buyingFromWholesaler: selectedResaleCategory.buyingFromWholesalerPercentage
          }
        };

// ========================================
        // POLISH/REPAIR RESALE CALCULATION (only if enabled + Labour with dynamic rate type)
        // ========================================
        if (selectedResaleCategory.polishRepairEnabled) {
          const polishRepairRateType = selectedResaleCategory.polishRepairRateType || 'SELLING';
          const polishRepairBaseRate = polishRepairRateType === 'BUYING' ? buyingRatePerGram : sellingRatePerGram;
          
          const polishRepairCostWeight = weightNum * (selectedResaleCategory.polishRepairCostPercentage / 100);
          const effectiveWeightAfterPolish = weightNum - polishRepairCostWeight;
          
          const polishRepairResaleValuePerGram = polishRepairBaseRate * (selectedResaleCategory.polishRepairResalePercentage / 100);
          const totalPolishRepairResaleBeforeRounding = polishRepairResaleValuePerGram * effectiveWeightAfterPolish;
          const totalPolishRepairResaleValue = applyOldJewelryRounding(totalPolishRepairResaleBeforeRounding);

          // CORRECTED CALCULATION:
          // 1. Wholesaler Labour: Calculated on EFFECTIVE weight (after polish/repair loss)
          // 2. Polish/Repair Labour: Calculated on ORIGINAL weight
          const polishRepairWholesalerBaseCost = polishRepairBaseRate * (selectedResaleCategory.buyingFromWholesalerPercentage / 100) * effectiveWeightAfterPolish;
          const polishRepairWholesalerLabourCharges = selectedResaleCategory.wholesalerLabourPerGram * effectiveWeightAfterPolish;
          const polishRepairWholesalerCost = polishRepairWholesalerBaseCost + polishRepairWholesalerLabourCharges;
          
          // Polish/Repair Labour charges (on ORIGINAL weight)
          const polishRepairLabourCharges = selectedResaleCategory.polishRepairLabourPerGram * weightNum;
          
          // Final Value = Resale Value - Polish/Repair Labour
          const finalPolishRepairValue = totalPolishRepairResaleValue - polishRepairLabourCharges;
          
          // Margin = Wholesaler Cost - Final Value
          const polishRepairResaleMargin = polishRepairWholesalerCost - finalPolishRepairValue;
          const polishRepairMarginPercentage = (polishRepairResaleMargin / finalPolishRepairValue) * 100;

          // Add polish/repair resale to result
          calculationResult.resaleCalculations.polishRepairResale = {
            available: true,
            totalAmount: totalPolishRepairResaleValue,
            finalValue: finalPolishRepairValue,
            margin: polishRepairResaleMargin,
            marginPercentage: polishRepairMarginPercentage,
            weightInfo: {
              originalWeight: weightNum,
              polishRepairCostPercentage: selectedResaleCategory.polishRepairCostPercentage,
              weightLoss: polishRepairCostWeight,
              effectiveWeight: effectiveWeightAfterPolish
            },
            breakdown: {
              beforeRounding: totalPolishRepairResaleBeforeRounding,
              afterRounding: totalPolishRepairResaleValue,
              roundingApplied: totalPolishRepairResaleBeforeRounding !== totalPolishRepairResaleValue,
              wholesalerCost: polishRepairWholesalerCost,
              wholesalerCostBreakdown: {
                baseCost: polishRepairWholesalerBaseCost,
                labourCharges: polishRepairWholesalerLabourCharges
              }
            },
            labourInfo: {
              wholesalerLabour: {
                labourPerGram: selectedResaleCategory.wholesalerLabourPerGram,
                calculatedOnWeight: effectiveWeightAfterPolish,
                totalLabourCharges: polishRepairWholesalerLabourCharges
              },
              polishRepairLabour: {
                labourPerGram: selectedResaleCategory.polishRepairLabourPerGram,
                calculatedOnWeight: weightNum,
                totalLabourCharges: polishRepairLabourCharges
              }
            }
          };

          // Add polish/repair percentages
          calculationResult.resaleCalculations.percentages.polishRepairResale = selectedResaleCategory.polishRepairResalePercentage;
          calculationResult.resaleCalculations.percentages.polishRepairRateType = polishRepairRateType;
          calculationResult.resaleCalculations.percentages.polishRepairCost = selectedResaleCategory.polishRepairCostPercentage;
        } else {
          // Polish/repair is disabled for this category
          calculationResult.resaleCalculations.polishRepairResale = {
            available: false,
            message: 'Polish/Repair resale is not enabled for this category'
          };
        }

        calculationResult.metadata.calculationType = 'scrap_and_resale';
      }
    }

    res.status(200).json({
      success: true,
      message: category.resaleEnabled && selectedResaleCategory && ['admin', 'manager', 'pro_client'].includes(userRole)
        ? 'OLD jewelry calculation completed with resale options'
        : 'OLD jewelry scrap calculation completed',
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