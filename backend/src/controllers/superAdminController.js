const User = require('../models/User');
const Shop = require('../models/Shop');

// Update shop information AND shop name
const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { shopName, contactInfo, notes, defaultLanguage, isActive } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (shopName) shop.shopName = shopName.trim();
    if (contactInfo) shop.contactInfo = contactInfo;
    if (notes !== undefined) shop.notes = notes?.trim() || '';
    if (defaultLanguage) shop.defaultLanguage = defaultLanguage;
    if (isActive !== undefined) shop.isActive = isActive;

    await shop.save();

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully',
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        shopCode: shop.shopCode,
        adminUsername: shop.adminUsername,
        contactInfo: shop.contactInfo,
        notes: shop.notes,
        defaultLanguage: shop.defaultLanguage,
        isActive: shop.isActive,
        updatedAt: shop.updatedAt
      }
    });

  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating shop'
    });
  }
};

// Update shop admin credentials (username/password) - Super Admin only
const updateShopAdminCredentials = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { username, password } = req.body;

    if (!username && !password) {
      return res.status(400).json({
        success: false,
        message: 'Username or password must be provided'
      });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

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

    if (username && username.toLowerCase() !== shopAdmin.username) {
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists. Please choose a different username.'
        });
      }
      
      shopAdmin.username = username.toLowerCase().trim();
      shop.adminUsername = username.toLowerCase().trim();
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      
      shopAdmin.password = password;
    }

    await shopAdmin.save();
    await shop.save();

    res.status(200).json({
      success: true,
      message: 'Shop admin credentials updated successfully',
      admin: {
        _id: shopAdmin._id,
        username: shopAdmin.username,
        role: shopAdmin.role,
        updatedAt: shopAdmin.updatedAt
      },
      note: 'Password updated but not shown for security reasons'
    });

  } catch (error) {
    console.error('Update shop admin credentials error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating shop admin credentials'
    });
  }
};

// Get shop details with users
const getShopDetails = async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId).populate('createdBy', 'username');
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const users = await User.find({ shopId: shopId })
      .select('-password -loginHistory -encryptedPassword')
      .sort({ role: 1, createdAt: -1 });

    const roleCount = {
      admin: 0,
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
      shop,
      users,
      userCount: users.length,
      roleCount,
      securityNote: 'Passwords are not visible to Super Admin for security reasons'
    });

  } catch (error) {
    console.error('Get shop details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting shop details'
    });
  }
};

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

// Create new shop with admin and INITIAL SUBSCRIPTION
const createShop = async (req, res) => {
  try {
    const {
      shopName,
      contactInfo,
      notes,
      adminUsername,
      adminPassword,
      defaultLanguage,
      subscriptionDays // NOW FUNCTIONAL
    } = req.body;

    // Validate required fields
    if (!shopName || !adminUsername || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Shop name, admin username, and admin password are required'
      });
    }

    // Validate subscription days if provided
    if (subscriptionDays && (isNaN(subscriptionDays) || subscriptionDays < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Subscription days must be a positive number'
      });
    }

    // Check if admin username already exists
    const existingUser = await User.findByUsername(adminUsername);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please choose a different username.'
      });
    }

    // Create shop
    const shop = await Shop.create({
      shopName: shopName.trim(),
      contactInfo: contactInfo || {},
      notes: notes?.trim() || '',
      adminUsername: adminUsername.toLowerCase().trim(),
      defaultLanguage: defaultLanguage || 'en',
      createdBy: req.user._id,
      isActive: true
    });

    // Set initial subscription if provided
    if (subscriptionDays && subscriptionDays > 0) {
      await shop.extendSubscription(subscriptionDays, req.user._id);
      console.log(`Initial subscription of ${subscriptionDays} days set for shop ${shop.shopCode}`);
    }

    // Create shop admin user
    const shopAdmin = await User.create({
      username: adminUsername.toLowerCase().trim(),
      password: adminPassword,
      role: 'admin',
      shopId: shop._id,
      isActive: true
    });

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
        subscription: shop.subscription,
        subscriptionStatus: shop.getSubscriptionStatus(),
        createdAt: shop.createdAt
      },
      admin: {
        _id: shopAdmin._id,
        username: shopAdmin.username,
        role: shopAdmin.role
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
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating shop'
    });
  }
};

// Enhanced Delete/Deactivate shop with CASCADE DELETE
const deleteShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { permanent } = req.query;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (permanent === 'true') {
      console.log(`Starting permanent deletion for shop: ${shop.shopName} (${shopId})`);
      
      const deletionResults = {
        shop: null,
        users: 0,
        categories: 0,
        rates: 0,
        rateTables: 0
      };

      const Category = require('../models/Category');
      const Rate = require('../models/Rate');
      const RateTable = require('../models/RateTable');

      try {
        const categoriesResult = await Category.deleteMany({ shopId: shopId });
        deletionResults.categories = categoriesResult.deletedCount || 0;
        console.log(`Deleted ${deletionResults.categories} categories`);

        const ratesResult = await Rate.deleteMany({ shopId: shopId });
        deletionResults.rates = ratesResult.deletedCount || 0;
        console.log(`Deleted ${deletionResults.rates} rate records`);

        const rateTablesResult = await RateTable.deleteMany({ shopId: shopId });
        deletionResults.rateTables = rateTablesResult.deletedCount || 0;
        console.log(`Deleted ${deletionResults.rateTables} rate tables`);

        const usersResult = await User.deleteMany({ shopId: shopId });
        deletionResults.users = usersResult.deletedCount || 0;
        console.log(`Deleted ${deletionResults.users} users`);

        await Shop.findByIdAndDelete(shopId);
        deletionResults.shop = shop.shopName;
        console.log(`Deleted shop: ${shop.shopName}`);

        if (req.app.get('io')) {
          req.app.get('io').to(`shop:${shopId}`).emit('shop-deleted', {
            shopId: shop._id,
            shopName: shop.shopName,
            message: 'This shop has been permanently deleted by administrator.'
          });
        }

        res.status(200).json({
          success: true,
          message: `Shop "${shop.shopName}" and all associated data deleted permanently`,
          deletionSummary: {
            shop: deletionResults.shop,
            usersDeleted: deletionResults.users,
            categoriesDeleted: deletionResults.categories,
            ratesDeleted: deletionResults.rates,
            rateTablesDeleted: deletionResults.rateTables,
            totalRecordsDeleted: 
              1 + 
              deletionResults.users + 
              deletionResults.categories + 
              deletionResults.rates + 
              deletionResults.rateTables
          }
        });

      } catch (deleteError) {
        console.error('Error during cascade deletion:', deleteError);
        
        res.status(500).json({
          success: false,
          message: 'Error during deletion process',
          error: deleteError.message,
          partialDeletion: deletionResults
        });
      }

    } else {
      console.log(`Soft deleting (deactivating) shop: ${shop.shopName} (${shopId})`);

      const usersResult = await User.updateMany(
        { shopId: shopId }, 
        { isActive: false }
      );

      shop.isActive = false;
      shop.deactivation = {
        deactivatedAt: new Date(),
        deactivatedBy: req.user._id,
        reason: 'admin_action',
        notes: 'Shop deactivated via soft delete'
      };
      await shop.save();

      console.log(`Deactivated shop and ${usersResult.modifiedCount} users`);

      if (req.app.get('io')) {
        req.app.get('io').to(`shop:${shopId}`).emit('shop-deactivated', {
          shopId: shop._id,
          shopName: shop.shopName,
          reason: 'admin_action',
          message: 'Your shop has been deactivated by administrator.'
        });
      }

      res.status(200).json({
        success: true,
        message: `Shop "${shop.shopName}" deactivated successfully`,
        deactivationSummary: {
          shop: shop.shopName,
          usersDeactivated: usersResult.modifiedCount,
          note: 'Data is preserved. Shop can be reactivated later.'
        }
      });
    }

  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting shop',
      error: error.message
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

