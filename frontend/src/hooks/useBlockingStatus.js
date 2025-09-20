import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const useBlockingStatus = (pollingInterval = 60000) => { // 1 minute default
  const { user } = useAuth();
  const [blockingInfo, setBlockingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user has a shop (not super_admin)
  const hasShop = user && user.role !== 'super_admin';

  // Check blocking status
  const checkBlockingStatus = useCallback(async (showLoading = false) => {
    if (!hasShop) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await api.get('/rates/blocking-status');
      
      if (response.data.success) {
        setBlockingInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error checking blocking status:', err);
      setError(err.response?.data?.message || 'Failed to check blocking status');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [hasShop]);

  // Initial load
  useEffect(() => {
    checkBlockingStatus(true);
  }, [checkBlockingStatus]);

  // Set up polling
  useEffect(() => {
    if (!hasShop || !pollingInterval) return;

    const interval = setInterval(() => {
      checkBlockingStatus(false);
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [hasShop, pollingInterval, checkBlockingStatus]);

  // Manual refresh
  const refreshStatus = useCallback(() => {
    return checkBlockingStatus(true);
  }, [checkBlockingStatus]);

  return {
    isBlocked: blockingInfo?.isBlocked || false,
    blockingInfo,
    loading,
    error,
    refreshStatus,
    hasShop
  };
};

export default useBlockingStatus;