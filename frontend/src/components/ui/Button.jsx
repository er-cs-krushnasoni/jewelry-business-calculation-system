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
  translateKey = null, // Optional translation key for button text
  ...props
}) => {
  const { t } = useLanguage();

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    info: 'bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500',
    link: 'text-blue-600 hover:text-blue-500 underline-offset-4 hover:underline focus:ring-blue-500'
  };

  // Size styles
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  // Combine styles
  const buttonStyles = [
    baseStyles,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  // FIXED: Handle click properly for submit buttons
  const handleClick = (e) => {
    // For submit buttons, don't interfere with form submission
    if (type === 'submit') {
      // Let the form handle the submission, but still call onClick if provided
      if (!loading && !disabled && onClick) {
        onClick(e);
      }
      // Don't prevent default - let form submission proceed naturally
      return;
    }
    
    // For non-submit buttons, handle normally
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
          className="mr-2 text-current" 
        />
      )}
      {buttonContent}
    </button>
  );
};

// Icon Button Component
export const IconButton = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const iconSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3'
  };

  return (
    <Button
      variant={variant}
      className={`${iconSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

// Button Group Component
export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`} role="group">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          let groupClassName = '';
          if (!isFirst && !isLast) {
            groupClassName = 'rounded-none border-l-0';
          } else if (isFirst) {
            groupClassName = 'rounded-r-none';
          } else if (isLast) {
            groupClassName = 'rounded-l-none border-l-0';
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

// Floating Action Button
export const FloatingActionButton = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Button
      variant="primary"
      className={`fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default Button;