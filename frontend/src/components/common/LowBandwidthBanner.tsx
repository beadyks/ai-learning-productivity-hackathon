/**
 * LowBandwidthBanner Component
 * Notification banner for low-bandwidth mode
 * Requirements: 10.4, 10.5
 */

import React, { useState, useEffect } from 'react';
import { useLowBandwidthMode } from '../../hooks/useLowBandwidthMode';

/**
 * Banner that appears when low-bandwidth mode is auto-enabled
 * Can be dismissed by the user
 */
export const LowBandwidthBanner: React.FC = () => {
  const { isEnabled, settings, disable, getEstimatedSavings } = useLowBandwidthMode();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Show banner when auto-enabled
  useEffect(() => {
    if (isEnabled && settings.autoDetect && !isDismissed) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [isEnabled, settings.autoDetect, isDismissed]);

  // Reset dismissed state when mode is disabled
  useEffect(() => {
    if (!isEnabled) {
      setIsDismissed(false);
    }
  }, [isEnabled]);

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 shadow-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1">
            <span className="flex p-2 rounded-lg bg-yellow-100">
              <svg
                className="h-5 w-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Low-bandwidth mode enabled
              </p>
              <p className="text-sm text-yellow-700">
                We detected a slow connection and optimized the experience to save ~
                {getEstimatedSavings()}% data.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <button
              onClick={() => {
                disable();
                setIsDismissed(true);
              }}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              Disable
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-yellow-600 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded p-1"
              aria-label="Dismiss banner"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
