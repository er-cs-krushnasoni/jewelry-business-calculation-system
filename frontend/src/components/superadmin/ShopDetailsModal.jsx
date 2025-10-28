import React, { useState } from 'react';
import { X, Store, User, Calendar, Mail, Phone, MapPin, Edit2, Save, AlertCircle, Clock, Pause, Play } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import superAdminService from '../../services/superAdminService';
import toast from 'react-hot-toast';

const ShopDetailsModal = ({ shop, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [shopData, setShopData] = useState({
    shopName: shop.shopName,
    contactInfo: {
      email: shop.contactInfo?.email || '',
      phone: shop.contactInfo?.phone || '',
      address: shop.contactInfo?.address || ''
    },
    notes: shop.notes || '',
    defaultLanguage: shop.defaultLanguage || 'en'
  });

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleShopDataChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setShopData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [contactField]: value
        }
      }));
    } else {
      setShopData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveShopData = async () => {
    if (!shopData.shopName.trim()) {
      toast.error('Shop name is required');
      return;
    }

    try {
      setSubmitting(true);
      await superAdminService.updateShop(shop._id, shopData);
      toast.success('Shop details updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!credentials.username && !credentials.password) {
      toast.error('Please enter username or password to update');
      return;
    }

    if (credentials.username && credentials.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (credentials.password && credentials.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      const updateData = {};
      if (credentials.username) updateData.username = credentials.username.trim();
      if (credentials.password) updateData.password = credentials.password;

      await superAdminService.updateShopAdminCredentials(shop._id, updateData);
      toast.success('Admin credentials updated successfully');
      setIsEditingCredentials(false);
      setCredentials({ username: '', password: '' });
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubscriptionStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'warning': return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'expired': return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800';
      case 'paused': return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      default: return 'text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const subscriptionStatus = shop.subscription?.endDate 
    ? (() => {
        if (shop.subscription.isPaused) {
          return 'paused';
        }
        
        const daysRemaining = Math.ceil(
          (new Date(shop.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysRemaining < 0) return 'expired';
        if (daysRemaining <= 7) return 'warning';
        return 'active';
      })()
    : 'no_subscription';

  const getPausedDuration = () => {
    if (!shop.subscription?.pausedAt) return 0;
    return Math.ceil((new Date() - new Date(shop.subscription.pausedAt)) / (1000 * 60 * 60 * 24));
  };

  return (
    <Modal onClose={onClose} maxWidth="3xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gold-200 dark:border-slate-700 bg-gradient-to-r from-gold-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent flex items-center gap-3 animate-fade-in">
            <div className="p-2 bg-gold-100 dark:bg-gold-900/30 rounded-xl shadow-gold">
              <Store className="h-6 w-6 text-gold-600 dark:text-gold-400" />
            </div>
            Shop Details
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-all duration-300 hover:rotate-90 p-2 hover:bg-gold-50 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="px-6 py-6 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900">
        {/* Basic Info Card */}
        <div className="mb-6 p-5 bg-gradient-to-br from-white to-gold-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-luxury border border-gold-200 dark:border-slate-700 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-gold rounded-full"></div>
              Shop Information
            </h3>
            {!isEditing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 hover:shadow-gold transition-all duration-300"
              >
                <Edit2 size={16} />
                Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Shop Name
              </label>
              {isEditing ? (
                <Input
                  name="shopName"
                  value={shopData.shopName}
                  onChange={handleShopDataChange}
                  disabled={submitting}
                  className="transition-all duration-300 focus:shadow-gold"
                />
              ) : (
                <p className="text-slate-900 dark:text-white font-medium px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {shop.shopName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Shop Code
              </label>
              <p className="text-slate-900 dark:text-white font-mono font-semibold px-3 py-2 bg-gold-50 dark:bg-gold-900/20 rounded-lg border border-gold-200 dark:border-gold-800">
                {shop.shopCode}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-300 ${
                shop.isActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${shop.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                {shop.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Language
              </label>
              {isEditing ? (
                <select
                  name="defaultLanguage"
                  value={shopData.defaultLanguage}
                  onChange={handleShopDataChange}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-300"
                >
                  <option value="en">English</option>
                  <option value="gu">ગુજરાતી</option>
                  <option value="hi">हिंदी</option>
                </select>
              ) : (
                <p className="text-slate-900 dark:text-white font-medium px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {shopData.defaultLanguage === 'en' ? 'English' : 
                   shopData.defaultLanguage === 'gu' ? 'ગુજરાતી' : 'हिंदी'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Info Card */}
        <div className="mb-6 p-5 glass-effect rounded-xl shadow-luxury-lg border border-gold-200 dark:border-slate-700 animate-slide-up" style={{animationDelay: '100ms'}}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="p-2 bg-gradient-gold rounded-lg shadow-gold">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Subscription Status
          </h3>
          
          {shop.subscription?.endDate ? (
            <div className="space-y-4">
              {/* Subscription Status Badge */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status:</span>
                <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-all duration-300 ${getSubscriptionStatusColor(subscriptionStatus)}`}>
                  {subscriptionStatus === 'paused' && <Pause size={14} className="animate-pulse" />}
                  {subscriptionStatus === 'active' && <Play size={14} className="animate-pulse" />}
                  {subscriptionStatus === 'paused' ? 'Paused (Manual Deactivation)' : 
                   subscriptionStatus === 'expired' ? 'Expired' :
                   subscriptionStatus === 'warning' ? 'Expiring Soon' : 'Active'}
                </span>
              </div>

              {/* Paused Information */}
              {shop.subscription.isPaused && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 shadow-lg animate-scale-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                    </div>
                    <div className="text-sm flex-1">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Subscription is Paused</p>
                      <p className="text-yellow-800 dark:text-yellow-200 leading-relaxed">
                        Shop was manually deactivated {getPausedDuration()} days ago. 
                        Subscription timer is frozen and will resume when shop is reactivated.
                      </p>
                      {shop.subscription.totalPausedDays > 0 && (
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-2 font-medium">
                          Total paused days (lifetime): {shop.subscription.totalPausedDays} days
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">End Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(shop.subscription.endDate).toLocaleDateString()}
                </span>
              </div>
              
              {!shop.subscription.isPaused && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Days Remaining:</span>
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold border ${getSubscriptionStatusColor(subscriptionStatus)}`}>
                    {Math.max(0, Math.ceil(
                      (new Date(shop.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                    ))} days
                  </span>
                </div>
              )}
              
              {shop.subscription.lastRenewalDate && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Renewed:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(shop.subscription.lastRenewalDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle size={20} />
              <span className="font-medium">No subscription set</span>
            </div>
          )}
        </div>

        {/* Contact Info Card */}
        <div className="mb-6 p-5 bg-gradient-to-br from-white to-gold-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-luxury border border-gold-200 dark:border-slate-700 animate-slide-up" style={{animationDelay: '200ms'}}>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-gold rounded-full"></div>
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail size={16} className="text-gold-600 dark:text-gold-400" />
                Email
              </label>
              {isEditing ? (
                <Input
                  name="contact.email"
                  type="email"
                  value={shopData.contactInfo.email}
                  onChange={handleShopDataChange}
                  placeholder="email@example.com"
                  disabled={submitting}
                  className="transition-all duration-300 focus:shadow-gold"
                />
              ) : (
                <p className="text-slate-900 dark:text-white px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {shop.contactInfo?.email || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Phone size={16} className="text-gold-600 dark:text-gold-400" />
                Phone
              </label>
              {isEditing ? (
                <Input
                  name="contact.phone"
                  value={shopData.contactInfo.phone}
                  onChange={handleShopDataChange}
                  placeholder="+91 98765 43210"
                  disabled={submitting}
                  className="transition-all duration-300 focus:shadow-gold"
                />
              ) : (
                <p className="text-slate-900 dark:text-white px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {shop.contactInfo?.phone || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={16} className="text-gold-600 dark:text-gold-400" />
                Address
              </label>
              {isEditing ? (
                <textarea
                  name="contact.address"
                  value={shopData.contactInfo.address}
                  onChange={handleShopDataChange}
                  placeholder="Shop address"
                  rows="2"
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-300 resize-none"
                />
              ) : (
                <p className="text-slate-900 dark:text-white px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[3rem]">
                  {shop.contactInfo?.address || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-5 pt-5 border-t border-gold-200 dark:border-slate-700">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveShopData}
                disabled={submitting}
                loading={submitting}
                className="flex items-center gap-2 shadow-gold hover:shadow-gold-lg transition-all duration-300"
              >
                <Save size={16} />
                Save Changes
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setShopData({
                    shopName: shop.shopName,
                    contactInfo: shop.contactInfo || { email: '', phone: '', address: '' },
                    notes: shop.notes || '',
                    defaultLanguage: shop.defaultLanguage || 'en'
                  });
                }}
                disabled={submitting}
                className="transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Admin Credentials Card */}
        <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl shadow-luxury-lg animate-slide-up" style={{animationDelay: '300ms'}}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              Shop Admin Credentials
            </h3>
            {!isEditingCredentials && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingCredentials(true)}
                className="flex items-center gap-2 hover:shadow-gold transition-all duration-300"
              >
                <Edit2 size={16} />
                Update
              </Button>
            )}
          </div>

          {isEditingCredentials ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  <strong className="font-semibold">Note:</strong> Leave fields empty to keep current values. You can update username, password, or both.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Username (optional)
                </label>
                <Input
                  name="username"
                  value={credentials.username}
                  onChange={handleCredentialsChange}
                  placeholder="Enter new username or leave empty"
                  disabled={submitting}
                  autoComplete="off"
                  className="transition-all duration-300 focus:shadow-gold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password (optional)
                </label>
                <Input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleCredentialsChange}
                  placeholder="Enter new password or leave empty"
                  disabled={submitting}
                  autoComplete="new-password"
                  className="transition-all duration-300 focus:shadow-gold"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCredentials}
                  disabled={submitting}
                  loading={submitting}
                  className="shadow-gold hover:shadow-gold-lg transition-all duration-300"
                >
                  Update Credentials
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsEditingCredentials(false);
                    setCredentials({ username: '', password: '' });
                  }}
                  disabled={submitting}
                  className="transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Current Username:</span>
                <span className="ml-2 font-semibold text-slate-900 dark:text-white">{shop.adminUsername}</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <AlertCircle size={14} className="text-amber-500" />
                Password is hidden for security reasons
              </div>
            </div>
          )}
        </div>

        {/* Notes Card */}
        <div className="mb-6 p-5 bg-gradient-to-br from-white to-gold-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-luxury border border-gold-200 dark:border-slate-700 animate-slide-up" style={{animationDelay: '400ms'}}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-gold rounded-full"></div>
            Notes
          </label>
          {isEditing ? (
            <textarea
              name="notes"
              value={shopData.notes}
              onChange={handleShopDataChange}
              placeholder="Additional notes..."
              rows="3"
              maxLength="500"
              disabled={submitting}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 transition-all duration-300 resize-none"
            />
          ) : (
            <p className="text-slate-900 dark:text-white px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[3rem]">
              {shop.notes || 'No notes'}
            </p>
          )}
        </div>

        {/* Metadata Card */}
        <div className="pt-5 border-t border-gold-200 dark:border-slate-700 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 block mb-1">Created:</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {new Date(shop.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 block mb-1">Updated:</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {new Date(shop.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gold-200 dark:border-slate-700 bg-gradient-to-r from-gold-50 to-white dark:from-slate-800 dark:to-slate-900 flex justify-end">
        <Button 
          variant="secondary" 
          onClick={onClose}
          className="transition-all duration-300 hover:shadow-gold"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ShopDetailsModal;