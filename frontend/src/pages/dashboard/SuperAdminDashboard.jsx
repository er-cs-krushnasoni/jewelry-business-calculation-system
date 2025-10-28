import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Store, Users, TrendingUp, Settings, Crown, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="text-center space-y-3 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-gold-500 to-amber-500 shadow-luxury-lg mb-4 animate-glow">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-gold-600 to-amber-600 dark:from-purple-400 dark:via-gold-400 dark:to-amber-400 bg-clip-text text-transparent mb-3">
            {t('dashboard.welcome', 'Welcome back')}, {user?.username}!
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium transition-colors duration-300">
            {t('dashboard.superAdmin.subtitle', 'Platform Administrator Dashboard')}
          </p>
          {/* Super Admin Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-gold-600 shadow-luxury border border-purple-300 dark:border-purple-600">
            <Shield className="h-4 w-4 text-white" />
            <span className="text-white font-bold text-xs sm:text-sm tracking-wider">
              SUPER ADMINISTRATOR
            </span>
          </div>
        </div>

        {/* Redirect Message */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700/50 shadow-luxury-lg hover:shadow-gold transition-all duration-500 hover:scale-[1.02] animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="relative p-5 sm:p-6">
            <p className="text-blue-900 dark:text-blue-100 text-base sm:text-lg font-bold text-center transition-colors duration-300 flex items-center justify-center gap-2">
              <Store className="h-5 w-5 animate-pulse" />
              {t('dashboard.redirecting', 'Redirecting to Shop Management...')}
            </p>
          </div>
        </div>

        {/* Admin Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-up">
          {/* Shop Management */}
          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-luxury hover:shadow-luxury-lg transition-all duration-500 hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 dark:from-blue-400/5 dark:to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                <Store className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 transition-colors duration-300">
                {t('dashboard.shopManagement', 'Shop Management')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                {t('dashboard.superAdmin.shopDesc', 'Create and manage jewelry shops with subscription control')}
              </p>
            </div>
          </div>

          {/* User Management */}
          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-luxury hover:shadow-luxury-lg transition-all duration-500 hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 dark:from-green-400/5 dark:to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 transition-colors duration-300">
                {t('dashboard.userManagement', 'User Management')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                {t('dashboard.superAdmin.userDesc', 'Oversee shop administrators and credentials')}
              </p>
            </div>
          </div>

          {/* Subscriptions */}
          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-luxury hover:shadow-luxury-lg transition-all duration-500 hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 dark:from-purple-400/5 dark:to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 transition-colors duration-300">
                {t('dashboard.subscriptions', 'Subscriptions')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                {t('dashboard.superAdmin.subscriptionDesc', 'Manage shop subscriptions and renewals')}
              </p>
            </div>
          </div>

          {/* Platform Settings */}
          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-luxury hover:shadow-luxury-lg transition-all duration-500 hover:scale-105 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gold-600/5 dark:from-slate-400/5 dark:to-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-slate-600 to-gold-600 shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 transition-colors duration-300">
                {t('dashboard.settings', 'Platform Settings')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                {t('dashboard.superAdmin.settingsDesc', 'Configure system-wide settings')}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Stats Banner (Optional Enhancement) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <div className="rounded-xl glass-effect border border-blue-200 dark:border-blue-700/50 p-4 text-center hover:scale-105 transition-all duration-300">
            <Store className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Shops</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">--</p>
          </div>
          <div className="rounded-xl glass-effect border border-green-200 dark:border-green-700/50 p-4 text-center hover:scale-105 transition-all duration-300">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active Users</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">--</p>
          </div>
          <div className="rounded-xl glass-effect border border-purple-200 dark:border-purple-700/50 p-4 text-center hover:scale-105 transition-all duration-300">
            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active Subscriptions</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">--</p>
          </div>
        </div>
      </div>
    </div>
  );
};