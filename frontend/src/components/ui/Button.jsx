import React from 'react';
import { InlineSpinner } from './LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  translateKey = null,
  ...props
}) => {
  const { t } = useLanguage();

  // Base styles with luxury transitions and focus states
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 dark:focus:ring-offset-slate-900';

  // Luxury variant styles with dark mode support
  const variants = {
    primary: 'bg-gradient-gold text-white shadow-luxury hover:shadow-luxury-lg focus:ring-gold-500 dark:shadow-gold/20 dark:hover:shadow-gold/40',
    secondary: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-luxury focus:ring-slate-500 dark:from-slate-700 dark:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700',
    outline: 'border-2 border-gold-400 hover:bg-gold-50 text-gold-700 focus:ring-gold-500 dark:border-gold-500 dark:hover:bg-gold-900/20 dark:text-gold-400 dark:hover:text-gold-300',
    ghost: 'hover:bg-gold-50 text-slate-700 focus:ring-gold-500 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-gold-400',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-luxury focus:ring-red-500 dark:from-red-700 dark:to-red-800',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-luxury focus:ring-green-500 dark:from-green-700 dark:to-green-800',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-luxury focus:ring-yellow-500 dark:from-yellow-700 dark:to-yellow-800',
    info: 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-luxury focus:ring-cyan-500 dark:from-cyan-700 dark:to-cyan-800',
    link: 'text-gold-600 hover:text-gold-700 underline-offset-4 hover:underline focus:ring-gold-500 dark:text-gold-400 dark:hover:text-gold-300'
  };

  // Size styles with proper spacing
  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
    xl: 'px-10 py-4 text-lg'
  };

  // Combine styles
  const buttonStyles = [
    baseStyles,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  // Handle click properly for submit buttons
  const handleClick = (e) => {
    if (type === 'submit') {
      if (!loading && !disabled && onClick) {
        onClick(e);
      }
      return;
    }
    
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };

  // Determine button content
  const buttonContent = translateKey ? t(translateKey) : children;

  return (
    <button
      type={type}
      className={buttonStyles}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <InlineSpinner 
          size="sm" 
          className="mr-2 text-current animate-glow" 
        />
      )}
      {buttonContent}
    </button>
  );
};

// Icon Button Component with luxury styling
export const IconButton = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const iconSizes = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
    xl: 'p-4'
  };

  return (
    <Button
      variant={variant}
      className={`${iconSizes[size]} rounded-full ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

// Button Group Component with luxury styling
export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div 
      className={`inline-flex rounded-xl shadow-luxury overflow-hidden dark:shadow-gold/10 ${className}`} 
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let groupClassName = 'hover:scale-100'; // Override individual button scale
          if (!isFirst && !isLast) {
            groupClassName += ' rounded-none border-l-0';
          } else if (isFirst) {
            groupClassName += ' rounded-r-none';
          } else if (isLast) {
            groupClassName += ' rounded-l-none border-l-0';
          }

          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${groupClassName}`.trim()
          });
        }
        return child;
      })}
    </div>
  );
};

// Floating Action Button with luxury styling
export const FloatingActionButton = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Button
      variant="primary"
      className={`fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-luxury-lg hover:shadow-gold animate-glow z-50 ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default Button;