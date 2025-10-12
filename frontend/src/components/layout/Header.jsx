import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';
import RateDisplay from '../rates/RateDisplay';
import { 
  Menu, 
  X, 
  LogOut, 
  Calculator, 
  Users, 
  Settings, 
  BarChart3,
  Globe
} from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        },
        {
          name: t('nav.system', 'System Overview'),
          path: '/super-admin/system',
          icon: BarChart3,
          current: location.pathname.startsWith('/super-admin/system')
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
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {/* {t('brand.name', 'Jewelry Calculator')} */}
                  {user.shopName}
                </h1>
                {/* {user?.shopName && (
                  <p className="text-sm text-gray-600">{user.shopName}</p>
                )} */}
              </div>
            </div>

            {/* Rate Display - Desktop */}
            <div className="hidden md:flex flex-1 justify-center px-4">
              <RateDisplay className="max-w-4xl" />
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

              {/* User Info and Logout */}
              <div className="flex items-center space-x-3 border-l border-gray-300 pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-600 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="small"
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

          {/* Rate Display - Mobile (below header) */}
          <div className="md:hidden border-t border-gray-200 py-2">
            <RateDisplay className="justify-center" />
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
                <option value="hi">हिंदी</option>
              </select>
            </div>

            {/* User Info and Logout */}
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
    </>
  );
};

export default Header;