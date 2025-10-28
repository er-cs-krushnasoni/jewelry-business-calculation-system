import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import useBlockingStatus from '../../hooks/useBlockingStatus';
import BlockingMessage from '../../components/rates/BlockingMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CalculatorWrapper = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isBlocked, blockingInfo, loading, hasShop } = useBlockingStatus(30000); // Check every 30 seconds

  // Super admin doesn't have shop-based blocking
  if (user?.role === 'super_admin') {
    return children;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 animate-fade-in">
        <div className="text-center space-y-6 p-8 glass-effect rounded-2xl shadow-luxury max-w-md">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium text-lg animate-pulse">
            {t('wrapper.checkingStatus')}
          </p>
        </div>
      </div>
    );
  }

  // Show blocking message if blocked
  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 animate-fade-in">
        <BlockingMessage 
          onUnblock={() => {
            // Refresh the page or trigger a re-check
            window.location.reload();
          }} 
        />
      </div>
    );
  }

  // Render calculator if not blocked
  return children;
};

export default CalculatorWrapper;