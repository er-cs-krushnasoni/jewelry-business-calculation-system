const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Alias for backward compatibility with category routes
const validateRequest = handleValidationErrors;

// Validation rules for user creation
const validateUserCreation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('role')
    .isIn(['manager', 'pro_client', 'client'])
    .withMessage('Role must be one of: manager, pro_client, client'),
  
  handleValidationErrors
];

// Validation rules for password reset
const validatePasswordReset = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number'),
  
  handleValidationErrors
];

// Validation rules for password change (by user themselves)
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation for user updates
const validateUserUpdate = [
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  body('mustChangePassword')
    .optional()
    .isBoolean()
    .withMessage('mustChangePassword must be a boolean value'),
  
  handleValidationErrors
];

// Validation for MongoDB ObjectIds
const validateObjectId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

const validateShopId = [
  param('shopId')
    .isMongoId()
    .withMessage('Invalid shop ID format'),
  
  handleValidationErrors
];

// Validation for login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('deviceInfo')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Device info cannot exceed 200 characters'),
  
  handleValidationErrors
];

// Validation for shop creation
const validateShopCreation = [
  body('shopName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  
  body('adminUsername')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Admin username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Admin username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  
  body('adminPassword')
    .isLength({ min: 6 })
    .withMessage('Admin password must be at least 6 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Admin password must contain at least one letter and one number'),
  
  body('contactInfo.email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .toLowerCase(),
  
  body('contactInfo.phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  
  body('defaultLanguage')
    .optional()
    .isIn(['en', 'gu', 'hi'])
    .withMessage('Language must be one of: en, gu, hi'),
  
  handleValidationErrors
];

// Custom validator to check if username exists
const checkUsernameExists = async (req, res, next) => {
  try {
    if (req.body.username) {
      const existingUser = await User.findByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists. Please choose a different username.'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Username check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking username availability'
    });
  }
};

// Custom validator to check role availability in shop
const checkRoleAvailability = async (req, res, next) => {
  try {
    const { role } = req.body;
    const shopId = req.user.shopId;

    if (role && ['manager', 'pro_client', 'client'].includes(role)) {
      // Check if role already exists in shop
      const existingUser = await User.findOne({ 
        shopId, 
        role, 
        isActive: true,
        _id: { $ne: req.params.userId } // Exclude current user if updating
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `Only one ${role.replace('_', ' ')} is allowed per shop`,
          details: {
            existingUser: existingUser.username,
            role
          }
        });
      }
    }
    next();
  } catch (error) {
    console.error('Role availability check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking role availability'
    });
  }
};

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  // Trim all string values in req.body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};

// Rate limiting validation
const validateRateLimit = (req, res, next) => {
  // Add rate limiting headers info to response
  res.set({
    'X-RateLimit-Limit': 100,
    'X-RateLimit-Remaining': 99, // This would be calculated by actual rate limiter
    'X-RateLimit-Reset': Date.now() + (60 * 60 * 1000) // 1 hour from now
  });
  next();
};

module.exports = {
  handleValidationErrors,
  validateRequest, // Add this export
  validateUserCreation,
  validatePasswordReset,
  validatePasswordChange,
  validateUserUpdate,
  validateObjectId,
  validateShopId,
  validateLogin,
  validateShopCreation,
  checkUsernameExists,
  checkRoleAvailability,
  sanitizeInput,
  validateRateLimit
};