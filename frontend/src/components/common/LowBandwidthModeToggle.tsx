/**
 * LowBandwidthModeToggle Component
 * UI for toggling and configuring low-bandwidth mode
 * Requirements: 10.4, 10.5
 */

import React, { useState } from 'react';
import { useLowBandwidthMode } from '../../hooks/useLowBandwidthMode';

export interface LowBandwidthModeToggleProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * Toggle and settings for low-bandwidth mode
 * Displays network status and estimated data savings
 */
export const LowBandwidthModeToggle: React.FC<LowBandwidthModeToggleProps> = ({
  showDetails = false,
  className = '',
}) => {
  const {
    settings,
    isEnabled,
    toggleEnabled,
    updateSetting,
    getEstimatedSavings,
    networkInfo,
  } = useLowBandwidthMode();
  const [showSettings, setShowSettings] = useState(false);

  // Get network quality color
  const getQualityColor = () => {
    switch (networkInfo.quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-orange-600';
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get network quality icon
  const getQualityIcon = () => {
    switch (networkInfo.quality) {
      case 'excellent':
      case 'good':
        return '📶';
      case 'fair':
        return '📡';
      case 'poor':
        return '📉';
      case 'offline':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className={`low-bandwidth-toggle ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label="Network status">
            {getQualityIcon()}
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Low-Bandwidth Mode</span>
              {settings.autoDetect && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Auto
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className={`${getQualityColor()} font-medium`}>
                {networkInfo.quality.charAt(0).toUpperCase() + networkInfo.quality.slice(1)}
              </span>
              {networkInfo.effectiveType !== 'unknown' && (
                <span className="text-gray-500">• {networkInfo.effectiveType.toUpperCase()}</span>
              )}
              {isEnabled && (
                <span className="text-green-600">• ~{getEstimatedSavings()}% data saved</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={isEnabled}
          aria-label="Toggle low-bandwidth mode"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Detailed Settings */}
      {showDetails && (
        <div className="mt-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showSettings ? '▼' : '▶'} Advanced Settings
          </button>

          {showSettings && (
            <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
              {/* Auto-detect */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Auto-detect slow network</span>
                <input
                  type="checkbox"
                  checked={settings.autoDetect}
                  onChange={(e) => updateSetting('autoDetect', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </label>

              {/* Disable Images */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Disable images</span>
                <input
                  type="checkbox"
                  checked={settings.disableImages}
                  onChange={(e) => updateSetting('disableImages', e.target.checked)}
                  disabled={!isEnabled}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </label>

              {/* Reduce Image Quality */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Reduce image quality</span>
                <input
                  type="checkbox"
                  checked={settings.reduceImageQuality}
                  onChange={(e) => updateSetting('reduceImageQuality', e.target.checked)}
                  disabled={!isEnabled || settings.disableImages}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </label>

              {/* Disable Animations */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Disable animations</span>
                <input
                  type="checkbox"
                  checked={settings.disableAnimations}
                  onChange={(e) => updateSetting('disableAnimations', e.target.checked)}
                  disabled={!isEnabled}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </label>

              {/* Disable Autoplay */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Disable autoplay</span>
                <input
                  type="checkbox"
                  checked={settings.disableAutoplay}
                  onChange={(e) => updateSetting('disableAutoplay', e.target.checked)}
                  disabled={!isEnabled}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                />
              </label>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <p className="font-medium">💡 Tip</p>
                <p className="mt-1">
                  Low-bandwidth mode reduces data usage by optimizing images, disabling animations,
                  and preventing autoplay. Perfect for slow connections or limited data plans.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
