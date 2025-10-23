import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calculator } from 'lucide-react';
import SubscriptionCountdown from '../../components/subscription/SubscriptionCountdown';

export const ShopAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, getSubscriptionStatus } = useAuth();
  const { t } = useLanguage();
  
  const subscriptionStatus = getSubscriptionStatus();

  useEffect(() => {
    // Redirect to calculator after showing subscription info
    const timer = setTimeout(() => {
      navigate('/calculator');
    }, subscriptionStatus?.status === 'expired' ? 5000 : 3000);

    return () => clearTimeout(timer);
  }, [navigate, subscriptionStatus]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcome')}, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {t('dashboard.admin.subtitle')}
        </p>
        {user?.shopName && (
          <p className="text-xl font-medium text-blue-600 mt-2">
            {user.shopName}
          </p>
        )}
      </div>

      {/* Subscription Countdown - Only show for shop admin */}
      {subscriptionStatus && user?.role === 'admin' && (
        <SubscriptionCountdown 
          subscriptionStatus={subscriptionStatus}
        />
      )}

      {/* Redirect Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <Calculator className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <p className="text-green-800 text-lg mb-2 text-center">
          {t('dashboard.redirectingCalculator')}
        </p>
        <p className="text-green-700 text-sm text-center">
          {t('dashboard.admin.access')}
        </p>
      </div>

      {/* Admin Capabilities */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.admin.capabilities')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('dashboard.admin.calc')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('dashboard.admin.users')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('dashboard.admin.rates')}
            </li>
          </ul>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('dashboard.admin.categories')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('dashboard.admin.settings')}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {t('dashboard.admin.reports')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};