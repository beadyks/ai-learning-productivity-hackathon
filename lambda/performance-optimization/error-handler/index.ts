import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Comprehensive Error Handler Lambda Function
 * 
 * Implements circuit breaker patterns, graceful degradation mechanisms,
 * and user-friendly error communication.
 * 
 * Requirements: 1.4, 1.5, 4.5, 8.5
 */

// Circuit Breaker States
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

interface CircuitBreakerStats {
  failures: number;
  successes: number;
  lastFailureTime: number;
  state: CircuitState;
}

/**
 * Circuit Breaker implementation to prevent cascading failures
 */
class CircuitBreaker {
  private stats: Map<string, CircuitBreakerStats> = new Map();
  private config: CircuitBreakerConfig;
  
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000, // 1 minute
      resetTimeout: config.resetTimeout || 30000, // 30 seconds
    };
  }
  
  private getStats(serviceName: string): CircuitBreakerStats {
    if (!this.stats.has(serviceName)) {
      this.stats.set(serviceName, {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        state: CircuitState.CLOSED,
      });
    }
    return this.stats.get(serviceName)!;
  }
  
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const stats = this.getStats(serviceName);
    
    // Check if circuit is open
    if (stats.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - stats.lastFailureTime;
      
      if (timeSinceLastFailure > this.config.resetTimeout) {
        // Try to recover - move to half-open
        stats.state = CircuitState.HALF_OPEN;
        stats.successes = 0;
      } else {
        // Circuit still open, use fallback or throw
        if (fallback) {
          return await fallback();
        }
        throw new ServiceUnavailableError(
          `Service ${serviceName} is temporarily unavailable. Please try again later.`
        );
      }
    }
    
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new TimeoutError('Operation timed out')), this.config.timeout)
        ),
      ]);
      
      // Success - update stats
      this.onSuccess(serviceName);
      return result;
    } catch (error) {
      // Failure - update stats
      this.onFailure(serviceName);
      
      if (fallback) {
        return await fallback();
      }
      
      throw error;
    }
  }
  
  private onSuccess(serviceName: string): void {
    const stats = this.getStats(serviceName);
    stats.failures = 0;
    stats.successes++;
    
    if (stats.state === CircuitState.HALF_OPEN) {
      if (stats.successes >= this.config.successThreshold) {
        stats.state = CircuitState.CLOSED;
        stats.successes = 0;
      }
    }
  }
  
  private onFailure(serviceName: string): void {
    const stats = this.getStats(serviceName);
    stats.failures++;
    stats.lastFailureTime = Date.now();
    
    if (stats.failures >= this.config.failureThreshold) {
      stats.state = CircuitState.OPEN;
    }
  }
  
  getState(serviceName: string): CircuitState {
    return this.getStats(serviceName).state;
  }
  
  reset(serviceName: string): void {
    this.stats.delete(serviceName);
  }
}

/**
 * Custom error classes for different error types
 */
class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Error response formatter for user-friendly messages
 */
interface ErrorResponse {
  error: string;
  message: string;
  userMessage: string;
  suggestions?: string[];
  retryable: boolean;
  statusCode: number;
}

function formatErrorResponse(error: Error): ErrorResponse {
  // Document processing errors
  if (error.message.includes('unsupported file format')) {
    return {
      error: 'UnsupportedFileFormat',
      message: error.message,
      userMessage: 'The file format you uploaded is not supported.',
      suggestions: [
        'Please upload a PDF, DOC, DOCX, TXT, or image file (PNG, JPG)',
        'Convert your file to a supported format and try again',
      ],
      retryable: true,
      statusCode: 400,
    };
  }
  
  if (error.message.includes('file too large')) {
    return {
      error: 'FileTooLarge',
      message: error.message,
      userMessage: 'The file you uploaded is too large.',
      suggestions: [
        'Please upload a file smaller than 10MB',
        'Split large documents into smaller files',
        'Compress the file before uploading',
      ],
      retryable: true,
      statusCode: 413,
    };
  }
  
  if (error.message.includes('extraction failed')) {
    return {
      error: 'ExtractionFailed',
      message: error.message,
      userMessage: 'We could not extract text from your document.',
      suggestions: [
        'Ensure the document contains readable text',
        'Try uploading a different format of the same document',
        'If the document is an image, ensure the text is clear and legible',
      ],
      retryable: true,
      statusCode: 422,
    };
  }
  
  // Voice processing errors
  if (error.message.includes('transcription failed')) {
    return {
      error: 'TranscriptionFailed',
      message: error.message,
      userMessage: 'We could not understand your voice input.',
      suggestions: [
        'Please try speaking more clearly',
        'Reduce background noise',
        'Switch to text input if voice continues to fail',
      ],
      retryable: true,
      statusCode: 422,
    };
  }
  
  if (error.message.includes('audio quality')) {
    return {
      error: 'PoorAudioQuality',
      message: error.message,
      userMessage: 'The audio quality is too low to process.',
      suggestions: [
        'Move to a quieter location',
        'Check your microphone settings',
        'Try recording again',
      ],
      retryable: true,
      statusCode: 422,
    };
  }
  
  // Service unavailability errors
  if (error instanceof ServiceUnavailableError) {
    return {
      error: 'ServiceUnavailable',
      message: error.message,
      userMessage: 'This service is temporarily unavailable.',
      suggestions: [
        'Please try again in a few moments',
        'Some features may be available in offline mode',
      ],
      retryable: true,
      statusCode: 503,
    };
  }
  
  // Timeout errors
  if (error instanceof TimeoutError) {
    return {
      error: 'Timeout',
      message: error.message,
      userMessage: 'The operation took too long to complete.',
      suggestions: [
        'Please try again',
        'If the problem persists, try with a smaller file or simpler query',
      ],
      retryable: true,
      statusCode: 504,
    };
  }
  
  // Validation errors
  if (error instanceof ValidationError) {
    return {
      error: 'ValidationError',
      message: error.message,
      userMessage: 'The information provided is invalid.',
      suggestions: [
        'Please check your input and try again',
      ],
      retryable: true,
      statusCode: 400,
    };
  }
  
  // Resource not found errors
  if (error instanceof ResourceNotFoundError) {
    return {
      error: 'ResourceNotFound',
      message: error.message,
      userMessage: 'The requested resource was not found.',
      suggestions: [
        'Please check if the resource exists',
        'Try refreshing the page',
      ],
      retryable: false,
      statusCode: 404,
    };
  }
  
  // Network/connectivity errors
  if (error.message.includes('network') || error.message.includes('connectivity')) {
    return {
      error: 'NetworkError',
      message: error.message,
      userMessage: 'Network connectivity issue detected.',
      suggestions: [
        'Check your internet connection',
        'Try again when you have better connectivity',
        'Some features may be available in offline mode',
      ],
      retryable: true,
      statusCode: 503,
    };
  }
  
  // Generic error
  return {
    error: 'InternalError',
    message: error.message,
    userMessage: 'An unexpected error occurred.',
    suggestions: [
      'Please try again',
      'If the problem persists, contact support',
    ],
    retryable: true,
    statusCode: 500,
  };
}

