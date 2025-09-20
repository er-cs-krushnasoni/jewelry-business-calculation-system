import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Calculator,
  Store,
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  Tag,
  Crown,
  ShoppingBag,
  User,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, isShopAdmin, isManager, canManageUsers } = useAuth();
  const { t } = useLanguage();

  // Safety check - don't render if user data is not available
  if (!user || !user.role) {
    return null;
  }

  // Safety check - ensure all required functions are available
  if (!isSuperAdmin || !isShopAdmin || !isManager || !canManageUsers) {
    console.error('Missing AuthContext functions in Sidebar');
    return null;
  }

  // Safely check if user exists and has a role
  if (!user || !user.role) {
    return null; // Don't render sidebar if user data is not available
  }

  const navigationItems = [];

  // Calculator (all shop users except super admin)
  if (user.role !== 'super_admin') {
    navigationItems.push({
      name: t('nav.calculator', 'Calculator'),
      href: '/calculator',
      icon: Calculator,
      roles: ['admin', 'manager', 'pro_client', 'client']
    });
  }

  // Super Admin Navigation
  if (isSuperAdmin && isSuperAdmin()) {
    navigationItems.push(
      {
        name: t('nav.shops', 'Shop Management'),
        href: '/super-admin/shops',
        icon: Store,
        roles: ['super_admin']
      },
      {
        name: t('nav.dashboard', 'Dashboard'),
        href: '/dashboard/super-admin',
        icon: BarChart3,
        roles: ['super_admin']
      }
    );
  }

  // Shop Admin Navigation
  if (isShopAdmin && isShopAdmin()) {
    navigationItems.push(
      {
        name: t('nav.userManagement', 'User Management'),
        href: '/admin/users',
        icon: Users,
        roles: ['admin']
      },
      {
        name: t('nav.categories', 'Categories'),
        href: '/admin/categories',
        icon: Tag,
        roles: ['admin']
      },
      {
        name: t('nav.rates', 'Rate Management'),
        href: '/admin/rates',
        icon: TrendingUp,
        roles: ['admin']
      },
      {
        name: t('nav.reports', 'Reports'),
        href: '/admin/reports',
        icon: BarChart3,
        roles: ['admin']
      }
    );
  }

  // Manager Navigation
  if (isManager && isManager()) {
    navigationItems.push(
      {
        name: t('nav.rates', 'Rate Management'),
        href: '/manager/rates',
        icon: TrendingUp,
        roles: ['manager']
      },
      {
        name: t('nav.reports', 'Reports'),
        href: '/manager/reports',
        icon: BarChart3,
        roles: ['manager']
      }
    );
  }

  // Settings (Super Admin and Shop Admin only)
  if (canManageUsers && canManageUsers()) {
    navigationItems.push({
      name: t('nav.settings', 'Settings'),
      href: isSuperAdmin() ? '/super-admin/settings' : '/admin/settings',
      icon: Settings,
      roles: ['super_admin', 'admin']
    });
  }

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  const NavItem = ({ item, onClick }) => (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <item.icon size={20} className="mr-3 flex-shrink-0" />
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JM</span>
            </div>
            <span className="font-bold text-gray-900">
              {t('app.title', 'Jewelry Manager')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info Panel */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {isSuperAdmin && isSuperAdmin() ? (
                <Crown size={20} className="text-yellow-600" />
              ) : isShopAdmin && isShopAdmin() ? (
                <User size={20} className="text-red-600" />
              ) : (
                <User size={20} className="text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.username}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.shopName || t('user.platform', 'Platform Admin')}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {filteredNavigation.length > 0 ? (
            filteredNavigation.map((item, index) => (
              <NavItem key={index} item={item} onClick={onClose} />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calculator size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {t('nav.noItems', 'No navigation items available')}
              </p>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            {t('app.version', 'Jewelry Manager v1.0')}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;