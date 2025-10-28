import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Wifi, WifiOff, AlertCircle, RefreshCw, X } from 'lucide-react';
import Button from '../ui/Button';

const ConnectionStatus = ({ className = '' }) => {
  const { 
    isConnected, 
    connectionStatus, 
    error, 
    isReady, 
    isConnecting, 
    isReconnecting, 
    hasError,
    getStatusMessage,
    getStatusColor,
    connectSocket,
    pingSocket
  } = useSocket();
  
  const { t } = useLanguage();
  
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't show if connection is good and stable
  if (isReady && !showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
          <Wifi size={14} className="animate-pulse" />
          <span className="text-xs font-medium">{t('connection.status.live')}</span>
        </div>
      </div>
    );
  }

  // Handle manual retry
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      connectSocket();
      // Test connection
      setTimeout(() => {
        pingSocket();
        setIsRetrying(false);
      }, 2000);
    } catch (err) {
      console.error('Manual reconnection failed:', err);
      setIsRetrying(false);
    }
  };

  return (
    <div className={`
      bg-white dark:bg-slate-800 
      border border-gray-200 dark:border-slate-700 
      rounded-xl shadow-luxury dark:shadow-slate-900/30
      transition-all duration-300
      ${className}
    `}>
      <div className="p-4">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            {isConnected ? (
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Wifi className="text-emerald-600 dark:text-emerald-400" size={16} />
              </div>
            ) : (
              <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <WifiOff className="text-red-600 dark:text-red-400" size={16} />
              </div>
            )}
            <span className={`text-sm font-semibold transition-colors ${
              getStatusColor() === 'green' ? 'text-emerald-800 dark:text-emerald-300' :
              getStatusColor() === 'yellow' ? 'text-amber-800 dark:text-amber-300' :
              getStatusColor() === 'red' ? 'text-red-800 dark:text-red-300' :
              'text-gray-800 dark:text-gray-200'
            }`}>
              {getStatusMessage()}
            </span>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="
              p-1.5 rounded-lg
              text-gray-400 dark:text-gray-500 
              hover:text-gold-600 dark:hover:text-gold-400
              hover:bg-gold-50 dark:hover:bg-gold-900/10
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gold-500/20
            "
            aria-label={showDetails ? t('connection.actions.hideDetails') : t('connection.actions.showDetails')}
          >
            {showDetails ? <X size={16} /> : <AlertCircle size={16} />}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              isReady ? 'bg-emerald-500 dark:bg-emerald-400 shadow-emerald-500/50' :
              isConnecting || isReconnecting ? 'bg-amber-500 dark:bg-amber-400 animate-pulse shadow-amber-500/50' :
              hasError ? 'bg-red-500 dark:bg-red-400 shadow-red-500/50' :
              'bg-gray-400 dark:bg-gray-500'
            } shadow-lg`}></div>
            {(isConnecting || isReconnecting) && (
              <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping ${
                isConnecting || isReconnecting ? 'bg-amber-500 dark:bg-amber-400' : ''
              }`}></div>
            )}
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            {isReady ? t('connection.messages.realtimeActive') :
             isConnecting ? t('connection.messages.establishingConnection') :
             isReconnecting ? t('connection.messages.reconnectingToServer') :
             hasError ? t('connection.messages.connectionFailed') :
             t('connection.messages.offlineMode')}
          </span>
        </div>

        {/* Error Details */}
        {error && (
          <div className="
            mb-3 p-3 
            bg-red-50 dark:bg-red-900/20 
            border border-red-200 dark:border-red-800/30 
            rounded-lg
            animate-fade-in
          ">
            <p className="text-xs text-red-800 dark:text-red-300 font-medium">
              <strong className="font-bold">{t('connection.labels.error')}:</strong> {error}
            </p>
          </div>
        )}

        {/* Connection Details (Expandable) */}
        {showDetails && (
          <div className="
            space-y-2.5 
            border-t border-gray-200 dark:border-slate-700 
            pt-3 mt-1
            animate-slide-up
          ">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {t('connection.labels.status')}
              </span>
              <span className="text-gray-800 dark:text-gray-200 font-semibold">
                {connectionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {t('connection.labels.realtime')}
              </span>
              <span className={`font-semibold ${
                isReady 
                  ? 'text-emerald-700 dark:text-emerald-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isReady ? t('connection.labels.active') : t('connection.labels.inactive')}
              </span>
            </div>
            {!isConnected && (
              <div className="
                mt-2 p-2 
                bg-amber-50 dark:bg-amber-900/10 
                border-l-4 border-amber-500 dark:border-amber-400
                rounded
              ">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong className="font-bold">{t('connection.labels.impact')}:</strong> {t('connection.messages.updatesWontAppear')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(!isConnected || hasError) && (
          <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
            <Button
              size="small"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying || isConnecting}
              className="flex items-center space-x-1.5 flex-1 justify-center"
            >
              <RefreshCw 
                size={14} 
                className={`transition-transform ${isRetrying || isConnecting ? 'animate-spin' : ''}`} 
              />
              <span className="font-medium">
                {isRetrying ? t('connection.actions.retrying') : t('connection.actions.retry')}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal inline connection indicator for header/navbar
export const ConnectionIndicator = ({ className = '' }) => {
  const { isConnected, isReady, connectionStatus, getStatusColor } = useSocket();
  const { t } = useLanguage();
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm">
        {isConnected ? (
          <div className="p-0.5">
            <Wifi className="text-emerald-600 dark:text-emerald-400" size={14} />
          </div>
        ) : (
          <div className="p-0.5">
            <WifiOff className="text-gray-500 dark:text-gray-400" size={14} />
          </div>
        )}
        
        <div className="relative">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isReady ? 'bg-emerald-500 dark:bg-emerald-400 shadow-emerald-500/50' :
            connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-amber-500 dark:bg-amber-400 animate-pulse shadow-amber-500/50' :
            connectionStatus === 'error' ? 'bg-red-500 dark:bg-red-400 shadow-red-500/50' :
            'bg-gray-400 dark:bg-gray-500'
          } shadow-md`}></div>
          {(connectionStatus === 'connecting' || connectionStatus === 'reconnecting') && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping"></div>
          )}
        </div>
        
        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium hidden sm:inline">
          {isReady ? t('connection.status.live') : 
           connectionStatus === 'connecting' ? t('connection.status.connecting') :
           connectionStatus === 'reconnecting' ? t('connection.status.reconnecting') :
           t('connection.status.offline')}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;