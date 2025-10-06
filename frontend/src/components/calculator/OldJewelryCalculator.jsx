import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calculator, Info, AlertCircle, ChevronDown, ChevronUp, Coins, Sparkles, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const OldJewelryCalculator = ({ rates }) => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [metal, setMetal] = useState('');
  const [source, setSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedResaleCategory, setSelectedResaleCategory] = useState(null);
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  
  // Categories data
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // User permissions
  const [permissions, setPermissions] = useState(null);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    scrapMargin: false,
    directResaleMargin: false,
    polishRepairMargin: false
  });

  // Load user permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  // Load categories when metal changes
  useEffect(() => {
    if (metal) {
      loadCategories(metal);
    } else {
      setCategories([]);
      setFilteredCategories([]);
    }
  }, [metal]);

  // Update filtered categories when categories change
  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  // Reset selections when metal changes
  useEffect(() => {
    setSource('');
    setSelectedCategory(null);
    setSelectedResaleCategory(null);
    setWeight('');
    setResult(null);
  }, [metal]);

  // Reset category selection when source changes
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedResaleCategory(null);
    setWeight('');
    setResult(null);
  }, [source]);

  // Reset resale category selection when main category changes
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
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedCategory || !weight || !source) {
      toast.error('Please select metal, source, category and enter weight');
      return;
    }

    // If category has resale categories and user can see resale, require selection
    const canSeeResale = permissions && ['admin', 'manager', 'pro_client'].includes(user.role);
    if (selectedCategory.resaleEnabled && 
        selectedCategory.resaleCategories && 
        selectedCategory.resaleCategories.length > 0 && 
        canSeeResale && 
        !selectedResaleCategory) {
      toast.error('Please select a resale category type');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        categoryId: selectedCategory._id,
        weight: weightNum,
        source: source
      };

      // Only add resaleCategoryId if one is selected
      if (selectedResaleCategory) {
        requestBody.resaleCategoryId = selectedResaleCategory._id;
      }

      const response = await api.post('/calculator/old-jewelry/calculate', requestBody);

      if (response.data.success) {
        setResult(response.data.data);
        setExpandedSections({ scrapMargin: false, directResaleMargin: false, polishRepairMargin: false });
        toast.success('Calculation completed');
      }
    } catch (error) {
      console.error('Calculation error:', error);
      const errorMessage = error.response?.data?.message || 'Calculation failed';
      toast.error(errorMessage);
      
      if (error.response?.status === 404) {
        toast.error('Category not found. It may have been deleted.');
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

  // Format number for display
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Format currency (whole numbers only)
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Check if user can see resale options
  const canSeeResale = permissions && ['admin', 'manager', 'pro_client'].includes(user.role);
  const canSeeMarginBreakdown = permissions && ['admin', 'manager'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Calculator Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">OLD Jewelry Calculator</h2>
        </div>
        {(metal || selectedCategory) && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
          >
            Reset All
          </Button>
        )}
      </div>

      {/* Step 1: Select Metal */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Step 1: Select Metal Type <span className="text-red-500">*</span>
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
              <span className="font-medium">Gold</span>
            </div>
            {rates && (
              <div className="text-sm mt-2">
                <div className="text-gray-600">Buy: ₹{rates.goldBuy}/10g</div>
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
              <span className="font-medium">Silver</span>
            </div>
            {rates && (
              <div className="text-sm mt-2">
                <div className="text-gray-600">Buy: ₹{rates.silverBuy}/kg</div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Select Own/Other */}
      {metal && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Step 2: Select Jewelry Source <span className="text-red-500">*</span>
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
                  Own
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Shop's own jewelry
                </div>
                {source === 'own' && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    ✓ Selected
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
                  Other
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Customer's jewelry
                </div>
                {source === 'other' && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">
                    ✓ Selected
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Code/Stamp */}
      {metal && source && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Step 3: Select Code/Stamp <span className="text-red-500">*</span>
          </label>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600">Loading categories...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">No categories available</p>
                  <p className="text-yellow-700 mt-1">
                    No {metal} OLD jewelry categories found. Please contact your administrator to add categories.
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
                          {category.resaleCategories.length} resale {category.resaleCategories.length === 1 ? 'category' : 'categories'}
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

      {/* Category Descriptions (shown after selection) */}
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
                {desc.type === 'universal' ? 'Universal Description' : 'Role-Specific Description'}
              </h3>
              <p className={desc.type === 'universal' ? 'text-purple-800' : 'text-blue-800'}>
                {desc.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Select Resale Category (NEW - only if applicable) */}
      {selectedCategory && selectedCategory.resaleEnabled && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 && canSeeResale && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Step 4: Select Category Type <span className="text-red-500">*</span>
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
                {selectedResaleCategory?._id === resaleCat._id && (
                  <div className="text-xs text-green-600 mt-1">✓ Selected</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5/4: Enter Weight & Calculate */}
      {selectedCategory && (!selectedCategory.resaleEnabled || !canSeeResale || !selectedCategory.resaleCategories || selectedCategory.resaleCategories.length === 0 || selectedResaleCategory) && (
        <div className="space-y-4">
          <Input
            label={`${selectedCategory.resaleEnabled && canSeeResale && selectedCategory.resaleCategories && selectedCategory.resaleCategories.length > 0 ? 'Step 5' : 'Step 4'}: Enter Weight (grams)`}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.00"
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
                  <span className="ml-2">Calculating...</span>
                </>
              ) : (
                <>
                  <Calculator size={18} />
                  <span className="ml-2">Calculate Value</span>
                </>
              )}
            </Button>
            
            {(weight || result) && (
              <Button
                variant="outline"
                onClick={resetCalculation}
                disabled={loading}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Calculation Results */}
      {result && (
        <div className="space-y-4 border-t-2 border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Calculation Results
            </h3>
            <div className="text-sm text-gray-600">
              Source: <span className="font-medium capitalize">{result.input.source}</span>
              {result.input.selectedResaleCategory && (
                <span className="ml-2">
                  | Category: <span className="font-medium">{result.input.selectedResaleCategory.itemCategory}</span>
                </span>
              )}
            </div>
          </div>

          {/* SCRAP VALUE SECTION - Always Visible (based on role) */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="text-orange-700" size={24} />
              <h4 className="text-lg font-semibold text-orange-900">Scrap Value</h4>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-sm font-medium text-orange-700 mb-2">Total Scrap Buying Value</div>
              <div className="text-5xl font-bold text-orange-900">
                ₹{formatCurrency(result.totalScrapValue)}
              </div>
              <div className="text-sm text-orange-600 mt-2">
                for {result.input.weight}g of {result.input.code}
              </div>
              {result.roundingInfo?.roundingApplied && (
                <div className="text-xs text-orange-600 mt-2">
                  (Rounded from ₹{formatNumber(result.roundingInfo.beforeRounding)})
                </div>
              )}
            </div>

            {/* Scrap Margin - For Pro Client (amount only) and Admin/Manager (full breakdown) */}
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
                      <div className="text-sm font-medium text-orange-700">Scrap Margin</div>
                      <div className="text-2xl font-bold text-orange-900">
                        ₹{formatCurrency(result.marginBreakdown.scrapMargin)}
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
                
                {/* Detailed Breakdown - Only for Admin/Manager */}
                {expandedSections.scrapMargin && canSeeMarginBreakdown && (
                  <div className="px-5 py-4 bg-orange-50 border-t border-orange-200">
                    <h5 className="font-semibold text-orange-900 mb-3">Margin Breakdown</h5>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-orange-800">Actual Value by Purity ({result.percentages.truePurity}%)</span>
                          <span className="text-sm font-semibold text-orange-900">
                            ₹{formatNumber(result.marginBreakdown.actualValueByPurity)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-orange-800">Total Scrap Buying Value</span>
                          <span className="text-sm font-semibold text-orange-900">
                            ₹{formatCurrency(result.marginBreakdown.totalScrapValue)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300">
                        <div className="text-xs font-semibold text-orange-900 mb-2 uppercase tracking-wide">
                          Calculation Formula
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

          {/* RESALE CALCULATIONS - Only for Admin/Manager/Pro Client AND if resale enabled */}
          {canSeeResale && result.resaleEnabled && result.resaleCalculations && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-green-600" size={24} />
                <h4 className="text-lg font-semibold text-gray-900">Resale Options</h4>
              </div>

              {/* DIRECT RESALE */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <h5 className="text-md font-semibold text-green-900 mb-3">Direct Resale (Ready to Sell)</h5>
                
                <div className="text-center mb-4">
                  <div className="text-sm font-medium text-green-700 mb-2">Direct Resale Value</div>
                  <div className="text-4xl font-bold text-green-900">
                    ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)}
                  </div>
                  <div className="text-sm text-green-600 mt-2">
                    for {result.input.weight}g
                  </div>
                  {result.resaleCalculations.directResale.breakdown.roundingApplied && (
                    <div className="text-xs text-green-600 mt-1">
                      (Rounded from ₹{formatNumber(result.resaleCalculations.directResale.breakdown.beforeRounding)})
                    </div>
                  )}
                </div>

                {/* Direct Resale Margin */}
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
                          <div className="text-sm font-medium text-green-700">Direct Resale Margin</div>
                          <div className="text-2xl font-bold text-green-900">
                            ₹{formatCurrency(result.resaleCalculations.directResale.margin)}
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
                        <h6 className="font-semibold text-green-900 mb-3">Margin Breakdown</h6>
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-800">Wholesaler Cost</span>
                              <span className="text-sm font-semibold text-green-900">
                                ₹{formatNumber(result.resaleCalculations.directResale.breakdown.wholesalerCost)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-800">Direct Resale Value</span>
                              <span className="text-sm font-semibold text-green-900">
                                ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                            <div className="text-xs font-semibold text-green-900 mb-2 uppercase tracking-wide">
                              Calculation Formula
                            </div>
                            <div className="font-mono text-sm text-green-900">
                              ₹{formatNumber(result.resaleCalculations.directResale.breakdown.wholesalerCost)} - ₹{formatCurrency(result.resaleCalculations.directResale.totalAmount)} = ₹{formatCurrency(result.resaleCalculations.directResale.margin)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* POLISH/REPAIR RESALE */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                <h5 className="text-md font-semibold text-blue-900 mb-3">Polish/Repair Resale</h5>
                
                <div className="text-center mb-4">
                  <div className="text-sm font-medium text-blue-700 mb-2">Polish/Repair Resale Value</div>
                  <div className="text-4xl font-bold text-blue-900">
                    ₹{formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount)}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    for {formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g 
                    <span className="text-xs"> (after {result.resaleCalculations.polishRepairResale.weightInfo.polishRepairCostPercentage}% weight loss)</span>
                  </div>
                  {result.resaleCalculations.polishRepairResale.breakdown.roundingApplied && (
                    <div className="text-xs text-blue-600 mt-1">
                      (Rounded from ₹{formatNumber(result.resaleCalculations.polishRepairResale.breakdown.beforeRounding)})
                    </div>
                  )}
                </div>

                {/* Weight Info */}
                <div className="bg-white border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="text-xs font-semibold text-blue-900 mb-2">Weight Adjustment</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-blue-600">Original</div>
                      <div className="font-semibold text-blue-900">{result.resaleCalculations.polishRepairResale.weightInfo.originalWeight}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-600">Loss</div>
                      <div className="font-semibold text-blue-900">{formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.weightLoss)}g</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-600">Effective</div>
                      <div className="font-semibold text-blue-900">{formatNumber(result.resaleCalculations.polishRepairResale.weightInfo.effectiveWeight)}g</div>
                    </div>
                  </div>
                </div>

                {/* Polish/Repair Margin */}
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
                          <div className="text-sm font-medium text-blue-700">Polish/Repair Margin</div>
                          <div className="text-2xl font-bold text-blue-900">
                            ₹{formatCurrency(result.resaleCalculations.polishRepairResale.margin)}
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
                        <h6 className="font-semibold text-blue-900 mb-3">Margin Breakdown</h6>
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-800">Wholesaler Cost (Effective Weight)</span>
                              <span className="text-sm font-semibold text-blue-900">
                                ₹{formatNumber(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCost)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-800">Polish/Repair Resale Value</span>
                              <span className="text-sm font-semibold text-blue-900">
                                ₹{formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
                            <div className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
                              Calculation Formula
                            </div>
                            <div className="font-mono text-sm text-blue-900">
                              ₹{formatNumber(result.resaleCalculations.polishRepairResale.breakdown.wholesalerCost)} - ₹{formatCurrency(result.resaleCalculations.polishRepairResale.totalAmount)} = ₹{formatCurrency(result.resaleCalculations.polishRepairResale.margin)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calculation Metadata */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            Calculated at: {new Date(result.metadata.calculatedAt).toLocaleString('en-IN', {
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