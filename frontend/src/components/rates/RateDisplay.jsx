import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { Clock, User, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const RateDisplay = ({ 
  shopId = null, 
  showUpdateButton = true, 
  compact = false, 
  onUpdateClick = null,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const { user, canUpdateRates } = useAuth();
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Determine if we're working with user's own shop or specific shop
  const isOwnShop = !shopId;
  const targetShopId = shopId || user?.shopId;

  // Fetch current rates
  const fetchRates = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');

      const endpoint = isOwnShop ? '/rates/my-rates' : `/rates/shop/${targetShopId}`;
      const response = await api.get(endpoint);

      if (response.data.success) {
        setRates(response.data.data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      if (err.response?.data?.requireSetup) {
        setRates(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch rates');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch and auto refresh setup
  useEffect(() => {
    if (targetShopId) {
      fetchRates();

      // Setup auto refresh if enabled
      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchRates(false); // Don't show loading spinner for auto refresh
        }, refreshInterval);

        return () => clearInterval(interval);
      }
    }
  }, [targetShopId, autoRefresh, refreshInterval]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchRates(false);
  };

  // Handle update button click
  const handleUpdateClick = () => {
    if (onUpdateClick) {
      onUpdateClick();
    }
  };

  // Calculate per gram rates for display
  const getPerGramRates = () => {
    if (!rates) return null;

    return {
      goldBuyPerGram: Math.floor(rates.goldBuy / 10),
      goldSellPerGram: Math.ceil(rates.goldSell / 10),
      silverBuyPerGram: Math.floor(rates.silverBuy / 1000),
      silverSellPerGram: Math.ceil(rates.silverSell / 1000)
    };
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center space-x-3">
          <LoadingSpinner size={compact ? 'small' : 'medium'} />
          <span className="text-gray-600">Loading rates...</span>
        </div>
      </div>
    );
  }

  // No rates setup
  if (!rates) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-yellow-600" size={compact ? 16 : 20} />
          <div className="flex-1">
            <p className={`font-semibold text-yellow-800 ${compact ? 'text-sm' : ''}`}>
              Rates Not Set
            </p>
            <p className={`text-yellow-700 ${compact ? 'text-xs' : 'text-sm'}`}>
              {canUpdateRates() 
                ? 'Please set up daily rates to start using the calculator.'
                : 'Please contact your shop admin or manager to set up rates.'
              }
            </p>
          </div>
          {canUpdateRates() && showUpdateButton && (
            <Button
              onClick={handleUpdateClick}
              size={compact ? 'small' : 'medium'}
              variant="primary"
            >
              Set Rates
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-red-600" size={compact ? 16 : 20} />
          <div className="flex-1">
            <p className={`font-semibold text-red-800 ${compact ? 'text-sm' : ''}`}>
              Error Loading Rates
            </p>
            <p className={`text-red-700 ${compact ? 'text-xs' : 'text-sm'}`}>{error}</p>
          </div>
          <Button
            onClick={handleRefresh}
            size={compact ? 'small' : 'medium'}
            variant="outline"
          >
            <RefreshCw size={compact ? 12 : 16} />
          </Button>
        </div>
      </div>
    );
  }

  const perGramRates = getPerGramRates();
  const { updateInfo } = rates;

  return (
    <div className={`bg-white rounded-lg shadow ${compact ? '' : 'overflow-hidden'}`}>
      {/* Header */}
      {!compact && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Current Rates</h3>
              <p className="text-blue-100 text-sm">Live pricing for calculations</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                size="small"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-700"
              >
                <RefreshCw size={14} />
              </Button>
              {canUpdateRates() && showUpdateButton && (
                <Button
                  onClick={handleUpdateClick}
                  size="small"
                  variant="secondary"
                >
                  Update Rates
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rate Content */}
      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Compact Header for compact mode */}
        {compact && (
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Current Rates</h4>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                size="small"
                variant="outline"
              >
                <RefreshCw size={12} />
              </Button>
              {canUpdateRates() && showUpdateButton && (
                <Button
                  onClick={handleUpdateClick}
                  size="small"
                  variant="primary"
                >
                  Update
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Gold Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h4 className={`font-semibold text-yellow-800 ${compact ? 'text-sm' : ''}`}>
                Gold Rates
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-gray-600 flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                  <TrendingDown size={compact ? 12 : 14} className="mr-1 text-red-500" />
                  Buying (10g)
                </span>
                <span className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-lg'}`}>
                  ₹{rates.goldBuy.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-gray-600 flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                  <TrendingUp size={compact ? 12 : 14} className="mr-1 text-green-500" />
                  Selling (10g)
                </span>
                <span className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-lg'}`}>
                  ₹{rates.goldSell.toLocaleString()}
                </span>
              </div>
              {!compact && (
                <div className="pt-2 border-t border-yellow-200">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Per gram (approx.)</span>
                    <span>₹{perGramRates.goldBuyPerGram} / ₹{perGramRates.goldSellPerGram}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Silver Rates */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <h4 className={`font-semibold text-gray-800 ${compact ? 'text-sm' : ''}`}>
                Silver Rates
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-gray-600 flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                  <TrendingDown size={compact ? 12 : 14} className="mr-1 text-red-500" />
                  Buying (1kg)
                </span>
                <span className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-lg'}`}>
                  ₹{rates.silverBuy.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-gray-600 flex items-center ${compact ? 'text-xs' : 'text-sm'}`}>
                  <TrendingUp size={compact ? 12 : 14} className="mr-1 text-green-500" />
                  Selling (1kg)
                </span>
                <span className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-lg'}`}>
                  ₹{rates.silverSell.toLocaleString()}
                </span>
              </div>
              {!compact && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Per gram (approx.)</span>
                    <span>₹{perGramRates.silverBuyPerGram} / ₹{perGramRates.silverSellPerGram}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Information */}
        {updateInfo && (
          <div className={`bg-blue-50 border border-blue-200 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="text-blue-600" size={compact ? 14 : 16} />
                <div>
                  <p className={`font-medium text-blue-800 ${compact ? 'text-xs' : 'text-sm'}`}>
                    Updated by {updateInfo.updatedBy} ({updateInfo.role})
                  </p>
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Clock size={compact ? 10 : 12} />
                    <span className={compact ? 'text-xs' : 'text-sm'}>
                      {updateInfo.timestamp}
                    </span>
                  </div>
                </div>
              </div>
              {updateInfo.isToday && (
                <span className={`bg-green-100 text-green-800 px-2 py-1 rounded-full ${compact ? 'text-xs' : 'text-sm'}`}>
                  Today
                </span>
              )}
            </div>
          </div>
        )}

        {/* Auto Refresh Indicator */}
        {autoRefresh && !compact && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Auto-refreshing every {refreshInterval / 1000}s • Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateDisplay;