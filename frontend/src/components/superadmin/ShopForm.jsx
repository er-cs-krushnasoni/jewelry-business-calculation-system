import React, { useState } from 'react';
import { X, Store, User, Lock, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const ShopForm = ({ shop = null, onClose, onSubmit }) => {
  const isEditMode = !!shop;
  
  const [formData, setFormData] = useState({
    shopName: shop?.shopName || '',
    adminUsername: shop?.adminUsername || '',
    adminPassword: '',
    confirmPassword: '',
    subscriptionDays: shop ? '' : '30', // Default 30 days for new shops
    contactInfo: {
      email: shop?.contactInfo?.email || '',
      phone: shop?.contactInfo?.phone || '',
      address: shop?.contactInfo?.address || ''
    },
    notes: shop?.notes || '',
    defaultLanguage: shop?.defaultLanguage || 'en'
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }

    if (!isEditMode) {
      if (!formData.adminUsername.trim()) {
        newErrors.adminUsername = 'Admin username is required';
      } else if (formData.adminUsername.length < 3) {
        newErrors.adminUsername = 'Username must be at least 3 characters';
      }

      if (!formData.adminPassword) {
        newErrors.adminPassword = 'Admin password is required';
      } else if (formData.adminPassword.length < 6) {
        newErrors.adminPassword = 'Password must be at least 6 characters';
      }

      if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.subscriptionDays || parseInt(formData.subscriptionDays) < 1) {
        newErrors.subscriptionDays = 'Subscription period must be at least 1 day';
      }
    }

    // Email validation if provided
    if (formData.contactInfo.email && !/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors['contact.email'] = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted', formData); // Debug log

    if (!validate()) {
      console.log('Validation failed', errors); // Debug log
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        shopName: formData.shopName.trim(),
        contactInfo: {
          email: formData.contactInfo.email.trim(),
          phone: formData.contactInfo.phone.trim(),
          address: formData.contactInfo.address.trim()
        },
        notes: formData.notes.trim(),
        defaultLanguage: formData.defaultLanguage
      };

      if (!isEditMode) {
        submitData.adminUsername = formData.adminUsername.trim();
        submitData.adminPassword = formData.adminPassword;
        submitData.subscriptionDays = parseInt(formData.subscriptionDays);
      }

      console.log('Submitting data:', submitData); // Debug log
      
      await onSubmit(submitData);
      // onClose is called by parent on success
    } catch (error) {
      console.error('Form submission error:', error);
      // Error is handled by parent component
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-600" />
            {isEditMode ? 'Edit Shop' : 'Create New Shop'}
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

      <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Shop Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                  error={errors.shopName}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  name="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Credentials (Only for new shops) */}
          {!isEditMode && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Admin Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      name="adminUsername"
                      value={formData.adminUsername}
                      onChange={handleChange}
                      placeholder="Enter admin username"
                      className="pl-10"
                      error={errors.adminUsername}
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        type="password"
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        className="pl-10"
                        error={errors.adminPassword}
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="pl-10"
                        error={errors.confirmPassword}
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Period (Only for new shops) */}
          {!isEditMode && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Subscription</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Period (Days) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="number"
                    name="subscriptionDays"
                    value={formData.subscriptionDays}
                    onChange={handleChange}
                    placeholder="Enter number of days"
                    min="1"
                    className="pl-10"
                    error={errors.subscriptionDays}
                    disabled={submitting}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Common periods: 30 days (1 month), 90 days (3 months), 365 days (1 year)
                </p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="email"
                    name="contact.email"
                    value={formData.contactInfo.email}
                    onChange={handleChange}
                    placeholder="shop@example.com"
                    className="pl-10"
                    error={errors['contact.email']}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="tel"
                    name="contact.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <textarea
                    name="contact.address"
                    value={formData.contactInfo.address}
                    onChange={handleChange}
                    placeholder="Shop address"
                    rows="2"
                    disabled={submitting}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes or comments..."
              rows="3"
              maxLength="500"
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.notes.length}/500 characters
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            loading={submitting}
          >
            {isEditMode ? 'Update Shop' : 'Create Shop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ShopForm;