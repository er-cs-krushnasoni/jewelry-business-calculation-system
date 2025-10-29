const User = require('../models/User');
const Shop = require('../models/Shop');

// Create shop user (Manager, Pro Client, or Client) - Shop Admin only
const createShopUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    console.log('Controller: Creating user with role:', role);

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    // Validate role - only allow shop roles that Admin can create
    const allowedRoles = ['manager', 'pro_client', 'client'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: manager, pro_client, client'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if username already exists globally
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Get shop admin's shopId
    const shopId = req.user.shopId;
    // console.log('Controller: Using shopId:', shopId);
    
    // Verify shop exists and is active
    const shop = await Shop.findById(shopId).select('+masterEncryptionKey');
    if (!shop || !shop.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Shop not found or inactive'
      });
    }

    // console.log('Controller: Shop found:', shop.shopName, 'Has encryption key:', !!shop.masterEncryptionKey);

    // Handle encryption for specific roles
    let encryptedPassword = null;
    if (['manager', 'pro_client', 'client'].includes(role)) {
      if (!shop.masterEncryptionKey) {
        return res.status(500).json({
          success: false,
          message: 'Shop encryption key not available'
        });
      }

      try {
        const PasswordEncryption = require('../utils/encryption');
        encryptedPassword = PasswordEncryption.encryptPassword(password, shop.masterEncryptionKey);
        console.log('Controller: Password encrypted successfully, length:', encryptedPassword.length);
      } catch (error) {
        console.error('Controller: Encryption failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to encrypt password'
        });
      }
    }

    // Set temporary plain password for hashing in pre-save middleware
    User.setTempPlainPassword(password);

    // Create user data
    const userData = {
      username: username.toLowerCase().trim(),
      password, // This will be hashed by pre-save middleware
      role,
      shopId,
      isActive: true
    };

    // Add encrypted password for relevant roles
    if (encryptedPassword) {
      userData.encryptedPassword = encryptedPassword;
    }

    console.log('Controller: Creating user with data:', {
      username: userData.username,
      role: userData.role,
      shopId: userData.shopId,
      hasEncryptedPassword: !!userData.encryptedPassword
    });

    // Create user
    const newUser = await User.create(userData);

    console.log('Controller: User created successfully:', newUser.username);

    res.status(201).json({
      success: true,
      message: `${role.replace('_', ' ').toUpperCase()} user created successfully`,
      user: {
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        shopId: newUser.shopId,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Create shop user error:', error);
    
    // Handle role constraint violations
    if (error.code === 'ROLE_CONSTRAINT_VIOLATION') {
      return res.status(400).json({
        success: false,
        message: error.message,
        details: error.details
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating user'
    });
  }
};

// Update shop user credentials (username/password) - Shop Admin only
const updateUserCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, password, oldPassword } = req.body;
    const shopId = req.user.shopId;
    const currentUserId = req.user.id; // Current logged-in user's ID

    console.log('[UPDATE CREDENTIALS] Request received');
    console.log('[UPDATE CREDENTIALS] UserId:', userId);
    console.log('[UPDATE CREDENTIALS] Current User ID:', currentUserId);
    console.log('[UPDATE CREDENTIALS] Has username:', !!username);
    console.log('[UPDATE CREDENTIALS] Has password:', !!password);
    console.log('[UPDATE CREDENTIALS] Has oldPassword:', !!oldPassword);

    // At least one field must be provided
    if (!username && !password) {
      return res.status(400).json({
        success: false,
        message: 'Username or password must be provided'
      });
    }

    // Check if updating own account
    const isCurrentUser = userId === currentUserId;
    console.log('[UPDATE CREDENTIALS] Is current user:', isCurrentUser);

    // Find user and verify they belong to current shop
    const user = await User.findOne({ 
      _id: userId, 
      shopId,
      role: { $in: ['admin', 'manager', 'pro_client', 'client'] } // Include admin role
    });

    if (!user) {
      console.log('[UPDATE CREDENTIALS] User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized to modify this user'
      });
    }

    console.log('[UPDATE CREDENTIALS] User found:', user.username, 'Role:', user.role);

    // If current user is changing their own password, verify old password
    if (isCurrentUser && password) {
      if (!oldPassword) {
        return res.status(400).json({
          success: false,
          message: 'Old password is required to change your own password'
        });
      }

      // Verify old password
      const isOldPasswordValid = await user.matchPassword(oldPassword);
      if (!isOldPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      console.log('[UPDATE CREDENTIALS] Old password verified');
    }

    // If username is being updated, check global uniqueness
    if (username && username.toLowerCase().trim() !== user.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists. Please choose a different username.'
        });
      }
      user.username = username.toLowerCase().trim();
      console.log('[UPDATE CREDENTIALS] Username updated');
    }

    // If password is being updated, validate and encrypt
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Handle encryption for specific roles
      if (['manager', 'pro_client', 'client'].includes(user.role)) {
        const shop = await Shop.findById(shopId).select('+masterEncryptionKey');
        if (!shop || !shop.masterEncryptionKey) {
          return res.status(500).json({
            success: false,
            message: 'Shop encryption key not available'
          });
        }

        try {
          const PasswordEncryption = require('../utils/encryption');
          user.encryptedPassword = PasswordEncryption.encryptPassword(password, shop.masterEncryptionKey);
          console.log('[UPDATE CREDENTIALS] Password encrypted');
        } catch (error) {
          console.error('[UPDATE CREDENTIALS] Password encryption failed:', error);
          return res.status(500).json({
            success: false,
            message: 'Failed to encrypt password'
          });
        }
      }
      
      // Set temporary plain password for hashing
      User.setTempPlainPassword(password);
      user.password = password;
      console.log('[UPDATE CREDENTIALS] Password updated');
    }

    await user.save();
    console.log('[UPDATE CREDENTIALS] User saved successfully');

    res.status(200).json({
      success: true,
      message: 'User credentials updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('[UPDATE CREDENTIALS] Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating user credentials'
    });
  }
};