// Extend shop subscription
const extendSubscription = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { days } = req.body;

    if (!days || days < 1) {
      return res.status(400).json({
        success: false,
        message: 'Subscription days must be at least 1'
      });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    await shop.extendSubscription(days, req.user._id);

    res.status(200).json({
      success: true,
      message: `Subscription extended by ${days} days`,
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        isActive: shop.isActive,
        subscription: shop.subscription,
        subscriptionStatus: shop.getSubscriptionStatus()
      }
    });

  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error extending subscription'
    });
  }
};

// NEW: Reduce shop subscription
const reduceSubscription = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { days } = req.body;

    if (!days || days < 1) {
      return res.status(400).json({
        success: false,
        message: 'Reduction days must be at least 1'
      });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (!shop.subscription?.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Shop has no subscription to reduce'
      });
    }

    // Check if subscription is already expired
    const now = new Date();
    if (shop.subscription.endDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reduce an expired subscription'
      });
    }

    // Calculate new end date
    const newEndDate = new Date(shop.subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() - days);

    // Ensure new end date is not before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newEndDate < today) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce subscription by ${days} days. New end date would be in the past. Maximum reducible: ${Math.ceil((shop.subscription.endDate - today) / (1000 * 60 * 60 * 24))} days`
      });
    }

    // Update subscription
    shop.subscription.endDate = newEndDate;
    shop.subscription.lastRenewalDate = now;

    // Add to history with negative days to indicate reduction
    shop.subscription.history.push({
      startDate: shop.subscription.startDate || now,
      endDate: newEndDate,
      days: -days, // Negative to indicate reduction
      renewedBy: req.user._id,
      renewedAt: now
    });

    await shop.save();

    console.log(`Subscription reduced by ${days} days for shop: ${shop.shopName}`);

    res.status(200).json({
      success: true,
      message: `Subscription reduced by ${days} days`,
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        isActive: shop.isActive,
        subscription: shop.subscription,
        subscriptionStatus: shop.getSubscriptionStatus()
      }
    });

  } catch (error) {
    console.error('Reduce subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reducing subscription'
    });
  }
};

// Bulk activate shops
const bulkActivateShops = async (req, res) => {
  try {
    const { shopIds } = req.body;

    if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shop IDs array is required'
      });
    }

    const results = {
      success: [],
      failed: [],
      resumed: [] // Track which shops had paused subscriptions
    };

    for (const shopId of shopIds) {
      try {
        const shop = await Shop.findById(shopId);
        if (shop) {
          const wasPaused = shop.subscription?.isPaused;
          await shop.activateShop(req.user._id); // Pass activatedBy
          results.success.push(shopId);
          if (wasPaused) {
            results.resumed.push({
              shopId,
              shopName: shop.shopName,
              pausedDays: shop.subscription.totalPausedDays
            });
          }
        } else {
          results.failed.push({ shopId, reason: 'Shop not found' });
        }
      } catch (error) {
        results.failed.push({ shopId, reason: error.message });
      }
    }

    const message = results.resumed.length > 0
      ? `Activated ${results.success.length} shops (${results.resumed.length} with resumed subscriptions)`
      : `Activated ${results.success.length} shops`;

    res.status(200).json({
      success: true,
      message,
      results
    });

  } catch (error) {
    console.error('Bulk activate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk activation'
    });
  }
};

