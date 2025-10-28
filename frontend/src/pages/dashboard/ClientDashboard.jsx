import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calculator, Sparkles, TrendingUp, ShoppingBag } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-12 animate-slide-up">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-gold-500 dark:text-gold-400 animate-glow" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            {t('dashboard.welcome')}, {user?.username}!
          </h1>
          <Sparkles className="h-6 w-6 text-gold-500 dark:text-gold-400 animate-glow" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {t('dashboard.client.subtitle')}
        </p>
        {user?.shopName && (
          <div className="mt-4 inline-block">
            <p className="text-xl font-semibold text-gold-600 dark:text-gold-400 px-6 py-2 bg-gold-50 dark:bg-slate-800 rounded-full border border-gold-200 dark:border-gold-700/50 shadow-gold">
              {user.shopName}
            </p>
          </div>
        )}
      </div>

      {/* Redirect Card */}
      <div className="glass-effect bg-gradient-luxury border border-gold-200 dark:border-gold-700/30 rounded-xl p-8 mb-8 shadow-luxury-lg transform hover:scale-105 transition-all duration-300 animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 bg-gold-500/10 dark:bg-gold-400/5 rounded-full blur-3xl"></div>
          <Calculator className="h-16 w-16 text-gold-600 dark:text-gold-400 mx-auto mb-4 relative z-10 animate-glow" />
        </div>
        <p className="text-gold-800 dark:text-gold-300 text-xl font-semibold mb-2">
          {t('dashboard.redirectingCalculator')}
        </p>
        <p className="text-gold-700 dark:text-gold-400 text-sm">
          {t('dashboard.client.access')}
        </p>
        <div className="mt-4 flex items-center justify-center gap-1">
          <div className="h-2 w-2 bg-gold-500 dark:bg-gold-400 rounded-full animate-pulse"></div>
          <div className="h-2 w-2 bg-gold-500 dark:bg-gold-400 rounded-full animate-pulse delay-100"></div>
          <div className="h-2 w-2 bg-gold-500 dark:bg-gold-400 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>

      {/* Capabilities Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-luxury border border-gray-200 dark:border-slate-700 hover:shadow-luxury-lg transition-all duration-300">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-1 w-12 bg-gradient-gold rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.client.capabilities')}
          </h3>
          <div className="h-1 w-12 bg-gradient-gold rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {/* Capability 1 */}
          <div className="group text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 hover:border-gold-300 dark:hover:border-gold-600 transition-all duration-300 hover:shadow-gold">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-100 dark:bg-gold-900/30 mb-3 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {t('dashboard.client.calc')}
            </p>
          </div>

          {/* Capability 2 */}
          <div className="group text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 hover:border-gold-300 dark:hover:border-gold-600 transition-all duration-300 hover:shadow-gold">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-100 dark:bg-gold-900/30 mb-3 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {t('dashboard.client.prices')}
            </p>
          </div>

          {/* Capability 3 */}
          <div className="group text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 hover:border-gold-300 dark:hover:border-gold-600 transition-all duration-300 hover:shadow-gold">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-100 dark:bg-gold-900/30 mb-3 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {t('dashboard.client.simple')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};