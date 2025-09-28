import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Info, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const ExtendedJewelryForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDescriptionHelp, setShowDescriptionHelp] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: initialData?.type || 'NEW',
    metal: initialData?.metal || '',
    code: initialData?.code || '',
    
    // NEW jewelry fields
    itemCategory: initialData?.itemCategory || '',
    purityPercentage: initialData?.purityPercentage || '',
    buyingFromWholesalerPercentage: initialData?.buyingFromWholesalerPercentage || '',
    sellingPercentage: initialData?.sellingPercentage || '',
    
    // OLD jewelry fields
    truePurityPercentage: initialData?.truePurityPercentage || '',
    scrapBuyOwnPercentage: initialData?.scrapBuyOwnPercentage || '',
    scrapBuyOtherPercentage: initialData?.scrapBuyOtherPercentage || '',
    resaleEnabled: initialData?.resaleEnabled || false,
    directResalePercentage: initialData?.directResalePercentage || '',
    polishRepairResalePercentage: initialData?.polishRepairResalePercentage || '',
    polishRepairCostPercentage: initialData?.polishRepairCostPercentage || '',
    
    // Descriptions - handle both old and new format
    descriptions: {
      universal: initialData?.descriptions?.universal || '',
      admin: initialData?.descriptions?.admin || '',
      manager: initialData?.descriptions?.manager || '',
      proClient: initialData?.descriptions?.proClient || '',
      client: initialData?.descriptions?.client || ''
    }
  });

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDescriptionChange = (role, value) => {
    setFormData(prev => ({
      ...prev,
      descriptions: {
        ...prev.descriptions,
        [role]: value
      }
    }));

    // Clear error for descriptions
    if (errors[`descriptions.${role}`]) {
      setErrors(prev => ({
        ...prev,
        [`descriptions.${role}`]: null
      }));
    }
  };

  const handleTypeChange = (newType) => {
    // When changing type, reset type-specific fields to avoid confusion
    setFormData(prev => ({
      ...prev,
      type: newType,
      // Reset NEW jewelry fields
      itemCategory: '',
      purityPercentage: '',
      sellingPercentage: '',
      // Reset OLD jewelry fields
      truePurityPercentage: '',
      scrapBuyOwnPercentage: '',
      scrapBuyOtherPercentage: '',
      resaleEnabled: false,
      directResalePercentage: '',
      polishRepairResalePercentage: '',
      polishRepairCostPercentage: '',
      // Keep buyingFromWholesalerPercentage as it's used in both types conditionally
      buyingFromWholesalerPercentage: ''
    }));
    
    // Clear all errors when type changes
    setErrors({});
  };

  const handleResaleToggle = (enabled) => {
    setFormData(prev => ({
      ...prev,
      resaleEnabled: enabled,
      // Clear resale-specific fields if disabled
      ...(enabled ? {} : {
        directResalePercentage: '',
        polishRepairResalePercentage: '',
        polishRepairCostPercentage: '',
        buyingFromWholesalerPercentage: ''
      })
    }));

    // Clear resale-related errors
    if (!enabled) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.directResalePercentage;
        delete newErrors.polishRepairResalePercentage;
        delete newErrors.polishRepairCostPercentage;
        delete newErrors.buyingFromWholesalerPercentage;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic required fields
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.metal) {
      newErrors.metal = 'Metal is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (formData.code.length > 20) {
      newErrors.code = 'Code cannot exceed 20 characters';
    }

    // NEW jewelry validations
    if (formData.type === 'NEW') {
      if (!formData.itemCategory.trim()) {
        newErrors.itemCategory = 'Item category is required for NEW jewelry';
      } else if (formData.itemCategory.length > 50) {
        newErrors.itemCategory = 'Item category cannot exceed 50 characters';
      }

      if (!formData.purityPercentage) {
        newErrors.purityPercentage = 'Purity percentage is required for NEW jewelry';
      } else {
        const purity = parseFloat(formData.purityPercentage);
        if (isNaN(purity) || purity < 1 || purity > 100) {
          newErrors.purityPercentage = 'Purity percentage must be between 1 and 100';
        }
      }

      if (!formData.buyingFromWholesalerPercentage) {
        newErrors.buyingFromWholesalerPercentage = 'Buying percentage is required for NEW jewelry';
      } else {
        const buying = parseFloat(formData.buyingFromWholesalerPercentage);
        if (isNaN(buying) || buying < 1) {
          newErrors.buyingFromWholesalerPercentage = 'Buying percentage must be at least 1';
        }
      }

      if (!formData.sellingPercentage) {
        newErrors.sellingPercentage = 'Selling percentage is required for NEW jewelry';
      } else {
        const selling = parseFloat(formData.sellingPercentage);
        if (isNaN(selling) || selling < 1) {
          newErrors.sellingPercentage = 'Selling percentage must be at least 1';
        }
      }
    }

    // OLD jewelry validations
    if (formData.type === 'OLD') {
      if (!formData.truePurityPercentage) {
        newErrors.truePurityPercentage = 'True purity percentage is required for OLD jewelry';
      } else {
        const purity = parseFloat(formData.truePurityPercentage);
        if (isNaN(purity) || purity < 1 || purity > 100) {
          newErrors.truePurityPercentage = 'True purity percentage must be between 1 and 100';
        }
      }

      if (!formData.scrapBuyOwnPercentage) {
        newErrors.scrapBuyOwnPercentage = 'Scrap buy own percentage is required for OLD jewelry';
      } else {
        const scrapOwn = parseFloat(formData.scrapBuyOwnPercentage);
        if (isNaN(scrapOwn) || scrapOwn < 1) {
          newErrors.scrapBuyOwnPercentage = 'Scrap buy own percentage must be at least 1';
        }
      }

      if (!formData.scrapBuyOtherPercentage) {
        newErrors.scrapBuyOtherPercentage = 'Scrap buy other percentage is required for OLD jewelry';
      } else {
        const scrapOther = parseFloat(formData.scrapBuyOtherPercentage);
        if (isNaN(scrapOther) || scrapOther < 1) {
          newErrors.scrapBuyOtherPercentage = 'Scrap buy other percentage must be at least 1';
        }
      }

      // Resale validations when enabled
      if (formData.resaleEnabled) {
        if (!formData.directResalePercentage) {
          newErrors.directResalePercentage = 'Direct resale percentage is required when resale is enabled';
        } else {
          const directResale = parseFloat(formData.directResalePercentage);
          if (isNaN(directResale) || directResale < 1) {
            newErrors.directResalePercentage = 'Direct resale percentage must be at least 1';
          }
        }

        if (!formData.polishRepairResalePercentage) {
          newErrors.polishRepairResalePercentage = 'Polish/repair resale percentage is required when resale is enabled';
        } else {
          const polishRepair = parseFloat(formData.polishRepairResalePercentage);
          if (isNaN(polishRepair) || polishRepair < 1) {
            newErrors.polishRepairResalePercentage = 'Polish/repair resale percentage must be at least 1';
          }
        }

        if (formData.polishRepairCostPercentage === '') {
          newErrors.polishRepairCostPercentage = 'Polish/repair cost percentage is required when resale is enabled';
        } else {
          const polishCost = parseFloat(formData.polishRepairCostPercentage);
          if (isNaN(polishCost) || polishCost < 0 || polishCost > 50) {
            newErrors.polishRepairCostPercentage = 'Polish/repair cost percentage must be between 0 and 50';
          }
        }

        if (!formData.buyingFromWholesalerPercentage) {
          newErrors.buyingFromWholesalerPercentage = 'Buying from wholesaler percentage is required when resale is enabled';
        } else {
          const buying = parseFloat(formData.buyingFromWholesalerPercentage);
          if (isNaN(buying) || buying < 1) {
            newErrors.buyingFromWholesalerPercentage = 'Buying from wholesaler percentage must be at least 1';
          }
        }
      }
    }

    // Description length validations
    Object.keys(formData.descriptions).forEach(role => {
      const description = formData.descriptions[role];
      if (description && description.length > 500) {
        newErrors[`descriptions.${role}`] = `${role.charAt(0).toUpperCase() + role.slice(1)} description cannot exceed 500 characters`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare submit data
      const submitData = {
        ...formData,
        code: formData.code.trim()
      };

      // Clean up type-specific fields
      if (formData.type === 'NEW') {
        submitData.itemCategory = formData.itemCategory.trim();
        submitData.purityPercentage = parseFloat(formData.purityPercentage);
        submitData.buyingFromWholesalerPercentage = parseFloat(formData.buyingFromWholesalerPercentage);
        submitData.sellingPercentage = parseFloat(formData.sellingPercentage);
        
        // Remove OLD jewelry fields
        delete submitData.truePurityPercentage;
        delete submitData.scrapBuyOwnPercentage;
        delete submitData.scrapBuyOtherPercentage;
        delete submitData.resaleEnabled;
        delete submitData.directResalePercentage;
        delete submitData.polishRepairResalePercentage;
        delete submitData.polishRepairCostPercentage;
      } else if (formData.type === 'OLD') {
        submitData.truePurityPercentage = parseFloat(formData.truePurityPercentage);
        submitData.scrapBuyOwnPercentage = parseFloat(formData.scrapBuyOwnPercentage);
        submitData.scrapBuyOtherPercentage = parseFloat(formData.scrapBuyOtherPercentage);
        submitData.resaleEnabled = Boolean(formData.resaleEnabled);
        
        if (formData.resaleEnabled) {
          submitData.directResalePercentage = parseFloat(formData.directResalePercentage);
          submitData.polishRepairResalePercentage = parseFloat(formData.polishRepairResalePercentage);
          submitData.polishRepairCostPercentage = parseFloat(formData.polishRepairCostPercentage);
          submitData.buyingFromWholesalerPercentage = parseFloat(formData.buyingFromWholesalerPercentage);
        }
        
        // Remove NEW jewelry fields
        delete submitData.itemCategory;
        delete submitData.purityPercentage;
        delete submitData.sellingPercentage;
        if (!formData.resaleEnabled) {
          delete submitData.buyingFromWholesalerPercentage;
        }
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(errorMsg => {
          // Try to map error messages to form fields
          if (errorMsg.includes('Code')) {
            serverErrors.code = errorMsg;
          } else if (errorMsg.includes('Item category')) {
            serverErrors.itemCategory = errorMsg;
          } else if (errorMsg.includes('Purity')) {
            serverErrors.purityPercentage = errorMsg;
          } else if (errorMsg.includes('True purity')) {
            serverErrors.truePurityPercentage = errorMsg;
          } else if (errorMsg.includes('Buying')) {
            serverErrors.buyingFromWholesalerPercentage = errorMsg;
          } else if (errorMsg.includes('Selling')) {
            serverErrors.sellingPercentage = errorMsg;
          } else if (errorMsg.includes('Scrap buy own')) {
            serverErrors.scrapBuyOwnPercentage = errorMsg;
          } else if (errorMsg.includes('Scrap buy other')) {
            serverErrors.scrapBuyOtherPercentage = errorMsg;
          } else if (errorMsg.includes('Direct resale')) {
            serverErrors.directResalePercentage = errorMsg;
          } else if (errorMsg.includes('Polish/repair resale')) {
            serverErrors.polishRepairResalePercentage = errorMsg;
          } else if (errorMsg.includes('Polish/repair cost')) {
            serverErrors.polishRepairCostPercentage = errorMsg;
          } else {
            serverErrors.general = errorMsg;
          }
        });
        setErrors(serverErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isEditing} // Don't allow changing type when editing
            >
              <option value="">Select Type</option>
              <option value="NEW">NEW</option>
              <option value="OLD">OLD</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Metal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metal <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.metal}
              onChange={(e) => handleInputChange('metal', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.metal ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Metal</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
            </select>
            {errors.metal && (
              <p className="text-red-500 text-sm mt-1">{errors.metal}</p>
            )}
          </div>

          {/* Code */}
          <Input
            label="Code/Stamp"
            name="code"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            placeholder="e.g., ABC123, વિશિષ્ટ123, विशेष123"
            error={errors.code}
            required
            maxLength={20}
          />
        </div>

        {/* NEW Jewelry Specific Fields */}
        {formData.type === 'NEW' && (
          <>
            {/* Item Category */}
            <Input
              label="Item Category"
              name="itemCategory"
              value={formData.itemCategory}
              onChange={(e) => handleInputChange('itemCategory', e.target.value)}
              placeholder="e.g., Chain, Bracelet, Ring, હાર, કડું, चेन"
              error={errors.itemCategory}
              required
              maxLength={50}
            />

            {/* NEW Jewelry Percentages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Purity Percentage"
                name="purityPercentage"
                type="number"
                value={formData.purityPercentage}
                onChange={(e) => handleInputChange('purityPercentage', e.target.value)}
                placeholder="91.6"
                error={errors.purityPercentage}
                required
                min="1"
                max="100"
                step="0.01"
              />

              <Input
                label="Buying from Wholesaler %"
                name="buyingFromWholesalerPercentage"
                type="number"
                value={formData.buyingFromWholesalerPercentage}
                onChange={(e) => handleInputChange('buyingFromWholesalerPercentage', e.target.value)}
                placeholder="85.5"
                error={errors.buyingFromWholesalerPercentage}
                required
                min="1"
                step="0.01"
              />

              <Input
                label="Selling Percentage"
                name="sellingPercentage"
                type="number"
                value={formData.sellingPercentage}
                onChange={(e) => handleInputChange('sellingPercentage', e.target.value)}
                placeholder="95.0"
                error={errors.sellingPercentage}
                required
                min="1"
                step="0.01"
              />
            </div>
          </>
        )}

        {/* OLD Jewelry Specific Fields */}
        {formData.type === 'OLD' && (
          <>
            {/* OLD Jewelry Basic Percentages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="True Purity Percentage"
                name="truePurityPercentage"
                type="number"
                value={formData.truePurityPercentage}
                onChange={(e) => handleInputChange('truePurityPercentage', e.target.value)}
                placeholder="91.6"
                error={errors.truePurityPercentage}
                required
                min="1"
                max="100"
                step="0.01"
              />

              <Input
                label="Scrap Buy Own %"
                name="scrapBuyOwnPercentage"
                type="number"
                value={formData.scrapBuyOwnPercentage}
                onChange={(e) => handleInputChange('scrapBuyOwnPercentage', e.target.value)}
                placeholder="85.0"
                error={errors.scrapBuyOwnPercentage}
                required
                min="1"
                step="0.01"
              />

              <Input
                label="Scrap Buy Other %"
                name="scrapBuyOtherPercentage"
                type="number"
                value={formData.scrapBuyOtherPercentage}
                onChange={(e) => handleInputChange('scrapBuyOtherPercentage', e.target.value)}
                placeholder="80.0"
                error={errors.scrapBuyOtherPercentage}
                required
                min="1"
                step="0.01"
              />
            </div>

            {/* Resale System Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="resaleEnabled"
                  checked={formData.resaleEnabled}
                  onChange={(e) => handleResaleToggle(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="resaleEnabled" className="text-sm font-medium text-gray-700">
                  Enable Resale Options
                </label>
              </div>
              <p className="text-sm text-gray-500">
                When enabled, this category will support direct resale and polish/repair resale calculations in addition to scrap value.
              </p>
            </div>

            {/* Resale Fields (shown only when resale is enabled) */}
            {formData.resaleEnabled && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900">Resale Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Direct Resale %"
                    name="directResalePercentage"
                    type="number"
                    value={formData.directResalePercentage}
                    onChange={(e) => handleInputChange('directResalePercentage', e.target.value)}
                    placeholder="92.0"
                    error={errors.directResalePercentage}
                    required
                    min="1"
                    step="0.01"
                  />

                  <Input
                    label="Polish/Repair Resale %"
                    name="polishRepairResalePercentage"
                    type="number"
                    value={formData.polishRepairResalePercentage}
                    onChange={(e) => handleInputChange('polishRepairResalePercentage', e.target.value)}
                    placeholder="90.0"
                    error={errors.polishRepairResalePercentage}
                    required
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Polish/Repair Cost %"
                    name="polishRepairCostPercentage"
                    type="number"
                    value={formData.polishRepairCostPercentage}
                    onChange={(e) => handleInputChange('polishRepairCostPercentage', e.target.value)}
                    placeholder="5.0"
                    error={errors.polishRepairCostPercentage}
                    required
                    min="0"
                    max="50"
                    step="0.01"
                  />

                  <Input
                    label="Buying from Wholesaler %"
                    name="buyingFromWholesalerPercentage"
                    type="number"
                    value={formData.buyingFromWholesalerPercentage}
                    onChange={(e) => handleInputChange('buyingFromWholesalerPercentage', e.target.value)}
                    placeholder="85.5"
                    error={errors.buyingFromWholesalerPercentage}
                    required
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Multi-Level Descriptions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Multi-Level Descriptions</h3>
          <button
            type="button"
            onClick={() => setShowDescriptionHelp(!showDescriptionHelp)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showDescriptionHelp ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDescriptionHelp ? 'Hide Help' : 'Show Help'}
          </button>
        </div>

        {showDescriptionHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-800">
                <h4 className="font-medium">Description Priority System:</h4>
                <ul className="space-y-1">
                  <li><strong>1. Universal Description:</strong> Shown to all users if no role-specific description exists</li>
                  <li><strong>2. Role-Based Descriptions:</strong> Override universal description for specific roles</li>
                  <li><strong>3. Multi-Language Support:</strong> All descriptions support Gujarati, Hindi, English, and symbols</li>
                </ul>
                <p className="mt-2 text-xs text-blue-600">
                  <strong>Display Logic:</strong> If universal description exists → show it. If role-specific description also exists → show role-specific instead. If neither exists → show nothing.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Universal Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universal Description
              <span className="text-xs text-gray-500 ml-2">(Fallback for all roles)</span>
            </label>
            <textarea
              value={formData.descriptions.universal}
              onChange={(e) => handleDescriptionChange('universal', e.target.value)}
              placeholder="Universal description visible to all users when no role-specific description is available. Supports all languages: આ વર્ણન બધા વપરાશકર્તાઓને દેખાય છે | यह विवरण सभी उपयोगकर्ताओं को दिखता है"
              rows={3}
              maxLength={500}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                errors['descriptions.universal'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors['descriptions.universal'] && (
                <p className="text-red-500 text-sm">{errors['descriptions.universal']}</p>
              )}
              <p className="text-gray-500 text-sm ml-auto">
                {formData.descriptions.universal.length}/500
              </p>
            </div>
          </div>

          {/* Role-specific Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Only Description
                <span className="text-xs text-gray-500 ml-2">(Overrides Universal)</span>
              </label>
              <textarea
                value={formData.descriptions.admin}
                onChange={(e) => handleDescriptionChange('admin', e.target.value)}
                placeholder="Admin-specific description. Supports all languages and symbols: એડમિન માટે વિશેષ વર્ણન | एडमिन के लिए विशेष विवरण"
                rows={3}
                maxLength={500}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  errors['descriptions.admin'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors['descriptions.admin'] && (
                  <p className="text-red-500 text-sm">{errors['descriptions.admin']}</p>
                )}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.descriptions.admin.length}/500
                </p>
              </div>
            </div>

            {/* Manager Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Only Description
                <span className="text-xs text-gray-500 ml-2">(Overrides Universal)</span>
              </label>
              <textarea
                value={formData.descriptions.manager}
                onChange={(e) => handleDescriptionChange('manager', e.target.value)}
                placeholder="Manager-specific description. Supports all languages and symbols: મેનેજર માટે વિશેષ વર્ણન | मैनेजर के लिए विशेष विवरण"
                rows={3}
                maxLength={500}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  errors['descriptions.manager'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors['descriptions.manager'] && (
                  <p className="text-red-500 text-sm">{errors['descriptions.manager']}</p>
                )}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.descriptions.manager.length}/500
                </p>
              </div>
            </div>

            {/* Pro Client Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pro Client Only Description
                <span className="text-xs text-gray-500 ml-2">(Overrides Universal)</span>
              </label>
              <textarea
                value={formData.descriptions.proClient}
                onChange={(e) => handleDescriptionChange('proClient', e.target.value)}
                placeholder="Pro Client-specific description. Supports all languages and symbols: પ્રો ક્લાયંટ માટે વિશેષ વર્ણન | प्रो क्लाइंट के लिए विशेष विवरण"
                rows={3}
                maxLength={500}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  errors['descriptions.proClient'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors['descriptions.proClient'] && (
                  <p className="text-red-500 text-sm">{errors['descriptions.proClient']}</p>
                )}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.descriptions.proClient.length}/500
                </p>
              </div>
            </div>

            {/* Client Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Only Description
                <span className="text-xs text-gray-500 ml-2">(Overrides Universal)</span>
              </label>
              <textarea
                value={formData.descriptions.client}
                onChange={(e) => handleDescriptionChange('client', e.target.value)}
                placeholder="Client-specific description. Supports all languages and symbols: ક્લાયંટ માટે વિશેષ વર્ણન | क्लाइंट के लिए विशेष विवरण"
                rows={3}
                maxLength={500}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  errors['descriptions.client'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors['descriptions.client'] && (
                  <p className="text-red-500 text-sm">{errors['descriptions.client']}</p>
                )}
                <p className="text-gray-500 text-sm ml-auto">
                  {formData.descriptions.client.length}/500
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading && <LoadingSpinner size="sm" />}
          {loading 
            ? (isEditing ? 'Updating...' : 'Creating...') 
            : (isEditing ? 'Update Category' : 'Create Category')
          }
        </Button>
      </div>
    </form>
  );
};

export default ExtendedJewelryForm;