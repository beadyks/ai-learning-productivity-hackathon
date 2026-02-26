# Performance Optimization Module

This module contains Lambda functions for bandwidth optimization and comprehensive error handling to ensure the Voice-First AI Learning Assistant operates efficiently even in low-bandwidth scenarios and handles errors gracefully.

## Components

### 1. Bandwidth Optimizer (`bandwidth-optimizer/`)

Implements response compression, progressive loading, and offline mode capabilities to optimize bandwidth usage for low-connectivity scenarios.

**Features:**
- **Response Compression**: Supports Gzip and Brotli compression algorithms
- **Progressive Loading**: Splits large content into manageable chunks
- **Offline Cache**: Manages cached data for offline access
- **Automatic Algorithm Selection**: Chooses best compression based on client support

**API Actions:**
- `compress`: Compress response data with automatic algorithm selection
- `progressive`: Split content into chunks for progressive loading
- `cache-set`: Store data in offline cache
- `cache-get`: Retrieve data from offline cache
- `cache-list`: List all cached entries

**Requirements Addressed:**
- 8.1: Optimize response delivery for minimal bandwidth usage
- 8.4: Notify users and suggest offline alternatives when performance degrades

### 2. Error Handler (`error-handler/`)

Implements circuit breaker patterns, graceful degradation mechanisms, and user-friendly error communication.

**Features:**
- **Circuit Breaker**: Prevents cascading failures by temporarily disabling failing services
- **Graceful Degradation**: Maintains core functionality when non-critical services fail
- **User-Friendly Error Messages**: Provides clear, actionable error messages with suggestions
- **Service Health Monitoring**: Tracks service health and adjusts feature availability

**API Actions:**
- `handle-error`: Format errors into user-friendly messages
- `circuit-breaker-execute`: Execute operations with circuit breaker protection
- `circuit-breaker-reset`: Reset circuit breaker for a service
- `degradation-status`: Get current system degradation level
- `update-service-health`: Update health status of a service

**Requirements Addressed:**
- 1.4: Return descriptive error messages for unsupported file formats
- 1.5: Notify users and provide guidance when content analysis fails
- 4.5: Gracefully fall back to text input when voice processing fails
- 8.5: Clearly communicate limitations when features are unavailable

## Error Types and User Messages

### Document Processing Errors
- **UnsupportedFileFormat**: Clear guidance on supported formats
- **FileTooLarge**: Suggestions for file size reduction
- **ExtractionFailed**: Alternative approaches for text extraction

### Voice Processing Errors
- **TranscriptionFailed**: Tips for improving voice input quality
- **PoorAudioQuality**: Suggestions for better recording conditions

### Service Errors
- **ServiceUnavailable**: Retry guidance and offline mode suggestions
- **Timeout**: Recommendations for simpler operations
- **NetworkError**: Connectivity troubleshooting steps

## Circuit Breaker Configuration

Default configuration:
- **Failure Threshold**: 5 failures before opening circuit
- **Success Threshold**: 2 successes to close circuit from half-open
- **Timeout**: 60 seconds for operations
- **Reset Timeout**: 30 seconds before attempting recovery

## Graceful Degradation Levels

- **Full**: All features available (90%+ services healthy)
- **Partial**: Core features available (50-90% services healthy)
- **Minimal**: Essential features only (<50% services healthy)

## Usage Examples

### Bandwidth Optimization

```typescript
// Compress response
const response = await fetch('/bandwidth-optimizer', {
  method: 'POST',
  headers: {
    'Accept-Encoding': 'br, gzip',
  },
  body: JSON.stringify({
    action: 'compress',
    data: largeResponseData,
    compressionLevel: 6,
  }),
});

// Progressive loading
const response = await fetch('/bandwidth-optimizer', {
  method: 'POST',
  body: JSON.stringify({
    action: 'progressive',
    content: largeContent,
    chunkSize: 5000,
    chunkIndex: 0,
  }),
});

// Offline cache
await fetch('/bandwidth-optimizer', {
  method: 'POST',
  body: JSON.stringify({
    action: 'cache-set',
    key: 'study-plan-123',
    data: studyPlanData,
    ttl: 3600000, // 1 hour
  }),
});
```

### Error Handling

```typescript
// Handle error with user-friendly message
const response = await fetch('/error-handler', {
  method: 'POST',
  body: JSON.stringify({
    action: 'handle-error',
    error: {
      name: 'Error',
      message: 'unsupported file format: .xyz',
    },
  }),
});

// Check degradation status
const response = await fetch('/error-handler', {
  method: 'POST',
  body: JSON.stringify({
    action: 'degradation-status',
  }),
});

// Update service health
await fetch('/error-handler', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update-service-health',
    serviceName: 'bedrock-ai',
    isHealthy: false,
  }),
});
```

## Integration with Other Services

These Lambda functions are designed to be used by other services in the system:

1. **API Gateway**: Use bandwidth optimizer for response compression
2. **Document Processing**: Use error handler for file processing errors
3. **Voice Processing**: Use error handler for transcription failures
4. **AI Response**: Use circuit breaker for Bedrock API calls
5. **All Services**: Use graceful degradation for service health monitoring

## Deployment

Both Lambda functions are deployed as part of the main CDK stack and are configured with:
- ARM64 architecture for cost optimization
- Appropriate IAM roles for service access
- CloudWatch logging for monitoring
- API Gateway integration for HTTP access

## Monitoring

Key metrics to monitor:
- Compression ratio and bandwidth savings
- Cache hit rate for offline mode
- Circuit breaker state changes
- Service health status
- Error frequency by type
- Degradation level changes

## Cost Optimization

These functions contribute to the ultra-low-cost architecture:
- Compression reduces data transfer costs
- Offline caching reduces API calls
- Circuit breaker prevents wasted retries
- Graceful degradation maintains service during partial failures
