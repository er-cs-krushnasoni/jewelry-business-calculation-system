import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter, Search, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
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
  }, [filters.type, filters.metal]);

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
        throw new Error(response.data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Load categories error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load categories';
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
        toast.success('Category created successfully');
        setShowCreateModal(false);
        loadCategories();
        if (categoryData.type === 'NEW' || !filters.type) {
          loadItemCategories();
        }
      } else {
        throw new Error(response.data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Create category error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create category';
      toast.error(errorMessage);
      throw error; // Re-throw to let form handle it
    }
  };

  const handleEditCategory = async (categoryData) => {
    try {
      const response = await api.put(`/categories/${editingCategory._id}`, categoryData);
      
      if (response.data.success) {
        toast.success('Category updated successfully');
        setShowEditModal(false);
        setEditingCategory(null);
        loadCategories();
        if (categoryData.type === 'NEW' || !filters.type) {
          loadItemCategories();
        }
      } else {
        throw new Error(response.data.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Update category error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update category';
      toast.error(errorMessage);
      throw error; // Re-throw to let form handle it
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${categoryId}`);
      
      if (response.data.success) {
        toast.success('Category deleted successfully');
        loadCategories();
        loadItemCategories();
      } else {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
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
          <p className="mt-4 text-gray-600">Loading categories...</p>
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
            Category Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage NEW and OLD jewelry categories with descriptions and settings
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Filter size={18} />
            Filters
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="NEW">NEW</option>
              <option value="OLD">OLD</option>
            </select>
          </div>

          {/* Metal Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metal
            </label>
            <select
              value={filters.metal}
              onChange={(e) => handleFilterChange('metal', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Metals</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
            </select>
          </div>

          {/* Item Category Filter (NEW jewelry only) */}
          {(filters.type === 'NEW' || !filters.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Category
              </label>
              <select
                value={filters.itemCategory}
                onChange={(e) => handleFilterChange('itemCategory', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
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
              Search
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search codes, categories..."
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
            <h4 className="font-medium text-red-800">Error loading categories</h4>
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <AlertCircle size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 mb-4">
              {categories.length === 0 
                ? "Create your first category to get started"
                : "No categories match your current filters"
              }
            </p>
            {categories.length === 0 && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mx-auto"
              >
                Create First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code & Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Metal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purity %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Settings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                          {category.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.metal === 'GOLD' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.metal}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.itemCategory || 
                        (category.type === 'OLD' ? 'OLD Jewelry' : '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEffectivePurity(category) ? `${getEffectivePurity(category)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.type === 'NEW' && category.sellingPercentage && (
                        <span className="text-green-600 font-medium">
                          Sell: {category.sellingPercentage}%
                        </span>
                      )}
                      {category.type === 'OLD' && (
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            Own: {category.scrapBuyOwnPercentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Other: {category.scrapBuyOtherPercentage}%
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
                              Resale ON
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <EyeOff size={12} className="mr-1" />
                              Resale OFF
                            </span>
                          )}
                        </div>
                      )}
                      {category.type === 'NEW' && (
                        <span className="text-xs text-gray-500">Standard</span>
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
                          title="Edit Category"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id, category.code)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
                          title="Delete Category"
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
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Category"
        size="large"
      >
        <ExtendedJewelryForm
          onSubmit={handleCreateCategory}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCategory(null);
        }}
        title="Edit Category"
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
      </Modal>
    </div>
  );
};

export default CategoryManagement;