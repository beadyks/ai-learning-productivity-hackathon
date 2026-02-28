/**
 * API Client Service
 * Axios-based HTTP client for backend API communication
 * Requirements: 5.3, 10.3, 9.1, 9.4, 13.1, 13.2
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type {
  APIClient,
  APIResponse,
  RequestConfig,
  RetryConfig,
} from '../types/api.types';
import { authManager } from './authService';
import { cacheService } from './cacheService';
import type { QueuedRequest } from '../types/cache.types';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes to close circuit from half-open
  timeout: number; // Time to wait before trying half-open (ms)
}

/**
 * Circuit breaker for preventing cascading failures
 * Requirement: 13.1, 13.2
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000, // 1 minute
    };
  }

  /**
   * Execute a request through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open. Service temporarily unavailable.');
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.timeout;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

/**
 * Axios-based API Client implementation
 * Provides HTTP methods with authentication, caching, and retry logic
 */
class AxiosAPIClient implements APIClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private cacheEnabled: boolean = true;
  private cacheTTL: number = 86400000; // 24 hours in milliseconds
  private circuitBreaker: CircuitBreaker;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.circuitBreaker = new CircuitBreaker();
    this.setupInterceptors();
    
    // Initialize cache service
    cacheService.init().catch((error) => {
      console.error('Failed to initialize cache service:', error);
    });
  }

  /**
   * Set up request and response interceptors
   * Requirements: 5.3 (auth headers), 13.1, 13.2 (error handling)
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Get fresh token from auth manager
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add compression header for bandwidth optimization
        // Requirement: 10.3
        config.headers['Accept-Encoding'] = 'gzip, deflate, br';

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and caching
    this.client.interceptors.response.use(
      async (response: AxiosResponse) => {
        // Cache GET responses if caching is enabled
        // Requirement: 9.1, 9.4
        if (
          response.config.method === 'get' &&
          this.cacheEnabled &&
          response.status === 200
        ) {
          try {
            const cacheKey = this.getCacheKey(response.config);
            await cacheService.set(cacheKey, response.data, this.cacheTTL);
          } catch (error) {
            console.error('Failed to cache response:', error);
          }
        }

        return response;
      },
      async (error) => {
        // Handle offline scenarios - try cache
        // Requirement: 9.1 (offline fallback)
        if (!navigator.onLine && error.config?.method === 'get') {
          try {
            const cacheKey = this.getCacheKey(error.config);
            const cachedData = await cacheService.get(cacheKey);
            
            if (cachedData) {
              // Return cached response
              return {
                data: cachedData,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: error.config,
                cached: true,
              };
            }
          } catch (cacheError) {
            console.error('Failed to retrieve from cache:', cacheError);
          }

          // Queue mutation requests for later
          // Requirement: 9.2
          if (error.config?.method !== 'get') {
            try {
              const queuedRequest: QueuedRequest = {
                id: this.generateRequestId(),
                method: error.config.method || 'post',
                url: error.config.url || '',
                data: error.config.data,
                timestamp: Date.now(),
                retries: 0,
              };
              await cacheService.queueRequest(queuedRequest);
            } catch (queueError) {
              console.error('Failed to queue request:', queueError);
            }
          }
        }

        // Handle token expiration and refresh
        if (error.response?.status === 401) {
          try {
            // Attempt to refresh token
            const newToken = await authManager.refreshToken();
            this.setAuthToken(newToken);

            // Retry the original request with new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(originalRequest);
          } catch (refreshError) {
            // Token refresh failed, user needs to re-authenticate
            return Promise.reject(this.transformError(error));
          }
        }

        // Transform error for consistent error handling
        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Generate cache key from request config
   */
  private getCacheKey(config: AxiosRequestConfig): string {
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${config.baseURL || ''}${url}${params}`;
  }

  /**
   * Generate unique request ID for queue
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get authentication token from auth manager
   */
  private async getAuthToken(): Promise<string | null> {
    if (this.authToken) {
      return this.authToken;
    }

    // Try to get token from auth manager
    try {
      const token = await authManager.getAccessToken();
      if (token) {
        this.authToken = token;
      }
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Transform axios errors into user-friendly error messages
   * Requirement: 13.1, 13.2
   */
  private transformError(error: any): Error {
    if (!error.response) {
      // Network error
      return new Error(
        'Network error. Please check your internet connection and try again.'
      );
    }

    const status = error.response.status;
    const data = error.response.data;

    // Extract error message from response
    const message = data?.message || data?.error || error.message;

    switch (status) {
      case 400:
        return new Error(`Invalid request: ${message}`);
      case 401:
        return new Error('Authentication required. Please log in again.');
      case 403:
        return new Error('Access denied. You do not have permission to perform this action.');
      case 404:
        return new Error('Resource not found.');
      case 429:
        return new Error('Too many requests. Please wait a moment and try again.');
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error('Server error. Please try again later.');
      default:
        return new Error(message || 'An unexpected error occurred.');
    }
  }

  /**
   * Retry logic with exponential backoff
   * Requirement: 13.1, 13.2
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Check if we should retry
        const shouldRetry =
          attempt < retryConfig.maxRetries &&
          (retryConfig.retryCondition?.(error) ?? true);

        if (!shouldRetry) {
          throw error;
        }

        // Exponential backoff: delay = baseDelay * 2^attempt
        const delay = retryConfig.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convert Axios response to APIResponse
   */
  private toAPIResponse<T>(
    response: AxiosResponse<T>,
    cached: boolean = false
  ): APIResponse<T> {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
      cached,
    };
  }

  // Public API methods

  /**
   * GET request
   * Requirement: 9.1, 9.4 (caching)
   */
  async get<T>(url: string, config?: RequestConfig): Promise<APIResponse<T>> {
    // Check cache first if enabled and caching not explicitly disabled
    // Requirement: 9.1 (cache-first strategy)
    if (this.cacheEnabled && config?.cache !== false) {
      try {
        const cacheKey = this.getCacheKey({
          url,
          params: config?.params,
          baseURL: this.client.defaults.baseURL,
        });
        const cachedData = await cacheService.get(cacheKey);
        
        if (cachedData) {
          return {
            data: cachedData,
            status: 200,
            headers: {},
            cached: true,
          };
        }
      } catch (error) {
        console.error('Cache retrieval error:', error);
      }
    }

    const axiosConfig: AxiosRequestConfig = {
      params: config?.params,
      headers: config?.headers,
      timeout: config?.timeout,
    };

    // Execute through circuit breaker
    // Requirement: 13.1, 13.2
    const requestFn = () => this.client.get<T>(url, axiosConfig);
    
    const executeRequest = async () => {
      return config?.retry
        ? await this.retryRequest(requestFn, config.retry)
        : await requestFn();
    };

    const response = await this.circuitBreaker.execute(executeRequest);
    return this.toAPIResponse(response);
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      params: config?.params,
      headers: config?.headers,
      timeout: config?.timeout,
    };

    // Execute through circuit breaker
    // Requirement: 13.1, 13.2
    const requestFn = () => this.client.post<T>(url, data, axiosConfig);
    
    const executeRequest = async () => {
      return config?.retry
        ? await this.retryRequest(requestFn, config.retry)
        : await requestFn();
    };

    const response = await this.circuitBreaker.execute(executeRequest);
    return this.toAPIResponse(response);
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      params: config?.params,
      headers: config?.headers,
      timeout: config?.timeout,
    };

    // Execute through circuit breaker
    // Requirement: 13.1, 13.2
    const requestFn = () => this.client.put<T>(url, data, axiosConfig);
    
    const executeRequest = async () => {
      return config?.retry
        ? await this.retryRequest(requestFn, config.retry)
        : await requestFn();
    };

    const response = await this.circuitBreaker.execute(executeRequest);
    return this.toAPIResponse(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const axiosConfig: AxiosRequestConfig = {
      params: config?.params,
      headers: config?.headers,
      timeout: config?.timeout,
    };

    // Execute through circuit breaker
    // Requirement: 13.1, 13.2
    const requestFn = () => this.client.delete<T>(url, axiosConfig);
    
    const executeRequest = async () => {
      return config?.retry
        ? await this.retryRequest(requestFn, config.retry)
        : await requestFn();
    };

    const response = await this.circuitBreaker.execute(executeRequest);
    return this.toAPIResponse(response);
  }

  /**
   * Set base URL for API requests
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  /**
   * Set authentication token
   * Requirement: 5.3
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   * Requirement: 5.3
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Enable caching with optional TTL
   * Requirement: 9.4
   */
  enableCache(ttl?: number): void {
    this.cacheEnabled = true;
    if (ttl !== undefined) {
      this.cacheTTL = ttl;
    }
  }

  /**
   * Disable caching
   */
  disableCache(): void {
    this.cacheEnabled = false;
  }

  /**
   * Clear cache (placeholder - will be implemented with cache service integration)
   * Requirement: 9.1
   */
  async clearCache(): Promise<void> {
    try {
      await cacheService.clear();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
// Base URL should be configured from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const apiClient = new AxiosAPIClient(API_BASE_URL);

// Export class for testing
export { AxiosAPIClient };
