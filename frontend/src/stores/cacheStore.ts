/**
 * Cache Store - Zustand state management for offline state
 * Manages online/offline status, queued requests, and storage usage
 * Requirements: 1.3, 9.1, 9.2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CacheState,
  CacheActions,
  QueuedRequest,
  StorageEstimate,
} from '../types/cache.types';

type CacheStore = CacheState & CacheActions;

/**
 * Cache store for managing offline state and request queueing
 * Persists queued requests to localStorage for offline support
 */
export const useCacheStore = create<CacheStore>()(
  persist(
    (set) => ({
      // Initial state
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      queuedRequests: [],
      storageUsage: {
        usage: 0,
        quota: 0,
        percentUsed: 0,
      },
      lastSync: null,

      // Actions
      setOnline: (isOnline: boolean) =>
        set({ isOnline }),

      addQueuedRequest: (request: QueuedRequest) =>
        set((state) => ({
          queuedRequests: [...state.queuedRequests, request],
        })),

      removeQueuedRequest: (id: string) =>
        set((state) => ({
          queuedRequests: state.queuedRequests.filter((req) => req.id !== id),
        })),

      updateStorageUsage: (usage: StorageEstimate) =>
        set({ storageUsage: usage }),

      setLastSync: (date: Date) =>
        set({ lastSync: date }),
    }),
    {
      name: 'cache-storage', // localStorage key
      partialize: (state) => ({
        // Persist queued requests and last sync time
        queuedRequests: state.queuedRequests,
        lastSync: state.lastSync,
      }),
    }
  )
);

/**
 * Initialize online/offline event listeners
 * Call this once when the app starts
 * @deprecated Use networkMonitor.initialize() instead for enhanced monitoring
 */
export const initializeNetworkListeners = () => {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    useCacheStore.getState().setOnline(true);
  };

  const handleOffline = () => {
    useCacheStore.getState().setOnline(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
