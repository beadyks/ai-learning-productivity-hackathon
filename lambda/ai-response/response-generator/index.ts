import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Response Generator Lambda Function
 * Generates AI responses using Amazon Bedrock with cost optimization
 * Requirements: 7.1 (content prioritization), 7.2 (source limitation), 7.3 (general knowledge indication)
 */

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const EMBEDDINGS_TABLE = process.env.EMBEDDINGS_TABLE || '';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || '';
const CACHE_TTL_HOURS = 24;

// Model configuration for cost optimization
const HAIKU_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
const SONNET_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
const COMPLEXITY_THRESHOLD = 0.5; // Route to Sonnet if complexity > 0.5

interface ResponseRequest {
  userId: string;
  query: string;
  sessionId: string;
  mode: 'tutor' | 'interviewer' | 'mentor';
  language: string;
  conversationHistory?: ConversationTurn[];
}

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ContentSource {
  documentId: string;
  chunkId: string;
  text: string;
  relevanceScore: number;
  metadata?: {
    topic?: string;
    pageNumber?: number;
    section?: string;
  };
}

interface AIResponse {
  text: string;
  mode: string;
  confidence: number;
  sources: ContentSource[];
  followUpSuggestions?: string[];
  modelUsed: 'haiku' | 'sonnet';
  cached: boolean;
  cost: number;
}

/**
 * Main Lambda handler
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Response Generator invoked', { path: event.rawPath, method: event.requestContext.http.method });

    // Parse request body
    const body: ResponseRequest = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!body.userId || !body.query || !body.sessionId || !body.mode) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: userId, query, sessionId, mode',
        }),
      };
    }

    // Check cache first (Requirement: Cost optimization through caching)
    const cachedResponse = await getCachedResponse(body.userId, body.query);
    if (cachedResponse) {
      console.log('Cache hit for query', { userId: body.userId });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cachedResponse),
      };
    }

    // Retrieve relevant content from user's documents (Requirement 7.1)
    const relevantContent = await retrieveRelevantContent(body.userId, body.query);

    // Analyze query complexity to select appropriate model
    const complexity = analyzeQueryComplexity(body.query, body.conversationHistory);
    const modelId = complexity > COMPLEXITY_THRESHOLD ? SONNET_MODEL_ID : HAIKU_MODEL_ID;

    console.log('Generating response', { 
      modelId, 
      complexity, 
      contentSourcesFound: relevantContent.length 
    });

    // Generate response with content prioritization
    const response = await generateResponse(
      body.query,
      body.mode,
      body.language,
      relevantContent,
      body.conversationHistory || [],
      modelId
    );

    // Cache the response
    await cacheResponse(body.userId, body.query, response);

    // Update session with conversation turn
    await updateSession(body.sessionId, body.userId, {
      role: 'user',
      content: body.query,
      timestamp: Date.now(),
    });
    await updateSession(body.sessionId, body.userId, {
      role: 'assistant',
      content: response.text,
      timestamp: Date.now(),
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate response',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Retrieve relevant content from user's uploaded documents
 * Requirement 7.1: Prioritize information from uploaded documents
 */
async function retrieveRelevantContent(userId: string, query: string): Promise<ContentSource[]> {
  try {
    // Query embeddings table for user's documents
    // Note: This is a simplified version. In production, this would use vector similarity search
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: EMBEDDINGS_TABLE,
        IndexName: 'UserIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: 10, // Retrieve top 10 chunks for context
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Convert to ContentSource format
    return result.Items.map((item) => ({
      documentId: item.documentId,
      chunkId: item.chunkId,
      text: item.text,
      relevanceScore: 0.8, // Placeholder - would be calculated by vector similarity
      metadata: item.metadata,
    }));
  } catch (error) {
    console.error('Error retrieving relevant content:', error);
    return [];
  }
}

/**
 * Analyze query complexity to determine which model to use
 * Simple queries -> Haiku (12x cheaper)
 * Complex queries -> Sonnet (better reasoning)
 */
function analyzeQueryComplexity(query: string, history?: ConversationTurn[]): number {
  let complexity = 0;

  // Length-based complexity
  const wordCount = query.split(/\s+/).length;
  if (wordCount > 50) complexity += 0.3;
  else if (wordCount > 20) complexity += 0.1;

  // Keyword-based complexity
  const complexKeywords = [
    'explain', 'compare', 'analyze', 'evaluate', 'design', 'implement',
    'architecture', 'algorithm', 'optimize', 'debug', 'refactor'
  ];
  const hasComplexKeyword = complexKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  if (hasComplexKeyword) complexity += 0.3;

  // Context-based complexity
  if (history && history.length > 5) {
    complexity += 0.2; // Long conversations may need better context understanding
  }

  return Math.min(complexity, 1.0);
}

