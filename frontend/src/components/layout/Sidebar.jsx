import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import InstallPrompt from '../pwa/InstallPrompt';
import {
  Calculator,
  Store,
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  Tag,
  Crown,
  User,
  X,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, isShopAdmin, isManager } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Safety check - don't render if user data is not available
  if (!user || !user.role) {
    return null;
  }

  // Safety check - ensure all required functions are available
  if (!isSuperAdmin || !isShopAdmin || !isManager) {
    console.error('Missing AuthContext functions in Sidebar');
    return null;
  }

  const navigationItems = [];

  // Calculator (all shop users except super admin)
  if (user.role !== 'super_admin') {
    navigationItems.push({
      name: t('nav.calculator'),
      href: '/calculator',
      icon: Calculator,
      roles: ['admin', 'manager', 'pro_client', 'client'],
      gradient: 'from-blue-500 to-cyan-500'
    });
  }

  // Super Admin Navigation
  if (isSuperAdmin && isSuperAdmin()) {
    navigationItems.push({
      name: t('nav.shops'),
      href: '/super-admin/shops',
      icon: Store,
      roles: ['super_admin'],
      gradient: 'from-purple-500 to-pink-500'
    });
  }

  // Shop Admin Navigation
  if (isShopAdmin && isShopAdmin()) {
    navigationItems.push(
      {
        name: t('nav.userManagement'),
        href: '/admin/users',
        icon: Users,
        roles: ['admin'],
        gradient: 'from-green-500 to-emerald-500'
      },
      {
        name: t('nav.categories'),
        href: '/admin/categories',
        icon: Tag,
        roles: ['admin'],
        gradient: 'from-orange-500 to-amber-500'
      },
      {
        name: t('nav.rates'),
        href: '/admin/rates',
        icon: TrendingUp,
        roles: ['admin'],
        gradient: 'from-gold-500 to-yellow-500'
      },
      {
        name: t('nav.reports_alt'),
        href: '/reports',
        icon: BarChart3,
        roles: ['admin', 'manager', 'pro_client', 'client'],
        gradient: 'from-indigo-500 to-purple-500'
      }
    );
  }

  // Manager Navigation
  if (isManager && isManager()) {
    navigationItems.push(
      {
        name: t('nav.rates'),
        href: '/manager/rates',
        icon: TrendingUp,
        roles: ['manager'],
        gradient: 'from-gold-500 to-yellow-500'
      },
      {
        name: t('nav.reports_alt'),
        href: '/reports',
        icon: BarChart3,
        roles: ['admin', 'manager', 'pro_client', 'client'],
        gradient: 'from-indigo-500 to-purple-500'
      }
    );
  }

  // Pro Client and Client - Add Reports
  if (user.role === 'pro_client' || user.role === 'client') {
    navigationItems.push({
      name: t('nav.reports_alt'),
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager', 'pro_client', 'client'],
      gradient: 'from-indigo-500 to-purple-500'
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
        `group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg transform scale-105'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:translate-x-1'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 transition-all ${
            isActive 
              ? 'bg-white/20 shadow-inner' 
              : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-600'
          }`}>
            <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'} />
          </div>
          <span className="flex-1">{item.name}</span>
          {isActive && <Sparkles size={14} className="text-white/80 animate-pulse" />}
        </>
      )}
    </NavLink>
  );

  const getRoleDisplayName = () => {
    if (isSuperAdmin && isSuperAdmin()) {
      return t('sidebar.superAdmin');
    }
    return user?.shopName || t('user.platform');
  };

  const getRoleIcon = () => {
    if (isSuperAdmin && isSuperAdmin()) {
      return <Crown size={20} className="text-yellow-500" />;
    }
    if (isShopAdmin && isShopAdmin()) {
      return <User size={20} className="text-gold-500" />;
    }
    return <User size={20} className="text-gray-500 dark:text-gray-400" />;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onClose}
          role="button"
          tabIndex={-1}
          aria-label={t('sidebar.closeMenu')}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out z-50 overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header with Gradient */}
        <div className="relative h-24 bg-gradient-gold overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-shimmer opacity-30"></div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Calculator className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg font-display">
                  {t('app.title')}
                </h2>
              </div>
            </div>
            
            {/* Close Button - Mobile Only */}
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label={t('sidebar.closeMenu')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Info Panel */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                {getRoleIcon()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.username}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {getRoleDisplayName()}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-2xs text-green-600 dark:text-green-400 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar" aria-label={t('sidebar.navigation')}>
          {filteredNavigation.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
                Navigation
              </div>
              {filteredNavigation.map((item, index) => (
                <NavItem key={index} item={item} onClick={onClose} />
              ))}
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Calculator size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t('nav.noItems')}</p>
            </div>
          )}

          {/* PWA Install Button */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
              {t('pwa.section') || 'App'}
            </div>
            <InstallPrompt trigger="button" />
          </div>
        </nav>

        {/* Footer with Version & Watermark */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="space-y-2">
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-center font-medium text-transparent bg-clip-text bg-gradient-gold">
                @developed by Krushna Soni
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
      `}</style>
    </>
  );
};

export default Sidebar;