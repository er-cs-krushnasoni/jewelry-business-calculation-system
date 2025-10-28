import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calculator, Info, AlertCircle, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const NewJewelryCalculator = ({ rates }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [metal, setMetal] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  
  // Categories data
  const [categories, setCategories] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // User permissions
  const [permissions, setPermissions] = useState(null);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    sellingRate: false,
    margin: false
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    if (metal) {
      loadCategories(metal);
      loadItemCategories(metal);
    } else {
      setCategories([]);
      setItemCategories([]);
      setFilteredCategories([]);
    }
  }, [metal]);

  useEffect(() => {
    if (categories.length > 0) {
      if (itemCategory) {
        const filtered = categories.filter(cat => cat.itemCategory === itemCategory);
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categories);
      }
    }
  }, [itemCategory, categories]);

  useEffect(() => {
    setItemCategory('');
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
  }, [metal]);

  useEffect(() => {
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
  }, [itemCategory]);

  const loadPermissions = async () => {
    try {
      const response = await api.get('/calculator/user-permissions');
      if (response.data.success) {
        setPermissions(response.data.data.permissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const loadCategories = async (selectedMetal) => {
    try {
      setCategoriesLoading(true);
      const response = await api.get(`/calculator/new-jewelry/categories?metal=${selectedMetal}`);
      
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('calculator.new.toast.categoriesLoadFailed'));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadItemCategories = async (selectedMetal) => {
    try {
      const response = await api.get(`/calculator/new-jewelry/item-categories?metal=${selectedMetal}`);
      
      if (response.data.success) {
        setItemCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading item categories:', error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCategory || !weight) {
      toast.error(t('calculator.new.toast.selectCategoryWeight'));
      return;
    }
  
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error(t('calculator.new.toast.validWeight'));
      return;
    }
  
    // Convert Mg to grams for GOLD (1000 Mg = 1 gram)
    const weightInGrams = metal === 'GOLD' ? weightNum / 1000 : weightNum;

    try {
      setLoading(true);
      
      const response = await api.post('/calculator/new-jewelry/calculate', {
        categoryId: selectedCategory._id,
        weight: weightInGrams
      });

      if (response.data.success) {
        setResult(response.data.data);
        setExpandedSections({ sellingRate: false, margin: false });
        toast.success(t('calculator.new.toast.calculationComplete'));
      }
    } catch (error) {
      console.error('Calculation error:', error);
      const errorMessage = error.response?.data?.message || t('calculator.new.toast.calculationFailed');
      toast.error(errorMessage);
      
      if (error.response?.status === 404) {
        toast.error(t('calculator.new.toast.categoryNotFound'));
        if (metal) {
          loadCategories(metal);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resetCalculation = () => {
    setWeight('');
    setResult(null);
  };

  const resetAll = () => {
    setMetal('');
    setItemCategory('');
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
    setCategories([]);
    setItemCategories([]);
    setFilteredCategories([]);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.ceil(num));
  };

  const calculateMakingChargesPercentage = (makingCharges, ratePerGram) => {
    if (!ratePerGram || ratePerGram === 0) return 0;
    return (makingCharges / ratePerGram) * 100;
  };

  const calculateOurMarginPercentage = (ourMargin, finalSellingAmount) => {
    if (!finalSellingAmount || finalSellingAmount === 0) return 0;
    return (ourMargin / finalSellingAmount) * 100;
  };

  const calculateWholesalerWastage = (buyingPercentage, purityPercentage) => {
    return buyingPercentage - purityPercentage;
  };

  const ResponsiveCurrency = ({ amount, className = "" }) => {
    const containerRef = React.useRef(null);
    const textRef = React.useRef(null);
    const [scale, setScale] = React.useState(1);
    
    React.useEffect(() => {
      const fitText = () => {
        if (containerRef.current && textRef.current) {
          // Reset scale first
          setScale(1);
          
          // Wait for the reset to apply
          requestAnimationFrame(() => {
            const containerWidth = containerRef.current.offsetWidth;
            const textWidth = textRef.current.scrollWidth;
            
            // Calculate scale needed to fit text in container
            if (textWidth > containerWidth) {
              const newScale = (containerWidth * 0.95) / textWidth; // 95% to add some padding
              setScale(Math.max(newScale, 0.25)); // Minimum scale of 0.25 for very long numbers
            } else {
              setScale(1);
            }
          });
        }
      };
      
      fitText();
      window.addEventListener('resize', fitText);
      
      // Use a timeout to ensure the component is fully rendered
      const timeout = setTimeout(fitText, 100);
      
      return () => {
        window.removeEventListener('resize', fitText);
        clearTimeout(timeout);
      };
    }, [amount]);
    
    return (
      <div ref={containerRef} className="w-full flex justify-center items-center overflow-hidden px-2">
        <div 
          ref={textRef}
          className={`text-6xl md:text-7xl font-black whitespace-nowrap ${className}`}
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out'
          }}
        >
          ₹{formatCurrency(amount)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 shadow-luxury border border-gold-200 dark:border-slate-700">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="p-3 bg-gradient-gold rounded-xl shadow-gold">
            <Calculator className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('calculator.new.title')}</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Calculate jewelry pricing with precision</p>
          </div>
        </div>
        {(metal || selectedCategory) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetAll}
            className="border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-slate-700 transition-all duration-300"
          >
            {t('calculator.new.buttons.resetAll')}
          </Button>
        )}
      </div>

      {/* Metal Selection */}
      <div className="space-y-4 animate-slide-up">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          <span className="text-gold-600 dark:text-gold-400">{t('calculator.new.steps.step1')}</span> {t('calculator.new.steps.selectMetal')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
          {/* Gold Button */}
          <button
            type="button"
            onClick={() => setMetal('GOLD')}
            className={`group relative p-4 sm:p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              metal === 'GOLD'
                ? 'border-gold-400 dark:border-gold-500 bg-gradient-gold shadow-gold scale-105'
                : 'border-gold-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gold-300 dark:hover:border-gold-600 hover:shadow-luxury hover:scale-102'
            }`}
          >
            {metal === 'GOLD' && (
              <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 to-gold-600/20 animate-glow"></div>
            )}
            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Coins className={`h-8 w-8 transition-transform group-hover:scale-110 ${
                  metal === 'GOLD' ? 'text-white' : 'text-gold-500 dark:text-gold-400'
                }`} />
                <span className={`text-xl font-semibold ${
                  metal === 'GOLD' ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {t('calculator.new.metal.gold')}
                </span>
              </div>
              {rates && ['admin', 'manager'].includes(user?.role) && (
  <div className={`text-sm space-y-1 ${
    metal === 'GOLD' ? 'text-gold-50' : 'text-gray-600 dark:text-slate-400'
  }`}>
    <div className="font-medium">{t('calculator.new.metal.sell')} ₹{rates.goldSell}{t('calculator.new.metal.per10g')}</div>
  </div>
)}
            </div>
          </button>
          
          {/* Silver Button */}
          <button
            type="button"
            onClick={() => setMetal('SILVER')}
            className={`group relative p-4 sm:p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              metal === 'SILVER'
                ? 'border-silver-400 dark:border-silver-500 bg-gradient-silver shadow-silver scale-105'
                : 'border-silver-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-silver-300 dark:hover:border-silver-600 hover:shadow-luxury hover:scale-102'
            }`}
          >
            {metal === 'SILVER' && (
              <div className="absolute inset-0 bg-gradient-to-br from-silver-400/20 to-silver-600/20 animate-glow"></div>
            )}
            <div className="relative">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Coins className={`h-8 w-8 transition-transform group-hover:scale-110 ${
                  metal === 'SILVER' ? 'text-white' : 'text-silver-500 dark:text-silver-400'
                }`} />
                <span className={`text-xl font-semibold ${
                  metal === 'SILVER' ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {t('calculator.new.metal.silver')}
                </span>
              </div>
              {rates && ['admin', 'manager'].includes(user?.role) && (
  <div className={`text-sm space-y-1 ${
    metal === 'SILVER' ? 'text-silver-50' : 'text-gray-600 dark:text-slate-400'
  }`}>
    <div className="font-medium">{t('calculator.new.metal.sell')} ₹{rates.silverSell}{t('calculator.new.metal.perKg')}</div>
  </div>
)}
            </div>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      {metal && itemCategories.length > 0 && permissions?.canAccessAllCategories && (
        <div className="space-y-4 animate-slide-up bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 shadow-luxury border border-gold-200 dark:border-slate-700">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            <span className="text-gold-600 dark:text-gold-400">{t('calculator.new.steps.step2')}</span> {t('calculator.new.steps.filterCategory')}
          </label>
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className="w-full border-2 border-gold-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600 focus:border-transparent transition-all duration-300"
          >
            <option value="">{t('calculator.new.category.allCategories')} ({categories.length})</option>
            {itemCategories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Selection */}
      {metal && (
        <div className="space-y-4 animate-slide-up bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 shadow-luxury border border-gold-200 dark:border-slate-700">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            <span className="text-gold-600 dark:text-gold-400">
              {permissions?.canAccessAllCategories ? t('calculator.new.steps.step3') : t('calculator.new.steps.step2')}
            </span> {t('calculator.new.steps.selectCode')} <span className="text-red-500">*</span>
          </label>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center p-12 glass-effect rounded-xl">
              <LoadingSpinner />
              <span className="ml-3 text-gray-700 dark:text-slate-300 font-medium">{t('calculator.new.category.loading')}</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-3 sm:p-6 shadow-lg">
              <div className="flex items-start gap-2 sm:gap-4">
                <AlertCircle size={24} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                <div className="text-sm">
                  <p className="font-bold text-amber-900 dark:text-amber-300 mb-2">{t('calculator.new.category.noAvailable')}</p>
                  <p className="text-amber-800 dark:text-amber-400">
                    {itemCategory 
                      ? `${t('calculator.new.category.notFound')} ${metal} - ${itemCategory}. ${t('calculator.new.category.noMatchFilter')}`
                      : `${t('calculator.new.category.notFound')} ${metal} ${t('calculator.new.category.notFound')}. ${t('calculator.new.category.contactAdmin')}`
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border-2 border-gold-200 dark:border-slate-700 rounded-xl">
              {filteredCategories.map((category, index) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left p-5 border-b border-gold-100 dark:border-slate-700 last:border-b-0 transition-all duration-300 ${
                    selectedCategory?._id === category._id
                      ? 'bg-gradient-gold shadow-gold text-white'
                      : 'bg-white dark:bg-slate-800 hover:bg-gold-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white'
                  } ${index === 0 ? 'rounded-t-xl' : ''} ${index === filteredCategories.length - 1 ? 'rounded-b-xl' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`font-semibold text-lg ${
                        selectedCategory?._id === category._id ? 'text-white' : 'text-gray-900 dark:text-white'
                      }`}>
                        {category.code} - {category.itemCategory}
                      </div>
                    </div>
                    {selectedCategory?._id === category._id && (
                      <div className="ml-4">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                          <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Descriptions */}
      {selectedCategory && selectedCategory.descriptions && selectedCategory.descriptions.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          {selectedCategory.descriptions.map((desc, index) => (
            <div 
              key={index}
              className={`rounded-xl p-3 sm:p-6 border-2 shadow-luxury transition-all duration-300 hover:scale-102 ${
                desc.type === 'universal' 
                  ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-300 dark:border-purple-700' 
                  : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-300 dark:border-blue-700'
              }`}
            >
              <h3 className={`font-semibold mb-3 text-xs uppercase tracking-wider flex items-center gap-2 ${
                desc.type === 'universal' ? 'text-purple-900 dark:text-purple-300' : 'text-blue-900 dark:text-blue-300'
              }`}>
                <Info size={16} />
                {desc.type === 'universal' ? t('calculator.new.descriptions.universal') : t('calculator.new.descriptions.roleSpecific')}
              </h3>
              <p className={`leading-relaxed ${
                desc.type === 'universal' ? 'text-purple-800 dark:text-purple-200' : 'text-blue-800 dark:text-blue-200'
              }`}>
                {desc.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Weight Input & Calculate */}
      {selectedCategory && (
        <div className="space-y-6 animate-slide-up bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 shadow-luxury border border-gold-200 dark:border-slate-700">
          <Input
  label={`${permissions?.canAccessAllCategories ? t('calculator.new.steps.step4') : t('calculator.new.steps.step3')} ${t('calculator.new.steps.enterWeight')}`}
  type="number"
  value={weight}
  onChange={(e) => setWeight(e.target.value)}
  placeholder={metal === 'GOLD' ? 'Enter weight in Mg' : 'Enter weight in grams'}
  min="0"
  step={metal === 'GOLD' ? '1' : '0.01'}
  required
  className="text-lg"
  helperText={metal === 'GOLD' ? 'Weight in Milligrams (Mg)' : 'Weight in Grams (g)'}
/>

          <div className="flex gap-2 sm:gap-4">
            <Button
              onClick={handleCalculate}
              disabled={loading || !weight}
              className="flex-1 bg-gradient-gold hover:shadow-gold text-white font-semibold py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{t('calculator.new.buttons.calculating')}</span>
                </>
              ) : (
                <>
                  <Calculator size={20} />
                  <span className="ml-2">{t('calculator.new.buttons.calculate')}</span>
                </>
              )}
            </Button>
            
            {(weight || result) && (
              <Button
                variant="outline"
                onClick={resetCalculation}
                disabled={loading}
                className="border-2 border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-slate-700 py-4 px-6 rounded-xl transition-all duration-300"
              >
                {t('calculator.new.buttons.clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 border-t-4 border-gold-300 dark:border-gold-600 pt-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('calculator.new.results.title')}</h3>
          </div>

          {/* Final Amount Card */}
<div className="relative bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 dark:from-emerald-600 dark:via-green-600 dark:to-teal-700 rounded-2xl p-4 sm:p-8 text-center shadow-luxury-lg overflow-hidden animate-scale-in">
  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
  <div className="relative">
    <div className="text-sm font-semibold text-emerald-100 mb-3 uppercase tracking-wider">{t('calculator.new.results.finalAmount')}</div>
    <ResponsiveCurrency 
      amount={result.finalSellingAmount}
      className="text-white mb-4"
    />
    <div className="text-base text-emerald-100 font-medium">
  {t('calculator.new.results.for')} <span className="font-semibold text-white">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span> {t('calculator.new.results.of')} <span className="font-semibold text-white">{result.input.code}</span>
</div>
    {result.roundingInfo?.roundingApplied && (
      <div className="text-xs text-emerald-200 mt-3 font-medium">
        ({t('calculator.new.results.roundedFrom')} ₹{formatNumber(result.roundingInfo.beforeRounding)})
      </div>
    )}
  </div>
</div>

          {/* Selling Rate Breakdown */}
          <div className="bg-white dark:bg-slate-800 border-2 border-blue-300 dark:border-blue-700 rounded-2xl overflow-hidden shadow-luxury transition-all duration-300 hover:shadow-luxury-lg">
            <button
              onClick={() => toggleSection('sellingRate')}
              className="w-full px-3 sm:px-6 py-4 sm:py-6 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-300 group"
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Calculator className="text-white h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{t('calculator.new.sellingRate.title')}</div>
                  <div className="text-3xl font-semibold text-blue-900 dark:text-blue-300">
                    ₹{formatCurrency(result.sellingRateBreakdown.sellingRatePerGram)}
                  </div>
                </div>
              </div>
              {expandedSections.sellingRate ? (
                <ChevronUp className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" size={28} />
              ) : (
                <ChevronDown className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" size={28} />
              )}
            </button>
            
            {expandedSections.sellingRate && (
              <div className="px-3 sm:px-6 py-4 sm:py-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-lg">{t('calculator.new.sellingRate.breakdown')}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 sm:py-3 px-2 sm:px-4 bg-white dark:bg-slate-800 rounded-xl">
                    <span className="text-blue-800 dark:text-blue-300 font-medium">{t('calculator.new.sellingRate.ratePerGram')}</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-200 text-lg">
                      ₹{formatCurrency(result.sellingRateBreakdown.actualRatePerGram)}
                      {['admin', 'manager'].includes(user?.role) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 ml-2 font-normal">
                          ({formatNumber(result.percentages.purity)}% {t('calculator.new.sellingRate.purity')})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 sm:py-3 px-2 sm:px-4 bg-white dark:bg-slate-800 rounded-xl">
                    <span className="text-blue-800 dark:text-blue-300 font-medium">{t('calculator.new.sellingRate.makingCharges')}</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-200 text-lg">
                      ₹{formatCurrency(result.sellingRateBreakdown.makingChargesPerGram)}
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-2 font-normal">
                        ({formatNumber(calculateMakingChargesPercentage(
                          result.sellingRateBreakdown.makingChargesPerGram,
                          result.sellingRateBreakdown.actualRatePerGram
                        ))}% {t('calculator.new.sellingRate.ofRate')})
                      </span>
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-blue-300 dark:border-blue-700 mt-3 px-2 sm:px-4">
                    <div className="flex justify-between items-center font-semibold text-blue-900 dark:text-blue-200">
                      <span className="text-lg">{t('calculator.new.sellingRate.total')}</span>
                      <span className="text-2xl">
                        ₹{formatCurrency(result.sellingRateBreakdown.sellingRatePerGram)}
                        {['admin', 'manager'].includes(user?.role) && (
                        <span className="text-sm text-blue-600 dark:text-blue-400 ml-2 font-normal">
                          ({formatNumber(result.percentages.selling)}% {t('calculator.new.sellingRate.rate')})
                        </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Margin Breakdown */}
          {permissions?.canViewMargins && (
            <div className="bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-700 rounded-2xl overflow-hidden shadow-luxury transition-all duration-300 hover:shadow-luxury-lg">
              <button
                onClick={() => toggleSection('margin')}
                className="w-full px-3 sm:px-6 py-4 sm:py-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-slate-700 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Coins className="text-white h-6 w-6" />
                  </div>
                  <div className="text-left">
  <div className="text-sm font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">{t('calculator.new.margin.title')}</div>
  <div className="text-2xl sm:text-3xl font-semibold text-purple-900 dark:text-purple-300 break-words">
    ₹{formatCurrency(result.marginBreakdown.ourMargin)}
  </div>
  <div className="text-sm sm:text-base text-purple-600 dark:text-purple-400 font-medium mt-1">
    ({formatNumber(calculateOurMarginPercentage(
      result.marginBreakdown.ourMargin,
      result.finalSellingAmount
    ))}% {t('calculator.new.margin.ofSelling')})
  </div>
</div>
                </div>
                {expandedSections.margin ? (
                  <ChevronUp className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" size={28} />
                ) : (
                  <ChevronDown className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" size={28} />
                )}
              </button>
              
              {expandedSections.margin && permissions?.canViewWholesaleRates && (
                <div className="px-3 sm:px-6 py-4 sm:py-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-t-2 border-purple-200 dark:border-purple-700">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-5 text-lg">{t('calculator.new.margin.breakdown')}</h4>
                  <div className="space-y-4">
                    {/* Purchase from Wholesaler */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wide">{t('calculator.new.margin.purchaseFromWholesaler')}</span>
                        <span className="text-xl font-semibold text-purple-900 dark:text-purple-200">
                          ₹{formatCurrency(result.marginBreakdown.purchaseFromWholesaler)}
                        </span>
                      </div>
                      <div className="ml-2 sm:ml-4 space-y-2 text-sm">
                        <div className="flex justify-between text-purple-700 dark:text-purple-400 py-2 px-2 sm:px-3 bg-purple-50 dark:bg-slate-700 rounded-lg">
                          <span>{t('calculator.new.margin.baseCost')} ({formatNumber(result.percentages.buying)}% {t('calculator.new.sellingRate.rate')})</span>
                          <span className="font-semibold">₹{formatCurrency(result.marginBreakdown.purchaseFromWholesalerBreakdown.baseCost)}</span>
                        </div>
                        <div className="flex justify-between text-purple-700 dark:text-purple-400 py-2 px-2 sm:px-3 bg-purple-50 dark:bg-slate-700 rounded-lg">
                          <span>{t('calculator.new.margin.labourCharges')} ₹{formatNumber(result.labourInfo.labourPerGram)} {t('calculator.new.margin.perGram')} × {result.input.weight}g</span>
                          <span className="font-semibold">₹{formatCurrency(result.marginBreakdown.purchaseFromWholesalerBreakdown.labourCharges)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actual Value */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wide">{t('calculator.new.margin.actualValue')}</span>
                        <span className="text-xl font-semibold text-purple-900 dark:text-purple-200">
                          ₹{formatCurrency(result.marginBreakdown.actualValueByPurity)}
                          <span className="text-sm text-purple-600 dark:text-purple-400 ml-2 font-normal">
                            ({formatNumber(result.percentages.purity)}% {t('calculator.new.sellingRate.purity')})
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Formula Breakdown */}
                    <div className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 rounded-xl p-3 sm:p-6 border-2 border-purple-300 dark:border-purple-600 shadow-lg">
                      <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Calculator size={16} />
                        {t('calculator.new.margin.formula')}
                      </h5>
                      <div className="space-y-2 sm:space-y-3 text-sm">
                        {/* Step 1: Actual Value */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-600 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg">1</div>
                          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-2 sm:p-3">
                            <div className="text-purple-800 dark:text-purple-300 font-semibold mb-1">{t('calculator.new.margin.actualValuePurity')}</div>
                            <div className="font-mono text-lg font-semibold text-purple-900 dark:text-purple-200">
                              ₹{formatCurrency(result.marginBreakdown.actualValueByPurity)}
                              <span className="text-xs text-purple-600 dark:text-purple-400 ml-2 font-normal">
                                ({formatNumber(result.percentages.purity)}% {t('calculator.new.sellingRate.purity')})
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Wholesaler Margin */}
                        <div className="flex items-start gap-2 sm:gap-3 pl-4 sm:pl-9">
                          <div className="text-purple-600 dark:text-purple-400 font-semibold text-xl">+</div>
                          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-2 sm:p-3">
                            <div className="text-purple-800 dark:text-purple-300 font-semibold mb-1">{t('calculator.new.margin.wholesalerMargin')}</div>
                            <div className="font-mono text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2">
                              ₹{formatCurrency(result.marginBreakdown.wholesalerMargin)}
                            </div>
                            <div className="ml-2 sm:ml-4 space-y-1.5 text-xs">
                              <div className="flex justify-between text-purple-700 dark:text-purple-400 py-1.5 px-1.5 sm:px-2 bg-purple-50 dark:bg-slate-700 rounded">
                                <span>├─ {t('calculator.new.margin.wastage')} {formatNumber(result.percentages.buying - result.percentages.purity)}%</span>
                                <span className="font-semibold">₹{formatCurrency(result.marginBreakdown.wholesalerMarginBreakdown.wastageMargin)}</span>
                              </div>
                              <div className="flex justify-between text-purple-700 dark:text-purple-400 py-1.5 px-1.5 sm:px-2 bg-purple-50 dark:bg-slate-700 rounded">
                                <span>└─ {t('calculator.new.margin.labour')} ₹{formatNumber(result.labourInfo.labourPerGram)} {t('calculator.new.margin.perGram')}</span>
                                <span className="font-semibold">₹{formatCurrency(result.marginBreakdown.wholesalerMarginBreakdown.labourCharges)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Equals Purchase Price */}
                        <div className="flex items-start gap-3 border-t-2 border-purple-300 dark:border-purple-600 pt-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-600 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg">=</div>
                          <div className="flex-1 bg-gradient-to-br from-purple-200 to-violet-200 dark:from-purple-800 dark:to-violet-800 rounded-lg p-3">
                            <div className="text-purple-900 dark:text-purple-200 font-semibold mb-1">{t('calculator.new.margin.purchaseFromWholesaler')}</div>
                            <div className="font-mono text-xl font-semibold text-purple-900 dark:text-purple-100">
                              ₹{formatCurrency(result.marginBreakdown.purchaseFromWholesaler)}
                              <span className="text-xs text-purple-700 dark:text-purple-300 ml-2 font-normal">
                                ({formatNumber(result.percentages.buying)}% {t('calculator.new.sellingRate.rate')} + ₹{formatNumber(result.labourInfo.labourPerGram)} {t('calculator.new.margin.perGram')} {t('calculator.new.margin.labour')})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Our Margin */}
                        <div className="flex items-start gap-3 pl-9 mt-4">
                          <div className="text-purple-600 dark:text-purple-400 font-semibold text-xl">+</div>
                          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg p-2 sm:p-3">
                            <div className="text-purple-800 dark:text-purple-300 font-semibold mb-1">{t('calculator.new.margin.ourMargin')}</div>
                            <div className="font-mono text-lg font-semibold text-purple-900 dark:text-purple-200">
                              ₹{formatCurrency(result.marginBreakdown.ourMargin)}
                              <span className="text-xs text-purple-600 dark:text-purple-400 ml-2 font-normal">
                                ({formatNumber(calculateOurMarginPercentage(
                                  result.marginBreakdown.ourMargin,
                                  result.finalSellingAmount
                                ))}% {t('calculator.new.margin.ofSelling')})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Final Amount */}
<div className="flex items-start gap-2 sm:gap-3 border-t-2 border-green-400 dark:border-green-600 pt-3 mt-3">
  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg">=</div>
  <div className="flex-1 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-lg p-3 sm:p-4 shadow-gold overflow-hidden">
    <div className="text-green-50 font-semibold mb-1 text-xs sm:text-sm uppercase tracking-wide">{t('calculator.new.margin.finalSellingAmount')}</div>
    <div className="font-mono font-semibold text-white text-xl sm:text-2xl break-words">
      ₹{formatCurrency(result.finalSellingAmount)}
    </div>
    <div className="text-xs sm:text-sm text-green-100 font-semibold mt-1">
      ({formatNumber(result.percentages.selling)}% {t('calculator.new.sellingRate.rate')})
    </div>
  </div>
</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
                        <div className="text-xs text-gray-500 dark:text-slate-500 text-center pt-6">
            {t('calculator.new.results.calculatedAt')} {new Date(result.metadata.calculatedAt).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewJewelryCalculator;