// ShopAdminDashboard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calculator } from 'lucide-react';

export const ShopAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // Redirect to calculator after a brief moment
    const timer = setTimeout(() => {
      navigate('/calculator');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcome', 'Welcome back')}, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {t('dashboard.admin.subtitle', 'Shop Administrator Dashboard')}
        </p>
        {user?.shopName && (
          <p className="text-lg font-medium text-blue-600 mt-2">
            {user.shopName}
          </p>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <Calculator className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <p className="text-green-800 text-lg mb-2">
          {t('dashboard.redirectingCalculator', 'Redirecting to Calculator...')}
        </p>
        <p className="text-green-700 text-sm">
          {t('dashboard.admin.access', 'You have full access to all shop features')}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.admin.capabilities', 'Your Capabilities')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• {t('dashboard.admin.calc', 'Full jewelry calculations with margins')}</li>
            <li>• {t('dashboard.admin.users', 'Create and manage shop users')}</li>
            <li>• {t('dashboard.admin.rates', 'Update daily gold/silver rates')}</li>
          </ul>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• {t('dashboard.admin.categories', 'Manage jewelry categories')}</li>
            <li>• {t('dashboard.admin.settings', 'Configure shop settings')}</li>
            <li>• {t('dashboard.admin.reports', 'View detailed reports')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};