const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getItemCategories
} = require('../controllers/categoryController');

// Middleware
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createCategoryValidation = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['NEW', 'OLD'])
    .withMessage('Type must be either NEW or OLD'),
  
  body('metal')
    .notEmpty()
    .withMessage('Metal is required')
    .isIn(['GOLD', 'SILVER'])
    .withMessage('Metal must be either GOLD or SILVER'),
    
    body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 100 }) 
    .withMessage('Code must be between 1 and 100 characters')
    .trim(),

  // NEW jewelry specific validations
  body('itemCategory')
  .custom((value, { req }) => {
    if (req.body.type === 'NEW') {
      if (!value || value.trim() === '') {
        throw new Error('Item category is required for NEW jewelry');
      }
      if (value.trim().length < 1 || value.trim().length > 100) { // CHANGED from 50 to 100
        throw new Error('Item category must be between 1 and 100 characters');
      }
    }
    return true;
  }),
    
  body('purityPercentage')
    .custom((value, { req }) => {
      if (req.body.type === 'NEW') {
        if (!value) {
          throw new Error('Purity percentage is required for NEW jewelry');
        }
        const numValue = parseFloat(value);
        if (numValue < 1 || numValue > 100) {
          throw new Error('Purity percentage must be between 1 and 100');
        }
      }
      return true;
    }),
    
  body('buyingFromWholesalerPercentage')
    .custom((value, { req }) => {
      if (req.body.type === 'NEW') {
        if (!value) {
          throw new Error('Buying percentage is required for NEW jewelry');
        }
        if (parseFloat(value) < 1) {
          throw new Error('Buying percentage must be at least 1');
        }
      }
      return true;
    }),
  
  // NEW: Wholesaler Labour Per Gram validation
  body('wholesalerLabourPerGram')
    .custom((value, { req }) => {
      if (req.body.type === 'NEW') {
        if (value === undefined || value === null || value === '') {
          throw new Error('Wholesaler labour per gram is required for NEW jewelry');
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Wholesaler labour per gram must be 0 or greater');
        }
      }
      return true;
    }),
    
  body('sellingPercentage')
    .custom((value, { req }) => {
      if (req.body.type === 'NEW') {
        if (!value) {
          throw new Error('Selling percentage is required for NEW jewelry');
        }
        if (parseFloat(value) < 1) {
          throw new Error('Selling percentage must be at least 1');
        }
      }
      return true;
    }),

  // OLD jewelry specific validations
  body('truePurityPercentage')
    .custom((value, { req }) => {
      if (req.body.type === 'OLD') {
        if (!value) {
          throw new Error('True purity percentage is required for OLD jewelry');
        }
        const numValue = parseFloat(value);
        if (numValue < 1 || numValue > 100) {
          throw new Error('True purity percentage must be between 1 and 100');
        }
      }
      return true;
    }),
    
  body('scrapBuyOwnPercentage')
    .custom((value, { req }) => {
      if (req.body.type === 'OLD') {
        if (!value) {
          throw new Error('Scrap buy own percentage is required for OLD jewelry');
        }
        if (parseFloat(value) < 1) {
          throw new Error('Scrap buy own percentage must be at least 1');
        }
      }
      return true;
    }),
    
  body('scrapBuyOtherPercentage')
    .custom((value, { req }) => {
      if (req.body.type === 'OLD') {
        if (!value) {
          throw new Error('Scrap buy other percentage is required for OLD jewelry');
        }
        if (parseFloat(value) < 1) {
          throw new Error('Scrap buy other percentage must be at least 1');
        }
      }
      return true;
    }),
    
  body('resaleEnabled')
    .custom((value, { req }) => {
      if (req.body.type === 'OLD') {
        if (value === undefined || value === null) {
          throw new Error('Resale enabled status is required for OLD jewelry');
        }
        if (typeof value !== 'boolean') {
          throw new Error('Resale enabled must be a boolean value');
        }
      }
      return true;
    }),

  // Validate resaleCategories array for OLD jewelry with resale enabled
  body('resaleCategories')
    .custom((value, { req }) => {
      if (req.body.type === 'OLD' && req.body.resaleEnabled === true) {
        // Must be an array
        if (!Array.isArray(value)) {
          throw new Error('Resale categories must be an array when resale is enabled');
        }
        
        // Must have at least one category
        if (value.length === 0) {
          throw new Error('At least one resale category is required when resale is enabled');
        }
        
        // Validate each category in the array
        for (let i = 0; i < value.length; i++) {
          const cat = value[i];
          
          // Check itemCategory
          if (!cat.itemCategory || typeof cat.itemCategory !== 'string' || cat.itemCategory.trim() === '') {
            throw new Error(`Category #${i + 1}: Item category is required`);
          }
          if (cat.itemCategory.trim().length > 50) {
            throw new Error(`Category #${i + 1}: Item category cannot exceed 50 characters`);
          }
          
          // Check directResalePercentage (ALWAYS REQUIRED)
          if (cat.directResalePercentage === undefined || cat.directResalePercentage === null) {
            throw new Error(`Category "${cat.itemCategory}": Direct resale percentage is required`);
          }
          const directResale = parseFloat(cat.directResalePercentage);
          if (isNaN(directResale) || directResale < 1) {
            throw new Error(`Category "${cat.itemCategory}": Direct resale percentage must be at least 1`);
          }
          
          // Check buyingFromWholesalerPercentage (ALWAYS REQUIRED)
          if (cat.buyingFromWholesalerPercentage === undefined || cat.buyingFromWholesalerPercentage === null) {
            throw new Error(`Category "${cat.itemCategory}": Buying from wholesaler percentage is required`);
          }
          const buyingWholesaler = parseFloat(cat.buyingFromWholesalerPercentage);
          if (isNaN(buyingWholesaler) || buyingWholesaler < 1) {
            throw new Error(`Category "${cat.itemCategory}": Buying from wholesaler percentage must be at least 1`);
          }
          
          // NEW: Check wholesalerLabourPerGram (ALWAYS REQUIRED, can be 0)
          if (cat.wholesalerLabourPerGram === undefined || cat.wholesalerLabourPerGram === null || cat.wholesalerLabourPerGram === '') {
            throw new Error(`Category "${cat.itemCategory}": Wholesaler labour per gram is required`);
          }
          const labourPerGram = parseFloat(cat.wholesalerLabourPerGram);
          if (isNaN(labourPerGram) || labourPerGram < 0) {
            throw new Error(`Category "${cat.itemCategory}": Wholesaler labour per gram must be 0 or greater`);
          }
          
          // Check polishRepairEnabled (optional, defaults to false)
          const polishRepairEnabled = cat.polishRepairEnabled === true;
          
          // Validate polish/repair fields ONLY if polishRepairEnabled is true
          if (polishRepairEnabled) {
            // Check polishRepairResalePercentage
            if (cat.polishRepairResalePercentage === undefined || cat.polishRepairResalePercentage === null) {
              throw new Error(`Category "${cat.itemCategory}": Polish/repair resale percentage is required when polish/repair is enabled`);
            }
            const polishResale = parseFloat(cat.polishRepairResalePercentage);
            if (isNaN(polishResale) || polishResale < 1) {
              throw new Error(`Category "${cat.itemCategory}": Polish/repair resale percentage must be at least 1`);
            }
            
            // Check polishRepairCostPercentage
            if (cat.polishRepairCostPercentage === undefined || cat.polishRepairCostPercentage === null) {
              throw new Error(`Category "${cat.itemCategory}": Polish/repair cost percentage is required when polish/repair is enabled`);
            }
            const polishCost = parseFloat(cat.polishRepairCostPercentage);
            if (isNaN(polishCost) || polishCost < 0 || polishCost > 50) {
              throw new Error(`Category "${cat.itemCategory}": Polish/repair cost percentage must be between 0 and 50`);
            }
            
            // NEW: Check polishRepairLabourPerGram (REQUIRED when polish/repair enabled, can be 0)
            if (cat.polishRepairLabourPerGram === undefined || cat.polishRepairLabourPerGram === null || cat.polishRepairLabourPerGram === '') {
              throw new Error(`Category "${cat.itemCategory}": Polish/repair labour per gram is required when polish/repair is enabled`);
            }
            const polishLabour = parseFloat(cat.polishRepairLabourPerGram);
            if (isNaN(polishLabour) || polishLabour < 0) {
              throw new Error(`Category "${cat.itemCategory}": Polish/repair labour per gram must be 0 or greater`);
            }
          }
        }
        
        // Check for duplicate category names
        const categoryNames = value.map(c => c.itemCategory.trim().toLowerCase());
        const uniqueNames = new Set(categoryNames);
        if (categoryNames.length !== uniqueNames.size) {
          throw new Error('Duplicate category names are not allowed in resale categories');
        }
      }
      
      // If resale is not enabled or type is not OLD, resaleCategories should be empty or undefined
      if (req.body.type === 'OLD' && req.body.resaleEnabled === false) {
        if (value && Array.isArray(value) && value.length > 0) {
          throw new Error('Resale categories should be empty when resale is disabled');
        }
      }
      
      return true;
    }),

  // Description validations (optional)
  body('descriptions.universal')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Universal description cannot exceed 500 characters'),
    
  body('descriptions.admin')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Admin description cannot exceed 500 characters'),
    
  body('descriptions.manager')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Manager description cannot exceed 500 characters'),
    
  body('descriptions.proClient')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Pro Client description cannot exceed 500 characters'),
    
  body('descriptions.client')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Client description cannot exceed 500 characters')
];

const updateCategoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid category ID'),
    
  body('type')
    .optional()
    .isIn(['NEW', 'OLD'])
    .withMessage('Type must be either NEW or OLD'),
  
  body('metal')
    .optional()
    .isIn(['GOLD', 'SILVER'])
    .withMessage('Metal must be either GOLD or SILVER'),
    
    body('code')
    .optional()
    .isLength({ min: 1, max: 100 }) 
    .withMessage('Code must be between 1 and 100 characters')
    .trim(),

  // NEW jewelry fields
  body('itemCategory')
  .optional()
  .isLength({ min: 1, max: 100 }) 
  .withMessage('Item category must be between 1 and 100 characters')
  .trim(),
    
  body('purityPercentage')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Purity percentage must be between 1 and 100'),
    
  body('buyingFromWholesalerPercentage')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Buying percentage must be at least 1'),
  
  // NEW: Wholesaler Labour Per Gram validation for updates
  body('wholesalerLabourPerGram')
    .optional()
    .custom((value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Wholesaler labour per gram must be 0 or greater');
      }
      return true;
    }),
    
  body('sellingPercentage')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Selling percentage must be at least 1'),

  // OLD jewelry fields
  body('truePurityPercentage')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('True purity percentage must be between 1 and 100'),
    
  body('scrapBuyOwnPercentage')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Scrap buy own percentage must be at least 1'),
    
  body('scrapBuyOtherPercentage')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Scrap buy other percentage must be at least 1'),
    
  body('resaleEnabled')
    .optional()
    .isBoolean()
    .withMessage('Resale enabled must be a boolean value'),

  // Validate resaleCategories array for updates
  body('resaleCategories')
    .optional()
    .custom((value, { req }) => {
      // Only validate if provided
      if (value !== undefined) {
        // Must be an array
        if (!Array.isArray(value)) {
          throw new Error('Resale categories must be an array');
        }
        
        // If resale is enabled and array is provided, validate contents
        if (req.body.resaleEnabled === true && value.length > 0) {
          for (let i = 0; i < value.length; i++) {
            const cat = value[i];
            
            if (!cat.itemCategory || typeof cat.itemCategory !== 'string' || cat.itemCategory.trim() === '') {
              throw new Error(`Category #${i + 1}: Item category is required`);
            }
            
            if (cat.directResalePercentage === undefined || parseFloat(cat.directResalePercentage) < 1) {
              throw new Error(`Category "${cat.itemCategory}": Direct resale percentage must be at least 1`);
            }
            
            if (cat.buyingFromWholesalerPercentage === undefined || parseFloat(cat.buyingFromWholesalerPercentage) < 1) {
              throw new Error(`Category "${cat.itemCategory}": Buying from wholesaler percentage must be at least 1`);
            }
            
            // NEW: Check wholesalerLabourPerGram
            if (cat.wholesalerLabourPerGram === undefined || cat.wholesalerLabourPerGram === null || cat.wholesalerLabourPerGram === '') {
              throw new Error(`Category "${cat.itemCategory}": Wholesaler labour per gram is required`);
            }
            const labourPerGram = parseFloat(cat.wholesalerLabourPerGram);
            if (isNaN(labourPerGram) || labourPerGram < 0) {
              throw new Error(`Category "${cat.itemCategory}": Wholesaler labour per gram must be 0 or greater`);
            }
            
            // Check polishRepairEnabled
            const polishRepairEnabled = cat.polishRepairEnabled === true;
            
            // Validate polish/repair fields ONLY if enabled
            if (polishRepairEnabled) {
              if (cat.polishRepairResalePercentage === undefined || parseFloat(cat.polishRepairResalePercentage) < 1) {
                throw new Error(`Category "${cat.itemCategory}": Polish/repair resale percentage must be at least 1 when polish/repair is enabled`);
              }
              
              const polishCost = parseFloat(cat.polishRepairCostPercentage);
              if (cat.polishRepairCostPercentage === undefined || isNaN(polishCost) || polishCost < 0 || polishCost > 50) {
                throw new Error(`Category "${cat.itemCategory}": Polish/repair cost percentage must be between 0 and 50 when polish/repair is enabled`);
              }
              
              // NEW: Check polishRepairLabourPerGram
              if (cat.polishRepairLabourPerGram === undefined || cat.polishRepairLabourPerGram === null || cat.polishRepairLabourPerGram === '') {
                throw new Error(`Category "${cat.itemCategory}": Polish/repair labour per gram is required when polish/repair is enabled`);
              }
              const polishLabour = parseFloat(cat.polishRepairLabourPerGram);
              if (isNaN(polishLabour) || polishLabour < 0) {
                throw new Error(`Category "${cat.itemCategory}": Polish/repair labour per gram must be 0 or greater when polish/repair is enabled`);
              }
            }
          }
          
          // Check for duplicates
          const categoryNames = value.map(c => c.itemCategory.trim().toLowerCase());
          const uniqueNames = new Set(categoryNames);
          if (categoryNames.length !== uniqueNames.size) {
            throw new Error('Duplicate category names are not allowed in resale categories');
          }
        }
      }
      return true;
    }),

  // Description validations (optional)
  body('descriptions.universal')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Universal description cannot exceed 500 characters'),
    
  body('descriptions.admin')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Admin description cannot exceed 500 characters'),
    
  body('descriptions.manager')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Manager description cannot exceed 500 characters'),
    
  body('descriptions.proClient')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Pro Client description cannot exceed 500 characters'),
    
  body('descriptions.client')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Client description cannot exceed 500 characters')
];

