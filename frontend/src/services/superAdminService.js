import api from './api';

const superAdminService = {
  // Shop Management
  getAllShops: () => api.get('/super-admin/shops'),
  
  getShopDetails: (shopId) => api.get(`/super-admin/shops/${shopId}`),
  
  createShop: (shopData) => api.post('/super-admin/shops', shopData),
  
  updateShop: (shopId, shopData) => api.put(`/super-admin/shops/${shopId}`, shopData),
  
  deleteShop: (shopId, permanent = false) => 
    api.delete(`/super-admin/shops/${shopId}?permanent=${permanent}`),
  
  // Subscription Management
  extendSubscription: (shopId, days) => 
    api.post(`/super-admin/shops/${shopId}/extend-subscription`, { days }),
  
  reduceSubscription: (shopId, days) => 
    api.post(`/super-admin/shops/${shopId}/reduce-subscription`, { days }),
  
  // Bulk Operations
  bulkActivateShops: (shopIds) => 
    api.post('/super-admin/shops/bulk-activate', { shopIds }),
  
  bulkDeactivateShops: (shopIds, reason, notes) => 
    api.post('/super-admin/shops/bulk-deactivate', { shopIds, reason, notes }),
  
  // Admin Credentials
  updateShopAdminCredentials: (shopId, credentials) => 
    api.put(`/super-admin/shops/${shopId}/admin-credentials`, credentials),
  
  // Profile Management - Super Admin's own credentials
  updateOwnCredentials: (credentialsData) => 
    api.put('/super-admin/profile/credentials', credentialsData),
  
  // Analytics
  getDashboardStats: () => api.get('/super-admin/dashboard-stats'),
  
  getSubscriptionAnalytics: () => api.get('/super-admin/subscription-analytics'),
};

export default superAdminService;