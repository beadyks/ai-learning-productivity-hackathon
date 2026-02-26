/**
 * Connection Pooling and Caching Utilities
 * Requirements: 11.4, 11.5 (Connection pooling, caching, performance optimization)
 * 
 * This module provides:
 * - DynamoDB connection pooling
 * - AWS SDK client reuse
 * - Response caching with TTL
 * - Cold start mitigation
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Global client instances (reused across invocations)
let dynamoDBClient: DynamoDBDocumentClient | null = null;
let s3Client: S3Client | null = null;
let bedrockClient: BedrockRuntimeClient | null = null;

// In-memory cache for responses (survives across warm invocations)
const responseCache = new Map<string, { data: any; expiry: number }>();

/**
 * Get or create DynamoDB client with connection pooling
 * Reuses client across Lambda invocations (warm starts)
 */
export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (!dynamoDBClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      maxAttempts: 3,
      requestHandler: {
        connectionTimeout: 3000,
        requestTimeout: 3000,
      },
    });

    dynamoDBClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

    console.log('Created new DynamoDB client');
  }

  return dynamoDBClient;
}

/**
 * Get or create S3 client with connection pooling
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      maxAttempts: 3,
      requestHandler: {
        connectionTimeout: 3000,
        requestTimeout: 30000, // Longer timeout for S3 operations
      },
    });

    console.log('Created new S3 client');
  }

  return s3Client;
}

/**
 * Get or create Bedrock client with connection pooling
 */
export function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
      maxAttempts: 3,
      requestHandler: {
        connectionTimeout: 5000,
        requestTimeout: 60000, // Longer timeout for AI operations
      },
    });

    console.log('Created new Bedrock client');
  }

  return bedrockClient;
}

/**
 * Cache response with TTL
 */
export function cacheResponse(key: string, data: any, ttlSeconds: number = 3600): void {
  const expiry = Date.now() + ttlSeconds * 1000;
  responseCache.set(key, { data, expiry });

  // Clean up expired entries periodically
  if (responseCache.size > 1000) {
    cleanupCache();
  }
}

/**
 * Get cached response if not expired
 */
export function getCachedResponse<T>(key: string): T | null {
  const cached = responseCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiry) {
    responseCache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of responseCache.entries()) {
    if (now > value.expiry) {
      responseCache.delete(key);
      cleaned++;
    }
  }

  console.log(`Cleaned up ${cleaned} expired cache entries`);
}

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${prefix}:${sortedParams}`;
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  responseCache.clear();
  console.log('Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let expiredEntries = 0;

  for (const [, value] of responseCache.entries()) {
    if (now > value.expiry) {
      expiredEntries++;
    }
  }

  return {
    size: responseCache.size,
    entries: responseCache.size - expiredEntries,
    expiredEntries,
  };
}

/**
 * Cold start mitigation: Pre-initialize clients
 * Call this at the top of your Lambda handler file
 */
export function initializeClients(): void {
  getDynamoDBClient();
  getS3Client();
  getBedrockClient();
  console.log('All clients pre-initialized');
}

/**
 * Wrapper for Lambda handlers with automatic connection pooling and caching
 */
export function withConnectionPool<TEvent, TResult>(
  handler: (event: TEvent) => Promise<TResult>
): (event: TEvent) => Promise<TResult> {
  // Initialize clients on cold start
  initializeClients();

  return async (event: TEvent): Promise<TResult> => {
    try {
      return await handler(event);
    } finally {
      // Cleanup expired cache entries after each invocation
      if (responseCache.size > 100) {
        cleanupCache();
      }
    }
  };
}

/**
 * Decorator for caching function results
 */
export function cached(ttlSeconds: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey(propertyKey, { args });
      const cachedResult = getCachedResponse(cacheKey);

      if (cachedResult !== null) {
        console.log(`Cache hit for ${propertyKey}`);
        return cachedResult;
      }

      console.log(`Cache miss for ${propertyKey}`);
      const result = await originalMethod.apply(this, args);
      cacheResponse(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}

/**
 * Example usage in Lambda handler
 */
export const exampleHandler = withConnectionPool(async (event: any) => {
  // Clients are automatically initialized and reused
  const dynamoDB = getDynamoDBClient();
  const s3 = getS3Client();
  const bedrock = getBedrockClient();

  // Use clients as normal
  // They will be reused across warm invocations

  return { statusCode: 200, body: 'Success' };
});
