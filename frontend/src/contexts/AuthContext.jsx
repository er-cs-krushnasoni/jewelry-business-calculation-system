import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Listen for auth expiration events from api interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log('Auth expired event received');
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  // Listen for shop deactivation events
  useEffect(() => {
    const handleShopDeactivated = (event) => {
      console.log('Shop deactivated event received:', event.detail);
      logout();
    };

    window.addEventListener('shop-deactivated', handleShopDeactivated);
    return () => {
      window.removeEventListener('shop-deactivated', handleShopDeactivated);
    };
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Verify token is still valid by making a test request
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            // Use fresh server data (includes subscription status)
            const serverUser = response.data.user;
            setUser(serverUser);
            localStorage.setItem('user', JSON.stringify(serverUser));
          }
        } catch (error) {
          // Token invalid, clear auth - but don't redirect here
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Login attempt started with:', { username: credentials.username });
      
      // Clear any existing errors
      setError(null);
      
      // Extract username and password from credentials object
      const { username, password } = credentials;
      
      // Validate inputs
      if (!username || !password) {
        const errorMsg = 'Username and password are required';
        console.log('Validation error:', errorMsg);
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      console.log('Making API request...');

      const response = await api.post('/auth/login', {
        username: username.toLowerCase().trim(),
        password
      });

      console.log('API response:', response.data);

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        console.log('Login successful, storing data...');
        console.log('Subscription status:', userData.subscriptionStatus); // Debug log
        
        // Store token and user data (includes subscriptionStatus)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        setError(null); // Clear any errors on success
        
        return { success: true, user: userData };
      } else {
        const errorMsg = response.data.message || 'Login failed';
        console.log('Login failed with message:', errorMsg);
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error('Login error caught:', error);
      console.error('Error response:', error.response?.data);
      
      // Set error message for UI
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid login credentials';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'No internet connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Helper methods for role-based access control
  const isSuperAdmin = () => user?.role === 'super_admin';
  const isShopAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'manager';
  const isProClient = () => user?.role === 'pro_client';
  const isClient = () => user?.role === 'client';

  // Combined role checks
  const canUpdateRates = () => {
    return user && ['admin', 'manager'].includes(user.role);
  };

  const canViewMargins = () => {
    return user && ['admin', 'manager', 'pro_client'].includes(user.role);
  };

  const canManageUsers = () => {
    return user && user.role === 'admin';
  };

  const canManageCategories = () => {
    return user && user.role === 'admin';
  };

  const canAccessCalculator = () => {
    return user && user.role !== 'super_admin';
  };

  const canAccessShop = (shopId) => {
    if (!user || !user.shopId) return false;
    return user.shopId.toString() === shopId.toString();
  };

  // Get user's display role
  const getUserDisplayRole = () => {
    if (!user) return '';
    
    const roleMap = {
      'super_admin': 'Super Admin',
      'admin': 'Shop Admin',
      'manager': 'Manager',
      'pro_client': 'Pro Client',
      'client': 'Client'
    };
    return roleMap[user.role] || user.role;
  };

  // Get user's shop info
  const getShopInfo = () => {
    if (!user || user.role === 'super_admin') return null;
    
    return {
      shopId: user.shopId,
      shopName: user.shopName,
      shopCode: user.shopCode,
      subscriptionStatus: user.subscriptionStatus // ADD THIS LINE
    };
  };

  // NEW: Get subscription status
  const getSubscriptionStatus = () => {
    return user?.subscriptionStatus || null;
  };

  // Check if user has minimum role level
  const hasMinimumRole = (minimumRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'client': 1,
      'pro_client': 2,
      'manager': 3,
      'admin': 4,
      'super_admin': 5
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Update user data (useful after profile updates)
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  // Set error function (useful for other components to set errors)
  const setAuthError = (errorMessage) => {
    setError(errorMessage);
  };

  const value = {
    // Auth state
    user,
    loading,
    isAuthenticated,
    error,
    
    // Auth methods
    login,
    logout,
    checkAuth,
    updateUser,
    clearError,
    setAuthError,
    
    // Role checks
    isSuperAdmin,
    isShopAdmin,
    isManager,
    isProClient,
    isClient,
    
    // Permission checks
    canUpdateRates,
    canViewMargins,
    canManageUsers,
    canManageCategories,
    canAccessCalculator,
    canAccessShop,
    hasMinimumRole,
    
    // Utility methods
    getUserDisplayRole,
    getShopInfo,
    getSubscriptionStatus // ADD THIS LINE
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};