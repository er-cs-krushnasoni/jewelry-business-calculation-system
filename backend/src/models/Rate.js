const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required'],
    unique: true // Each shop has only one current rate document
  },
  
  // Gold rates per 10 grams (whole numbers only)
  goldBuy: {
    type: Number,
    required: [true, 'Gold buying rate is required'],
    min: [1, 'Gold buying rate must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Gold buying rate must be a whole number'
    }
  },
  
  goldSell: {
    type: Number,
    required: [true, 'Gold selling rate is required'],
    min: [1, 'Gold selling rate must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Gold selling rate must be a whole number'
    }
  },
  
  // Silver rates per 1 kg (whole numbers only)
  silverBuy: {
    type: Number,
    required: [true, 'Silver buying rate is required'],
    min: [1, 'Silver buying rate must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Silver buying rate must be a whole number'
    }
  },
  
  silverSell: {
    type: Number,
    required: [true, 'Silver selling rate is required'],
    min: [1, 'Silver selling rate must be at least 1'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Silver selling rate must be a whole number'
    }
  },
  
  // Track who updated and when
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user ID is required']
  },
  
  updatedByUsername: {
    type: String,
    required: [true, 'Updated by username is required'],
    trim: true
  },
  
  updatedByRole: {
    type: String,
    enum: ['admin', 'manager'],
    required: [true, 'Updated by role is required']
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for efficient queries
rateSchema.index({ shopId: 1 });
rateSchema.index({ updatedAt: -1 });
rateSchema.index({ shopId: 1, updatedAt: -1 });

// Validation to ensure selling rates are higher than buying rates
rateSchema.pre('save', function(next) {
  const errors = [];
  
  if (this.goldSell < this.goldBuy) {
    errors.push('Gold selling rate must be equal to or higher than gold buying rate');
  }
  
  if (this.silverSell < this.silverBuy) {
    errors.push('Silver selling rate must be equal to or higher than silver buying rate');
  }
  
  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.code = 'RATE_VALIDATION_ERROR';
    return next(error);
  }
  
  next();
});

// Instance method to check if rates are updated today
rateSchema.methods.isUpdatedToday = function(timezone = 'Asia/Kolkata') {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
    const updateDate = this.updatedAt.toLocaleDateString('en-CA', { timeZone: timezone });
    return today === updateDate;
  } catch (error) {
    console.error('Error checking if updated today:', error);
    return false;
  }
};

// Instance method to get formatted update info
rateSchema.methods.getUpdateInfo = function(timezone = 'Asia/Kolkata') {
  try {
    const updateTime = this.updatedAt.toLocaleString('en-IN', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return {
      updatedBy: this.updatedByUsername,
      role: this.updatedByRole,
      timestamp: updateTime,
      isToday: this.isUpdatedToday(timezone)
    };
  } catch (error) {
    console.error('Error getting update info:', error);
    return {
      updatedBy: this.updatedByUsername || 'Unknown',
      role: this.updatedByRole || 'unknown',
      timestamp: this.updatedAt.toISOString(),
      isToday: false
    };
  }
};

// Instance method to get rate per gram for calculations
rateSchema.methods.getGoldRatePerGram = function() {
  return {
    buy: Math.floor(this.goldBuy / 10), // Gold rates are per 10 grams
    sell: Math.ceil(this.goldSell / 10)  // Round up for selling, down for buying
  };
};

// Instance method to get silver rate per gram for calculations
rateSchema.methods.getSilverRatePerGram = function() {
  return {
    buy: Math.floor(this.silverBuy / 1000), // Silver rates are per 1 kg (1000 grams)
    sell: Math.ceil(this.silverSell / 1000)
  };
};

// Static method to get current rates for a shop
rateSchema.statics.getCurrentRatesForShop = function(shopId) {
  return this.findOne({ shopId }).populate('updatedBy', 'username role');
};

// Static method to check if shop has rates
rateSchema.statics.shopHasRates = async function(shopId) {
  try {
    const rates = await this.findOne({ shopId });
    return !!rates;
  } catch (error) {
    console.error('Error checking if shop has rates:', error);
    return false;
  }
};

// Static method to create or update rates for a shop
rateSchema.statics.updateShopRates = async function(shopId, rateData, updatedByUser) {
  try {
    const updateData = {
      ...rateData,
      shopId,
      updatedBy: updatedByUser._id,
      updatedByUsername: updatedByUser.username,
      updatedByRole: updatedByUser.role
    };
    
    console.log('Updating shop rates with data:', updateData);
    
    const result = await this.findOneAndUpdate(
      { shopId },
      updateData,
      { 
        new: true, 
        upsert: true, // Create if doesn't exist
        runValidators: true 
      }
    );
    
    console.log('Rate update successful for shop:', shopId);
    return result;
    
  } catch (error) {
    console.error('Error updating shop rates:', error);
    throw error;
  }
};

// Virtual for safe rate info (excluding internal IDs)
rateSchema.virtual('safeRateInfo').get(function() {
  return {
    shopId: this.shopId,
    goldBuy: this.goldBuy,
    goldSell: this.goldSell,
    silverBuy: this.silverBuy,
    silverSell: this.silverSell,
    updateInfo: this.getUpdateInfo(),
    lastUpdated: this.updatedAt
  };
});

// Debug method to check date calculations
rateSchema.methods.isUpdatedTodayDebug = function(timezone = 'Asia/Kolkata') {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
    const updateDate = this.updatedAt.toLocaleDateString('en-CA', { timeZone: timezone });
    
    console.log('=== Rate Update Debug ===');
    console.log('Today (IST):', today);
    console.log('Update Date (IST):', updateDate);
    console.log('Updated At (Raw):', this.updatedAt);
    console.log('Are Equal?:', today === updateDate);
    console.log('========================');
    
    return today === updateDate;
  } catch (error) {
    console.error('Error in debug check:', error);
    return false;
  }
};

// Static method for debugging all rates
rateSchema.statics.debugAllRates = async function() {
  try {
    const allRates = await this.find({}).populate('updatedBy', 'username role');
    console.log('=== All Rates Debug ===');
    allRates.forEach((rate, index) => {
      console.log(`Rate ${index + 1}:`, {
        shopId: rate.shopId,
        goldBuy: rate.goldBuy,
        goldSell: rate.goldSell,
        silverBuy: rate.silverBuy,
        silverSell: rate.silverSell,
        updatedBy: rate.updatedByUsername,
        updatedAt: rate.updatedAt,
        isToday: rate.isUpdatedToday()
      });
    });
    console.log('======================');
    return allRates;
  } catch (error) {
    console.error('Error debugging rates:', error);
    return [];
  }
};

// Ensure virtual fields are serialised
rateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.updatedBy; // Don't expose user ID
    return ret;
  }
});

console.log('Rate model loaded successfully');

module.exports = mongoose.model('Rate', rateSchema);