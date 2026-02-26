# AI Response Generation System

This module implements the AI response generation system for the Voice-First AI Learning Assistant, including response generation, mode control, and semantic search capabilities.

## Components

### 1. Response Generator (`response-generator/`)

Generates AI responses using Amazon Bedrock with cost optimization strategies.

**Features:**
- Cost-optimized model selection (Haiku for simple queries, Sonnet for complex)
- 24-hour response caching (60% cost reduction target)
- Content source prioritization (uploaded documents first)
- Multi-language support (English, Hindi, Hinglish)
- Conversation context management

**Requirements Addressed:**
- 7.1: Prioritize information from uploaded documents
- 7.2: Clearly state source limitations
- 7.3: Indicate when using general knowledge

**API Endpoint:** `POST /ai/generate`

**Request:**
```json
{
  "userId": "user123",
  "query": "Explain recursion",
  "sessionId": "session456",
  "mode": "tutor",
  "language": "en",
  "conversationHistory": [
    {
      "role": "user",
      "content": "What is a function?",
      "timestamp": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "text": "Recursion is when a function calls itself...",
  "mode": "tutor",
  "confidence": 0.85,
  "sources": [
    {
      "documentId": "doc123",
      "chunkId": "chunk456",
      "text": "Relevant content from uploaded document",
      "relevanceScore": 0.92
    }
  ],
  "followUpSuggestions": [
    "Can you explain this with an example?",
    "What are the key points I should remember?"
  ],
  "modelUsed": "haiku",
  "cached": false,
  "cost": 0.00015
}
```

### 2. Mode Controller (`mode-controller/`)

Manages interaction modes (tutor, interviewer, mentor) with adaptive personality.

**Features:**
- Three interaction modes: tutor, interviewer, mentor
- Personality adaptation based on user profile and skill level
- Mode transition validation and communication
- Mode history tracking

**Requirements Addressed:**
- 10.1: Tutoring mode with explanatory teaching style
- 10.2: Mock interview mode with realistic scenarios
- 10.3: Mentoring mode with career guidance
- 10.4: Clear mode change communication

**API Endpoints:**

**Switch Mode:** `POST /mode/switch`
```json
{
  "userId": "user123",
  "targetMode": "interviewer",
  "sessionId": "session456",
  "context": {
    "reason": "User wants to practice interviews"
  }
}
```

**Get Current Mode:** `GET /mode/current?userId=user123`

**Validate Transition:** `POST /mode/validate`
```json
{
  "currentMode": "tutor",
  "targetMode": "interviewer"
}
```

### 3. Semantic Search (`semantic-search/`)

Implements hybrid search combining vector similarity and keyword matching.

**Features:**
- Vector search using Amazon Bedrock Titan embeddings
- Keyword-based search with stop word filtering
- Hybrid search combining both approaches (70% semantic, 30% keyword)
- Result ranking and relevance scoring
- Cross-document search capabilities

**Requirements Addressed:**
- 1.3: Cross-document search capabilities
- 7.1: Content source prioritization

**API Endpoint:** `POST /search/semantic`

**Request:**
```json
{
  "userId": "user123",
  "query": "machine learning algorithms",
  "maxResults": 10,
  "searchType": "hybrid",
  "filters": {
    "documentIds": ["doc123", "doc456"],
    "topics": ["AI", "ML"],
    "minRelevance": 0.5
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "chunkId": "chunk789",
      "documentId": "doc123",
      "text": "Machine learning algorithms include...",
      "relevanceScore": 0.92,
      "metadata": {
        "topic": "Machine Learning",
        "pageNumber": 15,
        "section": "Chapter 3"
      },
      "matchType": "both"
    }
  ],
  "totalResults": 5,
  "searchType": "hybrid"
}
```

## Cost Optimization

### Model Selection Strategy

The response generator automatically selects the most cost-effective model:

- **Haiku** ($0.00025/1K input tokens): Simple queries, basic Q&A
- **Sonnet** ($0.003/1K input tokens): Complex reasoning, multi-step problems

**Complexity Analysis:**
- Query length (word count)
- Presence of complex keywords (explain, compare, analyze, etc.)
- Conversation history length

### Caching Strategy

- **Cache TTL:** 24 hours
- **Cache Key:** Hash of userId + normalized query
- **Expected Hit Rate:** 60%
- **Cost Savings:** ~60% reduction in Bedrock API costs

### Cost Tracking

Each response includes actual cost calculation:
```typescript
{
  "modelUsed": "haiku",
  "cached": false,
  "cost": 0.00015  // Actual cost in USD
}
```

## Environment Variables

All Lambda functions require:

```bash
EMBEDDINGS_TABLE=voice-learning-embeddings
SESSIONS_TABLE=voice-learning-sessions
USER_PROFILES_TABLE=voice-learning-user-profiles
AWS_REGION=us-east-1
```

## Deployment

These Lambda functions are deployed as part of the main CDK stack:

```bash
cd infrastructure
npm run build
cdk deploy
```

## Testing

Each component includes unit tests:

```bash
cd lambda/ai-response/response-generator
npm install
npm test
```

## Monitoring

Key metrics to monitor:

1. **Response Generator:**
   - Model selection distribution (Haiku vs Sonnet)
   - Cache hit rate (target: 60%)
   - Average response cost
   - Response latency

2. **Mode Controller:**
   - Mode switch frequency
   - Mode distribution (tutor/interviewer/mentor)
   - Transition validation failures

3. **Semantic Search:**
   - Search latency
   - Average result count
   - Search type distribution (semantic/keyword/hybrid)

## Security

- All API endpoints require Cognito authentication
- Data encrypted at rest using KMS
- Session data auto-expires after 30 days (DynamoDB TTL)
- Cache entries auto-expire after 24 hours

## Future Enhancements

1. **Response Generator:**
   - Implement streaming responses for better UX
   - Add response quality scoring
   - Support for code execution and validation

2. **Mode Controller:**
   - Add custom modes (e.g., exam prep, project mentor)
   - Implement mode recommendations based on user behavior
   - Add mode-specific analytics

3. **Semantic Search:**
   - Migrate to dedicated vector database (Chroma on EC2)
   - Implement approximate nearest neighbor search
   - Add query expansion and synonym handling
   - Support for image and code search
