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
          <div className="h-6 w-16 bg-gradient-to-r from-gold-200 to-gold-300 dark:from-gold-800 dark:to-gold-700 rounded"></div>
          <div className="h-6 w-20 bg-gradient-to-r from-gold-200 to-gold-300 dark:from-slate-700 dark:to-slate-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !rateInfo?.hasRates) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 ${className}`}>
        <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
          {error || t('rates.display.noRatesSet')}
        </span>
      </div>
    );
  }

  const { updateInfo, currentRates } = rateInfo;

  return (
    <div className={`flex items-center gap-2 ${className}`}>

      {/* Updated By - Compact */}
      <div className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded-lg glass-effect border border-white/20 dark:border-slate-700/50">
        <User size={13} className="text-gold-600 dark:text-gold-400" />
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {updateInfo.updatedBy}
        </span>
        {lastUpdateFromSocket && (
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        )}
      </div>
      
      {/* Timestamp - Compact */}
      <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 rounded-lg glass-effect border border-white/20 dark:border-slate-700/50">
        <Clock size={13} className="text-gold-600 dark:text-gold-400" />
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {updateInfo.timestamp}
        </span>
        {updateInfo.isToday && (
          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
            {t('rates.display.today')}
          </span>
        )}
      </div>

      {/* Gold Rate - Compact Premium */}
      <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-br from-amber-50 to-gold-100 dark:from-amber-900/30 dark:to-gold-900/30 border border-gold-200 dark:border-gold-800/50 shadow-sm hover:shadow-md transition-all duration-200">
        <TrendingUp className="text-amber-600 dark:text-amber-400" size={13} />
        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 uppercase">
          {t('rates.display.gold')}
        </span>
        <span className="text-xs font-bold text-amber-900 dark:text-amber-100">
          ₹{currentRates.gold.sell}
        </span>
        {lastUpdateFromSocket && (
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        )}
      </div>
      
      {/* Silver Rate - Compact Premium */}
      <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-200">
        <TrendingDown className="text-slate-600 dark:text-slate-400" size={13} />
        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 uppercase">
          {t('rates.display.silver')}
        </span>
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          ₹{currentRates.silver.sell}
        </span>
        {lastUpdateFromSocket && (
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        )}
      </div>

      {/* Mobile/Tablet View - Ultra Compact */}
      <div className="xl:hidden flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-slate-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-slate-800/20 border border-gold-200 dark:border-gold-800/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200">G</span>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-100">
              ₹{currentRates.gold.sell}
            </span>
          </div>
          <div className="w-px h-3 bg-gold-300 dark:bg-gold-700"></div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">S</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              ₹{currentRates.silver.sell}
            </span>
          </div>
          {lastUpdateFromSocket && (
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          )}
        </div>
      </div>

      {/* Connection Issues - Compact */}
      {!isConnected && connectionStatus !== 'disconnected' && (
        <div className="hidden 2xl:flex items-center px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300">
              {connectionStatus === 'connecting' ? t('rates.display.connecting') : 
               connectionStatus === 'reconnecting' ? t('rates.display.reconnecting') : 
               t('rates.display.connectionIssues')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateDisplay;