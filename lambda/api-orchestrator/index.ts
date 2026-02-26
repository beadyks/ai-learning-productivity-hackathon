/**
 * API Orchestrator Lambda Function
 * 
 * Provides unified API endpoints for all services with:
 * - Request routing and validation
 * - Rate limiting and throttling
 * - Request/response transformation
 * - Error handling and logging
 * 
 * Requirements: 11.1, 11.2
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE || 'voice-learning-rate-limits';
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || '';

// Rate limit configuration (requests per minute)
const RATE_LIMITS = {
  free: 10,
  basic: 60,
  premium: 300,
};

// Request validation schemas
interface RouteConfig {
  method: string;
  path: string;
  requiredFields?: string[];
  optionalFields?: string[];
  maxBodySize?: number;
}

const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  'POST:/documents/upload': {
    method: 'POST',
    path: '/documents/upload',
    requiredFields: ['fileName', 'fileType', 'fileSize'],
    maxBodySize: 50 * 1024 * 1024, // 50MB
  },
  'POST:/ai/generate': {
    method: 'POST',
    path: '/ai/generate',
    requiredFields: ['query', 'userId'],
    optionalFields: ['mode', 'context', 'language'],
    maxBodySize: 100 * 1024, // 100KB
  },
  'POST:/mode/switch': {
    method: 'POST',
    path: '/mode/switch',
    requiredFields: ['userId', 'targetMode'],
    optionalFields: ['context'],
    maxBodySize: 10 * 1024, // 10KB
  },
  'POST:/sessions': {
    method: 'POST',
    path: '/sessions',
    requiredFields: ['userId', 'action'],
    optionalFields: ['sessionData'],
    maxBodySize: 500 * 1024, // 500KB
  },
  'POST:/search/semantic': {
    method: 'POST',
    path: '/search/semantic',
    requiredFields: ['query', 'userId'],
    optionalFields: ['limit', 'filters'],
    maxBodySize: 50 * 1024, // 50KB
  },
};

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  console.log('API Orchestrator invoked:', JSON.stringify(event, null, 2));

  try {
    // Extract user information from authorizer context
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: Missing user ID');
    }

    // Get user subscription tier for rate limiting
    const userTier = await getUserTier(userId);

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, userTier);
    if (!rateLimitCheck.allowed) {
      return createErrorResponse(429, 'Rate limit exceeded', {
        retryAfter: rateLimitCheck.retryAfter,
        limit: rateLimitCheck.limit,
        remaining: 0,
      });
    }

    // Validate request
    const validationResult = validateRequest(event);
    if (!validationResult.valid) {
      return createErrorResponse(400, 'Invalid request', {
        errors: validationResult.errors,
      });
    }

    // Route request to appropriate handler
    const response = await routeRequest(event, userId, userTier);

    // Add rate limit headers
    return {
      ...response,
      headers: {
        ...response.headers,
        'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
        'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
        'X-RateLimit-Reset': rateLimitCheck.resetTime.toString(),
      },
    };
  } catch (error) {
    console.error('Error in API orchestrator:', error);
    return createErrorResponse(500, 'Internal server error', {
      requestId: context.requestId,
    });
  }
};

/**
 * Get user subscription tier from DynamoDB
 */
async function getUserTier(userId: string): Promise<string> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: USER_PROFILES_TABLE,
        Key: { userId },
        ProjectionExpression: 'subscriptionTier',
      })
    );

    return result.Item?.subscriptionTier || 'free';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free'; // Default to free tier on error
  }
}

/**
 * Check rate limits for user
 */
async function checkRateLimit(
  userId: string,
  tier: string
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute
  const resetTime = windowStart + 60000; // End of current minute

  try {
    // Get current request count for this window
    const result = await docClient.send(
      new GetCommand({
        TableName: RATE_LIMIT_TABLE,
        Key: {
          userId,
          window: windowStart,
        },
      })
    );

    const currentCount = result.Item?.count || 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Increment request count
    await docClient.send(
      new UpdateCommand({
        TableName: RATE_LIMIT_TABLE,
        Key: {
          userId,
          window: windowStart,
        },
        UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :inc, #ttl = :ttl',
        ExpressionAttributeNames: {
          '#count': 'count',
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':zero': 0,
          ':inc': 1,
          ':ttl': Math.floor((resetTime + 300000) / 1000), // TTL 5 minutes after window
        },
      })
    );

    return {
      allowed: true,
      limit,
      remaining: limit - currentCount - 1,
      resetTime,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Allow request on error to avoid blocking users
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetTime,
    };
  }
}

/**
 * Validate incoming request
 */
function validateRequest(event: APIGatewayProxyEventV2): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;
  const routeKey = `${method}:${path}`;

  // Check if route is configured
  const routeConfig = ROUTE_CONFIGS[routeKey];
  if (!routeConfig) {
    // Unknown route - let it pass through for now
    return { valid: true };
  }

  // Validate body size
  if (event.body) {
    const bodySize = Buffer.byteLength(event.body, 'utf8');
    if (routeConfig.maxBodySize && bodySize > routeConfig.maxBodySize) {
      errors.push(
        `Request body too large: ${bodySize} bytes (max: ${routeConfig.maxBodySize} bytes)`
      );
    }
  }

  // Parse and validate body content
  if (event.body && routeConfig.requiredFields) {
    try {
      const body = JSON.parse(event.body);

      // Check required fields
      for (const field of routeConfig.requiredFields) {
        if (!(field in body) || body[field] === null || body[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Check for unknown fields (optional - can be disabled for flexibility)
      const allowedFields = [
        ...(routeConfig.requiredFields || []),
        ...(routeConfig.optionalFields || []),
      ];
      for (const field of Object.keys(body)) {
        if (!allowedFields.includes(field)) {
          console.warn(`Unknown field in request: ${field}`);
        }
      }
    } catch (error) {
      errors.push('Invalid JSON in request body');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Route request to appropriate handler
 */
async function routeRequest(
  event: APIGatewayProxyEventV2,
  userId: string,
  userTier: string
): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  // Log request for monitoring
  console.log(`Routing request: ${method} ${path} for user ${userId} (tier: ${userTier})`);

  // For now, return a success response indicating the orchestrator is working
  // In production, this would invoke the appropriate downstream Lambda functions
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'API orchestrator is operational',
      route: `${method} ${path}`,
      userId,
      userTier,
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  details?: Record<string, any>
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  };
}
