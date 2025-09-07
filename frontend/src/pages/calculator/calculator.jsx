import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calculator, AlertCircle } from 'lucide-react';
import { ROLES, ROLE_NAMES } from '../../constants/roles';

const CalculatorPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

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

        {/* Calculator Interface Placeholder */}
        <div className="bg-white rounded-lg shadow">
          {/* Rate Status Bar */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {t('calculator.current_rates', 'Current Rates')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('calculator.rates_placeholder', 'Rate management system will be implemented in future phases')}
                </p>
              </div>
              <div className="bg-yellow-100 border border-yellow-300 rounded-md px-3 py-1">
                <span className="text-sm text-yellow-800">
                  {t('calculator.rates_pending', 'Pending Implementation')}
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
              <p className="text-gray-500 max-w-md mx-auto">
                {t('calculator.implementation_message', 
                  'The calculation engine will be implemented in the next phase. This will include rate management, category selection, and role-based calculation visibility.')}
              </p>
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