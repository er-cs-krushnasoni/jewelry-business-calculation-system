const User = require('../models/User');
const Shop = require('../models/Shop');

// Get all shops
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: shops.length,
      shops
    });

  } catch (error) {
    console.error('Get all shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shops'
    });
  }
};

// Create new shop with admin
const createShop = async (req, res) => {
  try {
    const {
      shopName,
      contactInfo,
      notes,
      adminUsername,
      adminPassword,
      defaultLanguage
    } = req.body;

    // Validate required fields
    if (!shopName || !adminUsername || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Shop name, admin username, and admin password are required'
      });
    }

    // Check if admin username already exists (globally unique)
    const existingUser = await User.findByUsername(adminUsername);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Create shop first
    const shop = await Shop.create({
      shopName: shopName.trim(),
      contactInfo: contactInfo || {},
      notes: notes?.trim() || '',
      adminUsername: adminUsername.toLowerCase().trim(),
      defaultLanguage: defaultLanguage || 'en',
      createdBy: req.user._id,
      isActive: true
    });

    // Create shop admin user
    const shopAdmin = await User.create({
      username: adminUsername.toLowerCase().trim(),
      password: adminPassword,
      role: 'admin',
      shopId: shop._id,
      isActive: true,
      mustChangePassword: true // Force password change on first login
    });

    // Return shop data with admin info
    res.status(201).json({
      success: true,
      message: 'Shop and admin account created successfully',
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        shopCode: shop.shopCode,
        adminUsername: shop.adminUsername,
        contactInfo: shop.contactInfo,
        notes: shop.notes,
        defaultLanguage: shop.defaultLanguage,
        isActive: shop.isActive,
        createdAt: shop.createdAt
      },
      admin: {
        _id: shopAdmin._id,
        username: shopAdmin.username,
        role: shopAdmin.role,
        mustChangePassword: shopAdmin.mustChangePassword
      }
    });

  } catch (error) {
    console.error('Create shop error:', error);
    
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
        message: 'Shop code or username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating shop'
    });
  }
};

// Update shop information
const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { shopName, contactInfo, notes, defaultLanguage, isActive } = req.body;

    // Find shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Update shop fields
    if (shopName) shop.shopName = shopName.trim();
    if (contactInfo) shop.contactInfo = contactInfo;
    if (notes !== undefined) shop.notes = notes?.trim() || '';
    if (defaultLanguage) shop.defaultLanguage = defaultLanguage;
    if (isActive !== undefined) shop.isActive = isActive;

    await shop.save();

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully',
      shop
    });

  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating shop'
    });
  }
};

// Reset shop admin password
const resetShopAdminPassword = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Find shop admin
    const shopAdmin = await User.findOne({ 
      shopId: shopId, 
      role: 'admin' 
    });

    if (!shopAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Shop admin not found'
      });
    }

    // Update password
    shopAdmin.password = newPassword;
    shopAdmin.mustChangePassword = true;
    await shopAdmin.save();

    res.status(200).json({
      success: true,
      message: 'Shop admin password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
};

// Delete/Deactivate shop
const deleteShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { permanent } = req.query; // ?permanent=true for hard delete

    // Find shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (permanent === 'true') {
      // Hard delete - remove shop and all associated users
      await User.deleteMany({ shopId: shopId });
      await Shop.findByIdAndDelete(shopId);
      
      res.status(200).json({
        success: true,
        message: 'Shop and all associated data deleted permanently'
      });
    } else {
      // Soft delete - deactivate shop and users
      await User.updateMany(
        { shopId: shopId }, 
        { isActive: false }
      );
      shop.isActive = false;
      await shop.save();

      res.status(200).json({
        success: true,
        message: 'Shop deactivated successfully'
      });
    }

  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting shop'
    });
  }
};

// Get shop details with users
const getShopDetails = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Find shop with creator info
    const shop = await Shop.findById(shopId).populate('createdBy', 'username');
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Get all users for this shop
    const users = await User.find({ shopId: shopId })
      .select('-password -loginHistory')
      .sort({ role: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      shop,
      users,
      userCount: users.length
    });

  } catch (error) {
    console.error('Get shop details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shop details'
    });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ isActive: true });
    const inactiveShops = totalShops - activeShops;
    const totalUsers = await User.countDocuments({ role: { $ne: 'super_admin' } });
    const activeUsers = await User.countDocuments({ 
      role: { $ne: 'super_admin' }, 
      isActive: true 
    });

    // Recent shops
    const recentShops = await Shop.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalShops,
        activeShops,
        inactiveShops,
        totalUsers,
        activeUsers
      },
      recentShops
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting dashboard stats'
    });
  }
};

module.exports = {
  getAllShops,
  createShop,
  updateShop,
  resetShopAdminPassword,
  deleteShop,
  getShopDetails,
  getDashboardStats
};