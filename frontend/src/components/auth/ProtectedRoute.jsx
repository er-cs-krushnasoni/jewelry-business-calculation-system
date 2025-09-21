import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  roles = null, 
  requireShop = false, 
  requireAuth = true 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Handle routes that should not be accessible when authenticated (like login)
  if (!requireAuth) {
    if (isAuthenticated && user) {
      // Redirect authenticated users away from login page
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // Require authentication for protected routes
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check specific role requirements
  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      console.log(`Access denied: User role ${user.role} not in allowed roles:`, roles);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check shop requirement (for non-super_admin users)
  if (requireShop && user.role !== 'super_admin') {
    if (!user.shopId) {
      console.log('Access denied: User requires shop association but has no shopId');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// Legacy support - keep the old specific route components for backward compatibility
export const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute roles={["super_admin"]}>
    {children}
  </ProtectedRoute>
);

export const ShopAdminRoute = ({ children }) => (
  <ProtectedRoute roles={["admin"]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ManagerRoute = ({ children }) => (
  <ProtectedRoute roles={["manager"]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ProClientRoute = ({ children }) => (
  <ProtectedRoute roles={["pro_client"]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export const ClientRoute = ({ children }) => (
  <ProtectedRoute roles={["client"]} requireShop={true}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;