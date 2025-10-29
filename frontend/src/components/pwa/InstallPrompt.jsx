import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

const InstallPrompt = ({ trigger = 'button', showInModal = false, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success(t('pwa.installed') || 'App installed successfully! 🎉', {
        duration: 5000,
        icon: '✅',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [t]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show instructions for manual installation
      toast(
        <div className="text-sm">
          <p className="font-semibold mb-2">{t('pwa.manualInstall') || 'To install this app:'}</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>iOS: Tap Share → Add to Home Screen</li>
            <li>Android: Tap Menu (⋮) → Install App</li>
            <li>Desktop: Click Install icon in address bar</li>
          </ul>
        </div>,
        {
          duration: 8000,
          icon: '📱',
        }
      );
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted PWA installation');
        setIsInstallable(false);
        setShowModal(false);
        if (onClose) onClose();
      } else {
        console.log('User dismissed PWA installation');
        // Remember dismissal for 7 days
        const dismissDate = new Date();
        dismissDate.setDate(dismissDate.getDate() + 7);
        localStorage.setItem('pwa-install-dismissed', dismissDate.toISOString());
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
      toast.error(t('pwa.installError') || 'Installation failed. Please try again.');
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    if (onClose) onClose();
    
    // Remember dismissal for 7 days
    const dismissDate = new Date();
    dismissDate.setDate(dismissDate.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed', dismissDate.toISOString());
  };

  // If already installed, show installed status
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium">{t('pwa.appInstalled') || 'App Installed'}</span>
      </div>
    );
  }

  // If not installable, don't show anything
  if (!isInstallable && trigger === 'button') {
    return null;
  }

  // Button trigger (for sidebar/settings)
  if (trigger === 'button') {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold">{t('pwa.installApp') || 'Install App'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('pwa.installDesc') || 'Use offline & faster'}
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  // Modal view (if showInModal prop is true)
  if (showInModal && showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {t('pwa.installTitle') || 'Install JewelCalc'}
                </h3>
                <p className="text-sm text-blue-100">
                  {t('pwa.installSubtitle') || 'Get the app experience'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              {t('pwa.installMessage') || 
                'Install JewelCalc on your device for a faster, app-like experience with offline access to cached pages.'}
            </p>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t('pwa.benefit1') || 'Faster loading times'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t('pwa.benefit2') || 'Works like a native app'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {t('pwa.benefit3') || 'Access from home screen'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('pwa.notNow') || 'Not Now'}
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t('pwa.install') || 'Install'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;