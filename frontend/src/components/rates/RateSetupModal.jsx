import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle, Save, TrendingUp, TrendingDown } from 'lucide-react';

const RateSetupModal = ({ 
  isOpen, 
  onClose, 
  shopId = null, 
  onSetupComplete = null,
  canClose = false // Whether user can close without setting rates
}) => {
  const { user } = useAuth();
  const [rates, setRates] = useState({
    goldBuy: '',
    goldSell: '',
    silverBuy: '',
    silverSell: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Determine target shop
  const targetShopId = shopId || user?.shopId;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRates({
        goldBuy: '',
        goldSell: '',
        silverBuy: '',
        silverSell: ''
      });
      setError('');
      setStep(1);
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setRates(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Validate current step
  const validateStep = (currentStep) => {
    const errors = [];
    
    if (currentStep === 1) {
      // Validate gold rates
      const goldBuy = parseInt(rates.goldBuy);
      const goldSell = parseInt(rates.goldSell);
      
      if (!rates.goldBuy) {
        errors.push('Gold buying rate is required');
      } else if (isNaN(goldBuy) || goldBuy < 1) {
        errors.push('Gold buying rate must be a positive number');
      }
      
      if (!rates.goldSell) {
        errors.push('Gold selling rate is required');
      } else if (isNaN(goldSell) || goldSell < 1) {
        errors.push('Gold selling rate must be a positive number');
      }
      
      if (!isNaN(goldBuy) && !isNaN(goldSell) && goldSell < goldBuy) {
        errors.push('Gold selling rate must be equal to or higher than buying rate');
      }
    }
    
    if (currentStep === 2) {
      // Validate silver rates
      const silverBuy = parseInt(rates.silverBuy);
      const silverSell = parseInt(rates.silverSell);
      
      if (!rates.silverBuy) {
        errors.push('Silver buying rate is required');
      } else if (isNaN(silverBuy) || silverBuy < 1) {
        errors.push('Silver buying rate must be a positive number');
      }
      
      if (!rates.silverSell) {
        errors.push('Silver selling rate is required');
      } else if (isNaN(silverSell) || silverSell < 1) {
        errors.push('Silver selling rate must be a positive number');
      }
      
      if (!isNaN(silverBuy) && !isNaN(silverSell) && silverSell < silverBuy) {
        errors.push('Silver selling rate must be equal to or higher than buying rate');
      }
    }
    
    return errors;
  };

  // Handle next step
  const handleNextStep = () => {
    const validationErrors = validateStep(step);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setError('');
    setStep(2);
  };

  // Handle previous step
  const handlePreviousStep = () => {
    setError('');
    setStep(1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all rates
    const step1Errors = validateStep(1);
    const step2Errors = validateStep(2);
    const allErrors = [...step1Errors, ...step2Errors];
    
    if (allErrors.length > 0) {
      setError(allErrors.join(', '));
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const rateData = {
        goldBuy: parseInt(rates.goldBuy),
        goldSell: parseInt(rates.goldSell),
        silverBuy: parseInt(rates.silverBuy),
        silverSell: parseInt(rates.silverSell)
      };
      
      const endpoint = shopId ? `/rates/shop/${targetShopId}` : '/rates/my-rates';
      const response = await api.put(endpoint, rateData);
      
      if (response.data.success) {
        if (onSetupComplete) {
          onSetupComplete(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set up rates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={canClose ? onClose : () => {}} // Prevent closing if canClose is false
      title="Rate Setup Required"
      size="large"
      showCloseButton={canClose}
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Step {step} of 2
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <AlertCircle className="mx-auto text-yellow-600 mb-2" size={32} />
            <h3 className="text-lg font-semibold text-yellow-800">Initial Rate Setup</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Please set up your daily gold and silver rates to start using the calculator.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Gold Rates */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-yellow-800">Gold Rates Setup</h4>
                </div>
                <p className="text-yellow-700 text-sm mb-4">
  Set your gold rates per 10 grams. Selling rate must be equal to or higher than buying rate.
</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      label="Gold Buying Rate"
                      type="number"
                      value={rates.goldBuy}
                      onChange={(e) => handleInputChange('goldBuy', e.target.value)}
                      placeholder="e.g., 52000"
                      min="1"
                      step="1"
                      required
                      icon={<TrendingDown className="text-red-500" size={16} />}
                    />
                    <p className="text-xs text-gray-500">₹ per 10 grams (buying price)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      label="Gold Selling Rate"
                      type="number"
                      value={rates.goldSell}
                      onChange={(e) => handleInputChange('goldSell', e.target.value)}
                      placeholder="e.g., 53000"
                      min="1"
                      step="1"
                      required
                      icon={<TrendingUp className="text-green-500" size={16} />}
                    />
                    <p className="text-xs text-gray-500">₹ per 10 grams (selling price)</p>
                  </div>
                </div>

                {/* Gold Rate Preview */}
                {rates.goldBuy && rates.goldSell && (
                  <div className="mt-4 p-3 bg-white rounded border border-yellow-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rate Preview:</p>
                    <div className="flex justify-between items-center text-sm">
                      <span>Per 10g: ₹{parseInt(rates.goldBuy) || 0} / ₹{parseInt(rates.goldSell) || 0}</span>
                      <span className="text-gray-500">
                        Per 1g: ₹{Math.floor((parseInt(rates.goldBuy) || 0) / 10)} / ₹{Math.ceil((parseInt(rates.goldSell) || 0) / 10)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Silver Rates */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-gray-800">Silver Rates Setup</h4>
                </div>
                <p className="text-gray-700 text-sm mb-4">
  Set your silver rates per 1 kg. Selling rate must be equal to or higher than buying rate.
</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      label="Silver Buying Rate"
                      type="number"
                      value={rates.silverBuy}
                      onChange={(e) => handleInputChange('silverBuy', e.target.value)}
                      placeholder="e.g., 75000"
                      min="1"
                      step="1"
                      required
                      icon={<TrendingDown className="text-red-500" size={16} />}
                    />
                    <p className="text-xs text-gray-500">₹ per kg (buying price)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      label="Silver Selling Rate"
                      type="number"
                      value={rates.silverSell}
                      onChange={(e) => handleInputChange('silverSell', e.target.value)}
                      placeholder="e.g., 78000"
                      min="1"
                      step="1"
                      required
                      icon={<TrendingUp className="text-green-500" size={16} />}
                    />
                    <p className="text-xs text-gray-500">₹ per kg (selling price)</p>
                  </div>
                </div>

                {/* Silver Rate Preview */}
                {rates.silverBuy && rates.silverSell && (
                  <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rate Preview:</p>
                    <div className="flex justify-between items-center text-sm">
                      <span>Per kg: ₹{parseInt(rates.silverBuy) || 0} / ₹{parseInt(rates.silverSell) || 0}</span>
                      <span className="text-gray-500">
                        Per 1g: ₹{Math.floor((parseInt(rates.silverBuy) || 0) / 1000)} / ₹{Math.ceil((parseInt(rates.silverSell) || 0) / 1000)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">Setup Summary</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">
                      <strong>Gold:</strong> Buy ₹{rates.goldBuy}/10g, Sell ₹{rates.goldSell}/10g
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">
                      <strong>Silver:</strong> Buy ₹{rates.silverBuy}/kg, Sell ₹{rates.silverSell}/kg
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="text-red-600" size={20} />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {step === 1 ? (
              <div></div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={saving}
              >
                Previous
              </Button>
            )}

            <div className="flex space-x-3">
              {canClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
              
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={saving}
                >
                  Next: Silver Rates
                </Button>
              ) : (
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
                  <span>{saving ? 'Setting up...' : 'Complete Setup'}</span>
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Important Notes:</p>
          <ul className="space-y-1">
  <li>• Only whole numbers are accepted (no decimal values)</li>
  <li>• Gold rates are per 10 grams, Silver rates are per kg</li>
  <li>• Selling rates must be equal to or higher than buying rates</li>
  <li>• These rates will be used for all calculations in your shop</li>
  <li>• You can update these rates anytime from the rate management section</li>
</ul>
        </div>
      </div>
    </Modal>
  );
};

export default RateSetupModal;