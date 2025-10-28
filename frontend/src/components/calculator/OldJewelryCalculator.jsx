import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calculator, AlertCircle, ChevronDown, ChevronUp, Coins, Sparkles, Package, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const OldJewelryCalculator = ({ rates }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [metal, setMetal] = useState('');
  const [source, setSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedResaleCategory, setSelectedResaleCategory] = useState(null);
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  const [permissions, setPermissions] = useState(null);
  
  const [expandedSections, setExpandedSections] = useState({
    scrapMargin: false,
    directResaleMargin: false,
    polishRepairMargin: false
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    if (metal) {
      loadCategories(metal);
    } else {
      setCategories([]);
      setFilteredCategories([]);
    }
  }, [metal]);

  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  useEffect(() => {
    setSource('');
    setSelectedCategory(null);
    setSelectedResaleCategory(null);
    setWeight('');
    setResult(null);
  }, [metal]);

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedResaleCategory(null);
    setWeight('');
    setResult(null);
  }, [source]);

  useEffect(() => {
    setSelectedResaleCategory(null);
    setWeight('');
    setResult(null);
  }, [selectedCategory]);

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
      const response = await api.get(`/calculator/old-jewelry/categories?metal=${selectedMetal}`);
      
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('calculator.old.toast.categoriesLoadFailed'));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCategory || !weight || !source) {
      toast.error(t('calculator.old.toast.selectAllFields'));
      return;
    }
    
    const canSeeResale = permissions && ['admin', 'manager', 'pro_client'].includes(user.role);
    if (selectedCategory.resaleEnabled && 
        selectedCategory.resaleCategories && 
        selectedCategory.resaleCategories.length > 0 && 
        canSeeResale && 
        !selectedResaleCategory) {
      toast.error(t('calculator.old.toast.selectResaleCategory'));
      return;
    }
    
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error(t('calculator.old.toast.validWeight'));
      return;
    }
    
    // Convert Mg to grams for GOLD (1000 Mg = 1 gram)
    const weightInGrams = metal === 'GOLD' ? weightNum / 1000 : weightNum;

    try {
      setLoading(true);
      
      const requestBody = {
        categoryId: selectedCategory._id,
        weight: weightInGrams,
        source: source
      };

      if (selectedResaleCategory) {
        requestBody.resaleCategoryId = selectedResaleCategory._id;
      }

      const response = await api.post('/calculator/old-jewelry/calculate', requestBody);

      if (response.data.success) {
        setResult(response.data.data);
        setExpandedSections({ scrapMargin: false, directResaleMargin: false, polishRepairMargin: false });
        toast.success(t('calculator.old.toast.calculationComplete'));
      }
    } catch (error) {
      console.error('Calculation error:', error);
      const errorMessage = error.response?.data?.message || t('calculator.old.toast.calculationFailed');
      toast.error(errorMessage);
      
      if (error.response?.status === 404) {
        toast.error(t('calculator.old.toast.categoryNotFound'));
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
    setSource('');
    setSelectedCategory(null);
    setSelectedResaleCategory(null);
    setWeight('');
    setResult(null);
    setCategories([]);
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
    }).format(Math.floor(num));
  };

  const calculatePercentage = (part, whole) => {
    if (!whole || whole === 0) return 0;
    return ((part / whole) * 100).toFixed(2);
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

  const canSeeResale = permissions && ['admin', 'manager', 'pro_client'].includes(user.role);
  const canSeeMarginBreakdown = permissions && ['admin', 'manager'].includes(user.role);

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Calculator className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('calculator.old.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Calculate scrap and resale values
            </p>
          </div>
        </div>
        {(metal || selectedCategory) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetAll}
            className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all duration-300"
          >
            {t('calculator.old.buttons.resetAll')}
          </Button>
        )}
      </div>
  
      {/* Step 1: Metal Selection */}
      <div className="space-y-2 sm:space-y-4 animate-slide-up">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            1
          </div>
          <label className="block text-base font-semibold text-gray-900 dark:text-white">
            {t('calculator.old.steps.step1')} {t('calculator.old.steps.selectMetal')}
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gold Button */}
          <button
            type="button"
            onClick={() => setMetal('GOLD')}
            className={`group relative p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              metal === 'GOLD'
                ? 'border-amber-400 dark:border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 shadow-xl scale-105'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:scale-102'
            }`}
          >
            {metal === 'GOLD' && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 animate-pulse" />
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  metal === 'GOLD'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg'
                    : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-amber-100 dark:group-hover:bg-amber-950'
                }`}>
                  <Coins className={`w-6 h-6 ${
                    metal === 'GOLD' ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                  }`} />
                </div>
                <span className={`text-xl font-bold transition-colors ${
                  metal === 'GOLD' 
                    ? 'text-amber-900 dark:text-amber-100' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('calculator.old.metal.gold')}
                </span>
              </div>
              
              {rates && ['admin', 'manager'].includes(user?.role) && (
  <div className="mt-4 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-amber-200 dark:border-amber-800">
    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
      {t('calculator.old.metal.buy')}
    </div>
    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
      ₹{rates.goldBuy}
      <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">/10g</span>
    </div>
  </div>
)}
              
              {metal === 'GOLD' && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
          
          {/* Silver Button */}
          <button
            type="button"
            onClick={() => setMetal('SILVER')}
            className={`group relative p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              metal === 'SILVER'
                ? 'border-gray-400 dark:border-gray-500 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-900/50 dark:to-slate-950/50 shadow-xl scale-105'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:scale-102'
            }`}
          >
            {metal === 'SILVER' && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-300/20 to-slate-300/20 animate-pulse" />
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={`p-3 rounded-xl transition-all duration-300 ${
                  metal === 'SILVER'
                    ? 'bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg'
                    : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-600'
                }`}>
                  <Coins className={`w-6 h-6 ${
                    metal === 'SILVER' ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                  }`} />
                </div>
                <span className={`text-xl font-bold transition-colors ${
                  metal === 'SILVER' 
                    ? 'text-gray-900 dark:text-gray-100' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('calculator.old.metal.silver')}
                </span>
              </div>
              
              {rates && ['admin', 'manager'].includes(user?.role) && (
  <div className="mt-4 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-gray-200 dark:border-slate-700">
    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
      {t('calculator.old.metal.buy')}
    </div>
    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
      ₹{rates.silverBuy}
      <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">/kg</span>
    </div>
  </div>
)}
              
              {metal === 'SILVER' && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
  
      {/* Step 2: Source Selection */}
      {metal && (
        <div className="space-y-2 sm:space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              2
            </div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white">
              {t('calculator.old.steps.step2')} {t('calculator.old.steps.selectSource')}
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Own Metal */}
            <button
              type="button"
              onClick={() => setSource('own')}
              className={`group relative p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                source === 'own'
                  ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-xl scale-105'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:scale-102'
              }`}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 transition-colors ${
                  source === 'own' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('calculator.old.source.own')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('calculator.old.source.ownDescription')}
                </div>
                {source === 'own' && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg animate-scale-in">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('calculator.old.source.selected')}
                  </div>
                )}
              </div>
            </button>
  
            {/* Other Source */}
            <button
              type="button"
              onClick={() => setSource('other')}
              className={`group relative p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                source === 'other'
                  ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 shadow-xl scale-105'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:scale-102'
              }`}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 transition-colors ${
                  source === 'other' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {t('calculator.old.source.other')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('calculator.old.source.otherDescription')}
                </div>
                {source === 'other' && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white text-sm font-semibold rounded-full shadow-lg animate-scale-in">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('calculator.old.source.selected')}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
  
      {/* Step 3: Category Code Selection */}
      {metal && source && (
        <div className="space-y-2 sm:space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              3
            </div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white">
              {t('calculator.old.steps.step3')} {t('calculator.old.steps.selectCode')}
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">{t('calculator.old.category.loading')}</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-2 border-yellow-300 dark:border-yellow-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-2 sm:p-3 bg-yellow-500 dark:bg-yellow-600 rounded-xl">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 text-lg mb-1">
                    {t('calculator.old.category.noAvailable')}
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {t('calculator.old.category.noAvailableDescription', { metal: metal })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {filteredCategories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left p-5 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-all duration-300 ${
                      selectedCategory?._id === category._id
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-l-amber-500 dark:border-l-amber-400'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className={`font-semibold text-lg mb-1 transition-colors ${
                          selectedCategory?._id === category._id 
                            ? 'text-amber-900 dark:text-amber-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {category.displayText}
                        </div>
                        {canSeeResale && category.resaleEnabled && category.resaleCategories && category.resaleCategories.length > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-300 dark:border-green-800">
                            <Sparkles size={14} />
                            {category.resaleCategories.length} {category.resaleCategories.length === 1 ? t('calculator.old.category.resaleCategory') : t('calculator.old.category.resaleCategories')}
                          </div>
                        )}
                      </div>
                      {selectedCategory?._id === category._id && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
  
      {/* Category Descriptions */}
      {selectedCategory && selectedCategory.descriptions && selectedCategory.descriptions.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          {selectedCategory.descriptions.map((desc, index) => (
            <div 
            key={index}
            className={`rounded-2xl p-3 sm:p-5 border-2 shadow-lg transition-all duration-300 hover:scale-102 ${
              desc.type === 'universal' 
                ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-300 dark:border-purple-800' 
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300 dark:border-blue-800'
            }`}
          >
            <h3 className={`font-bold mb-2 text-sm uppercase tracking-wider flex items-center gap-2 ${
              desc.type === 'universal' ? 'text-purple-900 dark:text-purple-100' : 'text-blue-900 dark:text-blue-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                desc.type === 'universal' ? 'bg-purple-600' : 'bg-blue-600'
              }`} />
              {desc.type === 'universal' ? t('calculator.old.descriptions.universal') : t('calculator.old.descriptions.roleSpecific')}
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
  
      {/* Step 4: Resale Category Selection */}
      {selectedCategory && selectedCategory.resaleEnabled && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 && canSeeResale && (
        <div className="space-y-2 sm:space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              4
            </div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white">
              {t('calculator.old.steps.step4')} {t('calculator.old.steps.selectCategoryType')}
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedCategory.resaleCategories.map((resaleCat) => (
              <button
                key={resaleCat._id}
                type="button"
                onClick={() => setSelectedResaleCategory(resaleCat)}
                className={`group relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-center ${
                  selectedResaleCategory?._id === resaleCat._id
                    ? 'border-green-500 dark:border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-xl scale-105'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg hover:scale-102'
                }`}
              >
                <div className={`font-bold text-lg mb-2 transition-colors ${
                  selectedResaleCategory?._id === resaleCat._id 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {resaleCat.itemCategory}
                </div>
                
                {resaleCat.polishRepairEnabled && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full border border-green-300 dark:border-green-800 mb-2">
                    {t('calculator.old.category.polishRepair')}
                  </div>
                )}
                
                {selectedResaleCategory?._id === resaleCat._id && (
                  <div className="mt-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg animate-scale-in">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('calculator.old.category.selected')}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
  
      {/* Weight Input & Calculate */}
      {selectedCategory && (!selectedCategory.resaleEnabled || !canSeeResale || !selectedCategory.resaleCategories || selectedCategory.resaleCategories.length === 0 || selectedResaleCategory) && (
        <div className="space-y-3 sm:space-y-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {selectedCategory.resaleEnabled && canSeeResale && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 ? '5' : '4'}
            </div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white">
              {selectedCategory.resaleEnabled && canSeeResale && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 ? t('calculator.old.steps.step5') : t('calculator.old.steps.step4')} {t('calculator.old.steps.enterWeight')}
            </label>
          </div>
          
          <div className="relative">
  <Input
    label=""
    type="number"
    value={weight}
    onChange={(e) => setWeight(e.target.value)}
    placeholder={metal === 'GOLD' ? 'Enter weight in Mg' : 'Enter weight in grams'}
    min="0"
    step={metal === 'GOLD' ? '1' : '0.01'}
    required
    className="text-lg py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg transition-all duration-300"
    helperText={metal === 'GOLD' ? 'Weight in Milligrams (Mg)' : 'Weight in Grams (g)'}
  />
</div>
  
          <div className="flex gap-4">
            <Button
              onClick={handleCalculate}
              disabled={loading || !weight}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <LoadingSpinner size="sm" />
                  <span>{t('calculator.old.buttons.calculating')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Calculator size={20} />
                  <span>{t('calculator.old.buttons.calculate')}</span>
                </div>
              )}
            </Button>
            
            {(weight || result) && (
              <Button
                variant="outline"
                onClick={resetCalculation}
                disabled={loading}
                className="px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {t('calculator.old.buttons.clear')}
              </Button>
            )}
          </div>
        </div>
      )}
  
      {/* Results Section */}
      {result && (
        <div className="space-y-4 sm:space-y-6 border-t-2 border-gray-200 dark:border-slate-700 pt-4 sm:pt-8 animate-fade-in">          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Package className="text-white" size={24} />
              </div>
              {t('calculator.old.results.title')}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg">
                <span className="text-gray-600 dark:text-gray-400">{t('calculator.old.results.source')}</span>
                <span className="ml-2 font-bold text-gray-900 dark:text-white capitalize">{result.input.source}</span>
              </div>
              {result.input.selectedResaleCategory && (
                <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-300 dark:border-green-800 shadow-lg">
                  <span className="text-green-700 dark:text-green-400">{t('calculator.old.results.category')}</span>
                  <span className="ml-2 font-bold text-green-900 dark:text-green-100">{result.input.selectedResaleCategory.itemCategory}</span>
                </div>
              )}
            </div>
          </div>
  
          {/* Scrap Value Card */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-red-950/40 border-2 border-amber-300 dark:border-amber-800 shadow-xl p-3 sm:p-8 animate-scale-in">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-3xl -translate-y-32 translate-x-32 hidden sm:block" />
  <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 dark:bg-orange-400/5 rounded-full blur-3xl translate-y-32 -translate-x-32 hidden sm:block" />
  
  <div className="relative z-10">

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                  <Package className="text-white" size={28} />
                </div>
                <h4 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {t('calculator.old.scrapValue.title')}
                </h4>
              </div>
              
              {/* <div className="text-center mb-3 sm:mb-6 p-3 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-amber-200 dark:border-amber-800">  <div className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 sm:mb-3 uppercase tracking-wide">
    {t('calculator.old.scrapValue.totalValue')}
  </div>
  <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 mb-2 sm:mb-3 break-words">    ₹{formatCurrency(result.totalScrapValue)}
  </div>
                <div className="text-base text-amber-700 dark:text-amber-300 font-medium">
                  {t('calculator.old.scrapValue.for')} <span className="font-bold">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span> {t('calculator.old.scrapValue.of')} <span className="font-bold">{result.input.code}</span>
                </div>
                {result.roundingInfo?.roundingApplied && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                    {t('calculator.old.scrapValue.roundedFrom')} ₹{formatNumber(result.roundingInfo.beforeRounding)})
                  </div>
                )}
              </div> */}

<div className="text-center mb-3 sm:mb-6 p-3 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-amber-200 dark:border-amber-800">
  <div className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 sm:mb-3 uppercase tracking-wide">
    {t('calculator.old.scrapValue.totalValue')}
  </div>
  <ResponsiveCurrency 
    amount={result.totalScrapValue}
    className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 mb-2 sm:mb-3"
  />
  <div className="text-base text-amber-700 dark:text-amber-300 font-medium">
    {t('calculator.old.scrapValue.for')} <span className="font-bold">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span> {t('calculator.old.scrapValue.of')} <span className="font-bold">{result.input.code}</span>
  </div>
  {result.roundingInfo?.roundingApplied && (
    <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
      {t('calculator.old.scrapValue.roundedFrom')} ₹{formatNumber(result.roundingInfo.beforeRounding)})
    </div>
  )}
</div>
  
              {/* Scrap Margin Breakdown */}
              {permissions?.canViewMargins && (
                <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border-2 border-amber-200 dark:border-amber-800 overflow-hidden shadow-lg">
                  <button
                    onClick={() => toggleSection('scrapMargin')}
                    className={`w-full px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-between transition-all duration-300 ${
                      canSeeMarginBreakdown ? 'hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer' : 'cursor-default'
                    }`}
                    disabled={!canSeeMarginBreakdown}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <div className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                          {t('calculator.old.scrapValue.marginTitle')}
                        </div>
                        <div className="text-3xl font-black text-amber-900 dark:text-amber-100">
                          ₹{formatCurrency(result.marginBreakdown.scrapMargin)}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          ({calculatePercentage(result.marginBreakdown.scrapMargin, result.totalScrapValue)}% {t('calculator.old.scrapValue.marginPercentage')})
                        </div>
                      </div>
                    </div>
                    {canSeeMarginBreakdown && (
                      <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                        {expandedSections.scrapMargin ? (
                          <ChevronUp className="text-amber-600 dark:text-amber-400" size={24} />
                        ) : (
                          <ChevronDown className="text-amber-600 dark:text-amber-400" size={24} />
                        )}
                      </div>
                    )}
                  </button>
                  
                  {expandedSections.scrapMargin && canSeeMarginBreakdown && (
                    <div className="px-3 sm:px-6 py-3 sm:py-5 bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-200 dark:border-amber-800 animate-slide-up">                    
                    <h5 className="font-bold text-amber-900 dark:text-amber-100 mb-2 sm:mb-4 text-base sm:text-lg">

                        {t('calculator.old.scrapValue.marginBreakdown')}
                      </h5>
                      <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-4 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              {t('calculator.old.scrapValue.actualValueByPurity')} ({result.percentages.truePurity}%)
                            </span>
                            <span className="text-sm sm:text-lg font-bold text-amber-900 dark:text-amber-100 break-words">
                              ₹{formatCurrency(result.marginBreakdown.actualValueByPurity)}
                            </span>
                          </div>
                        </div>
  
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-4 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              {t('calculator.old.scrapValue.totalScrapValue')} ({result.percentages.scrapBuy}%)
                            </span>
                            <span className="text-sm sm:text-lg font-bold text-amber-900 dark:text-amber-100 break-words">

                              ₹{formatCurrency(result.marginBreakdown.totalScrapValue)}
                            </span>
                          </div>
                        </div>
  
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl p-3 sm:p-5 border-2 border-amber-300 dark:border-amber-700 shadow-lg">
                                                    <div className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <Calculator size={14} />
                            {t('calculator.old.scrapValue.calculationFormula')}
                          </div>
                          <div className="font-mono text-base font-semibold text-amber-900 dark:text-amber-100">
                            ₹{formatNumber(result.marginBreakdown.actualValueByPurity)} - ₹{formatCurrency(result.marginBreakdown.totalScrapValue)} = ₹{formatCurrency(result.marginBreakdown.scrapMargin)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
  
          {/* Resale Section */}
          {canSeeResale && result.resaleEnabled && result.resaleCalculations && (
            <div className="space-y-3 sm:space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Sparkles className="text-white" size={28} />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('calculator.old.resale.title')}
                </h4>
              </div>
  
              {/* Direct Resale Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border-2 border-green-300 dark:border-green-800 shadow-xl p-3 sm:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/10 dark:bg-green-400/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-400/5 rounded-full blur-3xl translate-y-32 -translate-x-32" />
                
                <div className="relative z-10">
                  <h5 className="text-xl font-bold text-green-900 dark:text-green-100 mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    {t('calculator.old.resale.directResale')}
                  </h5>
                  
                  {/* <div className="text-center mb-6 p-3 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-green-200 dark:border-green-800">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wide">
                      {t('calculator.old.resale.directResaleValue')}
                    </div>
                    <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 mb-3">
                      ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)}
                    </div>
                    <div className="text-base text-green-700 dark:text-green-300 font-medium">
                      {t('calculator.old.scrapValue.for')} <span className="font-bold">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span>
                    </div>
                    {result.resaleCalculations.directResale.breakdown.roundingApplied && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-2 italic">
                        {t('calculator.old.scrapValue.roundedFrom')} ₹{formatNumber(result.resaleCalculations.directResale.breakdown.beforeRounding)})
                      </div>
                    )}
                  </div> */}

<div className="text-center mb-6 p-3 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-green-200 dark:border-green-800">
  <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wide">
    {t('calculator.old.resale.directResaleValue')}
  </div>
  <ResponsiveCurrency 
    amount={result.resaleCalculations.directResale.totalAmount}
    className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 mb-3"
  />
  <div className="text-base text-green-700 dark:text-green-300 font-medium">
    {t('calculator.old.scrapValue.for')} <span className="font-bold">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span>
  </div>
  {result.resaleCalculations.directResale.breakdown.roundingApplied && (
    <div className="text-xs text-green-600 dark:text-green-400 mt-2 italic">
      {t('calculator.old.scrapValue.roundedFrom')} ₹{formatNumber(result.resaleCalculations.directResale.breakdown.beforeRounding)})
    </div>
  )}
</div>
  
                  {/* Direct Resale Margin */}
                  {permissions?.canViewMargins && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-green-200 dark:border-green-800 overflow-hidden shadow-lg">
                      <button
                        onClick={() => toggleSection('directResaleMargin')}
                        className={`w-full px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-between transition-all duration-300 ${
                          canSeeMarginBreakdown ? 'hover:bg-green-50 dark:hover:bg-green-950/30 cursor-pointer' : 'cursor-default'
                        }`}
                        disabled={!canSeeMarginBreakdown}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <div className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                              {t('calculator.old.resale.directResaleMargin')}
                            </div>
                            <div className="text-3xl font-black text-green-900 dark:text-green-100">
                              ₹{formatCurrency(result.resaleCalculations.directResale.margin)}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                              ({formatNumber(result.resaleCalculations.directResale.marginPercentage)}% {t('calculator.old.resale.directResaleMarginPercentage')})
                            </div>
                          </div>
                        </div>
                        {canSeeMarginBreakdown && (
                          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                            {expandedSections.directResaleMargin ? (
                              <ChevronUp className="text-green-600 dark:text-green-400" size={24} />
                            ) : (
                              <ChevronDown className="text-green-600 dark:text-green-400" size={24} />
                            )}
                          </div>
                        )}
                      </button>
                      
                      {expandedSections.directResaleMargin && canSeeMarginBreakdown && (
                        <div className="px-6 py-5 bg-green-50 dark:bg-green-950/20 border-t-2 border-green-200 dark:border-green-800 animate-slide-up">
                          <h6 className="font-bold text-green-900 dark:text-green-100 mb-4 text-lg">
                            {t('calculator.old.marginBreakdown.title')}
                          </h6>
                          <div className="space-y-3">
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-4 border-2 border-green-200 dark:border-green-800 shadow-lg">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                                  {t('calculator.old.marginBreakdown.wholesalerCost')}
                                </span>
                                <span className="text-lg font-bold text-green-900 dark:text-green-100">
                                  ₹{formatCurrency(result.resaleCalculations.directResale.breakdown.wholesalerCost)}
                                </span>
                              </div>
                              <div className="ml-4 space-y-2 text-xs border-l-2 border-green-300 dark:border-green-700 pl-4">
                                <div className="flex justify-between text-green-700 dark:text-green-400">
                                  <span className="font-medium">{t('calculator.old.marginBreakdown.baseCost')} ({result.resaleCalculations.percentages.buyingFromWholesaler}%)</span>
                                  <span className="font-semibold">₹{formatCurrency(result.resaleCalculations.directResale.breakdown.wholesalerCostBreakdown.baseCost)}</span>
                                </div>
                                <div className="flex justify-between text-green-700 dark:text-green-400">
                                  <span className="font-medium">{t('calculator.old.marginBreakdown.labourCharges', { rate: formatNumber(result.resaleCalculations.directResale.labourInfo.labourPerGram), weight: result.input.weight })}</span>
                                  <span className="font-semibold">₹{formatCurrency(result.resaleCalculations.directResale.breakdown.wholesalerCostBreakdown.labourCharges)}</span>
                                </div>
                              </div>
                            </div>
  
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-4 border-2 border-green-200 dark:border-green-800 shadow-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                                  {t('calculator.old.marginBreakdown.directResaleValue')} ({result.resaleCalculations.percentages.directResale}%)
                                </span>
                                <span className="text-lg font-bold text-green-900 dark:text-green-100">
                                  ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)}
                                </span>
                              </div>
                            </div>
  
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-3 sm:p-5 border-2 border-green-300 dark:border-green-700 shadow-lg">
                                                            <div className="pt-2 border-t border-green-300 dark:border-green-700 flex justify-between items-center">
                                <span className="text-base font-black text-green-900 dark:text-green-100">
                                  {t('calculator.old.marginBreakdown.directResaleMargin')}
                                </span>
                                <div className="text-right">
                                  <div className="text-2xl font-black text-green-900 dark:text-green-100">
                                    ₹{formatCurrency(result.resaleCalculations.directResale.margin)}
                                  </div>
                                  <div className="text-xs font-semibold text-green-700 dark:text-green-400">
                                    ({formatNumber(result.resaleCalculations.directResale.marginPercentage)}%)
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
  
              {/* Polish & Repair Resale Card */}
              {result.resaleCalculations.polishRepairResale && (
                result.resaleCalculations.polishRepairResale.available ? (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border-2 border-blue-300 dark:border-blue-800 shadow-xl p-3 sm:p-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl translate-y-32 -translate-x-32" />
                    
                    <div className="relative z-10">
                      <h5 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        {t('calculator.old.resale.polishRepair')}
                      </h5>
                      
                      {/* <div className="text-center mb-6 p-3 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
                          {t('calculator.old.resale.finalPolishRepairValue')}
                        </div>
                        <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-3">
                          ₹{formatCurrency(result.resaleCalculations.polishRepairResale.finalValue)}
                        </div>
                        <div className="text-base text-blue-700 dark:text-blue-300 font-medium">
                          {canSeeMarginBreakdown ? (
                            <>
                              {t('calculator.old.scrapValue.for')} <span className="font-bold">{formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g</span>
                              <span className="text-xs block mt-1">
                                {t('calculator.old.resale.afterWeightLoss', { percentage: result.resaleCalculations.polishRepairResale.weightInfo.polishRepairCostPercentage })}
                              </span>
                            </>
                          ) : (
                            <>{t('calculator.old.scrapValue.for')} <span className="font-bold">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span> {t('calculator.old.resale.afterPolishRepair')}</>
                          )}
                        </div>
                        {canSeeMarginBreakdown && result.resaleCalculations.polishRepairResale.breakdown.roundingApplied && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                            {t('calculator.old.resale.polishRepairNote', { 
                              resaleValue: formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount),
                              labourCost: formatCurrency(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.totalLabourCharges)
                            })}
                          </div>
                        )}
                      </div> */}

<div className="text-center mb-6 p-3 sm:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-blue-200 dark:border-blue-800">
  <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
    {t('calculator.old.resale.finalPolishRepairValue')}
  </div>
  <ResponsiveCurrency 
    amount={result.resaleCalculations.polishRepairResale.finalValue}
    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-3"
  />
  <div className="text-base text-blue-700 dark:text-blue-300 font-medium">
    {canSeeMarginBreakdown ? (
      <>
        {t('calculator.old.scrapValue.for')} <span className="font-bold">{formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g</span>
        <span className="text-xs block mt-1">
          {t('calculator.old.resale.afterWeightLoss', { percentage: result.resaleCalculations.polishRepairResale.weightInfo.polishRepairCostPercentage })}
        </span>
      </>
    ) : (
      <>{t('calculator.old.scrapValue.for')} <span className="font-bold">{metal === 'GOLD' ? `${weight} Mg` : `${result.input.weight}g`}</span> {t('calculator.old.resale.afterPolishRepair')}</>
    )}
  </div>
  {canSeeMarginBreakdown && result.resaleCalculations.polishRepairResale.breakdown.roundingApplied && (
    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
      {t('calculator.old.resale.polishRepairNote', { 
        resaleValue: formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount),
        labourCost: formatCurrency(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.totalLabourCharges)
      })}
    </div>
  )}
</div>
  
                      {/* Weight Adjustment */}
                      {canSeeMarginBreakdown && (
                        <div className="bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 shadow-lg">
                          <div className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-3 uppercase tracking-wider">
                            {t('calculator.old.weightAdjustment.title')}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                                {t('calculator.old.weightAdjustment.original')}
                              </div>
                              <div className="text-xl font-black text-blue-900 dark:text-blue-100">
                                {result.resaleCalculations.polishRepairResale.weightInfo.originalWeight}g
                              </div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                              <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
                                {t('calculator.old.weightAdjustment.loss')}
                              </div>
                              <div className="text-xl font-black text-red-900 dark:text-red-100">
                                {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.weightLoss)}g
                              </div>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                              <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">
                                {t('calculator.old.weightAdjustment.effective')}
                              </div>
                              <div className="text-xl font-black text-green-900 dark:text-green-100">
                                {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
  
                      {/* Polish & Repair Margin */}
                      {permissions?.canViewMargins && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden shadow-lg">
                          <button
                            onClick={() => toggleSection('polishRepairMargin')}
                            className={`w-full px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-between transition-all duration-300 ${
                              canSeeMarginBreakdown ? 'hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer' : 'cursor-default'
                            }`}
                            disabled={!canSeeMarginBreakdown}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                                  {t('calculator.old.resale.polishRepairMargin')}
                                </div>
                                <div className="text-3xl font-black text-blue-900 dark:text-blue-100">
                                  ₹{formatCurrency(result.resaleCalculations.polishRepairResale.margin)}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                  ({formatNumber(result.resaleCalculations.polishRepairResale.marginPercentage)}% {t('calculator.old.resale.polishRepairMarginPercentage')})
                                </div>
                              </div>
                            </div>
                            {canSeeMarginBreakdown && (
                              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                {expandedSections.polishRepairMargin ? (
                                  <ChevronUp className="text-blue-600 dark:text-blue-400" size={24} />
                                ) : (
                                  <ChevronDown className="text-blue-600 dark:text-blue-400" size={24} />
                                )}
                              </div>
                            )}
                          </button>
                          
                          {expandedSections.polishRepairMargin && canSeeMarginBreakdown && (
                            <div className="px-6 py-5 bg-blue-50 dark:bg-blue-950/20 border-t-2 border-blue-200 dark:border-blue-800 animate-slide-up">
                              <h6 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg">
                                {t('calculator.old.marginBreakdown.title')}
                              </h6>
                              <div className="space-y-3">
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                      {t('calculator.old.marginBreakdown.wholesalerCost')}
                                    </span>
                                    <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                      ₹{formatCurrency(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCost)}
                                    </span>
                                  </div>
                                  <div className="ml-4 space-y-2 text-xs border-l-2 border-blue-300 dark:border-blue-700 pl-4">
                                    <div className="flex justify-between text-blue-700 dark:text-blue-400">
                                      <span className="font-medium">{t('calculator.old.marginBreakdown.baseCost')} ({result.resaleCalculations.percentages.buyingFromWholesaler}%)</span>
                                      <span className="font-semibold">₹{formatCurrency(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCostBreakdown.baseCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-700 dark:text-blue-400">
                                      <span className="font-medium">{t('calculator.old.marginBreakdown.wholesalerLabour', { rate: formatNumber(result.resaleCalculations.polishRepairResale.labourInfo.wholesalerLabour.labourPerGram), weight: formatNumber(result.resaleCalculations.polishRepairResale.labourInfo.wholesalerLabour.calculatedOnWeight) })}</span>
                                      <span className="font-semibold">₹{formatCurrency(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCostBreakdown.labourCharges)}</span>
                                    </div>
                                  </div>
                                </div>
  
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-2 sm:p-4 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                                  <div className="text-sm font-semibold flex justify-between text-blue-700 dark:text-blue-400 mb-3">
                                    <span>{t('calculator.old.marginBreakdown.polishRepairResaleValue')} ({result.resaleCalculations.percentages.polishRepairResale}%)</span>
                                    <span className="text-blue-900 dark:text-blue-100">₹{formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount)}</span>
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-3 font-mono bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                    {result.resaleCalculations.polishRepairResale.weightInfo.originalWeight}g - {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.weightLoss)}g = {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g
                                  </div>
                                  <div className="pt-3 border-t-2 border-blue-200 dark:border-blue-700">
                                    <div className="text-sm font-semibold flex justify-between text-blue-700 dark:text-blue-400">
                                      <span>{t('calculator.old.marginBreakdown.polishRepairLabour', { rate: formatNumber(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.labourPerGram), weight: result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.calculatedOnWeight })}</span>
                                      <span className="text-red-700 dark:text-red-400">- ₹{formatCurrency(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.totalLabourCharges)}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t-2 border-blue-300 dark:border-blue-700">
                                    <div className="text-base font-bold flex justify-between text-blue-900 dark:text-blue-100">
                                      <span>{t('calculator.old.marginBreakdown.finalValue')}</span>
                                      <span>₹{formatCurrency(result.resaleCalculations.polishRepairResale.finalValue)}</span>
                                    </div>
                                  </div>
                                </div>
  
                                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-3 sm:p-5 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                                                                    <div className="pt-2 border-t border-blue-300 dark:border-blue-700 flex justify-between items-center">
                                    <span className="text-base font-black text-blue-900 dark:text-blue-100">
                                      {t('calculator.old.marginBreakdown.netMargin')}
                                    </span>
                                    <div className="text-right">
                                      <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                                        ₹{formatCurrency(result.resaleCalculations.polishRepairResale.margin)}
                                      </div>
                                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                                        ({formatNumber(result.resaleCalculations.polishRepairResale.marginPercentage)}%)
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-950/40 border-2 border-gray-300 dark:border-slate-700 shadow-xl p-3 sm:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 sm:p-3 bg-gray-400 dark:bg-slate-700 rounded-2xl">
                        <XCircle className="text-white" size={28} />
                      </div>
                      <h5 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                        {t('calculator.old.resale.polishRepair')}
                      </h5>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-700 rounded-2xl p-6 text-center shadow-lg">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                          <XCircle className="text-gray-400 dark:text-gray-600" size={48} />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {t('calculator.old.resale.notAvailable')}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        {result.resaleCalculations.polishRepairResale.message || t('calculator.old.resale.notAvailableMessage')}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
  
          {/* Timestamp Footer */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('calculator.old.results.calculatedAt')} {new Date(result.metadata.calculatedAt).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OldJewelryCalculator;