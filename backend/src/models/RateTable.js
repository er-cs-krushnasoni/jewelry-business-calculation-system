const mongoose = require('mongoose');

// Schema for individual cell configuration
const cellConfigSchema = new mongoose.Schema({
  rowIndex: {
    type: Number,
    required: true
  },
  colIndex: {
    type: Number,
    required: true
  },
  useRate: {
    type: String,
    enum: ['buying', 'selling'],
    required: true,
    default: 'buying'
  },
  percentage: {
    type: Number,
    required: true,
    default: 100,
    min: 0.001
  }
}, { _id: false });

// Schema for column configuration (rounding rules)
const columnConfigSchema = new mongoose.Schema({
  colIndex: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Column'
  },
  roundingEnabled: {
    type: Boolean,
    default: false
  },
  roundDirection: {
    type: String,
    enum: ['high', 'low'],
    default: 'low'
  },
  roundingType: {
    type: String,
    enum: ['decimals', 'nearest_5_0', 'last_digit_0'],
    default: 'decimals'
  }
}, { _id: false });

// Schema for row configuration
const rowConfigSchema = new mongoose.Schema({
  rowIndex: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Row'
  }
}, { _id: false });

// Main Rate Table Schema
const rateTableSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  metalType: {
    type: String,
    enum: ['gold', 'silver'],
    required: true
  },
  valuePerGram: {
    type: Number,
    required: true,
    default: 1,
    min: 0.001
  },
  rows: {
    type: [rowConfigSchema],
    default: []
  },
  columns: {
    type: [columnConfigSchema],
    default: []
  },
  cells: {
    type: [cellConfigSchema],
    default: []
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedByUsername: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for shop and metal type (one table per metal per shop)
rateTableSchema.index({ shopId: 1, metalType: 1 }, { unique: true });

// Instance method to calculate cell value
rateTableSchema.methods.calculateCellValue = function(rowIndex, colIndex, currentRates) {
  try {
    // Find cell config
    const cellConfig = this.cells.find(
      c => c.rowIndex === rowIndex && c.colIndex === colIndex
    );
    
    if (!cellConfig) {
      return null;
    }

    // Find column config for rounding
    const colConfig = this.columns.find(c => c.colIndex === colIndex);
    
    // Get base rate based on metal type and use rate (buying/selling)
    let baseRate;
    let baseDivisor;
    
    if (this.metalType === 'gold') {
      baseRate = cellConfig.useRate === 'buying' 
        ? currentRates.goldBuy 
        : currentRates.goldSell;
      baseDivisor = 10; // Gold rates are per 10 grams
    } else {
      baseRate = cellConfig.useRate === 'buying'
        ? currentRates.silverBuy
        : currentRates.silverSell;
      baseDivisor = 1000; // Silver rates are per 1000 grams (1 kg)
    }

    if (!baseRate) {
      return null;
    }

    // Formula: ((Rate ÷ baseDivisor) × valuePerGram × percentage ÷ 100)
    let value = (baseRate / baseDivisor) * this.valuePerGram * (cellConfig.percentage / 100);

    // Apply rounding if enabled
    if (colConfig && colConfig.roundingEnabled) {
      value = this.applyRounding(value, colConfig);
    }

    return Math.round(value * 100) / 100; // Round to 2 decimals
    
  } catch (error) {
    console.error('Error calculating cell value:', error);
    return null;
  }
};

// Helper method to apply rounding
rateTableSchema.methods.applyRounding = function(value, colConfig) {
  const { roundDirection, roundingType } = colConfig;
  
  const intValue = Math.floor(value);
  const lastDigit = intValue % 10;
  
  // Skip rounding for non-decimal types if last digit is already 0
  if (roundingType !== 'decimals' && lastDigit === 0) {
    return intValue;
  }

  switch (roundingType) {
    case 'decimals':
      return roundDirection === 'high' ? Math.ceil(value) : Math.floor(value);
      
    case 'nearest_5_0': {
      const lastDigit5 = intValue % 10;
      
      if (lastDigit5 === 0 || lastDigit5 === 5) {
        return intValue;
      }
      
      if (roundDirection === 'high') {
        if (lastDigit5 < 5) {
          return intValue - lastDigit5 + 5;
        } else {
          return intValue - lastDigit5 + 10;
        }
      } else {
        if (lastDigit5 <= 5) {
          return intValue - lastDigit5;
        } else {
          return intValue - lastDigit5 + 5;
        }
      }
    }
      
    case 'last_digit_0': {
      const lastDig = intValue % 10;
      
      if (lastDig === 0) {
        return intValue;
      }
      
      if (roundDirection === 'high') {
        return intValue - lastDig + 10;
      } else {
        return intValue - lastDig;
      }
    }
      
    default:
      return value;
  }
};

// Instance method to calculate all cell values
rateTableSchema.methods.calculateAllValues = function(currentRates) {
  const values = [];
  
  for (const row of this.rows) {
    const rowValues = [];
    for (const col of this.columns) {
      const value = this.calculateCellValue(row.rowIndex, col.colIndex, currentRates);
      rowValues.push(value);
    }
    values.push(rowValues);
  }
  
  return values;
};

// Static method to get or create table for shop
rateTableSchema.statics.getOrCreateTable = async function(shopId, metalType, userId, username) {
  let table = await this.findOne({ shopId, metalType });
  
  if (!table) {
    table = await this.create({
      shopId,
      metalType,
      valuePerGram: 1,
      rows: [],
      columns: [],
      cells: [],
      updatedBy: userId,
      updatedByUsername: username
    });
  }
  
  return table;
};

// Static method to update table structure
rateTableSchema.statics.updateTableStructure = async function(
  shopId, 
  metalType, 
  tableData, 
  userId, 
  username
) {
  const { valuePerGram, rows, columns, cells } = tableData;
  
  const table = await this.findOneAndUpdate(
    { shopId, metalType },
    {
      valuePerGram,
      rows,
      columns,
      cells,
      updatedBy: userId,
      updatedByUsername: username
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );
  
  return table;
};

module.exports = mongoose.model('RateTable', rateTableSchema);