const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    minlength: [2, 'Shop name must be at least 2 characters'],
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  adminUsername: {
    type: String,
    required: [true, 'Admin username is required'],
    lowercase: true,
    trim: true
  },
  shopCode: {
    type: String,
    unique: true
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  defaultLanguage: {
    type: String,
    enum: ['en', 'gu', 'hi'],
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  masterEncryptionKey: {
    type: String,
    required: false,
    select: false
  },
  // SUBSCRIPTION SYSTEM WITH PAUSE FUNCTIONALITY
  subscription: {
    endDate: {
      type: Date,
      required: false,
      default: null
    },
    startDate: {
      type: Date,
      required: false,
      default: null
    },
    warningDays: {
      type: Number,
      default: 7,
      min: 0
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0
    },
    autoDeactivated: {
      type: Boolean,
      default: false
    },
    lastRenewalDate: {
      type: Date,
      default: null
    },
    // NEW FIELDS FOR PAUSE FUNCTIONALITY
    pausedAt: {
      type: Date,
      default: null
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    totalPausedDays: {
      type: Number,
      default: 0
    },
    history: [{
      startDate: Date,
      endDate: Date,
      days: Number,
      action: {
        type: String,
        enum: ['extended', 'reduced', 'paused', 'resumed'],
        default: 'extended'
      },
      pausedDuration: Number, // Days paused (for resume actions)
      renewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      renewedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  deactivation: {
    deactivatedAt: {
      type: Date,
      default: null
    },
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reason: {
      type: String,
      enum: ['manual', 'subscription_expired', 'admin_action'],
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  settings: {
    rateUpdateDeadlineHour: {
      type: Number,
      default: 13,
      min: 0,
      max: 23
    },
    allowMultiDeviceLogin: {
      type: Boolean,
      default: true
    },
    defaultRoundingPrecision: {
      type: Number,
      default: 2
    }
  }
}, {
  timestamps: true
});

// Indexes
shopSchema.index({ adminUsername: 1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ createdBy: 1 });
shopSchema.index({ shopCode: 1 });
shopSchema.index({ 'subscription.endDate': 1 });
shopSchema.index({ 'subscription.isPaused': 1 });

// Pre-save middleware
shopSchema.pre('save', async function(next) {
  try {
    if (!this.shopCode) {
      let code;
      let exists = true;
      let attempts = 0;
      
      while (exists && attempts < 10) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        code = `SHOP${randomNum}`;
        
        const existingShop = await this.constructor.findOne({ shopCode: code });
        exists = !!existingShop;
        attempts++;
      }
      
      if (exists) {
        throw new Error('Unable to generate unique shop code');
      }
      
      this.shopCode = code;
    }

    if (!this.masterEncryptionKey) {
      const PasswordEncryption = require('../utils/encryption');
      this.masterEncryptionKey = PasswordEncryption.generateShopMasterKey();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-remove middleware for cascade deletion
shopSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    console.log(`[Shop Cascade] Pre-delete hook triggered for shop: ${this._id}`);
    
    const shopId = this._id;
    
    const Category = require('./Category');
    const Rate = require('./Rate');
    const RateTable = require('./RateTable');
    const User = require('./User');
    
    await Promise.all([
      Category.deleteMany({ shopId }),
      Rate.deleteMany({ shopId }),
      RateTable.deleteMany({ shopId }),
      User.deleteMany({ shopId })
    ]);
    
    console.log(`[Shop Cascade] All related data deleted for shop: ${shopId}`);
    next();
  } catch (error) {
    console.error('[Shop Cascade] Error during cascade delete:', error);
    next(error);
  }
});

// Static method for safe cascade deletion
shopSchema.statics.cascadeDelete = async function(shopId) {
  try {
    console.log(`[Shop Cascade Delete] Starting for shop: ${shopId}`);
    
    const shop = await this.findById(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    const deletionResults = {
      shopName: shop.shopName,
      shopCode: shop.shopCode,
      users: 0,
      categories: 0,
      rates: 0,
      rateTables: 0
    };

    const Category = require('./Category');
    const Rate = require('./Rate');
    const RateTable = require('./RateTable');
    const User = require('./User');

    const [categoriesResult, ratesResult, rateTablesResult, usersResult] = await Promise.all([
      Category.deleteMany({ shopId }),
      Rate.deleteMany({ shopId }),
      RateTable.deleteMany({ shopId }),
      User.deleteMany({ shopId })
    ]);

    deletionResults.categories = categoriesResult.deletedCount || 0;
    deletionResults.rates = ratesResult.deletedCount || 0;
    deletionResults.rateTables = rateTablesResult.deletedCount || 0;
    deletionResults.users = usersResult.deletedCount || 0;

    await this.findByIdAndDelete(shopId);

    console.log(`[Shop Cascade Delete] Completed:`, deletionResults);

    return {
      success: true,
      deletionResults,
      totalRecordsDeleted: 
        1 + 
        deletionResults.users +
        deletionResults.categories +
        deletionResults.rates +
        deletionResults.rateTables
    };

  } catch (error) {
    console.error('[Shop Cascade Delete] Error:', error);
    throw error;
  }
};

// Static method to get related data count before deletion
shopSchema.statics.getRelatedDataCount = async function(shopId) {
  try {
    const Category = require('./Category');
    const Rate = require('./Rate');
    const RateTable = require('./RateTable');
    const User = require('./User');

    const [categoriesCount, ratesCount, rateTablesCount, usersCount] = await Promise.all([
      Category.countDocuments({ shopId }),
      Rate.countDocuments({ shopId }),
      RateTable.countDocuments({ shopId }),
      User.countDocuments({ shopId })
    ]);

    return {
      categories: categoriesCount,
      rates: ratesCount,
      rateTables: rateTablesCount,
      users: usersCount,
      totalRecords: categoriesCount + ratesCount + rateTablesCount + usersCount
    };
  } catch (error) {
    console.error('[Shop] Error counting related data:', error);
    throw error;
  }
};

// Instance methods
shopSchema.methods.isShopActive = function() {
  return this.isActive;
};

shopSchema.methods.isSubscriptionExpired = function() {
  if (!this.subscription.endDate) return false;
  return new Date() > this.subscription.endDate;
};

shopSchema.methods.isInWarningPeriod = function() {
  if (!this.subscription.endDate) return false;
  
  const now = new Date();
  const endDate = this.subscription.endDate;
  const warningDate = new Date(endDate);
  warningDate.setDate(warningDate.getDate() - this.subscription.warningDays);
  
  return now >= warningDate && now <= endDate;
};

shopSchema.methods.getDaysRemaining = function() {
  if (!this.subscription.endDate) return null;
  
  const now = new Date();
  const endDate = this.subscription.endDate;
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// ENHANCED: Get subscription status with pause info
shopSchema.methods.getSubscriptionStatus = function() {
  if (!this.subscription.endDate) {
    return { 
      status: 'no_subscription', 
      message: 'No subscription set', 
      daysRemaining: null,
      isPaused: false
    };
  }

  // Check if subscription is paused
  if (this.subscription.isPaused) {
    const daysRemaining = this.getDaysRemaining();
    return {
      status: 'paused',
      message: 'Subscription paused (manually deactivated)',
      daysRemaining: daysRemaining,
      isPaused: true,
      pausedAt: this.subscription.pausedAt,
      pausedSince: Math.ceil((new Date() - this.subscription.pausedAt) / (1000 * 60 * 60 * 24))
    };
  }

  const daysRemaining = this.getDaysRemaining();
  
  if (daysRemaining < 0) {
    return { 
      status: 'expired', 
      message: 'Subscription expired', 
      daysRemaining: 0,
      expiredDays: Math.abs(daysRemaining),
      isPaused: false
    };
  }
  
  if (this.isInWarningPeriod()) {
    return { 
      status: 'warning', 
      message: `${daysRemaining} days remaining`, 
      daysRemaining,
      isWarning: true,
      isPaused: false
    };
  }
  
  return { 
    status: 'active', 
    message: `${daysRemaining} days remaining`, 
    daysRemaining,
    isPaused: false
  };
};

// ENHANCED: Extend subscription (works for both active and paused shops)
shopSchema.methods.extendSubscription = async function(days, renewedBy) {
  const now = new Date();
  
  let newEndDate;
  if (!this.subscription.endDate || this.isSubscriptionExpired()) {
    this.subscription.startDate = now;
    newEndDate = new Date(now);
    newEndDate.setDate(newEndDate.getDate() + days);
  } else {
    // Extend from current end date (even if paused)
    newEndDate = new Date(this.subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + days);
  }
  
  this.subscription.endDate = newEndDate;
  this.subscription.lastRenewalDate = now;
  this.subscription.autoDeactivated = false;
  
  this.subscription.history.push({
    startDate: this.subscription.startDate || now,
    endDate: newEndDate,
    days: days,
    action: 'extended',
    renewedBy: renewedBy,
    renewedAt: now
  });
  
  // If shop was auto-deactivated due to expiry, reactivate it
  if (!this.isActive && this.deactivation.reason === 'subscription_expired') {
    this.isActive = true;
    this.deactivation = {
      deactivatedAt: null,
      deactivatedBy: null,
      reason: null,
      notes: null
    };
  }
  
  // Note: If subscription is paused (manual deactivation), 
  // keep it paused until explicitly activated
  
  return this.save();
};

// NEW: Deactivate shop with pause logic
shopSchema.methods.deactivateShop = async function(deactivatedBy, reason = 'manual', notes = '') {
  const now = new Date();
  
  this.isActive = false;
  this.deactivation = {
    deactivatedAt: now,
    deactivatedBy: deactivatedBy,
    reason: reason,
    notes: notes
  };
  
  // PAUSE SUBSCRIPTION LOGIC
  // Only pause if reason is manual or admin_action AND subscription exists and is not expired
  if ((reason === 'manual' || reason === 'admin_action') && 
      this.subscription.endDate && 
      !this.isSubscriptionExpired()) {
    
    this.subscription.isPaused = true;
    this.subscription.pausedAt = now;
    
    console.log(`[Shop] Subscription paused for shop ${this.shopCode} at ${now}`);
    
    // Add pause event to history
    this.subscription.history.push({
      startDate: this.subscription.startDate,
      endDate: this.subscription.endDate,
      days: 0,
      action: 'paused',
      renewedBy: deactivatedBy,
      renewedAt: now
    });
  }
  
  return this.save();
};

// NEW: Activate shop with resume logic
shopSchema.methods.activateShop = async function(activatedBy) {
  const now = new Date();
  
  this.isActive = true;
  this.subscription.autoDeactivated = false;
  
  // RESUME SUBSCRIPTION LOGIC
  // If subscription was paused, extend endDate by paused duration
  if (this.subscription.isPaused && this.subscription.pausedAt) {
    
    // Calculate how long the shop was paused
    const pausedDuration = now - this.subscription.pausedAt;
    const pausedDays = Math.ceil(pausedDuration / (1000 * 60 * 60 * 24));
    
    // Extend subscription end date by paused duration
    const oldEndDate = new Date(this.subscription.endDate);
    const newEndDate = new Date(this.subscription.endDate);
    newEndDate.setTime(newEndDate.getTime() + pausedDuration);
    
    this.subscription.endDate = newEndDate;
    this.subscription.totalPausedDays += pausedDays;
    
    console.log(`[Shop] Subscription resumed for shop ${this.shopCode}. Extended by ${pausedDays} days (was paused from ${this.subscription.pausedAt} to ${now})`);
    console.log(`[Shop] Old end date: ${oldEndDate}, New end date: ${newEndDate}`);
    
    // Add resume event to history
    this.subscription.history.push({
      startDate: this.subscription.startDate,
      endDate: newEndDate,
      days: pausedDays,
      action: 'resumed',
      pausedDuration: pausedDays,
      renewedBy: activatedBy,
      renewedAt: now
    });
    
    // Clear pause flags
    this.subscription.isPaused = false;
    this.subscription.pausedAt = null;
  }
  
  // Clear deactivation info
  this.deactivation = {
    deactivatedAt: null,
    deactivatedBy: null,
    reason: null,
    notes: null
  };
  
  return this.save();
};

// Static methods
shopSchema.statics.getExpiringShops = function(days = 7) {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    'subscription.isPaused': false, // Don't include paused subscriptions
    'subscription.endDate': {
      $gte: now,
      $lte: futureDate
    }
  });
};

shopSchema.statics.getExpiredShops = function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    'subscription.isPaused': false, // Don't include paused subscriptions
    'subscription.endDate': {
      $lt: now
    }
  });
};

shopSchema.methods.getCurrentTime = function() {
  return new Date().toLocaleString('en-US', { 
    timeZone: this.timezone 
  });
};

shopSchema.statics.findActiveShops = function() {
  return this.find({ isActive: true });
};

shopSchema.statics.findShopsByCreator = function(creatorId) {
  return this.find({ createdBy: creatorId });
};

shopSchema.virtual('summary').get(function() {
  return {
    _id: this._id,
    shopName: this.shopName,
    shopCode: this.shopCode,
    adminUsername: this.adminUsername,
    isActive: this.isActive,
    subscriptionStatus: this.getSubscriptionStatus(),
    createdAt: this.createdAt
  };
});

shopSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.masterEncryptionKey;
    return ret;
  }
});

module.exports = mongoose.model('Shop', shopSchema);