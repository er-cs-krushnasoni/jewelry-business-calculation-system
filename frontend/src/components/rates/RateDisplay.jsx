import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { Clock, User, AlertCircle, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

const RateDisplay = ({ className = '' }) => {
  const { user } = useAuth();
  const { isConnected, connectionStatus, lastRateUpdate, isReady } = useSocket();
  const { t } = useLanguage();
  const [rateInfo, setRateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdateFromSocket, setLastUpdateFromSocket] = useState(null);

  // Fetch initial rate info for header display
  const fetchRateInfo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/rates/header-info');
      
      if (response.data.success) {
        setRateInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching header rate info:', err);
      setError(t('rates.display.failedToLoadRateInfo'));
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time rate updates
  useEffect(() => {
    if (lastRateUpdate) {
      console.log('Processing real-time rate update:', lastRateUpdate);
      setLastUpdateFromSocket(Date.now());
      
      // Update rate info with new data
      if (rateInfo && lastRateUpdate.rates) {
        const updatedRateInfo = {
          ...rateInfo,
          updateInfo: lastRateUpdate.updateInfo,
          currentRates: {
            gold: {
              buy: lastRateUpdate.rates.goldBuy,
              sell: lastRateUpdate.rates.goldSell
            },
            silver: {
              buy: lastRateUpdate.rates.silverBuy,
              sell: lastRateUpdate.rates.silverSell
            }
          }
        };
        
        setRateInfo(updatedRateInfo);
      }
    }
  }, [lastRateUpdate]);

  // Listen for custom rate update events (fallback method)
  useEffect(() => {
    const handleRateUpdate = (event) => {
      const { rates, updateInfo } = event.detail;
      console.log('Custom rate update event received:', { rates, updateInfo });
      
      if (rateInfo && rates) {
        const updatedRateInfo = {
          ...rateInfo,
          updateInfo,
          currentRates: {
            gold: {
              buy: rates.goldBuy,
              sell: rates.goldSell
            },
            silver: {
              buy: rates.silverBuy,
              sell: rates.silverSell
            }
          }
        };
        
        setRateInfo(updatedRateInfo);
      }
    };

    window.addEventListener('rateUpdate', handleRateUpdate);
    return () => window.removeEventListener('rateUpdate', handleRateUpdate);
  }, [rateInfo]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      fetchRateInfo();
      
      // Refresh rate info every 2 minutes as backup
      const interval = setInterval(fetchRateInfo, 2 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user]);

  // Don't show for super admin or if no rate info
  if (user?.role === 'super_admin' || !rateInfo?.showRateInfo) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error || !rateInfo?.hasRates) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-600 ${className}`}>
        <AlertCircle size={16} />
        <span className="text-sm font-medium">
          {error || t('rates.display.noRatesSet')}
        </span>
      </div>
    );
  }

  const { updateInfo, currentRates } = rateInfo;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Connection Status Indicator */}
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <div className="flex items-center space-x-1 text-green-600">
            <Wifi size={14} />
            <span className="text-xs hidden sm:inline">{t('rates.display.live')}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-gray-500">
            <WifiOff size={14} />
            <span className="text-xs hidden sm:inline">{t('rates.display.offline')}</span>
          </div>
        )}
      </div>

      {/* Rate Update Info */}
      <div className="flex items-center space-x-2 text-gray-700">
        <User size={14} />
        <span className="text-sm">
          {t('rates.display.rateUpdatedBy')} <span className="font-medium">{updateInfo.updatedBy}</span>
          {lastUpdateFromSocket && (
            <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded animate-pulse">
              {t('rates.display.liveUpdate')}
            </span>
          )}
        </span>
      </div>
      
      <div className="flex items-center space-x-2 text-gray-700">
        <Clock size={14} />
        <span className="text-sm">
          {updateInfo.timestamp}
          {updateInfo.isToday && (
            <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
              {t('rates.display.today')}
            </span>
          )}
        </span>
      </div>

      {/* Current Rates Quick View */}
      <div className="hidden lg:flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
          <TrendingUp className="text-yellow-600" size={14} />
          <span className="text-yellow-800 font-medium">
            {t('rates.display.gold')} ₹{currentRates.gold.sell}/10g
            {lastUpdateFromSocket && (
              <span className="ml-1 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
          <TrendingDown className="text-gray-600" size={14} />
          <span className="text-gray-800 font-medium">
            {t('rates.display.silver')} ₹{currentRates.silver.sell}/kg
            {lastUpdateFromSocket && (
              <span className="ml-1 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </span>
        </div>
      </div>

      {/* Mobile View - Simplified */}
      <div className="lg:hidden flex items-center space-x-2 text-sm">
        <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs font-medium">
          {t('rates.display.rates')} G₹{currentRates.gold.sell} S₹{currentRates.silver.sell}
          {lastUpdateFromSocket && (
            <span className="ml-1 inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          )}
        </span>
      </div>

      {/* Connection Issues Warning */}
      {!isConnected && connectionStatus !== 'disconnected' && (
        <div className="hidden xl:flex items-center text-xs text-yellow-600">
          <span className="bg-yellow-50 px-2 py-1 rounded">
            {connectionStatus === 'connecting' ? t('rates.display.connecting') : 
             connectionStatus === 'reconnecting' ? t('rates.display.reconnecting') : 
             t('rates.display.connectionIssues')}
          </span>
        </div>
      )}
    </div>
  );
};

export default RateDisplay;