/**
 * Generate AI response using Amazon Bedrock
 * Requirements: 7.1, 7.2, 7.3 (content source prioritization and indication)
 */
async function generateResponse(
  query: string,
  mode: string,
  language: string,
  relevantContent: ContentSource[],
  conversationHistory: ConversationTurn[],
  modelId: string
): Promise<AIResponse> {
  // Build system prompt based on mode
  const systemPrompt = buildSystemPrompt(mode, language, relevantContent);

  // Build conversation context
  const messages = buildMessages(conversationHistory, query);

  // Prepare Bedrock request
  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2000,
    system: systemPrompt,
    messages: messages,
    temperature: 0.7,
  };

  console.log('Invoking Bedrock model', { modelId, messageCount: messages.length });

  // Invoke Bedrock
  const command = new InvokeModelCommand({
    modelId: modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Extract response text
  const responseText = responseBody.content[0].text;

  // Calculate cost (approximate)
  const inputTokens = JSON.stringify(requestBody).length / 4; // Rough estimate
  const outputTokens = responseText.length / 4;
  const cost = calculateCost(modelId, inputTokens, outputTokens);

  return {
    text: responseText,
    mode: mode,
    confidence: 0.85, // Placeholder - could be derived from model response
    sources: relevantContent,
    followUpSuggestions: generateFollowUpSuggestions(query, mode),
    modelUsed: modelId.includes('haiku') ? 'haiku' : 'sonnet',
    cached: false,
    cost: cost,
  };
}

/**
 * Build system prompt based on interaction mode and available content
 * Requirement 7.1: Prioritize uploaded document content
 * Requirement 7.2: Clearly state source limitations
 * Requirement 7.3: Indicate when using general knowledge
 */
function buildSystemPrompt(mode: string, language: string, relevantContent: ContentSource[]): string {
  let basePrompt = '';

  // Mode-specific personality
  switch (mode) {
    case 'tutor':
      basePrompt = 'You are a patient and encouraging tutor helping a student learn. ';
      basePrompt += 'Explain concepts in simple terms with real-world examples. ';
      basePrompt += 'Break down complex topics into manageable steps. ';
      break;
    case 'interviewer':
      basePrompt = 'You are a professional interviewer conducting a mock interview. ';
      basePrompt += 'Ask relevant technical questions and provide constructive feedback. ';
      basePrompt += 'Simulate realistic interview scenarios. ';
      break;
    case 'mentor':
      basePrompt = 'You are an experienced mentor providing career guidance. ';
      basePrompt += 'Offer practical advice, study strategies, and motivational support. ';
      basePrompt += 'Help the student develop effective learning habits. ';
      break;
    default:
      basePrompt = 'You are a helpful AI learning assistant. ';
  }

  // Language instruction
  if (language === 'hi' || language === 'hi-IN') {
    basePrompt += 'Respond in Hindi. ';
  } else if (language === 'hinglish') {
    basePrompt += 'Respond in Hinglish (mix of Hindi and English). ';
  } else {
    basePrompt += 'Respond in English. ';
  }

  // Content source prioritization (Requirement 7.1, 7.2, 7.3)
  if (relevantContent.length > 0) {
    basePrompt += '\n\nIMPORTANT: The student has uploaded study materials. ';
    basePrompt += 'ALWAYS prioritize information from these materials when answering questions. ';
    basePrompt += 'Here is the relevant content from their uploaded documents:\n\n';
    
    relevantContent.forEach((source, index) => {
      basePrompt += `[Source ${index + 1}]:\n${source.text}\n\n`;
    });

    basePrompt += '\nWhen answering:\n';
    basePrompt += '1. Use information from the uploaded materials above whenever possible\n';
    basePrompt += '2. If the answer is not in the uploaded materials, clearly state: "This information is not in your uploaded materials. Based on general knowledge..."\n';
    basePrompt += '3. Always cite which source you used (e.g., "According to Source 1...")\n';
  } else {
    basePrompt += '\n\nNOTE: The student has not uploaded any study materials yet, or no relevant content was found. ';
    basePrompt += 'You may use general knowledge to answer, but clearly indicate this by starting with: ';
    basePrompt += '"I don\'t have access to your specific study materials, so I\'ll provide a general answer..."\n';
  }

  return basePrompt;
}

/**
 * Build message array for Bedrock API
 */
function buildMessages(history: ConversationTurn[], currentQuery: string): any[] {
  const messages: any[] = [];

  // Add conversation history (limit to last 10 turns for context window)
  const recentHistory = history.slice(-10);
  recentHistory.forEach((turn) => {
    messages.push({
      role: turn.role,
      content: turn.content,
    });
  });

  // Add current query
  messages.push({
    role: 'user',
    content: currentQuery,
  });

  return messages;
}

/**
 * Calculate approximate cost for Bedrock API call
 */
function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  // Pricing per 1K tokens (as of design document)
  const pricing = {
    haiku: { input: 0.00025, output: 0.00125 },
    sonnet: { input: 0.003, output: 0.015 },
  };

  const model = modelId.includes('haiku') ? 'haiku' : 'sonnet';
  const inputCost = (inputTokens / 1000) * pricing[model].input;
  const outputCost = (outputTokens / 1000) * pricing[model].output;

  return inputCost + outputCost;
}

