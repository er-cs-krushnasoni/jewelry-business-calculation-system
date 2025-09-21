import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
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
      setCurrentMessage(propBlockingMessage || 'System is currently blocked. Please update rates.');
    } finally {
      setLoading(false);
    }
  }, [onUnblock, propIsBlocked, propBlockingMessage]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  // If not blocked, show success message and allow to continue
  if (!currentlyBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">System Ready</h2>
          <p className="text-gray-600 mb-4">Calculator is now available for use.</p>
          {onUnblock && (
            <Button onClick={onUnblock} className="w-full">
              Continue to Calculator
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-red-200">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-red-800">System Blocked</h1>
              <p className="text-red-600">Calculator is temporarily unavailable</p>
            </div>
          </div>
          
          {/* Real-time Update Indicator */}
          {realTimeUpdate && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-800 font-medium text-sm">
                  Blocking status updated in real-time
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Blocking Message */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="text-yellow-600" size={20} />
              <span className="font-semibold text-yellow-800">Daily Rate Update Required</span>
            </div>
            <p className="text-yellow-700">
              {currentMessage || 'Today\'s rates have not been updated. Please update rates to continue using the calculator.'}
            </p>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="text-gray-600" size={16} />
                <span className="text-gray-700 text-sm">
                  Real-time updates are currently offline. Status changes may be delayed.
                </span>
              </div>
            </div>
          )}

          {canUpdateRates ? (
            // Admin/Manager can update rates
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Update Today's Rates
                </h2>
                <p className="text-gray-600">
                  Enter today's gold and silver rates to unblock the calculator for all users.
                  {isConnected ? ' Updates will be broadcasted instantly.' : ' Updates will sync when connection is restored.'}
                </p>
              </div>
              
              {/* Rate Manager Component */}
              <RateManager
                onRateUpdate={handleRateUpdate}
                showTitle={false}
              />
            </div>
          ) : (
            // Pro Client/Client cannot update rates
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Waiting for Rate Update
                </h2>
                <p className="text-gray-600 mb-4">
                  Only the Shop Admin or Manager can update today's rates.
                  Please contact them to resolve this issue.
                </p>
              </div>

              {/* Contact Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">What you can do:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Contact your Shop Admin or Manager</li>
                  <li>• Ask them to update today's gold and silver rates</li>
                  <li>• The calculator will be available immediately after rates are updated</li>
                  {isConnected && (
                    <li>• You'll receive an instant notification when rates are updated</li>
                  )}
                </ul>
              </div>

              {/* Manual Refresh for Non-connected Users */}
              {showRefreshButton && (
                <Button 
                  onClick={handleRefreshStatus}
                  disabled={checking}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  {checking ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  <span>{checking ? 'Checking...' : 'Check Status'}</span>
                </Button>
              )}

              {/* Real-time Status */}
              <div className="mt-4">
                {isConnected ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        Waiting for real-time rate update...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm">
                        Offline mode - Please refresh page after rates are updated
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Update Info */}
          {blockingInfo?.rateInfo && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Last Rate Update</h3>
              <p className="text-blue-700 text-sm">
                Updated by {blockingInfo.rateInfo.updatedBy} ({blockingInfo.rateInfo.role}) 
                on {blockingInfo.rateInfo.timestamp}
                {blockingInfo.rateInfo.isToday ? ' (Today)' : ' (Previous day)'}
              </p>
            </div>
          )}

          {/* System Information */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">About Daily Rate Updates:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Rates must be updated daily before 1:00 PM IST</li>
              <li>• If not updated by 1:00 PM, the calculator is automatically blocked</li>
              <li>• This ensures all calculations use current market rates</li>
              <li>• Updates are applied instantly to all shop users</li>
              {isConnected && (
                <li>• Real-time notifications keep everyone informed</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockingMessage;