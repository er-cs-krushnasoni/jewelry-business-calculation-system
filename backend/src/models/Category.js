const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Basic category info
  type: {
    type: String,
    enum: ['NEW', 'OLD'],
    required: [true, 'Category type is required'],
    uppercase: true
  },
  
  metal: {
    type: String,
    enum: ['GOLD', 'SILVER'],
    required: [true, 'Metal type is required'],
    uppercase: true
  },
  
  // NEW jewelry specific fields
  itemCategory: {
    type: String,
    required: function() { return this.type === 'NEW'; },
    trim: true,
    maxlength: [50, 'Item category cannot exceed 50 characters']
  },
  
  // NEW jewelry - purity percentage (actual purity for NEW)
  purityPercentage: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [1, 'Purity percentage must be at least 1%'],
    max: [100, 'Purity percentage cannot exceed 100%']
  },
  
  // NEW jewelry - buying and selling percentages
  buyingFromWholesalerPercentage: {
    type: Number,
    required: function() { 
      // Required for NEW jewelry OR for OLD jewelry when resale is enabled
      return this.type === 'NEW' || (this.type === 'OLD' && this.resaleEnabled); 
    },
    min: [1, 'Buying percentage must be at least 1%']
  },
  
  sellingPercentage: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [1, 'Selling percentage must be at least 1%']
  },
  
  // OLD jewelry specific fields
  truePurityPercentage: {
    type: Number,
    required: function() { return this.type === 'OLD'; },
    min: [1, 'True purity percentage must be at least 1%'],
    max: [100, 'True purity percentage cannot exceed 100%']
  },
  
  scrapBuyOwnPercentage: {
    type: Number,
    required: function() { return this.type === 'OLD'; },
    min: [1, 'Scrap buy own percentage must be at least 1%']
  },
  
  scrapBuyOtherPercentage: {
    type: Number,
    required: function() { return this.type === 'OLD'; },
    min: [1, 'Scrap buy other percentage must be at least 1%']
  },
  
  // OLD jewelry - resale system
  resaleEnabled: {
    type: Boolean,
    default: false,
    required: function() { return this.type === 'OLD'; }
  },
  
  directResalePercentage: {
    type: Number,
    required: function() { return this.type === 'OLD' && this.resaleEnabled; },
    min: [1, 'Direct resale percentage must be at least 1%']
  },
  
  polishRepairResalePercentage: {
    type: Number,
    required: function() { return this.type === 'OLD' && this.resaleEnabled; },
    min: [1, 'Polish/Repair resale percentage must be at least 1%']
  },
  
  polishRepairCostPercentage: {
    type: Number,
    required: function() { return this.type === 'OLD' && this.resaleEnabled; },
    min: [0, 'Polish/Repair cost percentage must be at least 0%'],
    max: [50, 'Polish/Repair cost percentage cannot exceed 50%']
  },
  
  // Code/Stamp - unique within shop+type+metal+(itemCategory for NEW only)
  code: {
    type: String,
    required: [true, 'Code/Stamp is required'],
    trim: true,
    maxlength: [20, 'Code cannot exceed 20 characters']
  },
  
  // Descriptions system
  descriptions: {
    universal: {
      type: String,
      trim: true,
      maxlength: [500, 'Universal description cannot exceed 500 characters']
    },
    admin: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin description cannot exceed 500 characters']
    },
    manager: {
      type: String,
      trim: true,
      maxlength: [500, 'Manager description cannot exceed 500 characters']
    },
    proClient: {
      type: String,
      trim: true,
      maxlength: [500, 'Pro Client description cannot exceed 500 characters']
    },
    client: {
      type: String,
      trim: true,
      maxlength: [500, 'Client description cannot exceed 500 characters']
    }
  },
  
  // Shop association
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required']
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for code uniqueness
// NEW jewelry: shopId + type + metal + itemCategory + code
categorySchema.index({ 
  shopId: 1, 
  type: 1, 
  metal: 1, 
  itemCategory: 1, 
  code: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    isActive: true,
    type: 'NEW'
  }
});

// OLD jewelry: shopId + type + metal + code (no itemCategory)
categorySchema.index({ 
  shopId: 1, 
  type: 1, 
  metal: 1, 
  code: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    isActive: true,
    type: 'OLD'
  }
});

