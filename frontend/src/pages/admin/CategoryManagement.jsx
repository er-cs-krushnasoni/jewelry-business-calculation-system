import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter, Search, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { LegacyModal } from '../../components/ui/Modal';
import ExtendedJewelryForm from '../../components/categories/ExtendedJewelryForm';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CategoryManagement = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '', // Show all types by default
    metal: '',
    itemCategory: '',
    search: ''
  });
  
  // Unique item categories for filter dropdown (NEW jewelry only)
  const [itemCategories, setItemCategories] = useState([]);

  // Load categories on component mount and when filters change
  useEffect(() => {
    loadCategories();
    if (filters.type === 'NEW' || !filters.type) {
      loadItemCategories();
    }
  }, [filters.type, filters.metal, filters.itemCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.metal) queryParams.append('metal', filters.metal);
      if (filters.itemCategory && (filters.type === 'NEW' || !filters.type)) {
        queryParams.append('itemCategory', filters.itemCategory);
      }
      
      const response = await api.get(`/categories?${queryParams.toString()}`);
      
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        throw new Error(response.data.message || t('category.management.error.loadFailed'));
      }
    } catch (error) {
      console.error('Load categories error:', error);
      const errorMessage = error.response?.data?.message || t('category.management.error.loadFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadItemCategories = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.metal) queryParams.append('metal', filters.metal);
      
      const response = await api.get(`/categories/item-categories?${queryParams.toString()}`);
      
      if (response.data.success) {
        setItemCategories(response.data.data);
      }
    } catch (error) {
      console.error('Load item categories error:', error);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);
      
      if (response.data.success) {
        toast.success(t('category.management.success.created'));
        setShowCreateModal(false);
        loadCategories();
        if (categoryData.type === 'NEW' || !filters.type) {
          loadItemCategories();
        }
      } else {
        throw new Error(response.data.message || t('category.management.error.createFailed'));
      }
    } catch (error) {
      console.error('Create category error:', error);
      const errorMessage = error.response?.data?.message || t('category.management.error.createFailed');
      toast.error(errorMessage);
      throw error; // Re-throw to let form handle it
    }
  };

  const handleEditCategory = async (categoryData) => {
    try {
      const response = await api.put(`/categories/${editingCategory._id}`, categoryData);
      
      if (response.data.success) {
        toast.success(t('category.management.success.updated'));
        setShowEditModal(false);
        setEditingCategory(null);
        loadCategories();
        if (categoryData.type === 'NEW' || !filters.type) {
          loadItemCategories();
        }
      } else {
        throw new Error(response.data.message || t('category.management.error.updateFailed'));
      }
    } catch (error) {
      console.error('Update category error:', error);
      const errorMessage = error.response?.data?.message || t('category.management.error.updateFailed');
      toast.error(errorMessage);
      throw error; // Re-throw to let form handle it
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`${t('category.management.error.confirmDelete')} "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${categoryId}`);
      
      if (response.data.success) {
        toast.success(t('category.management.success.deleted'));
        loadCategories();
        loadItemCategories();
      } else {
        throw new Error(response.data.message || t('category.management.error.deleteFailed'));
      }
    } catch (error) {
      console.error('Delete category error:', error);
      const errorMessage = error.response?.data?.message || t('category.management.error.deleteFailed');
      toast.error(errorMessage);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset item category filter when type or metal changes
      if (key === 'type' && value !== 'NEW') {
        newFilters.itemCategory = '';
      }
      if (key === 'metal') {
        newFilters.itemCategory = '';
      }
      
      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      metal: '',
      itemCategory: '',
      search: ''
    });
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    return (
      category.code.toLowerCase().includes(searchTerm) ||
      category.itemCategory?.toLowerCase().includes(searchTerm) ||
      category.description?.toLowerCase().includes(searchTerm)
    );
  });

  // Helper function to get effective purity for display
  const getEffectivePurity = (category) => {
    if (category.type === 'NEW') {
      return category.purityPercentage;
    } else if (category.type === 'OLD') {
      return category.truePurityPercentage;
    }
    return null;
  };

  if (loading && categories.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">{t('category.management.table.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent dark:text-white">
            {t('category.management.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('category.management.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-gold hover:shadow-gold transition-all duration-300 transform hover:scale-105"
        >
          <Plus size={20} />
          {t('category.management.addCategory')}
        </Button>
      </div>

      {/* Filters Section */}
      <div className="glass-effect rounded-xl border border-gold-200 dark:border-slate-700 p-6 space-y-4 shadow-luxury animate-slide-up">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter size={20} className="text-gold-500" />
            {t('category.management.filters.title')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="border-gold-300 dark:border-slate-600 text-gold-600 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-slate-700 transition-all duration-200"
          >
            {t('category.management.filters.reset')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('category.management.filters.type')}
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-200"
            >
              <option value="">{t('category.management.filters.allTypes')}</option>
              <option value="NEW">{t('category.management.types.new')}</option>
              <option value="OLD">{t('category.management.types.old')}</option>
            </select>
          </div>

          {/* Metal Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('category.management.filters.metal')}
            </label>
            <select
              value={filters.metal}
              onChange={(e) => handleFilterChange('metal', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-200"
            >
              <option value="">{t('category.management.filters.allMetals')}</option>
              <option value="GOLD">{t('category.management.metals.gold')}</option>
              <option value="SILVER">{t('category.management.metals.silver')}</option>
            </select>
          </div>

          {/* Item Category Filter (NEW jewelry only) */}
          {(filters.type === 'NEW' || !filters.type) && (
            <div className="animate-scale-in">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('category.management.filters.itemCategory')}
              </label>
              <select
                value={filters.itemCategory}
                onChange={(e) => handleFilterChange('itemCategory', e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-200"
              >
                <option value="">{t('category.management.filters.allCategories')}</option>
                {itemCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.actions.search')}
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500" />
              <input
                type="text"
                placeholder={t('category.management.filters.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 shadow-luxury animate-slide-up">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800 dark:text-red-300">{t('common.messages.errorLoadingData')}</h4>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200"
          >
            {t('common.actions.retry')}
          </Button>
        </div>
      )}

      {/* Categories List */}
      <div className="glass-effect rounded-xl border border-gold-200 dark:border-slate-700 overflow-hidden shadow-luxury-lg animate-slide-up">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.status.loading')}</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gold-400 dark:text-gold-500 mb-4">
              <AlertCircle size={56} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('category.management.table.noCategoriesFound')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {categories.length === 0 
                ? t('category.management.table.createFirst')
                : t('category.management.table.noMatches')
              }
            </p>
            {categories.length === 0 && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mx-auto bg-gradient-gold hover:shadow-gold transition-all duration-300 transform hover:scale-105"
              >
                {t('category.management.addCategory')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gold-50 to-gold-100 dark:from-slate-800 dark:to-slate-750">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.codeDetails')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.typeAndMetal')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.category')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.purity')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.keyPercentage')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.settings')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('category.management.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredCategories.map((category, index) => (
                  <tr 
                    key={category._id} 
                    className={`transition-all duration-200 hover:bg-gold-50/50 dark:hover:bg-slate-700/50 ${
                      index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {category.code}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                          category.type === 'NEW' 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300'
                            : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900/40 dark:to-yellow-900/40 dark:text-amber-300'
                        }`}>
                          {category.type === 'NEW' ? t('category.management.types.new') : t('category.management.types.old')}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                          category.metal === 'GOLD' 
                            ? 'bg-gradient-gold text-yellow-900 dark:text-yellow-200'
                            : 'bg-gradient-silver text-gray-800 dark:text-gray-200'
                        }`}>
                          {category.metal === 'GOLD' ? t('category.management.metals.gold') : t('category.management.metals.silver')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium">
                      {category.itemCategory || 
                        (category.type === 'OLD' ? t('category.management.table.oldJewelry') : t('category.management.table.notApplicable'))}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {getEffectivePurity(category) ? (
                        <span className="px-3 py-1 bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 rounded-lg">
                          {getEffectivePurity(category)}%
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{t('category.management.table.notApplicable')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {category.type === 'NEW' && category.sellingPercentage && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold rounded-lg">
                           {category.sellingPercentage}%
                        </span>
                      )}
                      {category.type === 'OLD' && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {t('category.management.table.ownPercentage')} <span className="font-semibold text-gray-900 dark:text-white">{category.scrapBuyOwnPercentage}%</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {t('category.management.table.otherPercentage')} <span className="font-semibold text-gray-900 dark:text-white">{category.scrapBuyOtherPercentage}%</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {category.type === 'OLD' && (
                        <div className="flex items-center gap-2">
                          {category.resaleEnabled ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-300 transition-all duration-200">
                              <Eye size={12} className="mr-1" />
                              {t('category.management.resale.on')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 transition-all duration-200">
                              <EyeOff size={12} className="mr-1" />
                              {t('category.management.resale.off')}
                            </span>
                          )}
                        </div>
                      )}
                      {category.type === 'NEW' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('category.management.resale.standard')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 transform hover:scale-110"
                          title={t('common.actions.edit')}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id, category.code)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 transform hover:scale-110"
                          title={t('common.actions.delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      <LegacyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('category.management.createNew')}
        size="large"
      >
        <ExtendedJewelryForm
          onSubmit={handleCreateCategory}
          onCancel={() => setShowCreateModal(false)}
        />
      </LegacyModal>

      {/* Edit Category Modal */}
      <LegacyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
        }}
        title={t('category.management.edit')}
        size="large"
      >
        {editingCategory && (
          <ExtendedJewelryForm
            initialData={editingCategory}
            onSubmit={handleEditCategory}
            onCancel={() => {
              setShowEditModal(false);
              setEditingCategory(null);
            }}
            isEditing
          />
        )}
      </LegacyModal>
    </div>
  );
};

export default CategoryManagement;