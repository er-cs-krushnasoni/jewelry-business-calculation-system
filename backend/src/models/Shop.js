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
  // NEW: Master encryption key for encrypting shop user passwords
  masterEncryptionKey: {
    type: String,
    required: false, // Will be generated in pre-save middleware
    select: false // Don't include in normal queries for security
  },
  settings: {
    rateUpdateDeadlineHour: {
      type: Number,
      default: 13, // 1:00 PM
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

// Index for efficient queries
shopSchema.index({ adminUsername: 1 });
shopSchema.index({ isActive: 1 });
shopSchema.index({ createdBy: 1 });
shopSchema.index({ shopCode: 1 });

// Pre-save middleware to generate unique shop code AND master encryption key
shopSchema.pre('save', async function(next) {
  try {
    // Generate shop code if not exists
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

    // Generate master encryption key if not exists
    if (!this.masterEncryptionKey) {
      const PasswordEncryption = require('../utils/encryption');
      this.masterEncryptionKey = PasswordEncryption.generateShopMasterKey();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if shop is active
shopSchema.methods.isShopActive = function() {
  return this.isActive;
};

// Instance method to get shop's current time
shopSchema.methods.getCurrentTime = function() {
  return new Date().toLocaleString('en-US', { 
    timeZone: this.timezone 
  });
};

// Static method to find active shops
shopSchema.statics.findActiveShops = function() {
  return this.find({ isActive: true });
};

// Static method to find shops by super admin
shopSchema.statics.findShopsByCreator = function(creatorId) {
  return this.find({ createdBy: creatorId });
};

// Virtual for shop summary
shopSchema.virtual('summary').get(function() {
  return {
    _id: this._id,
    shopName: this.shopName,
    shopCode: this.shopCode,
    adminUsername: this.adminUsername,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
});

// Ensure virtual fields are serialised
shopSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    // Never expose master encryption key in JSON responses
    delete ret.masterEncryptionKey;
    return ret;
  }
});

module.exports = mongoose.model('Shop', shopSchema);