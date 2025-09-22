const User = require('../models/User');
const Shop = require('../models/Shop');
const { generateToken } = require('../middleware/auth');

// Enhanced change password - Super Admin and Shop Admin can change their own password
const changePassword = async (req, res) => {
  try {
    // Only Super Admin and Shop Admin can change their own password
    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to change password. Contact your administrator.'
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current user
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Generate new token with updated info
    const newToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please use your new password for future logins.',
      token: newToken, // Provide new token
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        shopId: user.shopId
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// Shop Admin Profile Management - View and Update Own Profile
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get shop info if user has shopId
    let shopInfo = null;
    if (user.shopId) {
      const shop = await Shop.findById(user.shopId);
      if (shop) {
        shopInfo = {
          _id: shop._id,
          shopName: shop.shopName,
          shopCode: shop.shopCode
        };
      }
    }

    // Only show relevant profile info, NO passwords
    res.status(200).json({
      success: true,
      profile: {
        _id: user._id,
        username: user.username,
        role: user.role,
        shopId: user.shopId || null,
        shopName: shopInfo?.shopName || null,
        shopCode: shopInfo?.shopCode || null,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    });
  }
};

// Login user (all roles)
const login = async (req, res) => {
  try {
    const { username, password, deviceInfo, ipAddress } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find user by username (case-insensitive)
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For shop users, check if shop is active and get shop info
    let shopInfo = null;
    if (user.shopId) {
      const shop = await Shop.findById(user.shopId);
      if (!shop || !shop.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Shop account is deactivated'
        });
      }
      shopInfo = {
        _id: shop._id,
        shopName: shop.shopName,
        shopCode: shop.shopCode
      };
    }

    // Update login history
    user.lastLogin = new Date();
    user.loginHistory.push({
      loginTime: new Date(),
      deviceInfo: deviceInfo || 'Unknown',
      ipAddress: ipAddress || req.ip || 'Unknown'
    });

    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }

    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        shopId: user.shopId || null,
        shopName: shopInfo?.shopName || null,
        shopCode: shopInfo?.shopCode || null,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Get current user info - ENHANCED with fresh database lookup
const getMe = async (req, res) => {
  try {
    // Always fetch fresh user data from database (not from JWT claims)
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Get shop info if user has shopId
    let shopInfo = null;
    if (user.shopId) {
      const shop = await Shop.findById(user.shopId);
      if (shop && shop.isActive) {
        shopInfo = {
          _id: shop._id,
          shopName: shop.shopName,
          shopCode: shop.shopCode
        };
      } else if (user.role !== 'super_admin') {
        // Shop is inactive but user requires shop
        return res.status(401).json({
          success: false,
          message: 'Associated shop is inactive'
        });
      }
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role, // Fresh role from database
        shopId: user.shopId || null,
        shopName: shopInfo?.shopName || null,
        shopCode: shopInfo?.shopCode || null,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user info'
    });
  }
};

// NEW: Verify token and role access for specific route
const verifyAccess = async (req, res) => {
  try {
    const { requiredRoles, requireShop } = req.body;

    // Get fresh user data from database
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        shouldLogout: true
      });
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
          hasAccess: false
        });
      }
    }

    // Check shop requirements
    if (requireShop && user.role !== 'super_admin') {
      if (!user.shopId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Shop association required.',
          hasAccess: false
        });
      }

      // Verify shop is still active
      const shop = await Shop.findById(user.shopId);
      if (!shop || !shop.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Associated shop is inactive.',
          hasAccess: false
        });
      }
    }

    res.status(200).json({
      success: true,
      hasAccess: true,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        shopId: user.shopId || null,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Verify access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying access'
    });
  }
};

// NEW: Token validation endpoint 
const validateToken = async (req, res) => {
  try {
    // The authenticate middleware already validated the token
    // and attached the user to req.user
    
    // Get fresh user data from database
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid - user not found or inactive',
        valid: false
      });
    }

    // Check if shop is still active (for shop users)
    if (user.shopId) {
      const shop = await Shop.findById(user.shopId);
      if (!shop || !shop.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid - associated shop is inactive',
          valid: false
        });
      }
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Token is valid',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        shopId: user.shopId || null,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating token',
      valid: false
    });
  }
};

// Logout (for client-side token removal)
const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Create Super Admin (for initial setup)
const createSuperAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin already exists'
      });
    }

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create Super Admin
    const superAdmin = await User.create({
      username: username.toLowerCase(),
      password,
      role: 'super_admin',
      shopId: null,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
      user: {
        _id: superAdmin._id,
        username: superAdmin.username,
        role: superAdmin.role
      }
    });

  } catch (error) {
    console.error('Create Super Admin error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating Super Admin'
    });
  }
};

// Check if Super Admin exists (for setup purposes)
const checkSuperAdmin = async (req, res) => {
  try {
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    res.status(200).json({
      success: true,
      exists: !!superAdmin,
      setupRequired: !superAdmin
    });

  } catch (error) {
    console.error('Check Super Admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking Super Admin'
    });
  }
};

module.exports = {
  login,
  getMe,
  getMyProfile,        
  changePassword,      
  logout,
  createSuperAdmin,
  checkSuperAdmin,
  verifyAccess,        // NEW: Verify role-based access
  validateToken        // NEW: Token validation
};