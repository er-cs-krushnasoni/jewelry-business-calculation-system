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
  
  if (this.goldSell <= this.goldBuy) {
    errors.push('Gold selling rate must be higher than gold buying rate');
  }
  
  if (this.silverSell <= this.silverBuy) {
    errors.push('Silver selling rate must be higher than silver buying rate');
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
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
  const updateDate = this.updatedAt.toLocaleDateString('en-CA', { timeZone: timezone });
  return today === updateDate;
};

// Instance method to get formatted update info
rateSchema.methods.getUpdateInfo = function(timezone = 'Asia/Kolkata') {
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
  const rates = await this.findOne({ shopId });
  return !!rates;
};

// Static method to create or update rates for a shop
rateSchema.statics.updateShopRates = async function(shopId, rateData, updatedByUser) {
  const updateData = {
    ...rateData,
    shopId,
    updatedBy: updatedByUser._id,
    updatedByUsername: updatedByUser.username,
    updatedByRole: updatedByUser.role
  };
  
  return this.findOneAndUpdate(
    { shopId },
    updateData,
    { 
      new: true, 
      upsert: true, // Create if doesn't exist
      runValidators: true 
    }
  );
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

// Ensure virtual fields are serialised
rateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.updatedBy; // Don't expose user ID
    return ret;
  }
});

module.exports = mongoose.model('Rate', rateSchema);