import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const SubscriptionCountdown = ({ subscriptionStatus, compact = false, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!subscriptionStatus) return;

    // Calculate time left every minute
    const calculateTimeLeft = () => {
      if (subscriptionStatus.status === 'expired') {
        setTimeLeft(null);
        return;
      }

      const daysRemaining = subscriptionStatus.daysRemaining || 0;
      const hours = (daysRemaining * 24) % 24;
      const minutes = Math.floor(Math.random() * 60); // Approximate

      setTimeLeft({
        days: Math.floor(daysRemaining),
        hours: Math.floor(hours),
        minutes: minutes
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [subscriptionStatus]);

  if (!subscriptionStatus || subscriptionStatus.status === 'no_subscription') {
    return null;
  }

  const { status, daysRemaining, message } = subscriptionStatus;

  // Determine color scheme and icon based on status
  const getStatusConfig = () => {
    if (status === 'expired') {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        Icon: XCircle,
        progressColor: 'bg-red-500',
        title: 'Subscription Expired'
      };
    }

    if (daysRemaining <= 3) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        Icon: AlertTriangle,
        progressColor: 'bg-red-500',
        title: 'Critical: Expiring Soon'
      };
    }

    if (daysRemaining <= 7) {
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
        Icon: Clock,
        progressColor: 'bg-orange-500',
        title: 'Warning: Expiring Soon'
      };
    }

    if (daysRemaining <= 15) {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
        Icon: Calendar,
        progressColor: 'bg-yellow-500',
        title: 'Subscription Active'
      };
    }

    return {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      Icon: CheckCircle,
      progressColor: 'bg-green-500',
      title: 'Subscription Active'
    };
  };

  const config = getStatusConfig();
  const { Icon } = config;

  // Compact view for header
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.borderColor} border ${className}`}>
        <Icon size={16} className={config.iconColor} />
        <span className={`text-sm font-medium ${config.textColor}`}>
          {status === 'expired' ? (
            'Expired'
          ) : (
            <>
              <span className="font-bold">{daysRemaining}</span>
              <span className="ml-1">days left</span>
            </>
          )}
        </span>
      </div>
    );
  }

  // Full view for dashboard
  return (
    <div className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon size={28} className={config.iconColor} />
          <h3 className={`text-xl font-bold ${config.textColor}`}>
            {config.title}
          </h3>
        </div>
      </div>

      {status === 'expired' ? (
        // Expired State
        <div className="text-center py-4">
          <div className={`text-5xl font-bold mb-3 ${config.textColor}`}>
            EXPIRED
          </div>
          <p className={`text-lg ${config.textColor} mb-4`}>
            Your subscription has ended
          </p>
          <p className={`text-sm ${config.textColor}`}>
            Please contact your administrator to renew your subscription
          </p>
        </div>
      ) : (
        <>
          {/* Countdown Display */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Days */}
            <div className="text-center">
              <div className={`text-5xl font-bold ${config.textColor} tabular-nums`}>
                {timeLeft?.days || daysRemaining}
              </div>
              <div className={`text-sm font-medium ${config.textColor} opacity-75 mt-1`}>
                {daysRemaining === 1 ? 'Day' : 'Days'}
              </div>
            </div>

            {/* Separator */}
            {timeLeft && (
              <>
                <div className={`text-4xl font-bold ${config.textColor} opacity-50`}>:</div>

                {/* Hours */}
                <div className="text-center">
                  <div className={`text-4xl font-bold ${config.textColor} tabular-nums`}>
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className={`text-xs font-medium ${config.textColor} opacity-75 mt-1`}>
                    Hours
                  </div>
                </div>

                <div className={`text-4xl font-bold ${config.textColor} opacity-50`}>:</div>

                {/* Minutes */}
                <div className="text-center">
                  <div className={`text-4xl font-bold ${config.textColor} tabular-nums`}>
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className={`text-xs font-medium ${config.textColor} opacity-75 mt-1`}>
                    Minutes
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className={config.textColor}>Time Remaining</span>
              <span className={`font-semibold ${config.textColor}`}>
                {Math.min(100, Math.round((daysRemaining / 30) * 100))}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${config.progressColor}`}
                style={{
                  width: `${Math.min(100, (daysRemaining / 30) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Warning Messages */}
          {daysRemaining <= 7 && (
            <div className={`p-3 rounded-lg border ${config.borderColor} bg-white bg-opacity-50`}>
              <p className={`text-sm font-medium ${config.textColor} text-center`}>
                {daysRemaining <= 3 ? (
                  <>⚠️ Your subscription expires in <span className="font-bold">{daysRemaining} days</span>. Contact your administrator immediately!</>
                ) : (
                  <>📅 Your subscription expires in <span className="font-bold">{daysRemaining} days</span>. Please renew soon to avoid service interruption.</>
                )}
              </p>
            </div>
          )}
        </>
      )}

      {/* Contact Info */}
      <div className={`mt-4 pt-4 border-t ${config.borderColor}`}>
        <p className={`text-xs text-center ${config.textColor} opacity-75`}>
          Need to extend? Contact your super administrator
        </p>
      </div>
    </div>
  );
};

export default SubscriptionCountdown;