// Additional indexes for performance
categorySchema.index({ shopId: 1, type: 1, isActive: 1 });
categorySchema.index({ shopId: 1, metal: 1, isActive: 1 });
categorySchema.index({ createdBy: 1 });

// Pre-save middleware for validation and cleanup
categorySchema.pre('save', function(next) {
  try {
    // Convert strings to uppercase for consistency
    if (this.type) this.type = this.type.toUpperCase();
    if (this.metal) this.metal = this.metal.toUpperCase();
    
    // Trim and clean fields
    if (this.itemCategory) {
      this.itemCategory = this.itemCategory.trim();
    }
    if (this.code) {
      this.code = this.code.trim();
    }
    
    // Type-specific validations and cleanup
    if (this.type === 'NEW') {
      // Ensure itemCategory is provided for NEW jewelry
      if (!this.itemCategory) {
        throw new Error('Item category is required for NEW jewelry');
      }
      
      // Clear OLD jewelry specific fields
      this.truePurityPercentage = undefined;
      this.scrapBuyOwnPercentage = undefined;
      this.scrapBuyOtherPercentage = undefined;
      this.resaleEnabled = undefined;
      this.directResalePercentage = undefined;
      this.polishRepairResalePercentage = undefined;
      this.polishRepairCostPercentage = undefined;
      
    } else if (this.type === 'OLD') {
      // Clear NEW jewelry specific fields
      this.itemCategory = undefined;
      this.purityPercentage = undefined;
      this.sellingPercentage = undefined;
      
      // Handle resale fields - clear them if resale is disabled
      if (!this.resaleEnabled) {
        this.directResalePercentage = undefined;
        this.polishRepairResalePercentage = undefined;
        this.polishRepairCostPercentage = undefined;
        this.buyingFromWholesalerPercentage = undefined;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get appropriate description for user role
categorySchema.methods.getDescriptionForRole = function(userRole) {
  // First check for role-specific description
  const roleMap = {
    'admin': this.descriptions.admin,
    'manager': this.descriptions.manager,
    'pro_client': this.descriptions.proClient,
    'client': this.descriptions.client
  };
  
  const roleDescription = roleMap[userRole];
  if (roleDescription && roleDescription.trim()) {
    return roleDescription.trim();
  }
  
  // Fallback to universal description
  if (this.descriptions.universal && this.descriptions.universal.trim()) {
    return this.descriptions.universal.trim();
  }
  
  // No description available
  return '';
};

// Static method to find categories by shop and type
categorySchema.statics.findByShopAndType = function(shopId, type) {
  return this.find({
    shopId: shopId,
    type: type.toUpperCase(),
    isActive: true
  }).sort({ itemCategory: 1, code: 1 });
};

// Static method to find categories with filters
categorySchema.statics.findWithFilters = function(filters) {
  const query = { isActive: true, ...filters };
  
  // Convert type and metal to uppercase if provided
  if (query.type) query.type = query.type.toUpperCase();
  if (query.metal) query.metal = query.metal.toUpperCase();
  
  return this.find(query).sort({ 
    type: 1, 
    metal: 1, 
    itemCategory: 1, 
    code: 1 
  });
};

// Static method to check code uniqueness (updated for both NEW and OLD)
categorySchema.statics.isCodeUnique = async function(shopId, type, metal, itemCategory, code, excludeId = null) {
  const query = {
    shopId: shopId,
    type: type.toUpperCase(),
    metal: metal.toUpperCase(),
    code: code.trim(),
    isActive: true
  };
  
  // Add itemCategory only for NEW jewelry
  if (type.toUpperCase() === 'NEW') {
    query.itemCategory = itemCategory ? itemCategory.trim() : undefined;
  }
  
  // Exclude current document if updating
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingCategory = await this.findOne(query);
  return !existingCategory;
};

// Virtual for category display name
categorySchema.virtual('displayName').get(function() {
  if (this.type === 'NEW') {
    return `${this.type} ${this.metal} ${this.itemCategory} - ${this.code}`;
  } else if (this.type === 'OLD') {
    return `${this.type} ${this.metal} - ${this.code}`;
  }
  return `${this.type} ${this.metal} - ${this.code}`;
});

// Virtual to get the effective purity (for unified access)
categorySchema.virtual('effectivePurity').get(function() {
  return this.type === 'NEW' ? this.purityPercentage : this.truePurityPercentage;
});

// Transform output
categorySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Category', categorySchema);