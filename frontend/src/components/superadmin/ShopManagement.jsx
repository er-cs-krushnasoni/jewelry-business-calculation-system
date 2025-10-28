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
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 transition-all duration-200">
          No Subscription
        </span>
      );
    }

    // Check if subscription is paused
    if (shop.subscription?.isPaused) {
      const pausedSince = Math.ceil((new Date() - new Date(shop.subscription.pausedAt)) / (1000 * 60 * 60 * 24));
      return (
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5 transition-all duration-200">
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
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1.5 transition-all duration-200">
          <XCircle size={12} />
          Expired
        </span>
      );
    }

    if (daysRemaining <= 7) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 flex items-center gap-1.5 transition-all duration-200">
          <AlertTriangle size={12} />
          {daysRemaining}d left
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1.5 transition-all duration-200">
        <CheckCircle size={12} />
        {daysRemaining}d left
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gold-50 to-white dark:from-slate-900 dark:to-slate-800 animate-fade-in">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gold-600 dark:text-gold-400 font-medium">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-50 via-white to-gold-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="animate-slide-up">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-gold rounded-xl shadow-gold">
                  <Store className="h-8 w-8 text-white" />
                </div>
                Shop Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 ml-14">
                Manage jewelry shops and subscriptions with ease
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-gold hover:shadow-gold hover:scale-105 transform transition-all duration-200 px-6 py-3 rounded-xl font-semibold shadow-luxury animate-scale-in"
            >
              <Plus size={20} />
              Create Shop
            </Button>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <div className="glass-effect bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-xl shadow-luxury border border-gold-200 dark:border-slate-700 hover:shadow-luxury-lg transform hover:-translate-y-1 transition-all duration-300 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Shops</p>
                    <p className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">{analytics.total}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl shadow-gold">
                    <Store className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-effect bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-xl shadow-luxury border border-green-200 dark:border-slate-700 hover:shadow-luxury-lg transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.active}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg shadow-green-500/30">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-effect bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-xl shadow-luxury border border-orange-200 dark:border-slate-700 hover:shadow-luxury-lg transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expiring Soon</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analytics.expiringSoon}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg shadow-orange-500/30">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="glass-effect bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-xl shadow-luxury border border-red-200 dark:border-slate-700 hover:shadow-luxury-lg transform hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Inactive</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.inactive}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg shadow-red-500/30">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors duration-200" size={20} />
              <Input
                type="text"
                placeholder="Search shops by name, code, or admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gold-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent transition-all duration-200 shadow-luxury hover:shadow-luxury-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gold-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent transition-all duration-200 shadow-luxury hover:shadow-luxury-lg text-gray-900 dark:text-white font-medium cursor-pointer"
            >
              <option value="all">All Shops</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="expiring">Expiring Soon</option>
            </select>

            <Button
              variant="secondary"
              onClick={loadShops}
              className="flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gold-200 dark:border-slate-700 rounded-xl hover:border-gold-400 dark:hover:border-gold-600 transition-all duration-200 shadow-luxury hover:shadow-luxury-lg font-medium"
            >
              <RefreshCw size={18} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedShops.length > 0 && (
          <div className="mb-6 animate-slide-up">
            <BulkActionsBar
              selectedCount={selectedShops.length}
              onActivate={handleBulkActivate}
              onDeactivate={handleBulkDeactivate}
              onCancel={() => setSelectedShops([])}
            />
          </div>
        )}

        {/* Shops Table */}
        <div className="glass-effect bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-luxury-lg border border-gold-200 dark:border-slate-700 overflow-hidden animate-scale-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gold-200 dark:divide-slate-700">
              <thead className="bg-gradient-to-r from-gold-50 to-gold-100 dark:from-slate-900 dark:to-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedShops.length === filteredShops.length && filteredShops.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-gold-300 dark:border-slate-600 text-gold-600 focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600 cursor-pointer transition-all duration-200"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    Shop
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gold-700 dark:text-gold-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-100 dark:divide-slate-700">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-luxury">
                          <Store size={64} className="text-gold-400 dark:text-gold-600 opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No shops found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop, index) => (
                    <tr 
                      key={shop._id} 
                      className="hover:bg-gold-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200 group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedShops.includes(shop._id)}
                          onChange={() => handleSelectShop(shop._id)}
                          className="w-5 h-5 rounded border-gold-300 dark:border-slate-600 text-gold-600 focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-600 cursor-pointer transition-all duration-200"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-gold rounded-xl flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform duration-200">
                            <Store className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {shop.shopName}
                            </div>
                            <div className="text-sm text-gold-600 dark:text-gold-400 font-medium">{shop.shopCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gold-500 dark:text-gold-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{shop.adminUsername}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {shop.isActive ? (
                          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1.5 w-fit transition-all duration-200 shadow-sm">
                            <CheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-1.5 w-fit transition-all duration-200 shadow-sm">
                            <XCircle size={12} />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getSubscriptionBadge(shop)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={14} className="text-gold-500 dark:text-gold-400" />
                          {new Date(shop.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedShop(shop);
                              setShowSubscriptionModal(true);
                            }}
                            className="p-2 text-gold-600 dark:text-gold-400 hover:bg-gold-100 dark:hover:bg-gold-900/30 rounded-lg transition-all duration-200 hover:scale-110 transform"
                            title="Manage Subscription"
                            aria-label="Manage Subscription"
                          >
                            <Calendar size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShop(shop);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-110 transform"
                            title="View Details"
                            aria-label="View Details"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleShopStatus(shop)}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 transform ${
                              shop.isActive 
                                ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30' 
                                : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                            title={shop.isActive ? 'Deactivate' : 'Activate'}
                            aria-label={shop.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteShop(shop._id, shop.shopName)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-110 transform"
                            title="Delete Permanently"
                            aria-label="Delete Permanently"
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