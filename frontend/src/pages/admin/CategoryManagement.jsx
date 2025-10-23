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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('category.management.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('category.management.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          {t('category.management.addCategory')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Filter size={18} />
            {t('category.management.filters.title')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
          >
            {t('category.management.filters.reset')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.management.filters.type')}
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('category.management.filters.allTypes')}</option>
              <option value="NEW">{t('category.management.types.new')}</option>
              <option value="OLD">{t('category.management.types.old')}</option>
            </select>
          </div>

          {/* Metal Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('category.management.filters.metal')}
            </label>
            <select
              value={filters.metal}
              onChange={(e) => handleFilterChange('metal', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('category.management.filters.allMetals')}</option>
              <option value="GOLD">{t('category.management.metals.gold')}</option>
              <option value="SILVER">{t('category.management.metals.silver')}</option>
            </select>
          </div>

          {/* Item Category Filter (NEW jewelry only) */}
          {(filters.type === 'NEW' || !filters.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('category.management.filters.itemCategory')}
              </label>
              <select
                value={filters.itemCategory}
                onChange={(e) => handleFilterChange('itemCategory', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.actions.search')}
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('category.management.filters.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">{t('common.messages.errorLoadingData')}</h4>
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="ml-auto"
          >
            {t('common.actions.retry')}
          </Button>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600">{t('common.status.loading')}</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <AlertCircle size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('category.management.table.noCategoriesFound')}
            </h3>
            <p className="text-gray-600 mb-4">
              {categories.length === 0 
                ? t('category.management.table.createFirst')
                : t('category.management.table.noMatches')
              }
            </p>
            {categories.length === 0 && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mx-auto"
              >
                {t('category.management.addCategory')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.codeDetails')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.typeAndMetal')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.purity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.keyPercentage')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.settings')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category.management.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {category.code}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.type === 'NEW' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {category.type === 'NEW' ? t('category.management.types.new') : t('category.management.types.old')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.metal === 'GOLD' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.metal === 'GOLD' ? t('category.management.metals.gold') : t('category.management.metals.silver')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.itemCategory || 
                        (category.type === 'OLD' ? t('category.management.table.oldJewelry') : t('category.management.table.notApplicable'))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEffectivePurity(category) ? `${getEffectivePurity(category)}%` : t('category.management.table.notApplicable')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.type === 'NEW' && category.sellingPercentage && (
                        <span className="text-green-600 font-medium">
                           {category.sellingPercentage}%
                        </span>
                      )}
                      {category.type === 'OLD' && (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            {t('category.management.table.ownPercentage')} {category.scrapBuyOwnPercentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('category.management.table.otherPercentage')} {category.scrapBuyOtherPercentage}%
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.type === 'OLD' && (
                        <div className="flex items-center gap-2">
                          {category.resaleEnabled ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Eye size={12} className="mr-1" />
                              {t('category.management.resale.on')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <EyeOff size={12} className="mr-1" />
                              {t('category.management.resale.off')}
                            </span>
                          )}
                        </div>
                      )}
                      {category.type === 'NEW' && (
                        <span className="text-xs text-gray-500">{t('category.management.resale.standard')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(category);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title={t('common.actions.edit')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id, category.code)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          title={t('common.actions.delete')}
                        >
                          <Trash2 size={16} />
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