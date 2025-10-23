import React, { useState, useEffect, useRef } from 'react';
import { Info, Eye, EyeOff, ChevronDown, Plus, Check, X, Trash2 } from 'lucide-react';
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
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const categoryDropdownRef = useRef(null);

  const [resaleCategoryDropdowns, setResaleCategoryDropdowns] = useState({});
  const [resaleCategorySearchTerms, setResaleCategorySearchTerms] = useState({});
  const resaleCategoryRefs = useRef({});

  const [formData, setFormData] = useState({
    type: initialData?.type || 'NEW',
    metal: initialData?.metal || '',
    code: initialData?.code || '',
    itemCategory: initialData?.itemCategory || '',
    purityPercentage: initialData?.purityPercentage || '',
    buyingFromWholesalerPercentage: initialData?.buyingFromWholesalerPercentage || '',
    wholesalerLabourPerGram: initialData?.wholesalerLabourPerGram || '',
    sellingPercentage: initialData?.sellingPercentage || '',
    truePurityPercentage: initialData?.truePurityPercentage || '',
    scrapBuyOwnPercentage: initialData?.scrapBuyOwnPercentage || '',
    scrapBuyOtherPercentage: initialData?.scrapBuyOtherPercentage || '',
    resaleEnabled: initialData?.resaleEnabled || false,
    resaleCategories: initialData?.resaleCategories?.map(cat => ({
      itemCategory: cat.itemCategory || '',
      directResalePercentage: cat.directResalePercentage || '',
      buyingFromWholesalerPercentage: cat.buyingFromWholesalerPercentage || '',
      wholesalerLabourPerGram: cat.wholesalerLabourPerGram || '',
      polishRepairEnabled: cat.polishRepairEnabled || false,
      polishRepairResalePercentage: cat.polishRepairResalePercentage || '',
      polishRepairCostPercentage: cat.polishRepairCostPercentage || '',
      polishRepairLabourPerGram: cat.polishRepairLabourPerGram || ''
    })) || [],
    descriptions: {
      universal: initialData?.descriptions?.universal || '',
      admin: initialData?.descriptions?.admin || '',
      manager: initialData?.descriptions?.manager || '',
      proClient: initialData?.descriptions?.proClient || '',
      client: initialData?.descriptions?.client || ''
    }
  });

  useEffect(() => {
    if (formData.metal && (formData.type === 'NEW' || formData.resaleEnabled)) {
      loadAvailableCategories();
    }
  }, [formData.metal, formData.type, formData.resaleEnabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      
      Object.keys(resaleCategoryRefs.current).forEach(key => {
        if (resaleCategoryRefs.current[key] && !resaleCategoryRefs.current[key].contains(event.target)) {
          setResaleCategoryDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAvailableCategories = async () => {
    try {
      setLoadingCategories(true);
      const queryParams = new URLSearchParams();
      if (formData.metal) queryParams.append('metal', formData.metal);
      
      const response = await fetch(`/api/categories/item-categories?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAvailableCategories(data.data || []);
      }
    } catch (error) {
      console.error('Load categories error:', error);
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, itemCategory: category }));
    setCategorySearchTerm('');
    setShowCategoryDropdown(false);
    if (errors.itemCategory) {
      setErrors(prev => ({ ...prev, itemCategory: null }));
    }
  };

  const handleCategoryInputChange = (value) => {
    setFormData(prev => ({ ...prev, itemCategory: value }));
    setCategorySearchTerm(value);
    setShowCategoryDropdown(true);
    if (errors.itemCategory) {
      setErrors(prev => ({ ...prev, itemCategory: null }));
    }
  };

  const getFilteredCategories = (searchTerm = categorySearchTerm) => {
    if (!searchTerm) return availableCategories;
    const searchLower = searchTerm.toLowerCase();
    return availableCategories.filter(cat => cat.toLowerCase().includes(searchLower));
  };

  const isCreatingNewCategory = (categoryValue = formData.itemCategory) => {
    if (!categoryValue.trim()) return false;
    return !availableCategories.some(cat => cat.toLowerCase() === categoryValue.toLowerCase());
  };

  const addResaleCategory = () => {
    setFormData(prev => ({
      ...prev,
      resaleCategories: [...prev.resaleCategories, {
        itemCategory: '',
        directResalePercentage: '',
        buyingFromWholesalerPercentage: '',
        wholesalerLabourPerGram: '',
        polishRepairEnabled: false,
        polishRepairResalePercentage: '',
        polishRepairCostPercentage: '',
        polishRepairLabourPerGram: ''
      }]
    }));
  };

  const removeResaleCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      resaleCategories: prev.resaleCategories.filter((_, i) => i !== index)
    }));
    
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`resaleCategories.${index}`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
    
    setResaleCategoryDropdowns(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setResaleCategorySearchTerms(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const updateResaleCategory = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      resaleCategories: prev.resaleCategories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
    
    if (field === 'itemCategory') {
      setResaleCategorySearchTerms(prev => ({ ...prev, [index]: value }));
      setResaleCategoryDropdowns(prev => ({ ...prev, [index]: true }));
    }
    
    if (field === 'polishRepairEnabled' && !value) {
      setFormData(prev => ({
        ...prev,
        resaleCategories: prev.resaleCategories.map((cat, i) => 
          i === index ? { 
            ...cat, 
            polishRepairEnabled: false,
            polishRepairResalePercentage: '',
            polishRepairCostPercentage: '',
            polishRepairLabourPerGram: ''
          } : cat
        )
      }));
      
      const errorKey1 = `resaleCategories.${index}.polishRepairResalePercentage`;
      const errorKey2 = `resaleCategories.${index}.polishRepairCostPercentage`;
      const errorKey3 = `resaleCategories.${index}.polishRepairLabourPerGram`;
      if (errors[errorKey1] || errors[errorKey2] || errors[errorKey3]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey1];
          delete newErrors[errorKey2];
          delete newErrors[errorKey3];
          return newErrors;
        });
      }
    }
    
    const errorKey = `resaleCategories.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  const handleResaleCategorySelect = (index, category) => {
    updateResaleCategory(index, 'itemCategory', category);
    setResaleCategorySearchTerms(prev => ({ ...prev, [index]: '' }));
    setResaleCategoryDropdowns(prev => ({ ...prev, [index]: false }));
  };

  const handleDescriptionChange = (role, value) => {
    setFormData(prev => ({
      ...prev,
      descriptions: { ...prev.descriptions, [role]: value }
    }));
    if (errors[`descriptions.${role}`]) {
      setErrors(prev => ({ ...prev, [`descriptions.${role}`]: null }));
    }
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      itemCategory: '',
      purityPercentage: '',
      sellingPercentage: '',
      wholesalerLabourPerGram: '',
      truePurityPercentage: '',
      scrapBuyOwnPercentage: '',
      scrapBuyOtherPercentage: '',
      resaleEnabled: false,
      resaleCategories: [],
      buyingFromWholesalerPercentage: ''
    }));
    setErrors({});
  };

  const handleResaleToggle = (enabled) => {
    setFormData(prev => ({
      ...prev,
      resaleEnabled: enabled,
      resaleCategories: enabled && prev.resaleCategories.length === 0 
        ? [{
            itemCategory: '',
            directResalePercentage: '',
            buyingFromWholesalerPercentage: '',
            wholesalerLabourPerGram: '',
            polishRepairEnabled: false,
            polishRepairResalePercentage: '',
            polishRepairCostPercentage: '',
            polishRepairLabourPerGram: ''
          }]
        : enabled ? prev.resaleCategories : []
    }));
    if (!enabled) {
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('resaleCategories')) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = t('category.form.typeRequired');
    if (!formData.metal) newErrors.metal = t('category.form.metalRequired');
    if (!formData.code.trim()) {
      newErrors.code = t('category.form.codeRequired');
    } else if (formData.code.length > 100) {
      newErrors.code = t('category.form.codeMaxLength');
    }

    if (formData.type === 'NEW') {
      if (!formData.itemCategory.trim()) {
        newErrors.itemCategory = t('category.form.itemCategoryRequired');
      } else if (formData.itemCategory.length > 100) {
        newErrors.itemCategory = t('category.form.itemCategoryMaxLength');
      }
      if (!formData.purityPercentage) {
        newErrors.purityPercentage = t('category.form.purityRequired');
      } else {
        const purity = parseFloat(formData.purityPercentage);
        if (isNaN(purity) || purity < 1 || purity > 100) {
          newErrors.purityPercentage = t('category.form.purityRange');
        }
      }
      if (!formData.buyingFromWholesalerPercentage) {
        newErrors.buyingFromWholesalerPercentage = t('category.form.buyingPercentageRequired');
      } else {
        const buying = parseFloat(formData.buyingFromWholesalerPercentage);
        if (isNaN(buying) || buying < 1) {
          newErrors.buyingFromWholesalerPercentage = t('category.form.buyingPercentageMin');
        }
      }
      if (formData.wholesalerLabourPerGram === '') {
        newErrors.wholesalerLabourPerGram = t('category.form.labourRequired');
      } else {
        const labour = parseFloat(formData.wholesalerLabourPerGram);
        if (isNaN(labour) || labour < 0) {
          newErrors.wholesalerLabourPerGram = t('category.form.labourMin');
        }
      }
      if (!formData.sellingPercentage) {
        newErrors.sellingPercentage = t('category.form.sellingPercentageRequired');
      } else {
        const selling = parseFloat(formData.sellingPercentage);
        if (isNaN(selling) || selling < 1) {
          newErrors.sellingPercentage = t('category.form.sellingPercentageMin');
        }
      }
    }

    if (formData.type === 'OLD') {
      if (!formData.truePurityPercentage) {
        newErrors.truePurityPercentage = t('category.form.truePurityRequired');
      } else {
        const purity = parseFloat(formData.truePurityPercentage);
        if (isNaN(purity) || purity < 1 || purity > 100) {
          newErrors.truePurityPercentage = t('category.form.truePurityRange');
        }
      }
      if (!formData.scrapBuyOwnPercentage) {
        newErrors.scrapBuyOwnPercentage = t('category.form.scrapBuyOwnRequired');
      } else {
        const scrapOwn = parseFloat(formData.scrapBuyOwnPercentage);
        if (isNaN(scrapOwn) || scrapOwn < 1) {
          newErrors.scrapBuyOwnPercentage = t('category.form.scrapBuyOwnMin');
        }
      }
      if (!formData.scrapBuyOtherPercentage) {
        newErrors.scrapBuyOtherPercentage = t('category.form.scrapBuyOtherRequired');
      } else {
        const scrapOther = parseFloat(formData.scrapBuyOtherPercentage);
        if (isNaN(scrapOther) || scrapOther < 1) {
          newErrors.scrapBuyOtherPercentage = t('category.form.scrapBuyOtherMin');
        }
      }

      if (formData.resaleEnabled) {
        if (!formData.resaleCategories || formData.resaleCategories.length === 0) {
          newErrors.resaleCategories = t('category.form.resaleCategoryRequired');
        } else {
          const categoryNames = formData.resaleCategories.map(cat => cat.itemCategory.trim().toLowerCase());
          const uniqueNames = new Set(categoryNames.filter(name => name));
          
          if (categoryNames.filter(name => name).length !== uniqueNames.size) {
            newErrors.resaleCategories = t('category.form.duplicateCategoryNames');
          }

          formData.resaleCategories.forEach((cat, index) => {
            if (!cat.itemCategory.trim()) {
              newErrors[`resaleCategories.${index}.itemCategory`] = t('category.form.categoryNameRequired');
            }
            if (!cat.directResalePercentage) {
              newErrors[`resaleCategories.${index}.directResalePercentage`] = t('category.form.directResaleRequired');
            } else if (parseFloat(cat.directResalePercentage) < 1) {
              newErrors[`resaleCategories.${index}.directResalePercentage`] = t('category.form.directResaleMin');
            }
            if (!cat.buyingFromWholesalerPercentage) {
              newErrors[`resaleCategories.${index}.buyingFromWholesalerPercentage`] = t('category.form.directResaleRequired');
            } else if (parseFloat(cat.buyingFromWholesalerPercentage) < 1) {
              newErrors[`resaleCategories.${index}.buyingFromWholesalerPercentage`] = t('category.form.directResaleMin');
            }
            
            if (cat.wholesalerLabourPerGram === '') {
              newErrors[`resaleCategories.${index}.wholesalerLabourPerGram`] = t('category.form.directResaleRequired');
            } else if (parseFloat(cat.wholesalerLabourPerGram) < 0) {
              newErrors[`resaleCategories.${index}.wholesalerLabourPerGram`] = t('category.form.polishLabourMin');
            }
            
            if (cat.polishRepairEnabled) {
              if (!cat.polishRepairResalePercentage) {
                newErrors[`resaleCategories.${index}.polishRepairResalePercentage`] = t('category.form.polishResaleRequired');
              } else if (parseFloat(cat.polishRepairResalePercentage) < 1) {
                newErrors[`resaleCategories.${index}.polishRepairResalePercentage`] = t('category.form.polishResaleMin');
              }
              
              if (cat.polishRepairCostPercentage === '') {
                newErrors[`resaleCategories.${index}.polishRepairCostPercentage`] = t('category.form.polishCostRequired');
              } else {
                const cost = parseFloat(cat.polishRepairCostPercentage);
                if (isNaN(cost) || cost < 0 || cost > 50) {
                  newErrors[`resaleCategories.${index}.polishRepairCostPercentage`] = t('category.form.polishCostRange');
                }
              }
              
              if (cat.polishRepairLabourPerGram === '') {
                newErrors[`resaleCategories.${index}.polishRepairLabourPerGram`] = t('category.form.polishLabourRequired');
              } else if (parseFloat(cat.polishRepairLabourPerGram) < 0) {
                newErrors[`resaleCategories.${index}.polishRepairLabourPerGram`] = t('category.form.polishLabourMin');
              }
            }
          });
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const submitData = { ...formData, code: formData.code.trim() };

      if (formData.type === 'NEW') {
        submitData.itemCategory = formData.itemCategory.trim();
        submitData.purityPercentage = parseFloat(formData.purityPercentage);
        submitData.buyingFromWholesalerPercentage = parseFloat(formData.buyingFromWholesalerPercentage);
        submitData.wholesalerLabourPerGram = parseFloat(formData.wholesalerLabourPerGram);
        submitData.sellingPercentage = parseFloat(formData.sellingPercentage);
        
        delete submitData.truePurityPercentage;
        delete submitData.scrapBuyOwnPercentage;
        delete submitData.scrapBuyOtherPercentage;
        delete submitData.resaleEnabled;
        delete submitData.resaleCategories;
      } else if (formData.type === 'OLD') {
        submitData.truePurityPercentage = parseFloat(formData.truePurityPercentage);
        submitData.scrapBuyOwnPercentage = parseFloat(formData.scrapBuyOwnPercentage);
        submitData.scrapBuyOtherPercentage = parseFloat(formData.scrapBuyOtherPercentage);
        submitData.resaleEnabled = Boolean(formData.resaleEnabled);
        
        if (formData.resaleEnabled) {
          submitData.resaleCategories = formData.resaleCategories.map(cat => ({
            itemCategory: cat.itemCategory.trim(),
            directResalePercentage: parseFloat(cat.directResalePercentage),
            buyingFromWholesalerPercentage: parseFloat(cat.buyingFromWholesalerPercentage),
            wholesalerLabourPerGram: parseFloat(cat.wholesalerLabourPerGram),
            polishRepairEnabled: Boolean(cat.polishRepairEnabled),
            ...(cat.polishRepairEnabled && {
              polishRepairResalePercentage: parseFloat(cat.polishRepairResalePercentage),
              polishRepairCostPercentage: parseFloat(cat.polishRepairCostPercentage),
              polishRepairLabourPerGram: parseFloat(cat.polishRepairLabourPerGram)
            })
          }));
        } else {
          submitData.resaleCategories = [];
        }
        
        delete submitData.itemCategory;
        delete submitData.purityPercentage;
        delete submitData.sellingPercentage;
        delete submitData.buyingFromWholesalerPercentage;
        delete submitData.wholesalerLabourPerGram;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (error.response?.data?.errors) {
        const serverErrors = {};
        if (Array.isArray(error.response.data.errors)) {
          const errorMessages = error.response.data.errors
            .map(err => {
              if (typeof err === 'string') return err;
              if (err.msg) return err.msg;
              if (err.message) return err.message;
              return JSON.stringify(err);
            })
            .join(', ');
          serverErrors.general = errorMessages;
        } else {
          serverErrors.general = t('category.form.validationFailed');
        }
        setErrors(serverErrors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = getFilteredCategories();
  const showCreateNewOption = formData.itemCategory.trim() && isCreatingNewCategory();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">{t('category.form.basicInfo')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.form.type')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isEditing}
            >
              <option value="">{t('category.form.selectType')}</option>
              <option value="NEW">{t('category.management.types.new')}</option>
              <option value="OLD">{t('category.management.types.old')}</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.form.metal')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.metal}
              onChange={(e) => handleInputChange('metal', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.metal ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">{t('category.form.selectMetal')}</option>
              <option value="GOLD">{t('category.management.metals.gold')}</option>
              <option value="SILVER">{t('category.management.metals.silver')}</option>
            </select>
            {errors.metal && <p className="text-red-500 text-sm mt-1">{errors.metal}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.form.codeStamp')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder={t('category.form.codePlaceholder')}
              maxLength={100}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>
        </div>

        {formData.type === 'NEW' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.form.itemCategory')} <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={formData.itemCategory}
                  onChange={(e) => handleCategoryInputChange(e.target.value)}
                  onFocus={() => setShowCategoryDropdown(true)}
                  placeholder={t('category.form.selectCategoryPlaceholder')}
                  className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.itemCategory ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!formData.metal}
                  maxLength={100}
                />
                <ChevronDown 
                  size={20} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {showCategoryDropdown && formData.metal && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingCategories ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">{t('category.form.loading')}</p>
                    </div>
                  ) : (
                    <>
                      {showCreateNewOption && (
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(formData.itemCategory)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 bg-blue-50"
                        >
                          <Plus size={16} className="text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-blue-700">
                              {t('category.form.createNewCategory')}
                            </div>
                            <div className="text-xs text-blue-600 truncate">
                              "{formData.itemCategory}"
                            </div>
                          </div>
                        </button>
                      )}
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleCategorySelect(category)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                          >
                            <span className="text-sm text-gray-900">{category}</span>
                            {formData.itemCategory === category && (
                              <Check size={16} className="text-green-600" />
                            )}
                          </button>
                        ))
                      ) : !showCreateNewOption ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          {t('category.form.noCategoriesFound')}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
              {!formData.metal && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('category.form.selectMetalFirst')}
                </p>
              )}
            </div>
            {errors.itemCategory && (
              <p className="text-red-500 text-sm mt-1">{errors.itemCategory}</p>
            )}
          </div>
        )}

        {formData.type === 'NEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category.form.purity')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.purityPercentage}
                onChange={(e) => handleInputChange('purityPercentage', e.target.value)}
                placeholder={t('category.form.purityPlaceholder')}
                min="1"
                max="100"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.purityPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.purityPercentage && (
                <p className="text-red-500 text-sm mt-1">{errors.purityPercentage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category.form.buyingFromWholesaler')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.buyingFromWholesalerPercentage}
                onChange={(e) => handleInputChange('buyingFromWholesalerPercentage', e.target.value)}
                placeholder={t('category.form.buyingFromWholesalerPlaceholder')}
                min="1"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.buyingFromWholesalerPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.buyingFromWholesalerPercentage && (
                <p className="text-red-500 text-sm mt-1">{errors.buyingFromWholesalerPercentage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category.form.wholesalerLabour')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.wholesalerLabourPerGram}
                onChange={(e) => handleInputChange('wholesalerLabourPerGram', e.target.value)}
                placeholder={t('category.form.wholesalerLabourPlaceholder')}
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.wholesalerLabourPerGram ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">{t('category.form.labourNote')}</p>
              {errors.wholesalerLabourPerGram && (
                <p className="text-red-500 text-sm mt-1">{errors.wholesalerLabourPerGram}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category.form.selling')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.sellingPercentage}
                onChange={(e) => handleInputChange('sellingPercentage', e.target.value)}
                placeholder={t('category.form.sellingPlaceholder')}
                min="1"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sellingPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.sellingPercentage && (
                <p className="text-red-500 text-sm mt-1">{errors.sellingPercentage}</p>
              )}
            </div>
          </div>
        )}

        {formData.type === 'OLD' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('category.form.truePurity')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.truePurityPercentage}
                  onChange={(e) => handleInputChange('truePurityPercentage', e.target.value)}
                  placeholder={t('category.form.truePurityPlaceholder')}
                  min="1"
                  max="100"
                  step="0.01"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.truePurityPercentage ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.truePurityPercentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.truePurityPercentage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('category.form.scrapBuyOwn')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.scrapBuyOwnPercentage}
                  onChange={(e) => handleInputChange('scrapBuyOwnPercentage', e.target.value)}
                  placeholder={t('category.form.scrapBuyOwnPlaceholder')}
                  min="1"
                  step="0.01"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.scrapBuyOwnPercentage ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.scrapBuyOwnPercentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.scrapBuyOwnPercentage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('category.form.scrapBuyOther')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.scrapBuyOtherPercentage}
                  onChange={(e) => handleInputChange('scrapBuyOtherPercentage', e.target.value)}
                  placeholder={t('category.form.scrapBuyOtherPlaceholder')}
                  min="1"
                  step="0.01"
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.scrapBuyOtherPercentage ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.scrapBuyOtherPercentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.scrapBuyOtherPercentage}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('category.form.resaleOptions')}
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleResaleToggle(!formData.resaleEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.resaleEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.resaleEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {formData.resaleEnabled ? t('category.form.enabled') : t('category.form.disabled')}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {t('category.form.resaleNote')}
              </p>
            </div>

            {formData.resaleEnabled && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-900">
                    {t('category.form.resaleCategories')} <span className="text-red-500">*</span>
                  </h4>
                </div>

                {formData.resaleCategories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">{t('category.form.noResaleCategories')}</p>
                    <p className="text-xs mt-1">{t('category.form.addFirstResaleCategory')}</p>
                  </div>
                )}

                {formData.resaleCategories.map((category, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-blue-300 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">
                        {t('category.form.categoryNumber', { number: index + 1 })}
                      </h5>
                      {formData.resaleCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResaleCategory(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title={t('category.form.removeCategory')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('category.form.categoryName')} <span className="text-red-500">*</span>
                      </label>
                      <div 
                        className="relative" 
                        ref={(el) => {
                          if (el) resaleCategoryRefs.current[index] = el;
                        }}
                      >
                        <div className="relative">
                          <input
                            type="text"
                            value={category.itemCategory}
                            onChange={(e) => updateResaleCategory(index, 'itemCategory', e.target.value)}
                            onFocus={() => setResaleCategoryDropdowns(prev => ({ ...prev, [index]: true }))}
                            placeholder={t('category.form.selectCategoryPlaceholder')}
                            maxLength={100}
                            className={`w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[`resaleCategories.${index}.itemCategory`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={!formData.metal}
                          />
                          <ChevronDown 
                            size={20} 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>

                        {resaleCategoryDropdowns[index] && formData.metal && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {loadingCategories ? (
                              <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">{t('category.form.loading')}</p>
                              </div>
                            ) : (
                              <>
                                {category.itemCategory.trim() && isCreatingNewCategory(category.itemCategory) && (
                                  <button
                                    type="button"
                                    onClick={() => handleResaleCategorySelect(index, category.itemCategory)}
                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 bg-blue-50"
                                  >
                                    <Plus size={16} className="text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-blue-700">
                                        {t('category.form.createNewCategory')}
                                      </div>
                                      <div className="text-xs text-blue-600 truncate">
                                        "{category.itemCategory}"
                                      </div>
                                    </div>
                                  </button>
                                )}
                                {getFilteredCategories(resaleCategorySearchTerms[index] || category.itemCategory).length > 0 ? (
                                  getFilteredCategories(resaleCategorySearchTerms[index] || category.itemCategory).map((cat, catIndex) => (
                                    <button
                                      key={catIndex}
                                      type="button"
                                      onClick={() => handleResaleCategorySelect(index, cat)}
                                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                                    >
                                      <span className="text-sm text-gray-900">{cat}</span>
                                      {category.itemCategory === cat && (
                                        <Check size={16} className="text-green-600" />
                                      )}
                                    </button>
                                  ))
                                ) : !category.itemCategory.trim() || !isCreatingNewCategory(category.itemCategory) ? (
                                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    {t('category.form.noCategoriesFound')}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {errors[`resaleCategories.${index}.itemCategory`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.itemCategory`]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('category.form.directResale')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={category.directResalePercentage}
                          onChange={(e) => updateResaleCategory(index, 'directResalePercentage', e.target.value)}
                          placeholder={t('category.form.directResalePlaceholder')}
                          min="1"
                          step="0.01"
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`resaleCategories.${index}.directResalePercentage`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`resaleCategories.${index}.directResalePercentage`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.directResalePercentage`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('category.form.buyingFromWholesaler')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={category.buyingFromWholesalerPercentage}
                          onChange={(e) => updateResaleCategory(index, 'buyingFromWholesalerPercentage', e.target.value)}
                          placeholder={t('category.form.buyingFromWholesalerPlaceholder')}
                          min="1"
                          step="0.01"
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`resaleCategories.${index}.buyingFromWholesalerPercentage`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`resaleCategories.${index}.buyingFromWholesalerPercentage`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.buyingFromWholesalerPercentage`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('category.form.wholesalerLabour')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={category.wholesalerLabourPerGram}
                          onChange={(e) => updateResaleCategory(index, 'wholesalerLabourPerGram', e.target.value)}
                          placeholder={t('category.form.wholesalerLabourPlaceholder')}
                          min="0"
                          step="0.01"
                          className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`resaleCategories.${index}.wholesalerLabourPerGram`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('category.form.labourNote')}</p>
                        {errors[`resaleCategories.${index}.wholesalerLabourPerGram`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.wholesalerLabourPerGram`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          {t('category.form.polishRepair')}
                        </label>
                        <button
                          type="button"
                          onClick={() => updateResaleCategory(index, 'polishRepairEnabled', !category.polishRepairEnabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            category.polishRepairEnabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              category.polishRepairEnabled ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {category.polishRepairEnabled && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('category.form.polishResale')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={category.polishRepairResalePercentage}
                              onChange={(e) => updateResaleCategory(index, 'polishRepairResalePercentage', e.target.value)}
                              placeholder={t('category.form.polishResalePlaceholder')}
                              min="1"
                              step="0.01"
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`resaleCategories.${index}.polishRepairResalePercentage`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`resaleCategories.${index}.polishRepairResalePercentage`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.polishRepairResalePercentage`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('category.form.polishCost')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={category.polishRepairCostPercentage}
                              onChange={(e) => updateResaleCategory(index, 'polishRepairCostPercentage', e.target.value)}
                              placeholder={t('category.form.polishCostPlaceholder')}
                              min="0"
                              max="50"
                              step="0.01"
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`resaleCategories.${index}.polishRepairCostPercentage`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`resaleCategories.${index}.polishRepairCostPercentage`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.polishRepairCostPercentage`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('category.form.polishLabour')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={category.polishRepairLabourPerGram}
                              onChange={(e) => updateResaleCategory(index, 'polishRepairLabourPerGram', e.target.value)}
                              placeholder={t('category.form.polishLabourPlaceholder')}
                              min="0"
                              step="0.01"
                              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors[`resaleCategories.${index}.polishRepairLabourPerGram`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            <p className="text-xs text-gray-500 mt-1">{t('category.form.labourNote')}</p>
                            {errors[`resaleCategories.${index}.polishRepairLabourPerGram`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`resaleCategories.${index}.polishRepairLabourPerGram`]}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {!category.polishRepairEnabled && (
                        <p className="text-xs text-gray-500 mt-2">
                          {t('category.form.enablePolishNote')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addResaleCategory}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  {t('category.form.addCategory')}
                </button>

                {errors.resaleCategories && (
                  <p className="text-red-700 text-sm font-medium">{errors.resaleCategories}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{t('category.form.descriptions')}</h3>
          <button
            type="button"
            onClick={() => setShowDescriptionHelp(!showDescriptionHelp)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showDescriptionHelp ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDescriptionHelp ? t('category.form.hideHelp') : t('category.form.showHelp')}
          </button>
        </div>

        {showDescriptionHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-800">
                <h4 className="font-medium">{t('category.form.descriptionHelp.title')}</h4>
                <ul className="space-y-1">
                  <li><strong>1.</strong> {t('category.form.descriptionHelp.universal')}</li>
                  <li><strong>2.</strong> {t('category.form.descriptionHelp.roleBased')}</li>
                  <li><strong>3.</strong> {t('category.form.descriptionHelp.multiLang')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.form.universalDescription')}
              <span className="text-xs text-gray-500 ml-2">{t('category.form.fallbackAllRoles')}</span>
            </label>
            <textarea
              value={formData.descriptions.universal}
              onChange={(e) => handleDescriptionChange('universal', e.target.value)}
              placeholder={t('category.form.universalPlaceholder')}
              rows={3}
              maxLength={500}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical border-gray-300"
            />
            <p className="text-gray-500 text-sm mt-1 text-right">
              {t('category.form.characterCount', { current: formData.descriptions.universal.length, max: 500 })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'admin', label: t('category.form.adminOnly') },
              { key: 'manager', label: t('category.form.managerOnly') },
              { key: 'proClient', label: t('category.form.proClientOnly') },
              { key: 'client', label: t('category.form.clientOnly') }
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                  <span className="text-xs text-gray-500 ml-2">{t('category.form.overridesUniversal')}</span>
                </label>
                <textarea
                  value={formData.descriptions[key]}
                  onChange={(e) => handleDescriptionChange(key, e.target.value)}
                  placeholder={t('category.form.roleSpecificPlaceholder', { role: label })}
                  rows={3}
                  maxLength={500}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical border-gray-300"
                />
                <p className="text-gray-500 text-sm mt-1 text-right">
                  {t('category.form.characterCount', { current: formData.descriptions[key].length, max: 500 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {t('category.form.cancel')}
        </button>
        <div className="flex flex-col items-end gap-2">
          {errors.resaleCategories && formData.resaleEnabled && (
            <p className="text-red-700 text-sm font-medium">{errors.resaleCategories}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading 
              ? (isEditing ? t('category.form.updating') : t('category.form.creating')) 
              : (isEditing ? t('category.form.updateCategory') : t('category.form.createCategory'))
            }
          </button>
        </div>
      </div>
    </form>
  );
};

export default ExtendedJewelryForm;