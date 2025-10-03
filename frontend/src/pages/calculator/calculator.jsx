import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BlockingMessage from '../../components/rates/BlockingMessage';
import NewJewelryCalculator from '../../components/calculator/NewJewelryCalculator';
import OldJewelryCalculator from '../../components/calculator/OldJewelryCalculator';
import { Calculator, AlertTriangle, Sparkles } from 'lucide-react';

const CalculatorPage = () => {
  const { user } = useAuth();
  const { systemBlocking, isConnected } = useSocket();
  
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading calculator...</p>
        </div>
      </div>
    );
  }

  if (error && !isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
          >
            Refresh Page
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Jewellery Calculator
          </h1>
        </div>
        <p className="text-gray-600">
          Calculate accurate prices based on current gold and silver rates
        </p>
        
        {!isConnected && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              You're currently offline. Calculations will use the last known rates.
            </p>
          </div>
        )}
      </div>

      {rates && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-600 flex items-center gap-2">
                <Sparkles size={16} />
                Gold (per 10g)
              </h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Buying:</span>
                <span className="font-semibold">₹{rates.goldBuy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selling:</span>
                <span className="font-semibold">₹{rates.goldSell}</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-400 flex items-center gap-2">
                <Sparkles size={16} />
                Silver (per kg)
              </h3>
              <div className="flex justify-between">
                <span className="text-gray-600">Buying:</span>
                <span className="font-semibold">₹{rates.silverBuy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Selling:</span>
                <span className="font-semibold">₹{rates.silverSell}</span>
              </div>
            </div>
          </div>
          
          {rates.updateInfo && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Last updated by {rates.updateInfo.updatedBy} on {rates.updateInfo.timestamp}
                {isConnected && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Live
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Jewelry Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setCalculatorType('new')}
            className={`p-4 rounded-lg border-2 transition-all ${
              calculatorType === 'new'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-green-200'
            }`}
          >
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                calculatorType === 'new' ? 'text-green-700' : 'text-gray-700'
              }`}>
                NEW Jewelry
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Fresh stock calculations
              </div>
              {calculatorType === 'new' && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Active
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCalculatorType('old')}
            className={`p-4 rounded-lg border-2 transition-all ${
              calculatorType === 'old'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            <div className="text-center">
              <div className={`text-lg font-semibold ${
                calculatorType === 'old' ? 'text-orange-700' : 'text-gray-700'
              }`}>
                OLD Jewelry
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Scrap & resale calculations
              </div>
              {calculatorType === 'old' && (
                <div className="mt-2 text-xs text-orange-600 font-medium">
                  ✓ Active
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {calculatorType === 'new' ? 'NEW Jewelry Calculator' : 'OLD Jewelry Calculator'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {calculatorType === 'new' 
              ? 'Calculate buying and selling prices for new jewelry with category-based percentages'
              : 'Calculate scrap values for old jewelry with Own/Other selection'
            }
          </p>
        </div>
        <div className="p-6">
          {rates ? (
            calculatorType === 'new' ? (
              <NewJewelryCalculator rates={rates} />
            ) : (
              <OldJewelryCalculator rates={rates} />
            )
          ) : (
            <div className="text-center py-8">
              <LoadingSpinner size="medium" />
              <p className="mt-2 text-gray-600">Loading rates...</p>
            </div>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium text-sm">
              Real-time updates active - Rates and calculations will update automatically
            </span>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Calculator Features</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">✓</span>
            <span>NEW Jewelry: Metal filtering, category selection, and smart rounding</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">✓</span>
            <span>OLD Jewelry: Scrap calculations with Own/Other source selection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">✓</span>
            <span>Multi-language support: Categories and descriptions in Gujarati, Hindi, and English</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">✓</span>
            <span>Role-based visibility: Different calculation details based on your access level</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">✓</span>
            <span>Real-time rate updates: Calculations automatically use the latest rates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">✓</span>
            <span>Smart rounding: NEW jewelry rounds up, OLD jewelry rounds down to nearest 50</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CalculatorPage;