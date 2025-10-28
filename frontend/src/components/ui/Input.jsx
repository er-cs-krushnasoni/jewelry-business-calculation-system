import React, { useState, forwardRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  labelClassName = '',
  id,
  name,
  autoComplete,
  ...props
}, ref) => {
  const { t } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Base input styles
  const baseInputStyles = 'block w-full transition-colors duration-200 focus:outline-none';
  
  // Size variants
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };

  // Style variants
  const variants = {
    default: `border border-gray-300 rounded-md bg-white placeholder-gray-400
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error ? 'border-red-300 focus:ring-red-500' : ''}`,
    filled: `border-0 bg-gray-100 rounded-md placeholder-gray-400
             focus:ring-2 focus:ring-blue-500 focus:bg-white
             disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
             ${error ? 'bg-red-50 focus:ring-red-500' : ''}`,
    outlined: `border-2 border-gray-200 rounded-md bg-transparent placeholder-gray-400
               focus:border-blue-500 focus:ring-0
               disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
               ${error ? 'border-red-300 focus:border-red-500' : ''}`,
    underlined: `border-0 border-b-2 border-gray-200 rounded-none bg-transparent placeholder-gray-400
                 focus:border-blue-500 focus:ring-0 px-0
                 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                 ${error ? 'border-red-300 focus:border-red-500' : ''}`
  };

  // Combine styles
  const inputStyles = [
    baseInputStyles,
    sizes[size] || sizes.md,
    variants[variant] || variants.default,
    leftIcon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '',
    rightIcon || type === 'password' ? (size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10') : '',
    className
  ].filter(Boolean).join(' ');

  // Label styles
  const labelStyles = [
    'block text-sm font-medium mb-1',
    error ? 'text-red-700' : 'text-gray-700',
    disabled ? 'text-gray-400' : '',
    labelClassName
  ].filter(Boolean).join(' ');

  // Handle focus
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  // Handle blur
  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Icon size based on input size
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const iconPosition = size === 'sm' ? 'top-2' : size === 'lg' ? 'top-3' : 'top-2.5';

  return (
    <div className={`relative ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className={[
          'block text-sm font-semibold mb-2 transition-colors duration-200',
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-slate-700 dark:text-slate-200',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          labelClassName
        ].filter(Boolean).join(' ')}>
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1 font-normal">
              {t('input.required')}
            </span>
          )}
        </label>
      )}
  
      {/* Input Container */}
      <div className="relative group">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`absolute left-3 ${iconPosition} pointer-events-none z-10 transition-colors duration-200`}>
            <div className={`${iconSize} ${
              error 
                ? 'text-red-500 dark:text-red-400' 
                : isFocused 
                  ? 'text-gold-500 dark:text-gold-400' 
                  : 'text-slate-400 dark:text-slate-500'
            }`}>
              {leftIcon}
            </div>
          </div>
        )}
  
        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          className={[
            baseInputStyles,
            sizes[size] || sizes.md,
            // Base styles with luxury theme
            'rounded-xl border-2 font-medium transition-all duration-300',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            
            // Variant-specific styles with dark mode
            variant === 'default' && [
              'bg-white dark:bg-slate-900/50',
              'border-slate-200 dark:border-slate-700',
              error 
                ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20' 
                : 'focus:border-gold-500 dark:focus:border-gold-400 focus:ring-gold-500/20 dark:focus:ring-gold-400/20 hover:border-gold-300 dark:hover:border-gold-600',
              'focus:ring-4',
              'shadow-sm hover:shadow-md dark:shadow-gold/5 dark:hover:shadow-gold/10',
            ].filter(Boolean).join(' '),
            
            variant === 'filled' && [
              'bg-slate-50 dark:bg-slate-800/50 border-transparent',
              error 
                ? 'focus:bg-red-50 dark:focus:bg-red-900/20 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20' 
                : 'focus:bg-white dark:focus:bg-slate-900/70 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-gold-500/20 dark:focus:ring-gold-400/20 hover:bg-white dark:hover:bg-slate-900/50',
              'focus:ring-4',
            ].filter(Boolean).join(' '),
            
            variant === 'outlined' && [
              'bg-transparent border-2',
              'border-slate-300 dark:border-slate-600',
              error 
                ? 'focus:border-red-500 dark:focus:border-red-400' 
                : 'focus:border-gold-500 dark:focus:border-gold-400 hover:border-gold-400 dark:hover:border-gold-500',
            ].filter(Boolean).join(' '),
            
            variant === 'underlined' && [
              'bg-transparent border-0 border-b-2 rounded-none px-0',
              'border-slate-300 dark:border-slate-600',
              error 
                ? 'focus:border-red-500 dark:focus:border-red-400' 
                : 'focus:border-gold-500 dark:focus:border-gold-400',
            ].filter(Boolean).join(' '),
            
            // Text colors
            'text-slate-900 dark:text-slate-100',
            
            // Disabled state
            disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/30',
            
            // Icon padding
            leftIcon ? (size === 'sm' ? 'pl-9' : size === 'lg' ? 'pl-12' : 'pl-10') : '',
            rightIcon || type === 'password' ? (size === 'sm' ? 'pr-9' : size === 'lg' ? 'pr-12' : 'pr-10') : '',
            
            className
          ].filter(Boolean).join(' ')}
          {...props}
        />
  
        {/* Right Icon or Password Toggle */}
        {(rightIcon || type === 'password') && (
          <div className={`absolute right-3 ${iconPosition} z-10`}>
            {type === 'password' ? (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`${iconSize} transition-all duration-200 focus:outline-none ${
                  error 
                    ? 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-gold-600 dark:hover:text-gold-400 hover:scale-110'
                }`}
                tabIndex={-1}
                aria-label={showPassword ? t('input.passwordHide') : t('input.passwordShow')}
              >
                {showPassword ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="drop-shadow-sm">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="drop-shadow-sm">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            ) : (
              <div className={`${iconSize} pointer-events-none transition-colors duration-200 ${
                error 
                  ? 'text-red-500 dark:text-red-400' 
                  : isFocused 
                    ? 'text-gold-500 dark:text-gold-400' 
                    : 'text-slate-400 dark:text-slate-500'
              }`}>
                {rightIcon}
              </div>
            )}
          </div>
        )}
  
        {/* Focus ring effect */}
        {isFocused && !disabled && !error && (
          <div className="absolute inset-0 rounded-xl bg-gradient-gold opacity-5 dark:opacity-10 pointer-events-none animate-pulse" />
        )}
      </div>
  
      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p className={`mt-2 text-sm font-medium transition-colors duration-200 flex items-start gap-1 ${
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-slate-500 dark:text-slate-400'
        }`}>
          {error && (
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{error || helperText}</span>
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
export const Textarea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 3,
  resize = 'vertical',
  className = '',
  containerClassName = '',
  labelClassName = '',
  id,
  name,
  maxLength,
  showCount = false,
  ...props
}, ref) => {
  const { t } = useLanguage();
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const textareaStyles = [
    'block w-full px-3 py-2 text-sm transition-colors duration-200',
    'border border-gray-300 rounded-md bg-white placeholder-gray-400',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    resize === 'none' ? 'resize-none' : resize === 'horizontal' ? 'resize-x' : 'resize-y',
    error ? 'border-red-300 focus:ring-red-500' : '',
    className
  ].filter(Boolean).join(' ');

  const labelStyles = [
    'block text-sm font-medium mb-1',
    error ? 'text-red-700' : 'text-gray-700',
    disabled ? 'text-gray-400' : '',
    labelClassName
  ].filter(Boolean).join(' ');

  const currentLength = value ? value.length : 0;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className={[
          'block text-sm font-semibold mb-2 transition-colors duration-200',
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-slate-700 dark:text-slate-200',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          labelClassName
        ].filter(Boolean).join(' ')}>
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1 font-normal">
              {t('input.required')}
            </span>
          )}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={[
          'block w-full px-4 py-3 text-sm font-medium transition-all duration-300',
          'rounded-xl border-2',
          'bg-white dark:bg-slate-900/50',
          'border-slate-200 dark:border-slate-700',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-4',
          error 
            ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20' 
            : 'focus:border-gold-500 dark:focus:border-gold-400 focus:ring-gold-500/20 dark:focus:ring-gold-400/20 hover:border-gold-300 dark:hover:border-gold-600',
          'shadow-sm hover:shadow-md dark:shadow-gold/5 dark:hover:shadow-gold/10',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/30',
          resize === 'none' ? 'resize-none' : resize === 'horizontal' ? 'resize-x' : 'resize-y',
          className
        ].filter(Boolean).join(' ')}
        {...props}
      />
      
      {/* Character count */}
      {showCount && maxLength && (
        <p className={`mt-2 text-xs font-medium text-right transition-colors duration-200 ${
          currentLength > maxLength * 0.9 
            ? 'text-red-500 dark:text-red-400' 
            : 'text-slate-500 dark:text-slate-400'
        }`}>
          {t('input.characterCount', { current: currentLength, max: maxLength })}
        </p>
      )}
      
      {(helperText || error) && (
        <p className={`mt-2 text-sm font-medium transition-colors duration-200 flex items-start gap-1 ${
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-slate-500 dark:text-slate-400'
        }`}>
          {error && (
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{error || helperText}</span>
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
export const Select = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  containerClassName = '',
  labelClassName = '',
  id,
  name,
  ...props
}, ref) => {
  const { t } = useLanguage();
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };

  const selectStyles = [
    'block w-full transition-colors duration-200',
    'border border-gray-300 rounded-md bg-white',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    sizes[size] || sizes.md,
    error ? 'border-red-300 focus:ring-red-500' : '',
    className
  ].filter(Boolean).join(' ');

  const labelStyles = [
    'block text-sm font-medium mb-1',
    error ? 'text-red-700' : 'text-gray-700',
    disabled ? 'text-gray-400' : '',
    labelClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className={[
          'block text-sm font-semibold mb-2 transition-colors duration-200',
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-slate-700 dark:text-slate-200',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          labelClassName
        ].filter(Boolean).join(' ')}>
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400 ml-1 font-normal">
              {t('input.required')}
            </span>
          )}
        </label>
      )}
      
      <select
        ref={ref}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={[
          'block w-full transition-all duration-300 appearance-none',
          'rounded-xl border-2 font-medium',
          'bg-white dark:bg-slate-900/50',
          'border-slate-200 dark:border-slate-700',
          'text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-4',
          error 
            ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20' 
            : 'focus:border-gold-500 dark:focus:border-gold-400 focus:ring-gold-500/20 dark:focus:ring-gold-400/20 hover:border-gold-300 dark:hover:border-gold-600',
          'shadow-sm hover:shadow-md dark:shadow-gold/5 dark:hover:shadow-gold/10',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/30',
          // Custom dropdown arrow
          'bg-no-repeat bg-[length:1.5em_1.5em] bg-[position:right_0.5rem_center]',
          'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23D4AF37\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")]',
          'dark:bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23F4D03F\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")]',
          'pr-10',
          sizes[size] || sizes.md,
          className
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {placeholder && (
          <option value="" disabled className="text-slate-400 dark:text-slate-500">
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option 
            key={typeof option === 'object' ? option.value : index} 
            value={typeof option === 'object' ? option.value : option}
            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
      
      {(helperText || error) && (
        <p className={`mt-2 text-sm font-medium transition-colors duration-200 flex items-start gap-1 ${
          error 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-slate-500 dark:text-slate-400'
        }`}>
          {error && (
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{error || helperText}</span>
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;