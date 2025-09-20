import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import RateManager from './RateManager';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { AlertTriangle, Clock, Lock, RefreshCw, CheckCircle } from 'lucide-react';

const BlockingMessage = ({ onUnblock = null, showRefreshButton = true }) => {
  const { user } = useAuth();
  const [blockingInfo, setBlockingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRateForm, setShowRateForm] = useState(false);
  const [checking, setChecking] = useState(false);

  const canUpdateRates = user && ['admin', 'manager'].includes(user.role);

  // Check current blocking status
  const checkBlockingStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rates/blocking-status');
      
      if (response.data.success) {
        setBlockingInfo(response.data.data);
        
        // If not blocked anymore, notify parent
        if (!response.data.data.isBlocked && onUnblock) {
          onUnblock();
          return;
        }
        
        // Auto-show rate form for admin/manager if blocked
        if (response.data.data.isBlocked && canUpdateRates) {
          setShowRateForm(true);
        }
      }
    } catch (error) {
      console.error('Error checking blocking status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBlockingStatus();
  }, []);

  // Handle rate update success
  const handleRateUpdate = (updatedRates) => {
    setShowRateForm(false);
    // Check status again to see if unblocked
    setTimeout(() => {
      checkBlockingStatus();
    }, 1000);
  };

  // Handle refresh status
  const handleRefreshStatus = async () => {
    setChecking(true);
    await checkBlockingStatus();
    setChecking(false);
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

  if (!blockingInfo?.isBlocked) {
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

  // Show rate update form for admin/manager
  if (canUpdateRates && showRateForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Blocking Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-semibold text-red-800">System Blocked</h1>
            </div>
            <p className="text-red-700 mb-4">{blockingInfo?.message}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-red-600">
                <Clock size={16} />
                <span>Current time: {blockingInfo?.currentTimeIST}</span>
              </div>
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle size={16} />
                <span>Daily deadline: {blockingInfo?.systemStatus?.dailyDeadline}</span>
              </div>
            </div>
          </div>

          {/* Rate Update Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Update Today's Rates</h2>
              <p className="text-gray-600 mt-1">Update rates to unlock the calculator system</p>
            </div>
            <div className="p-6">
              <RateManager 
                onRateUpdate={handleRateUpdate}
                showTitle={false}
              />
            </div>
          </div>

          {/* System Status Info */}
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
        </div>
      </div>
    );
  }

  // Show contact admin message for pro_client/client
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <Lock className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Calculator Blocked</h1>
          <p className="text-gray-700 mb-6">{blockingInfo?.message}</p>
          
          {/* Current Time Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
              <Clock size={16} />
              <span>Current time: {blockingInfo?.currentTimeIST}</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <AlertTriangle size={16} />
              <span>Daily deadline: {blockingInfo?.systemStatus?.dailyDeadline}</span>
            </div>
          </div>

          {/* Contact Admin Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Action Required</h3>
            <p className="text-yellow-700 text-sm">
              Please contact your Shop Admin or Manager to update today's rates.
            </p>
          </div>

          {/* Last Update Info */}
          {blockingInfo?.rateInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Last Rate Update</h3>
              <p className="text-blue-700 text-sm">
                Updated by {blockingInfo.rateInfo.updatedBy} ({blockingInfo.rateInfo.role}) 
                on {blockingInfo.rateInfo.timestamp}
                {blockingInfo.rateInfo.isToday ? ' (Today)' : ' (Previous day)'}
              </p>
            </div>
          )}

          {/* Refresh Button */}
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
        </div>
      </div>
    </div>
  );
};

export default BlockingMessage;