// Bulk deactivate shops
const bulkDeactivateShops = async (req, res) => {
  try {
    const { shopIds, reason, notes } = req.body;

    if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shop IDs array is required'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const shopId of shopIds) {
      try {
        const shop = await Shop.findById(shopId);
        if (shop) {
          await shop.deactivateShop(req.user._id, reason || 'admin_action', notes);
          results.success.push(shopId);
          
          if (req.app.get('io')) {
            req.app.get('io').to(`shop:${shopId}`).emit('shop-deactivated', {
              shopId: shop._id,
              shopName: shop.shopName,
              reason: reason || 'admin_action',
              message: 'Your shop has been deactivated by administrator.'
            });
          }
        } else {
          results.failed.push({ shopId, reason: 'Shop not found' });
        }
      } catch (error) {
        results.failed.push({ shopId, reason: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Deactivated ${results.success.length} shops`,
      results
    });

  } catch (error) {
    console.error('Bulk deactivate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk deactivation'
    });
  }
};

// Get subscription analytics
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const now = new Date();
    
    const expiringSoon = await Shop.getExpiringShops(7);
    const expiringThisMonth = await Shop.getExpiringShops(30);
    const expired = await Shop.getExpiredShops();
    
    const noSubscription = await Shop.countDocuments({
      'subscription.endDate': null
    });
    
    const activeShops = await Shop.countDocuments({ isActive: true });
    const inactiveShops = await Shop.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      analytics: {
        total: activeShops + inactiveShops,
        active: activeShops,
        inactive: inactiveShops,
        expiringSoon: expiringSoon.length,
        expiringThisMonth: expiringThisMonth.length,
        expired: expired.length,
        noSubscription
      },
      expiringSoonList: expiringSoon.map(shop => ({
        _id: shop._id,
        shopName: shop.shopName,
        shopCode: shop.shopCode,
        daysRemaining: shop.getDaysRemaining(),
        subscriptionEndDate: shop.subscription.endDate
      }))
    });

  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting analytics'
    });
  }
};
// Add this new function to your existing superAdminController.js

// Update Super Admin's own credentials (username/password) - Requires current password
const updateOwnCredentials = async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const superAdminId = req.user._id;

    console.log('[UPDATE OWN CREDENTIALS] Request received for:', req.user.username);

    // Validate that current password is provided
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      });
    }

    // At least one field (username or password) must be provided
    if (!newUsername && !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New username or new password must be provided'
      });
    }

    // Find the super admin
    const superAdmin = await User.findById(superAdminId);
    if (!superAdmin || superAdmin.role !== 'super_admin') {
      return res.status(404).json({
        success: false,
        message: 'Super admin not found'
      });
    }

    // Verify current password
    const isPasswordValid = await superAdmin.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    console.log('[UPDATE OWN CREDENTIALS] Current password verified');

    // Update username if provided
    if (newUsername && newUsername.trim().toLowerCase() !== superAdmin.username) {
      // Check if new username already exists
      const existingUser = await User.findByUsername(newUsername);
      if (existingUser && existingUser._id.toString() !== superAdminId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists. Please choose a different username.'
        });
      }

      superAdmin.username = newUsername.trim().toLowerCase();
      console.log('[UPDATE OWN CREDENTIALS] Username updated to:', newUsername);
    }

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Set temporary plain password for hashing in pre-save middleware
      User.setTempPlainPassword(newPassword);
      superAdmin.password = newPassword;
      console.log('[UPDATE OWN CREDENTIALS] Password updated');
    }

    await superAdmin.save();
    console.log('[UPDATE OWN CREDENTIALS] Super admin credentials saved successfully');

    res.status(200).json({
      success: true,
      message: 'Your credentials have been updated successfully',
      user: {
        _id: superAdmin._id,
        username: superAdmin.username,
        role: superAdmin.role,
        updatedAt: superAdmin.updatedAt
      }
    });

  } catch (error) {
    console.error('[UPDATE OWN CREDENTIALS] Error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating credentials'
    });
  }
};

// Don't forget to add this to module.exports at the bottom:
module.exports = {
  getAllShops,
  createShop,
  updateShop,
  updateShopAdminCredentials,
  deleteShop,
  getShopDetails,
  getDashboardStats,
  extendSubscription,
  reduceSubscription,
  bulkActivateShops,
  bulkDeactivateShops,
  getSubscriptionAnalytics,
  updateOwnCredentials  // ADD THIS
};