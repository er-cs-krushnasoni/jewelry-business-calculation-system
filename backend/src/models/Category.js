const mongoose = require('mongoose');

// Sub-schema for resale categories (for OLD jewelry with resale enabled)
const resaleCategorySchema = new mongoose.Schema({
  itemCategory: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Item category cannot exceed 100 characters']
  },
  directResalePercentage: {
    type: Number,
    required: true,
    min: [1, 'Direct resale percentage must be at least 1%']
  },
  // NEW FIELD: Rate type for direct resale
  directResaleRateType: {
    type: String,
    enum: ['SELLING', 'BUYING'],
    default: 'SELLING',
    uppercase: true,
    required: true
  },
  buyingFromWholesalerPercentage: {
    type: Number,
    required: true,
    min: [1, 'Buying from wholesaler percentage must be at least 1%']
  },
  wholesalerLabourPerGram: {
    type: Number,
    required: true,
    min: [0, 'Wholesaler labour per gram cannot be negative'],
    default: 0
  },
  polishRepairEnabled: {
    type: Boolean,
    default: false
  },
  polishRepairResalePercentage: {
    type: Number,
    required: function() {
      return this.polishRepairEnabled === true;
    },
    min: [1, 'Polish/Repair resale percentage must be at least 1%']
  },
  // NEW FIELD: Rate type for polish/repair resale
  polishRepairRateType: {
    type: String,
    enum: ['SELLING', 'BUYING'],
    default: 'SELLING',
    uppercase: true,
    required: function() {
      return this.polishRepairEnabled === true;
    }
  },
  polishRepairCostPercentage: {
    type: Number,
    required: function() {
      return this.polishRepairEnabled === true;
    },
    min: [0, 'Polish/Repair cost percentage must be at least 0%'],
    max: [50, 'Polish/Repair cost percentage cannot exceed 50%']
  },
  polishRepairLabourPerGram: {
    type: Number,
    required: function() {
      return this.polishRepairEnabled === true;
    },
    min: [0, 'Polish repair labour per gram cannot be negative'],
    default: 0
  }
}, { _id: true });

const categorySchema = new mongoose.Schema({
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
  
  // Item category - Required for NEW jewelry ONLY
  itemCategory: {
    type: String,
    required: function() {
      return this.type === 'NEW';
    },
    trim: true,
    maxlength: [100, 'Item category cannot exceed 100 characters'] // INCREASED from 50
  },
  
  // NEW: Store lowercase version for case-insensitive uniqueness
  itemCategoryLower: {
    type: String,
    lowercase: true,
    trim: true
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
    min: [1, 'Buying percentage must be at least 1%']
  },
  
  wholesalerLabourPerGram: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [0, 'Wholesaler labour per gram cannot be negative'],
    default: 0
  },
  
  sellingPercentage: {
    type: Number,
    required: function() { return this.type === 'NEW'; },
    min: [1, 'Selling percentage must be at least 1%']
  },
  
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
  
  resaleEnabled: {
    type: Boolean,
    default: false,
    required: function() { return this.type === 'OLD'; }
  },
  
  resaleCategories: {
    type: [resaleCategorySchema],
    default: [],
    validate: {
      validator: function(categories) {
        if (this.type === 'OLD' && this.resaleEnabled) {
          return categories && categories.length > 0;
        }
        if (this.type === 'OLD' && !this.resaleEnabled) {
          return !categories || categories.length === 0;
        }
        return true;
      },
      message: 'At least one resale category is required when resale is enabled'
    }
  },
  
  // Code/Stamp - unique within shop+type+metal+(itemCategory for NEW only)
  code: {
    type: String,
    required: [true, 'Code/Stamp is required'],
    trim: true,
    maxlength: [100, 'Code cannot exceed 100 characters'] // INCREASED from 20
  },
  
  // NEW: Store lowercase version for case-insensitive uniqueness
  codeLower: {
    type: String,
    lowercase: true,
    trim: true
    // NOT required - will be auto-generated in pre-save
  },
  
  descriptions: {
    universal: {
      type: String,
      trim: true,
      maxlength: [500, 'Universal description cannot exceed 500 characters'],
      default: ''
    },
    admin: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin description cannot exceed 500 characters'],
      default: ''
    },
    manager: {
      type: String,
      trim: true,
      maxlength: [500, 'Manager description cannot exceed 500 characters'],
      default: ''
    },
    proClient: {
      type: String,
      trim: true,
      maxlength: [500, 'Pro Client description cannot exceed 500 characters'],
      default: ''
    },
    client: {
      type: String,
      trim: true,
      maxlength: [500, 'Client description cannot exceed 500 characters'],
      default: ''
    }
  },
  
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop ID is required']
  },
  
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

// UPDATED: Compound indexes for case-insensitive code uniqueness
categorySchema.index({ 
  shopId: 1, 
  type: 1, 
  metal: 1, 
  itemCategoryLower: 1, 
  codeLower: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    isActive: true,
    type: 'NEW'
  }
});

categorySchema.index({ 
  shopId: 1, 
  type: 1, 
  metal: 1, 
  codeLower: 1 
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
      this.itemCategoryLower = this.itemCategory.toLowerCase(); // Store lowercase version
    }
    if (this.code) {
      this.code = this.code.trim();
      this.codeLower = this.code.toLowerCase(); // Store lowercase version
    }
    
    // Clean up descriptions
    if (this.descriptions) {
      Object.keys(this.descriptions).forEach(role => {
        if (this.descriptions[role]) {
          this.descriptions[role] = this.descriptions[role].trim();
        }
      });
    }
    
    // Type-specific validations and cleanup
    if (this.type === 'NEW') {
      if (!this.itemCategory) {
        throw new Error('Item category is required for NEW jewelry');
      }
      
      if (this.wholesalerLabourPerGram === undefined || this.wholesalerLabourPerGram === null) {
        throw new Error('Wholesaler labour per gram is required for NEW jewelry');
      }
      
      // Clear OLD jewelry specific fields
      this.truePurityPercentage = undefined;
      this.scrapBuyOwnPercentage = undefined;
      this.scrapBuyOtherPercentage = undefined;
      this.resaleEnabled = undefined;
      this.resaleCategories = [];
      
    } else if (this.type === 'OLD') {
      // Clear NEW jewelry specific fields
      this.itemCategory = undefined;
      this.itemCategoryLower = undefined;
      this.purityPercentage = undefined;
      this.sellingPercentage = undefined;
      this.buyingFromWholesalerPercentage = undefined;
      this.wholesalerLabourPerGram = undefined;
      
      // Handle resale categories
      if (!this.resaleEnabled) {
        this.resaleCategories = [];
      } else {
        if (!this.resaleCategories || this.resaleCategories.length === 0) {
          throw new Error('At least one resale category is required when resale is enabled');
        }
        
        // Trim category names and validate uniqueness (case-insensitive)
        const categoryNames = new Set();
        this.resaleCategories.forEach(cat => {
          if (cat.itemCategory) {
            cat.itemCategory = cat.itemCategory.trim();
            const lowerName = cat.itemCategory.toLowerCase();
            if (categoryNames.has(lowerName)) {
              throw new Error(`Duplicate category name: ${cat.itemCategory}`);
            }
            categoryNames.add(lowerName);
          }
          
          // Ensure rate types have default values
          if (!cat.directResaleRateType) {
            cat.directResaleRateType = 'SELLING';
          }
          cat.directResaleRateType = cat.directResaleRateType.toUpperCase();
          
          if (cat.wholesalerLabourPerGram === undefined || cat.wholesalerLabourPerGram === null) {
            cat.wholesalerLabourPerGram = 0;
          }
          
          if (!cat.polishRepairEnabled) {
            cat.polishRepairResalePercentage = undefined;
            cat.polishRepairCostPercentage = undefined;
            cat.polishRepairLabourPerGram = undefined;
            cat.polishRepairRateType = undefined;
          } else {
            if (cat.polishRepairLabourPerGram === undefined || cat.polishRepairLabourPerGram === null) {
              cat.polishRepairLabourPerGram = 0;
            }
            // Ensure polish/repair rate type has default value
            if (!cat.polishRepairRateType) {
              cat.polishRepairRateType = 'SELLING';
            }
            cat.polishRepairRateType = cat.polishRepairRateType.toUpperCase();
          }
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get appropriate description for user role
categorySchema.methods.getDescriptionForRole = function(userRole) {
  if (this.descriptions.universal && this.descriptions.universal.trim()) {
    return this.descriptions.universal.trim();
  }
  
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
  
  return '';
};

categorySchema.methods.getAllDescriptions = function() {
  return {
    universal: this.descriptions.universal || '',
    admin: this.descriptions.admin || '',
    manager: this.descriptions.manager || '',
    proClient: this.descriptions.proClient || '',
    client: this.descriptions.client || ''
  };
};

categorySchema.methods.setDescriptions = function(descriptionsObj) {
  if (!descriptionsObj) return;
  
  Object.keys(descriptionsObj).forEach(role => {
    if (this.descriptions.hasOwnProperty(role)) {
      this.descriptions[role] = descriptionsObj[role] || '';
    }
  });
};

categorySchema.statics.findByShopAndType = function(shopId, type) {
  return this.find({
    shopId: shopId,
    type: type.toUpperCase(),
    isActive: true
  }).sort({ itemCategory: 1, code: 1 });
};

categorySchema.statics.findWithFilters = function(filters) {
  const query = { isActive: true, ...filters };
  
  if (query.type) query.type = query.type.toUpperCase();
  if (query.metal) query.metal = query.metal.toUpperCase();
  
  return this.find(query).sort({ 
    type: 1, 
    metal: 1, 
    itemCategory: 1, 
    code: 1 
  });
};

// UPDATED: Check code uniqueness (case-insensitive)
categorySchema.statics.isCodeUnique = async function(shopId, type, metal, itemCategory, code, excludeId = null) {
  const query = {
    shopId: shopId,
    type: type.toUpperCase(),
    metal: metal.toUpperCase(),
    codeLower: code.trim().toLowerCase(), // Use lowercase for comparison
    isActive: true
  };
  
  // Add itemCategory only for NEW jewelry (case-insensitive)
  if (type.toUpperCase() === 'NEW') {
    query.itemCategoryLower = itemCategory ? itemCategory.trim().toLowerCase() : undefined;
  }
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingCategory = await this.findOne(query);
  return !existingCategory;
};

categorySchema.virtual('displayName').get(function() {
  if (this.type === 'NEW') {
    return `${this.type} ${this.metal} ${this.itemCategory} - ${this.code}`;
  } else if (this.type === 'OLD') {
    return `${this.type} ${this.metal} - ${this.code}`;
  }
  return `${this.type} ${this.metal} - ${this.code}`;
});

categorySchema.virtual('effectivePurity').get(function() {
  return this.type === 'NEW' ? this.purityPercentage : this.truePurityPercentage;
});

categorySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.codeLower; // Don't expose internal fields
    delete ret.itemCategoryLower;
    return ret;
  }
});

module.exports = mongoose.model('Category', categorySchema);