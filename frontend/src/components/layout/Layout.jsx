import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-slate-900' : 'bg-luxury-pearl'}`}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content - Add left margin on desktop to account for sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-72">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-900">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer with Watermark */}
        <footer className="py-3 px-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} JewelCalc. All rights reserved.
            </p>
            <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-gold dark:bg-gradient-to-r dark:from-gold-400 dark:to-gold-600">
              @developed by Krushna Soni
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;