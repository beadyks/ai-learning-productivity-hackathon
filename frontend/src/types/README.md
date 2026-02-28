# Types Directory

This directory contains all TypeScript type definitions and interfaces for the React PWA Frontend.

## Type Organization

Types are organized into logical modules for better maintainability:

### `user.types.ts`
- User profiles and authentication state
- Cognito user types
- User preferences and settings
- Language codes

### `voice.types.ts`
- Voice engine interfaces
- Speech recognition and synthesis types
- Voice state management
- Transcript results

### `message.types.ts`
- Chat messages and conversation types
- Interaction modes (tutor, interviewer, mentor)
- Message metadata and sources
- Session state

### `api.types.ts`
- HTTP request/response types
- API client interfaces
- Chat, upload, and progress API types
- Study plan request/response types

### `cache.types.ts`
- Cache service interfaces
- Offline request queueing
- Storage management types
- Cache state

### `document.types.ts`
- File upload types
- Upload progress tracking
- Document validation
- Document metadata

### `auth.types.ts`
- Authentication manager interface
- Token management types
- Auth errors and state

### `dashboard.types.ts`
- Progress tracking types
- Study plan types
- Achievement and streak data
- Goal management

### `ui.types.ts`
- UI component props
- Toast notifications
- Modal and loading states
- Navigation and viewport types

## Usage

Import types from the central index file:

```typescript
import { 
  UserProfile, 
  Message, 
  VoiceEngine,
  APIClient 
} from '@/types';
```

Or import from specific modules:

```typescript
import { UserProfile } from '@/types/user.types';
import { Message } from '@/types/message.types';
```

All types are documented with JSDoc comments for better IDE support.
