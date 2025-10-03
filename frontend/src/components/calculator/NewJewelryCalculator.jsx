import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Calculator, Info, AlertCircle, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const NewJewelryCalculator = ({ rates }) => {
  const { user } = useAuth();
  
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

  // Load user permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  // Load categories when metal changes
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

  // Filter categories when itemCategory changes
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

  // Reset selections when metal changes
  useEffect(() => {
    setItemCategory('');
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
  }, [metal]);

  // Reset category selection when item category changes
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
      toast.error('Failed to load categories');
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
      toast.error('Please select a category and enter weight');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/calculator/new-jewelry/calculate', {
        categoryId: selectedCategory._id,
        weight: weightNum
      });

      if (response.data.success) {
        setResult(response.data.data);
        setExpandedSections({ sellingRate: false, margin: false });
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
    setItemCategory('');
    setSelectedCategory(null);
    setWeight('');
    setResult(null);
    setCategories([]);
    setItemCategories([]);
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
          <Calculator className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">NEW Jewelry Calculator</h2>
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
                <div className="text-gray-600">Sell: ₹{rates.goldSell}/10g</div>
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
                <div className="text-gray-600">Sell: ₹{rates.silverSell}/kg</div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Select Item Category (if applicable) */}
      {metal && itemCategories.length > 0 && permissions?.canAccessAllCategories && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Step 2: Filter by Item Category (Optional)
          </label>
          <select
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories ({categories.length})</option>
            {itemCategories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 3: Select Code/Stamp */}
      {metal && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {permissions?.canAccessAllCategories ? 'Step 3:' : 'Step 2:'} Select Code/Stamp <span className="text-red-500">*</span>
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
                    {itemCategory 
                      ? `No categories found for ${metal} - ${itemCategory}. Try selecting a different item category.`
                      : `No ${metal} categories found. Please contact your administrator to add categories.`
                    }
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
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {category.code} - {category.itemCategory}
                      </div>
                    </div>
                    {selectedCategory?._id === category._id && (
                      <div className="ml-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
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

      {/* Category Description (shown after selection) */}
      {selectedCategory && selectedCategory.description && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-900 mb-2">Description:</h3>
          <p className="text-purple-800">{selectedCategory.description}</p>
        </div>
      )}

      {/* Step 4: Enter Weight & Calculate */}
      {selectedCategory && (
        <div className="space-y-4">
          <Input
            label={`${permissions?.canAccessAllCategories ? 'Step 4:' : 'Step 3:'} Enter Weight (grams)`}
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
                  <span className="ml-2">Calculate</span>
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
          </div>

          {/* Final Selling Amount - LARGE */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
            <div className="text-sm font-medium text-green-700 mb-2">Final Selling Amount</div>
            <div className="text-5xl font-bold text-green-900">
              ₹{formatCurrency(result.finalSellingAmount)}
            </div>
            <div className="text-sm text-green-600 mt-2">
              for {result.input.weight}g of {result.input.code}
            </div>
            {result.roundingInfo?.roundingApplied && (
              <div className="text-xs text-green-600 mt-2">
                (Rounded from ₹{formatNumber(result.roundingInfo.beforeRounding)})
              </div>
            )}
          </div>

          {/* Total Selling Rate Per Gram - Expandable */}
          <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('sellingRate')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="text-sm font-medium text-blue-700">Total Selling Rate Per Gram</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₹{formatNumber(result.sellingRateBreakdown.sellingRatePerGram)}
                  </div>
                </div>
              </div>
              {expandedSections.sellingRate ? (
                <ChevronUp className="text-blue-600" size={24} />
              ) : (
                <ChevronDown className="text-blue-600" size={24} />
              )}
            </button>
            
            {expandedSections.sellingRate && (
              <div className="px-5 py-4 bg-blue-50 border-t border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Selling Rate Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-blue-800">Rate Per Gram</span>
                    <span className="font-semibold text-blue-900">
                      ₹{formatNumber(result.sellingRateBreakdown.actualRatePerGram)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-blue-200">
                    <span className="text-blue-800">Making Charges Per Gram</span>
                    <span className="font-semibold text-blue-900">
                      ₹{formatNumber(result.sellingRateBreakdown.makingChargesPerGram)}
                    </span>
                  </div>
                  <div className="pt-2 border-t-2 border-blue-300 mt-2">
                    <div className="flex justify-between items-center font-bold text-blue-900">
                      <span>Total Selling Rate Per Gram</span>
                      <span className="text-lg">₹{formatNumber(result.sellingRateBreakdown.sellingRatePerGram)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                    <div className="text-sm font-medium text-purple-700">Margin Amount</div>
                    <div className="text-3xl font-bold text-purple-900">
                      ₹{formatCurrency(result.marginBreakdown.ourMargin)}
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
                    {/* Purchase from Wholesaler */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-800">Purchase from Wholesaler Amount</span>
                        <span className="text-sm font-semibold text-purple-900">
                          ₹{formatNumber(result.marginBreakdown.purchaseFromWholesaler)}
                        </span>
                      </div>
                    </div>

                    {/* Actual Value According to Purity */}
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-800">Actual Value According to Purity</span>
                        <span className="text-sm font-semibold text-purple-900">
                          ₹{formatNumber(result.marginBreakdown.actualValueByPurity)}
                        </span>
                      </div>
                    </div>

                    {/* Calculation Formula */}
                    <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300">
                      <h5 className="text-xs font-semibold text-purple-900 mb-3 uppercase tracking-wide">
                        Calculation Formula
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">1</div>
                          <div className="flex-1">
                            <div className="text-purple-800">Actual Value (Purity)</div>
                            <div className="font-mono text-purple-900">₹{formatNumber(result.marginBreakdown.actualValueByPurity)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pl-6">
                          <div className="text-purple-600 font-bold">+</div>
                          <div className="flex-1">
                            <div className="text-purple-800">Wholesaler Margin</div>
                            <div className="font-mono text-purple-900">₹{formatNumber(result.marginBreakdown.wholesalerMargin)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 border-t border-purple-300 pt-2">
                          <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">=</div>
                          <div className="flex-1">
                            <div className="text-purple-800 font-medium">Purchase from Wholesaler</div>
                            <div className="font-mono font-semibold text-purple-900">₹{formatNumber(result.marginBreakdown.purchaseFromWholesaler)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-6 mt-3">
                          <div className="text-purple-600 font-bold">+</div>
                          <div className="flex-1">
                            <div className="text-purple-800">Our Margin</div>
                            <div className="font-mono text-purple-900">₹{formatCurrency(result.marginBreakdown.ourMargin)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t-2 border-purple-400 pt-2 mt-2">
                          <div className="flex-shrink-0 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">=</div>
                          <div className="flex-1">
                            <div className="text-green-800 font-bold">Final Selling Amount</div>
                            <div className="font-mono font-bold text-green-900 text-lg">₹{formatCurrency(result.finalSellingAmount)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

export default NewJewelryCalculator;