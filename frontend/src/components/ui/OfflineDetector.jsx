import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const OfflineDetector = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  
  // Safe language hook usage with fallback
  let t = (key) => {
    const fallbackTexts = {
      'offline.noConnection': 'No Internet Connection',
      'offline.functionalityDisabled': 'All functionality is disabled. Please check your connection.',
      'offline.status': 'Offline',
      'offline.reconnected': 'Connection Restored',
      'offline.backOnline': 'You are back online. All features are now available.',
      'offline.online': 'Online'
    };
    return fallbackTexts[key] || key;
  };

  try {
    const languageContext = useLanguage();
    if (languageContext && languageContext.t) {
      t = languageContext.t;
    }
  } catch (error) {
    console.warn('LanguageContext not available, using fallback translations');
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      
      // Hide reconnection message after 3 seconds
      setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Apply global styles when offline
  useEffect(() => {
    if (!isOnline) {
      // Disable all buttons, inputs, and interactive elements
      document.body.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';
      
      // Allow clicks on the offline banner itself
      const banner = document.getElementById('offline-banner');
      if (banner) {
        banner.style.pointerEvents = 'auto';
      }
    } else {
      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';
    };
  }, [isOnline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div
          id="offline-banner"
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-2xl animate-slide-down"
          role="alert"
          aria-live="assertive"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-4">
              {/* Icon with Animation */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <WifiOff className="w-6 h-6 animate-pulse" />
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-ping"></div>
                </div>
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">
                      {t('offline.noConnection') || 'No Internet Connection'}
                    </p>
                    <p className="text-xs opacity-90">
                      {t('offline.functionalityDisabled') || 'All functionality is disabled. Please check your connection.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0 hidden sm:block">
                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                  {t('offline.status') || 'Offline'}
                </div>
              </div>
            </div>
          </div>

          {/* Animated Border */}
          <div className="h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-shimmer"></div>
        </div>
      )}

      {/* Reconnected Banner */}
      {isOnline && showReconnected && (
        <div
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white shadow-2xl animate-slide-down"
          role="alert"
          aria-live="polite"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <Wifi className="w-6 h-6" />
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">
                  {t('offline.reconnected') || 'Connection Restored'}
                </p>
                <p className="text-xs opacity-90">
                  {t('offline.backOnline') || 'You are back online. All features are now available.'}
                </p>
              </div>

              {/* Status */}
              <div className="flex-shrink-0 hidden sm:block">
                <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                  {t('offline.online') || 'Online'}
                </div>
              </div>
            </div>
          </div>

          {/* Animated Border */}
          <div className="h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
        </div>
      )}

      {/* Overlay Blocker when Offline */}
      {!isOnline && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
          aria-hidden="true"
        ></div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};

export default OfflineDetector;