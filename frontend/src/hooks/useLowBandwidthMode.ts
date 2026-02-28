/**
 * useLowBandwidthMode Hook
 * Manages low-bandwidth mode state and optimizations
 * Requirements: 10.4, 10.5
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkMonitor } from './useNetworkMonitor';

export interface LowBandwidthSettings {
  enabled: boolean;
  autoDetect: boolean;
  disableImages: boolean;
  disableAnimations: boolean;
  disableAutoplay: boolean;
  reduceImageQuality: boolean;
}

const DEFAULT_SETTINGS: LowBandwidthSettings = {
  enabled: false,
  autoDetect: true,
  disableImages: false,
  disableAnimations: true,
  disableAutoplay: true,
  reduceImageQuality: true,
};

const STORAGE_KEY = 'low-bandwidth-settings';

/**
 * Hook for managing low-bandwidth mode
 * Automatically detects slow networks and applies optimizations
 */
export const useLowBandwidthMode = () => {
  const networkMonitor = useNetworkMonitor();
  const networkInfo = {
    isOnline: networkMonitor.isOnline,
    quality: networkMonitor.quality,
    effectiveType: networkMonitor.effectiveType,
    downlink: networkMonitor.downlink,
    rtt: networkMonitor.rtt,
    saveData: networkMonitor.saveData,
  };
  
  const [settings, setSettings] = useState<LowBandwidthSettings>(() => {
    // Load settings from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load low-bandwidth settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  // Auto-detect slow network and enable low-bandwidth mode
  useEffect(() => {
    if (!settings.autoDetect) return;

    const shouldEnable =
      networkInfo.quality === 'poor' ||
      networkInfo.quality === 'fair' ||
      networkInfo.saveData ||
      !networkInfo.isOnline;

    if (shouldEnable !== settings.enabled) {
      setSettings((prev) => ({ ...prev, enabled: shouldEnable }));
    }
  }, [networkInfo, settings.autoDetect, settings.enabled]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save low-bandwidth settings:', error);
    }
  }, [settings]);

  // Toggle low-bandwidth mode
  const toggleEnabled = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled,
      autoDetect: false, // Disable auto-detect when manually toggled
    }));
  }, []);

  // Enable low-bandwidth mode
  const enable = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: true }));
  }, []);

  // Disable low-bandwidth mode
  const disable = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: false }));
  }, []);

  // Update specific setting
  const updateSetting = useCallback(
    <K extends keyof LowBandwidthSettings>(key: K, value: LowBandwidthSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Reset to defaults
  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Get optimization recommendations
  const getOptimizations = useCallback(() => {
    if (!settings.enabled) {
      return {
        shouldLoadImages: true,
        shouldPlayAnimations: true,
        shouldAutoplay: true,
        imageQuality: 'high' as const,
        maxImageSize: Infinity,
      };
    }

    return {
      shouldLoadImages: !settings.disableImages,
      shouldPlayAnimations: !settings.disableAnimations,
      shouldAutoplay: !settings.disableAutoplay,
      imageQuality: settings.reduceImageQuality ? ('low' as const) : ('medium' as const),
      maxImageSize: 500 * 1024, // 500KB max in low-bandwidth mode
    };
  }, [settings]);

  // Calculate estimated data savings
  const getEstimatedSavings = useCallback(() => {
    if (!settings.enabled) return 0;

    let savings = 0;
    if (settings.disableImages) savings += 70; // ~70% savings
    if (settings.reduceImageQuality) savings += 40; // ~40% savings
    if (settings.disableAnimations) savings += 10; // ~10% savings
    if (settings.disableAutoplay) savings += 20; // ~20% savings

    return Math.min(savings, 90); // Cap at 90%
  }, [settings]);

  return {
    settings,
    isEnabled: settings.enabled,
    toggleEnabled,
    enable,
    disable,
    updateSetting,
    reset,
    getOptimizations,
    getEstimatedSavings,
    networkInfo,
  };
};
