/**
 * Cache Service
 * Client-side caching using Cache API and IndexedDB for offline support
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import type {
  CacheService,
  QueuedRequest,
  StorageEstimate,
} from '../types/cache.types';
import { useCacheStore } from '../stores/cacheStore';

/**
 * Cache entry with TTL metadata
 */
interface CacheEntry {
  value: any;
  expiresAt: number;
  createdAt: number;
}

/**
 * IndexedDB database name and version
 */
const DB_NAME = 'learning-assistant-cache';
const DB_VERSION = 1;
const QUEUE_STORE = 'queue';
const CACHE_METADATA_STORE = 'cache-metadata';

/**
 * Browser-based cache service implementation
 * Uses Cache API for response caching and IndexedDB for offline queue
 */
class BrowserCacheService implements CacheService {
  private cache: Cache | null = null;
  private db: IDBDatabase | null = null;
  private readonly cacheName = 'api-cache-v1';
  private readonly defaultTTL = 86400000; // 24 hours in milliseconds

  /**
   * Initialize cache and database
   */
  async init(): Promise<void> {
    // Initialize Cache API
    if ('caches' in window) {
      this.cache = await caches.open(this.cacheName);
    }

    // Initialize IndexedDB
    if ('indexedDB' in window) {
      this.db = await this.openDB();
    }

    // Update storage usage
    await this.updateStorageUsage();
  }

