import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';
import RateDisplay from '../rates/RateDisplay';
import SubscriptionCountdown from '../subscription/SubscriptionCountdown';
import ProfileCredentialsModal from '../superadmin/ProfileCredentialsModal'; // ADD THIS IMPORT
import superAdminService from '../../services/superAdminService'; // ADD THIS IMPORT
import toast from 'react-hot-toast'; // ADD THIS IMPORT
import { 
  Menu, 
  X, 
  LogOut, 
  Calculator, 
  Users, 
  Settings, 
  BarChart3,
  Globe,
  Lock // ADD THIS IMPORT
} from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getSubscriptionStatus } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false); // ADD THIS STATE

  const subscriptionStatus = getSubscriptionStatus();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navigateAndClose = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  // ADD THIS FUNCTION - Handle credentials update
  const handleUpdateCredentials = async (credentialsData) => {
    try {
      const response = await superAdminService.updateOwnCredentials(credentialsData);
      if (response.data.success) {
        toast.success(response.data.message);
        // Optional: You may want to logout and re-login if username changed
        // Or refresh user data from AuthContext
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
        name: t('nav.calculator', 'Calculator'),
        path: '/calculator',
        icon: Calculator,
        current: location.pathname === '/calculator'
      });
    }

    // Admin-specific items
    if (user?.role === 'admin') {
      items.push(
        {
          name: t('nav.users', 'Manage Users'),
          path: '/admin/users',
          icon: Users,
          current: location.pathname.startsWith('/admin/users')
        },
        {
          name: t('nav.categories', 'Categories'),
          path: '/admin/categories',
          icon: Settings,
          current: location.pathname.startsWith('/admin/categories')
        },
        {
          name: t('nav.reports', 'Reports'),
          path: '/admin/reports',
          icon: BarChart3,
          current: location.pathname.startsWith('/admin/reports')
        }
      );
    }

    // Super Admin items
    if (user?.role === 'super_admin') {
      items.push(
        {
          name: t('nav.shops', 'Manage Shops'),
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.shopName ||  'Jewelry Calculator'}
                </h1>
              </div>
            </div>

            {/* Rate Display and Subscription - Desktop */}
            <div className="hidden md:flex flex-1 justify-center items-center gap-4 px-4">
              <RateDisplay className="max-w-2xl" />
              
              {/* Subscription Badge - Only for shop admin and manager */}
              {subscriptionStatus && (user?.role === 'admin' || user?.role === 'manager') && (
                <SubscriptionCountdown 
                  subscriptionStatus={subscriptionStatus}
                  compact={true}
                />
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Navigation Links */}
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 inline mr-2" />
                  {item.name}
                </button>
              ))}

              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="gu">ગુજરાતી</option>
                  <option value="hi">हिंदी</option>
                </select>
                <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* User Info and Actions */}
              <div className="flex items-center space-x-3 border-l border-gray-300 pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-600 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>

                {/* Update Credentials Button - Only for Super Admin */}
                {user?.role === 'super_admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCredentialsModal(true)}
                    className="flex items-center space-x-2"
                    title="Update your credentials"
                  >
                    <Lock size={16} />
                  </Button>
                )}

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>{t('auth.logout', 'Logout')}</span>
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Rate Display and Subscription - Mobile (below header) */}
          <div className="md:hidden border-t border-gray-200 py-2 space-y-2">
            <RateDisplay className="justify-center" />
            
            {/* Subscription Badge - Mobile */}
            {subscriptionStatus && user?.role !== 'super_admin' && (
              <div className="flex justify-center">
                <SubscriptionCountdown 
                  subscriptionStatus={subscriptionStatus}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-gray-200 shadow-lg">
            {/* Navigation Links */}
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigateAndClose(item.path)}
                className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}

            {/* Language Selector */}
            <div className="px-3 py-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.language', 'Language')}
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="gu">ગુજરાતી</option>
                <option value="hi">हिંदी</option>
              </select>
            </div>

            {/* User Info and Actions - Mobile */}
            <div className="border-t border-gray-300 pt-4 pb-3">
              <div className="px-3 mb-3">
                <p className="text-base font-medium text-gray-900">{user?.username}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
                {user?.shopName && (
                  <p className="text-sm text-blue-600 mt-1">{user.shopName}</p>
                )}
              </div>

              {/* Update Credentials Button - Mobile, Only for Super Admin */}
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => {
                    setShowCredentialsModal(true);
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors mb-2"
                >
                  <Lock className="w-5 h-5 mr-3" />
                  Update Credentials
                </button>
              )}

              {/* Logout Button - Mobile */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('auth.logout', 'Logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal - Only for Super Admin */}
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