import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useBlockingStatus from '../../hooks/useBlockingStatus';
import BlockingMessage from '../../components/rates/BlockingMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { Calculator, AlertCircle, CheckCircle, Clock, TestTube } from 'lucide-react';
import { ROLES, ROLE_NAMES } from '../../constants/roles';

const CalculatorPage = () => {
  // ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL HOOKS
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isBlocked, blockingInfo, loading: blockingLoading } = useBlockingStatus(30000);
  
  const [calculatorStatus, setCalculatorStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Get calculator status function
  const getCalculatorStatus = async () => {
    try {
      const response = await api.get('/calculator/status');
      if (response.data.success) {
        setCalculatorStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error getting calculator status:', error);
    }
  };

  // Test calculator access function
  const testCalculatorAccess = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await api.get('/calculator/test');
      
      if (response.data.success) {
        setTestResult({
          success: true,
          message: response.data.message,
          data: response.data.data
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Calculator test failed',
        blocked: error.response?.status === 423, // 423 = Locked (blocked)
        error: error.response?.data
      });
    } finally {
      setTesting(false);
    }
  };

  // ALL useEffect hooks must be called unconditionally
  useEffect(() => {
    // Only get calculator status if not blocked and not super admin
    if (!isBlocked && user?.role !== ROLES.SUPER_ADMIN) {
      getCalculatorStatus();
    }
  }, [isBlocked, user?.role]); // Dependencies array

  // NOW WE CAN DO CONDITIONAL RETURNS

  // Super Admin cannot access calculator
  if (user?.role === ROLES.SUPER_ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('calculator.access_denied', 'Access Denied')}
          </h2>
          <p className="text-gray-600">
            {t('calculator.super_admin_message', 'Super Admins cannot access the calculator. Please use the shop management features.')}
          </p>
        </div>
      </div>
    );
  }

  // Show loading if checking blocking status
  if (blockingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  // Show blocking message if system is blocked
  if (isBlocked) {
    return <BlockingMessage />;
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <Calculator className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('calculator.title', 'Jewelry Calculator')}
            </h1>
          </div>
          <p className="mt-2 text-lg text-gray-600">
            {t('calculator.subtitle', 'Calculate prices for new and old jewelry with precision')}
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 text-sm font-medium">Calculator Available</span>
            </div>
          </div>
          
          {blockingInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Current Time</span>
                </div>
                <p className="text-blue-700">{blockingInfo.currentTimeIST}</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Rate Status</span>
                </div>
                <p className="text-green-700">
                  {blockingInfo.rateInfo?.isToday ? 'Updated Today' : 'Rates Available'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-800">Daily Deadline</span>
                </div>
                <p className="text-gray-700">{blockingInfo.systemStatus?.dailyDeadline}</p>
              </div>
            </div>
          )}
        </div>

        {/* User Role Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('calculator.access_level', 'Your Access Level')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t('calculator.logged_as', 'Logged in as')}
              </p>
              <p className="font-medium text-gray-900">
                {user?.username} - {ROLE_NAMES[user?.role]}
              </p>
              {user?.shopName && (
                <p className="text-sm text-gray-500 mt-1">
                  {user.shopName} {user.shopCode && `(${user.shopCode})`}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">
                {t('calculator.features_available', 'Available Features')}
              </div>
              <div className="space-y-1">
                {getAvailableFeatures(user?.role).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calculator Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Calculator Test</h3>
            <Button 
              onClick={testCalculatorAccess}
              disabled={testing}
              className="flex items-center space-x-2"
            >
              {testing ? (
                <LoadingSpinner size="small" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>{testing ? 'Testing...' : 'Test Calculator'}</span>
            </Button>
          </div>
          
          <p className="text-gray-600 mb-4">
            Test if the calculator is accessible. This will verify that rates are updated and the system is not blocked.
          </p>
          
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200' 
                : testResult.blocked 
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? 'Test Passed' : testResult.blocked ? 'System Blocked' : 'Test Failed'}
                </span>
              </div>
              <p className={`text-sm ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>
              
              {testResult.success && testResult.data && (
                <div className="mt-3 text-xs text-green-600">
                  <p>Shop ID: {testResult.data.shopId}</p>
                  <p>Role: {testResult.data.userRole}</p>
                  {testResult.data.lastRateUpdate && (
                    <p>Last Rate Update: {testResult.data.lastRateUpdate.timestamp} by {testResult.data.lastRateUpdate.updatedBy}</p>
                  )}
                </div>
              )}
              
              {testResult.blocked && testResult.error?.blockingInfo && (
                <div className="mt-3 text-xs text-red-600">
                  <p>Reason: {testResult.error.reason}</p>
                  <p>Current Time: {testResult.error.blockingInfo.currentTimeIST}</p>
                  <p>Deadline: {testResult.error.blockingInfo.dailyDeadline}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calculator Interface Placeholder */}
        <div className="bg-white rounded-lg shadow">
          {/* Rate Status Bar */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {t('calculator.current_rates', 'Current Rates')}
                </h3>
                {calculatorStatus?.rateInfo?.updateInfo && (
                  <p className="text-sm text-gray-500">
                    Updated by {calculatorStatus.rateInfo.updateInfo.updatedBy} at {calculatorStatus.rateInfo.updateInfo.timestamp}
                  </p>
                )}
              </div>
              <div className="bg-green-100 border border-green-300 rounded-md px-3 py-1">
                <span className="text-sm text-green-800">
                  System Ready
                </span>
              </div>
            </div>
          </div>

          {/* Calculator Form Placeholder */}
          <div className="p-6">
            <div className="text-center py-12">
              <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('calculator.coming_soon', 'Calculator Coming Soon')}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {t('calculator.implementation_message', 
                  'The calculation engine will be implemented in the next phase. This will include rate management, category selection, and role-based calculation visibility.')}
              </p>
              
              {/* System Status Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-blue-800 mb-2">Rate Blocking System Status</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>✓ 1:00 PM IST blocking system active</p>
                  <p>✓ Rate update enforcement working</p>
                  <p>✓ Calculator access control functional</p>
                  <p>✓ Ready for calculation implementation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get available features by role
const getAvailableFeatures = (role) => {
  const features = {
    [ROLES.ADMIN]: [
      'Full calculation access',
      'Margin visibility',
      'Rate management',
      'All calculation details'
    ],
    [ROLES.MANAGER]: [
      'Full calculation access',
      'Margin visibility', 
      'Rate management',
      'All calculation details'
    ],
    [ROLES.PRO_CLIENT]: [
      'Calculation access',
      'Margin visibility',
      'Resale options access'
    ],
    [ROLES.CLIENT]: [
      'Basic calculations',
      'Final price viewing only'
    ]
  };

  return features[role] || [];
};

export default CalculatorPage;