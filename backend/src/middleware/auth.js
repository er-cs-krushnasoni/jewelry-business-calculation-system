const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
      shopId: user.shopId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Verify JWT Token and attach user to request
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (ensure user still exists and is active)
      const user = await User.findById(decoded.userId).populate('shopId');

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Attach user to request
      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Shop-specific authorization middleware
const authorizeShopAccess = (req, res, next) => {
  try {
    // Super admin has no shop access
    if (req.user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin cannot access shop-specific operations'
      });
    }

    // Check if user has a shopId
    if (!req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: 'User is not assigned to any shop'
      });
    }

    // If route has shopId parameter, ensure user belongs to that shop
    if (req.params.shopId) {
      if (req.user.shopId.toString() !== req.params.shopId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this shop'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during shop authorization'
    });
  }
};

// Super Admin only access
const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin access required'
    });
  }
  next();
};

// Shop Admin access within their shop
const authorizeShopAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Shop Admin access required'
    });
  }
  next();
};

// Manager or Admin access within their shop
const authorizeManagerOrAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Manager or Admin access required'
    });
  }
  next();
};

// Check if user must change password
const checkPasswordChangeRequired = (req, res, next) => {
  if (req.user && req.user.mustChangePassword) {
    // Allow access to change password endpoint and logout
    const allowedPaths = ['/auth/change-password', '/auth/logout', '/auth/me'];
    if (!allowedPaths.includes(req.path)) {
      return res.status(403).json({
        success: false,
        message: 'Password change required',
        mustChangePassword: true
      });
    }
  }
  next();
};

module.exports = {
  generateToken,
  authenticate,
  authorize,
  authorizeShopAccess,
  authorizeSuperAdmin,
  authorizeShopAdmin,
  authorizeManagerOrAdmin,
  checkPasswordChangeRequired
};