import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout
import Layout from './components/layout/Layout';

// Direct dashboard components to avoid lazy loading issues
const SuperAdminDashboard = () => (
  <div className="p-6 text-center">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
    <p className="text-gray-600">Dashboard component will be implemented in the next phase.</p>
  </div>
);

const ShopAdminDashboard = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const timer = setTimeout(() => navigate('/calculator'), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Admin Dashboard</h1>
      <p className="text-gray-600">Redirecting to calculator...</p>
    </div>
  );
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const timer = setTimeout(() => navigate('/calculator'), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
      <p className="text-gray-600">Redirecting to calculator...</p>
    </div>
  );
};

const ProClientDashboard = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const timer = setTimeout(() => navigate('/calculator'), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pro Client Dashboard</h1>
      <p className="text-gray-600">Redirecting to calculator...</p>
    </div>
  );
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const timer = setTimeout(() => navigate('/calculator'), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
      <p className="text-gray-600">Redirecting to calculator...</p>
    </div>
  );
};

// Pages (using lazy loading for essential components only)
const LoginForm = React.lazy(() => import('./components/auth/LoginForm'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

// Rate Management Component
const RateManager = React.lazy(() => import('./components/rates/RateManager'));

// Calculator Component
const CalculatorPage = React.lazy(() => import('./pages/calculator/calculator'));

// Import useAuth hook
import { useAuth } from './contexts/AuthContext';

// Loading component for suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="large" />
      <p className="mt-4 text-gray-600">Loading page...</p>
    </div>
  </div>
);

// Component to redirect to appropriate dashboard based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/super-admin" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'manager':
      return <Navigate to="/manager" replace />;
    case 'pro_client':
      return <Navigate to="/pro-client" replace />;
    case 'client':
      return <Navigate to="/client" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

function App() {
  return (
    <Router>
      <div className="App">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Context Providers - Order matters! */}
        <LanguageProvider>
          <AuthProvider>
            {/* Socket provider depends on auth context */}
            <SocketProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/login" 
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <LoginForm />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Protected Routes with Layout */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Default redirect */}
                    <Route index element={<DashboardRedirect />} />
                    
                    {/* Calculator Route - Available to all shop users */}
                    <Route 
                      path="calculator" 
                      element={
                        <ProtectedRoute roles={["admin", "manager", "pro_client", "client"]} requireShop={true}>
                          <CalculatorPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Role-specific dashboards */}
                    <Route 
                      path="super-admin" 
                      element={
                        <ProtectedRoute roles={["super_admin"]}>
                          <SuperAdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="admin" 
                      element={
                        <ProtectedRoute roles={["admin"]} requireShop={true}>
                          <ShopAdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin Rate Management Route */}
                    <Route 
                      path="admin/rates" 
                      element={
                        <ProtectedRoute roles={["admin"]} requireShop={true}>
                          <RateManager showTitle={true} />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="manager" 
                      element={
                        <ProtectedRoute roles={["manager"]} requireShop={true}>
                          <ManagerDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Manager Rate Management Route */}
                    <Route 
                      path="manager/rates" 
                      element={
                        <ProtectedRoute roles={["manager"]} requireShop={true}>
                          <RateManager showTitle={true} />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="pro-client" 
                      element={
                        <ProtectedRoute roles={["pro_client"]} requireShop={true}>
                          <ProClientDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="client" 
                      element={
                        <ProtectedRoute roles={["client"]} requireShop={true}>
                          <ClientDashboard />
                        </ProtectedRoute>
                      } 
                    />
                  </Route>

                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SocketProvider>
          </AuthProvider>
        </LanguageProvider>
      </div>
    </Router>
  );
}

export default App;