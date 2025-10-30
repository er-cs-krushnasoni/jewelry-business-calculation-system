import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BlockingMessage from '../../components/rates/BlockingMessage';
import NewJewelryCalculator from '../../components/calculator/NewJewelryCalculator';
import OldJewelryCalculator from '../../components/calculator/OldJewelryCalculator';
import { Calculator, AlertTriangle, Sparkles, Wifi, WifiOff } from 'lucide-react';

const CalculatorPage = () => {
  const { user } = useAuth();
  const { systemBlocking, isConnected } = useSocket();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockingMessage, setBlockingMessage] = useState('');
  const [rates, setRates] = useState(null);
  const [error, setError] = useState('');
  const [calculatorType, setCalculatorType] = useState('new');

  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const blockingResponse = await api.get('/rates/blocking-status');
      if (blockingResponse.data.success) {
        const blockingData = blockingResponse.data.data;
        setIsBlocked(blockingData.isBlocked);
        setBlockingMessage(blockingData.message);
        
        if (!blockingData.isBlocked) {
          try {
            const ratesResponse = await api.get('/rates/my-rates');
            if (ratesResponse.data.success) {
              setRates(ratesResponse.data.data);
            }
          } catch (rateError) {
            console.error('Error fetching rates:', rateError);
            setIsBlocked(true);
            setBlockingMessage('Unable to fetch current rates. Please try again.');
          }
        }
      }
    } catch (err) {
      console.error('Error checking system status:', err);
      setError('Failed to check system status. Please refresh the page.');
      setIsBlocked(true);
      setBlockingMessage('System error. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (systemBlocking) {
      console.log('Calculator: Real-time blocking update:', systemBlocking);
      setIsBlocked(systemBlocking.isBlocked);
      setBlockingMessage(systemBlocking.message);
      
      if (!systemBlocking.isBlocked) {
        fetchRatesQuietly();
      }
    }
  }, [systemBlocking]);

  const fetchRatesQuietly = async () => {
    try {
      const response = await api.get('/rates/my-rates');
      if (response.data.success) {
        setRates(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching rates after unblock:', err);
    }
  };

  const handleUnblock = () => {
    setIsBlocked(false);
    setBlockingMessage('');
    fetchRatesQuietly();
  };

  useEffect(() => {
    if (user && user.shopId) {
      checkSystemStatus();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center animate-fade-in">
          <div className="mb-6">
            <LoadingSpinner size="large" />
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 font-medium animate-pulse">
            {t('calculator.page.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error && !isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="glass-effect bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-luxury-lg p-8 max-w-md w-full text-center animate-scale-in backdrop-blur-xl border border-gold-200/20 dark:border-gold-500/20">
          <div className="text-red-500 dark:text-red-400 mb-6 animate-bounce">
            <AlertTriangle size={56} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {t('calculator.page.error')}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-gold hover:shadow-gold text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-luxury"
          >
            {t('calculator.page.refreshPage')}
          </button>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <BlockingMessage
        isBlocked={isBlocked}
        blockingMessage={blockingMessage}
        onUnblock={handleUnblock}
        showRefreshButton={true}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header Section */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="bg-gradient-gold p-3 rounded-xl shadow-gold animate-glow">
            <Calculator className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 dark:from-gold-400 dark:to-gold-200 bg-clip-text text-transparent">
            {t('calculator.jewelryCalculator')}
          </h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {t('calculator.subtitle')}
        </p>
        
        {/* Connection Status Badge */}
        {!isConnected && (
          <div className="mt-6 inline-flex items-center gap-3 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700/50 rounded-xl px-6 py-3 shadow-lg animate-slide-up backdrop-blur-sm">
            <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              {t('calculator.offlineMessage')}
            </p>
          </div>
        )}
      </div>

{/* Current Rates Display (Compact Version) */}
{rates && ['admin', 'manager'].includes(user?.role) && (
  <div className="mb-8 p-4 sm:p-6 rounded-xl border border-gold-200/30 dark:border-gold-500/20 bg-white/70 dark:bg-slate-800/70 shadow-sm backdrop-blur-md animate-fade-in">
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="h-5 w-5 text-gold-500 dark:text-gold-400" />
      <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
        {t('calculator.currentRates.title')}
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gold Rates */}
      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-gold-50 to-amber-50 dark:from-gold-900/20 dark:to-amber-900/20 border border-gold-200 dark:border-gold-600/30 transition-all">
        <h3 className="font-semibold text-gold-700 dark:text-gold-400 flex items-center gap-1 text-base mb-2">
          <Sparkles size={16} />
          {t('calculator.currentRates.goldPer10g')}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center px-2 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-md">
            <span className="text-slate-600 dark:text-slate-300 text-sm">{t('calculator.currentRates.selling')}</span>
            <span className="font-semibold text-gold-700 dark:text-gold-300 text-base">₹{rates.goldSell}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-md">
            <span className="text-slate-600 dark:text-slate-300 text-sm">{t('calculator.currentRates.buying')}</span>
            <span className="font-semibold text-gold-700 dark:text-gold-300 text-base">₹{rates.goldBuy}</span>
          </div>
        </div>
      </div>

      {/* Silver Rates */}
      <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-700/40 border border-slate-300 dark:border-slate-600/30 transition-all">
        <h3 className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 text-base mb-2">
          <Sparkles size={16} />
          {t('calculator.currentRates.silverPerKg')}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center px-2 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-md">
            <span className="text-slate-600 dark:text-slate-300 text-sm">{t('calculator.currentRates.selling')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-base">₹{rates.silverSell}</span>
          </div>
          <div className="flex justify-between items-center px-2 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-md">
            <span className="text-slate-600 dark:text-slate-300 text-sm">{t('calculator.currentRates.buying')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-base">₹{rates.silverBuy}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Update Info */}
    {rates.updateInfo && (
      <div className="mt-4 pt-3 border-t border-gold-200/40 dark:border-gold-700/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {t('calculator.currentRates.lastUpdated', {
              user: rates.updateInfo.updatedBy,
              timestamp: rates.updateInfo.timestamp
            })}
          </p>
          {isConnected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm">
              <Wifi size={14} />
              {t('calculator.currentRates.live')}
            </span>
          )}
        </div>
      </div>
    )}
  </div>
)}


      {/* Calculator Type Selection */}
      <div className="mb-10 glass-effect bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-luxury p-8 border border-gold-200/30 dark:border-gold-500/20 backdrop-blur-xl animate-slide-up">
        <label className="block text-lg font-bold text-slate-900 dark:text-white mb-6">
          {t('calculator.page.selectJewelryType')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* New Jewelry Button */}
          <button
            type="button"
            onClick={() => setCalculatorType('new')}
            className={`group relative p-4 sm:p-8 rounded-2xl border-3 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              calculatorType === 'new'
                ? 'border-emerald-500 dark:border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-luxury-lg'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-luxury hover:shadow-luxury-lg'
            }`}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold mb-3 transition-colors ${
                calculatorType === 'new' 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
              }`}>
                {t('calculator.newJewelry')}
              </div>
              <div className="text-slate-600 dark:text-slate-400 mb-4 text-base">
                {t('calculator.page.freshStock')}
              </div>
              {calculatorType === 'new' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  {t('calculator.page.active')}
                </div>
              )}
            </div>
            {calculatorType === 'new' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-green-400/10 animate-glow"></div>
            )}
          </button>

          {/* Old Jewelry Button */}
          <button
            type="button"
            onClick={() => setCalculatorType('old')}
            className={`group relative p-8 rounded-2xl border-3 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              calculatorType === 'old'
                ? 'border-orange-500 dark:border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 shadow-luxury-lg'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-orange-300 dark:hover:border-orange-600 shadow-luxury hover:shadow-luxury-lg'
            }`}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold mb-3 transition-colors ${
                calculatorType === 'old' 
                  ? 'text-orange-700 dark:text-orange-300' 
                  : 'text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400'
              }`}>
                {t('calculator.oldJewelry')}
              </div>
              <div className="text-slate-600 dark:text-slate-400 mb-4 text-base">
                {t('calculator.page.scrapResale')}
              </div>
              {calculatorType === 'old' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  {t('calculator.page.active')}
                </div>
              )}
            </div>
            {calculatorType === 'old' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/10 to-amber-400/10 animate-glow"></div>
            )}
          </button>
        </div>
      </div>

      {/* Calculator Component */}
      <div className="glass-effect bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-luxury-lg border border-gold-200/30 dark:border-gold-500/20 backdrop-blur-xl overflow-hidden animate-slide-up">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-gold border-b-2 border-gold-300/50 dark:border-gold-600/30">
          <h2 className="text-2xl font-bold text-white mb-2">
            {calculatorType === 'new' ? t('calculator.new.title') : t('calculator.old.title')}
          </h2>
          <p className="text-gold-100 text-base leading-relaxed">
            {calculatorType === 'new' 
              ? t('calculator.new.description')
              : t('calculator.old.description')
            }
          </p>
        </div>
        <div className="p-4 sm:p-8">
          {rates ? (
            calculatorType === 'new' ? (
              <NewJewelryCalculator rates={rates} />
            ) : (
              <OldJewelryCalculator rates={rates} />
            )
          ) : (
            <div className="text-center py-12">
              <LoadingSpinner size="medium" />
              <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">
                {t('calculator.currentRates.loadingRates')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Connection Indicator */}
      {isConnected && (
        <div className="mt-8 glass-effect bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-xl p-6 shadow-luxury animate-slide-up backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-800 dark:text-emerald-300 font-bold text-lg">
              {t('calculator.realtime.active')}
            </span>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="mt-10 animate-slide-up">
        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-sm sm:text-base flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          {t('calculator.features.title')}
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">          {[
            t('calculator.features.newJewelry'),
            t('calculator.features.oldJewelry'),
            t('calculator.features.multiLanguage'),
            t('calculator.features.roleBased'),
            t('calculator.features.realtimeRates'),
            t('calculator.features.smartRounding')
          ].map((feature, index) => (
            <li 
  key={index} 
  className="flex items-start gap-1 sm:gap-2 p-2 sm:p-3bg-white/60 dark:bg-slate-800/60 rounded-xl hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg"
>
              <span className="flex-shrink-0 w-6 h-6 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm shadow-gold">
                ✓
              </span>
              <span className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-medium leading-snug">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CalculatorPage;