/**
 * useNetworkMonitor Hook
 * React hook for monitoring network state and quality
 * Requirements: 1.5, 13.2
 */

import { useEffect, useState } from 'react';
import { networkMonitor, type NetworkInfo } from '../services/networkMonitor';

/**
 * Hook to monitor network state and quality
 * Returns current network information and updates on changes
 */
export const useNetworkMonitor = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() =>
    networkMonitor.getCurrentNetworkInfo()
  );

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkMonitor.subscribe(setNetworkInfo);

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return {
    ...networkInfo,
    isSuitableForHeavyOperations: networkMonitor.isSuitableForHeavyOperations(),
    shouldEnableLowBandwidthMode: networkMonitor.shouldEnableLowBandwidthMode(),
    recommendedImageQuality: networkMonitor.getRecommendedImageQuality(),
    recommendedTimeout: networkMonitor.getRecommendedTimeout(),
  };
};

/**
 * Hook to get only online/offline state
 * Lighter alternative when detailed network info is not needed
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((info) => {
      setIsOnline(info.isOnline);
    });

    return unsubscribe;
  }, []);

  return isOnline;
};
