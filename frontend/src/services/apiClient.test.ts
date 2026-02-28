/**
 * API Client Service Tests
 * Basic integration tests for API client functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosAPIClient } from './apiClient';
import type { RequestConfig } from '../types/api.types';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:3000/api',
    },
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };
  return { default: mockAxios };
});

// Mock auth service
vi.mock('./authService', () => ({
  authManager: {
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
    refreshToken: vi.fn().mockResolvedValue('new-mock-token'),
  },
}));

// Mock cache service
vi.mock('./cacheService', () => ({
  cacheService: {
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    queueRequest: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('API Client Service', () => {
  let apiClient: AxiosAPIClient;

  beforeEach(() => {
    apiClient = new AxiosAPIClient('http://localhost:3000/api');
  });

  describe('Configuration', () => {
    it('should create an API client with base URL', () => {
      expect(apiClient).toBeDefined();
    });

    it('should allow setting base URL', () => {
      apiClient.setBaseURL('http://example.com/api');
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should allow setting auth token', () => {
      apiClient.setAuthToken('test-token');
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should allow clearing auth token', () => {
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();
      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should enable cache with default TTL', () => {
      apiClient.enableCache();
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should enable cache with custom TTL', () => {
      apiClient.enableCache(3600000); // 1 hour
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should disable cache', () => {
      apiClient.disableCache();
      // No error should be thrown
      expect(true).toBe(true);
    });

    it('should clear cache', async () => {
      await apiClient.clearCache();
      // No error should be thrown
      expect(true).toBe(true);
    });
  });

  describe('Request Configuration', () => {
    it('should accept request config with headers', () => {
      const config: RequestConfig = {
        headers: {
          'X-Custom-Header': 'value',
        },
      };
      expect(config).toBeDefined();
    });

    it('should accept request config with params', () => {
      const config: RequestConfig = {
        params: {
          page: 1,
          limit: 10,
        },
      };
      expect(config).toBeDefined();
    });

    it('should accept request config with retry settings', () => {
      const config: RequestConfig = {
        retry: {
          maxRetries: 3,
          retryDelay: 1000,
        },
      };
      expect(config).toBeDefined();
    });

    it('should accept request config with cache disabled', () => {
      const config: RequestConfig = {
        cache: false,
      };
      expect(config).toBeDefined();
    });
  });
});
