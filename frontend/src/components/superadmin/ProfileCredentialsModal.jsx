import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ProfileCredentialsModal = ({ onClose, onSubmit, currentUsername }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Current password is required
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // At least one field must be updated
    if (!formData.newUsername && !formData.newPassword) {
      newErrors.general = 'Please provide a new username or new password';
    }

    // Validate new username if provided
    if (formData.newUsername) {
      if (formData.newUsername.length < 3) {
        newErrors.newUsername = 'Username must be at least 3 characters';
      } else if (formData.newUsername.length > 30) {
        newErrors.newUsername = 'Username cannot exceed 30 characters';
      } else if (formData.newUsername === currentUsername) {
        newErrors.newUsername = 'New username must be different from current username';
      }
    }

    // Validate new password if provided
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }

      // Confirm password is required if new password is provided
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        currentPassword: formData.currentPassword,
        newUsername: formData.newUsername || undefined,
        newPassword: formData.newPassword || undefined
      });
      onClose();
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || 'Failed to update credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-luxury-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in border border-gold-200/20 dark:border-gold-500/20">
        {/* Header */}
        <div className="relative p-6 border-b border-gold-200/30 dark:border-slate-700/50 bg-gradient-to-br from-gold-50/50 to-transparent dark:from-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center shadow-gold animate-glow">
                <Lock className="h-6 w-6 text-white" />
                <div className="absolute inset-0 bg-gradient-gold rounded-xl blur-md opacity-50 -z-10"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-800 dark:from-gold-400 dark:to-gold-300 bg-clip-text text-transparent">
                  Update Credentials
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Secure your account information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 hover:rotate-90 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3 animate-slide-up">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Current Username Display */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Current Username
            </label>
            <div className="px-4 py-3 glass-effect border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-gold-600 dark:text-gold-400" />
              {currentUsername}
            </div>
          </div>

          {/* Current Password */}
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400 transition-colors duration-200" size={18} />
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                className="pl-12 pr-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-gold-500 dark:focus:border-gold-500 focus:ring-gold-500/20 rounded-xl transition-all duration-200"
                placeholder="Enter current password"
                error={errors.currentPassword}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200"
                aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle size={14} />
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gold-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium">
                Update at least one field below
              </span>
            </div>
          </div>

          {/* New Username */}
          <div className="space-y-2">
            <label htmlFor="newUsername" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              New Username <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400 transition-colors duration-200" size={18} />
              <Input
                id="newUsername"
                name="newUsername"
                type="text"
                value={formData.newUsername}
                onChange={handleChange}
                className="pl-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-gold-500 dark:focus:border-gold-500 focus:ring-gold-500/20 rounded-xl transition-all duration-200"
                placeholder="Enter new username"
                error={errors.newUsername}
              />
            </div>
            {errors.newUsername && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle size={14} />
                {errors.newUsername}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              New Password <span className="text-slate-400 text-xs">(optional)</span>
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400 transition-colors duration-200" size={18} />
              <Input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                className="pl-12 pr-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-gold-500 dark:focus:border-gold-500 focus:ring-gold-500/20 rounded-xl transition-all duration-200"
                placeholder="Enter new password (min 6 characters)"
                error={errors.newPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200"
                aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle size={14} />
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          {formData.newPassword && (
            <div className="space-y-2 animate-slide-up">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-gold-600 dark:group-focus-within:text-gold-400 transition-colors duration-200" size={18} />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-12 pr-12 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:border-gold-500 dark:focus:border-gold-500 focus:ring-gold-500/20 rounded-xl transition-all duration-200"
                  placeholder="Confirm new password"
                  error={errors.confirmPassword}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors duration-200"
                  aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 glass-effect border border-gold-200 dark:border-gold-800/30 rounded-xl bg-gradient-to-br from-gold-50/50 to-transparent dark:from-gold-900/10">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gold-600 dark:text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  Security Notice
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Your password is encrypted and cannot be recovered. Please remember your new credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-gold hover:shadow-gold transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Credentials'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCredentialsModal;