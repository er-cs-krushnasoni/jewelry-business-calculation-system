import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

const NewJewelryForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    type: initialData?.type || 'NEW',
    metal: initialData?.metal || '',
    itemCategory: initialData?.itemCategory || '',
    purityPercentage: initialData?.purityPercentage || '',
    buyingFromWholesalerPercentage: initialData?.buyingFromWholesalerPercentage || '',
    sellingPercentage: initialData?.sellingPercentage || '',
    code: initialData?.code || '',
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

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
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

    // NEW jewelry specific validations
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
        if (isNaN(buying) || buying < 1 || buying > 200) {
          newErrors.buyingFromWholesalerPercentage = 'Buying percentage must be between 1 and 200';
        }
      }

      if (!formData.sellingPercentage) {
        newErrors.sellingPercentage = 'Selling percentage is required for NEW jewelry';
      } else {
        const selling = parseFloat(formData.sellingPercentage);
        if (isNaN(selling) || selling < 1 || selling > 200) {
          newErrors.sellingPercentage = 'Selling percentage must be between 1 and 200';
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
        code: formData.code.trim(),
        itemCategory: formData.itemCategory.trim()
      };

      // Convert percentage strings to numbers
      if (formData.purityPercentage) {
        submitData.purityPercentage = parseFloat(formData.purityPercentage);
      }
      if (formData.buyingFromWholesalerPercentage) {
        submitData.buyingFromWholesalerPercentage = parseFloat(formData.buyingFromWholesalerPercentage);
      }
      if (formData.sellingPercentage) {
        submitData.sellingPercentage = parseFloat(formData.sellingPercentage);
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
          } else if (errorMsg.includes('Buying')) {
            serverErrors.buyingFromWholesalerPercentage = errorMsg;
          } else if (errorMsg.includes('Selling')) {
            serverErrors.sellingPercentage = errorMsg;
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
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
        </div>

        {/* NEW Jewelry Specific Fields */}
        {formData.type === 'NEW' && (
          <>
            {/* Item Category and Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Item Category"
                name="itemCategory"
                value={formData.itemCategory}
                onChange={(e) => handleInputChange('itemCategory', e.target.value)}
                placeholder="e.g., Chain, Bracelet, Ring"
                error={errors.itemCategory}
                required
                maxLength={50}
              />

              <Input
                label="Code/Stamp"
                name="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g., ABC123"
                error={errors.code}
                required
                maxLength={20}
              />
            </div>

            {/* Percentages */}
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
                max="200"
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
                max="200"
                step="0.01"
              />
            </div>
          </>
        )}

        {/* Code for non-NEW jewelry */}
        {formData.type !== 'NEW' && (
          <Input
            label="Code/Stamp"
            name="code"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            placeholder="e.g., ABC123"
            error={errors.code}
            required
            maxLength={20}
          />
        )}
      </div>

      {/* Descriptions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Descriptions</h3>
        <p className="text-sm text-gray-600">
          Add descriptions for different user roles. Users will see their role-specific description, or the universal description if no role-specific one is available.
        </p>

        <div className="space-y-4">
          {/* Universal Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universal Description
            </label>
            <textarea
              value={formData.descriptions.universal}
              onChange={(e) => handleDescriptionChange('universal', e.target.value)}
              placeholder="Description visible to all users"
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
                Admin Description
              </label>
              <textarea
                value={formData.descriptions.admin}
                onChange={(e) => handleDescriptionChange('admin', e.target.value)}
                placeholder="Description visible to Admin only"
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
                Manager Description
              </label>
              <textarea
                value={formData.descriptions.manager}
                onChange={(e) => handleDescriptionChange('manager', e.target.value)}
                placeholder="Description visible to Manager only"
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
                Pro Client Description
              </label>
              <textarea
                value={formData.descriptions.proClient}
                onChange={(e) => handleDescriptionChange('proClient', e.target.value)}
                placeholder="Description visible to Pro Client only"
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
                Client Description
              </label>
              <textarea
                value={formData.descriptions.client}
                onChange={(e) => handleDescriptionChange('client', e.target.value)}
                placeholder="Description visible to Client only"
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

export default NewJewelryForm;