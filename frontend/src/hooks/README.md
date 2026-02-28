# Hooks

This directory contains custom React hooks for reusable logic.

## Custom Hooks

- **useAuth.ts** - Authentication state and methods
- **useVoiceEngine.ts** - Voice interaction functionality
- **useNetworkMonitor.ts** - Network connectivity and quality monitoring
- **useOnlineStatus.ts** - Simple online/offline state (exported from useNetworkMonitor.ts)

## Usage Examples

### useNetworkMonitor

Monitor network state and quality with detailed information:

```typescript
import { useNetworkMonitor } from '../hooks/useNetworkMonitor';

function MyComponent() {
  const {
    isOnline,
    quality, // 'excellent' | 'good' | 'fair' | 'poor' | 'offline'
    effectiveType, // '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown'
    downlink, // Mbps
    rtt, // Round-trip time in ms
    saveData, // User's data saver preference
    isSuitableForHeavyOperations,
    shouldEnableLowBandwidthMode,
    recommendedImageQuality, // 'high' | 'medium' | 'low'
    recommendedTimeout, // milliseconds
  } = useNetworkMonitor();

  return (
    <div>
      {!isOnline && <OfflineBanner />}
      {shouldEnableLowBandwidthMode && <LowBandwidthNotice />}
      <NetworkIndicator quality={quality} />
    </div>
  );
}
```

### useOnlineStatus

Lightweight hook for simple online/offline detection:

```typescript
import { useOnlineStatus } from '../hooks/useNetworkMonitor';

function MyComponent() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {isOnline ? 'Connected' : 'Offline'}
    </div>
  );
}
```

Example hook structure:
```typescript
import { useState, useEffect } from 'react'

export function useCustomHook() {
  const [state, setState] = useState()
  
  useEffect(() => {
    // side effects
  }, [])
  
  return { state, methods }
}
```
