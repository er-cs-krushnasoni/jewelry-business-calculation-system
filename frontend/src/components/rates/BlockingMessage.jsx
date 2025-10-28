import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import RateManager from './RateManager';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { Clock, AlertTriangle, Users, RefreshCw, CheckCircle } from 'lucide-react';

const BlockingMessage = ({ 
  isBlocked: propIsBlocked = false, 
  blockingMessage: propBlockingMessage = '', 
  onUnblock = null,
  showRefreshButton = true 
}) => {
  const { user } = useAuth();
  const { systemBlocking, isConnected } = useSocket();
  const { t } = useLanguage();
  
  const [blockingInfo, setBlockingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [currentlyBlocked, setCurrentlyBlocked] = useState(propIsBlocked);
  const [currentMessage, setCurrentMessage] = useState(propBlockingMessage);
  const [realTimeUpdate, setRealTimeUpdate] = useState(false);

  const canUpdateRates = user && ['admin', 'manager'].includes(user.role);

  // Fetch blocking status from API
  const fetchBlockingStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/rates/blocking-status');
      
      if (response.data.success) {
        const data = response.data.data;
        setBlockingInfo(data);
        setCurrentlyBlocked(data.isBlocked);
        setCurrentMessage(data.message);
        
        // If not blocked anymore, notify parent
        if (!data.isBlocked && onUnblock) {
          onUnblock();
        }
      }
    } catch (error) {
      console.error('Error checking blocking status:', error);
      // Use props as fallback
      setCurrentlyBlocked(propIsBlocked);
      setCurrentMessage(propBlockingMessage || t('blocking.header.defaultMessage'));
    } finally {
      setLoading(false);
    }
  }, [onUnblock, propIsBlocked, propBlockingMessage, t]);

  // Handle real-time blocking status updates
  useEffect(() => {
    if (systemBlocking) {
      console.log('BlockingMessage: Real-time blocking update:', systemBlocking);
      const wasBlocked = currentlyBlocked;
      setCurrentlyBlocked(systemBlocking.isBlocked);
      setCurrentMessage(systemBlocking.message);
      setBlockingInfo(prev => prev ? { ...prev, isBlocked: systemBlocking.isBlocked, message: systemBlocking.message } : null);
      
      // Show real-time update indicator
      if (wasBlocked !== systemBlocking.isBlocked) {
        setRealTimeUpdate(true);
        setTimeout(() => setRealTimeUpdate(false), 3000);
        
        // Call parent callback if system was unblocked
        if (!systemBlocking.isBlocked && onUnblock) {
          onUnblock();
        }
      }
    }
  }, [systemBlocking, currentlyBlocked, onUnblock]);

  // Listen for custom blocking events (fallback)
  useEffect(() => {
    const handleBlockingChange = (event) => {
      const { isBlocked: newBlocked, message } = event.detail;
      console.log('BlockingMessage: Custom blocking event:', { newBlocked, message });
      
      const wasBlocked = currentlyBlocked;
      setCurrentlyBlocked(newBlocked);
      setCurrentMessage(message);
      
      if (wasBlocked !== newBlocked) {
        setRealTimeUpdate(true);
        setTimeout(() => setRealTimeUpdate(false), 3000);
        
        if (!newBlocked && onUnblock) {
          onUnblock();
        }
      }
    };

    window.addEventListener('systemBlockingChanged', handleBlockingChange);
    return () => window.removeEventListener('systemBlockingChanged', handleBlockingChange);
  }, [currentlyBlocked, onUnblock]);

  // Initial load
  useEffect(() => {
    fetchBlockingStatus();
  }, [fetchBlockingStatus]);

  // Handle refresh status
  const handleRefreshStatus = async () => {
    setChecking(true);
    await fetchBlockingStatus();
    setChecking(false);
  };

  // Handle rate update success
  const handleRateUpdate = (updatedRates) => {
    console.log('BlockingMessage: Rate update successful:', updatedRates);
    // The socket will handle the unblocking automatically
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gold-50 via-white to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
        <div className="text-center animate-fade-in">
          <div className="glass-effect rounded-2xl p-8 shadow-luxury-lg">
            <LoadingSpinner size="large" />
            <p className="mt-6 text-gray-700 dark:text-gray-300 font-medium">
              {t('blocking.loading.checking')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not blocked, show success message and allow to continue
  if (!currentlyBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gold-50 via-white to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 transition-colors duration-300">
        <div className="glass-effect rounded-2xl shadow-luxury-lg p-10 max-w-md w-full mx-4 text-center animate-scale-in border border-gold-200 dark:border-gold-800/30">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-gold opacity-10 rounded-full blur-3xl animate-glow"></div>
            <CheckCircle className="h-20 w-20 text-green-500 dark:text-green-400 mx-auto mb-6 relative animate-fade-in" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            {t('blocking.ready.title')}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {t('blocking.ready.message')}
          </p>
          
          {onUnblock && (
            <Button 
              onClick={onUnblock} 
              className="w-full bg-gradient-gold hover:shadow-gold transition-all duration-300 transform hover:scale-105"
            >
              {t('blocking.ready.button')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-gold-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center transition-colors duration-300">
      <div className="w-full animate-fade-in">
        <div className="glass-effect shadow-luxury-lg border border-red-200/50 dark:border-red-900/30 overflow-hidden m-0">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50/50 dark:from-red-950/40 dark:via-red-900/30 dark:to-orange-950/20 border-b border-red-200/50 dark:border-red-900/30 p-4 sm:p-6 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-gold opacity-5 rounded-full blur-3xl"></div>
            
            <div className="relative flex items-start space-x-3 sm:space-x-4 mb-4">
              <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-xl shadow-luxury">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} strokeWidth={2} />
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-red-800 dark:text-red-300 mb-2 tracking-tight">
                  {t('blocking.title')}
                </h1>
                <p className="text-sm sm:text-base text-red-600 dark:text-red-400 font-medium">
                  {t('blocking.subtitle')}
                </p>
              </div>
            </div>
            
            {/* Real-time Update Indicator */}
            {realTimeUpdate && (
              <div className="relative mt-4 animate-slide-up">
                <div className="glass-effect p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/30 shadow-luxury">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="animate-pulse w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                      <div className="absolute inset-0 animate-ping w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full opacity-75"></div>
                    </div>
                    <span className="text-blue-800 dark:text-blue-300 font-semibold text-sm">
                      {t('blocking.realTime.updateIndicator')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Blocking Message */}
            <div className="glass-effect bg-gradient-to-br from-yellow-50/80 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/10 border border-yellow-200/50 dark:border-yellow-800/30 rounded-lg p-3 sm:p-4 shadow-luxury transition-all duration-300 hover:shadow-luxury-lg">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="text-yellow-600 dark:text-yellow-400" size={18} strokeWidth={2} />
                </div>
                <span className="font-bold text-yellow-800 dark:text-yellow-300 text-sm sm:text-base">
                  {t('blocking.header.dailyUpdate')}
                </span>
              </div>
              <p className="text-yellow-700 dark:text-yellow-400/90 leading-relaxed text-sm sm:text-base">
                {currentMessage || t('blocking.header.defaultMessage')}
              </p>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="glass-effect bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50 rounded-lg p-3 shadow-luxury animate-fade-in">
                <div className="flex items-center space-x-3">
                  <Users className="text-gray-600 dark:text-gray-400" size={18} strokeWidth={2} />
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    {t('blocking.connection.offline')}
                  </span>
                </div>
              </div>
            )}

            {canUpdateRates ? (
              // Admin/Manager can update rates
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {t('blocking.admin.updateTitle')}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('blocking.admin.updateDescription')}
                    <span className={isConnected ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                      {isConnected ? ` ${t('blocking.admin.broadcastInstantly')}` : ` ${t('blocking.admin.syncWhenRestored')}`}
                    </span>
                  </p>
                </div>
                
                {/* Rate Manager Component */}
                <div className="glass-effect p-3 sm:p-4 rounded-lg border border-gold-200/50 dark:border-gold-800/30 shadow-luxury">
                  <RateManager
                    onRateUpdate={handleRateUpdate}
                    showTitle={false}
                  />
                </div>
              </div>
            ) : (
              // Pro Client/Client cannot update rates
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {t('blocking.nonAdmin.waitingTitle')}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('blocking.nonAdmin.onlyAdminMessage')} {t('blocking.nonAdmin.contactMessage')}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="glass-effect bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-3 sm:p-4 shadow-luxury">
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 text-sm sm:text-base">
                    {t('blocking.nonAdmin.whatYouCanDo')}
                  </h3>
                  <ul className="text-blue-700 dark:text-blue-400/90 space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                      <span>{t('blocking.nonAdmin.contactAdmin')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                      <span>{t('blocking.nonAdmin.askUpdate')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                      <span>{t('blocking.nonAdmin.availableAfter')}</span>
                    </li>
                    {isConnected && (
                      <li className="flex items-start space-x-2">
                        <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                        <span className="font-semibold">{t('blocking.nonAdmin.instantNotification')}</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Manual Refresh for Non-connected Users */}
                {showRefreshButton && (
                  <Button 
                    onClick={handleRefreshStatus}
                    disabled={checking}
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-3 glass-effect border-gold-200 dark:border-gold-800/30 hover:border-gold-300 dark:hover:border-gold-700/50 hover:shadow-gold transition-all duration-300 py-3"
                  >
                    {checking ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span className="font-medium">{t('blocking.nonAdmin.checking')}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} strokeWidth={2} />
                        <span className="font-medium">{t('blocking.nonAdmin.checkButton')}</span>
                      </>
                    )}
                  </Button>
                )}

                {/* Real-time Status */}
                <div className="animate-fade-in">
                  {isConnected ? (
                    <div className="glass-effect bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/50 dark:border-green-800/30 rounded-lg p-4 shadow-luxury">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="relative">
                          <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <span className="text-green-800 dark:text-green-300 font-semibold">
                          {t('blocking.connection.waitingUpdate')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-effect bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50 rounded-lg p-4 shadow-luxury">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {t('blocking.connection.offlineMode')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Update Info */}
            {blockingInfo?.rateInfo && (
              <div className="glass-effect bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/15 dark:to-indigo-950/10 border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-3 sm:p-4 shadow-luxury animate-fade-in">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-sm sm:text-base flex items-center space-x-2">
                  <Clock size={16} strokeWidth={2} />
                  <span>{t('blocking.lastUpdate.title')}</span>
                </h3>
                <p className="text-blue-700 dark:text-blue-400/90 leading-relaxed text-xs sm:text-sm">
                  {t('blocking.lastUpdate.updatedBy')} <span className="font-semibold">{blockingInfo.rateInfo.updatedBy}</span> ({blockingInfo.rateInfo.role}) {t('blocking.lastUpdate.on')} <span className="font-semibold">{blockingInfo.rateInfo.timestamp}</span>
                  {blockingInfo.rateInfo.isToday ? 
                    <span className="ml-2 px-3 py-1 bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold">{t('blocking.lastUpdate.today')}</span> : 
                    <span className="ml-2 text-blue-600 dark:text-blue-400 text-sm">({t('blocking.lastUpdate.previousDay')})</span>
                  }
                </p>
              </div>
            )}

            {/* System Information */}
            <div className="glass-effect bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50 rounded-lg p-3 sm:p-4 shadow-luxury">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                {t('blocking.systemInfo.title')}
              </h4>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-gold-500 dark:text-gold-400 mt-1 font-bold">•</span>
                  <span>{t('blocking.systemInfo.point1')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold-500 dark:text-gold-400 mt-1 font-bold">•</span>
                  <span>{t('blocking.systemInfo.point2')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold-500 dark:text-gold-400 mt-1 font-bold">•</span>
                  <span>{t('blocking.systemInfo.point3')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-gold-500 dark:text-gold-400 mt-1 font-bold">•</span>
                  <span>{t('blocking.systemInfo.point4')}</span>
                </li>
                {isConnected && (
                  <li className="flex items-start space-x-2">
                    <span className="text-gold-500 dark:text-gold-400 mt-1 font-bold">•</span>
                    <span className="font-semibold">{t('blocking.systemInfo.point5')}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockingMessage;