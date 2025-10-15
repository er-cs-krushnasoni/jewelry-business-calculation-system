import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Store, Users, TrendingUp, Settings } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // Redirect to shop management after a brief moment
    const timer = setTimeout(() => {
      navigate('/super-admin/shops');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcome', 'Welcome back')}, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {t('dashboard.superAdmin.subtitle', 'Platform Administrator Dashboard')}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-center">
          {t('dashboard.redirecting', 'Redirecting to Shop Management...')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <Store className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('dashboard.shopManagement', 'Shop Management')}
          </h3>
          <p className="text-gray-600 text-sm">
            {t('dashboard.superAdmin.shopDesc', 'Create and manage jewelry shops with subscription control')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <Users className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('dashboard.userManagement', 'User Management')}
          </h3>
          <p className="text-gray-600 text-sm">
            {t('dashboard.superAdmin.userDesc', 'Oversee shop administrators and credentials')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <TrendingUp className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('dashboard.subscriptions', 'Subscriptions')}
          </h3>
          <p className="text-gray-600 text-sm">
            {t('dashboard.superAdmin.subscriptionDesc', 'Manage shop subscriptions and renewals')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <Settings className="h-8 w-8 text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('dashboard.settings', 'Platform Settings')}
          </h3>
          <p className="text-gray-600 text-sm">
            {t('dashboard.superAdmin.settingsDesc', 'Configure system-wide settings')}
          </p>
        </div>
      </div>
    </div>
  );
};