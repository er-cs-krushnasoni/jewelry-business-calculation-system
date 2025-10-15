import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative w-full ${sizeClasses[maxWidth] || sizeClasses.medium} bg-white rounded-lg shadow-xl transform transition-all ${className}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
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
  if (!isOpen) return null;
  
  return (
    <Modal onClose={onClose} maxWidth={size} {...props}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </Modal>
  );
};

export default Modal;