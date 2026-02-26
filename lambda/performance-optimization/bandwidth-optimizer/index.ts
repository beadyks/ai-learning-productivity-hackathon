import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

/**
 * Bandwidth Optimizer Lambda Function
 * 
 * Implements response compression, progressive loading, and offline mode capabilities
 * to optimize bandwidth usage for low-connectivity scenarios.
 * 
 * Requirements: 8.1, 8.4
 */

interface CompressionOptions {
  algorithm: 'gzip' | 'brotli' | 'none';
  level?: number;
}

interface ProgressiveLoadingConfig {
  chunkSize: number;
  priority: 'high' | 'medium' | 'low';
}

interface OfflineCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Compresses response data using the specified algorithm
 */
async function compressResponse(
  data: string,
  options: CompressionOptions
): Promise<Buffer> {
  const buffer = Buffer.from(data, 'utf-8');
  
  switch (options.algorithm) {
    case 'brotli':
      return await brotli(buffer, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: options.level || 4,
        },
      });
    case 'gzip':
      return await gzip(buffer, { level: options.level || 6 });
    case 'none':
    default:
      return buffer;
  }
}

/**
 * Determines the best compression algorithm based on client support
 */
function selectCompressionAlgorithm(acceptEncoding: string | undefined): 'gzip' | 'brotli' | 'none' {
  if (!acceptEncoding) return 'none';
  
  const encodings = acceptEncoding.toLowerCase();
  
  // Prefer Brotli for better compression ratio
  if (encodings.includes('br')) return 'brotli';
  if (encodings.includes('gzip')) return 'gzip';
  
  return 'none';
}

/**
 * Splits large content into chunks for progressive loading
 */
function chunkContent(
  content: string,
  config: ProgressiveLoadingConfig
): string[] {
  const chunks: string[] = [];
  const { chunkSize } = config;
  
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Creates a progressive loading response with metadata
 */
function createProgressiveResponse(
  chunks: string[],
  chunkIndex: number,
  totalChunks: number
): any {
  return {
    chunk: chunks[chunkIndex],
    metadata: {
      chunkIndex,
      totalChunks,
      hasMore: chunkIndex < totalChunks - 1,
      progress: ((chunkIndex + 1) / totalChunks) * 100,
    },
  };
}

/**
 * Manages offline cache entries
 */
class OfflineCacheManager {
  private cache: Map<string, OfflineCacheEntry> = new Map();
  
  set(key: string, data: any, ttl: number = 3600000): void {
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getAll(): OfflineCacheEntry[] {
    const now = Date.now();
    const validEntries: OfflineCacheEntry[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp <= entry.ttl) {
        validEntries.push(entry);
      } else {
        this.cache.delete(key);
      }
    }
    
    return validEntries;
  }
}

const offlineCache = new OfflineCacheManager();

/**
 * Main Lambda handler for bandwidth optimization
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action || 'compress';
    
    switch (action) {
      case 'compress': {
        const { data, compressionLevel } = body;
        
        if (!data) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required field: data',
            }),
          };
        }
        
        const acceptEncoding = event.headers['accept-encoding'] || event.headers['Accept-Encoding'];
        const algorithm = selectCompressionAlgorithm(acceptEncoding);
        
        const compressed = await compressResponse(data, {
          algorithm,
          level: compressionLevel,
        });
        
        const originalSize = Buffer.byteLength(data, 'utf-8');
        const compressedSize = compressed.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
        
        return {
          statusCode: 200,
          headers: {
            'Content-Encoding': algorithm === 'none' ? undefined : algorithm,
            'Content-Type': 'application/json',
            'X-Original-Size': originalSize.toString(),
            'X-Compressed-Size': compressedSize.toString(),
            'X-Compression-Ratio': compressionRatio.toFixed(2),
          },
          body: compressed.toString('base64'),
          isBase64Encoded: algorithm !== 'none',
        };
      }
      
      case 'progressive': {
        const { content, chunkSize = 5000, chunkIndex = 0 } = body;
        
        if (!content) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required field: content',
            }),
          };
        }
        
        const chunks = chunkContent(content, {
          chunkSize,
          priority: 'high',
        });
        
        const response = createProgressiveResponse(chunks, chunkIndex, chunks.length);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(response),
        };
      }
      
      case 'cache-set': {
        const { key, data, ttl } = body;
        
        if (!key || !data) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required fields: key, data',
            }),
          };
        }
        
        offlineCache.set(key, data, ttl);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: true,
            message: 'Data cached successfully',
          }),
        };
      }
      
      case 'cache-get': {
        const { key } = body;
        
        if (!key) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required field: key',
            }),
          };
        }
        
        const cachedData = offlineCache.get(key);
        
        if (!cachedData) {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              error: 'Cache entry not found or expired',
            }),
          };
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: cachedData,
          }),
        };
      }
      
      case 'cache-list': {
        const entries = offlineCache.getAll();
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entries: entries.map(e => ({
              key: e.key,
              timestamp: e.timestamp,
              ttl: e.ttl,
            })),
          }),
        };
      }
      
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Unknown action: ${action}`,
            supportedActions: ['compress', 'progressive', 'cache-set', 'cache-get', 'cache-list'],
          }),
        };
    }
  } catch (error) {
    console.error('Bandwidth optimization error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