  /**
   * Open IndexedDB database
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create queue store for offline requests
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create metadata store for cache entries
        if (!db.objectStoreNames.contains(CACHE_METADATA_STORE)) {
          const metadataStore = db.createObjectStore(CACHE_METADATA_STORE, { keyPath: 'key' });
          metadataStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          metadataStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Get cached value by key
   * Requirement: 9.1, 9.4 (TTL enforcement)
   */
  async get(key: string): Promise<any | null> {
    if (!this.cache) await this.init();

    try {
      // Check metadata for TTL
      const metadata = await this.getCacheMetadata(key);
      if (!metadata) return null;

      // Check if expired
      if (Date.now() > metadata.expiresAt) {
        await this.delete(key);
        return null;
      }

      // Get from cache
      const response = await this.cache!.match(key);
      if (!response) return null;

      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   * Requirement: 9.1, 9.4
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.cache) await this.init();

    try {
      const now = Date.now();
      const entry: CacheEntry = {
        value,
        expiresAt: now + ttl,
        createdAt: now,
      };

      // Store in Cache API
      const response = new Response(JSON.stringify(entry));
      await this.cache!.put(key, response);

      // Store metadata in IndexedDB
      await this.setCacheMetadata(key, entry);

      // Update storage usage
      await this.updateStorageUsage();

      // Check if we need to evict old entries
      const usage = await this.getStorageUsage();
      if (usage.percentUsed > 90) {
        await this.evictOldest();
      }
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  /**
   * Delete cached value
   * Requirement: 9.1
   */
  async delete(key: string): Promise<void> {
    if (!this.cache) await this.init();

    try {
      await this.cache!.delete(key);
      await this.deleteCacheMetadata(key);
      await this.updateStorageUsage();
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cached data
   * Requirement: 9.1
   */
  async clear(): Promise<void> {
    if (!this.cache) await this.init();

    try {
      await caches.delete(this.cacheName);
      this.cache = await caches.open(this.cacheName);

      // Clear metadata
      if (this.db) {
        const tx = this.db.transaction(CACHE_METADATA_STORE, 'readwrite');
        await tx.objectStore(CACHE_METADATA_STORE).clear();
      }

      await this.updateStorageUsage();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Queue request for offline processing
   * Requirement: 9.2
   */
  async queueRequest(request: QueuedRequest): Promise<void> {
    if (!this.db) await this.init();

    try {
      const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
      await tx.objectStore(QUEUE_STORE).add(request);

      // Update store
      useCacheStore.getState().addQueuedRequest(request);
    } catch (error) {
      console.error('Queue request error:', error);
      throw error;
    }
  }

  /**
   * Get all queued requests
   * Requirement: 9.2
   */
  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process queued requests when online
   * Requirement: 9.3
   */
  async processQueue(): Promise<void> {
    if (!navigator.onLine) return;

    const requests = await this.getQueuedRequests();

    for (const request of requests) {
      try {
        // Attempt to send the request
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.data ? JSON.stringify(request.data) : undefined,
        });

        if (response.ok) {
          // Success - remove from queue
          await this.removeFromQueue(request.id);
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - remove from queue (won't succeed on retry)
          await this.removeFromQueue(request.id);
        } else {
          // Server error - increment retry count
          await this.incrementRetryCount(request.id);
        }
      } catch (error) {
        // Network error - increment retry count
        await this.incrementRetryCount(request.id);
      }
    }

    // Update last sync time
    useCacheStore.getState().setLastSync(new Date());
  }

  /**
   * Remove request from queue
   */
  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(QUEUE_STORE, 'readwrite');
      await tx.objectStore(QUEUE_STORE).delete(id);

      // Update store
      useCacheStore.getState().removeQueuedRequest(id);
    } catch (error) {
      console.error('Remove from queue error:', error);
    }
  }

  /**
   * Increment retry count for a queued request
   */
  private async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const queuedRequest = getRequest.result as QueuedRequest | undefined;

          if (queuedRequest) {
            queuedRequest.retries += 1;

            // Remove if too many retries
            if (queuedRequest.retries > 5) {
              store.delete(id);
              useCacheStore.getState().removeQueuedRequest(id);
            } else {
              store.put(queuedRequest);
            }
          }
          resolve();
        };

        getRequest.onerror = () => reject(getRequest.error);
      } catch (error) {
        console.error('Increment retry count error:', error);
        reject(error);
      }
    });
  }

  /**
   * Get storage usage estimate
   * Requirement: 9.5
   */
  async getStorageUsage(): Promise<StorageEstimate> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

        return {
          usage,
          quota,
          percentUsed,
        };
      }
    } catch (error) {
      console.error('Storage estimate error:', error);
    }

    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
    };
  }

  /**
   * Update storage usage in store
   */
  private async updateStorageUsage(): Promise<void> {
    const usage = await this.getStorageUsage();
    useCacheStore.getState().updateStorageUsage(usage);
  }

  /**
   * Evict oldest cached entries (FIFO)
   * Requirement: 9.5
   */
  async evictOldest(): Promise<void> {
    if (!this.db) return;

    try {
      // Get all metadata sorted by creation time
      const metadata = await this.getAllCacheMetadata();
      metadata.sort((a, b) => a.createdAt - b.createdAt);

      // Remove oldest 10% of entries
      const toRemove = Math.ceil(metadata.length * 0.1);
      for (let i = 0; i < toRemove && i < metadata.length; i++) {
        const entry = metadata[i];
        if (entry) {
          await this.delete(entry.key);
        }
      }

      await this.updateStorageUsage();
    } catch (error) {
      console.error('Evict oldest error:', error);
    }
  }

  /**
   * Get cache metadata from IndexedDB
   */
  private async getCacheMetadata(key: string): Promise<CacheEntry | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(CACHE_METADATA_STORE, 'readonly');
        const store = tx.objectStore(CACHE_METADATA_STORE);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set cache metadata in IndexedDB
   */
  private async setCacheMetadata(key: string, entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(CACHE_METADATA_STORE, 'readwrite');
        const store = tx.objectStore(CACHE_METADATA_STORE);
        const request = store.put({ key, ...entry });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete cache metadata from IndexedDB
   */
  private async deleteCacheMetadata(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(CACHE_METADATA_STORE, 'readwrite');
        const store = tx.objectStore(CACHE_METADATA_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all cache metadata
   */
  private async getAllCacheMetadata(): Promise<Array<CacheEntry & { key: string }>> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(CACHE_METADATA_STORE, 'readonly');
        const store = tx.objectStore(CACHE_METADATA_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Create and export singleton instance
export const cacheService = new BrowserCacheService();

// Export class for testing
export { BrowserCacheService };
