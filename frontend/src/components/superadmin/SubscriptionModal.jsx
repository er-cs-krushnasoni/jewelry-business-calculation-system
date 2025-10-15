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
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Manage Subscription
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

      <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
        {/* Shop Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{shop.shopName}</h3>
          <p className="text-sm text-gray-600">Code: {shop.shopCode}</p>
        </div>

        {/* Current Status */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${getStatusColor(subscriptionStatus)}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              {subscriptionStatus === 'expired' && <AlertTriangle size={20} />}
              {subscriptionStatus === 'warning' && <Clock size={20} />}
              {subscriptionStatus === 'active' && <CheckCircle size={20} />}
              Current Subscription Status
            </h4>
          </div>

          {shop.subscription?.endDate ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current End Date:</span>
                <span className="font-medium">
                  {currentEndDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Days Remaining:</span>
                <span className="font-bold text-lg">
                  {getDaysRemaining()} days
                </span>
              </div>
              {isExpired && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <AlertTriangle size={16} className="inline mr-1" />
                  Subscription has expired. Extend to reactivate shop.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subscription set for this shop</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('extend');
                setDays('30');
              }}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'extend'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus size={16} className="inline mr-1" />
              Extend Subscription
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reduce');
                setDays('7');
              }}
              disabled={!shop.subscription?.endDate || isExpired}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'reduce'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Minus size={16} className="inline mr-1" />
              Reduce Subscription
            </button>
          </div>
        </div>

        {/* Subscription Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {activeTab === 'extend' ? 'Extend Subscription By:' : 'Reduce Subscription By:'}
            </label>

            {/* Quick Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {quickOptions.map((option) => {
                const isDisabled = activeTab === 'reduce' && option.value > getMaxReducibleDays();
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDays(option.value.toString())}
                    disabled={submitting || isDisabled}
                    className={`p-3 border-2 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      parseInt(days) === option.value
                        ? activeTab === 'extend'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Days Input */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Or enter custom number of days:
              </label>
              <div className="relative">
                {activeTab === 'extend' ? (
                  <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                ) : (
                  <Minus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                )}
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  min="1"
                  max={activeTab === 'reduce' ? getMaxReducibleDays() : 3650}
                  placeholder="Enter days"
                  className="pl-10"
                  required
                  disabled={submitting}
                />
              </div>
              {activeTab === 'reduce' && (
                <p className="mt-1 text-xs text-orange-600">
                  Maximum reducible: {getMaxReducibleDays()} days (cannot go below today's date)
                </p>
              )}
            </div>
          </div>

          {/* Preview New End Date */}
          {days && parseInt(days) > 0 && (
            <div className={`mb-6 p-4 border-2 rounded-lg ${
              activeTab === 'extend' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                activeTab === 'extend' ? 'text-blue-900' : 'text-orange-900'
              }`}>
                Preview:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={activeTab === 'extend' ? 'text-blue-700' : 'text-orange-700'}>
                    {activeTab === 'extend' ? 'Extension' : 'Reduction'} Period:
                  </span>
                  <span className={`font-medium ${
                    activeTab === 'extend' ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    {days} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={activeTab === 'extend' ? 'text-blue-700' : 'text-orange-700'}>
                    {isExpired && activeTab === 'extend' ? 'Start Date:' : 'Current End Date:'}
                  </span>
                  <span className={`font-medium ${
                    activeTab === 'extend' ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    {(isExpired && activeTab === 'extend' ? new Date() : currentEndDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={`flex justify-between pt-2 border-t ${
                  activeTab === 'extend' ? 'border-blue-300' : 'border-orange-300'
                }`}>
                  <span className={activeTab === 'extend' ? 'text-blue-700' : 'text-orange-700'}>
                    New End Date:
                  </span>
                  <span className={`font-bold ${
                    activeTab === 'extend' ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    {calculateNewEndDate().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={activeTab === 'extend' ? 'text-blue-700' : 'text-orange-700'}>
                    Total Days from Now:
                  </span>
                  <span className={`font-bold ${
                    activeTab === 'extend' ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    {Math.max(0, Math.ceil((calculateNewEndDate() - new Date()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Subscription History */}
          {shop.subscription?.history && shop.subscription.history.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Recent Subscription History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shop.subscription.history.slice(-5).reverse().map((record, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.days > 0 ? 'Extended' : 'Reduced'} by {Math.abs(record.days)} days
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.renewedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">
                          {new Date(record.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className={`mb-6 p-4 border-2 rounded-lg ${
            activeTab === 'extend' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex gap-2">
              <AlertTriangle size={20} className={`flex-shrink-0 mt-0.5 ${
                activeTab === 'extend' ? 'text-yellow-600' : 'text-orange-600'
              }`} />
              <div className={`text-sm ${
                activeTab === 'extend' ? 'text-yellow-800' : 'text-orange-800'
              }`}>
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  {activeTab === 'extend' ? (
                    <>
                      {isExpired ? (
                        <li>Shop is currently inactive due to expired subscription</li>
                      ) : (
                        <li>Days will be added to the current end date</li>
                      )}
                      <li>Shop will be automatically reactivated after extension</li>
                      <li>Shop admin will see the new expiration date on their dashboard</li>
                    </>
                  ) : (
                    <>
                      <li>Days will be subtracted from the current end date</li>
                      <li>Cannot reduce subscription below today's date</li>
                      <li>Shop admin will see the updated expiration date immediately</li>
                      <li>If reduced to today, shop may be deactivated at midnight</li>
                    </>
                  )}
                  <li>Warning will be shown {shop.subscription?.warningDays || 7} days before expiry</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
              disabled={submitting || !days || parseInt(days) < 1 || (activeTab === 'reduce' && parseInt(days) > getMaxReducibleDays())}
              loading={submitting}
            >
              {activeTab === 'extend' ? (
                <>
                  <Plus size={16} className="mr-1" />
                  Extend by {days || 0} Days
                </>
              ) : (
                <>
                  <Minus size={16} className="mr-1" />
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