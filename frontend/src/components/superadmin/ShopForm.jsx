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
    subscriptionDays: shop ? '' : '30',
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

    if (formData.contactInfo.email && !/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors['contact.email'] = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted', formData);

    if (!validate()) {
      console.log('Validation failed', errors);
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

      console.log('Submitting data:', submitData);
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="2xl">
      {/* Header with Gradient */}
      <div className="px-6 py-5 border-b border-gold-200 dark:border-slate-700 bg-gradient-to-r from-gold-50 to-white dark:from-slate-800 dark:to-slate-900 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-gold rounded-xl shadow-gold animate-glow">
              <Store className="h-6 w-6 text-white" />
            </div>
            {isEditMode ? 'Edit Shop' : 'Create New Shop'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-all duration-300 hover:bg-gold-50 dark:hover:bg-slate-700 rounded-lg hover:rotate-90 transform"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 animate-slide-up">
        <div className="space-y-8">
          {/* Shop Information */}
          <div className="glass-effect rounded-xl p-6 shadow-luxury border border-gold-100 dark:border-slate-700 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-gold-300 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-gold rounded-full"></div>
              Shop Information
            </h3>
            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                  error={errors.shopName}
                  disabled={submitting}
                  className="transition-all duration-300 hover:shadow-gold focus:shadow-gold"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                  Language
                </label>
                <select
                  name="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gold-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent text-slate-700 dark:text-slate-200 transition-all duration-300 hover:border-gold-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <option value="en">English</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Credentials */}
          {!isEditMode && (
            <div className="glass-effect rounded-xl p-6 shadow-luxury border border-gold-100 dark:border-slate-700 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-gold-300 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-gold rounded-full"></div>
                Shop Admin Account
              </h3>
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                    Admin Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                    <Input
                      name="adminUsername"
                      value={formData.adminUsername}
                      onChange={handleChange}
                      placeholder="Enter admin username"
                      className="pl-12 transition-all duration-300 hover:shadow-gold focus:shadow-gold"
                      error={errors.adminUsername}
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                      Admin Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                      <Input
                        type="password"
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleChange}
                        placeholder="Minimum 6 characters"
                        className="pl-12 transition-all duration-300 hover:shadow-gold focus:shadow-gold"
                        error={errors.adminPassword}
                        disabled={submitting}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                      <Input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter password"
                        className="pl-12 transition-all duration-300 hover:shadow-gold focus:shadow-gold"
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

          {/* Subscription Period */}
          {!isEditMode && (
            <div className="glass-effect rounded-xl p-6 shadow-luxury border border-gold-100 dark:border-slate-700 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-gold-300 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-gold rounded-full"></div>
                Initial Subscription
              </h3>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                  Subscription Period (Days) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                  <Input
                    type="number"
                    name="subscriptionDays"
                    value={formData.subscriptionDays}
                    onChange={handleChange}
                    placeholder="Enter number of days"
                    min="1"
                    className="pl-12 transition-all duration-300 hover:shadow-gold focus:shadow-gold"
                    error={errors.subscriptionDays}
                    disabled={submitting}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                  Common periods: 30 days (1 month), 90 days (3 months), 365 days (1 year)
                </p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="glass-effect rounded-xl p-6 shadow-luxury border border-gold-100 dark:border-slate-700 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-gold-300 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-gold rounded-full"></div>
              Contact Information
            </h3>
            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                  <Input
                    type="email"
                    name="contact.email"
                    value={formData.contactInfo.email}
                    onChange={handleChange}
                    placeholder="shop@example.com"
                    className="pl-12 transition-all duration-300 hover:shadow-gold focus:shadow-gold"
                    error={errors['contact.email']}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                  <Input
                    type="tel"
                    name="contact.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="pl-12 transition-all duration-300 hover:shadow-gold focus:shadow-gold"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-gold-400 dark:text-gold-500 transition-colors group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400" size={18} />
                  <textarea
                    name="contact.address"
                    value={formData.contactInfo.address}
                    onChange={handleChange}
                    placeholder="Shop address"
                    rows="3"
                    disabled={submitting}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gold-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300 hover:border-gold-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-effect rounded-xl p-6 shadow-luxury border border-gold-100 dark:border-slate-700 animate-fade-in">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes or comments..."
              rows="4"
              maxLength="500"
              disabled={submitting}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gold-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300 hover:border-gold-300 dark:hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md resize-none"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-right">
              {formData.notes.length}/500 characters
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gold-200 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            loading={submitting}
            className="bg-gradient-gold hover:shadow-gold transition-all duration-300 hover:scale-105 animate-glow"
          >
            {isEditMode ? 'Update Shop' : 'Create Shop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ShopForm;