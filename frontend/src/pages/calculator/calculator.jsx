import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BlockingMessage from '../../components/rates/BlockingMessage';
import { Calculator, AlertTriangle } from 'lucide-react';

// Simple unified jewelry calculator placeholder component
const JewelryCalculator = ({ rates }) => {
  const [metal, setMetal] = useState('gold');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    if (!weight || !rates) return;

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    let buyRate, sellRate, unit;
    
    if (metal === 'gold') {
      buyRate = rates.goldBuy;
      sellRate = rates.goldSell;
      unit = '10g';
      // Convert weight to 10g units for gold
      const buyPrice = (weightNum / 10) * buyRate;
      const sellPrice = (weightNum / 10) * sellRate;
      
      setResult({
        metal: 'Gold',
        weight: weightNum,
        unit: 'grams',
        buyPrice: Math.floor(buyPrice),
        sellPrice: Math.ceil(sellPrice),
        buyRate,
        sellRate,
        rateUnit: unit
      });
    } else {
      buyRate = rates.silverBuy;
      sellRate = rates.silverSell;
      unit = 'kg';
      // Convert weight to kg units for silver
      const buyPrice = (weightNum / 1000) * buyRate;
      const sellPrice = (weightNum / 1000) * sellRate;
      
      setResult({
        metal: 'Silver',
        weight: weightNum,
        unit: 'grams',
        buyPrice: Math.floor(buyPrice),
        sellPrice: Math.ceil(sellPrice),
        buyRate,
        sellRate,
        rateUnit: unit
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Metal Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Metal
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setMetal('gold')}
            className={`px-4 py-2 rounded-lg border ${
              metal === 'gold'
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            Gold
          </button>
          <button
            type="button"
            onClick={() => setMetal('silver')}
            className={`px-4 py-2 rounded-lg border ${
              metal === 'silver'
                ? 'bg-gray-100 border-gray-300 text-gray-800'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            Silver
          </button>
        </div>
      </div>

      {/* Weight Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Weight (grams)
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter weight in grams"
          min="0"
          step="0.01"
        />
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={!weight || !rates}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Calculate
      </button>

      {/* Results */}
      {result && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-3">Calculation Result</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Metal:</span>
              <span className="font-medium">{result.metal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weight:</span>
              <span className="font-medium">{result.weight} {result.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate ({result.rateUnit}):</span>
              <span className="font-medium">₹{result.buyRate} / ₹{result.sellRate}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-green-700">
              <span>Buying Price:</span>
              <span className="font-bold">₹{result.buyPrice}</span>
            </div>
            <div className="flex justify-between text-red-700">
              <span>Selling Price:</span>
              <span className="font-bold">₹{result.sellPrice}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalculatorPage = () => {
  const { user } = useAuth();
  const { systemBlocking, isConnected } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockingMessage, setBlockingMessage] = useState('');
  const [rates, setRates] = useState(null);
  const [error, setError] = useState('');

  // Check initial blocking status and fetch rates
  const checkSystemStatus = async () => {
    try {
      setLoading(true);
      setError('');

      // Check blocking status
      const blockingResponse = await api.get('/rates/blocking-status');
      if (blockingResponse.data.success) {
        const blockingData = blockingResponse.data.data;
        setIsBlocked(blockingData.isBlocked);
        setBlockingMessage(blockingData.message);
        
        // If not blocked, fetch current rates
        if (!blockingData.isBlocked) {
          try {
            const ratesResponse = await api.get('/rates/my-rates');
            if (ratesResponse.data.success) {
              setRates(ratesResponse.data.data);
            }
          } catch (rateError) {
            console.error('Error fetching rates:', rateError);
            // If we can't get rates, the system should be blocked
            setIsBlocked(true);
            setBlockingMessage('Unable to fetch current rates. Please try again.');
          }
        }
      }
    } catch (err) {
      console.error('Error checking system status:', err);
      setError('Failed to check system status. Please refresh the page.');
      // Default to blocked state on error
      setIsBlocked(true);
      setBlockingMessage('System error. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time blocking status updates
  useEffect(() => {
    if (systemBlocking) {
      console.log('Calculator: Real-time blocking update:', systemBlocking);
      setIsBlocked(systemBlocking.isBlocked);
      setBlockingMessage(systemBlocking.message);
      
      // If unblocked, fetch rates
      if (!systemBlocking.isBlocked) {
        fetchRatesQuietly();
      }
    }
  }, [systemBlocking]);

  // Quietly fetch rates without loading state
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

  // Handle unblock callback
  const handleUnblock = () => {
    setIsBlocked(false);
    setBlockingMessage('');
    fetchRatesQuietly();
  };

  // Initial load
  useEffect(() => {
    if (user && user.shopId) {
      checkSystemStatus();
    }
  }, [user]);

  // Show loading state
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

  // Show error state
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

  // Show blocking message if system is blocked
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

  // Show calculator if system is not blocked
  return (
    <div className="max-w-4xl mx-auto">
      {/* Calculator Header */}
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
        
        {/* Connection Status Indicator */}
        {!isConnected && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              You're currently offline. Calculations will use the last known rates.
            </p>
          </div>
        )}
      </div>

      {/* Current Rates Display */}
      {rates && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-600">Gold (per 10g)</h3>
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
              <h3 className="font-medium text-gray-400">Silver (per kg)</h3>
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

      {/* Unified Calculator */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Price Calculator</h2>
          <p className="text-gray-600 text-sm mt-1">
            Calculate buying and selling prices for gold and silver
          </p>
        </div>
        <div className="p-6">
          {rates ? (
            <JewelryCalculator rates={rates} />
          ) : (
            <div className="text-center py-8">
              <LoadingSpinner size="medium" />
              <p className="mt-2 text-gray-600">Loading rates...</p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Updates Info */}
      {isConnected && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium text-sm">
              Real-time updates active - Rates will update automatically when changed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorPage;