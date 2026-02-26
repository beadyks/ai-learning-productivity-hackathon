# API Orchestration and Integration

This directory contains Lambda functions for API orchestration, conversation flow management, and response quality optimization.

## Components

### 1. API Orchestrator (`api-orchestrator/`)

**Purpose**: Unified API endpoint management with request routing, validation, and rate limiting.

**Features**:
- Request routing to appropriate services
- Request validation against schemas
- Rate limiting based on subscription tier (free: 10/min, basic: 60/min, premium: 300/min)
- Request/response transformation
- Error handling and logging

**API Endpoints**:
- `POST /api/{proxy+}` - Catch-all route for orchestrated requests

**Environment Variables**:
- `RATE_LIMIT_TABLE` - DynamoDB table for rate limiting
- `USER_PROFILES_TABLE` - DynamoDB table for user profiles
- `AWS_REGION` - AWS region

**Requirements**: 11.1, 11.2

### 2. Conversation Orchestrator (`conversation-orchestrator/`)

**Purpose**: Manages conversation flow control and confirmation mechanisms.

**Features**:
- Main conversation handler
- Interaction flow control logic
- Confirmation waiting mechanisms
- Topic progression control
- Multi-language support (English, Hindi, Hinglish)

**Conversation States**:
- `IDLE` - No active conversation
- `EXPLAINING` - Explaining a topic
- `WAITING_CONFIRMATION` - Waiting for user confirmation
- `CLARIFYING` - Providing clarification
- `TRANSITIONING` - Moving to next topic

**API Endpoints**:
- `POST /conversation` - Send message and manage conversation flow
- `GET /conversation/state` - Get current conversation state

**Actions**:
- `send_message` - Send a message in the conversation
- `confirm_understanding` - Explicitly confirm understanding
- `request_clarification` - Request clarification on current topic
- `get_state` - Get current conversation state

**Environment Variables**:
- `SESSIONS_TABLE` - DynamoDB table for sessions
- `PROGRESS_TABLE` - DynamoDB table for progress tracking
- `RESPONSE_GENERATOR_FUNCTION` - Lambda function for AI response generation
- `MODE_CONTROLLER_FUNCTION` - Lambda function for mode control
- `AWS_REGION` - AWS region

**Requirements**: 3.4

### 3. Response Quality Optimizer (`response-quality-optimizer/`)

**Purpose**: Optimizes AI responses for beginner-friendly learning.

**Features**:
- Beginner-friendly language processing
- Complex term simplification
- Example generation for topics
- Analogy generation for better understanding
- Code example formatting with explanations
- Readability score calculation

**Optimization Capabilities**:
- Simplifies complex technical terms
- Breaks long sentences into shorter ones
- Adds paragraph breaks for better structure
- Converts passive voice to active voice
- Formats code blocks with proper indentation
- Generates topic-specific examples and analogies

**API Endpoints**:
- `POST /optimize/response` - Optimize response quality

**Request Body**:
```json
{
  "text": "Response text to optimize",
  "topic": "Topic name (e.g., 'variables', 'functions')",
  "targetLevel": "beginner|intermediate|advanced",
  "language": "en|hi",
  "includeExamples": true,
  "includeAnalogies": true,
  "formatCode": true
}
```

**Response**:
```json
{
  "originalText": "Original response",
  "optimizedText": "Optimized response",
  "simplifications": ["List of simplifications made"],
  "examples": ["Generated examples"],
  "analogies": ["Generated analogies"],
  "codeBlocks": [
    {
      "language": "javascript",
      "code": "Original code",
      "explanation": "Code explanation",
      "formatted": "Formatted code"
    }
  ],
  "readabilityScore": 75.5
}
```

**Environment Variables**:
- `AWS_REGION` - AWS region

**Requirements**: 3.1, 3.2, 3.3, 3.5

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (HTTP API)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                              ▼                                 ▼
                    ┌──────────────────┐            ┌──────────────────┐
                    │ API Orchestrator │            │   Conversation   │
                    │                  │            │  Orchestrator    │
                    │ - Rate Limiting  │            │                  │
                    │ - Validation     │            │ - Flow Control   │
                    │ - Routing        │            │ - Confirmation   │
                    └──────────────────┘            │ - State Mgmt     │
                              │                     └──────────────────┘
                              │                              │
                              ▼                              ▼
                    ┌──────────────────┐            ┌──────────────────┐
                    │    Response      │            │   AI Response    │
                    │     Quality      │            │    Generator     │
                    │   Optimizer      │            └──────────────────┘
                    │                  │
                    │ - Simplification │
                    │ - Examples       │
                    │ - Code Format    │
                    └──────────────────┘
```

## Rate Limiting

Rate limits are enforced per user based on subscription tier:

| Tier    | Requests/Minute | Cost/Month |
|---------|-----------------|------------|
| Free    | 10              | ₹0         |
| Basic   | 60              | ₹49        |
| Premium | 300             | ₹99        |

Rate limit information is returned in response headers:
- `X-RateLimit-Limit` - Maximum requests per minute
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Timestamp when rate limit resets

## Conversation Flow

1. **User sends message** → Conversation Orchestrator
2. **Check if waiting for confirmation**:
   - Yes → Process confirmation response
   - No → Generate AI response
3. **Determine if confirmation needed**:
   - Yes → Set state to WAITING_CONFIRMATION
   - No → Continue conversation
4. **On confirmation**:
   - Positive → Mark topic complete, move to next topic
   - Negative → Provide clarification, wait for confirmation again
5. **Repeat until all topics completed**

## Response Quality Optimization

The Response Quality Optimizer enhances AI responses through:

1. **Term Simplification**: Replaces complex technical terms with beginner-friendly explanations
2. **Code Formatting**: Extracts and formats code blocks with proper indentation and explanations
3. **Example Generation**: Adds real-world examples relevant to the topic
4. **Analogy Generation**: Creates analogies to help understand abstract concepts
5. **Readability Improvement**: Breaks long sentences, adds paragraph breaks, uses active voice
6. **Readability Scoring**: Calculates Flesch Reading Ease score (0-100)

## Deployment

All Lambda functions are deployed using AWS CDK with:
- ARM64 architecture for 20% cost savings
- Minified bundles for faster cold starts
- Appropriate IAM permissions
- Environment variables for configuration

## Testing

Run tests for each component:

```bash
# API Orchestrator
cd lambda/api-orchestrator
npm test

# Conversation Orchestrator
cd lambda/conversation-orchestrator
npm test

# Response Quality Optimizer
cd lambda/response-quality-optimizer
npm test
```

## Monitoring

All Lambda functions log to CloudWatch with:
- Request/response logging
- Error tracking
- Performance metrics
- Rate limit violations

## Cost Optimization

- ARM64 architecture: 20% cost reduction
- Efficient memory allocation (512MB-1024MB)
- Short timeout values (10-30 seconds)
- Rate limiting to prevent abuse
- DynamoDB on-demand billing
- TTL for automatic data cleanup
