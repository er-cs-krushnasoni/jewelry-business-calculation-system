const Category = require('../models/Category');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all categories for a shop
// @route   GET /api/categories
// @access  Private (Shop Admin only)
const getCategories = asyncHandler(async (req, res) => {
  try {
    const { type, metal, itemCategory } = req.query;
    const shopId = req.user.shopId;

    const filters = { shopId };
    
    if (type) filters.type = type;
    if (metal) filters.metal = metal;
    if (itemCategory && type === 'NEW') filters.itemCategory = itemCategory;

    const categories = await Category.findWithFilters(filters)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    const transformedCategories = categories.map(category => {
      const categoryObj = category.toJSON();
      categoryObj.description = category.getDescriptionForRole(req.user.role);
      return categoryObj;
    });

    res.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Private (Shop Admin only)
const getCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      shopId: req.user.shopId,
      isActive: true
    }).populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const categoryObj = category.toJSON();
    categoryObj.description = category.getDescriptionForRole(req.user.role);

    res.json({
      success: true,
      data: categoryObj
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// @desc    Create new category (NEW or OLD jewelry)
// @route   POST /api/categories
// @access  Private (Shop Admin only)
const createCategory = asyncHandler(async (req, res) => {
  try {
    const {
      type,
      metal,
      code,
      descriptions = {},
      // NEW jewelry fields
      itemCategory,
      purityPercentage,
      buyingFromWholesalerPercentage,
      wholesalerLabourPerGram,
      sellingPercentage,
      // OLD jewelry fields
      truePurityPercentage,
      scrapBuyOwnPercentage,
      scrapBuyOtherPercentage,
      resaleEnabled,
      resaleCategories = [] // Array of resale categories
    } = req.body;

    if (!type || !metal || !code) {
      return res.status(400).json({
        success: false,
        message: 'Type, metal, and code are required'
      });
    }

    const typeUpper = type.toUpperCase();

    // Type-specific validations
    if (typeUpper === 'NEW') {
      if (!itemCategory || !purityPercentage || !buyingFromWholesalerPercentage || !sellingPercentage) {
        return res.status(400).json({
          success: false,
          message: 'Item category, purity percentage, buying percentage, and selling percentage are required for NEW jewelry'
        });
      }

      if (wholesalerLabourPerGram === undefined || wholesalerLabourPerGram === null || wholesalerLabourPerGram === '') {
        return res.status(400).json({
          success: false,
          message: 'Wholesaler labour per gram is required for NEW jewelry'
        });
      }

      const labourNum = parseFloat(wholesalerLabourPerGram);
      if (isNaN(labourNum) || labourNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Wholesaler labour per gram must be 0 or greater'
        });
      }

      if (purityPercentage < 1 || purityPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Purity percentage must be between 1 and 100'
        });
      }

      if (buyingFromWholesalerPercentage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Buying percentage must be at least 1'
        });
      }

      if (sellingPercentage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Selling percentage must be at least 1'
        });
      }

    } else if (typeUpper === 'OLD') {
      if (!truePurityPercentage || !scrapBuyOwnPercentage || !scrapBuyOtherPercentage || resaleEnabled === undefined) {
        return res.status(400).json({
          success: false,
          message: 'True purity percentage, scrap buy own percentage, scrap buy other percentage, and resale enabled status are required for OLD jewelry'
        });
      }

      if (truePurityPercentage < 1 || truePurityPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'True purity percentage must be between 1 and 100'
        });
      }

      if (scrapBuyOwnPercentage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Scrap buy own percentage must be at least 1'
        });
      }

      if (scrapBuyOtherPercentage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Scrap buy other percentage must be at least 1'
        });
      }

      // Validate resale categories if resale is enabled
      if (resaleEnabled) {
        if (!resaleCategories || resaleCategories.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one resale category is required when resale is enabled'
          });
        }

        // Validate each resale category
        for (let i = 0; i < resaleCategories.length; i++) {
          const cat = resaleCategories[i];
          
          if (!cat.itemCategory || !cat.itemCategory.trim()) {
            return res.status(400).json({
              success: false,
              message: `Category #${i + 1}: Item category is required`
            });
          }

          if (!cat.directResalePercentage || cat.directResalePercentage < 1) {
            return res.status(400).json({
              success: false,
              message: `Category "${cat.itemCategory}": Direct resale percentage must be at least 1`
            });
          }

          if (!cat.buyingFromWholesalerPercentage || cat.buyingFromWholesalerPercentage < 1) {
            return res.status(400).json({
              success: false,
              message: `Category "${cat.itemCategory}": Buying from wholesaler percentage must be at least 1`
            });
          }

          if (cat.wholesalerLabourPerGram === undefined || cat.wholesalerLabourPerGram === null || cat.wholesalerLabourPerGram === '') {
            return res.status(400).json({
              success: false,
              message: `Category "${cat.itemCategory}": Wholesaler labour per gram is required`
            });
          }

          const catLabour = parseFloat(cat.wholesalerLabourPerGram);
          if (isNaN(catLabour) || catLabour < 0) {
            return res.status(400).json({
              success: false,
              message: `Category "${cat.itemCategory}": Wholesaler labour per gram must be 0 or greater`
            });
          }

          // Validate polish/repair fields only if enabled
          if (cat.polishRepairEnabled) {
            if (!cat.polishRepairResalePercentage || cat.polishRepairResalePercentage < 1) {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Polish/repair resale percentage must be at least 1 when polish/repair is enabled`
              });
            }

            if (cat.polishRepairCostPercentage === undefined || cat.polishRepairCostPercentage < 0 || cat.polishRepairCostPercentage > 50) {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Polish/repair cost percentage must be between 0 and 50 when polish/repair is enabled`
              });
            }

            if (cat.polishRepairLabourPerGram === undefined || cat.polishRepairLabourPerGram === null || cat.polishRepairLabourPerGram === '') {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Polish/repair labour per gram is required when polish/repair is enabled`
              });
            }

            const polishLabour = parseFloat(cat.polishRepairLabourPerGram);
            if (isNaN(polishLabour) || polishLabour < 0) {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Polish/repair labour per gram must be 0 or greater`
              });
            }
          }
        }

        // Check for duplicate category names
        const categoryNames = resaleCategories.map(c => c.itemCategory.trim().toLowerCase());
        const uniqueNames = new Set(categoryNames);
        if (categoryNames.length !== uniqueNames.size) {
          return res.status(400).json({
            success: false,
            message: 'Duplicate category names are not allowed'
          });
        }
      }
    }

    // Check code uniqueness
    const isUnique = await Category.isCodeUnique(
      req.user.shopId,
      type,
      metal,
      itemCategory,
      code
    );

    if (!isUnique) {
      return res.status(400).json({
        success: false,
        message: 'Code already exists for this category combination'
      });
    }

    // Create category data
    const categoryData = {
      type: typeUpper,
      metal: metal.toUpperCase(),
      code: code.trim(),
      shopId: req.user.shopId,
      createdBy: req.user._id,
      descriptions: {
        universal: descriptions.universal || '',
        admin: descriptions.admin || '',
        manager: descriptions.manager || '',
        proClient: descriptions.proClient || '',
        client: descriptions.client || ''
      }
    };

    // Add type-specific fields
    if (typeUpper === 'NEW') {
      categoryData.itemCategory = itemCategory.trim();
      categoryData.purityPercentage = parseFloat(purityPercentage);
      categoryData.buyingFromWholesalerPercentage = parseFloat(buyingFromWholesalerPercentage);
      categoryData.wholesalerLabourPerGram = parseFloat(wholesalerLabourPerGram);
      categoryData.sellingPercentage = parseFloat(sellingPercentage);
    } else if (typeUpper === 'OLD') {
      categoryData.truePurityPercentage = parseFloat(truePurityPercentage);
      categoryData.scrapBuyOwnPercentage = parseFloat(scrapBuyOwnPercentage);
      categoryData.scrapBuyOtherPercentage = parseFloat(scrapBuyOtherPercentage);
      categoryData.resaleEnabled = Boolean(resaleEnabled);
      
      if (resaleEnabled && resaleCategories.length > 0) {
        categoryData.resaleCategories = resaleCategories.map(cat => ({
          itemCategory: cat.itemCategory.trim(),
          directResalePercentage: parseFloat(cat.directResalePercentage),
          buyingFromWholesalerPercentage: parseFloat(cat.buyingFromWholesalerPercentage),
          wholesalerLabourPerGram: parseFloat(cat.wholesalerLabourPerGram),
          polishRepairEnabled: Boolean(cat.polishRepairEnabled),
          ...(cat.polishRepairEnabled && {
            polishRepairResalePercentage: parseFloat(cat.polishRepairResalePercentage),
            polishRepairCostPercentage: parseFloat(cat.polishRepairCostPercentage),
            polishRepairLabourPerGram: parseFloat(cat.polishRepairLabourPerGram)
          })
        }));
      }
    }

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    const populatedCategory = await Category.findById(savedCategory._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    const responseCategory = populatedCategory.toJSON();
    responseCategory.description = populatedCategory.getDescriptionForRole(req.user.role);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: responseCategory
    });

  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Code already exists for this category combination'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category'
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Shop Admin only)
const updateCategory = asyncHandler(async (req, res) => {
  try {
    const {
      type,
      metal,
      code,
      descriptions = {},
      // NEW jewelry fields
      itemCategory,
      purityPercentage,
      buyingFromWholesalerPercentage,
      wholesalerLabourPerGram,
      sellingPercentage,
      // OLD jewelry fields
      truePurityPercentage,
      scrapBuyOwnPercentage,
      scrapBuyOtherPercentage,
      resaleEnabled,
      resaleCategories = []
    } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      shopId: req.user.shopId,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const currentType = type || category.type;
    const currentMetal = metal || category.metal;
    const currentItemCategory = itemCategory || category.itemCategory;
    const currentCode = code || category.code;

    // Check code uniqueness if changed
    if (code !== category.code || type !== category.type || metal !== category.metal || itemCategory !== category.itemCategory) {
      const isUnique = await Category.isCodeUnique(
        req.user.shopId,
        currentType,
        currentMetal,
        currentItemCategory,
        currentCode,
        category._id
      );

      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'Code already exists for this category combination'
        });
      }
    }

    // Type-specific validations
    if (currentType.toUpperCase() === 'OLD') {
      if (resaleEnabled !== undefined) {
        if (resaleEnabled && (!resaleCategories || resaleCategories.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'At least one resale category is required when resale is enabled'
          });
        }

        // Validate resale categories
        if (resaleEnabled) {
          for (let i = 0; i < resaleCategories.length; i++) {
            const cat = resaleCategories[i];
            
            if (!cat.itemCategory || !cat.itemCategory.trim()) {
              return res.status(400).json({
                success: false,
                message: `Category #${i + 1}: Item category is required`
              });
            }

            if (!cat.directResalePercentage || cat.directResalePercentage < 1) {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Direct resale percentage must be at least 1`
              });
            }

            if (!cat.buyingFromWholesalerPercentage || cat.buyingFromWholesalerPercentage < 1) {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Buying from wholesaler percentage must be at least 1`
              });
            }

            if (cat.wholesalerLabourPerGram === undefined || cat.wholesalerLabourPerGram === null || cat.wholesalerLabourPerGram === '') {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Wholesaler labour per gram is required`
              });
            }

            const catLabour = parseFloat(cat.wholesalerLabourPerGram);
            if (isNaN(catLabour) || catLabour < 0) {
              return res.status(400).json({
                success: false,
                message: `Category "${cat.itemCategory}": Wholesaler labour per gram must be 0 or greater`
              });
            }

            // Validate polish/repair fields only if enabled
            if (cat.polishRepairEnabled) {
              if (!cat.polishRepairResalePercentage || cat.polishRepairResalePercentage < 1) {
                return res.status(400).json({
                  success: false,
                  message: `Category "${cat.itemCategory}": Polish/repair resale percentage must be at least 1 when polish/repair is enabled`
                });
              }

              if (cat.polishRepairCostPercentage === undefined || cat.polishRepairCostPercentage < 0 || cat.polishRepairCostPercentage > 50) {
                return res.status(400).json({
                  success: false,
                  message: `Category "${cat.itemCategory}": Polish/repair cost percentage must be between 0 and 50 when polish/repair is enabled`
                });
              }

              if (cat.polishRepairLabourPerGram === undefined || cat.polishRepairLabourPerGram === null || cat.polishRepairLabourPerGram === '') {
                return res.status(400).json({
                  success: false,
                  message: `Category "${cat.itemCategory}": Polish/repair labour per gram is required when polish/repair is enabled`
                });
              }

              const polishLabour = parseFloat(cat.polishRepairLabourPerGram);
              if (isNaN(polishLabour) || polishLabour < 0) {
                return res.status(400).json({
                  success: false,
                  message: `Category "${cat.itemCategory}": Polish/repair labour per gram must be 0 or greater`
                });
              }
            }
          }

          // Check for duplicate category names
          const categoryNames = resaleCategories.map(c => c.itemCategory.trim().toLowerCase());
          const uniqueNames = new Set(categoryNames);
          if (categoryNames.length !== uniqueNames.size) {
            return res.status(400).json({
              success: false,
              message: 'Duplicate category names are not allowed'
            });
          }
        }
      }
    }

    // Update basic fields
    if (type) category.type = type.toUpperCase();
    if (metal) category.metal = metal.toUpperCase();
    if (code) category.code = code.trim();

    // Update NEW jewelry fields
    if (currentType.toUpperCase() === 'NEW') {
      if (itemCategory) category.itemCategory = itemCategory.trim();
      if (purityPercentage !== undefined) category.purityPercentage = parseFloat(purityPercentage);
      if (buyingFromWholesalerPercentage !== undefined) category.buyingFromWholesalerPercentage = parseFloat(buyingFromWholesalerPercentage);
      if (wholesalerLabourPerGram !== undefined) category.wholesalerLabourPerGram = parseFloat(wholesalerLabourPerGram);
      if (sellingPercentage !== undefined) category.sellingPercentage = parseFloat(sellingPercentage);
    }

    // Update OLD jewelry fields
    if (currentType.toUpperCase() === 'OLD') {
      if (truePurityPercentage !== undefined) category.truePurityPercentage = parseFloat(truePurityPercentage);
      if (scrapBuyOwnPercentage !== undefined) category.scrapBuyOwnPercentage = parseFloat(scrapBuyOwnPercentage);
      if (scrapBuyOtherPercentage !== undefined) category.scrapBuyOtherPercentage = parseFloat(scrapBuyOtherPercentage);
      
      if (resaleEnabled !== undefined) {
        category.resaleEnabled = Boolean(resaleEnabled);
        
        if (category.resaleEnabled) {
          // Update resale categories
          if (resaleCategories && resaleCategories.length > 0) {
            category.resaleCategories = resaleCategories.map(cat => ({
              itemCategory: cat.itemCategory.trim(),
              directResalePercentage: parseFloat(cat.directResalePercentage),
              buyingFromWholesalerPercentage: parseFloat(cat.buyingFromWholesalerPercentage),
              wholesalerLabourPerGram: parseFloat(cat.wholesalerLabourPerGram),
              polishRepairEnabled: Boolean(cat.polishRepairEnabled),
              ...(cat.polishRepairEnabled && {
                polishRepairResalePercentage: parseFloat(cat.polishRepairResalePercentage),
                polishRepairCostPercentage: parseFloat(cat.polishRepairCostPercentage),
                polishRepairLabourPerGram: parseFloat(cat.polishRepairLabourPerGram)
              })
            }));
          }
        } else {
          // Clear resale categories if resale is disabled
          category.resaleCategories = [];
        }
      }
    }

    // Update descriptions
    if (descriptions.universal !== undefined) category.descriptions.universal = descriptions.universal;
    if (descriptions.admin !== undefined) category.descriptions.admin = descriptions.admin;
    if (descriptions.manager !== undefined) category.descriptions.manager = descriptions.manager;
    if (descriptions.proClient !== undefined) category.descriptions.proClient = descriptions.proClient;
    if (descriptions.client !== undefined) category.descriptions.client = descriptions.client;

    category.updatedBy = req.user._id;
    
    const updatedCategory = await category.save();

    const populatedCategory = await Category.findById(updatedCategory._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    const responseCategory = populatedCategory.toJSON();
    responseCategory.description = populatedCategory.getDescriptionForRole(req.user.role);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: responseCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Code already exists for this category combination'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// @desc    Delete category (soft delete)
// @route   DELETE /api/categories/:id
// @access  Private (Shop Admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      shopId: req.user.shopId,
      isActive: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    category.updatedBy = req.user._id;
    await category.save();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

// @desc    Get unique item categories for NEW jewelry
// @route   GET /api/categories/item-categories
// @access  Private (Shop Admin only)
const getItemCategories = asyncHandler(async (req, res) => {
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
    const itemCategories = result.map(item => item._id);

    res.json({
      success: true,
      data: itemCategories
    });

  } catch (error) {
    console.error('Get item categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item categories'
    });
  }
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getItemCategories
};