import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ROLES } from '../../constants/roles';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [], requireShop = false, requireAuth = true }) => {
  const { isAuthenticated, loading, user } = useAuth(); // Changed isLoading to loading
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) { // Changed isLoading to loading
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Handle public routes (requireAuth = false)
  if (!requireAuth) {
    // If user is already authenticated, redirect them away from login
    if (isAuthenticated) {
      // Determine where to redirect based on user role
      if (user?.role === ROLES.SUPER_ADMIN) {
        return <Navigate to="/super-admin/dashboard" replace />;
      } else {
        return <Navigate to="/calculator" replace />;
      }
    }
    // User is not authenticated, show the public content (login form)
    return children;
  }

  // For protected routes (requireAuth = true, which is default)
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check shop requirement
  if (requireShop && !user?.shopId) {
    return <Navigate to="/no-shop-access" replace />;
  }

  // Super admin shouldn't access shop-specific routes
  if (user?.role === ROLES.SUPER_ADMIN && requireShop) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  return children;
};

// Role-specific protected route components
export const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const ShopAdminRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ManagerRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.MANAGER]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ProClientRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.PRO_CLIENT]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ClientRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.CLIENT]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ShopUserRoute = ({ children }) => (
  <ProtectedRoute 
    roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.PRO_CLIENT, ROLES.CLIENT]} 
    requireShop={true}
  >
    {children}
  </ProtectedRoute>
);

export const AdminManagerRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const CalculatorUserRoute = ({ children }) => (
  <ProtectedRoute 
    roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.PRO_CLIENT, ROLES.CLIENT]} 
    requireShop={true}
  >
    {children}
  </ProtectedRoute>
);

// Public route (redirect if authenticated) - DEPRECATED, use ProtectedRoute with requireAuth={false}
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth(); // Changed isLoading to loading

  if (loading) { // Changed isLoading to loading
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Determine where to redirect based on user role
    if (user?.role === ROLES.SUPER_ADMIN) {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else {
      return <Navigate to="/calculator" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;