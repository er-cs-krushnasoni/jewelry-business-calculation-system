import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const DarkModeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-700 to-slate-900' 
          : 'bg-gradient-gold'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {/* Toggle Circle */}
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-slate-700" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </span>

      {/* Background Icons */}
      <span className="absolute inset-0 flex items-center justify-between px-2">
        <Sun className={`w-4 h-4 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-50 text-white'}`} />
        <Moon className={`w-4 h-4 transition-opacity duration-300 ${isDark ? 'opacity-50 text-white' : 'opacity-0'}`} />
      </span>
    </button>
  );
};

export default DarkModeToggle;