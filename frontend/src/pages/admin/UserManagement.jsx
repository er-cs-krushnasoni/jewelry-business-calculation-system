import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Shield, Users, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [oldPassword, setOldPassword] = useState('');
  
  const [showInputPasswords, setShowInputPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
    createPassword: false
  });

  useEffect(() => {
    fetchUsers();
    fetchAvailableRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error(t('users.management.error.loadFailed'));
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/users/available-roles');
      setAvailableRoles(response.data.availableRoles || []);
    } catch (error) {
      console.error('Fetch available roles error:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password || !formData.role) {
      toast.error(t('users.management.error.allFieldsRequired'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('users.management.error.passwordMinLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('users.management.error.passwordMismatch'));
      return;
    }

    try {
      await api.post('/users', {
        username: formData.username,
        password: formData.password,
        role: formData.role
      });
      toast.success(t('users.management.success.created'));
      setShowCreateModal(false);
      setFormData({ username: '', password: '', confirmPassword: '', role: '' });
      setShowInputPasswords({ oldPassword: false, newPassword: false, confirmPassword: false, createPassword: false });
      fetchUsers();
      fetchAvailableRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.management.error.createFailed'));
    }
  };

  const handleUpdateCredentials = async (userId, isCurrentUser) => {
    if (!formData.username && !formData.password) {
      toast.error(t('users.management.error.usernameOrPassword'));
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error(t('users.management.error.passwordMinLength'));
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(t('users.management.error.passwordMismatch'));
      return;
    }

    if (isCurrentUser && formData.password && !oldPassword) {
      toast.error(t('users.management.error.oldPasswordRequired'));
      return;
    }

    try {
      const updateData = {};
      if (formData.username) updateData.username = formData.username;
      if (formData.password) updateData.password = formData.password;
      if (isCurrentUser && formData.password) updateData.oldPassword = oldPassword;

      await api.put(`/users/${userId}/credentials`, updateData);
      toast.success(t('users.management.success.updated'));
      setEditingUser(null);
      setFormData({ username: '', password: '', confirmPassword: '', role: '' });
      setOldPassword('');
      setShowInputPasswords({
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
        createPassword: false
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.management.error.updateFailed'));
      console.error('Update credentials error:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}?permanent=true`);
      toast.success(t('users.management.success.deleted'));
      setConfirmDelete(null);
      fetchUsers();
      fetchAvailableRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.management.error.deleteFailed'));
    }
  };

  const togglePasswordVisibility = async (userId) => {
    if (showPassword[userId]) {
      setShowPassword(prev => ({ ...prev, [userId]: null }));
      return;
    }

    try {
      const response = await api.get(`/users/${userId}/password`);
      setShowPassword(prev => ({
        ...prev,
        [userId]: response.data.user.password
      }));
    } catch (error) {
      toast.error(t('users.management.error.passwordRetrieveFailed'));
    }
  };

  const toggleInputPasswordVisibility = (field) => {
    setShowInputPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      manager: t('users.management.roles.manager'),
      pro_client: t('users.management.roles.proClient'),
      client: t('users.management.roles.client'),
      admin: t('users.management.roles.shopAdmin')
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      manager: 'bg-purple-100 text-purple-800',
      pro_client: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
      admin: 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  const startEdit = (user) => {
    setEditingUser(user._id);
    setFormData({
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setOldPassword('');
    setShowInputPasswords({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
      createPassword: false
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', confirmPassword: '', role: '' });
    setOldPassword('');
    setShowInputPasswords({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
      createPassword: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('users.management.table.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600" />
                {t('users.management.title')}
              </h1>
              <p className="mt-2 text-gray-600">{t('users.management.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {t('users.management.addNewUser')}
            </button>
          </div>
        </div>

        {/* Available Roles Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('users.management.availableRoles')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((roleInfo) => (
              <span
                key={roleInfo.role}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  roleInfo.available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {getRoleDisplay(roleInfo.role)} {roleInfo.available ? `✓ ${t('users.management.buttons.available')}` : `✗ ${t('users.management.buttons.taken')}`}
              </span>
            ))}
          </div>
        </div>

        {/* Current Admin Card */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('users.management.yourAccount')}</h2>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{currentUser.username}</h3>
                  <span className="inline-block mt-1 px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">
                    {t('users.management.roles.shopAdmin')}
                  </span>
                  <p className="mt-2 text-sm text-gray-600">
                    {t('users.management.table.created')}: {formatDate(currentUser.createdAt)}
                  </p>
                </div>
              </div>
              
              {editingUser === currentUser._id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateCredentials(currentUser._id, true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {t('users.management.buttons.save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {t('common.actions.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(currentUser)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.actions.edit')}
                </button>
              )}
            </div>

            {editingUser === currentUser._id && (
              <div className="mt-6 space-y-4 border-t border-indigo-200 pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('users.management.form.username')}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('users.management.form.oldPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showInputPasswords.oldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder={t('users.management.form.oldPasswordPlaceholder')}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleInputPasswordVisibility('oldPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showInputPasswords.oldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('users.management.form.newPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showInputPasswords.newPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('users.management.form.passwordMinHint')}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleInputPasswordVisibility('newPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showInputPasswords.newPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {formData.password && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('users.management.form.confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showInputPasswords.confirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder={t('users.management.form.confirmPasswordPlaceholder')}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleInputPasswordVisibility('confirmPassword')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showInputPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formData.password && formData.confirmPassword && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">{t('users.management.form.passwordMatch')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">{t('users.management.form.passwordNotMatch')}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Shop Users */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('users.management.shopUsers')}</h2>
          {users.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('users.management.table.noUsers')}</p>
              <p className="text-gray-400 mt-2">{t('users.management.table.createFirst')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                        <span className={`inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleDisplay(user.role)}
                        </span>
                      </div>
                    </div>

                    {editingUser !== user._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('common.actions.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('common.actions.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingUser === user._id ? (
                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('users.management.form.username')}
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('users.management.form.newPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showInputPasswords.newPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={t('users.management.form.passwordMinHint')}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => toggleInputPasswordVisibility('newPassword')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showInputPasswords.newPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      {formData.password && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('users.management.form.confirmPasswordLabel')}
                          </label>
                          <div className="relative">
                            <input
                              type={showInputPasswords.confirmPassword ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              placeholder={t('users.management.form.confirmPasswordPlaceholder')}
                              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => toggleInputPasswordVisibility('confirmPassword')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showInputPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {formData.password && formData.confirmPassword && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              {formData.password === formData.confirmPassword ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-green-600">{t('users.management.form.passwordMatch')}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-red-600">{t('users.management.form.passwordNotMatch')}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleUpdateCredentials(user._id, false)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          {t('users.management.buttons.saveChanges')}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          {t('common.actions.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{t('users.management.form.password')}:</span>
                        <button
                          onClick={() => togglePasswordVisibility(user._id)}
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          {showPassword[user._id] ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              {t('users.management.buttons.hide')}
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              {t('users.management.buttons.viewPassword')}
                            </>
                          )}
                        </button>
                      </div>
                      {showPassword[user._id] && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <code className="text-sm font-mono text-gray-900">
                            {showPassword[user._id]}
                          </code>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {t('users.management.table.created')}: {formatDate(user.createdAt)}
                      </div>
                    </div>
                  )}

                  {confirmDelete === user._id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium mb-3">
                        {t('users.management.error.confirmDelete')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          {t('users.management.buttons.yes')}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                          {t('common.actions.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('users.management.createNew')}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ username: '', password: '', confirmPassword: '', role: '' });
                  setShowInputPasswords({
                    oldPassword: false,
                    newPassword: false,
                    confirmPassword: false,
                    createPassword: false
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.management.form.username')} *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder={t('users.management.form.usernamePlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.management.form.password')} *
                </label>
                <div className="relative">
                  <input
                    type={showInputPasswords.createPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('users.management.form.passwordPlaceholder')}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInputPasswordVisibility('createPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showInputPasswords.createPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('users.management.form.passwordMinHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.management.form.confirmPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showInputPasswords.confirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t('users.management.form.confirmPasswordPlaceholder')}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInputPasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showInputPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">{t('users.management.form.passwordMatch')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">{t('users.management.form.passwordNotMatch')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.management.form.role')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">{t('users.management.form.selectRole')}</option>
                  {availableRoles.map((roleInfo) => (
                    <option
                      key={roleInfo.role}
                      value={roleInfo.role}
                      disabled={!roleInfo.available}
                    >
                      {getRoleDisplay(roleInfo.role)} {roleInfo.available ? '' : `(${t('users.management.buttons.taken')})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {t('users.management.buttons.createButton')}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ username: '', password: '', confirmPassword: '', role: '' });
                    setShowInputPasswords({
                      oldPassword: false,
                      newPassword: false,
                      confirmPassword: false,
                      createPassword: false
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {t('common.actions.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;