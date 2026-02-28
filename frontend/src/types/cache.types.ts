/**
 * Cache and offline support type definitions
 * Covers caching, offline queueing, and storage management
 */

export interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: any;
  timestamp: number;
  retries: number;
}

export interface StorageEstimate {
  usage: number;
  quota: number;
  percentUsed: number;
}

export interface CacheState {
  isOnline: boolean;
  queuedRequests: QueuedRequest[];
  storageUsage: StorageEstimate;
  lastSync: Date | null;
}

export interface CacheActions {
  setOnline: (isOnline: boolean) => void;
  addQueuedRequest: (request: QueuedRequest) => void;
  removeQueuedRequest: (id: string) => void;
  updateStorageUsage: (usage: StorageEstimate) => void;
  setLastSync: (date: Date) => void;
}

export interface CacheService {
  // Cache Operations
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  
  // Offline Queue
  queueRequest(request: QueuedRequest): Promise<void>;
  getQueuedRequests(): Promise<QueuedRequest[]>;
  processQueue(): Promise<void>;
  
  // Storage Management
  getStorageUsage(): Promise<StorageEstimate>;
  evictOldest(): Promise<void>;
}
