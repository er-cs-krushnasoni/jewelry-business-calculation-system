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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">{t('wrapper.checkingStatus')}</p>
        </div>
      </div>
    );
  }

  // Show blocking message if blocked
  if (isBlocked) {
    return (
      <BlockingMessage 
        onUnblock={() => {
          // Refresh the page or trigger a re-check
          window.location.reload();
        }} 
      />
    );
  }

  // Render calculator if not blocked
  return children;
};

export default CalculatorWrapper;