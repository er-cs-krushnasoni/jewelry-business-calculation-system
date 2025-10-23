import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const NotFound = () => {
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
          {/* 404 Illustration */}
          <div className="mx-auto h-32 w-32 text-gray-300 mb-8">
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                fillRule="evenodd"
                d="M9 2.221V7H4.221a2 2 0 01.365-.5L8.5 2.586A2 2 0 019 2.22zM11 2v5a2 2 0 01-2 2H4v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H11z"
                clipRule="evenodd"
              />
              <path d="M12 12a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" />
              <circle cx="12" cy="9" r="1" />
            </svg>
          </div>

          <h2 className="text-9xl font-bold text-gray-300 mb-4">404</h2>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('error.notFound.title')}
          </h3>
          
          <p className="text-gray-600 mb-8">
            {t('error.notFound.message')}
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {t('error.notFound.goBack')}
              </Button>
              
              <Link to={getHomeRoute()}>
                <Button className="w-full sm:w-auto">
                  {t('error.notFound.goHome')}
                </Button>
              </Link>
            </div>
            
            {user && user.role !== 'super_admin' && (
              <Link 
                to="/calculator" 
                className="inline-block text-blue-600 hover:text-blue-500 text-sm"
              >
                {t('error.notFound.calculator')}
              </Link>
            )}
          </div>
        </div>

        {/* Additional help */}
        <div className="border-t border-gray-200 pt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {t('error.notFound.needHelp')}
          </h4>
          <p className="text-sm text-gray-600">
            {t('error.notFound.helpMessage')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;