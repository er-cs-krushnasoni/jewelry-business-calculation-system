import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import superAdminService from '../../services/superAdminService';
import toast from 'react-hot-toast';
import {
  Store,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  Clock,
  Users,
  RefreshCw
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ShopForm from '../../components/superadmin/ShopForm';
import ShopDetailsModal from '../../components/superadmin/ShopDetailsModal';
import SubscriptionModal from '../../components/superadmin/SubscriptionModal';
import BulkActionsBar from '../../components/superadmin/BulkActionsBar';

const ShopManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShops, setSelectedShops] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadShops();
    loadAnalytics();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchQuery, statusFilter]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getAllShops();
      if (response.data.success) {
        setShops(response.data.shops);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await superAdminService.getSubscriptionAnalytics();
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const filterShops = () => {
    let filtered = [...shops];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.shopName.toLowerCase().includes(query) ||
        shop.shopCode.toLowerCase().includes(query) ||
        shop.adminUsername.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(shop => {
        if (statusFilter === 'active') return shop.isActive;
        if (statusFilter === 'inactive') return !shop.isActive;
        if (statusFilter === 'expiring') {
          if (!shop.subscription?.endDate) return false;
          const daysRemaining = Math.ceil(
            (new Date(shop.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return daysRemaining >= 0 && daysRemaining <= 7;
        }
        return true;
      });
    }

    setFilteredShops(filtered);
  };

  const handleCreateShop = async (shopData) => {
    try {
      const response = await superAdminService.createShop(shopData);
      if (response.data.success) {
        toast.success('Shop created successfully');
        setShowCreateModal(false);
        loadShops();
        loadAnalytics();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create shop';
      toast.error(message);
      throw error;
    }
  };

  const handleToggleShopStatus = async (shop) => {
    try {
      if (shop.isActive) {
        await superAdminService.bulkDeactivateShops([shop._id], 'manual', 'Manually deactivated');
        toast.success(`${shop.shopName} deactivated`);
      } else {
        await superAdminService.bulkActivateShops([shop._id]);
        toast.success(`${shop.shopName} activated`);
      }
      loadShops();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to toggle shop status');
    }
  };

  const handleDeleteShop = async (shopId, shopName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${shopName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await superAdminService.deleteShop(shopId, true);
      toast.success('Shop deleted permanently');
      loadShops();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to delete shop');
    }
  };

  const handleExtendSubscription = async (shopId, days) => {
    try {
      await superAdminService.extendSubscription(shopId, days);
      toast.success(`Subscription extended by ${days} days`);
      setShowSubscriptionModal(false);
      loadShops();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to extend subscription');
      throw error;
    }
  };

  const handleReduceSubscription = async (shopId, days) => {
    try {
      await superAdminService.reduceSubscription(shopId, days);
      toast.success(`Subscription reduced by ${days} days`);
      setShowSubscriptionModal(false);
      loadShops();
      loadAnalytics();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reduce subscription';
      toast.error(message);
      throw error;
    }
  };

  const handleSelectShop = (shopId) => {
    setSelectedShops(prev => {
      if (prev.includes(shopId)) {
        return prev.filter(id => id !== shopId);
      } else {
        return [...prev, shopId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedShops.length === filteredShops.length) {
      setSelectedShops([]);
    } else {
      setSelectedShops(filteredShops.map(shop => shop._id));
    }
  };

  const handleBulkActivate = async () => {
    try {
      await superAdminService.bulkActivateShops(selectedShops);
      toast.success(`Activated ${selectedShops.length} shops`);
      setSelectedShops([]);
      loadShops();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to activate shops');
    }
  };

  const handleBulkDeactivate = async () => {
    if (!window.confirm(`Deactivate ${selectedShops.length} selected shops?`)) {
      return;
    }

    try {
      await superAdminService.bulkDeactivateShops(selectedShops, 'admin_action', 'Bulk deactivation');
      toast.success(`Deactivated ${selectedShops.length} shops`);
      setSelectedShops([]);
      loadShops();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to deactivate shops');
    }
  };

  const getSubscriptionBadge = (shop) => {
    if (!shop.subscription?.endDate) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
          No Subscription
        </span>
      );
    }

    // Check if subscription is paused
    if (shop.subscription?.isPaused) {
      const pausedSince = Math.ceil((new Date() - new Date(shop.subscription.pausedAt)) / (1000 * 60 * 60 * 24));
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <Clock size={12} />
          Paused ({pausedSince}d)
        </span>
      );
    }

    const daysRemaining = Math.ceil(
      (new Date(shop.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1">
          <XCircle size={12} />
          Expired
        </span>
      );
    }

    if (daysRemaining <= 7) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
          <AlertTriangle size={12} />
          {daysRemaining}d left
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircle size={12} />
        {daysRemaining}d left
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-7 w-7" />
              Shop Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage jewelry shops and subscriptions
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Create Shop
          </Button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Shops</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
                </div>
                <Store className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.expiringSoon}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.inactive}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search shops by name, code, or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Shops</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="expiring">Expiring Soon</option>
          </select>

          <Button
            variant="secondary"
            onClick={loadShops}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedShops.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedShops.length}
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onCancel={() => setSelectedShops([])}
        />
      )}

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedShops.length === filteredShops.length && filteredShops.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Store size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No shops found</p>
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedShops.includes(shop._id)}
                        onChange={() => handleSelectShop(shop._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {shop.shopName}
                          </div>
                          <div className="text-sm text-gray-500">{shop.shopCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{shop.adminUsername}</div>
                    </td>
                    <td className="px-6 py-4">
                      {shop.isActive ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                          <CheckCircle size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getSubscriptionBadge(shop)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(shop.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedShop(shop);
                            setShowSubscriptionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Manage Subscription"
                        >
                          <Calendar size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedShop(shop);
                            setShowDetailsModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleShopStatus(shop)}
                          className={`${shop.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                          title={shop.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop._id, shop.shopName)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <ShopForm
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateShop}
        />
      )}

      {showDetailsModal && selectedShop && (
        <ShopDetailsModal
          shop={selectedShop}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedShop(null);
          }}
          onUpdate={loadShops}
        />
      )}

      {showSubscriptionModal && selectedShop && (
        <SubscriptionModal
          shop={selectedShop}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedShop(null);
          }}
          onExtend={handleExtendSubscription}
          onReduce={handleReduceSubscription}
        />
      )}
    </div>
  );
};

export default ShopManagement;