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
        <label htmlFor={inputId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1">{t('input.required')}</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={`absolute left-3 ${iconPosition} pointer-events-none`}>
            <div className={`${iconSize} text-gray-400`}>
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
          className={inputStyles}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || type === 'password') && (
          <div className={`absolute right-3 ${iconPosition}`}>
            {type === 'password' ? (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`${iconSize} text-gray-400 hover:text-gray-600 focus:outline-none`}
                tabIndex={-1}
                aria-label={showPassword ? t('input.passwordHide') : t('input.passwordShow')}
              >
                {showPassword ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            ) : (
              <div className={`${iconSize} text-gray-400 pointer-events-none`}>
                {rightIcon}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
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
        <label htmlFor={inputId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1">{t('input.required')}</span>}
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
        className={textareaStyles}
        {...props}
      />
      
      {/* Character count */}
      {showCount && maxLength && (
        <p className="mt-1 text-xs text-gray-500 text-right">
          {t('input.characterCount', { current: currentLength, max: maxLength })}
        </p>
      )}
      
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
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
        <label htmlFor={inputId} className={labelStyles}>
          {label}
          {required && <span className="text-red-500 ml-1">{t('input.required')}</span>}
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
        className={selectStyles}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option 
            key={typeof option === 'object' ? option.value : index} 
            value={typeof option === 'object' ? option.value : option}
          >
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
      
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Input;