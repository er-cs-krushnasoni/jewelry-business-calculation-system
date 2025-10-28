import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Calculator, TrendingUp, Sparkles } from 'lucide-react';
import SubscriptionCountdown from '../../components/subscription/SubscriptionCountdown';

export const ManagerDashboard = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="text-center space-y-3 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-gold shadow-gold mb-4 animate-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-gold bg-clip-text text-transparent mb-3">
            {t('dashboard.welcome')}, {user?.username}!
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium transition-colors duration-300">
            {t('dashboard.manager.subtitle')}
          </p>
          {user?.shopName && (
            <div className="inline-block mt-2">
              <p className="text-xl sm:text-2xl font-bold text-gold-600 dark:text-gold-400 px-6 py-2 rounded-full glass-effect shadow-luxury transition-all duration-300 hover:scale-105">
                {user.shopName}
              </p>
            </div>
          )}
        </div>

        {/* Subscription Countdown - Show for managers */}
        {subscriptionStatus && (
          <div className="animate-scale-in">
            <SubscriptionCountdown 
              subscriptionStatus={subscriptionStatus}
            />
          </div>
        )}

        {/* Redirect Message */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700/50 shadow-luxury-lg hover:shadow-gold transition-all duration-500 hover:scale-[1.02] animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="relative p-6 sm:p-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-800/50 shadow-lg">
                <Calculator className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
            </div>
            <p className="text-emerald-900 dark:text-emerald-100 text-lg sm:text-xl font-bold mb-2 text-center transition-colors duration-300">
              {t('dashboard.redirectingCalculator')}
            </p>
            <p className="text-emerald-700 dark:text-emerald-300 text-sm sm:text-base text-center transition-colors duration-300">
              {t('dashboard.manager.access')}
            </p>
          </div>
        </div>

        {/* Manager Capabilities */}
        <div className="group rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-luxury hover:shadow-luxury-lg transition-all duration-500 overflow-hidden animate-slide-up">
          <div className="bg-gradient-gold p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              {t('dashboard.manager.capabilities')}
            </h3>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-amber-50 dark:from-slate-700/50 dark:to-slate-700/30 border border-gold-200 dark:border-gold-700/30 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-gold">
                  <div className="p-2 rounded-lg bg-gradient-gold shadow-gold">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                      {t('dashboard.manager.calc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-amber-50 dark:from-slate-700/50 dark:to-slate-700/30 border border-gold-200 dark:border-gold-700/30 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-gold">
                  <div className="p-2 rounded-lg bg-gradient-gold shadow-gold">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                      {t('dashboard.manager.rates')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-amber-50 dark:from-slate-700/50 dark:to-slate-700/30 border border-gold-200 dark:border-gold-700/30 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-gold">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
                    <span className="text-white font-bold text-lg">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                      {t('dashboard.manager.reports')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-gold-50 to-amber-50 dark:from-slate-700/50 dark:to-slate-700/30 border border-gold-200 dark:border-gold-700/30 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-gold">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
                    <span className="text-white font-bold text-lg">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                      {t('dashboard.manager.monitor')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="rounded-2xl glass-effect border-2 border-blue-200 dark:border-blue-700/50 shadow-luxury p-5 sm:p-6 backdrop-blur-sm hover:scale-[1.01] transition-all duration-300 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">i</span>
            </div>
            <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 leading-relaxed">
              <strong className="font-bold text-blue-950 dark:text-blue-50">{t('common.note', 'Note')}:</strong>{' '}
              <span className="text-blue-800 dark:text-blue-200">{t('dashboard.manager.note')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};