/**
 * Generate follow-up suggestions based on query and mode
 */
function generateFollowUpSuggestions(query: string, mode: string): string[] {
  const suggestions: string[] = [];

  if (mode === 'tutor') {
    suggestions.push('Can you explain this with an example?');
    suggestions.push('What are the key points I should remember?');
    suggestions.push('Can we practice this concept?');
  } else if (mode === 'interviewer') {
    suggestions.push('Can you ask me another question?');
    suggestions.push('How can I improve my answer?');
    suggestions.push('What are common mistakes to avoid?');
  } else if (mode === 'mentor') {
    suggestions.push('What should I focus on next?');
    suggestions.push('How can I improve my study strategy?');
    suggestions.push('What resources do you recommend?');
  }

  return suggestions;
}

/**
 * Check cache for existing response
 * Requirement: Cost optimization through 24-hour caching
 */
async function getCachedResponse(userId: string, query: string): Promise<AIResponse | null> {
  try {
    const cacheKey = generateCacheKey(userId, query);
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: SESSIONS_TABLE,
        Key: {
          sessionId: `cache#${cacheKey}`,
          timestamp: 0, // Use 0 for cache entries
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    // Check if cache is still valid (24 hours)
    const cacheAge = Date.now() - result.Item.createdAt;
    const cacheMaxAge = CACHE_TTL_HOURS * 60 * 60 * 1000;

    if (cacheAge > cacheMaxAge) {
      return null;
    }

    return {
      ...result.Item.response,
      cached: true,
      cost: 0, // Cached responses have no cost
    };
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

/**
 * Cache response for future use
 */
async function cacheResponse(userId: string, query: string, response: AIResponse): Promise<void> {
  try {
    const cacheKey = generateCacheKey(userId, query);
    const ttl = Math.floor(Date.now() / 1000) + (CACHE_TTL_HOURS * 60 * 60);

    await dynamoClient.send(
      new PutCommand({
        TableName: SESSIONS_TABLE,
        Item: {
          sessionId: `cache#${cacheKey}`,
          timestamp: 0,
          userId: userId,
          query: query,
          response: response,
          createdAt: Date.now(),
          ttl: ttl, // DynamoDB TTL for automatic cleanup
        },
      })
    );
  } catch (error) {
    console.error('Error caching response:', error);
    // Don't throw - caching failure shouldn't break the response
  }
}

/**
 * Generate cache key from user ID and query
 */
function generateCacheKey(userId: string, query: string): string {
  // Simple hash function for cache key
  const normalized = query.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${userId}#${hash}`;
}

/**
 * Update session with conversation turn
 */
async function updateSession(
  sessionId: string,
  userId: string,
  turn: ConversationTurn
): Promise<void> {
  try {
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    await dynamoClient.send(
      new PutCommand({
        TableName: SESSIONS_TABLE,
        Item: {
          sessionId: sessionId,
          timestamp: turn.timestamp,
          userId: userId,
          role: turn.role,
          content: turn.content,
          ttl: ttl,
        },
      })
    );
  } catch (error) {
    console.error('Error updating session:', error);
    // Don't throw - session update failure shouldn't break the response
  }
}
