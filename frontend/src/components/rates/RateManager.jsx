import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Save, AlertCircle, CheckCircle, Clock, User } from 'lucide-react';

const RateManager = ({ shopId = null, onRateUpdate = null, showTitle = true }) => {
  const { user, canUpdateRates } = useAuth();
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

  // Determine if we're working with user's own shop or specific shop
  const isOwnShop = !shopId;
  const targetShopId = shopId || user?.shopId;

  // Check if user can update rates
  if (!canUpdateRates()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <div>
            <p className="font-semibold text-yellow-800">Access Restricted</p>
            <p className="text-yellow-700">Only Shop Admin and Manager can update rates.</p>
          </div>
        </div>
      </div>
    );
  }

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
        setError(err.response?.data?.message || 'Failed to fetch current rates');
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
  };

  // Validate rates
  const validateRates = () => {
    const errors = [];
    
    // Check if all fields are filled
    if (!rates.goldBuy || !rates.goldSell || !rates.silverBuy || !rates.silverSell) {
      errors.push('All rate fields are required');
    }
    
    // Check if values are positive integers
    const goldBuy = parseInt(rates.goldBuy);
    const goldSell = parseInt(rates.goldSell);
    const silverBuy = parseInt(rates.silverBuy);
    const silverSell = parseInt(rates.silverSell);
    
    if (isNaN(goldBuy) || goldBuy < 1) {
      errors.push('Gold buying rate must be a positive number');
    }
    if (isNaN(goldSell) || goldSell < 1) {
      errors.push('Gold selling rate must be a positive number');
    }
    if (isNaN(silverBuy) || silverBuy < 1) {
      errors.push('Silver buying rate must be a positive number');
    }
    if (isNaN(silverSell) || silverSell < 1) {
      errors.push('Silver selling rate must be a positive number');
    }
    
    // Check selling > buying
    if (!isNaN(goldSell) && !isNaN(goldBuy) && goldSell <= goldBuy) {
      errors.push('Gold selling rate must be higher than buying rate');
    }
    if (!isNaN(silverSell) && !isNaN(silverBuy) && silverSell <= silverBuy) {
      errors.push('Silver selling rate must be higher than buying rate');
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
        setSuccess('Rates updated successfully!');
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
      setError(err.response?.data?.message || 'Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-3">
          <LoadingSpinner size="medium" />
          <span className="text-gray-600">Loading current rates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Rate Management</h2>
          <p className="text-gray-600 mt-1">Update daily gold and silver rates</p>
        </div>
      )}
      
      <div className="p-6">
        {/* Current Rate Info */}
        {currentRates && updateInfo && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="text-blue-600" size={16} />
              <span className="font-semibold text-blue-800">Current Rates</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Gold: </span>
                <span className="font-medium">Buy ₹{currentRates.goldBuy}/10g, Sell ₹{currentRates.goldSell}/10g</span>
              </div>
              <div>
                <span className="text-gray-600">Silver: </span>
                <span className="font-medium">Buy ₹{currentRates.silverBuy}/kg, Sell ₹{currentRates.silverSell}/kg</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <User size={12} />
                <span>Updated by {updateInfo.updatedBy} ({updateInfo.role})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{updateInfo.timestamp}</span>
              </div>
              {updateInfo.isToday && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Today</span>
              )}
            </div>
          </div>
        )}

        {/* Rate Update Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gold Rates */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Gold Rates (₹ per 10 grams)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Gold Buying Rate"
                type="number"
                value={rates.goldBuy}
                onChange={(e) => handleInputChange('goldBuy', e.target.value)}
                placeholder="e.g., 52000"
                min="1"
                step="1"
                required
                helperText="Rate at which gold is purchased"
              />
              <Input
                label="Gold Selling Rate"
                type="number"
                value={rates.goldSell}
                onChange={(e) => handleInputChange('goldSell', e.target.value)}
                placeholder="e.g., 53000"
                min="1"
                step="1"
                required
                helperText="Rate at which gold is sold"
              />
            </div>
          </div>

          {/* Silver Rates */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Silver Rates (₹ per kg)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Silver Buying Rate"
                type="number"
                value={rates.silverBuy}
                onChange={(e) => handleInputChange('silverBuy', e.target.value)}
                placeholder="e.g., 75000"
                min="1"
                step="1"
                required
                helperText="Rate at which silver is purchased"
              />
              <Input
                label="Silver Selling Rate"
                type="number"
                value={rates.silverSell}
                onChange={(e) => handleInputChange('silverSell', e.target.value)}
                placeholder="e.g., 78000"
                min="1"
                step="1"
                required
                helperText="Rate at which silver is sold"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="text-red-600" size={20} />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-600" size={20} />
                <p className="text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <LoadingSpinner size="small" />
              ) : (
                <Save size={16} />
              )}
              <span>{saving ? 'Updating...' : 'Update Rates'}</span>
            </Button>
          </div>
        </form>

        {/* Rate Information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Selling rates must be higher than buying rates</li>
            <li>• Gold rates are per 10 grams, Silver rates are per kg</li>
            <li>• Only whole numbers are accepted (no decimals)</li>
            <li>• Rates are used for all calculations in your shop</li>
            <li>• Updated rates are immediately available to all users</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RateManager;