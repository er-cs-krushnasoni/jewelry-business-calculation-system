import React, { useState, useEffect, useRef } from 'react';
import { Info, Eye, EyeOff, ChevronDown, Plus, Check, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

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
    purityPercentage: initialData?.purityPercentage ?? '',
    buyingFromWholesalerPercentage: initialData?.buyingFromWholesalerPercentage ?? '',
    wholesalerLabourPerGram: initialData?.wholesalerLabourPerGram ?? '',
    sellingPercentage: initialData?.sellingPercentage ?? '',
    truePurityPercentage: initialData?.truePurityPercentage ?? '',
    scrapBuyOwnPercentage: initialData?.scrapBuyOwnPercentage ?? '',
    scrapBuyOtherPercentage: initialData?.scrapBuyOtherPercentage ?? '',
    resaleEnabled: initialData?.resaleEnabled || false,
    resaleCategories: initialData?.resaleCategories?.map(cat => ({
      itemCategory: cat.itemCategory || '',
      directResalePercentage: cat.directResalePercentage ?? '',
      directResaleRateType: cat.directResaleRateType || 'SELLING',
      buyingFromWholesalerPercentage: cat.buyingFromWholesalerPercentage ?? '',
      wholesalerLabourPerGram: cat.wholesalerLabourPerGram ?? '',
      polishRepairEnabled: cat.polishRepairEnabled || false,
      polishRepairResalePercentage: cat.polishRepairResalePercentage ?? '',
      polishRepairRateType: cat.polishRepairRateType || 'SELLING',
      polishRepairCostPercentage: cat.polishRepairCostPercentage ?? '',
      polishRepairLabourPerGram: cat.polishRepairLabourPerGram ?? ''
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
      
      const response = await api.get(`/calculator/new-jewelry/item-categories?${queryParams.toString()}`);
      
      if (response.data.success) {
        const categoryNames = response.data.data.map(cat => cat.name);
        setAvailableCategories(categoryNames);
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
        directResaleRateType: 'SELLING',
        buyingFromWholesalerPercentage: '',
        wholesalerLabourPerGram: '',
        polishRepairEnabled: false,
        polishRepairResalePercentage: '',
        polishRepairRateType: 'SELLING',
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
            polishRepairRateType: 'SELLING',
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
      if (formData.wholesalerLabourPerGram === '' || formData.wholesalerLabourPerGram === null || formData.wholesalerLabourPerGram === undefined) {
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
            
            if (cat.wholesalerLabourPerGram === '' || cat.wholesalerLabourPerGram === null || cat.wholesalerLabourPerGram === undefined) {
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
              
              if (cat.polishRepairCostPercentage === '' || cat.polishRepairCostPercentage === null || cat.polishRepairCostPercentage === undefined) {
                newErrors[`resaleCategories.${index}.polishRepairCostPercentage`] = t('category.form.polishCostRequired');
              } else {
                const cost = parseFloat(cat.polishRepairCostPercentage);
                if (isNaN(cost) || cost < 0 || cost > 50) {
                  newErrors[`resaleCategories.${index}.polishRepairCostPercentage`] = t('category.form.polishCostRange');
                }
              }
              
              if (cat.polishRepairLabourPerGram === '' || cat.polishRepairLabourPerGram === null || cat.polishRepairLabourPerGram === undefined) {
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
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      {/* Error Message */}
      {errors.general && (
        <div className="glass-effect bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-slide-up shadow-luxury">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">{errors.general}</p>
        </div>
      )}
  
      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-gold-200 dark:border-gold-800/30">
          <div className="w-1 h-8 bg-gradient-gold rounded-full shadow-gold"></div>
          <h3 className="text-xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            {t('category.form.basicInfo')}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Type Field */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
      {t('category.form.type')} <span className="text-red-500 dark:text-red-400">*</span>
    </label>
    <div className="relative">
      <select
        value={formData.type}
        onChange={(e) => handleTypeChange(e.target.value)}
        className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
          text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 
          focus:border-transparent transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
          ${errors.type ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}
          ${isEditing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={isEditing}
      >
        <option value="">{t('category.form.selectType')}</option>
        <option value="NEW">{t('category.management.types.new')}</option>
        <option value="OLD">{t('category.management.types.old')}</option>
      </select>
      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={20} />
    </div>
    {errors.type && (
      <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.type}</p>
    )}
  </div>

  {/* Metal Field */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
      {t('category.form.metal')} <span className="text-red-500 dark:text-red-400">*</span>
    </label>
    <div className="relative">
      <select
        value={formData.metal}
        onChange={(e) => handleInputChange('metal', e.target.value)}
        className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
          text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 
          focus:border-transparent transition-all duration-300 shadow-luxury hover:shadow-luxury-lg cursor-pointer
          ${errors.metal ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
      >
        <option value="">{t('category.form.selectMetal')}</option>
        <option value="GOLD">{t('category.management.metals.gold')}</option>
        <option value="SILVER">{t('category.management.metals.silver')}</option>
      </select>
      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={20} />
    </div>
    {errors.metal && (
      <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.metal}</p>
    )}
  </div>
</div>

{/* Item Category Field (NEW type only) - NOW BEFORE CODE */}
{formData.type === 'NEW' && (
  <div className="space-y-2 animate-slide-up">
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
      {t('category.form.itemCategory')} <span className="text-red-500 dark:text-red-400">*</span>
    </label>
    <div className="relative" ref={categoryDropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={formData.itemCategory}
          onChange={(e) => handleCategoryInputChange(e.target.value)}
          onFocus={() => setShowCategoryDropdown(true)}
          placeholder={t('category.form.selectCategoryPlaceholder')}
          className={`w-full glass-effect border-2 rounded-xl px-4 py-3 pr-12 bg-white dark:bg-slate-800 
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
            transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
            ${errors.itemCategory ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}
            ${!formData.metal ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!formData.metal}
          maxLength={100}
        />
        <ChevronDown 
          size={20} 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
      </div>

      {showCategoryDropdown && formData.metal && (
        <div className="absolute z-50 w-full mt-2 glass-effect bg-white dark:bg-slate-800 border-2 border-gold-200 dark:border-slate-700 rounded-xl shadow-luxury-lg max-h-80 overflow-auto animate-scale-in">
          {loadingCategories ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-200 dark:border-slate-700 border-t-gold-600 dark:border-t-gold-500 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">{t('category.form.loading')}</p>
            </div>
          ) : (
            <>
              {showCreateNewOption && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect(formData.itemCategory)}
                  className="w-full px-5 py-4 text-left hover:bg-gold-50 dark:hover:bg-slate-700/50 
                    flex items-center gap-3 border-b-2 border-gold-100 dark:border-slate-700 
                    bg-gold-50/50 dark:bg-slate-700/30 transition-all duration-200 group"
                >
                  <Plus size={18} className="text-gold-600 dark:text-gold-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gold-700 dark:text-gold-300">
                      {t('category.form.createNewCategory')}
                    </div>
                    <div className="text-xs text-gold-600 dark:text-gold-400 truncate mt-1">
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
                    className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 
                      flex items-center justify-between group transition-all duration-200"
                  >
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                      {category}
                    </span>
                    {formData.itemCategory === category && (
                      <Check size={18} className="text-green-600 dark:text-green-400 animate-scale-in" />
                    )}
                  </button>
                ))
              ) : !showCreateNewOption ? (
                <div className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
                  {t('category.form.noCategoriesFound')}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
      {!formData.metal && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
          {t('category.form.selectMetalFirst')}
        </p>
      )}
    </div>
    {errors.itemCategory && (
      <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.itemCategory}</p>
    )}
  </div>
)}

{/* Code Field - NOW AFTER CATEGORY */}
<div className="space-y-2">
  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
    {t('category.form.codeStamp')} <span className="text-red-500 dark:text-red-400">*</span>
  </label>
  <input
    type="text"
    value={formData.code}
    onChange={(e) => handleInputChange('code', e.target.value)}
    placeholder={t('category.form.codePlaceholder')}
    maxLength={100}
    className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
      text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
      focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
      transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
      ${errors.code ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
  />
  {errors.code && (
    <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.code}</p>
  )}
</div>
  
        {/* NEW Type Fields */}
        {formData.type === 'NEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {/* Purity */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('category.form.purity')} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.purityPercentage}
                onChange={(e) => handleInputChange('purityPercentage', e.target.value)}
                placeholder={t('category.form.purityPlaceholder')}
                min="1"
                max="100"
                step="0.01"
                className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                  transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                  ${errors.purityPercentage ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
              />
              {errors.purityPercentage && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.purityPercentage}</p>
              )}
            </div>
  
            {/* Buying From Wholesaler */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('category.form.buyingFromWholesaler')} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.buyingFromWholesalerPercentage}
                onChange={(e) => handleInputChange('buyingFromWholesalerPercentage', e.target.value)}
                placeholder={t('category.form.buyingFromWholesalerPlaceholder')}
                min="1"
                step="0.01"
                className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                  transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                  ${errors.buyingFromWholesalerPercentage ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
              />
              {errors.buyingFromWholesalerPercentage && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.buyingFromWholesalerPercentage}</p>
              )}
            </div>
  
            {/* Wholesaler Labour */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('category.form.wholesalerLabour')} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.wholesalerLabourPerGram}
                onChange={(e) => handleInputChange('wholesalerLabourPerGram', e.target.value)}
                placeholder={t('category.form.wholesalerLabourPlaceholder')}
                min="0"
                step="0.01"
                className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                  transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                  ${errors.wholesalerLabourPerGram ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{t('category.form.labourNote')}</p>
              {errors.wholesalerLabourPerGram && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.wholesalerLabourPerGram}</p>
              )}
            </div>
  
            {/* Selling Percentage */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {t('category.form.selling')} <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.sellingPercentage}
                onChange={(e) => handleInputChange('sellingPercentage', e.target.value)}
                placeholder={t('category.form.sellingPlaceholder')}
                min="1"
                step="0.01"
                className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                  transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                  ${errors.sellingPercentage ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
              />
              {errors.sellingPercentage && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.sellingPercentage}</p>
              )}
            </div>
          </div>
        )}
  
        {/* OLD Type Fields */}
        {formData.type === 'OLD' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
              {/* True Purity */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t('category.form.truePurity')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.truePurityPercentage}
                  onChange={(e) => handleInputChange('truePurityPercentage', e.target.value)}
                  placeholder={t('category.form.truePurityPlaceholder')}
                  min="1"
                  max="100"
                  step="0.01"
                  className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                    transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                    ${errors.truePurityPercentage ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
                />
                {errors.truePurityPercentage && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.truePurityPercentage}</p>
                )}
              </div>
  
              {/* Scrap Buy Own */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t('category.form.scrapBuyOwn')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.scrapBuyOwnPercentage}
                  onChange={(e) => handleInputChange('scrapBuyOwnPercentage', e.target.value)}
                  placeholder={t('category.form.scrapBuyOwnPlaceholder')}
                  min="1"
                  step="0.01"
                  className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                    transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                    ${errors.scrapBuyOwnPercentage ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
                />
                {errors.scrapBuyOwnPercentage && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.scrapBuyOwnPercentage}</p>
                )}
              </div>
  
              {/* Scrap Buy Other */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t('category.form.scrapBuyOther')} <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.scrapBuyOtherPercentage}
                  onChange={(e) => handleInputChange('scrapBuyOtherPercentage', e.target.value)}
                  placeholder={t('category.form.scrapBuyOtherPlaceholder')}
                  min="1"
                  step="0.01"
                  className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 
                    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                    transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                    ${errors.scrapBuyOtherPercentage ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-700'}`}
                />
                {errors.scrapBuyOtherPercentage && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors.scrapBuyOtherPercentage}</p>
                )}
              </div>
            </div>
  
            {/* Resale Toggle */}
            <div className="space-y-3 p-6 glass-effect bg-gradient-to-br from-gold-50/50 to-transparent dark:from-slate-800/50 dark:to-transparent rounded-xl border-2 border-gold-200 dark:border-slate-700 shadow-luxury animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white">
                    {t('category.form.resaleOptions')}
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {t('category.form.resaleNote')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResaleToggle(!formData.resaleEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gold-500/30 shadow-luxury ${
                    formData.resaleEnabled ? 'bg-gradient-gold' : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      formData.resaleEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className={`text-sm font-semibold transition-colors ${
                formData.resaleEnabled ? 'text-gold-700 dark:text-gold-300' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {formData.resaleEnabled ? t('category.form.enabled') : t('category.form.disabled')}
              </div>
            </div>
  
            {/* Resale Categories Section */}
            {formData.resaleEnabled && (
              <div className="space-y-6 p-6 glass-effect bg-gradient-to-br from-blue-50/70 to-gold-50/30 dark:from-slate-800/70 dark:to-slate-800/30 rounded-2xl border-2 border-gold-300 dark:border-slate-600 shadow-luxury-lg animate-scale-in">
                <div className="flex items-center justify-between pb-3 border-b-2 border-gold-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-7 bg-gradient-gold rounded-full shadow-gold"></div>
                    <h4 className="font-bold text-lg bg-gradient-gold bg-clip-text text-transparent">
                      {t('category.form.resaleCategories')} <span className="text-red-500">*</span>
                    </h4>
                  </div>
                </div>
  
                {formData.resaleCategories.length === 0 && (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="w-16 h-16 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-gold animate-glow">
                      <Plus className="text-white" size={32} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{t('category.form.noResaleCategories')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('category.form.addFirstResaleCategory')}</p>
                  </div>
                )}
  
                {formData.resaleCategories.map((category, index) => (
                  <div key={index} className="glass-effect bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-gold-200 dark:border-slate-700 space-y-5 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 animate-slide-up">
                    {/* Category Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
                      <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center text-white text-sm shadow-gold">
                          {index + 1}
                        </span>
                        {t('category.form.categoryNumber', { number: index + 1 })}
                      </h5>
                      {formData.resaleCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResaleCategory(index)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          title={t('category.form.removeCategory')}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
  
                    {/* Category Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {t('category.form.categoryName')} <span className="text-red-500 dark:text-red-400">*</span>
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
                            className={`w-full glass-effect border-2 rounded-xl px-4 py-3 pr-12 bg-white dark:bg-slate-700 
                              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                              focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                              transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                              ${errors[`resaleCategories.${index}.itemCategory`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}
                              ${!formData.metal ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!formData.metal}
                          />
                          <ChevronDown 
                            size={20} 
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                          />
                        </div>
  
                        {resaleCategoryDropdowns[index] && formData.metal && (
                          <div className="absolute z-50 w-full mt-2 glass-effect bg-white dark:bg-slate-800 border-2 border-gold-200 dark:border-slate-700 rounded-xl shadow-luxury-lg max-h-80 overflow-auto animate-scale-in">
                            {loadingCategories ? (
                              <div className="p-6 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-200 dark:border-slate-700 border-t-gold-600 dark:border-t-gold-500 mx-auto"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">{t('category.form.loading')}</p>
                              </div>
                            ) : (
                              <>
                                {category.itemCategory.trim() && isCreatingNewCategory(category.itemCategory) && (
                                  <button
                                    type="button"
                                    onClick={() => handleResaleCategorySelect(index, category.itemCategory)}
                                    className="w-full px-5 py-4 text-left hover:bg-gold-50 dark:hover:bg-slate-700/50 
                                      flex items-center gap-3 border-b-2 border-gold-100 dark:border-slate-700 
                                      bg-gold-50/50 dark:bg-slate-700/30 transition-all duration-200 group"
                                  >
                                    <Plus size={18} className="text-gold-600 dark:text-gold-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-bold text-gold-700 dark:text-gold-300">
                                        {t('category.form.createNewCategory')}
                                      </div>
                                      <div className="text-xs text-gold-600 dark:text-gold-400 truncate mt-1">
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
                                      className="w-full px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 
                                        flex items-center justify-between group transition-all duration-200"
                                    >
                                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                                        {cat}
                                      </span>
                                      {category.itemCategory === cat && (
                                        <Check size={18} className="text-green-600 dark:text-green-400 animate-scale-in" />
                                      )}
                                    </button>
                                  ))
                                ) : !category.itemCategory.trim() || !isCreatingNewCategory(category.itemCategory) ? (
                                  <div className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
                                    {t('category.form.noCategoriesFound')}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {errors[`resaleCategories.${index}.itemCategory`] && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.itemCategory`]}</p>
                      )}
                    </div>
  
                    {/* Resale Percentages Grid */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {t('category.form.directResale')} <span className="text-red-500 dark:text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={category.directResalePercentage}
                            onChange={(e) => updateResaleCategory(index, 'directResalePercentage', e.target.value)}
                            placeholder={t('category.form.directResalePlaceholder')}
                            min="1"
                            step="0.01"
                            className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 
                              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                              focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                              transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                              ${errors[`resaleCategories.${index}.directResalePercentage`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                          />
                          {errors[`resaleCategories.${index}.directResalePercentage`] && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.directResalePercentage`]}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {t('category.form.buyingFromWholesaler')} <span className="text-red-500 dark:text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={category.buyingFromWholesalerPercentage}
                            onChange={(e) => updateResaleCategory(index, 'buyingFromWholesalerPercentage', e.target.value)}
                            placeholder={t('category.form.buyingFromWholesalerPlaceholder')}
                            min="1"
                            step="0.01"
                            className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 
                              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                              focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                              transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                              ${errors[`resaleCategories.${index}.buyingFromWholesalerPercentage`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                          />
                          {errors[`resaleCategories.${index}.buyingFromWholesalerPercentage`] && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.buyingFromWholesalerPercentage`]}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {t('category.form.wholesalerLabour')} <span className="text-red-500 dark:text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={category.wholesalerLabourPerGram}
                            onChange={(e) => updateResaleCategory(index, 'wholesalerLabourPerGram', e.target.value)}
                            placeholder={t('category.form.wholesalerLabourPlaceholder')}
                            min="0"
                            step="0.01"
                            className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 
                              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                              focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                              transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                              ${errors[`resaleCategories.${index}.wholesalerLabourPerGram`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{t('category.form.labourNote')}</p>
                          {errors[`resaleCategories.${index}.wholesalerLabourPerGram`] && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.wholesalerLabourPerGram`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Direct Resale Rate Type Selector */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          {t('category.form.directResaleRateType')} <span className="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateResaleCategory(index, 'directResaleRateType', 'SELLING')}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 border-2 ${
                              category.directResaleRateType === 'SELLING'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-600 shadow-md'
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-green-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              {category.directResaleRateType === 'SELLING' && (
                                <Check size={16} className="flex-shrink-0" />
                              )}
                              <span>{t('category.form.rateType.selling')}</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateResaleCategory(index, 'directResaleRateType', 'BUYING')}
                            className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 border-2 ${
                              category.directResaleRateType === 'BUYING'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 shadow-md'
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              {category.directResaleRateType === 'BUYING' && (
                                <Check size={16} className="flex-shrink-0" />
                              )}
                              <span>{t('category.form.rateType.buying')}</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
  
                    {/* Polish/Repair Section */}
                    <div className="pt-5 border-t-2 border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-gray-900 dark:text-white">
                          {t('category.form.polishRepair')}
                        </label>
                        <button
                          type="button"
                          onClick={() => updateResaleCategory(index, 'polishRepairEnabled', !category.polishRepairEnabled)}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-luxury ${
                            category.polishRepairEnabled ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                              category.polishRepairEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {category.polishRepairEnabled && (
                        <div className="space-y-4 mt-4 animate-slide-up">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              {t('category.form.polishResale')} <span className="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              value={category.polishRepairResalePercentage}
                              onChange={(e) => updateResaleCategory(index, 'polishRepairResalePercentage', e.target.value)}
                              placeholder={t('category.form.polishResalePlaceholder')}
                              min="1"
                              step="0.01"
                              className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 
                                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent 
                                transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                                ${errors[`resaleCategories.${index}.polishRepairResalePercentage`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                            />
                            {errors[`resaleCategories.${index}.polishRepairResalePercentage`] && (
                              <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.polishRepairResalePercentage`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              {t('category.form.polishCost')} <span className="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              value={category.polishRepairCostPercentage}
                              onChange={(e) => updateResaleCategory(index, 'polishRepairCostPercentage', e.target.value)}
                              placeholder={t('category.form.polishCostPlaceholder')}
                              min="0"
                              max="50"
                              step="0.01"
                              className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 
                                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent 
                                transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                                ${errors[`resaleCategories.${index}.polishRepairCostPercentage`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                            />
                            {errors[`resaleCategories.${index}.polishRepairCostPercentage`] && (
                              <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.polishRepairCostPercentage`]}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              {t('category.form.polishLabour')} <span className="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <input
                              type="number"
                              value={category.polishRepairLabourPerGram}
                              onChange={(e) => updateResaleCategory(index, 'polishRepairLabourPerGram', e.target.value)}
                              placeholder={t('category.form.polishLabourPlaceholder')}
                              min="0"
                              step="0.01"
                              className={`w-full glass-effect border-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 
                                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent 
                                transition-all duration-300 shadow-luxury hover:shadow-luxury-lg
                                ${errors[`resaleCategories.${index}.polishRepairLabourPerGram`] ? 'border-red-500 dark:border-red-400' : 'border-gray-200 dark:border-slate-600'}`}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{t('category.form.labourNote')}</p>
                            {errors[`resaleCategories.${index}.polishRepairLabourPerGram`] && (
                              <p className="text-red-600 dark:text-red-400 text-xs mt-1 animate-slide-up font-medium">{errors[`resaleCategories.${index}.polishRepairLabourPerGram`]}</p>
                            )}
                          </div>
                        </div>

                        {/* Polish/Repair Rate Type Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              {t('category.form.polishRepairRateType')} <span className="text-red-500 dark:text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateResaleCategory(index, 'polishRepairRateType', 'SELLING')}
                                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 border-2 ${
                                  category.polishRepairRateType === 'SELLING'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-600 shadow-md'
                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-green-400'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  {category.polishRepairRateType === 'SELLING' && (
                                    <Check size={16} className="flex-shrink-0" />
                                  )}
                                  <span>{t('category.form.rateType.selling')}</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateResaleCategory(index, 'polishRepairRateType', 'BUYING')}
                                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 border-2 ${
                                  category.polishRepairRateType === 'BUYING'
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-blue-400'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  {category.polishRepairRateType === 'BUYING' && (
                                    <Check size={16} className="flex-shrink-0" />
                                  )}
                                  <span>{t('category.form.rateType.buying')}</span>
                                </div>
                              </button>
                            </div>
                          </div>
                      </div>
                      )}
                      
                      {!category.polishRepairEnabled && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                          {t('category.form.enablePolishNote')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
  
                {/* Add Category Button */}
                <button
                  type="button"
                  onClick={addResaleCategory}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 text-sm font-bold bg-gradient-gold 
                    text-white rounded-xl hover:shadow-luxury-lg transition-all duration-300 hover:scale-[1.02] 
                    active:scale-[0.98] shadow-gold"
                >
                  <Plus size={20} />
                  {t('category.form.addCategory')}
                </button>
  
                {errors.resaleCategories && (
                  <p className="text-red-700 dark:text-red-300 text-sm font-bold animate-slide-up bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {errors.resaleCategories}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
  
      {/* Descriptions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b-2 border-gold-200 dark:border-gold-800/30">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-gold rounded-full shadow-gold"></div>
            <h3 className="text-xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              {t('category.form.descriptions')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowDescriptionHelp(!showDescriptionHelp)}
            className="flex items-center gap-2 text-sm font-semibold text-gold-600 dark:text-gold-400 
              hover:text-gold-700 dark:hover:text-gold-300 transition-colors px-4 py-2 rounded-lg 
              hover:bg-gold-50 dark:hover:bg-slate-700/50"
          >
            {showDescriptionHelp ? <EyeOff size={18} /> : <Eye size={18} />}
            {showDescriptionHelp ? t('category.form.hideHelp') : t('category.form.showHelp')}
          </button>
        </div>
  
        {showDescriptionHelp && (
          <div className="glass-effect bg-gradient-to-br from-blue-50 to-gold-50/30 dark:from-slate-800 dark:to-slate-800/50 
            border-2 border-blue-200 dark:border-slate-700 rounded-xl p-6 shadow-luxury animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <Info size={24} className="text-white" />
              </div>
              <div className="space-y-3 text-sm">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-base">
                  {t('category.form.descriptionHelp.title')}
                </h4>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">1.</span>
                    <span>{t('category.form.descriptionHelp.universal')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">2.</span>
                    <span>{t('category.form.descriptionHelp.roleBased')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">3.</span>
                    <span>{t('category.form.descriptionHelp.multiLang')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
  
        <div className="space-y-6">
          {/* Universal Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {t('category.form.universalDescription')}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-normal">
                {t('category.form.fallbackAllRoles')}
              </span>
            </label>
            <textarea
              value={formData.descriptions.universal}
              onChange={(e) => handleDescriptionChange('universal', e.target.value)}
              placeholder={t('category.form.universalPlaceholder')}
              rows={3}
              maxLength={500}
              className="w-full glass-effect border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 
                bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                transition-all duration-300 shadow-luxury hover:shadow-luxury-lg resize-vertical"
            />
            <p className="text-gray-500 dark:text-gray-400 text-xs text-right font-medium">
              {t('category.form.characterCount', { current: formData.descriptions.universal.length, max: 500 })}
            </p>
          </div>
  
          {/* Role-Based Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'admin', label: t('category.form.adminOnly') },
              { key: 'manager', label: t('category.form.managerOnly') },
              { key: 'proClient', label: t('category.form.proClientOnly') },
              { key: 'client', label: t('category.form.clientOnly') }
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {label}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-normal">
                    {t('category.form.overridesUniversal')}
                  </span>
                </label>
                <textarea
                  value={formData.descriptions[key]}
                  onChange={(e) => handleDescriptionChange(key, e.target.value)}
                  placeholder={t('category.form.roleSpecificPlaceholder', { role: label })}
                  rows={3}
                  maxLength={500}
                  className="w-full glass-effect border-2 border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 
                    bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent 
                    transition-all duration-300 shadow-luxury hover:shadow-luxury-lg resize-vertical"
                />
                <p className="text-gray-500 dark:text-gray-400 text-xs text-right font-medium">
                  {t('category.form.characterCount', { current: formData.descriptions[key].length, max: 500 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
  
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t-2 border-gray-200 dark:border-slate-700">
        {errors.resaleCategories && formData.resaleEnabled && (
          <p className="text-red-700 dark:text-red-300 text-sm font-bold self-start sm:self-center animate-slide-up 
            bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
            {errors.resaleCategories}
          </p>
        )}
        <div className="flex gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-xl font-semibold
              text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 
              hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:scale-[1.02] 
              active:scale-[0.98]"
          >
            {t('category.form.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-gold text-white rounded-xl font-bold
              hover:shadow-luxury-lg disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300 shadow-gold hover:scale-[1.02] active:scale-[0.98]
              flex items-center gap-3 min-w-[160px] justify-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
            )}
            <span>
              {loading 
                ? (isEditing ? t('category.form.updating') : t('category.form.creating')) 
                : (isEditing ? t('category.form.updateCategory') : t('category.form.createCategory'))
              }
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ExtendedJewelryForm;