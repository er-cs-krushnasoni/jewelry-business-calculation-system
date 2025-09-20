const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Global variable to temporarily store plain password during save
let tempPlainPassword = null;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  // Encrypted password for shop admin viewing (only for specific shop roles)
  encryptedPassword: {
    type: String,
    required: false // Will be set directly in controller for relevant roles
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'pro_client', 'client'],
    required: [true, 'Role is required']
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    default: null // null for super_admin, required for shop users
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginHistory: [{
    loginTime: {
      type: Date,
      default: Date.now
    },
    deviceInfo: {
      type: String,
      default: 'Unknown'
    },
    ipAddress: {
      type: String,
      default: 'Unknown'
    }
  }]
}, {
  timestamps: true
});

// Index for case-insensitive unique username
userSchema.index({ username: 1 }, { 
  unique: true, 
  collation: { locale: 'en', strength: 2 } 
});

// Index for efficient shop-based queries
userSchema.index({ shopId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ shopId: 1, role: 1 });

// Pre-validate middleware for role constraints
userSchema.pre('validate', async function(next) {
  try {
    await this.constructor.validateRoleConstraints(this.role, this.shopId, this._id);
    next();
  } catch (error) {
    next(error);
  }
});

// Simplified pre-save middleware - only handles password hashing
userSchema.pre('save', async function(next) {
  console.log('Pre-save middleware triggered for user:', this.username, 'isModified(password):', this.isModified('password'));
  
  if (!this.isModified('password')) {
    console.log('Pre-save: Password not modified, skipping');
    return next();
  }

  try {
    // Get the plain password
    const plainPassword = tempPlainPassword || this.password;
    console.log('Pre-save: Plain password available:', !!plainPassword);
    
    if (!plainPassword) {
      console.error('Pre-save: No plain password available');
      return next(new Error('Plain password is required for hashing'));
    }

    // Hash password for authentication
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(plainPassword, salt);
    console.log('Pre-save: Password hashed successfully');

    // Clear the temporary plain password
    tempPlainPassword = null;
    console.log('Pre-save: Completed successfully');

    next();
  } catch (error) {
    // Clear the temporary plain password on error
    tempPlainPassword = null;
    console.error('Pre-save: Error occurred:', error);
    next(error);
  }
});

// Instance method to check password (uses hashed password)
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to get decrypted password (ONLY for manager, pro_client, client)
userSchema.methods.getDecryptedPassword = async function() {
  if (['super_admin', 'admin'].includes(this.role)) {
    throw new Error('Admin passwords cannot be decrypted for security reasons');
  }

  if (!this.encryptedPassword) {
    throw new Error('Encrypted password not available');
  }

  const Shop = mongoose.model('Shop');
  const shop = await Shop.findById(this.shopId).select('+masterEncryptionKey');
  
  if (!shop || !shop.masterEncryptionKey) {
    throw new Error('Shop encryption key not found');
  }

  const PasswordEncryption = require('../utils/encryption');
  return PasswordEncryption.decryptPassword(this.encryptedPassword, shop.masterEncryptionKey);
};

// Instance method to check if user belongs to a shop
userSchema.methods.belongsToShop = function(shopId) {
  if (this.role === 'super_admin') return false;
  return this.shopId && this.shopId.toString() === shopId.toString();
};

// Enhanced instance method to check if user can access shop data
userSchema.methods.canAccessShop = function(shopId) {
  // Super admins can access any shop
  if (this.role === 'super_admin') return true;
  
  // Other users can only access their own shop
  return this.belongsToShop(shopId);
};

// Instance method to check if user can access a specific shop (alias for consistency)
userSchema.methods.hasShopAccess = function(shopId) {
  // Convert both to string for comparison
  const userShopId = this.shopId ? this.shopId.toString() : null;
  const targetShopId = shopId ? shopId.toString() : null;
  
  return userShopId === targetShopId;
};

// Instance method to check if user can update rates
userSchema.methods.canUpdateRates = function() {
  return ['admin', 'manager'].includes(this.role);
};

// Instance method to check if user can view calculations with margins
userSchema.methods.canViewMargins = function() {
  return ['admin', 'manager', 'pro_client'].includes(this.role);
};

// Instance method to check if user can manage other users
userSchema.methods.canManageUsers = function() {
  return this.role === 'admin';
};

// Instance method to check if user can view user passwords (encrypted)
userSchema.methods.canViewUserPasswords = function() {
  return this.role === 'admin';
};

// Instance method to check if user can perform admin operations
userSchema.methods.isAdmin = function() {
  return ['super_admin', 'admin'].includes(this.role);
};

// Instance method to check if user is a super admin
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

// Instance method to check if user can perform operations on another user
userSchema.methods.canManageUser = function(targetUser) {
  // Super admin can manage anyone except other super admins
  if (this.role === 'super_admin') {
    return targetUser.role !== 'super_admin';
  }
  
  // Shop admin can manage users in their shop (except super admins)
  if (this.role === 'admin') {
    return targetUser.role !== 'super_admin' && 
           targetUser.role !== 'admin' &&
           this.belongsToShop(targetUser.shopId);
  }
  
  return false;
};

