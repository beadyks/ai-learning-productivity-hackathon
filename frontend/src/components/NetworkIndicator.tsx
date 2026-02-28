/**
 * Network Indicator Component
 * Displays current network status and quality
 * Requirements: 1.5, 13.2
 */

import React from 'react';
import { useNetworkMonitor } from '../hooks/useNetworkMonitor';

export const NetworkIndicator: React.FC = () => {
  const {
    isOnline,
    quality,
    effectiveType,
    shouldEnableLowBandwidthMode,
  } = useNetworkMonitor();

  if (!isOnline) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Offline</strong>
        <span className="block sm:inline"> You're currently offline. Some features may be limited.</span>
      </div>
    );
  }

  if (shouldEnableLowBandwidthMode) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Slow Connection</strong>
        <span className="block sm:inline"> Low bandwidth mode enabled to save data.</span>
      </div>
    );
  }

  // Show quality indicator for debugging/development
  const qualityColors = {
    excellent: 'bg-green-100 border-green-400 text-green-700',
    good: 'bg-blue-100 border-blue-400 text-blue-700',
    fair: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    poor: 'bg-orange-100 border-orange-400 text-orange-700',
    offline: 'bg-red-100 border-red-400 text-red-700',
  };

  return (
    <div className={`${qualityColors[quality]} border px-4 py-2 rounded text-sm`}>
      Network: {quality} ({effectiveType})
    </div>
  );
};

export default NetworkIndicator;
