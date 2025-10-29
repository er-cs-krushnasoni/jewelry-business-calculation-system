import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import DarkModeToggle from '../ui/DarkModeToggle';
import { User, Lock, Globe, Sparkles } from 'lucide-react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const { login, error, clearError, isAuthenticated, loading, user } = useAuth();
  const { t, currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { isDark } = useTheme();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-gold-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gold-600 dark:text-gold-400 font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-gold-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold-300/20 dark:bg-gold-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-300/20 dark:bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10 animate-fade-in">
        {/* Top Controls */}
        <div className="flex justify-between items-center">
          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          {/* Language Selector */}
          <div className="relative">
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none glass-effect bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gold-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gold-500 dark:text-gold-400 pointer-events-none" />
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-effect bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-luxury-lg dark:shadow-2xl border border-gold-100 dark:border-slate-700 p-8 sm:p-10 transition-all duration-300 animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="mx-auto h-20 w-20 bg-gradient-gold dark:bg-gradient-to-br dark:from-gold-500 dark:to-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-gold hover:scale-110 transition-transform duration-300 animate-glow">
              <Sparkles className="text-white w-10 h-10" strokeWidth={2.5} />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-600 to-amber-600 dark:from-gold-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
              {t('auth.login.title')}
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-up">
              <p className="text-red-700 dark:text-red-400 text-sm text-center font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Username Field */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.login.username')}
              </label>
              <div className="relative group">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder={t('auth.login.username')}
                  className="pl-12 pr-4 h-12 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={isSubmitting}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-gold-500 dark:group-focus-within:text-gold-400 transition-colors duration-300">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative group">
  <Input
    id="password"
    name="password"
    type="password"
    required
    autoComplete="current-password"
    value={formData.password}
    onChange={handleInputChange}
    placeholder={t('auth.login.password')}
    className="h-12 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
    disabled={isSubmitting}
    leftIcon={<Lock className="w-5 h-5" />}
  />
</div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button
                type="submit"
                disabled={isSubmitting || !formData.username || !formData.password}
                className={`w-full h-12 rounded-xl font-semibold text-base transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gold-500/50 dark:focus:ring-gold-400/50 ${
                  isSubmitting || !formData.username || !formData.password
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-gold dark:bg-gradient-to-r dark:from-gold-500 dark:to-amber-600 text-white shadow-lg shadow-gold-500/30 dark:shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/40 dark:hover:shadow-gold-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="small" />
                    <span>{t('auth.login.signingin')}</span>
                  </div>
                ) : (
                  <span>{t('auth.login.signin')}</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer Decoration */}
          <div className="mt-8 pt-6 border-t border-gold-100 dark:border-slate-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              JewelCalc
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;