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
      case 'active': return 'text-green-700 bg-green-100';
      case 'warning': return 'text-orange-700 bg-orange-100';
      case 'expired': return 'text-red-700 bg-red-100';
      case 'paused': return 'text-yellow-700 bg-yellow-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const subscriptionStatus = shop.subscription?.endDate 
    ? (() => {
        // Check if paused
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            Shop Details
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
        {/* Basic Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shop Information</h3>
            {!isEditing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name
              </label>
              {isEditing ? (
                <Input
                  name="shopName"
                  value={shopData.shopName}
                  onChange={handleShopDataChange}
                  disabled={submitting}
                />
              ) : (
                <p className="text-gray-900">{shop.shopName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Code
              </label>
              <p className="text-gray-900 font-mono">{shop.shopCode}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span className={`inline-flex px-3 py-1 text-sm rounded-full ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {shop.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              {isEditing ? (
                <select
                  name="defaultLanguage"
                  value={shopData.defaultLanguage}
                  onChange={handleShopDataChange}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="gu">ગુજરાતી</option>
                  <option value="hi">हिंदी</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {shopData.defaultLanguage === 'en' ? 'English' : 
                   shopData.defaultLanguage === 'gu' ? 'ગુજરાતી' : 'हिंदी'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Subscription Status
          </h3>
          
          {shop.subscription?.endDate ? (
            <div className="space-y-3">
              {/* Subscription Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getSubscriptionStatusColor(subscriptionStatus)}`}>
                  {subscriptionStatus === 'paused' && <Pause size={14} />}
                  {subscriptionStatus === 'active' && <Play size={14} />}
                  {subscriptionStatus === 'paused' ? 'Paused (Manual Deactivation)' : 
                   subscriptionStatus === 'expired' ? 'Expired' :
                   subscriptionStatus === 'warning' ? 'Expiring Soon' : 'Active'}
                </span>
              </div>

              {/* Paused Information */}
              {shop.subscription.isPaused && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 mb-1">Subscription is Paused</p>
                      <p className="text-yellow-700">
                        Shop was manually deactivated {getPausedDuration()} days ago. 
                        Subscription timer is frozen and will resume when shop is reactivated.
                      </p>
                      {shop.subscription.totalPausedDays > 0 && (
                        <p className="text-yellow-600 text-xs mt-1">
                          Total paused days (lifetime): {shop.subscription.totalPausedDays} days
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">End Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(shop.subscription.endDate).toLocaleDateString()}
                </span>
              </div>
              
              {!shop.subscription.isPaused && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusColor(subscriptionStatus)}`}>
                    {Math.max(0, Math.ceil(
                      (new Date(shop.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                    ))} days
                  </span>
                </div>
              )}
              
              {shop.subscription.lastRenewalDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Renewed:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(shop.subscription.lastRenewalDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle size={20} />
              <span>No subscription set</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail size={16} />
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
                />
              ) : (
                <p className="text-gray-900">{shop.contactInfo?.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={16} />
                Phone
              </label>
              {isEditing ? (
                <Input
                  name="contact.phone"
                  value={shopData.contactInfo.phone}
                  onChange={handleShopDataChange}
                  placeholder="+91 98765 43210"
                  disabled={submitting}
                />
              ) : (
                <p className="text-gray-900">{shop.contactInfo?.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin size={16} />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{shop.contactInfo?.address || 'Not provided'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveShopData}
                disabled={submitting}
                loading={submitting}
                className="flex items-center gap-2"
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
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Admin Credentials */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Shop Admin Credentials
            </h3>
            {!isEditingCredentials && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditingCredentials(true)}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} />
                Update
              </Button>
            )}
          </div>

          {isEditingCredentials ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Leave fields empty to keep current values. You can update username, password, or both.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Username (optional)
                </label>
                <Input
                  name="username"
                  value={credentials.username}
                  onChange={handleCredentialsChange}
                  placeholder="Enter new username or leave empty"
                  disabled={submitting}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCredentials}
                  disabled={submitting}
                  loading={submitting}
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Current Username:</span>
                <span className="ml-2 font-medium text-gray-900">{shop.adminUsername}</span>
              </div>
              <div className="text-sm text-gray-500">
                <AlertCircle size={14} className="inline mr-1" />
                Password is hidden for security reasons
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-900">{shop.notes || 'No notes'}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 text-gray-900">
                {new Date(shop.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>
              <span className="ml-2 text-gray-900">
                {new Date(shop.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ShopDetailsModal;