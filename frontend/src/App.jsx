import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/layout/Layout';
import ProtectedRoute, { 
  SuperAdminRoute, 
  ShopAdminRoute, // Changed from AdminRoute to ShopAdminRoute
  ManagerRoute, 
  ProClientRoute, 
  ClientRoute 
} from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';

// Calculator
import CalculatorPage from './pages/calculator/calculator';

// Dashboard pages
import {SuperAdminDashboard} from './pages/dashboard/SuperAdminDashboard';
import {ShopAdminDashboard} from './pages/dashboard/ShopAdminDashboard';
import {ManagerDashboard} from './pages/dashboard/ManagerDashboard';
import {ProClientDashboard} from './pages/dashboard/ProClientDashboard';
import { ClientDashboard } from './pages/dashboard/ClientDashboard';

// Rate components
import RateManager from './components/rates/RateManager';

// Error pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
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

            {/* Protected Routes - Super Admin (no layout for super admin) */}
            <Route path="/super-admin/dashboard" element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            } />

            {/* Protected Routes with Layout for other roles */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Default redirect to calculator for authenticated users */}
                    <Route index element={<Navigate to="/calculator" replace />} />
                    
                    {/* Calculator - Available to all authenticated users except super_admin */}
                    <Route path="calculator" element={<CalculatorPage />} />

                    {/* Shop Admin Routes */}
                    <Route path="admin/dashboard" element={
                      <ShopAdminRoute>
                        <ShopAdminDashboard />
                      </ShopAdminRoute>
                    } />

                    {/* Admin Rates Route - Add this */}
                    <Route path="admin/rates" element={
                      <ShopAdminRoute>
                        <RateManager showTitle={true} />
                      </ShopAdminRoute>
                    } />

                    {/* Manager Routes */}
                    <Route path="manager/dashboard" element={
                      <ManagerRoute>
                        <ManagerDashboard />
                      </ManagerRoute>
                    } />

                    {/* Manager Rates Route - Managers can also update rates */}
                    <Route path="manager/rates" element={
                      <ManagerRoute>
                        <RateManager showTitle={true} />
                      </ManagerRoute>
                    } />

                    {/* Pro Client Routes */}
                    <Route path="pro-client/dashboard" element={
                      <ProClientRoute>
                        <ProClientDashboard />
                      </ProClientRoute>
                    } />

                    {/* Client Routes */}
                    <Route path="client/dashboard" element={
                      <ClientRoute>
                        <ClientDashboard />
                      </ClientRoute>
                    } />

                    {/* Error Routes */}
                    <Route path="unauthorized" element={<Unauthorized />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;