// Instance method to get user's role hierarchy level
userSchema.methods.getRoleLevel = function() {
  const roleLevels = {
    'super_admin': 5,
    'admin': 4,
    'manager': 3,
    'pro_client': 2,
    'client': 1
  };
  return roleLevels[this.role] || 0;
};

// Instance method to get user's display role
userSchema.methods.getDisplayRole = function() {
  const roleMap = {
    'super_admin': 'Super Admin',
    'admin': 'Shop Admin', 
    'manager': 'Manager',
    'pro_client': 'Pro Client',
    'client': 'Client'
  };
  return roleMap[this.role] || this.role;
};

// Instance method to get user permissions summary
userSchema.methods.getPermissions = function() {
  return {
    canUpdateRates: this.canUpdateRates(),
    canViewMargins: this.canViewMargins(),
    canManageUsers: this.canManageUsers(),
    canViewUserPasswords: this.canViewUserPasswords(),
    isAdmin: this.isAdmin(),
    isSuperAdmin: this.isSuperAdmin(),
    roleLevel: this.getRoleLevel(),
    displayRole: this.getDisplayRole()
  };
};

// Static method to find user with case-insensitive username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Enhanced static method to validate role constraints
userSchema.statics.validateRoleConstraints = async function(role, shopId, userId = null) {
  const SHOP_ROLES = ['admin', 'manager', 'pro_client', 'client'];
  const SINGLE_ROLE_PER_SHOP = ['admin', 'manager', 'pro_client', 'client'];
  
  // Validate super_admin constraints
  if (role === 'super_admin') {
    if (shopId) {
      const error = new Error('Super Admin cannot belong to a shop');
      error.code = 'ROLE_CONSTRAINT_VIOLATION';
      error.details = {
        role,
        constraint: 'super_admin_no_shop',
        message: 'Super Admin users must not have a shopId'
      };
      throw error;
    }
    return true;
  }

  // Validate shop user constraints
  if (SHOP_ROLES.includes(role)) {
    if (!shopId) {
      const error = new Error(`${role} must belong to a shop`);
      error.code = 'ROLE_CONSTRAINT_VIOLATION';
      error.details = {
        role,
        constraint: 'shop_user_requires_shop',
        message: `${role} users must have a shopId`
      };
      throw error;
    }

    // Verify shop exists and is active
    const Shop = mongoose.model('Shop');
    const shopExists = await Shop.findById(shopId);
    if (!shopExists) {
      const error = new Error('Invalid shop reference');
      error.code = 'SHOP_NOT_FOUND';
      throw error;
    }

    if (!shopExists.isActive) {
      const error = new Error('Cannot assign users to inactive shop');
      error.code = 'SHOP_INACTIVE';
      throw error;
    }
  }

  // Check single role per shop constraint
  if (SINGLE_ROLE_PER_SHOP.includes(role)) {
    const query = { shopId, role, isActive: true };
    
    if (userId) {
      query._id = { $ne: userId };
    }

    const existingUser = await this.findOne(query);
    if (existingUser) {
      const error = new Error(`Only one ${role} is allowed per shop`);
      error.code = 'ROLE_CONSTRAINT_VIOLATION';
      error.details = {
        role,
        shopId,
        constraint: 'single_role_per_shop',
        existingUser: existingUser.username,
        message: `Shop already has a ${role}: ${existingUser.username}`
      };
      throw error;
    }
  }

  return true;
};

// Static method to get role constraints info
userSchema.statics.getRoleConstraints = function() {
  return {
    super_admin: {
      shopId: false,
      multipleAllowed: true,
      description: 'Platform administrator with global access',
      permissions: ['all']
    },
    admin: {
      shopId: true,
      multipleAllowed: false,
      description: 'Shop administrator with full shop control',
      permissions: ['manage_users', 'update_rates', 'view_margins', 'view_user_passwords']
    },
    manager: {
      shopId: true,
      multipleAllowed: false,
      description: 'Shop manager with rate and calculation access',
      permissions: ['update_rates', 'view_margins']
    },
    pro_client: {
      shopId: true,
      multipleAllowed: false,
      description: 'Professional client with margin visibility',
      permissions: ['view_margins']
    },
    client: {
      shopId: true,
      multipleAllowed: false,
      description: 'Basic client with calculation access only',
      permissions: ['basic_calculations']
    }
  };
};

// Static method to set temporary plain password (used before save)
userSchema.statics.setTempPlainPassword = function(password) {
  tempPlainPassword = password;
  console.log('Static: Temporary plain password set for hashing');
};

// Static method to get users by shop with role filtering
userSchema.statics.findByShopAndRole = function(shopId, roles = null) {
  const query = { shopId, isActive: true };
  if (roles) {
    query.role = Array.isArray(roles) ? { $in: roles } : roles;
  }
  return this.find(query).select('-password -encryptedPassword');
};

// Virtual for safe user info (excluding passwords)
userSchema.virtual('safeUserInfo').get(function() {
  return {
    _id: this._id,
    username: this.username,
    role: this.role,
    displayRole: this.getDisplayRole(),
    shopId: this.shopId,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    permissions: this.getPermissions()
  };
});

// Ensure virtual fields are serialised
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.encryptedPassword; // Never expose encrypted password in normal responses
    delete ret.loginHistory;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);