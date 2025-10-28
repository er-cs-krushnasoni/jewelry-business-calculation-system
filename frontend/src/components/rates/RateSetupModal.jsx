import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle, Save, TrendingUp, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';

const RateSetupModal = ({ 
  isOpen, 
  onClose, 
  shopId = null, 
  onSetupComplete = null,
  canClose = false
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [rates, setRates] = useState({
    goldBuy: '',
    goldSell: '',
    silverBuy: '',
    silverSell: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const targetShopId = shopId || user?.shopId;

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

  const handleInputChange = (field, value) => {
    setRates(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateStep = (currentStep) => {
    const errors = [];
    
    if (currentStep === 1) {
      const goldBuy = parseInt(rates.goldBuy);
      const goldSell = parseInt(rates.goldSell);
      
      if (!rates.goldBuy) {
        errors.push(t('rates.setup.errors.goldBuyRequired'));
      } else if (isNaN(goldBuy) || goldBuy < 1) {
        errors.push(t('rates.setup.errors.goldBuyPositive'));
      }
      
      if (!rates.goldSell) {
        errors.push(t('rates.setup.errors.goldSellRequired'));
      } else if (isNaN(goldSell) || goldSell < 1) {
        errors.push(t('rates.setup.errors.goldSellPositive'));
      }
      
      if (!isNaN(goldBuy) && !isNaN(goldSell) && goldSell < goldBuy) {
        errors.push(t('rates.setup.errors.goldSellHigher'));
      }
    }
    
    if (currentStep === 2) {
      const silverBuy = parseInt(rates.silverBuy);
      const silverSell = parseInt(rates.silverSell);
      
      if (!rates.silverBuy) {
        errors.push(t('rates.setup.errors.silverBuyRequired'));
      } else if (isNaN(silverBuy) || silverBuy < 1) {
        errors.push(t('rates.setup.errors.silverBuyPositive'));
      }
      
      if (!rates.silverSell) {
        errors.push(t('rates.setup.errors.silverSellRequired'));
      } else if (isNaN(silverSell) || silverSell < 1) {
        errors.push(t('rates.setup.errors.silverSellPositive'));
      }
      
      if (!isNaN(silverBuy) && !isNaN(silverSell) && silverSell < silverBuy) {
        errors.push(t('rates.setup.errors.silverSellHigher'));
      }
    }
    
    return errors;
  };

  const handleNextStep = () => {
    const validationErrors = validateStep(step);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    setError('');
    setStep(2);
  };

  const handlePreviousStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      setError(err.response?.data?.message || t('rates.setup.errors.setupFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={canClose ? onClose : () => {}}
      title={t('rates.setup.title')}
      size="large"
      showCloseButton={canClose}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Luxury Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center flex-1">
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-500 ${
              step >= 1 
                ? 'bg-gradient-gold text-white shadow-gold scale-110' 
                : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
            }`}>
              {step > 1 ? <CheckCircle2 size={20} /> : '1'}
              {step >= 1 && (
                <div className="absolute inset-0 rounded-full bg-gradient-gold animate-glow"></div>
              )}
            </div>
            
            <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
              step >= 2 
                ? 'bg-gradient-gold shadow-gold' 
                : 'bg-gray-200 dark:bg-slate-700'
            }`}></div>
            
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-500 ${
              step >= 2 
                ? 'bg-gradient-gold text-white shadow-gold scale-110' 
                : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
            }`}>
              {step > 2 ? <CheckCircle2 size={20} /> : '2'}
              {step >= 2 && (
                <div className="absolute inset-0 rounded-full bg-gradient-gold animate-glow"></div>
              )}
            </div>
          </div>
          
          <div className="ml-6 text-sm font-medium text-gray-600 dark:text-slate-400">
            {t('rates.setup.stepOf', { current: step, total: 2 })}
          </div>
        </div>

        {/* Luxury Header Alert */}
        <div className="glass-effect rounded-xl p-6 border border-gold-200 dark:border-gold-800/30 shadow-luxury animate-slide-up">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                <Sparkles className="text-white" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold bg-gradient-gold bg-clip-text text-transparent mb-2">
                {t('rates.setup.initialSetupTitle')}
              </h3>
              <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">
                {t('rates.setup.initialSetupDescription')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Gold Rates */}
          {step === 1 && (
            <div className="space-y-6 animate-scale-in">
              <div className="glass-effect rounded-xl p-8 border border-gold-200 dark:border-gold-800/30 shadow-luxury-lg hover:shadow-gold transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-gold shadow-gold animate-glow"></div>
                  <h4 className="text-xl font-bold text-gold-800 dark:text-gold-300">
                    {t('rates.setup.goldRatesSetup')}
                  </h4>
                </div>
                
                <p className="text-gray-700 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                  {t('rates.setup.goldRatesDescription')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 group">
                    <div className="relative">
                      <Input
                        label={t('rates.setup.goldBuyingRate')}
                        type="number"
                        value={rates.goldBuy}
                        onChange={(e) => handleInputChange('goldBuy', e.target.value)}
                        placeholder={t('rates.setup.goldBuyPlaceholder')}
                        min="1"
                        step="1"
                        required
                        icon={<TrendingDown className="text-red-500" size={18} />}
                        className="luxury-input"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                      {t('rates.setup.per10gBuying')}
                    </p>
                  </div>
                  
                  <div className="space-y-3 group">
                    <div className="relative">
                      <Input
                        label={t('rates.setup.goldSellingRate')}
                        type="number"
                        value={rates.goldSell}
                        onChange={(e) => handleInputChange('goldSell', e.target.value)}
                        placeholder={t('rates.setup.goldSellPlaceholder')}
                        min="1"
                        step="1"
                        required
                        icon={<TrendingUp className="text-green-500" size={18} />}
                        className="luxury-input"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                      {t('rates.setup.per10gSelling')}
                    </p>
                  </div>
                </div>

                {/* Gold Rate Preview Card */}
                {rates.goldBuy && rates.goldSell && (
                  <div className="mt-6 glass-effect rounded-xl p-5 border border-gold-300 dark:border-gold-700/30 shadow-luxury animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gold-800 dark:text-gold-300 flex items-center">
                        <Sparkles size={16} className="mr-2" />
                        {t('rates.setup.ratePreview')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                          {t('rates.setup.per10g')}
                        </span>
                        <span className="text-base font-bold bg-gradient-gold bg-clip-text text-transparent">
                          ₹{parseInt(rates.goldBuy) || 0} / ₹{parseInt(rates.goldSell) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-slate-800/30 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                          {t('rates.setup.per1g')}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                          ₹{Math.floor((parseInt(rates.goldBuy) || 0) / 10)} / ₹{Math.ceil((parseInt(rates.goldSell) || 0) / 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Silver Rates */}
          {step === 2 && (
            <div className="space-y-6 animate-scale-in">
              <div className="glass-effect rounded-xl p-8 border border-silver-200 dark:border-silver-800/30 shadow-luxury-lg hover:shadow-silver transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-silver shadow-silver animate-glow"></div>
                  <h4 className="text-xl font-bold text-silver-800 dark:text-silver-300">
                    {t('rates.setup.silverRatesSetup')}
                  </h4>
                </div>
                
                <p className="text-gray-700 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                  {t('rates.setup.silverRatesDescription')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 group">
                    <div className="relative">
                      <Input
                        label={t('rates.setup.silverBuyingRate')}
                        type="number"
                        value={rates.silverBuy}
                        onChange={(e) => handleInputChange('silverBuy', e.target.value)}
                        placeholder={t('rates.setup.silverBuyPlaceholder')}
                        min="1"
                        step="1"
                        required
                        icon={<TrendingDown className="text-red-500" size={18} />}
                        className="luxury-input"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                      {t('rates.setup.perKgBuying')}
                    </p>
                  </div>
                  
                  <div className="space-y-3 group">
                    <div className="relative">
                      <Input
                        label={t('rates.setup.silverSellingRate')}
                        type="number"
                        value={rates.silverSell}
                        onChange={(e) => handleInputChange('silverSell', e.target.value)}
                        placeholder={t('rates.setup.silverSellPlaceholder')}
                        min="1"
                        step="1"
                        required
                        icon={<TrendingUp className="text-green-500" size={18} />}
                        className="luxury-input"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                      {t('rates.setup.perKgSelling')}
                    </p>
                  </div>
                </div>

                {/* Silver Rate Preview Card */}
                {rates.silverBuy && rates.silverSell && (
                  <div className="mt-6 glass-effect rounded-xl p-5 border border-silver-300 dark:border-silver-700/30 shadow-luxury animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-silver-800 dark:text-silver-300 flex items-center">
                        <Sparkles size={16} className="mr-2" />
                        {t('rates.setup.ratePreview')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                          {t('rates.setup.perKg')}
                        </span>
                        <span className="text-base font-bold bg-gradient-silver bg-clip-text text-transparent">
                          ₹{parseInt(rates.silverBuy) || 0} / ₹{parseInt(rates.silverSell) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/30 dark:bg-slate-800/30 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                          {t('rates.setup.per1g')}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                          ₹{Math.floor((parseInt(rates.silverBuy) || 0) / 1000)} / ₹{Math.ceil((parseInt(rates.silverSell) || 0) / 1000)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Luxury Summary Card */}
              <div className="glass-effect rounded-xl p-6 border border-primary-200 dark:border-primary-800/30 shadow-luxury bg-gradient-to-br from-primary-50/50 to-gold-50/50 dark:from-slate-800/50 dark:to-slate-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle2 className="text-primary-600 dark:text-primary-400" size={24} />
                  <h5 className="font-bold text-lg text-primary-800 dark:text-primary-300">
                    {t('rates.setup.setupSummary')}
                  </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-gold-200 dark:border-gold-800/30">
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      <span className="font-bold text-gold-700 dark:text-gold-400">
                        {t('rates.setup.gold')}
                      </span>
                      <br />
                      <span className="text-xs">
                        {t('rates.setup.buy')} ₹{rates.goldBuy}/10g • {t('rates.setup.sell')} ₹{rates.goldSell}/10g
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-silver-200 dark:border-silver-800/30">
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      <span className="font-bold text-silver-700 dark:text-silver-400">
                        {t('rates.setup.silver')}
                      </span>
                      <br />
                      <span className="text-xs">
                        {t('rates.setup.buy')} ₹{rates.silverBuy}/kg • {t('rates.setup.sell')} ₹{rates.silverSell}/kg
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Luxury Error Message */}
          {error && (
            <div className="glass-effect rounded-xl p-4 border border-red-300 dark:border-red-800/30 bg-red-50/80 dark:bg-red-900/20 shadow-luxury animate-fade-in">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-800 dark:text-red-300 text-sm font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Luxury Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-slate-700">
            {step === 1 ? (
              <div></div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={saving}
                className="transition-all duration-300 hover:shadow-luxury"
              >
                {t('rates.setup.previous')}
              </Button>
            )}

            <div className="flex space-x-3">
              {canClose && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                  className="transition-all duration-300 hover:shadow-luxury"
                >
                  {t('rates.setup.cancel')}
                </Button>
              )}
              
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={saving}
                  className="bg-gradient-gold hover:shadow-gold transition-all duration-300 transform hover:scale-105"
                >
                  {t('rates.setup.nextSilverRates')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-gold hover:shadow-gold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                  {saving ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span className="font-semibold">
                    {saving ? t('rates.setup.settingUp') : t('rates.setup.completeSetup')}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Luxury Help Card */}
        <div className="glass-effect rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-luxury bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-700/50">
          <p className="font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center">
            <AlertCircle size={18} className="mr-2 text-primary-600 dark:text-primary-400" />
            {t('rates.setup.importantNotes')}
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-3 mt-2 flex-shrink-0"></span>
              <span>{t('rates.setup.note1')}</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-3 mt-2 flex-shrink-0"></span>
              <span>{t('rates.setup.note2')}</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-3 mt-2 flex-shrink-0"></span>
              <span>{t('rates.setup.note3')}</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-3 mt-2 flex-shrink-0"></span>
              <span>{t('rates.setup.note4')}</span>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mr-3 mt-2 flex-shrink-0"></span>
              <span>{t('rates.setup.note5')}</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default RateSetupModal;