const getCategoriesValidation = [
  query('type')
    .optional()
    .isIn(['NEW', 'OLD'])
    .withMessage('Type must be either NEW or OLD'),
    
  query('metal')
    .optional()
    .isIn(['GOLD', 'SILVER'])
    .withMessage('Metal must be either GOLD or SILVER'),
    
  query('itemCategory')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Item category must be between 1 and 50 characters')
];

const getCategoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid category ID')
];

const deleteCategoryValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid category ID')
];

const getItemCategoriesValidation = [
  query('metal')
    .optional()
    .isIn(['GOLD', 'SILVER'])
    .withMessage('Metal must be either GOLD or SILVER')
];

// Middleware to ensure only Shop Admin can access category management
const requireShopAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Shop Admin can manage categories.'
    });
  }
  
  if (!req.user.shopId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Shop association required.'
    });
  }
  
  next();
};

// Routes - ORDER MATTERS! Specific routes must come before parameterized routes

// @route   GET /api/categories
// @desc    Get all categories for shop with optional filters
// @access  Private (Shop Admin only)
router.get(
  '/',
  protect,
  requireShopAdmin,
  getCategoriesValidation,
  validateRequest,
  getCategories
);

// @route   GET /api/categories/item-categories
// @desc    Get unique item categories for NEW jewelry
// @access  Private (Shop Admin only)
// NOTE: This MUST come BEFORE the /:id route!
router.get(
  '/item-categories',
  protect,
  requireShopAdmin,
  getItemCategoriesValidation,
  validateRequest,
  getItemCategories
);

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Private (Shop Admin only)
router.get(
  '/:id',
  protect,
  requireShopAdmin,
  getCategoryValidation,
  validateRequest,
  getCategory
);

// @route   POST /api/categories
// @desc    Create new category (NEW or OLD jewelry)
// @access  Private (Shop Admin only)
router.post(
  '/',
  protect,
  requireShopAdmin,
  createCategoryValidation,
  validateRequest,
  createCategory
);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Shop Admin only)
router.put(
  '/:id',
  protect,
  requireShopAdmin,
  updateCategoryValidation,
  validateRequest,
  updateCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete category (soft delete)
// @access  Private (Shop Admin only)
router.delete(
  '/:id',
  protect,
  requireShopAdmin,
  deleteCategoryValidation,
  validateRequest,
  deleteCategory
);

module.exports = router;