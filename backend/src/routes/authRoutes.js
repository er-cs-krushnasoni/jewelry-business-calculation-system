const express = require('express');
const router = express.Router();

// Placeholder route to prevent server crash
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes working'
  });
});

module.exports = router;