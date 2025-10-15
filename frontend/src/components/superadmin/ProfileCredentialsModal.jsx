import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Update Credentials</h2>
              <p className="text-sm text-gray-600">Change your username or password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Current Username Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Username
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
              {currentUsername}
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                className="pl-10 pr-10"
                placeholder="Enter current password"
                error={errors.currentPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Update at least one field below</span>
            </div>
          </div>

          {/* New Username */}
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-1">
              New Username (optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="newUsername"
                name="newUsername"
                type="text"
                value={formData.newUsername}
                onChange={handleChange}
                className="pl-10"
                placeholder="Enter new username"
                error={errors.newUsername}
              />
            </div>
            {errors.newUsername && (
              <p className="mt-1 text-sm text-red-600">{errors.newUsername}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password (optional)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                className="pl-10 pr-10"
                placeholder="Enter new password (min 6 characters)"
                error={errors.newPassword}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password */}
          {formData.newPassword && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  placeholder="Confirm new password"
                  error={errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> For security, your password is hashed and cannot be recovered. Make sure to remember your new credentials.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Credentials'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCredentialsModal;