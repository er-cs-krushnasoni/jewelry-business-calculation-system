const Rate = require('../models/Rate');

// Check if current time is after 1:00 PM IST
const isAfter1PMIST = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  
  // Check if current time is 13:00 (1:00 PM) or later
  return currentHour >= 13;
};

// Get current date in IST timezone
const getCurrentDateIST = () => {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format
};

// Check if rates need to be updated (blocking logic)
const checkRateBlocking = async (shopId) => {
  try {
    // Get current rates for the shop
    const rates = await Rate.getCurrentRatesForShop(shopId);
    
    // If no rates exist, always block
    if (!rates) {
      return {
        shouldBlock: true,
        reason: 'NO_RATES',
        message: 'No rates found for this shop. Please set initial rates.'
      };
    }
    
    // Check if rates were updated today in IST
    const isUpdatedToday = rates.isUpdatedToday('Asia/Kolkata');
    const isAfter1PM = isAfter1PMIST();
    
    // Block if it's after 1:00 PM IST and rates weren't updated today
    if (isAfter1PM && !isUpdatedToday) {
      return {
        shouldBlock: true,
        reason: 'DAILY_UPDATE_REQUIRED',
        message: 'Rates must be updated daily before 1:00 PM IST. Please update today\'s rates to continue.',
        lastUpdated: rates.updatedAt,
        updateInfo: rates.getUpdateInfo('Asia/Kolkata')
      };
    }
    
    // No blocking needed
    return {
      shouldBlock: false,
      isUpdatedToday,
      updateInfo: rates.getUpdateInfo('Asia/Kolkata')
    };
    
  } catch (error) {
    console.error('Error checking rate blocking:', error);
    // On error, don't block to avoid service disruption
    return {
      shouldBlock: false,
      error: error.message
    };
  }
};

// Middleware to check rate blocking for calculator routes
const rateBlockingMiddleware = async (req, res, next) => {
  try {
    // Skip blocking for super_admin (they don't have shopId)
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Get shopId from user or params
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any shop'
      });
    }
    
    // Check if rates are blocked
    const blockingResult = await checkRateBlocking(shopId);
    
    if (blockingResult.shouldBlock) {
      const canUpdate = ['admin', 'manager'].includes(req.user.role);
      
      return res.status(423).json({ // 423 Locked status
        success: false,
        blocked: true,
        reason: blockingResult.reason,
        message: blockingResult.message,
        canUpdateRates: canUpdate,
        blockingInfo: {
          currentTimeIST: new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          lastUpdated: blockingResult.lastUpdated,
          updateInfo: blockingResult.updateInfo,
          dailyDeadline: '1:00 PM IST'
        }
      });
    }
    
    // Add rate info to request for easy access
    req.rateInfo = blockingResult;
    next();
    
  } catch (error) {
    console.error('Error in rate blocking middleware:', error);
    // Don't block on middleware error, just log and continue
    next();
  }
};

// Express route handler to check blocking status (for frontend polling)
const checkBlockingStatus = async (req, res) => {
  try {
    // Skip for super_admin
    if (req.user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Super admin does not have shop-specific rate blocking'
      });
    }
    
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any shop'
      });
    }
    
    const blockingResult = await checkRateBlocking(shopId);
    const canUpdate = ['admin', 'manager'].includes(req.user.role);
    
    res.status(200).json({
      success: true,
      data: {
        isBlocked: blockingResult.shouldBlock,
        reason: blockingResult.reason,
        message: blockingResult.message || 'System is operational',
        canUpdateRates: canUpdate,
        currentTimeIST: new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        rateInfo: blockingResult.updateInfo,
        systemStatus: {
          dailyDeadline: '1:00 PM IST',
          isAfter1PM: isAfter1PMIST(),
          currentDateIST: getCurrentDateIST()
        }
      }
    });
    
  } catch (error) {
    console.error('Error checking blocking status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check blocking status'
    });
  }
};

module.exports = {
  rateBlockingMiddleware,
  checkBlockingStatus,
  checkRateBlocking,
  isAfter1PMIST,
  getCurrentDateIST
};