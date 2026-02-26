# Session Management Module

This module provides session persistence and conversation context management for the Voice-First AI Learning Assistant.

## Components

### 1. Session Persistence Service (`session-persistence/`)

Handles CRUD operations for user learning sessions with DynamoDB integration.

**Requirements Addressed:**
- 5.1: Session restoration on user return
- 5.4: Data persistence across system restarts

**Features:**
- Create new learning sessions
- Get session by ID
- Update session data
- Delete sessions
- List user sessions
- Restore latest session for returning users
- Automatic TTL-based cleanup (30 days)

**API Actions:**
- `create`: Create a new session
- `get`: Retrieve a specific session
- `update`: Update session data
- `delete`: Delete a session
- `list`: List all sessions for a user
- `restore`: Restore the most recent session

**Example Request:**
```json
{
  "action": "create",
  "session": {
    "currentTopic": "JavaScript Basics",
    "mode": "tutor",
    "context": {
      "language": "en",
      "userUnderstandingLevel": 0.5
    }
  }
}
```

### 2. Conversation Context Manager (`context-manager/`)

Manages conversation history, context preservation across mode switches, and topic thread separation.

**Requirements Addressed:**
- 4.4: Context preservation across voice/text mode switches
- 5.2: Conversation history management
- 5.3: Context for follow-up questions
- 5.5: Topic thread separation

**Features:**
- Add conversation turns to history
- Maintain context across mode switches
- Separate topic threads for multi-topic conversations
- Track user understanding level
- Manage recent queries for context
- Preserve conversation history (up to 50 turns)

**API Actions:**
- `add_turn`: Add a conversation turn to history
- `get_context`: Get current conversation context
- `switch_mode`: Switch interaction mode (tutor/interviewer/mentor)
- `switch_topic`: Switch to a new topic with separate thread
- `get_history`: Retrieve conversation history
- `update_understanding`: Update user understanding level

**Example Request:**
```json
{
  "action": "add_turn",
  "sessionId": "session-user123-1234567890",
  "turn": {
    "role": "user",
    "content": "What is a closure in JavaScript?",
    "language": "en",
    "topicId": "javascript-closures"
  }
}
```

## Data Models

### LearningSession
```typescript
interface LearningSession {
  sessionId: string;
  userId: string;
  timestamp: number;
  startTime: string;
  currentTopic: string;
  conversationHistory: ConversationTurn[];
  mode: InteractionMode;
  context: SessionContext;
  ttl: number;
  lastUpdated: number;
}
```

### ConversationTurn
```typescript
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  language?: string;
  mode?: InteractionMode;
  topicId?: string;
}
```

### SessionContext
```typescript
interface SessionContext {
  language: string;
  recentQueries: string[];
  relevantDocuments: string[];
  userUnderstandingLevel: number;
  topicProgress: Record<string, number>;
  currentTopicThread?: TopicThread;
  topicThreads: TopicThread[];
}
```

### TopicThread
```typescript
interface TopicThread {
  topicId: string;
  topicName: string;
  startTimestamp: number;
  lastTimestamp: number;
  conversationTurns: ConversationTurn[];
  mode: InteractionMode;
  understandingLevel: number;
}
```

## DynamoDB Tables

### Sessions Table
- **Partition Key:** `sessionId` (String)
- **Sort Key:** `timestamp` (Number)
- **GSI:** `UserSessionIndex` (userId, timestamp)
- **TTL:** 30 days automatic cleanup
- **Encryption:** Customer-managed KMS key

## Environment Variables

Both Lambda functions require:
- `SESSIONS_TABLE`: DynamoDB sessions table name
- `USER_PROFILES_TABLE`: DynamoDB user profiles table name
- `AWS_REGION`: AWS region

## Cost Optimization

- **DynamoDB On-Demand:** Pay per request, no minimum costs
- **TTL:** Automatic cleanup of old sessions (30 days)
- **History Limits:** Max 50 conversation turns per session
- **Recent Queries:** Max 10 recent queries cached
- **Lambda ARM64:** 20% cost savings vs x86

## Security

- **Authentication:** Cognito JWT authorizer required
- **Encryption:** All data encrypted at rest with KMS
- **Authorization:** User ID extracted from JWT claims
- **CORS:** Configured for cross-origin requests

## API Integration

These Lambda functions are integrated with HTTP API Gateway:

**Session Persistence:**
- `POST /sessions` - Create/manage sessions

**Context Manager:**
- `POST /context` - Manage conversation context

## Testing

Run tests with:
```bash
npm test
```

## Deployment

These functions are deployed via AWS CDK in the main infrastructure stack. They are automatically configured with:
- IAM roles for DynamoDB access
- KMS encryption permissions
- API Gateway integration
- CloudWatch logging
