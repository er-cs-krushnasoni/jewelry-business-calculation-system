import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ROLES, getRoleName, getRoleColor } from '../../constants/roles';
import { ChevronDown, User, LogOut, Settings, Globe, Menu, X } from 'lucide-react';

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsLanguageDropdownOpen(false);
  };

  const getRoleBadgeClasses = (role) => {
    const color = getRoleColor(role);
    return `px-2 py-1 text-xs font-medium rounded-full bg-${color}-100 text-${color}-800`;
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo & Menu Toggle */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              {t('app.title', 'Jewelry Manager')}
            </span>
          </Link>
        </div>

        {/* Center Section - Shop Info (for shop users) */}
        {user?.shopName && (
          <div className="hidden md:flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-gray-600">{t('header.shop')}</span>
            <span className="font-semibold text-gray-900">{user.shopName}</span>
            {user.shopCode && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {user.shopCode}
              </span>
            )}
          </div>
        )}

        {/* Right Section - Language & User Menu */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Globe size={16} />
              <span className="hidden sm:inline">
                {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}
              </span>
              <ChevronDown size={14} />
            </button>

            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                        currentLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.username}
                </div>
                <div className="text-xs text-gray-500">
                  <span className={getRoleBadgeClasses(user?.role)}>
                    {getRoleName(user?.role)}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.username}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getRoleName(user?.role)}
                  </div>
                  {user?.shopName && (
                    <div className="text-xs text-gray-400 mt-1">
                      {user.shopName}
                    </div>
                  )}
                </div>
                
                <div className="py-1">
                  {(user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) && (
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Settings size={16} className="mr-3" />
                      {t('header.profile', 'Profile Settings')}
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={16} className="mr-3" />
                    {t('header.logout', 'Logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Shop Info */}
      {user?.shopName && (
        <div className="md:hidden mt-2 flex items-center justify-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
          <span className="text-sm text-gray-600">{t('header.shop')}</span>
          <span className="font-semibold text-gray-900">{user.shopName}</span>
          {user.shopCode && (
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {user.shopCode}
            </span>
          )}
        </div>
      )}

      {/* Close dropdowns when clicking outside */}
      {(isProfileDropdownOpen || isLanguageDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileDropdownOpen(false);
            setIsLanguageDropdownOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;