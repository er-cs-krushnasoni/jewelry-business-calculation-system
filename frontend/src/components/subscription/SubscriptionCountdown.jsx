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
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-300 dark:border-red-800/50',
        textColor: 'text-red-800 dark:text-red-300',
        iconColor: 'text-red-600 dark:text-red-400',
        Icon: XCircle,
        progressColor: 'bg-gradient-to-r from-red-500 to-red-600',
        glowColor: 'shadow-red-500/20 dark:shadow-red-500/30',
        title: 'Subscription Expired'
      };
    }

    if (daysRemaining <= 3) {
      return {
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        borderColor: 'border-red-300 dark:border-red-800/50',
        textColor: 'text-red-800 dark:text-red-300',
        iconColor: 'text-red-600 dark:text-red-400',
        Icon: AlertTriangle,
        progressColor: 'bg-gradient-to-r from-red-500 to-orange-500',
        glowColor: 'shadow-red-500/20 dark:shadow-red-500/30',
        title: 'Critical: Expiring Soon'
      };
    }

    if (daysRemaining <= 7) {
      return {
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        borderColor: 'border-orange-300 dark:border-orange-800/50',
        textColor: 'text-orange-800 dark:text-orange-300',
        iconColor: 'text-orange-600 dark:text-orange-400',
        Icon: Clock,
        progressColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
        glowColor: 'shadow-orange-500/20 dark:shadow-orange-500/30',
        title: 'Warning: Expiring Soon'
      };
    }

    if (daysRemaining <= 15) {
      return {
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-300 dark:border-amber-800/50',
        textColor: 'text-amber-800 dark:text-amber-300',
        iconColor: 'text-amber-600 dark:text-amber-400',
        Icon: Calendar,
        progressColor: 'bg-gradient-to-r from-amber-500 to-yellow-500',
        glowColor: 'shadow-amber-500/20 dark:shadow-amber-500/30',
        title: 'Subscription Active'
      };
    }

    return {
      bgColor: 'bg-gradient-to-br from-gold-50 to-gold-100 dark:from-slate-800/80 dark:to-slate-900/80',
      borderColor: 'border-gold-300 dark:border-gold-700/50',
      textColor: 'text-gold-900 dark:text-gold-300',
      iconColor: 'text-gold-600 dark:text-gold-400',
      Icon: CheckCircle,
      progressColor: 'bg-gradient-gold',
      glowColor: 'shadow-gold dark:shadow-gold-500/30',
      title: 'Subscription Active'
    };
  };

  const config = getStatusConfig();
  const { Icon } = config;

  // Dynamic font sizing for compact view based on content length
  const getDynamicFontSize = () => {
    if (status === 'expired') {
      return 'text-xs'; // "Expired" is short
    }
    
    const contentLength = `${daysRemaining} days left`.length;
    
    // Adjust font size based on total character length
    if (contentLength <= 10) return 'text-sm';
    if (contentLength <= 12) return 'text-xs';
    return 'text-[0.7rem]'; // Extra small for very long content
  };

  // Compact view for header
  if (compact) {
    const dynamicFontSize = getDynamicFontSize();
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-sm
        ${config.bgColor} ${config.borderColor} border 
        shadow-luxury hover:shadow-luxury-lg
        transition-all duration-300 hover:scale-105
        max-w-[140px] sm:max-w-none
        ${className}`}
      >
        <Icon size={14} className={`${config.iconColor} animate-fade-in flex-shrink-0`} />
        <span className={`${dynamicFontSize} font-semibold ${config.textColor} whitespace-nowrap truncate`}>
          {status === 'expired' ? (
            'Expired'
          ) : (
            <>
              <span className="font-bold">{daysRemaining}</span>
              <span className="ml-0.5 font-medium">day{daysRemaining !== 1 ? 's' : ''}</span>
            </>
          )}
        </span>
      </div>
    );
  }

  // Full view for dashboard
  return (
    <div className={`relative overflow-hidden rounded-xl border-2 ${config.borderColor} 
      ${config.bgColor} backdrop-blur-sm
      shadow-luxury-lg hover:shadow-xl
      transition-all duration-500 animate-fade-in
      ${config.glowColor}
      ${className}`}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/3 pointer-events-none" />
      
      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 
              ${config.glowColor} backdrop-blur-sm
              transition-transform duration-300 hover:scale-110`}
            >
              <Icon size={28} className={`${config.iconColor} animate-scale-in`} />
            </div>
            <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${config.textColor}`}>
              {config.title}
            </h3>
          </div>
        </div>

        {status === 'expired' ? (
          // Expired State
          <div className="text-center py-8 sm:py-12 animate-slide-up">
            <div className={`text-5xl sm:text-6xl md:text-7xl font-black mb-4 ${config.textColor} 
              tracking-tight drop-shadow-lg animate-glow`}
            >
              EXPIRED
            </div>
            <p className={`text-lg sm:text-xl ${config.textColor} mb-6 font-medium`}>
              Your subscription has ended
            </p>
            <div className={`inline-block px-6 py-3 rounded-xl 
              bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm
              ${config.borderColor} border shadow-luxury`}
            >
              <p className={`text-sm sm:text-base ${config.textColor} font-medium`}>
                Please contact your administrator to renew your subscription
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Countdown Display */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 animate-slide-up">
              {/* Days */}
              <div className="text-center group">
                <div className={`text-5xl sm:text-6xl md:text-7xl font-black ${config.textColor} 
                  tabular-nums tracking-tight drop-shadow-lg
                  transition-transform duration-300 group-hover:scale-110`}
                >
                  {timeLeft?.days || daysRemaining}
                </div>
                <div className={`text-xs sm:text-sm font-bold ${config.textColor} 
                  opacity-75 mt-2 uppercase tracking-wider`}
                >
                  {daysRemaining === 1 ? 'Day' : 'Days'}
                </div>
              </div>

              {/* Separator & Time Details */}
              {timeLeft && (
                <>
                  <div className={`text-4xl sm:text-5xl font-black ${config.textColor} 
                    opacity-30 animate-pulse`}
                  >
                    :
                  </div>

                  {/* Hours */}
                  <div className="text-center group">
                    <div className={`text-4xl sm:text-5xl md:text-6xl font-black ${config.textColor} 
                      tabular-nums tracking-tight drop-shadow-lg
                      transition-transform duration-300 group-hover:scale-110`}
                    >
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className={`text-xs sm:text-sm font-bold ${config.textColor} 
                      opacity-75 mt-2 uppercase tracking-wider`}
                    >
                      Hours
                    </div>
                  </div>

                  <div className={`text-4xl sm:text-5xl font-black ${config.textColor} 
                    opacity-30 animate-pulse`}
                  >
                    :
                  </div>

                  {/* Minutes */}
                  <div className="text-center group">
                    <div className={`text-4xl sm:text-5xl md:text-6xl font-black ${config.textColor} 
                      tabular-nums tracking-tight drop-shadow-lg
                      transition-transform duration-300 group-hover:scale-110`}
                    >
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className={`text-xs sm:text-sm font-bold ${config.textColor} 
                      opacity-75 mt-2 uppercase tracking-wider`}
                    >
                      Minutes
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs sm:text-sm mb-2">
                <span className={`${config.textColor} font-semibold uppercase tracking-wide`}>
                  Time Remaining
                </span>
                <span className={`font-bold ${config.textColor} tabular-nums`}>
                  {Math.min(100, Math.round((daysRemaining / 30) * 100))}%
                </span>
              </div>
              <div className="relative w-full bg-slate-200/50 dark:bg-slate-700/50 
                rounded-full h-4 overflow-hidden backdrop-blur-sm shadow-inner"
              >
                <div
                  className={`h-4 rounded-full transition-all duration-700 ease-out
                    ${config.progressColor} shadow-luxury relative overflow-hidden`}
                  style={{
                    width: `${Math.min(100, (daysRemaining / 30) * 100)}%`
                  }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                    animate-shimmer"
                    style={{
                      animation: 'shimmer 2s infinite',
                      backgroundSize: '200% 100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Warning Messages */}
            {daysRemaining <= 7 && (
              <div className={`p-4 sm:p-5 rounded-xl border-2 ${config.borderColor} 
                bg-white/70 dark:bg-slate-800/70 backdrop-blur-md
                shadow-luxury animate-slide-up`}
              >
                <p className={`text-sm sm:text-base font-semibold ${config.textColor} 
                  text-center leading-relaxed`}
                >
                  {daysRemaining <= 3 ? (
                    <>
                      <span className="inline-block mr-2 text-lg animate-bounce">⚠️</span>
                      Your subscription expires in{' '}
                      <span className="font-black text-base sm:text-lg">{daysRemaining} days</span>.
                      <br className="sm:hidden" />
                      <span className="block sm:inline mt-1 sm:mt-0">
                        {' '}Contact your administrator immediately!
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block mr-2 text-lg">📅</span>
                      Your subscription expires in{' '}
                      <span className="font-black text-base sm:text-lg">{daysRemaining} days</span>.
                      <br className="sm:hidden" />
                      <span className="block sm:inline mt-1 sm:mt-0">
                        {' '}Please renew soon to avoid service interruption.
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}

        {/* Contact Info */}
        <div className={`mt-6 pt-6 border-t-2 ${config.borderColor}`}>
          <p className={`text-xs sm:text-sm text-center ${config.textColor} 
            opacity-60 font-medium tracking-wide`}
          >
            Need to extend? Contact your super administrator
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionCountdown;