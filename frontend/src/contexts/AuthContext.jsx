import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';
import { ROLES } from '../constants/roles';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload,
        token: authService.getToken(),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isLoggedIn()) {
          const user = authService.getStoredUser();
          if (user) {
            // Verify token is still valid by fetching current user
            try {
              const currentUser = await authService.getCurrentUser();
              dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: currentUser });
            } catch (error) {
              // Token invalid, clear auth data
              authService.clearAuthData();
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          } else {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authService.login(credentials);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.token,
        },
      });

      return response;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message,
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Update user function (for profile updates)
  const updateUser = (updatedUser) => {
    dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: updatedUser });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return hasRole(ROLES.SUPER_ADMIN);
  };

  // Check if user is shop admin
  const isShopAdmin = () => {
    return hasRole(ROLES.ADMIN);
  };

  // Check if user is manager
  const isManager = () => {
    return hasRole(ROLES.MANAGER);
  };

  // Check if user is pro client
  const isProClient = () => {
    return hasRole(ROLES.PRO_CLIENT);
  };

  // Check if user is client
  const isClient = () => {
    return hasRole(ROLES.CLIENT);
  };

  // Check if user can manage users
  const canManageUsers = () => {
    return hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  };

  // Check if user can update rates
  const canUpdateRates = () => {
    return hasAnyRole([ROLES.ADMIN, ROLES.MANAGER]);
  };

  // Check if user can view margins
  const canViewMargins = () => {
    return hasAnyRole([ROLES.ADMIN, ROLES.MANAGER, ROLES.PRO_CLIENT]);
  };

  // Get user's shop info
  const getShopInfo = () => {
    return {
      shopId: state.user?.shopId,
      shopName: state.user?.shopName,
      shopCode: state.user?.shopCode,
    };
  };

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!state.user) return '/login';

    switch (state.user.role) {
      case ROLES.SUPER_ADMIN:
        return '/dashboard/super-admin';
      case ROLES.ADMIN:
        return '/dashboard/admin';
      case ROLES.MANAGER:
        return '/dashboard/manager';
      case ROLES.PRO_CLIENT:
        return '/dashboard/pro-client';
      case ROLES.CLIENT:
        return '/dashboard/client';
      default:
        return '/login';
    }
  };

  // Get calculator route (redirect after login)
  const getCalculatorRoute = () => {
    if (!state.user) return '/login';
    
    // All roles redirect to calculator after login
    switch (state.user.role) {
      case ROLES.SUPER_ADMIN:
        return '/super-admin/shops'; // Super admin goes to shop management
      case ROLES.ADMIN:
        return '/calculator';
      case ROLES.MANAGER:
        return '/calculator';
      case ROLES.PRO_CLIENT:
        return '/calculator';
      case ROLES.CLIENT:
        return '/calculator';
      default:
        return '/login';
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    clearError,
    updateUser,
    
    // Role checkers
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isShopAdmin,
    isManager,
    isProClient,
    isClient,
    
    // Permission checkers
    canManageUsers,
    canUpdateRates,
    canViewMargins,
    
    // Utilities
    getShopInfo,
    getDashboardRoute,
    getCalculatorRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;