// Reset shop user password - Shop Admin only (updated to match new approach)
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const shopId = req.user.shopId;

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user and verify they belong to current shop
    const user = await User.findOne({ 
      _id: userId, 
      shopId,
      role: { $in: ['manager', 'pro_client', 'client'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized to reset this user\'s password'
      });
    }

    // Handle encryption for specific roles
    if (['manager', 'pro_client', 'client'].includes(user.role)) {
      const shop = await Shop.findById(shopId).select('+masterEncryptionKey');
      if (!shop || !shop.masterEncryptionKey) {
        return res.status(500).json({
          success: false,
          message: 'Shop encryption key not available'
        });
      }

      try {
        const PasswordEncryption = require('../utils/encryption');
        user.encryptedPassword = PasswordEncryption.encryptPassword(newPassword, shop.masterEncryptionKey);
      } catch (error) {
        console.error('Password encryption failed during reset:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to encrypt password'
        });
      }
    }

    // Set temporary plain password for hashing
    User.setTempPlainPassword(newPassword);
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.username}`
    });

  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
};

// Keep all other methods unchanged
const getShopUsers = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Get all users for current shop (excluding admin themselves)
    const users = await User.find({ 
      shopId, 
      role: { $in: ['manager', 'pro_client', 'client'] },
      isActive: true 
    })
    .select('-password -loginHistory -encryptedPassword')
    .sort({ role: 1, createdAt: -1 });

    // Get role summary
    const roleCount = {
      manager: 0,
      pro_client: 0,
      client: 0
    };

    users.forEach(user => {
      if (roleCount.hasOwnProperty(user.role)) {
        roleCount[user.role]++;
      }
    });

    res.status(200).json({
      success: true,
      users,
      totalUsers: users.length,
      roleCount
    });

  } catch (error) {
    console.error('Get shop users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shop users'
    });
  }
};

const updateShopUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const shopId = req.user.shopId;

    // Find user and verify they belong to current shop
    const user = await User.findOne({ 
      _id: userId, 
      shopId,
      role: { $in: ['manager', 'pro_client', 'client'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized to modify this user'
      });
    }

    // Update allowed fields
    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update shop user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

const getUserWithPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const shopId = req.user.shopId;

    // Find user and verify they belong to current shop
    // ONLY allow viewing passwords for non-admin roles
    const user = await User.findOne({ 
      _id: userId, 
      shopId,
      role: { $in: ['manager', 'pro_client', 'client'] } // Removed 'admin' from here
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or password viewing not allowed for this user type'
      });
    }

    // Get decrypted password
    let decryptedPassword = null;
    try {
      decryptedPassword = await user.getDecryptedPassword();
    } catch (error) {
      console.error('Password decryption error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving password'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        password: decryptedPassword,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get user with password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user password'
    });
  }
};

const getShopUsersWithPasswords = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Get all users for current shop (excluding admin themselves)
    const users = await User.find({ 
      shopId, 
      role: { $in: ['manager', 'pro_client', 'client'] },
      isActive: true 
    })
    .select('-password -loginHistory')
    .sort({ role: 1, createdAt: -1 });

    // Decrypt passwords for each user
    const usersWithPasswords = [];
    for (const user of users) {
      try {
        const decryptedPassword = await user.getDecryptedPassword();
        usersWithPasswords.push({
          _id: user._id,
          username: user.username,
          password: decryptedPassword,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      } catch (error) {
        console.error(`Password decryption error for user ${user.username}:`, error);
        // Include user without password if decryption fails
        usersWithPasswords.push({
          _id: user._id,
          username: user.username,
          password: '[Decryption Failed]',
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      }
    }

    res.status(200).json({
      success: true,
      users: usersWithPasswords,
      totalUsers: usersWithPasswords.length
    });

  } catch (error) {
    console.error('Get shop users with passwords error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shop users with passwords'
    });
  }
};

const deleteShopUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent } = req.query;
    const shopId = req.user.shopId;

    // Find user and verify they belong to current shop
    const user = await User.findOne({ 
      _id: userId, 
      shopId,
      role: { $in: ['manager', 'pro_client', 'client'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized to delete this user'
      });
    }

    if (permanent === 'true') {
      // Hard delete
      await User.findByIdAndDelete(userId);
      
      res.status(200).json({
        success: true,
        message: `User ${user.username} deleted permanently`
      });
    } else {
      // Soft delete - deactivate
      user.isActive = false;
      await user.save();

      res.status(200).json({
        success: true,
        message: `User ${user.username} deactivated successfully`
      });
    }

  } catch (error) {
    console.error('Delete shop user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const shopId = req.user.shopId;

    // Find user and verify they belong to current shop
    const user = await User.findOne({ 
      _id: userId, 
      shopId,
      role: { $in: ['manager', 'pro_client', 'client'] }
    })
    .select('-password -encryptedPassword')
    .populate('shopId', 'shopName shopCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user details'
    });
  }
};

const getAvailableRoles = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Get role constraints info
    const roleConstraints = User.getRoleConstraints();
    
    // Check which roles already exist in the shop
    const existingRoles = await User.find({ 
      shopId, 
      role: { $in: ['manager', 'pro_client', 'client'] },
      isActive: true 
    }).distinct('role');

    // Determine available roles
    const availableRoles = [];
    const creableRoles = ['manager', 'pro_client', 'client'];

    for (const role of creableRoles) {
      const constraint = roleConstraints[role];
      const exists = existingRoles.includes(role);
      
      availableRoles.push({
        role,
        available: !exists,
        description: constraint.description,
        exists: exists
      });
    }

    res.status(200).json({
      success: true,
      availableRoles,
      existingRoles
    });

  } catch (error) {
    console.error('Get available roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting available roles'
    });
  }
};

const getShopDashboard = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Get shop details
    const shop = await Shop.findById(shopId);
    
    // Get user statistics
    const totalUsers = await User.countDocuments({ 
      shopId, 
      role: { $in: ['manager', 'pro_client', 'client'] }
    });
    
    const activeUsers = await User.countDocuments({ 
      shopId, 
      role: { $in: ['manager', 'pro_client', 'client'] },
      isActive: true 
    });

    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $match: { 
          shopId: shopId, 
          role: { $in: ['manager', 'pro_client', 'client'] }
        }
      },
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: { 
            $sum: { $cond: ['$isActive', 1, 0] } 
          }
        }
      }
    ]);

    // Get recent users
    const recentUsers = await User.find({ 
      shopId, 
      role: { $in: ['manager', 'pro_client', 'client'] }
    })
    .select('-password -loginHistory -encryptedPassword')
    .sort({ createdAt: -1 })
    .limit(5);

    res.status(200).json({
      success: true,
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        shopCode: shop.shopCode,
        isActive: shop.isActive
      },
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      },
      usersByRole,
      recentUsers
    });

  } catch (error) {
    console.error('Get shop dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shop dashboard'
    });
  }
};

module.exports = {
  createShopUser,
  getShopUsers,
  updateShopUser,
  updateUserCredentials,
  resetUserPassword,
  deleteShopUser,
  getUserDetails,
  getUserWithPassword,
  getShopUsersWithPasswords,
  getAvailableRoles,
  getShopDashboard
};