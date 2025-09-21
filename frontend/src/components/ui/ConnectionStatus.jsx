import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
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
  
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't show if connection is good and stable
  if (isReady && !showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1 text-green-600">
          <Wifi size={14} />
          <span className="text-xs">Live</span>
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
            {isReady ? 'Real-time updates active' :
             isConnecting ? 'Establishing connection...' :
             isReconnecting ? 'Reconnecting to server...' :
             hasError ? 'Connection failed' :
             'Offline mode'}
          </span>
        </div>

        {/* Error Details */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Connection Details (Expandable) */}
        {showDetails && (
          <div className="space-y-2 border-t pt-2">
            <div className="text-xs text-gray-600">
              <strong>Status:</strong> {connectionStatus}
            </div>
            <div className="text-xs text-gray-600">
              <strong>Real-time:</strong> {isReady ? 'Active' : 'Inactive'}
            </div>
            {!isConnected && (
              <div className="text-xs text-gray-600">
                <strong>Impact:</strong> Rate updates won't appear instantly
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
              <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
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
        {isReady ? 'Live' : 
         connectionStatus === 'connecting' ? 'Connecting' :
         connectionStatus === 'reconnecting' ? 'Reconnecting' :
         'Offline'}
      </span>
    </div>
  );
};

export default ConnectionStatus;