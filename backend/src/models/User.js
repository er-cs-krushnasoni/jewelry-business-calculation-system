const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  mustChangePassword: {
    type: Boolean,
    default: false // true when Super Admin creates/resets password
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

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to check if user belongs to a shop
userSchema.methods.belongsToShop = function(shopId) {
  if (this.role === 'super_admin') return false;
  return this.shopId && this.shopId.toString() === shopId.toString();
};

// Static method to find user with case-insensitive username
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

// Static method to validate role constraints
userSchema.statics.validateRoleConstraints = async function(role, shopId) {
  if (role === 'super_admin') {
    if (shopId) {
      throw new Error('Super Admin cannot belong to a shop');
    }
    return true;
  }

  if (!shopId) {
    throw new Error('Shop users must belong to a shop');
  }

  // Check if role already exists in the shop (except for multiple super_admins)
  if (['admin', 'manager', 'pro_client', 'client'].includes(role)) {
    const existingUser = await this.findOne({ shopId, role });
    if (existingUser) {
      throw new Error(`Only one ${role} is allowed per shop`);
    }
  }

  return true;
};

// Virtual for full user info (excluding password)
userSchema.virtual('safeUserInfo').get(function() {
  return {
    _id: this._id,
    username: this.username,
    role: this.role,
    shopId: this.shopId,
    isActive: this.isActive,
    mustChangePassword: this.mustChangePassword,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Ensure virtual fields are serialised
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.loginHistory;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);