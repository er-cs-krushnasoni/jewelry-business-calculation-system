import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calculator, Info, AlertCircle, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const OldJewelryCalculator = ({ rates }) => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [metal, setMetal] = useState('');
  const [source, setSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  
  // Categories data
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // User permissions
  const [permissions, setPermissions] = useState(null);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    margin: false
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

  // Update filtered categories when categories or source changes
  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories, source]);

  // Reset selections when metal changes
  useEffect(() => {
    setSource('');
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
  }, [metal]);

  // Reset category selection when source changes
  useEffect(() => {
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
  }, [source]);

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

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/calculator/old-jewelry/calculate', {
        categoryId: selectedCategory._id,
        weight: weightNum,
        source: source
      });

      if (response.data.success) {
        setResult(response.data.data);
        setExpandedSections({ margin: false });
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
                      {category.resaleEnabled && (
                        <div className="text-xs text-green-600 mt-1">
                          Resale available (Coming soon)
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

      {/* Step 4: Enter Weight & Calculate */}
      {selectedCategory && (
        <div className="space-y-4">
          <Input
            label="Step 4: Enter Weight (grams)"
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
                  <span className="ml-2">Calculate Scrap Value</span>
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
              Scrap Calculation Results
            </h3>
            <div className="text-sm text-gray-600">
              Source: <span className="font-medium capitalize">{result.input.source}</span>
            </div>
          </div>

          {/* Total Scrap Value - LARGE */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 text-center">
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

          {/* Scrap Value Per Gram */}
          <div className="bg-white border-2 border-orange-200 rounded-lg p-5">
            <div className="text-sm font-medium text-orange-700 mb-1">Scrap Value Per Gram</div>
            <div className="text-2xl font-bold text-orange-900">
              ₹{formatNumber(result.scrapBreakdown.scrapValuePerGram)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Based on {result.percentages.scrapBuy}% of ₹{formatNumber(result.rates.ratePerGram)}/gram
            </div>
          </div>

          {/* Margin Amount - For Admin/Manager/Pro Client */}
          {permissions?.canViewMargins && (
            <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('margin')}
                className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                  permissions?.canViewWholesaleRates ? 'hover:bg-purple-50' : 'cursor-default'
                }`}
                disabled={!permissions?.canViewWholesaleRates}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <div className="text-sm font-medium text-purple-700">Scrap Margin Amount</div>
                    <div className="text-3xl font-bold text-purple-900">
                      ₹{formatCurrency(result.marginBreakdown.scrapMargin)}
                    </div>
                  </div>
                </div>
                {permissions?.canViewWholesaleRates && (
                  expandedSections.margin ? (
                    <ChevronUp className="text-purple-600" size={24} />
                  ) : (
                    <ChevronDown className="text-purple-600" size={24} />
                  )
                )}
              </button>
              
              {/* Detailed Breakdown - Only for Admin/Manager */}
              {expandedSections.margin && permissions?.canViewWholesaleRates && (
                <div className="px-5 py-4 bg-purple-50 border-t border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">Margin Breakdown</h4>
                  <div className="space-y-3">
                    {/* Actual Value by Purity */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-800">Actual Value by Purity ({result.percentages.truePurity}%)</span>
                        <span className="text-sm font-semibold text-purple-900">
                          ₹{formatNumber(result.marginBreakdown.actualValueByPurity)}
                        </span>
                      </div>
                    </div>

                    {/* Total Scrap Value */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-800">Total Scrap Buying Value</span>
                        <span className="text-sm font-semibold text-purple-900">
                          ₹{formatCurrency(result.marginBreakdown.totalScrapValue)}
                        </span>
                      </div>
                    </div>

                    {/* Calculation Formula */}
                    <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300">
                      <h5 className="text-xs font-semibold text-purple-900 mb-3 uppercase tracking-wide">
                        Margin Calculation
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">1</div>
                          <div className="flex-1">
                            <div className="text-purple-800">Actual Value (True Purity)</div>
                            <div className="font-mono text-purple-900">₹{formatNumber(result.marginBreakdown.actualValueByPurity)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pl-6">
                          <div className="text-purple-600 font-bold">-</div>
                          <div className="flex-1">
                            <div className="text-purple-800">Scrap Buying Value</div>
                            <div className="font-mono text-purple-900">₹{formatCurrency(result.marginBreakdown.totalScrapValue)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 border-t-2 border-purple-400 pt-2 mt-2">
                          <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">=</div>
                          <div className="flex-1">
                            <div className="text-purple-800 font-bold">Scrap Margin</div>
                            <div className="font-mono font-bold text-purple-900 text-lg">₹{formatCurrency(result.marginBreakdown.scrapMargin)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resale Info (if enabled) */}
          {result.resaleInfo?.resaleEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Resale Options Available</p>
                  <p className="text-blue-700 mt-1">
                    {result.resaleInfo.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Metadata */}
          <div className="text-xs text-gray-500 text-center pt-4">
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