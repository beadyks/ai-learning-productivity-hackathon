/**
 * Network Monitor Service
 * Monitors network connectivity and quality
 * Requirements: 1.5, 13.2
 */

import { useCacheStore } from '../stores/cacheStore';
import { cacheService } from './cacheService';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
export type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';

export interface NetworkInfo {
  isOnline: boolean;
  quality: NetworkQuality;
  effectiveType: ConnectionType;
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData: boolean;
}

/**
 * Network Monitor class
 * Monitors online/offline state and network quality
 */
class NetworkMonitor {
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

  /**
   * Initialize network monitoring
   */
  initialize(): () => void {
    // Set initial online state
    this.updateOnlineState(navigator.onLine);

    // Add online/offline event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Monitor network information changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }

    // Start periodic quality checks
    this.startQualityChecks();

    // Initial quality check
    this.checkNetworkQuality();

    // Return cleanup function
    return () => {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', this.handleConnectionChange);
      }

      this.stopQualityChecks();
      this.listeners.clear();
    };
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.updateOnlineState(true);
    this.checkNetworkQuality();

    // Process queued requests when coming back online
    cacheService.processQueue().catch((error) => {
      console.error('Failed to process queue:', error);
    });
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.updateOnlineState(false);
    this.notifyListeners(this.getCurrentNetworkInfo());
  };

  /**
   * Handle connection change
   */
  private handleConnectionChange = (): void => {
    this.checkNetworkQuality();
  };

  /**
   * Update online state in store
   */
  private updateOnlineState(isOnline: boolean): void {
    useCacheStore.getState().setOnline(isOnline);
  }

  /**
   * Start periodic quality checks
   */
  private startQualityChecks(): void {
    if (this.checkInterval !== null) return;

    this.checkInterval = window.setInterval(() => {
      this.checkNetworkQuality();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop periodic quality checks
   */
  private stopQualityChecks(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check network quality
   */
  private async checkNetworkQuality(): Promise<void> {
    const info = this.getCurrentNetworkInfo();
    this.notifyListeners(info);
  }

  /**
   * Get current network information
   */
  getCurrentNetworkInfo(): NetworkInfo {
    const isOnline = navigator.onLine;

    if (!isOnline) {
      return {
        isOnline: false,
        quality: 'offline',
        effectiveType: 'unknown',
        saveData: false,
      };
    }

    // Get connection information if available
    const connection = (navigator as any).connection;
    const effectiveType = this.getEffectiveType(connection);
    const downlink = connection?.downlink;
    const rtt = connection?.rtt;
    const saveData = connection?.saveData || false;

    // Determine quality based on connection info
    const quality = this.determineQuality(effectiveType, downlink, rtt);

    return {
      isOnline,
      quality,
      effectiveType,
      downlink,
      rtt,
      saveData,
    };
  }

  /**
   * Get effective connection type
   */
  private getEffectiveType(connection: any): ConnectionType {
    if (!connection) return 'unknown';

    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case '4g':
        return '4g';
      case '3g':
        return '3g';
      case '2g':
        return '2g';
      case 'slow-2g':
        return 'slow-2g';
      default:
        // Check if on WiFi
        if (connection.type === 'wifi') return 'wifi';
        return 'unknown';
    }
  }

  /**
   * Determine network quality
   */
  private determineQuality(
    effectiveType: ConnectionType,
    downlink?: number,
    rtt?: number
  ): NetworkQuality {
    // Use effective type as primary indicator
    switch (effectiveType) {
      case '4g':
      case 'wifi':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
        return 'fair';
      case 'slow-2g':
        return 'poor';
      default:
        break;
    }

    // Fall back to downlink and RTT if available
    if (downlink !== undefined && rtt !== undefined) {
      if (downlink >= 5 && rtt < 100) return 'excellent';
      if (downlink >= 1.5 && rtt < 300) return 'good';
      if (downlink >= 0.5 && rtt < 600) return 'fair';
      return 'poor';
    }

    // Default to good if online but no detailed info
    return 'good';
  }

  /**
   * Subscribe to network changes
   */
  subscribe(listener: (info: NetworkInfo) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state
    listener(this.getCurrentNetworkInfo());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(info: NetworkInfo): void {
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  /**
   * Check if network is suitable for heavy operations
   */
  isSuitableForHeavyOperations(): boolean {
    const info = this.getCurrentNetworkInfo();
    return info.isOnline && (info.quality === 'excellent' || info.quality === 'good');
  }

  /**
   * Check if low-bandwidth mode should be enabled
   */
  shouldEnableLowBandwidthMode(): boolean {
    const info = this.getCurrentNetworkInfo();
    return (
      !info.isOnline ||
      info.quality === 'poor' ||
      info.quality === 'fair' ||
      info.saveData
    );
  }

  /**
   * Get recommended image quality based on network
   */
  getRecommendedImageQuality(): 'high' | 'medium' | 'low' {
    const info = this.getCurrentNetworkInfo();

    if (!info.isOnline || info.quality === 'poor') return 'low';
    if (info.quality === 'fair' || info.saveData) return 'medium';
    return 'high';
  }

  /**
   * Get recommended timeout for API requests
   */
  getRecommendedTimeout(): number {
    const info = this.getCurrentNetworkInfo();

    switch (info.quality) {
      case 'excellent':
        return 10000; // 10 seconds
      case 'good':
        return 20000; // 20 seconds
      case 'fair':
        return 30000; // 30 seconds
      case 'poor':
        return 45000; // 45 seconds
      case 'offline':
        return 5000; // 5 seconds (quick fail)
      default:
        return 30000;
    }
  }
}

// Create and export singleton instance
export const networkMonitor = new NetworkMonitor();

// Export class for testing
export { NetworkMonitor };
