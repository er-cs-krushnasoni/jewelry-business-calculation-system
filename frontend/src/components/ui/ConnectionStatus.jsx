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
        <div className="flex items-center space-x-1 text-green-600">
          <Wifi size={14} />
          <span className="text-xs">{t('connection.status.live')}</span>
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
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="p-3">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="text-green-600" size={16} />
            ) : (
              <WifiOff className="text-red-600" size={16} />
            )}
            <span className={`text-sm font-medium ${
              getStatusColor() === 'green' ? 'text-green-800' :
              getStatusColor() === 'yellow' ? 'text-yellow-800' :
              getStatusColor() === 'red' ? 'text-red-800' :
              'text-gray-800'
            }`}>
              {getStatusMessage()}
            </span>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
            aria-label={showDetails ? t('connection.actions.hideDetails') : t('connection.actions.showDetails')}
          >
            {showDetails ? <X size={16} /> : <AlertCircle size={16} />}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-3 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            isReady ? 'bg-green-500' :
            isConnecting || isReconnecting ? 'bg-yellow-500 animate-pulse' :
            hasError ? 'bg-red-500' :
            'bg-gray-400'
          }`}></div>
          <span className="text-xs text-gray-600">
            {isReady ? t('connection.messages.realtimeActive') :
             isConnecting ? t('connection.messages.establishingConnection') :
             isReconnecting ? t('connection.messages.reconnectingToServer') :
             hasError ? t('connection.messages.connectionFailed') :
             t('connection.messages.offlineMode')}
          </span>
        </div>

        {/* Error Details */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <strong>{t('connection.labels.error')}</strong> {error}
          </div>
        )}

        {/* Connection Details (Expandable) */}
        {showDetails && (
          <div className="space-y-2 border-t pt-2">
            <div className="text-xs text-gray-600">
              <strong>{t('connection.labels.status')}</strong> {connectionStatus}
            </div>
            <div className="text-xs text-gray-600">
              <strong>{t('connection.labels.realtime')}</strong> {isReady ? t('connection.labels.active') : t('connection.labels.inactive')}
            </div>
            {!isConnected && (
              <div className="text-xs text-gray-600">
                <strong>{t('connection.labels.impact')}</strong> {t('connection.messages.updatesWontAppear')}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(!isConnected || hasError) && (
          <div className="flex space-x-2 mt-2">
            <Button
              size="small"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying || isConnecting}
              className="flex items-center space-x-1"
            >
              <RefreshCw 
                size={12} 
                className={isRetrying || isConnecting ? 'animate-spin' : ''} 
              />
              <span>{isRetrying ? t('connection.actions.retrying') : t('connection.actions.retry')}</span>
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
    <div className={`flex items-center space-x-1 ${className}`}>
      {isConnected ? (
        <Wifi className="text-green-600" size={14} />
      ) : (
        <WifiOff className="text-gray-500" size={14} />
      )}
      
      <div className={`w-2 h-2 rounded-full ${
        isReady ? 'bg-green-500' :
        connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
        connectionStatus === 'error' ? 'bg-red-500' :
        'bg-gray-400'
      }`}></div>
      
      <span className="text-xs text-gray-600 hidden sm:inline">
        {isReady ? t('connection.status.live') : 
         connectionStatus === 'connecting' ? t('connection.status.connecting') :
         connectionStatus === 'reconnecting' ? t('connection.status.reconnecting') :
         t('connection.status.offline')}
      </span>
    </div>
  );
};

export default ConnectionStatus;