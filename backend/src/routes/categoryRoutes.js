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
    .isLength({ min: 1, max: 20 })
    .withMessage('Code must be between 1 and 20 characters')
    .trim(),

  // NEW jewelry specific validations
  body('itemCategory')
    .if(body('type').equals('NEW'))
    .notEmpty()
    .withMessage('Item category is required for NEW jewelry')
    .isLength({ min: 1, max: 50 })
    .withMessage('Item category must be between 1 and 50 characters')
    .trim(),
    
  body('purityPercentage')
    .if(body('type').equals('NEW'))
    .notEmpty()
    .withMessage('Purity percentage is required for NEW jewelry')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Purity percentage must be between 1 and 100'),
    
  body('buyingFromWholesalerPercentage')
    .if(body('type').equals('NEW'))
    .notEmpty()
    .withMessage('Buying percentage is required for NEW jewelry')
    .isFloat({ min: 1, max: 200 })
    .withMessage('Buying percentage must be between 1 and 200'),
    
  body('sellingPercentage')
    .if(body('type').equals('NEW'))
    .notEmpty()
    .withMessage('Selling percentage is required for NEW jewelry')
    .isFloat({ min: 1, max: 200 })
    .withMessage('Selling percentage must be between 1 and 200'),

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
    .isLength({ min: 1, max: 20 })
    .withMessage('Code must be between 1 and 20 characters')
    .trim(),

  body('itemCategory')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Item category must be between 1 and 50 characters')
    .trim(),
    
  body('purityPercentage')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Purity percentage must be between 1 and 100'),
    
  body('buyingFromWholesalerPercentage')
    .optional()
    .isFloat({ min: 1, max: 200 })
    .withMessage('Buying percentage must be between 1 and 200'),
    
  body('sellingPercentage')
    .optional()
    .isFloat({ min: 1, max: 200 })
    .withMessage('Selling percentage must be between 1 and 200'),

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

// Routes

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
// @desc    Create new category
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