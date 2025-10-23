import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calculator } from 'lucide-react';

export const ClientDashboard = () => {
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
          {t('dashboard.welcome')}, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {t('dashboard.client.subtitle')}
        </p>
        {user?.shopName && (
          <p className="text-lg font-medium text-purple-600 mt-2">
            {user.shopName}
          </p>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
        <Calculator className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <p className="text-purple-800 text-lg mb-2">
          {t('dashboard.redirectingCalculator')}
        </p>
        <p className="text-purple-700 text-sm">
          {t('dashboard.client.access')}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.client.capabilities')}
        </h3>
        <div className="text-left max-w-md mx-auto">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• {t('dashboard.client.calc')}</li>
            <li>• {t('dashboard.client.prices')}</li>
            <li>• {t('dashboard.client.simple')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};