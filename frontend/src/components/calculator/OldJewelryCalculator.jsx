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

    try {
      setLoading(true);
      
      const requestBody = {
        categoryId: selectedCategory._id,
        weight: weightNum,
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

  const canSeeResale = permissions && ['admin', 'manager', 'pro_client'].includes(user.role);
  const canSeeMarginBreakdown = permissions && ['admin', 'manager'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('calculator.old.title')}</h2>
        </div>
        {(metal || selectedCategory) && (
          <Button variant="outline" size="sm" onClick={resetAll}>
            {t('calculator.old.buttons.resetAll')}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t('calculator.old.steps.step1')} {t('calculator.old.steps.selectMetal')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMetal('GOLD')}
            className={`p-4 rounded-lg border-2 transition-all ${
              metal === 'GOLD'
                ? 'border-yellow-400 bg-yellow-50 text-yellow-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Coins className={metal === 'GOLD' ? 'text-yellow-600' : 'text-gray-400'} />
              <span className="font-medium">{t('calculator.old.metal.gold')}</span>
            </div>
            {rates && (
              <div className="text-sm mt-2">
                <div className="text-gray-600">{t('calculator.old.metal.buy')} ₹{rates.goldBuy}/10g</div>
              </div>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setMetal('SILVER')}
            className={`p-4 rounded-lg border-2 transition-all ${
              metal === 'SILVER'
                ? 'border-gray-400 bg-gray-50 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Coins className={metal === 'SILVER' ? 'text-gray-600' : 'text-gray-400'} />
              <span className="font-medium">{t('calculator.old.metal.silver')}</span>
            </div>
            {rates && (
              <div className="text-sm mt-2">
                <div className="text-gray-600">{t('calculator.old.metal.buy')} ₹{rates.silverBuy}/kg</div>
              </div>
            )}
          </button>
        </div>
      </div>

      {metal && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('calculator.old.steps.step2')} {t('calculator.old.steps.selectSource')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSource('own')}
              className={`p-4 rounded-lg border-2 transition-all ${
                source === 'own'
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
              }`}
            >
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  source === 'own' ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {t('calculator.old.source.own')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t('calculator.old.source.ownDescription')}
                </div>
                {source === 'own' && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    {t('calculator.old.source.selected')}
                  </div>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSource('other')}
              className={`p-4 rounded-lg border-2 transition-all ${
                source === 'other'
                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200'
              }`}
            >
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  source === 'other' ? 'text-purple-700' : 'text-gray-700'
                }`}>
                  {t('calculator.old.source.other')}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t('calculator.old.source.otherDescription')}
                </div>
                {source === 'other' && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">
                    {t('calculator.old.source.selected')}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {metal && source && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('calculator.old.steps.step3')} {t('calculator.old.steps.selectCode')} <span className="text-red-500">*</span>
          </label>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600">{t('calculator.old.category.loading')}</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">{t('calculator.old.category.noAvailable')}</p>
                  <p className="text-yellow-700 mt-1">
                    {t('calculator.old.category.noAvailableDescription', { metal: metal })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredCategories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left p-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedCategory?._id === category._id
                      ? 'bg-orange-50 border-l-4 border-l-orange-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {category.displayText} 
                      </div>
                      {canSeeResale && category.resaleEnabled && category.resaleCategories && category.resaleCategories.length > 0 && (
                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Sparkles size={12} />
                          {category.resaleCategories.length} {category.resaleCategories.length === 1 ? t('calculator.old.category.resaleCategory') : t('calculator.old.category.resaleCategories')}
                        </div>
                      )}
                    </div>
                    {selectedCategory?._id === category._id && (
                      <div className="ml-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

      {selectedCategory && selectedCategory.descriptions && selectedCategory.descriptions.length > 0 && (
        <div className="space-y-3">
          {selectedCategory.descriptions.map((desc, index) => (
            <div 
              key={index}
              className={`rounded-lg p-4 border-2 ${
                desc.type === 'universal' 
                  ? 'bg-purple-50 border-purple-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <h3 className={`font-medium mb-2 text-sm uppercase tracking-wide ${
                desc.type === 'universal' ? 'text-purple-900' : 'text-blue-900'
              }`}>
                {desc.type === 'universal' ? t('calculator.old.descriptions.universal') : t('calculator.old.descriptions.roleSpecific')}
              </h3>
              <p className={desc.type === 'universal' ? 'text-purple-800' : 'text-blue-800'}>
                {desc.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedCategory && selectedCategory.resaleEnabled && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 && canSeeResale && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('calculator.old.steps.step4')} {t('calculator.old.steps.selectCategoryType')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedCategory.resaleCategories.map((resaleCat) => (
              <button
                key={resaleCat._id}
                type="button"
                onClick={() => setSelectedResaleCategory(resaleCat)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selectedResaleCategory?._id === resaleCat._id
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-200'
                }`}
              >
                <div className="font-medium">{resaleCat.itemCategory}</div>
                {resaleCat.polishRepairEnabled && (
                  <div className="text-xs text-green-600 mt-1">{t('calculator.old.category.polishRepair')}</div>
                )}
                {selectedResaleCategory?._id === resaleCat._id && (
                  <div className="text-xs text-green-600 mt-1">{t('calculator.old.category.selected')}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCategory && (!selectedCategory.resaleEnabled || !canSeeResale || !selectedCategory.resaleCategories || selectedCategory.resaleCategories.length === 0 || selectedResaleCategory) && (
        <div className="space-y-4">
          <Input
            label={`${selectedCategory.resaleEnabled && canSeeResale && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 ? t('calculator.old.steps.step5') : t('calculator.old.steps.step4')} ${t('calculator.old.steps.enterWeight')}`}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={t('calculator.old.weight.placeholder')}
            min="0"
            step="0.01"
            required
          />

          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              disabled={loading || !weight}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{t('calculator.old.buttons.calculating')}</span>
                </>
              ) : (
                <>
                  <Calculator size={18} />
                  <span className="ml-2">{t('calculator.old.buttons.calculate')}</span>
                </>
              )}
            </Button>
            
            {(weight || result) && (
              <Button
                variant="outline"
                onClick={resetCalculation}
                disabled={loading}
              >
                {t('calculator.old.buttons.clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4 border-t-2 border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('calculator.old.results.title')}
            </h3>
            <div className="text-sm text-gray-600">
              {t('calculator.old.results.source')} <span className="font-medium capitalize">{result.input.source}</span>
              {result.input.selectedResaleCategory && (
                <span className="ml-2">
                  | {t('calculator.old.results.category')} <span className="font-medium">{result.input.selectedResaleCategory.itemCategory}</span>
                </span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="text-orange-700" size={24} />
              <h4 className="text-lg font-semibold text-orange-900">{t('calculator.old.scrapValue.title')}</h4>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-sm font-medium text-orange-700 mb-2">{t('calculator.old.scrapValue.totalValue')}</div>
              <div className="text-5xl font-bold text-orange-900">
                ₹{formatCurrency(result.totalScrapValue)}
              </div>
              <div className="text-sm text-orange-600 mt-2">
                {t('calculator.old.scrapValue.for')} {result.input.weight}g {t('calculator.old.scrapValue.of')} {result.input.code}
              </div>
              {result.roundingInfo?.roundingApplied && (
                <div className="text-xs text-orange-600 mt-2">
                  {t('calculator.old.scrapValue.roundedFrom')} ₹{formatNumber(result.roundingInfo.beforeRounding)})
                </div>
              )}
            </div>

            {permissions?.canViewMargins && (
              <div className="bg-white border-2 border-orange-200 rounded-lg overflow-hidden mt-4">
                <button
                  onClick={() => toggleSection('scrapMargin')}
                  className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                    canSeeMarginBreakdown ? 'hover:bg-orange-50' : 'cursor-default'
                  }`}
                  disabled={!canSeeMarginBreakdown}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-sm font-medium text-orange-700">{t('calculator.old.scrapValue.marginTitle')}</div>
                      <div className="text-2xl font-bold text-orange-900">
                        ₹{formatCurrency(result.marginBreakdown.scrapMargin)}
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        ({calculatePercentage(result.marginBreakdown.scrapMargin, result.totalScrapValue)}% {t('calculator.old.scrapValue.marginPercentage')})
                      </div>
                    </div>
                  </div>
                  {canSeeMarginBreakdown && (
                    expandedSections.scrapMargin ? (
                      <ChevronUp className="text-orange-600" size={24} />
                    ) : (
                      <ChevronDown className="text-orange-600" size={24} />
                    )
                  )}
                </button>
                
                {expandedSections.scrapMargin && canSeeMarginBreakdown && (
                  <div className="px-5 py-4 bg-orange-50 border-t border-orange-200">
                    <h5 className="font-semibold text-orange-900 mb-3">{t('calculator.old.scrapValue.marginBreakdown')}</h5>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-orange-800">{t('calculator.old.scrapValue.actualValueByPurity')} ({result.percentages.truePurity}%)</span>
                          <span className="text-sm font-semibold text-orange-900">
                            ₹{formatCurrency(result.marginBreakdown.actualValueByPurity)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-orange-800">{t('calculator.old.scrapValue.totalScrapValue')} ({result.percentages.scrapBuy}%)</span>
                          <span className="text-sm font-semibold text-orange-900">
                            ₹{formatCurrency(result.marginBreakdown.totalScrapValue)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300">
                        <div className="text-xs font-semibold text-orange-900 mb-2 uppercase tracking-wide">
                          {t('calculator.old.scrapValue.calculationFormula')}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="font-mono text-orange-900">
                            ₹{formatNumber(result.marginBreakdown.actualValueByPurity)} - ₹{formatCurrency(result.marginBreakdown.totalScrapValue)} = ₹{formatCurrency(result.marginBreakdown.scrapMargin)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {canSeeResale && result.resaleEnabled && result.resaleCalculations && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-green-600" size={24} />
                <h4 className="text-lg font-semibold text-gray-900">{t('calculator.old.resale.title')}</h4>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <h5 className="text-md font-semibold text-green-900 mb-3">{t('calculator.old.resale.directResale')}</h5>
                
                <div className="text-center mb-4">
                  <div className="text-sm font-medium text-green-700 mb-2">{t('calculator.old.resale.directResaleValue')}</div>
                  <div className="text-4xl font-bold text-green-900">
                    ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)}
                  </div>
                  <div className="text-sm text-green-600 mt-2">
                    {t('calculator.old.scrapValue.for')} {result.input.weight}g
                  </div>
                  {result.resaleCalculations.directResale.breakdown.roundingApplied && (
                    <div className="text-xs text-green-600 mt-1">
                      {t('calculator.old.scrapValue.roundedFrom')} ₹{formatNumber(result.resaleCalculations.directResale.breakdown.beforeRounding)})
                    </div>
                  )}
                </div>

                {permissions?.canViewMargins && (
                  <div className="bg-white border-2 border-green-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('directResaleMargin')}
                      className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                        canSeeMarginBreakdown ? 'hover:bg-green-50' : 'cursor-default'
                      }`}
                      disabled={!canSeeMarginBreakdown}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="text-sm font-medium text-green-700">{t('calculator.old.resale.directResaleMargin')}</div>
                          <div className="text-2xl font-bold text-green-900">
                            ₹{formatCurrency(result.resaleCalculations.directResale.margin)}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            ({formatNumber(result.resaleCalculations.directResale.marginPercentage)}% {t('calculator.old.resale.directResaleMarginPercentage')})
                          </div>
                        </div>
                      </div>
                      {canSeeMarginBreakdown && (
                        expandedSections.directResaleMargin ? (
                          <ChevronUp className="text-green-600" size={24} />
                        ) : (
                          <ChevronDown className="text-green-600" size={24} />
                        )
                      )}
                    </button>
                    
                    {expandedSections.directResaleMargin && canSeeMarginBreakdown && (
                      <div className="px-5 py-4 bg-green-50 border-t border-green-200">
                        <h6 className="font-semibold text-green-900 mb-3">{t('calculator.old.marginBreakdown.title')}</h6>
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-green-800">
                                {t('calculator.old.marginBreakdown.wholesalerCost')}
                              </span>
                              <span className="text-sm font-semibold text-green-900">
                                ₹{formatCurrency(result.resaleCalculations.directResale.breakdown.wholesalerCost)}
                              </span>
                            </div>
                            <div className="ml-4 space-y-1 text-xs">
                              <div className="flex justify-between text-green-700">
                                <span>{t('calculator.old.marginBreakdown.baseCost')} ({result.resaleCalculations.percentages.buyingFromWholesaler}%)</span>
                                <span>₹{formatCurrency(result.resaleCalculations.directResale.breakdown.wholesalerCostBreakdown.baseCost)}</span>
                              </div>
                              <div className="flex justify-between text-green-700">
                                <span>{t('calculator.old.marginBreakdown.labourCharges', { rate: formatNumber(result.resaleCalculations.directResale.labourInfo.labourPerGram), weight: result.input.weight })}</span>
                                <span>₹{formatCurrency(result.resaleCalculations.directResale.breakdown.wholesalerCostBreakdown.labourCharges)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-800">
                                {t('calculator.old.marginBreakdown.directResaleValue')} ({result.resaleCalculations.percentages.directResale}%)
                              </span>
                              <span className="text-sm font-semibold text-green-900">
                                ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                            <div className="space-y-2 text-sm">
                              <div className="pt-2 border-t border-green-300 flex justify-between items-center font-bold">
                                <span className="text-green-900">{t('calculator.old.marginBreakdown.directResaleMargin')}</span>
                                <span className="text-green-900">
                                  ₹{formatCurrency(result.resaleCalculations.directResale.margin)}
                                  <span className="text-xs ml-2 font-normal">
                                    ({formatNumber(result.resaleCalculations.directResale.marginPercentage)}%)
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {result.resaleCalculations.polishRepairResale && (
                result.resaleCalculations.polishRepairResale.available ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                    <h5 className="text-md font-semibold text-blue-900 mb-3">{t('calculator.old.resale.polishRepair')}</h5>
                    
                    <div className="text-center mb-4">
                      <div className="text-sm font-medium text-blue-700 mb-2">{t('calculator.old.resale.finalPolishRepairValue')}</div>
                      <div className="text-5xl font-bold text-blue-900">
                        ₹{formatCurrency(result.resaleCalculations.polishRepairResale.finalValue)}
                      </div>
                      <div className="text-sm text-blue-600 mt-2">
                        {canSeeMarginBreakdown ? (
                          <>
                            {t('calculator.old.scrapValue.for')} {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g 
                            <span className="text-xs"> {t('calculator.old.resale.afterWeightLoss', { percentage: result.resaleCalculations.polishRepairResale.weightInfo.polishRepairCostPercentage })}</span>
                          </>
                        ) : (
                          <>{t('calculator.old.scrapValue.for')} {result.input.weight}g {t('calculator.old.resale.afterPolishRepair')}</>
                        )}
                      </div>
                      {canSeeMarginBreakdown && result.resaleCalculations.polishRepairResale.breakdown.roundingApplied && (
                        <div className="text-xs text-blue-600 mt-1">
                          {t('calculator.old.resale.polishRepairNote', { 
                            resaleValue: formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount),
                            labourCost: formatCurrency(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.totalLabourCharges)
                          })}
                        </div>
                      )}
                    </div>

                    {canSeeMarginBreakdown && (
                      <div className="bg-white border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="text-xs font-semibold text-blue-900 mb-2">{t('calculator.old.weightAdjustment.title')}</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-blue-600">{t('calculator.old.weightAdjustment.original')}</div>
                            <div className="font-semibold text-blue-900">{result.resaleCalculations.polishRepairResale.weightInfo.originalWeight}g</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600">{t('calculator.old.weightAdjustment.loss')}</div>
                            <div className="font-semibold text-blue-900">{formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.weightLoss)}g</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-600">{t('calculator.old.weightAdjustment.effective')}</div>
                            <div className="font-semibold text-blue-900">{formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {permissions?.canViewMargins && (
                      <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection('polishRepairMargin')}
                          className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                            canSeeMarginBreakdown ? 'hover:bg-blue-50' : 'cursor-default'
                          }`}
                          disabled={!canSeeMarginBreakdown}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-left">
                              <div className="text-sm font-medium text-blue-700">{t('calculator.old.resale.polishRepairMargin')}</div>
                              <div className="text-2xl font-bold text-blue-900">
                                ₹{formatCurrency(result.resaleCalculations.polishRepairResale.margin)}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                ({formatNumber(result.resaleCalculations.polishRepairResale.marginPercentage)}% {t('calculator.old.resale.polishRepairMarginPercentage')})
                              </div>
                            </div>
                          </div>
                          {canSeeMarginBreakdown && (
                            expandedSections.polishRepairMargin ? (
                              <ChevronUp className="text-blue-600" size={24} />
                            ) : (
                              <ChevronDown className="text-blue-600" size={24} />
                            )
                          )}
                        </button>
                        
                        {expandedSections.polishRepairMargin && canSeeMarginBreakdown && (
                          <div className="px-5 py-4 bg-blue-50 border-t border-blue-200">
                            <h6 className="font-semibold text-blue-900 mb-3">{t('calculator.old.marginBreakdown.title')}</h6>
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-blue-800">
                                    {t('calculator.old.marginBreakdown.wholesalerCost')}
                                  </span>
                                  <span className="text-sm font-semibold text-blue-900">
                                    ₹{formatCurrency(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCost)}
                                  </span>
                                </div>
                                <div className="ml-4 space-y-1 text-xs">
                                  <div className="flex justify-between text-blue-700">
                                    <span>{t('calculator.old.marginBreakdown.baseCost')} ({result.resaleCalculations.percentages.buyingFromWholesaler}%)</span>
                                    <span>₹{formatCurrency(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCostBreakdown.baseCost)}</span>
                                  </div>
                                  <div className="flex justify-between text-blue-700">
                                    <span>{t('calculator.old.marginBreakdown.wholesalerLabour', { rate: formatNumber(result.resaleCalculations.polishRepairResale.labourInfo.wholesalerLabour.labourPerGram), weight: formatNumber(result.resaleCalculations.polishRepairResale.labourInfo.wholesalerLabour.calculatedOnWeight) })}</span>
                                    <span>₹{formatCurrency(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCostBreakdown.labourCharges)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="text-sm font-semibold flex justify-between text-blue-700 mb-2">
                                  <span>{t('calculator.old.marginBreakdown.polishRepairResaleValue')} ({result.resaleCalculations.percentages.polishRepairResale}%)</span>
                                  <span>₹{formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount)}</span>
                                </div>
                                <div className="text-xs text-blue-600 mb-2">
                                  {result.resaleCalculations.polishRepairResale.weightInfo.originalWeight}g - {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.weightLoss)}g = {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g
                                </div>
                                <div className="pt-2 border-t border-blue-200">
                                  <div className="text-sm font-semibold flex justify-between text-blue-700">
                                    <span>{t('calculator.old.marginBreakdown.polishRepairLabour', { rate: formatNumber(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.labourPerGram), weight: result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.calculatedOnWeight })}</span>
                                    <span>- ₹{formatCurrency(result.resaleCalculations.polishRepairResale.labourInfo.polishRepairLabour.totalLabourCharges)}</span>
                                  </div>
                                </div>
                                <hr className="my-2" />
                                <div className="text-sm font-bold flex justify-between text-blue-900">
                                  <span>{t('calculator.old.marginBreakdown.finalValue')}</span>
                                  <span>₹{formatCurrency(result.resaleCalculations.polishRepairResale.finalValue)}</span>
                                </div>
                              </div>

                              <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
                                <div className="space-y-2 text-sm">
                                  <div className="pt-2 border-t border-blue-300 flex justify-between items-center font-bold">
                                    <span className="text-blue-900">{t('calculator.old.marginBreakdown.netMargin')}</span>
                                    <span className="text-blue-900">
                                      ₹{formatCurrency(result.resaleCalculations.polishRepairResale.margin)}
                                      <span className="text-xs ml-2 font-normal">
                                        ({formatNumber(result.resaleCalculations.polishRepairResale.marginPercentage)}%)
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <XCircle className="text-gray-500" size={24} />
                      <h5 className="text-md font-semibold text-gray-700">{t('calculator.old.resale.polishRepair')}</h5>
                    </div>
                    
                    <div className="bg-white border border-gray-300 rounded-lg p-4 text-center">
                      <div className="text-gray-600 mb-2">
                        <XCircle className="mx-auto mb-2 text-gray-400" size={32} />
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">{t('calculator.old.resale.notAvailable')}</div>
                      <p className="text-xs text-gray-600">
                        {result.resaleCalculations.polishRepairResale.message || t('calculator.old.resale.notAvailableMessage')}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 text-center pt-4 border-t">
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
      )}
    </div>
  );
};

export default OldJewelryCalculator;