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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-3 animate-slide-up">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
            {t('dashboard.welcome')}, {user?.username}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('dashboard.admin.subtitle')}
          </p>
          {user?.shopName && (
            <div className="inline-block mt-3">
              <p className="text-2xl font-semibold text-gold-600 dark:text-gold-400 px-6 py-2 bg-gold-50 dark:bg-gold-900/20 rounded-full border border-gold-200 dark:border-gold-700 shadow-gold">
                {user.shopName}
              </p>
            </div>
          )}
        </div>
  
        {/* Subscription Countdown - Only show for shop admin */}
        {subscriptionStatus && user?.role === 'admin' && (
          <div className="animate-scale-in">
            <SubscriptionCountdown 
              subscriptionStatus={subscriptionStatus}
            />
          </div>
        )}
  
        {/* Redirect Message */}
        <div className="glass-effect bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-8 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 animate-slide-up">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-2xl animate-glow">
              <Calculator className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-green-800 dark:text-green-300 text-xl font-semibold text-center">
              {t('dashboard.redirectingCalculator')}
            </p>
            <p className="text-green-700 dark:text-green-400 text-base text-center max-w-md">
              {t('dashboard.admin.access')}
            </p>
            {/* Loading indicator */}
            <div className="flex space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
  
        {/* Admin Capabilities */}
        <div className="glass-effect bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-luxury border border-gray-200 dark:border-slate-700 hover:shadow-luxury-lg transition-all duration-300 animate-slide-up">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-gold rounded-full"></span>
            {t('dashboard.admin.capabilities')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 group hover:translate-x-1 transition-transform duration-200">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">✓</span>
                <span className="text-base">{t('dashboard.admin.calc')}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 group hover:translate-x-1 transition-transform duration-200">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">✓</span>
                <span className="text-base">{t('dashboard.admin.users')}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 group hover:translate-x-1 transition-transform duration-200">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">✓</span>
                <span className="text-base">{t('dashboard.admin.rates')}</span>
              </li>
            </ul>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 group hover:translate-x-1 transition-transform duration-200">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">✓</span>
                <span className="text-base">{t('dashboard.admin.categories')}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 group hover:translate-x-1 transition-transform duration-200">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">✓</span>
                <span className="text-base">{t('dashboard.admin.settings')}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 group hover:translate-x-1 transition-transform duration-200">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 font-bold group-hover:scale-110 transition-transform">✓</span>
                <span className="text-base">{t('dashboard.admin.reports')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};