/**
 * Graceful degradation manager
 */
interface DegradationLevel {
  level: 'full' | 'partial' | 'minimal';
  availableFeatures: string[];
  unavailableFeatures: string[];
  message: string;
}

class GracefulDegradationManager {
  private serviceHealth: Map<string, boolean> = new Map();
  
  updateServiceHealth(serviceName: string, isHealthy: boolean): void {
    this.serviceHealth.set(serviceName, isHealthy);
  }
  
  getDegradationLevel(): DegradationLevel {
    const services = Array.from(this.serviceHealth.entries());
    const healthyServices = services.filter(([_, healthy]) => healthy);
    const healthPercentage = (healthyServices.length / services.length) * 100;
    
    if (healthPercentage >= 90) {
      return {
        level: 'full',
        availableFeatures: ['all'],
        unavailableFeatures: [],
        message: 'All features are available',
      };
    } else if (healthPercentage >= 50) {
      const unavailable = services
        .filter(([_, healthy]) => !healthy)
        .map(([name]) => name);
      
      return {
        level: 'partial',
        availableFeatures: healthyServices.map(([name]) => name),
        unavailableFeatures: unavailable,
        message: `Some features are temporarily unavailable: ${unavailable.join(', ')}`,
      };
    } else {
      return {
        level: 'minimal',
        availableFeatures: healthyServices.map(([name]) => name),
        unavailableFeatures: services
          .filter(([_, healthy]) => !healthy)
          .map(([name]) => name),
        message: 'Operating in minimal mode. Many features are temporarily unavailable.',
      };
    }
  }
}

// Global instances
const circuitBreaker = new CircuitBreaker();
const degradationManager = new GracefulDegradationManager();

/**
 * Main Lambda handler for error handling
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action || 'handle-error';
    
    switch (action) {
      case 'handle-error': {
        const { error: errorData } = body;
        
        if (!errorData) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required field: error',
            }),
          };
        }
        
        // Create error object from data
        const error = new Error(errorData.message || 'Unknown error');
        error.name = errorData.name || 'Error';
        
        const errorResponse = formatErrorResponse(error);
        
        return {
          statusCode: errorResponse.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorResponse),
        };
      }
      
      case 'circuit-breaker-execute': {
        const { serviceName, operation, fallback } = body;
        
        if (!serviceName || !operation) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required fields: serviceName, operation',
            }),
          };
        }
        
        // This is a simplified example - in real implementation,
        // the operation would be executed here
        const state = circuitBreaker.getState(serviceName);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceName,
            circuitState: state,
            message: `Circuit breaker state for ${serviceName}: ${state}`,
          }),
        };
      }
      
      case 'circuit-breaker-reset': {
        const { serviceName } = body;
        
        if (!serviceName) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required field: serviceName',
            }),
          };
        }
        
        circuitBreaker.reset(serviceName);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: true,
            message: `Circuit breaker reset for ${serviceName}`,
          }),
        };
      }
      
      case 'degradation-status': {
        const degradationLevel = degradationManager.getDegradationLevel();
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(degradationLevel),
        };
      }
      
      case 'update-service-health': {
        const { serviceName, isHealthy } = body;
        
        if (!serviceName || isHealthy === undefined) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Missing required fields: serviceName, isHealthy',
            }),
          };
        }
        
        degradationManager.updateServiceHealth(serviceName, isHealthy);
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            success: true,
            message: `Service health updated for ${serviceName}`,
          }),
        };
      }
      
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Unknown action: ${action}`,
            supportedActions: [
              'handle-error',
              'circuit-breaker-execute',
              'circuit-breaker-reset',
              'degradation-status',
              'update-service-health',
            ],
          }),
        };
    }
  } catch (error) {
    console.error('Error handler error:', error);
    
    const errorResponse = formatErrorResponse(
      error instanceof Error ? error : new Error('Unknown error')
    );
    
    return {
      statusCode: errorResponse.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};

// Export classes and functions for use in other Lambda functions
export {
  CircuitBreaker,
  CircuitState,
  GracefulDegradationManager,
  formatErrorResponse,
  ServiceUnavailableError,
  TimeoutError,
  ValidationError,
  ResourceNotFoundError,
};
