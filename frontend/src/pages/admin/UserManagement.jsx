import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Shield, Users, CheckCircle, XCircle, Crown } from 'lucide-react';
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
      manager: 'bg-gradient-to-r from-silver-100 to-silver-200 text-silver-800 dark:from-silver-900/30 dark:to-silver-800/30 dark:text-silver-300',
      pro_client: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300',
      client: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300',
      admin: 'bg-gradient-gold text-gold-900 dark:text-gold-200 shadow-gold'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-gold-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gold-200 dark:border-gold-900/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-gold-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('users.management.table.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gold-50/30 to-gold-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-gold rounded-xl shadow-gold">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                {t('users.management.title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t('users.management.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-gold text-white px-6 py-3 rounded-xl hover:shadow-luxury-lg transition-all duration-300 shadow-luxury font-medium animate-glow"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t('users.management.addNewUser')}</span>
              <span className="sm:hidden">Add User</span>
            </button>
          </div>
        </div>

        {/* Available Roles Info */}
        <div className="mb-6 glass-effect rounded-xl p-5 border border-gold-200 dark:border-gold-900/30 shadow-luxury animate-fade-in">
          <h3 className="font-semibold text-gold-900 dark:text-gold-300 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('users.management.availableRoles')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((roleInfo) => (
              <span
                key={roleInfo.role}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  roleInfo.available
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {getRoleDisplay(roleInfo.role)} {roleInfo.available ? `✓ ${t('users.management.buttons.available')}` : `✗ ${t('users.management.buttons.taken')}`}
              </span>
            ))}
          </div>
        </div>

        {/* Current Admin Card */}
        <div className="mb-8 animate-scale-in">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-gold-500" />
            {t('users.management.yourAccount')}
          </h2>
          <div className="glass-effect border-2 border-gold-300 dark:border-gold-700 rounded-2xl p-6 shadow-luxury-lg hover:shadow-gold transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                <div className="w-14 h-14 bg-gradient-gold rounded-2xl flex items-center justify-center shadow-gold animate-glow flex-shrink-0">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser.username}</h3>
                  <span className="inline-block mt-2 px-4 py-1.5 bg-gradient-gold text-white text-sm font-semibold rounded-full shadow-gold">
                    {t('users.management.roles.shopAdmin')}
                  </span>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {t('users.management.table.created')}: {formatDate(currentUser.createdAt)}
                  </p>
                </div>
              </div>
              
              {editingUser === currentUser._id ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleUpdateCredentials(currentUser._id, true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    <Save className="w-4 h-4" />
                    {t('users.management.buttons.save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-500 dark:bg-gray-600 text-white px-5 py-2.5 rounded-xl hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
                  >
                    <X className="w-4 h-4" />
                    {t('common.actions.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(currentUser)}
                  className="flex items-center justify-center gap-2 bg-gradient-gold text-white px-5 py-2.5 rounded-xl hover:shadow-luxury transition-all duration-300 font-medium w-full sm:w-auto"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.actions.edit')}
                </button>
              )}
            </div>

            {editingUser === currentUser._id && (
              <div className="mt-6 space-y-4 border-t border-gold-200 dark:border-gold-800 pt-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('users.management.form.oldPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showInputPasswords.oldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder={t('users.management.form.oldPasswordPlaceholder')}
                      className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => toggleInputPasswordVisibility('oldPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                    >
                      {showInputPasswords.oldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('users.management.form.newPasswordLabel')}
                  </label>
                  <div className="relative">
                    <input
                      type={showInputPasswords.newPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t('users.management.form.passwordMinHint')}
                      className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => toggleInputPasswordVisibility('newPassword')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                    >
                      {showInputPasswords.newPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {formData.password && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('users.management.form.confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showInputPasswords.confirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder={t('users.management.form.confirmPasswordPlaceholder')}
                        className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => toggleInputPasswordVisibility('confirmPassword')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                      >
                        {showInputPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formData.password && formData.confirmPassword && (
                      <div className="mt-2 flex items-center gap-2 text-sm animate-fade-in">
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400 font-medium">{t('users.management.form.passwordMatch')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-red-600 dark:text-red-400 font-medium">{t('users.management.form.passwordNotMatch')}</span>
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
        <div className="animate-fade-in">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-gold-500" />
            {t('users.management.shopUsers')}
          </h2>
          {users.length === 0 ? (
            <div className="text-center py-16 glass-effect rounded-2xl border-2 border-dashed border-gold-300 dark:border-gold-700 shadow-luxury">
              <div className="w-20 h-20 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-4 animate-glow">
                <User className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">{t('users.management.table.noUsers')}</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">{t('users.management.table.createFirst')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {users.map((user, index) => (
                <div
                  key={user._id}
                  className="glass-effect rounded-2xl border border-gold-200 dark:border-gold-900/30 p-6 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 dark:from-gold-600 dark:to-gold-800 rounded-xl flex items-center justify-center shadow-gold flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{user.username}</h3>
                        <span className={`inline-block mt-1.5 px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleDisplay(user.role)}
                        </span>
                      </div>
                    </div>

                    {editingUser !== user._id && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-300"
                          title={t('common.actions.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user._id)}
                          className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300"
                          title={t('common.actions.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingUser === user._id ? (
                    <div className="space-y-4 border-t border-gold-200 dark:border-gold-800 pt-4 animate-fade-in">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('users.management.form.username')}
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('users.management.form.newPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showInputPasswords.newPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={t('users.management.form.passwordMinHint')}
                            className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => toggleInputPasswordVisibility('newPassword')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                          >
                            {showInputPasswords.newPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      {formData.password && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('users.management.form.confirmPasswordLabel')}
                          </label>
                          <div className="relative">
                            <input
                              type={showInputPasswords.confirmPassword ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              placeholder={t('users.management.form.confirmPasswordPlaceholder')}
                              className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => toggleInputPasswordVisibility('confirmPassword')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                            >
                              {showInputPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {formData.password && formData.confirmPassword && (
                            <div className="mt-2 flex items-center gap-2 text-sm animate-fade-in">
                              {formData.password === formData.confirmPassword ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-green-600 dark:text-green-400 font-medium">{t('users.management.form.passwordMatch')}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  <span className="text-red-600 dark:text-red-400 font-medium">{t('users.management.form.passwordNotMatch')}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleUpdateCredentials(user._id, false)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                        >
                          <Save className="w-4 h-4" />
                          {t('users.management.buttons.saveChanges')}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-500 dark:bg-gray-600 text-white px-4 py-2.5 rounded-xl hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-300 font-medium"
                        >
                          <X className="w-4 h-4" />
                          {t('common.actions.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 border-t border-gold-200 dark:border-gold-800 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('users.management.form.password')}:</span>
                        <button
                          onClick={() => togglePasswordVisibility(user._id)}
                          className="flex items-center gap-2 text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 text-sm font-semibold transition-colors"
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
                        <div className="glass-effect p-3 rounded-xl border border-gold-300 dark:border-gold-700 animate-fade-in">
                          <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
                            {showPassword[user._id]}
                          </code>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('users.management.table.created')}: {formatDate(user.createdAt)}
                      </div>
                    </div>
                  )}

                  {confirmDelete === user._id && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl animate-fade-in">
                      <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-3">
                        {t('users.management.error.confirmDelete')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-semibold"
                        >
                          {t('users.management.buttons.yes')}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 text-sm font-semibold"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-effect border-2 border-gold-300 dark:border-gold-700 rounded-2xl max-w-md w-full p-6 shadow-luxury-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">{t('users.management.createNew')}</h2>
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.management.form.username')} *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder={t('users.management.form.usernamePlaceholder')}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.management.form.password')} *
                </label>
                <div className="relative">
                  <input
                    type={showInputPasswords.createPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('users.management.form.passwordPlaceholder')}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInputPasswordVisibility('createPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                  >
                    {showInputPasswords.createPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{t('users.management.form.passwordMinHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.management.form.confirmPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showInputPasswords.confirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={t('users.management.form.confirmPasswordPlaceholder')}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleInputPasswordVisibility('confirmPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-600 dark:text-gray-400 dark:hover:text-gold-400 transition-colors"
                  >
                    {showInputPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm animate-fade-in">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400 font-medium">{t('users.management.form.passwordMatch')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-red-600 dark:text-red-400 font-medium">{t('users.management.form.passwordNotMatch')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('users.management.form.role')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-300 text-gray-900 dark:text-white"
                >
                  <option value="">{t('users.management.form.selectRole')}</option>
                  {availableRoles.map((roleInfo) => (
                    <option
                      key={roleInfo.role}
                      value={roleInfo.role}
                      disabled={!roleInfo.available}
                      className="dark:bg-slate-800"
                    >
                      {getRoleDisplay(roleInfo.role)} {roleInfo.available ? '' : `(${t('users.management.buttons.taken')})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 bg-gradient-gold text-white px-4 py-3 rounded-xl hover:shadow-luxury transition-all duration-300 font-semibold"
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
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-semibold"
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