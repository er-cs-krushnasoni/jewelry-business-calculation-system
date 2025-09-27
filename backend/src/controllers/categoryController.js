const Category = require('../models/Category');

// AsyncHandler utility - inline definition
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

    // Build filter object
    const filters = { shopId };
    
    if (type) filters.type = type;
    if (metal) filters.metal = metal;
    if (itemCategory && type === 'NEW') filters.itemCategory = itemCategory;

    const categories = await Category.findWithFilters(filters)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    // Transform categories to include appropriate descriptions
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

// @desc    Create new NEW jewelry category
// @route   POST /api/categories
// @access  Private (Shop Admin only)
const createCategory = asyncHandler(async (req, res) => {
  try {
    const {
      type,
      metal,
      itemCategory,
      purityPercentage,
      buyingFromWholesalerPercentage,
      sellingPercentage,
      code,
      descriptions = {}
    } = req.body;

    // Validate required fields for NEW jewelry
    if (!type || !metal || !code) {
      return res.status(400).json({
        success: false,
        message: 'Type, metal, and code are required'
      });
    }

    // For NEW jewelry, validate additional required fields
    if (type.toUpperCase() === 'NEW') {
      if (!itemCategory || !purityPercentage || !buyingFromWholesalerPercentage || !sellingPercentage) {
        return res.status(400).json({
          success: false,
          message: 'Item category, purity percentage, buying percentage, and selling percentage are required for NEW jewelry'
        });
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

    // Validate percentages
    if (type.toUpperCase() === 'NEW') {
      if (purityPercentage < 1 || purityPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Purity percentage must be between 1 and 100'
        });
      }

      if (buyingFromWholesalerPercentage < 1 || buyingFromWholesalerPercentage > 200) {
        return res.status(400).json({
          success: false,
          message: 'Buying percentage must be between 1 and 200'
        });
      }

      if (sellingPercentage < 1 || sellingPercentage > 200) {
        return res.status(400).json({
          success: false,
          message: 'Selling percentage must be between 1 and 200'
        });
      }
    }

    // Create category data
    const categoryData = {
      type: type.toUpperCase(),
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

    // Add NEW jewelry specific fields
    if (type.toUpperCase() === 'NEW') {
      categoryData.itemCategory = itemCategory.trim();
      categoryData.purityPercentage = parseFloat(purityPercentage);
      categoryData.buyingFromWholesalerPercentage = parseFloat(buyingFromWholesalerPercentage);
      categoryData.sellingPercentage = parseFloat(sellingPercentage);
    }

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    // Populate and return
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
      message: 'Failed to create category'
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
      itemCategory,
      purityPercentage,
      buyingFromWholesalerPercentage,
      sellingPercentage,
      code,
      descriptions = {}
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

    // Check code uniqueness if code is being changed
    if (code && code !== category.code) {
      const isUnique = await Category.isCodeUnique(
        req.user.shopId,
        type || category.type,
        metal || category.metal,
        itemCategory || category.itemCategory,
        code,
        category._id
      );

      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'Code already exists for this category combination'
        });
      }
    }

    // Validate percentages for NEW jewelry
    if ((type || category.type).toUpperCase() === 'NEW') {
      if (purityPercentage !== undefined) {
        if (purityPercentage < 1 || purityPercentage > 100) {
          return res.status(400).json({
            success: false,
            message: 'Purity percentage must be between 1 and 100'
          });
        }
      }

      if (buyingFromWholesalerPercentage !== undefined) {
        if (buyingFromWholesalerPercentage < 1 || buyingFromWholesalerPercentage > 200) {
          return res.status(400).json({
            success: false,
            message: 'Buying percentage must be between 1 and 200'
          });
        }
      }

      if (sellingPercentage !== undefined) {
        if (sellingPercentage < 1 || sellingPercentage > 200) {
          return res.status(400).json({
            success: false,
            message: 'Selling percentage must be between 1 and 200'
          });
        }
      }
    }

    // Update fields
    if (type) category.type = type.toUpperCase();
    if (metal) category.metal = metal.toUpperCase();
    if (itemCategory) category.itemCategory = itemCategory.trim();
    if (code) category.code = code.trim();
    
    if (purityPercentage !== undefined) category.purityPercentage = parseFloat(purityPercentage);
    if (buyingFromWholesalerPercentage !== undefined) category.buyingFromWholesalerPercentage = parseFloat(buyingFromWholesalerPercentage);
    if (sellingPercentage !== undefined) category.sellingPercentage = parseFloat(sellingPercentage);

    // Update descriptions
    if (descriptions.universal !== undefined) category.descriptions.universal = descriptions.universal;
    if (descriptions.admin !== undefined) category.descriptions.admin = descriptions.admin;
    if (descriptions.manager !== undefined) category.descriptions.manager = descriptions.manager;
    if (descriptions.proClient !== undefined) category.descriptions.proClient = descriptions.proClient;
    if (descriptions.client !== undefined) category.descriptions.client = descriptions.client;

    category.updatedBy = req.user._id;
    
    const updatedCategory = await category.save();

    // Populate and return
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

    // Soft delete
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