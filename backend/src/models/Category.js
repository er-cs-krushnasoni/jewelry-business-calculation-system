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
  
  purityPercentage: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [1, 'Purity percentage must be at least 1%'],
    max: [100, 'Purity percentage cannot exceed 100%']
  },
  
  buyingFromWholesalerPercentage: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [1, 'Buying percentage must be at least 1%'],
    max: [200, 'Buying percentage cannot exceed 200%']
  },
  
  sellingPercentage: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [1, 'Selling percentage must be at least 1%'],
    max: [200, 'Selling percentage cannot exceed 200%']
  },
  
  // Code/Stamp - unique within shop+type+metal+itemCategory
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

// Compound index for code uniqueness within shop+type+metal+itemCategory
categorySchema.index({ 
  shopId: 1, 
  type: 1, 
  metal: 1, 
  itemCategory: 1, 
  code: 1 
}, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Additional indexes for performance
categorySchema.index({ shopId: 1, type: 1, isActive: 1 });
categorySchema.index({ shopId: 1, metal: 1, isActive: 1 });
categorySchema.index({ createdBy: 1 });

// Pre-save middleware for validation
categorySchema.pre('save', function(next) {
  try {
    // Ensure itemCategory is provided for NEW jewelry
    if (this.type === 'NEW' && !this.itemCategory) {
      throw new Error('Item category is required for NEW jewelry');
    }
    
    // Convert strings to uppercase for consistency
    if (this.type) this.type = this.type.toUpperCase();
    if (this.metal) this.metal = this.metal.toUpperCase();
    
    // Trim and clean itemCategory
    if (this.itemCategory) {
      this.itemCategory = this.itemCategory.trim();
    }
    
    // Clean code
    if (this.code) {
      this.code = this.code.trim();
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

// Static method to check code uniqueness
categorySchema.statics.isCodeUnique = async function(shopId, type, metal, itemCategory, code, excludeId = null) {
  const query = {
    shopId: shopId,
    type: type.toUpperCase(),
    metal: metal.toUpperCase(),
    code: code.trim(),
    isActive: true
  };
  
  // Add itemCategory for NEW jewelry
  if (type.toUpperCase() === 'NEW') {
    query.itemCategory = itemCategory.trim();
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
  }
  return `${this.type} ${this.metal} - ${this.code}`;
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