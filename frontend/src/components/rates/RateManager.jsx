import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Save, AlertCircle, CheckCircle, Clock, User, Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';

const RateManager = ({ shopId = null, onRateUpdate = null, showTitle = true }) => {
  const { user, canUpdateRates } = useAuth();
  const { isConnected, connectionStatus, isReady, getStatusMessage, getStatusColor } = useSocket();
  const { t } = useLanguage();
  const [rates, setRates] = useState({
    goldBuy: '',
    goldSell: '',
    silverBuy: '',
    silverSell: ''
  });
  const [currentRates, setCurrentRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [realTimeUpdate, setRealTimeUpdate] = useState(false);

  // Determine if we're working with user's own shop or specific shop
  const isOwnShop = !shopId;
  const targetShopId = shopId || user?.shopId;

  // Check if user can update rates
  if (!canUpdateRates()) {
    return (
      <div className="glass-effect rounded-xl p-6 border border-yellow-200/30 dark:border-yellow-700/30 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 animate-fade-in">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-800/30 flex items-center justify-center">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <div>
            <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-lg">
              {t('rates.manager.accessRestricted')}
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              {t('rates.manager.accessRestrictedMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle real-time rate updates from Socket.IO
  useEffect(() => {
    const handleRateUpdate = (event) => {
      const { rates: newRates, updateInfo: newUpdateInfo } = event.detail;
      console.log('RateManager received real-time update:', { newRates, newUpdateInfo });
      
      if (newRates && targetShopId) {
        setRealTimeUpdate(true);
        setCurrentRates(newRates);
        setUpdateInfo(newUpdateInfo);
        
        // Update form with new rates
        setRates({
          goldBuy: newRates.goldBuy?.toString() || '',
          goldSell: newRates.goldSell?.toString() || '',
          silverBuy: newRates.silverBuy?.toString() || '',
          silverSell: newRates.silverSell?.toString() || ''
        });
        
        // Show real-time update indicator for 3 seconds
        setTimeout(() => setRealTimeUpdate(false), 3000);
        
        // Clear any previous errors
        setError('');
      }
    };

    window.addEventListener('rateUpdate', handleRateUpdate);
    return () => window.removeEventListener('rateUpdate', handleRateUpdate);
  }, [targetShopId]);

  // Fetch current rates
  const fetchCurrentRates = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = isOwnShop ? '/rates/my-rates' : `/rates/shop/${targetShopId}`;
      const response = await api.get(endpoint);

      if (response.data.success) {
        setCurrentRates(response.data.data);
        setUpdateInfo(response.data.data.updateInfo);
        
        // Pre-fill form with current rates
        setRates({
          goldBuy: response.data.data.goldBuy?.toString() || '',
          goldSell: response.data.data.goldSell?.toString() || '',
          silverBuy: response.data.data.silverBuy?.toString() || '',
          silverSell: response.data.data.silverSell?.toString() || ''
        });
      }
    } catch (err) {
      if (err.response?.data?.requireSetup) {
        setCurrentRates(null);
        setUpdateInfo(null);
      } else {
        setError(err.response?.data?.message || t('rates.manager.errors.fetchFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetShopId) {
      fetchCurrentRates();
    }
  }, [targetShopId]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setRates(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
    setRealTimeUpdate(false);
  };

  // Validate rates
  const validateRates = () => {
    const errors = [];
    
    // Check if all fields are filled
    if (!rates.goldBuy || !rates.goldSell || !rates.silverBuy || !rates.silverSell) {
      errors.push(t('rates.manager.errors.allFieldsRequired'));
    }
    
    // Check if values are positive integers
    const goldBuy = parseInt(rates.goldBuy);
    const goldSell = parseInt(rates.goldSell);
    const silverBuy = parseInt(rates.silverBuy);
    const silverSell = parseInt(rates.silverSell);
    
    if (isNaN(goldBuy) || goldBuy < 1) {
      errors.push(t('rates.manager.errors.goldBuyPositive'));
    }
    if (isNaN(goldSell) || goldSell < 1) {
      errors.push(t('rates.manager.errors.goldSellPositive'));
    }
    if (isNaN(silverBuy) || silverBuy < 1) {
      errors.push(t('rates.manager.errors.silverBuyPositive'));
    }
    if (isNaN(silverSell) || silverSell < 1) {
      errors.push(t('rates.manager.errors.silverSellPositive'));
    }
    
    // Check selling >= buying
    if (!isNaN(goldSell) && !isNaN(goldBuy) && goldSell < goldBuy) {
      errors.push(t('rates.manager.errors.goldSellHigher'));
    }
    if (!isNaN(silverSell) && !isNaN(silverBuy) && silverSell < silverBuy) {
      errors.push(t('rates.manager.errors.silverSellHigher'));
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateRates();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const rateData = {
        goldBuy: parseInt(rates.goldBuy),
        goldSell: parseInt(rates.goldSell),
        silverBuy: parseInt(rates.silverBuy),
        silverSell: parseInt(rates.silverSell)
      };
      
      const endpoint = isOwnShop ? '/rates/my-rates' : `/rates/shop/${targetShopId}`;
      const response = await api.put(endpoint, rateData);
      
      if (response.data.success) {
        setSuccess(t('rates.manager.ratesUpdatedSuccessfully'));
        setCurrentRates(response.data.data);
        setUpdateInfo(response.data.data.updateInfo);
        
        // Call callback if provided
        if (onRateUpdate) {
          onRateUpdate(response.data.data);
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('rates.manager.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-xl shadow-luxury p-8 bg-white dark:bg-slate-800 animate-fade-in">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <LoadingSpinner size="medium" />
            <div className="absolute inset-0 animate-glow bg-gold-400/20 rounded-full blur-xl"></div>
          </div>
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            {t('rates.manager.loading')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl shadow-luxury-lg overflow-hidden bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 transition-all duration-300 hover:shadow-gold animate-fade-in">
      {showTitle && (
        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-br from-gold-50/50 to-amber-50/30 dark:from-slate-800 dark:to-slate-900">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                {t('rates.manager.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('rates.manager.subtitle')}
              </p>
            </div>
            
            {/* Real-time Connection Status */}
            <div className="flex flex-wrap items-center gap-3">
              {isConnected ? (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 transition-all duration-300">
                  <Wifi size={18} className="text-green-600 dark:text-green-400 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {t('rates.manager.realTimeActive')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
                  <WifiOff size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('rates.manager.offlineMode')}
                  </span>
                </div>
              )}
              
              {/* Connection Status Badge */}
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                getStatusColor() === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 shadow-sm' :
                getStatusColor() === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 shadow-sm' :
                getStatusColor() === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 shadow-sm' :
                'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}>
                {getStatusMessage()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-8">
        {/* Real-time Update Notification */}
        {realTimeUpdate && (
          <div className="mb-6 glass-effect rounded-xl p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700/30 animate-slide-up">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center animate-glow">
                <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-blue-900 dark:text-blue-100 font-semibold">
                {t('rates.manager.ratesUpdatedRealTime')}
              </span>
            </div>
          </div>
        )}

        {/* Current Rate Info Card */}
        {currentRates && updateInfo && (
          <div className="mb-8 glass-effect rounded-xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700/30 shadow-luxury animate-scale-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center">
                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
              <span className="font-bold text-emerald-900 dark:text-emerald-100 text-lg">
                {t('rates.manager.currentRates')}
              </span>
              {realTimeUpdate && (
                <span className="bg-emerald-200 dark:bg-emerald-700/50 text-emerald-900 dark:text-emerald-100 text-xs px-3 py-1 rounded-full font-semibold animate-pulse shadow-sm">
                  {t('rates.manager.liveUpdated')}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Gold Rates Display */}
              <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gold-200 dark:border-gold-700/30 transition-all duration-300 hover:shadow-gold">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
                    <TrendingUp className="text-white" size={16} />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    {t('rates.display.gold')}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Buy:</span>
                    <span className="font-bold text-gold-600 dark:text-gold-400 text-lg">
                      ₹{currentRates.goldBuy}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sell:</span>
                    <span className="font-bold text-gold-600 dark:text-gold-400 text-lg">
                      ₹{currentRates.goldSell}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Silver Rates Display */}
              <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-silver-200 dark:border-silver-700/30 transition-all duration-300 hover:shadow-silver">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-silver flex items-center justify-center">
                    <TrendingDown className="text-white" size={16} />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    {t('rates.display.silver')}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Buy:</span>
                    <span className="font-bold text-silver-600 dark:text-silver-400 text-lg">
                      ₹{currentRates.silverBuy}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sell:</span>
                    <span className="font-bold text-silver-600 dark:text-silver-400 text-lg">
                      ₹{currentRates.silverSell}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-emerald-200 dark:border-emerald-700/30">
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <User size={14} />
                <span>
                  <span className="font-medium">{updateInfo.updatedBy}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">({updateInfo.role})</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <Clock size={14} />
                <span>{updateInfo.timestamp}</span>
              </div>
              {updateInfo.isToday && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                  {t('rates.display.today')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rate Update Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Gold Rates Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center shadow-gold">
                <TrendingUp className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('rates.manager.goldRatesTitle')}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`transition-all duration-300 ${realTimeUpdate ? 'animate-glow' : ''}`}>
                <Input
                  label={t('rates.manager.goldBuyingRate')}
                  type="number"
                  value={rates.goldBuy}
                  onChange={(e) => handleInputChange('goldBuy', e.target.value)}
                  placeholder={t('rates.manager.goldBuyPlaceholder')}
                  min="1"
                  step="1"
                  required
                  helperText={t('rates.manager.goldBuyHelperText')}
                  className={`luxury-input ${realTimeUpdate ? 'ring-2 ring-gold-400 dark:ring-gold-500 animate-pulse' : ''}`}
                />
              </div>
              <div className={`transition-all duration-300 ${realTimeUpdate ? 'animate-glow' : ''}`}>
                <Input
                  label={t('rates.manager.goldSellingRate')}
                  type="number"
                  value={rates.goldSell}
                  onChange={(e) => handleInputChange('goldSell', e.target.value)}
                  placeholder={t('rates.manager.goldSellPlaceholder')}
                  min="1"
                  step="1"
                  required
                  helperText={t('rates.manager.goldSellHelperText')}
                  className={`luxury-input ${realTimeUpdate ? 'ring-2 ring-gold-400 dark:ring-gold-500 animate-pulse' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Silver Rates Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-silver flex items-center justify-center shadow-silver">
                <TrendingDown className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('rates.manager.silverRatesTitle')}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`transition-all duration-300 ${realTimeUpdate ? 'animate-glow' : ''}`}>
                <Input
                  label={t('rates.manager.silverBuyingRate')}
                  type="number"
                  value={rates.silverBuy}
                  onChange={(e) => handleInputChange('silverBuy', e.target.value)}
                  placeholder={t('rates.manager.silverBuyPlaceholder')}
                  min="1"
                  step="1"
                  required
                  helperText={t('rates.manager.silverBuyHelperText')}
                  className={`luxury-input ${realTimeUpdate ? 'ring-2 ring-silver-400 dark:ring-silver-500 animate-pulse' : ''}`}
                />
              </div>
              <div className={`transition-all duration-300 ${realTimeUpdate ? 'animate-glow' : ''}`}>
                <Input
                  label={t('rates.manager.silverSellingRate')}
                  type="number"
                  value={rates.silverSell}
                  onChange={(e) => handleInputChange('silverSell', e.target.value)}
                  placeholder={t('rates.manager.silverSellPlaceholder')}
                  min="1"
                  step="1"
                  required
                  helperText={t('rates.manager.silverSellHelperText')}
                  className={`luxury-input ${realTimeUpdate ? 'ring-2 ring-silver-400 dark:ring-silver-500 animate-pulse' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-effect rounded-xl p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700/30 animate-slide-up">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-800/30 flex items-center justify-center">
                  <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <p className="text-red-900 dark:text-red-100 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="glass-effect rounded-xl p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/30 animate-slide-up">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800/30 flex items-center justify-center">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <p className="text-green-900 dark:text-green-100 font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-gold hover:shadow-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold text-white shadow-luxury hover:scale-105 active:scale-95"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>{t('rates.manager.updating')}</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{t('rates.manager.updateRates')}</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Rate Information */}
        <div className="mt-8 glass-effect rounded-xl p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 border border-gray-200 dark:border-slate-700">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <AlertCircle className="text-white" size={16} />
            </div>
            <span>{t('rates.manager.importantNotes')}</span>
          </h4>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start space-x-2">
              <span className="text-gold-500 dark:text-gold-400 font-bold mt-1">•</span>
              <span>{t('rates.manager.note1')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gold-500 dark:text-gold-400 font-bold mt-1">•</span>
              <span>{t('rates.manager.note2')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gold-500 dark:text-gold-400 font-bold mt-1">•</span>
              <span>{t('rates.manager.note3')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gold-500 dark:text-gold-400 font-bold mt-1">•</span>
              <span>{isConnected ? t('rates.manager.note4Connected') : t('rates.manager.note4Disconnected')}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-gold-500 dark:text-gold-400 font-bold mt-1">•</span>
              <span>{t('rates.manager.note5')}</span>
            </li>
            {!isConnected && (
              <li className="flex items-start space-x-2">
                <span className="text-yellow-500 dark:text-yellow-400 font-bold mt-1">•</span>
                <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                  {t('rates.manager.note6Offline')}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Real-time Status Info */}
        {isReady && (
          <div className="mt-6 glass-effect rounded-xl p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700/30 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800/30 flex items-center justify-center animate-glow">
                <Wifi size={20} className="text-green-600 dark:text-green-400 animate-pulse" />
              </div>
              <span className="text-green-900 dark:text-green-100 font-semibold">
                {t('rates.manager.realTimeUpdatesActive')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RateManager;