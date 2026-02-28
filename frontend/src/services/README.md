# Services

This directory contains service layer implementations for external integrations and business logic.

## Services

### authService.ts
AWS Cognito authentication service that handles user authentication, token management, and session handling.

**Key Features:**
- User signup and login
- JWT token management with automatic refresh
- Session persistence and cleanup
- Secure credential storage

**Requirements:** 5.2, 5.3, 5.4, 5.5

### apiClient.ts
HTTP client for backend API communication using Axios.

**Key Features:**
- Axios-based HTTP client with request/response interceptors
- Automatic authentication header injection
- Cache-first strategy for GET requests with 24-hour TTL
- Offline fallback to cached responses
- Request queueing for offline scenarios
- Exponential backoff retry logic
- Circuit breaker pattern for preventing cascading failures
- Comprehensive error handling and transformation
- Gzip/Brotli compression support

**Requirements:** 5.3, 10.3, 9.1, 9.4, 13.1, 13.2

### cacheService.ts
Client-side caching and offline support using Cache API and IndexedDB.

**Key Features:**
- Cache API for response caching with TTL enforcement
- IndexedDB for offline request queueing
- Automatic cache eviction (FIFO) when storage limits reached
- Background sync for queued requests when connectivity returns
- Storage usage monitoring and management

**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5

### voiceEngine.ts
Browser Voice Engine using Web Speech API for zero-cost voice processing.

**Key Features:**
- Speech recognition using Web Speech API
- Text-to-speech using Speech Synthesis API
- Multilingual support (English, Hindi, Hinglish)
- Voice preference persistence
- Fallback to text input for unsupported browsers

**Requirements:** 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2

### networkMonitor.ts
Network state and quality monitoring service.

**Key Features:**
- Online/offline state detection
- Network quality assessment (excellent, good, fair, poor)
- Connection type detection (4g, 3g, 2g, wifi)
- Bandwidth and latency monitoring
- Automatic queue processing when connectivity returns
- Low-bandwidth mode recommendations
- Adaptive timeout suggestions based on network quality

**Requirements:** 1.5, 13.2

## Usage Examples

### API Client

```typescript
import { apiClient } from './services/apiClient';

// GET request with caching
const response = await apiClient.get('/chat/messages', {
  params: { sessionId: '123' },
  cache: true, // Use cache-first strategy
});

// POST request with retry
const result = await apiClient.post('/chat/send', {
  message: 'Hello',
  mode: 'tutor',
}, {
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
});

// Clear cache
await apiClient.clearCache();
```

### Cache Service

```typescript
import { cacheService } from './services/cacheService';

// Initialize cache
await cacheService.init();

// Cache data with TTL
await cacheService.set('user-profile', userData, 3600000); // 1 hour

// Get cached data
const cachedData = await cacheService.get('user-profile');

// Queue offline request
await cacheService.queueRequest({
  id: 'req-123',
  method: 'POST',
  url: '/api/messages',
  data: { message: 'Hello' },
  timestamp: Date.now(),
  retries: 0,
});

// Process queue when online
await cacheService.processQueue();
```

### Auth Service

```typescript
import { authManager } from './services/authService';

// Sign in
const result = await authManager.signIn('user@example.com', 'password');

// Get access token
const token = await authManager.getAccessToken();

// Check authentication status
const isAuth = await authManager.isAuthenticated();

// Sign out
await authManager.signOut();
```

### Network Monitor

```typescript
import { networkMonitor } from './services/networkMonitor';

// Initialize monitoring (done automatically in main.tsx)
const cleanup = networkMonitor.initialize();

// Get current network info
const info = networkMonitor.getCurrentNetworkInfo();
console.log(info.quality); // 'excellent' | 'good' | 'fair' | 'poor' | 'offline'

// Subscribe to network changes
const unsubscribe = networkMonitor.subscribe((info) => {
  console.log('Network changed:', info);
});

// Check if suitable for heavy operations
if (networkMonitor.isSuitableForHeavyOperations()) {
  // Upload large files, load high-res images, etc.
}

// Get recommended settings
const imageQuality = networkMonitor.getRecommendedImageQuality();
const timeout = networkMonitor.getRecommendedTimeout();
```

## Architecture

The services follow a layered architecture:

1. **API Client** - HTTP communication layer
   - Uses Axios for HTTP requests
   - Integrates with Auth Service for token management
   - Integrates with Cache Service for offline support
   - Implements circuit breaker for fault tolerance

2. **Cache Service** - Data persistence layer
   - Uses Cache API for response caching
   - Uses IndexedDB for offline queue
   - Manages storage quotas and eviction

3. **Auth Service** - Authentication layer
   - Uses AWS Amplify Auth for Cognito integration
   - Manages JWT tokens and refresh logic
   - Handles session cleanup

4. **Voice Engine** - Voice processing layer
   - Uses Web Speech API (browser-native, FREE)
   - No AWS costs for voice processing
   - Fallback to text input when unavailable

5. **Network Monitor** - Network state monitoring layer
   - Monitors online/offline state
   - Assesses network quality and connection type
   - Provides adaptive recommendations for timeouts and quality settings
   - Triggers queue processing when connectivity returns

## Error Handling

All services implement comprehensive error handling:

- **Network Errors**: Retry with exponential backoff, fallback to cache
- **Authentication Errors**: Automatic token refresh, clear error messages
- **Storage Errors**: Graceful degradation, quota management
- **Voice Errors**: Fallback to text input, user-friendly messages

## Testing

Each service has corresponding test files:
- `apiClient.test.ts` - API client unit tests
- `authService.test.ts` - Authentication tests (to be implemented)
- `cacheService.test.ts` - Cache service tests (to be implemented)
- `voiceEngine.test.ts` - Voice engine tests (to be implemented)

Run tests with: `npm test`

