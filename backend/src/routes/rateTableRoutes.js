const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

let rateTableController;
try {
  rateTableController = require('../controllers/rateTableController');
  console.log('Rate table controller imported successfully');
} catch (error) {
  console.error('Error importing rate table controller:', error);
  // Fallback
  rateTableController = {
    getRateTable: (req, res) => res.status(500).json({ success: false, message: 'Controller not available' }),
    updateRateTable: (req, res) => res.status(500).json({ success: false, message: 'Controller not available' }),
    getAllRateTables: (req, res) => res.status(500).json({ success: false, message: 'Controller not available' })
  };
}

const {
  getRateTable,
  updateRateTable,
  getAllRateTables
} = rateTableController;

// Get all tables (gold + silver)
router.get('/all', authenticate, getAllRateTables);

// Get specific metal table
router.get('/:metalType', authenticate, getRateTable);

// Update specific metal table (admin only)
router.put('/:metalType', authenticate, updateRateTable);

console.log('Rate table routes loaded successfully');

module.exports = router;