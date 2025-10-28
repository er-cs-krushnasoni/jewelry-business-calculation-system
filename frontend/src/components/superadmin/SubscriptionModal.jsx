import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle, Plus, Minus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const SubscriptionModal = ({ shop, onClose, onExtend, onReduce }) => {
  const [activeTab, setActiveTab] = useState('extend'); // 'extend' or 'reduce'
  const [days, setDays] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  const currentEndDate = shop.subscription?.endDate 
    ? new Date(shop.subscription.endDate)
    : new Date();

  const isExpired = currentEndDate < new Date();

  const calculateNewEndDate = () => {
    if (activeTab === 'extend') {
      const startDate = isExpired ? new Date() : new Date(currentEndDate);
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + parseInt(days || 0));
      return newDate;
    } else {
      // Reduce
      const newDate = new Date(currentEndDate);
      newDate.setDate(newDate.getDate() - parseInt(days || 0));
      
      // Can't go below today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        return today;
      }
      return newDate;
    }
  };

  const getDaysRemaining = () => {
    if (!shop.subscription?.endDate) return 0;
    const remaining = Math.ceil((currentEndDate - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  };

  const getMaxReducibleDays = () => {
    if (!shop.subscription?.endDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = currentEndDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const daysNum = parseInt(days);
    
    if (!days || daysNum < 1) {
      console.error('Invalid days value');
      return;
    }

    if (activeTab === 'reduce') {
      const maxReducible = getMaxReducibleDays();
      if (daysNum > maxReducible) {
        console.error(`Cannot reduce more than ${maxReducible} days`);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (activeTab === 'extend') {
        await onExtend(shop._id, daysNum);
      } else {
        await onReduce(shop._id, daysNum);
      }
    } catch (error) {
      console.error('Subscription action error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const quickOptions = activeTab === 'extend' 
    ? [
        { label: '7 Days', value: 7, description: '1 Week' },
        { label: '30 Days', value: 30, description: '1 Month' },
        { label: '90 Days', value: 90, description: '3 Months' },
        { label: '180 Days', value: 180, description: '6 Months' },
        { label: '365 Days', value: 365, description: '1 Year' }
      ]
    : [
        { label: '7 Days', value: 7, description: '1 Week' },
        { label: '15 Days', value: 15, description: '2 Weeks' },
        { label: '30 Days', value: 30, description: '1 Month' },
        { label: '60 Days', value: 60, description: '2 Months' },
        { label: '90 Days', value: 90, description: '3 Months' }
      ];

  const subscriptionStatus = shop.subscription?.endDate 
    ? (() => {
        const daysLeft = getDaysRemaining();
        if (daysLeft === 0) return 'expired';
        if (daysLeft <= 7) return 'warning';
        return 'active';
      })()
    : 'no_subscription';

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700';
      case 'expired': return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      default: return 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600';
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="2xl">
      {/* Header with Gradient */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-gold-50 to-amber-50 dark:from-slate-800 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-gold shadow-gold">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gold-600 to-amber-600 dark:from-gold-400 dark:to-amber-400 bg-clip-text text-transparent">
              Manage Subscription
            </span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 hover:rotate-90 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="px-6 py-6 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900">
        {/* Shop Info Card */}
        <div className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-luxury animate-fade-in">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{shop.shopName}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-mono">
              {shop.shopCode}
            </span>
          </p>
        </div>

        {/* Current Status Card */}
        <div className={`mb-6 p-5 rounded-xl border-2 shadow-luxury-lg transition-all duration-300 animate-slide-up ${getStatusColor(subscriptionStatus)}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-lg flex items-center gap-2">
              {subscriptionStatus === 'expired' && <AlertTriangle size={22} className="animate-pulse" />}
              {subscriptionStatus === 'warning' && <Clock size={22} className="animate-pulse" />}
              {subscriptionStatus === 'active' && <CheckCircle size={22} />}
              Current Subscription Status
            </h4>
          </div>

          {shop.subscription?.endDate ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium">Current End Date:</span>
                <span className="font-bold text-base">
                  {currentEndDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium">Days Remaining:</span>
                <span className="font-bold text-2xl">
                  {getDaysRemaining()} <span className="text-base font-normal">days</span>
                </span>
              </div>
              {isExpired && (
                <div className="mt-3 p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl text-sm font-medium text-red-800 dark:text-red-300 animate-pulse">
                  <AlertTriangle size={18} className="inline mr-2" />
                  Subscription has expired. Extend to reactivate shop.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No subscription set for this shop</p>
            </div>
          )}
        </div>

        {/* Luxury Tabs */}
        <div className="mb-6 border-b-2 border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('extend');
                setDays('30');
              }}
              className={`pb-4 px-6 text-sm font-bold border-b-4 transition-all duration-300 rounded-t-lg ${
                activeTab === 'extend'
                  ? 'border-gold-500 text-gold-600 dark:text-gold-400 bg-gradient-to-t from-gold-50 dark:from-gold-900/20 shadow-gold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Plus size={18} className="inline mr-2" />
              Extend Subscription
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reduce');
                setDays('7');
              }}
              disabled={!shop.subscription?.endDate || isExpired}
              className={`pb-4 px-6 text-sm font-bold border-b-4 transition-all duration-300 rounded-t-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'reduce'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-gradient-to-t from-amber-50 dark:from-amber-900/20 shadow-gold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Minus size={18} className="inline mr-2" />
              Reduce Subscription
            </button>
          </div>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              {activeTab === 'extend' ? 'Extend Subscription By:' : 'Reduce Subscription By:'}
            </label>

            {/* Quick Options - Luxury Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {quickOptions.map((option) => {
                const isDisabled = activeTab === 'reduce' && option.value > getMaxReducibleDays();
                const isSelected = parseInt(days) === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDays(option.value.toString())}
                    disabled={submitting || isDisabled}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-luxury ${
                      isSelected
                        ? activeTab === 'extend'
                          ? 'border-gold-400 bg-gradient-to-br from-gold-50 to-amber-50 dark:from-gold-900/30 dark:to-amber-900/30 dark:border-gold-600 shadow-gold animate-scale-in'
                          : 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-600 shadow-gold animate-scale-in'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className={`font-bold text-base mb-1 ${
                      isSelected 
                        ? 'text-gold-700 dark:text-gold-400' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {option.label}
                    </div>
                    <div className={`text-xs ${
                      isSelected 
                        ? 'text-gold-600 dark:text-gold-500' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Days Input - Luxury */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                Or enter custom number of days:
              </label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg ${
                  activeTab === 'extend' 
                    ? 'bg-gradient-gold text-white' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                }`}>
                  {activeTab === 'extend' ? (
                    <Plus size={16} />
                  ) : (
                    <Minus size={16} />
                  )}
                </div>
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  min="1"
                  max={activeTab === 'reduce' ? getMaxReducibleDays() : 3650}
                  placeholder="Enter days"
                  className="pl-16 pr-4 py-3 text-lg font-semibold border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-gold-400 dark:focus:border-gold-500 focus:ring-4 focus:ring-gold-100 dark:focus:ring-gold-900/30 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-luxury transition-all duration-300"
                  required
                  disabled={submitting}
                />
              </div>
              {activeTab === 'reduce' && (
                <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Maximum reducible: {getMaxReducibleDays()} days (cannot go below today's date)
                </p>
              )}
            </div>
          </div>

          {/* Preview New End Date - Luxury Card */}
          {days && parseInt(days) > 0 && (
            <div className={`mb-6 p-5 border-2 rounded-xl shadow-luxury-lg animate-slide-up ${
              activeTab === 'extend' 
                ? 'bg-gradient-to-br from-gold-50 via-amber-50 to-yellow-50 border-gold-300 dark:from-gold-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 dark:border-gold-700' 
                : 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-300 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 dark:border-amber-700'
            }`}>
              <h4 className={`font-bold text-lg mb-4 flex items-center gap-2 ${
                activeTab === 'extend' ? 'text-gold-900 dark:text-gold-400' : 'text-amber-900 dark:text-amber-400'
              }`}>
                <CheckCircle size={20} />
                Preview Changes:
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                  <span className={`font-medium ${activeTab === 'extend' ? 'text-gold-700 dark:text-gold-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {activeTab === 'extend' ? 'Extension' : 'Reduction'} Period:
                  </span>
                  <span className={`font-bold text-base ${
                    activeTab === 'extend' ? 'text-gold-900 dark:text-gold-300' : 'text-amber-900 dark:text-amber-300'
                  }`}>
                    {days} days
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                  <span className={`font-medium ${activeTab === 'extend' ? 'text-gold-700 dark:text-gold-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {isExpired && activeTab === 'extend' ? 'Start Date:' : 'Current End Date:'}
                  </span>
                  <span className={`font-bold ${
                    activeTab === 'extend' ? 'text-gold-900 dark:text-gold-300' : 'text-amber-900 dark:text-amber-300'
                  }`}>
                    {(isExpired && activeTab === 'extend' ? new Date() : currentEndDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                  activeTab === 'extend' 
                    ? 'border-gold-400 bg-gradient-to-r from-gold-100 to-amber-100 dark:from-gold-900/40 dark:to-amber-900/40 dark:border-gold-600' 
                    : 'border-amber-400 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 dark:border-amber-600'
                }`}>
                  <span className={`font-bold ${activeTab === 'extend' ? 'text-gold-800 dark:text-gold-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    New End Date:
                  </span>
                  <span className={`font-bold text-lg ${
                    activeTab === 'extend' ? 'text-gold-900 dark:text-gold-200' : 'text-amber-900 dark:text-amber-200'
                  }`}>
                    {calculateNewEndDate().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm">
                  <span className={`font-medium ${activeTab === 'extend' ? 'text-gold-700 dark:text-gold-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    Total Days from Now:
                  </span>
                  <span className={`font-bold text-xl ${
                    activeTab === 'extend' ? 'text-gold-900 dark:text-gold-300' : 'text-amber-900 dark:text-amber-300'
                  }`}>
                    {Math.max(0, Math.ceil((calculateNewEndDate() - new Date()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Subscription History - Luxury */}
          {shop.subscription?.history && shop.subscription.history.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gold-600 dark:text-gold-400" />
                Recent Subscription History
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gold-400 scrollbar-track-slate-200 dark:scrollbar-track-slate-800">
                {shop.subscription.history.slice(-5).reverse().map((record, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {record.days > 0 ? (
                            <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Minus size={16} className="text-red-600 dark:text-red-400" />
                          )}
                          {record.days > 0 ? 'Extended' : 'Reduced'} by {Math.abs(record.days)} days
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {new Date(record.renewedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                          {new Date(record.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message - Luxury */}
          <div className={`mb-6 p-5 border-2 rounded-xl shadow-luxury backdrop-blur-sm ${
            activeTab === 'extend' 
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-700' 
              : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-700'
          }`}>
            <div className="flex gap-3">
              <AlertTriangle size={22} className={`flex-shrink-0 mt-0.5 ${
                activeTab === 'extend' ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'
              }`} />
              <div className={`text-sm ${
                activeTab === 'extend' ? 'text-yellow-900 dark:text-yellow-200' : 'text-orange-900 dark:text-orange-200'
              }`}>
                <p className="font-bold mb-2 text-base">Important Information:</p>
                <ul className="space-y-2">
                  {activeTab === 'extend' ? (
                    <>
                      {isExpired ? (
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                          <span>Shop is currently inactive due to expired subscription</span>
                        </li>
                      ) : (
                        <li className="flex items-start gap-2">
                          <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                          <span>Days will be added to the current end date</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                        <span>Shop will be automatically reactivated after extension</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                        <span>Shop admin will see the new expiration date on their dashboard</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                        <span>Days will be subtracted from the current end date</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                        <span>Cannot reduce subscription below today's date</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                        <span>Shop admin will see the updated expiration date immediately</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                        <span>If reduced to today, shop may be deactivated at midnight</span>
                      </li>
                    </>
                  )}
                  <li className="flex items-start gap-2">
                    <span className={activeTab === 'extend' ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'} style={{marginTop: '2px'}}>•</span>
                    <span>Warning will be shown {shop.subscription?.warningDays || 7} days before expiry</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Actions - Luxury Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !days || parseInt(days) < 1 || (activeTab === 'reduce' && parseInt(days) > getMaxReducibleDays())}
              loading={submitting}
              className="px-6 py-3 font-bold rounded-xl bg-gradient-gold hover:shadow-gold transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
            >
              {activeTab === 'extend' ? (
                <>
                  <Plus size={18} className="mr-2 inline" />
                  Extend by {days || 0} Days
                </>
              ) : (
                <>
                  <Minus size={18} className="mr-2 inline" />
                  Reduce by {days || 0} Days
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SubscriptionModal;