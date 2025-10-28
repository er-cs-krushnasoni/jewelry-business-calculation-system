import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { ShieldAlert, Lock } from 'lucide-react';

const Unauthorized = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getHomeRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'pro_client':
        return '/pro-client/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/calculator';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gold-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
        {/* Glass Card Container */}
        <div className="glass-effect rounded-2xl p-8 shadow-luxury-lg dark:bg-slate-800/50 backdrop-blur-xl border border-gold-200/20 dark:border-gold-500/10">
          <div>
            {/* 403 Illustration with Glow Effect */}
            <div className="mx-auto h-32 w-32 mb-8 relative animate-scale-in">
              <ShieldAlert className="w-full h-full text-amber-300/50 dark:text-amber-400/40 drop-shadow-gold animate-glow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-12 h-12 text-amber-500 dark:text-amber-400 animate-pulse" />
              </div>
            </div>

            {/* 403 Number with Gradient */}
            <h2 className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent mb-6 animate-slide-up">
              403
            </h2>
            
            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
              {t('error.unauthorized.title')}
            </h3>
            
            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-base sm:text-lg transition-colors duration-300">
              {t('error.unauthorized.message')}
            </p>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="w-full sm:w-auto px-6 py-2.5 transition-all duration-300 hover:scale-105 hover:shadow-gold border-gold-300 dark:border-gold-500/30 text-gold-700 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('error.unauthorized.goBack')}
                  </span>
                </Button>
                
                <Link to={getHomeRoute()} className="w-full sm:w-auto">
                  <Button className="w-full bg-gradient-gold hover:shadow-gold transition-all duration-300 hover:scale-105 text-white font-medium px-6 py-2.5 shadow-luxury">
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {t('error.unauthorized.goHome')}
                    </span>
                  </Button>
                </Link>
              </div>
              
              {/* Calculator Link */}
              {user && user.role !== 'super_admin' && (
                <Link 
                  to="/calculator" 
                  className="inline-flex items-center gap-1.5 text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 text-sm font-medium transition-all duration-300 hover:underline underline-offset-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {t('error.unauthorized.calculator')}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Why section - Warning Card */}
        <div className="glass-effect rounded-xl p-5 text-left shadow-luxury dark:bg-slate-800/30 backdrop-blur-xl border border-amber-200/40 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/5 transition-all duration-300">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400" />
            {t('error.unauthorized.reasonTitle')}
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-400/90 space-y-2">
            <li className="flex items-start gap-2 transition-colors duration-300">
              <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
              <span>{t('error.unauthorized.reason1')}</span>
            </li>
            <li className="flex items-start gap-2 transition-colors duration-300">
              <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
              <span>{t('error.unauthorized.reason2')}</span>
            </li>
            <li className="flex items-start gap-2 transition-colors duration-300">
              <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
              <span>{t('error.unauthorized.reason3')}</span>
            </li>
          </ul>
        </div>

        {/* Additional Help Section */}
        <div className="glass-effect rounded-xl p-6 border-t border-gold-200/30 dark:border-gold-500/10 shadow-luxury dark:bg-slate-800/30 backdrop-blur-xl transition-all duration-300">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('error.unauthorized.needHelp')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
            {t('error.unauthorized.helpMessage')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;