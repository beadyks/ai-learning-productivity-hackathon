# Stores Directory

This directory contains Zustand state management stores for the application.

## Implemented Stores

### User Store (`userStore.ts`)
Manages user authentication state, profile data, and auth status.
- **State**: user, profile, isAuthenticated, isLoading
- **Actions**: setUser, setProfile, logout
- **Persistence**: Persists user and profile to localStorage
- **Requirements**: 5.1, 5.2, 5.3, 5.5

### Session Store (`sessionStore.ts`)
Manages conversation state, message history, and interaction modes.
- **State**: sessionId, mode, messages, isTyping, context
- **Actions**: addMessage, setMode, setTyping, clearMessages, updateContext
- **Persistence**: Persists session data (except typing indicator) to localStorage
- **Requirements**: 7.1, 7.2, 12.1

### Voice Store (`voiceStore.ts`)
Manages voice interaction state, language preferences, and transcripts.
- **State**: isListening, isSpeaking, language, selectedVoice, transcripts, error
- **Actions**: setListening, setSpeaking, setLanguage, setInterimTranscript, setFinalTranscript, setError
- **Persistence**: Persists language and voice preferences to localStorage
- **Requirements**: 2.1, 2.2, 3.1, 4.1

### Cache Store (`cacheStore.ts`)
Manages offline state, queued requests, and storage usage.
- **State**: isOnline, queuedRequests, storageUsage, lastSync
- **Actions**: setOnline, addQueuedRequest, removeQueuedRequest, updateStorageUsage, setLastSync
- **Persistence**: Persists queued requests and last sync time to localStorage
- **Requirements**: 1.3, 9.1, 9.2
- **Note**: Call `initializeNetworkListeners()` on app startup to enable online/offline detection

## Usage

```typescript
import { useUserStore, useSessionStore, useVoiceStore, useCacheStore } from './stores';

// In a React component
const MyComponent = () => {
  const { user, isAuthenticated, setUser } = useUserStore();
  const { messages, addMessage } = useSessionStore();
  const { isListening, setListening } = useVoiceStore();
  const { isOnline, queuedRequests } = useCacheStore();
  
  // Use state and actions...
};
```

## Persistence Strategy

All stores use Zustand's `persist` middleware to save state to localStorage:
- **User Store**: Persists authentication state for session continuity
- **Session Store**: Persists conversation history across page reloads
- **Voice Store**: Persists user preferences (language, voice selection)
- **Cache Store**: Persists offline queue for request synchronization

Transient state (loading indicators, typing status) is not persisted.
