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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          {/* 403 Illustration */}
          <div className="mx-auto h-32 w-32 text-red-300 mb-8 relative">
            <ShieldAlert className="w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-12 h-12 text-red-400" />
            </div>
          </div>

          <h2 className="text-9xl font-bold text-red-300 mb-4">403</h2>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('error.unauthorized.title')}
          </h3>
          
          <p className="text-gray-600 mb-8">
            {t('error.unauthorized.message')}
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {t('error.unauthorized.goBack')}
              </Button>
              
              <Link to={getHomeRoute()}>
                <Button className="w-full sm:w-auto">
                  {t('error.unauthorized.goHome')}
                </Button>
              </Link>
            </div>
            
            {user && user.role !== 'super_admin' && (
              <Link 
                to="/calculator" 
                className="inline-block text-blue-600 hover:text-blue-500 text-sm"
              >
                {t('error.unauthorized.calculator')}
              </Link>
            )}
          </div>
        </div>

        {/* Why section */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
          <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
            <ShieldAlert size={16} />
            {t('error.unauthorized.reasonTitle')}
          </h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>{t('error.unauthorized.reason1')}</li>
            <li>{t('error.unauthorized.reason2')}</li>
            <li>{t('error.unauthorized.reason3')}</li>
          </ul>
        </div>

        {/* Additional help */}
        <div className="border-t border-gray-200 pt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {t('error.unauthorized.needHelp')}
          </h4>
          <p className="text-sm text-gray-600">
            {t('error.unauthorized.helpMessage')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;