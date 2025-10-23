import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Eye, EyeOff, User, Lock, Globe } from 'lucide-react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const { login, error, clearError, isAuthenticated, loading, user } = useAuth();
  const { t, currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug function to add logs
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
    console.log(`LoginForm Debug - ${timestamp}: ${message}`);
  };

  // Redirect if already authenticated
  useEffect(() => {
    addDebugLog(`Auth status change - isAuthenticated: ${isAuthenticated}, loading: ${loading}, user: ${user?.username || 'null'}`);
    
    if (isAuthenticated && !loading) {
      const from = location.state?.from?.pathname || '/';
      addDebugLog(`Redirecting authenticated user to: ${from}`);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, loading, user]);

  // Monitor error changes
  useEffect(() => {
    addDebugLog(`Error state changed: ${error || 'null'}`);
  }, [error]);

  // Prevent default form submission and page refresh
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addDebugLog('Form submitted');
    
    if (!formData.username || !formData.password) {
      addDebugLog('Validation failed - missing username or password');
      return;
    }

    if (isSubmitting) {
      addDebugLog('Already submitting, ignoring duplicate submission');
      return;
    }

    setIsSubmitting(true);
    addDebugLog('Starting login process');

    try {
      const loginData = {
        username: formData.username.trim(),
        password: formData.password,
        deviceInfo: navigator.userAgent || 'Unknown Device',
        ipAddress: 'Client IP'
      };

      addDebugLog(`Calling login with username: ${loginData.username}`);
      
      const result = await login(loginData);
      
      addDebugLog(`Login result: ${JSON.stringify({ success: result.success, message: result.message })}`);

      if (result.success) {
        addDebugLog('Login successful, clearing form');
        setFormData({ username: '', password: '' });
      } else {
        addDebugLog(`Login failed: ${result.message}`);
        // Don't clear form on failure
      }
      
    } catch (error) {
      addDebugLog(`Login error caught: ${error.message}`);
      console.error('Login error caught in form:', error);
    } finally {
      addDebugLog('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing (optional)
    if (error) {
      addDebugLog('Clearing error due to input change');
      clearError();
    }
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
  };

  // Don't render anything while loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Language Selector */}
        <div className="flex justify-end">
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">JM</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.login.title')}
            </h2>
            <p className="text-gray-600">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.username')}
              </label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder={t('auth.login.username')}
                  className="pl-10"
                  disabled={isSubmitting}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('auth.login.password')}
                  className="pl-10 pr-10"
                  disabled={isSubmitting}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="large"
                className="w-full"
                disabled={isSubmitting || !formData.username || !formData.password}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    {t('auth.login.signingin')}
                  </div>
                ) : (
                  t('auth.login.signin')
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            {t('app.version')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;