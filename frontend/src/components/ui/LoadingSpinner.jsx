import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'gold', 
  text = '', 
  translateKey = null,
  className = '' 
}) => {
  const { t } = useLanguage();

  // Size configurations
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Luxury color configurations with dark mode support
  const colors = {
    gold: 'text-gold-500 dark:text-gold-400',
    silver: 'text-silver-500 dark:text-silver-400',
    primary: 'text-primary-600 dark:text-primary-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  const spinnerSize = sizes[size] || sizes.md;
  const spinnerColor = colors[color] || colors.gold;

  // Determine text to display
  const displayText = translateKey ? t(translateKey) : text;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Luxury Spinner with glow effect */}
      <div className="relative">
        <svg
          className={`animate-spin ${spinnerSize} ${spinnerColor} transition-all duration-300`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          ></circle>
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {/* Subtle glow effect */}
        <div className={`absolute inset-0 ${spinnerSize} ${spinnerColor} opacity-20 blur-sm animate-pulse`}></div>
      </div>
      
      {/* Optional text with luxury styling */}
      {displayText && (
        <p className={`mt-3 text-sm font-medium ${spinnerColor} animate-pulse tracking-wide`}>
          {displayText}
        </p>
      )}
    </div>
  );
};

// Alternative luxury dot spinner
export const DotSpinner = ({ className = '' }) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="w-2.5 h-2.5 bg-gradient-gold rounded-full animate-bounce shadow-gold"></div>
      <div className="w-2.5 h-2.5 bg-gradient-gold rounded-full animate-bounce shadow-gold" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2.5 h-2.5 bg-gradient-gold rounded-full animate-bounce shadow-gold" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

// Inline spinner for buttons with luxury styling
export const InlineSpinner = ({ size = 'sm', className = '' }) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className} transition-all duration-300`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      ></circle>
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

// Full page loading spinner with luxury glass effect
export const FullPageSpinner = ({ text = '', translateKey = 'spinner.loading' }) => {
  const { t } = useLanguage();
  const displayText = text || t(translateKey);

  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
      <div className="text-center bg-white dark:bg-slate-800 rounded-xl shadow-luxury-lg p-8 glass-effect animate-scale-in">
        <LoadingSpinner size="xl" color="gold" text={displayText} />
      </div>
    </div>
  );
};

export default LoadingSpinner;