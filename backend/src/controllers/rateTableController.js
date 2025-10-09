const RateTable = require('../models/RateTable');
const Rate = require('../models/Rate');

// @desc    Get rate table for a shop and metal type
// @route   GET /api/rate-tables/:metalType
// @access  Private (All shop users)
const getRateTable = async (req, res) => {
  try {
    const { metalType } = req.params;
    const shopId = req.user.shopId;

    if (!['gold', 'silver'].includes(metalType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metal type. Must be gold or silver'
      });
    }

    // Get or create table
    const table = await RateTable.getOrCreateTable(
      shopId,
      metalType,
      req.user._id,
      req.user.username
    );

    // Get current rates
    const currentRates = await Rate.getCurrentRatesForShop(shopId);

    let calculatedValues = [];
    if (currentRates && table.rows.length > 0 && table.columns.length > 0) {
      calculatedValues = table.calculateAllValues(currentRates);
    }

    res.status(200).json({
      success: true,
      data: {
        table: {
          id: table._id,
          metalType: table.metalType,
          valuePerGram: table.valuePerGram,
          rows: table.rows,
          columns: table.columns,
          cells: table.cells,
          updatedAt: table.updatedAt,
          updatedBy: table.updatedByUsername
        },
        calculatedValues,
        currentRates: currentRates ? {
          goldBuy: currentRates.goldBuy,
          goldSell: currentRates.goldSell,
          silverBuy: currentRates.silverBuy,
          silverSell: currentRates.silverSell
        } : null
      }
    });

  } catch (error) {
    console.error('Error in getRateTable:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rate table'
    });
  }
};

// @desc    Update rate table structure
// @route   PUT /api/rate-tables/:metalType
// @access  Private (Admin only)
const updateRateTable = async (req, res) => {
  try {
    const { metalType } = req.params;
    const shopId = req.user.shopId;

    if (!['gold', 'silver'].includes(metalType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metal type'
      });
    }

    // Only admin can update
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update rate tables'
      });
    }

    const { valuePerGram, rows, columns, cells } = req.body;

    // Validate input
    if (!Array.isArray(rows) || !Array.isArray(columns) || !Array.isArray(cells)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table structure'
      });
    }

    // Update table
    const table = await RateTable.updateTableStructure(
      shopId,
      metalType,
      { valuePerGram, rows, columns, cells },
      req.user._id,
      req.user.username
    );

    // Get current rates for calculation
    const currentRates = await Rate.getCurrentRatesForShop(shopId);
    
    let calculatedValues = [];
    if (currentRates && table.rows.length > 0 && table.columns.length > 0) {
      calculatedValues = table.calculateAllValues(currentRates);
    }

    // Broadcast update via socket
    if (global.broadcastRateTableUpdate) {
      global.broadcastRateTableUpdate(shopId, metalType, {
        table: {
          id: table._id,
          metalType: table.metalType,
          valuePerGram: table.valuePerGram,
          rows: table.rows,
          columns: table.columns,
          cells: table.cells,
          updatedAt: table.updatedAt,
          updatedBy: table.updatedByUsername
        },
        calculatedValues
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rate table updated successfully',
      data: {
        table: {
          id: table._id,
          metalType: table.metalType,
          valuePerGram: table.valuePerGram,
          rows: table.rows,
          columns: table.columns,
          cells: table.cells,
          updatedAt: table.updatedAt,
          updatedBy: table.updatedByUsername
        },
        calculatedValues
      }
    });

  } catch (error) {
    console.error('Error in updateRateTable:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update rate table'
    });
  }
};

// @desc    Get both gold and silver tables
// @route   GET /api/rate-tables/all
// @access  Private (All shop users)
const getAllRateTables = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    // Get both tables
    const goldTable = await RateTable.getOrCreateTable(
      shopId,
      'gold',
      req.user._id,
      req.user.username
    );

    const silverTable = await RateTable.getOrCreateTable(
      shopId,
      'silver',
      req.user._id,
      req.user.username
    );

    // Get current rates
    const currentRates = await Rate.getCurrentRatesForShop(shopId);

    // Calculate values for both tables
    let goldValues = [];
    let silverValues = [];

    if (currentRates) {
      if (goldTable.rows.length > 0 && goldTable.columns.length > 0) {
        goldValues = goldTable.calculateAllValues(currentRates);
      }
      if (silverTable.rows.length > 0 && silverTable.columns.length > 0) {
        silverValues = silverTable.calculateAllValues(currentRates);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        gold: {
          table: {
            id: goldTable._id,
            metalType: goldTable.metalType,
            valuePerGram: goldTable.valuePerGram,
            rows: goldTable.rows,
            columns: goldTable.columns,
            cells: goldTable.cells,
            updatedAt: goldTable.updatedAt,
            updatedBy: goldTable.updatedByUsername
          },
          calculatedValues: goldValues
        },
        silver: {
          table: {
            id: silverTable._id,
            metalType: silverTable.metalType,
            valuePerGram: silverTable.valuePerGram,
            rows: silverTable.rows,
            columns: silverTable.columns,
            cells: silverTable.cells,
            updatedAt: silverTable.updatedAt,
            updatedBy: silverTable.updatedByUsername
          },
          calculatedValues: silverValues
        },
        currentRates: currentRates ? {
          goldBuy: currentRates.goldBuy,
          goldSell: currentRates.goldSell,
          silverBuy: currentRates.silverBuy,
          silverSell: currentRates.silverSell
        } : null
      }
    });

  } catch (error) {
    console.error('Error in getAllRateTables:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rate tables'
    });
  }
};

module.exports = {
  getRateTable,
  updateRateTable,
  getAllRateTables
};