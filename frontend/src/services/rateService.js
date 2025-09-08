import api from './api';

// Rate service for handling all rate-related API calls
const rateService = {
  // Get current user's shop rates
  getMyRates: async () => {
    const response = await api.get('/rates/my-rates');
    return response.data;
  },

  // Update current user's shop rates
  updateMyRates: async (rateData) => {
    const response = await api.put('/rates/my-rates', rateData);
    return response.data;
  },

  // Get rates for a specific shop
  getShopRates: async (shopId) => {
    const response = await api.get(`/rates/shop/${shopId}`);
    return response.data;
  },

  // Update rates for a specific shop
  updateShopRates: async (shopId, rateData) => {
    const response = await api.put(`/rates/shop/${shopId}`, rateData);
    return response.data;
  },

  // Check if current user's shop needs rate setup
  checkMyShopSetup: async () => {
    const response = await api.get('/rates/my-setup');
    return response.data;
  },

  // Check if a specific shop needs rate setup
  checkShopSetup: async (shopId) => {
    const response = await api.get(`/rates/check-setup/${shopId}`);
    return response.data;
  },

  // Check daily rate update status for current user's shop
  checkMyDailyUpdate: async () => {
    const response = await api.get('/rates/my-daily-check');
    return response.data;
  },

  // Check daily rate update status for a specific shop
  checkShopDailyUpdate: async (shopId) => {
    const response = await api.get(`/rates/check-daily/${shopId}`);
    return response.data;
  },

  // Get rate update info for display
  getRateUpdateInfo: async (shopId) => {
    const response = await api.get(`/rates/update-info/${shopId}`);
    return response.data;
  },

  // Get rate validation rules
  getValidationRules: async () => {
    const response = await api.get('/rates/validation-rules');
    return response.data;
  },

  // Get rate format information
  getRateFormatInfo: async () => {
    const response = await api.get('/rates/rate-format-info');
    return response.data;
  },

  // Validate rate data before submission
  validateRates: (rates) => {
    const errors = [];
    
    // Check if all fields are provided
    const requiredFields = ['goldBuy', 'goldSell', 'silverBuy', 'silverSell'];
    for (const field of requiredFields) {
      if (!rates[field]) {
        errors.push(`${field} is required`);
      }
    }
    
    // Convert to numbers and validate
    const goldBuy = parseInt(rates.goldBuy);
    const goldSell = parseInt(rates.goldSell);
    const silverBuy = parseInt(rates.silverBuy);
    const silverSell = parseInt(rates.silverSell);
    
    // Check if values are positive integers
    if (isNaN(goldBuy) || goldBuy < 1) {
      errors.push('Gold buying rate must be a positive integer');
    }
    if (isNaN(goldSell) || goldSell < 1) {
      errors.push('Gold selling rate must be a positive integer');
    }
    if (isNaN(silverBuy) || silverBuy < 1) {
      errors.push('Silver buying rate must be a positive integer');
    }
    if (isNaN(silverSell) || silverSell < 1) {
      errors.push('Silver selling rate must be a positive integer');
    }
    
    // Check selling > buying
    if (!isNaN(goldSell) && !isNaN(goldBuy) && goldSell <= goldBuy) {
      errors.push('Gold selling rate must be higher than buying rate');
    }
    if (!isNaN(silverSell) && !isNaN(silverBuy) && silverSell <= silverBuy) {
      errors.push('Silver selling rate must be higher than buying rate');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Calculate per gram rates
  calculatePerGramRates: (rates) => {
    return {
      goldBuyPerGram: Math.floor(rates.goldBuy / 10),
      goldSellPerGram: Math.ceil(rates.goldSell / 10),
      silverBuyPerGram: Math.floor(rates.silverBuy / 1000),
      silverSellPerGram: Math.ceil(rates.silverSell / 1000)
    };
  },

  // Format rate for display
  formatRate: (rate, unit = '') => {
    if (!rate) return '₹0';
    return `₹${rate.toLocaleString('en-IN')}${unit ? '/' + unit : ''}`;
  },

  // Check if rates are updated today
  isRateUpdatedToday: (updateTimestamp) => {
    if (!updateTimestamp) return false;
    
    const today = new Date().toDateString();
    const updateDate = new Date(updateTimestamp).toDateString();
    return today === updateDate;
  },

  // Format timestamp for display
  formatTimestamp: (timestamp) => {
    if (!timestamp) return '';
    
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  // Check if current time is past 1 PM (rate blocking time)
  isPastRateDeadline: (deadlineHour = 13) => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= deadlineHour;
  },

  // Get time until rate deadline
  getTimeUntilDeadline: (deadlineHour = 13) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(deadlineHour, 0, 0, 0);
    
    if (now > today) {
      // Past deadline, show next day
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow - now;
    }
    
    return today - now;
  },

  // Format time until deadline
  formatTimeUntilDeadline: (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  // Error handling helper
  handleRateError: (error) => {
    if (error.response?.data?.requireSetup) {
      return {
        type: 'SETUP_REQUIRED',
        message: 'Rate setup is required',
        requireSetup: true
      };
    }
    
    if (error.response?.status === 403) {
      return {
        type: 'PERMISSION_DENIED',
        message: error.response.data.message || 'You do not have permission to perform this action'
      };
    }
    
    if (error.response?.status === 400) {
      return {
        type: 'VALIDATION_ERROR',
        message: error.response.data.message || 'Invalid rate data',
        errors: error.response.data.errors || []
      };
    }
    
    return {
      type: 'GENERAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    };
  }
};

export default rateService;