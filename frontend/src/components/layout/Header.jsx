import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import RateDisplay from '../rates/RateDisplay';
import SubscriptionCountdown from '../subscription/SubscriptionCountdown';
import ProfileCredentialsModal from '../superadmin/ProfileCredentialsModal';
import DarkModeToggle from '../ui/DarkModeToggle';
import superAdminService from '../../services/superAdminService';
import toast from 'react-hot-toast';
import { 
  Menu, 
  LogOut, 
  Calculator, 
  Users, 
  Settings, 
  BarChart3,
  Globe,
  Lock,
  Sparkles
} from 'lucide-react';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getSubscriptionStatus } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { isDark } = useTheme();
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  const subscriptionStatus = getSubscriptionStatus();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateCredentials = async (credentialsData) => {
    try {
      const response = await superAdminService.updateOwnCredentials(credentialsData);
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update credentials';
      toast.error(message);
      throw error;
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [];
    
    // Calculator - available to all shop users
    if (user?.role !== 'super_admin') {
      items.push({
        name: t('nav.calculator'),
        path: '/calculator',
        icon: Calculator,
        current: location.pathname === '/calculator'
      });
    }

    // Admin-specific items
    if (user?.role === 'admin') {
      items.push(
        {
          name: t('nav.manageUsers'),
          path: '/admin/users',
          icon: Users,
          current: location.pathname.startsWith('/admin/users')
        },
        {
          name: t('nav.categories'),
          path: '/admin/categories',
          icon: Settings,
          current: location.pathname.startsWith('/admin/categories')
        },
        {
          name: t('nav.reports'),
          path: '/reports',
          icon: BarChart3,
          current: location.pathname.startsWith('/reports')
        }
      );
    }

    // Super Admin items
    if (user?.role === 'super_admin') {
      items.push(
        {
          name: t('nav.manageShops'),
          path: '/super-admin/shops',
          icon: Settings,
          current: location.pathname.startsWith('/super-admin/shops')
        }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Mobile Menu Toggle - Only triggers Sidebar */}
              <button
                onClick={onMenuToggle}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="block h-6 w-6" />
              </button>
  
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-gold-400 animate-pulse" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white font-display whitespace-nowrap">
                    {user?.shopName || t('header.jewelryCalculator')}
                  </h1>
                </div>
              </div>
            </div>
  
            {/* Desktop Actions - Right Side */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {/* Subscription Badge */}
              {subscriptionStatus && (user?.role === 'admin' || user?.role === 'manager') && (
                <div className="flex justify-center">
                  <SubscriptionCountdown 
                    subscriptionStatus={subscriptionStatus}
                    compact={true}
                  />
                </div>
              )}

              {/* Navigation Links - Compact */}
              {navigationItems.slice(0, 2).map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    item.current
                      ? 'bg-gradient-gold text-white shadow-gold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                  title={item.name}
                >
                  <item.icon className="w-4 h-4" />
                </button>
              ))}
  
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
  
              {/* Language Selector - Compact */}
              <div className="relative">
                <select
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="gu">ગુજરાતી</option>
                  <option value="hi">हिंदी</option>
                  <option value="mr">मराठी</option>
                </select>
                <Globe className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
  
              {/* User Avatar - Compact */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-300 dark:border-slate-600">
                <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-white font-semibold shadow-md cursor-pointer" title={`${user?.username} - ${user?.role?.replace('_', ' ')}`}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
  
                {/* Update Credentials Button - Only for Super Admin */}
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => setShowCredentialsModal(true)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title={t('header.updateCredentialsTitle')}
                  >
                    <Lock size={16} className="text-gray-600 dark:text-gray-300" />
                  </button>
                )}
  
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={t('header.logout')}
                >
                  <LogOut size={16} className="text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {/* Mobile Actions - Right Side */}
            <div className="flex md:hidden items-center gap-2">

              {/* Subscription Badge - Mobile Only */}
            {subscriptionStatus && (user?.role === 'admin' || user?.role === 'manager') && (
              <div className="flex md:hidden justify-center">
                <SubscriptionCountdown 
                  subscriptionStatus={subscriptionStatus}
                  compact={true}
                />
              </div>
            )}    

              {/* Dark Mode Toggle - Mobile */}
              <DarkModeToggle />
              
              {/* Language Selector - Mobile Compact */}
              <div className="relative">
                <select
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg pl-8 pr-2 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all cursor-pointer"
                >
                  <option value="en">Eng.</option>
                  <option value="gu">ગુજ.</option>
                  <option value="hi">हिंदी</option>
                  <option value="mr">मराठी</option>
                </select>
                <Globe className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>

              {/* Logout Button - Mobile */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title={t('header.logout')}
              >
                <LogOut size={16} className="text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
  
          {/* Rate Display and Subscription - Below Header (All Screens) */}
          {(['admin', 'manager'].includes(user?.role)) && (
  <div className="border-t border-gray-200 dark:border-slate-700 py-3 space-y-2 overflow-x-auto">
    <RateDisplay className="justify-center min-w-max" />
  </div>
)}
        </div>
      </header>
  
      {/* Credentials Modal */}
      {showCredentialsModal && user?.role === 'super_admin' && (
        <ProfileCredentialsModal
          onClose={() => setShowCredentialsModal(false)}
          onSubmit={handleUpdateCredentials}
          currentUsername={user.username}
        />
      )}
    </>
  );
};

export default Header;