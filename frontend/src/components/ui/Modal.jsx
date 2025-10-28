import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const Modal = ({ 
  onClose, 
  title, 
  children, 
  maxWidth = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) => {
  const { t } = useLanguage();

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Size classes - support both size and maxWidth props
  const sizeClasses = {
    sm: 'max-w-md',
    small: 'max-w-md',
    md: 'max-w-lg',
    medium: 'max-w-lg',
    lg: 'max-w-2xl',
    large: 'max-w-2xl',
    xl: 'max-w-4xl',
    xlarge: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'max-w-7xl',
    full: 'max-w-full mx-4'
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop with glass effect and blur */}
      <div 
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all duration-300"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div 
          className={`relative w-full ${sizeClasses[maxWidth] || sizeClasses.medium} bg-white dark:bg-slate-900 rounded-xl shadow-luxury-lg dark:shadow-gold/10 transform transition-all duration-300 animate-scale-in border border-gold-200/20 dark:border-gold-500/20 ${className}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title || t('modal.closeModal')}
        >
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold rounded-t-xl" />
          
          {/* Render children directly - they contain their own structure */}
          {children}
        </div>
      </div>
    </div>
  );
};

// Legacy wrapper for old API
export const LegacyModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  ...props 
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;
  
  return (
    <Modal onClose={onClose} maxWidth={size} {...props}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between p-6 border-b border-gold-200/30 dark:border-slate-700/50 bg-gradient-to-r from-gold-50/50 to-transparent dark:from-slate-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gold-600 dark:text-gray-500 dark:hover:text-gold-400 transition-all duration-200 p-1.5 rounded-full hover:bg-gold-100 dark:hover:bg-slate-800 hover:shadow-gold"
            aria-label={t('modal.close')}
          >
            <X size={20} />
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6 text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </Modal>
  );
};

export default Modal;