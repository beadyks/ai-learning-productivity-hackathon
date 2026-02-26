/**
 * Conversation Flow Orchestrator Lambda Function
 * 
 * Manages conversation flow control including:
 * - Main conversation handler
 * - Interaction flow control logic
 * - Confirmation waiting mechanisms
 * - Topic progression control
 * 
 * Requirements: 3.4 (confirmation before topic advancement)
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

// Environment variables
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || '';
const PROGRESS_TABLE = process.env.PROGRESS_TABLE || '';
const RESPONSE_GENERATOR_FUNCTION = process.env.RESPONSE_GENERATOR_FUNCTION || '';
const MODE_CONTROLLER_FUNCTION = process.env.MODE_CONTROLLER_FUNCTION || '';

// Conversation states
enum ConversationState {
  IDLE = 'idle',
  EXPLAINING = 'explaining',
  WAITING_CONFIRMATION = 'waiting_confirmation',
  CLARIFYING = 'clarifying',
  TRANSITIONING = 'transitioning',
}

// Confirmation keywords
const CONFIRMATION_KEYWORDS = {
  positive: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'understood', 'got it', 'clear', 'next', 'continue', 'proceed', 'haan', 'theek hai', 'samajh gaya', 'aage badho'],
  negative: ['no', 'nope', 'not yet', 'wait', 'confused', 'unclear', 'explain again', 'repeat', 'nahi', 'ruko', 'samajh nahi aaya'],
  clarification: ['what', 'how', 'why', 'explain', 'clarify', 'example', 'kya', 'kaise', 'kyun', 'samjhao'],
};

interface ConversationContext {
  sessionId: string;
  userId: string;
  currentTopic: string;
  state: ConversationState;
  lastMessage: string;
  lastResponse: string;
  awaitingConfirmation: boolean;
  confirmationAttempts: number;
  conversationHistory: ConversationTurn[];
  mode: string;
  language: string;
}

interface ConversationTurn {
  timestamp: number;
  userMessage: string;
  assistantResponse: string;
  topic: string;
  state: ConversationState;
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  console.log('Conversation Orchestrator invoked:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { userId, message, sessionId, action } = body;

    if (!userId || !message) {
      return createErrorResponse(400, 'Missing required fields: userId, message');
    }

    // Handle different actions
    switch (action) {
      case 'send_message':
        return await handleMessage(userId, message, sessionId);
      case 'confirm_understanding':
        return await handleConfirmation(userId, sessionId, true);
      case 'request_clarification':
        return await handleClarification(userId, message, sessionId);
      case 'get_state':
        return await getConversationState(userId, sessionId);
      default:
        return await handleMessage(userId, message, sessionId);
    }
  } catch (error) {
    console.error('Error in conversation orchestrator:', error);
    return createErrorResponse(500, 'Internal server error', {
      requestId: context.requestId,
    });
  }
};

/**
 * Handle incoming message and orchestrate conversation flow
 */
async function handleMessage(
  userId: string,
  message: string,
  sessionId?: string
): Promise<APIGatewayProxyResultV2> {
  // Get or create conversation context
  const conversationContext = await getOrCreateContext(userId, sessionId);

  // Check if we're waiting for confirmation
  if (conversationContext.awaitingConfirmation) {
    return await handleConfirmationResponse(userId, message, conversationContext);
  }

  // Detect intent from message
  const intent = detectIntent(message);

  // Update conversation state based on intent
  if (intent === 'clarification') {
    conversationContext.state = ConversationState.CLARIFYING;
  } else {
    conversationContext.state = ConversationState.EXPLAINING;
  }

  // Generate response using AI
  const aiResponse = await generateAIResponse(userId, message, conversationContext);

  // Update conversation context
  conversationContext.lastMessage = message;
  conversationContext.lastResponse = aiResponse.text;
  conversationContext.conversationHistory.push({
    timestamp: Date.now(),
    userMessage: message,
    assistantResponse: aiResponse.text,
    topic: conversationContext.currentTopic,
    state: conversationContext.state,
  });

  // Check if we should wait for confirmation before proceeding
  const shouldWaitForConfirmation = checkIfShouldWaitForConfirmation(
    aiResponse.text,
    conversationContext
  );

  if (shouldWaitForConfirmation) {
    conversationContext.state = ConversationState.WAITING_CONFIRMATION;
    conversationContext.awaitingConfirmation = true;
    conversationContext.confirmationAttempts = 0;
  }

  // Save updated context
  await saveContext(conversationContext);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      response: aiResponse.text,
      state: conversationContext.state,
      awaitingConfirmation: conversationContext.awaitingConfirmation,
      currentTopic: conversationContext.currentTopic,
      sessionId: conversationContext.sessionId,
      suggestions: aiResponse.suggestions,
    }),
  };
}

/**
 * Handle confirmation response from user
 */
async function handleConfirmationResponse(
  userId: string,
  message: string,
  context: ConversationContext
): Promise<APIGatewayProxyResultV2> {
  const intent = detectIntent(message);

  if (intent === 'positive_confirmation') {
    // User confirmed understanding - proceed to next topic
    context.awaitingConfirmation = false;
    context.state = ConversationState.TRANSITIONING;
    context.confirmationAttempts = 0;

    // Mark current topic as completed
    await markTopicCompleted(userId, context.currentTopic);

    // Get next topic
    const nextTopic = await getNextTopic(userId);

    if (nextTopic) {
      context.currentTopic = nextTopic.topicId;
      const transitionMessage = generateTransitionMessage(context.currentTopic, nextTopic.topicId, context.language);

      // Save context
      await saveContext(context);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: transitionMessage,
          state: context.state,
          awaitingConfirmation: false,
          currentTopic: nextTopic.topicId,
          sessionId: context.sessionId,
          topicCompleted: true,
        }),
      };
    } else {
      // No more topics - session complete
      const completionMessage = generateCompletionMessage(context.language);

      context.state = ConversationState.IDLE;
      await saveContext(context);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: completionMessage,
          state: context.state,
          awaitingConfirmation: false,
          sessionId: context.sessionId,
          sessionComplete: true,
        }),
      };
    }
  } else if (intent === 'negative_confirmation' || intent === 'clarification') {
    // User needs more explanation
    context.confirmationAttempts += 1;
    context.state = ConversationState.CLARIFYING;
    context.awaitingConfirmation = false;

    // Generate clarification response
    const clarificationResponse = await generateClarificationResponse(
      userId,
      message,
      context
    );

    context.lastMessage = message;
    context.lastResponse = clarificationResponse.text;
    context.conversationHistory.push({
      timestamp: Date.now(),
      userMessage: message,
      assistantResponse: clarificationResponse.text,
      topic: context.currentTopic,
      state: context.state,
    });

    // After clarification, wait for confirmation again
    context.state = ConversationState.WAITING_CONFIRMATION;
    context.awaitingConfirmation = true;

    await saveContext(context);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: clarificationResponse.text,
        state: context.state,
        awaitingConfirmation: true,
        currentTopic: context.currentTopic,
        sessionId: context.sessionId,
        clarificationProvided: true,
      }),
    };
  } else {
    // Ambiguous response - ask for explicit confirmation
    const confirmationPrompt = generateConfirmationPrompt(context.language);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: confirmationPrompt,
        state: context.state,
        awaitingConfirmation: true,
        currentTopic: context.currentTopic,
        sessionId: context.sessionId,
        needsExplicitConfirmation: true,
      }),
    };
  }
}

/**
 * Handle explicit confirmation
 */
async function handleConfirmation(
  userId: string,
  sessionId: string,
  confirmed: boolean
): Promise<APIGatewayProxyResultV2> {
  const context = await getOrCreateContext(userId, sessionId);

  if (confirmed) {
    return await handleConfirmationResponse(userId, 'yes', context);
  } else {
    return await handleConfirmationResponse(userId, 'no, I need more explanation', context);
  }
}

/**
 * Handle clarification request
 */
async function handleClarification(
  userId: string,
  message: string,
  sessionId?: string
): Promise<APIGatewayProxyResultV2> {
  const context = await getOrCreateContext(userId, sessionId);
  context.state = ConversationState.CLARIFYING;

  return await handleMessage(userId, message, context.sessionId);
}

/**
 * Get conversation state
 */
async function getConversationState(
  userId: string,
  sessionId?: string
): Promise<APIGatewayProxyResultV2> {
  const context = await getOrCreateContext(userId, sessionId);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      state: context.state,
      awaitingConfirmation: context.awaitingConfirmation,
      currentTopic: context.currentTopic,
      sessionId: context.sessionId,
      conversationHistory: context.conversationHistory.slice(-5), // Last 5 turns
    }),
  };
}

/**
 * Get or create conversation context
 */
async function getOrCreateContext(
  userId: string,
  sessionId?: string
): Promise<ConversationContext> {
  if (sessionId) {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: SESSIONS_TABLE,
          Key: {
            sessionId,
            timestamp: 0, // Use 0 for context record
          },
        })
      );

      if (result.Item) {
        return result.Item as ConversationContext;
      }
    } catch (error) {
      console.error('Error getting context:', error);
    }
  }

  // Create new context
  const newSessionId = sessionId || `session-${userId}-${Date.now()}`;
  const newContext: ConversationContext = {
    sessionId: newSessionId,
    userId,
    currentTopic: 'introduction',
    state: ConversationState.IDLE,
    lastMessage: '',
    lastResponse: '',
    awaitingConfirmation: false,
    confirmationAttempts: 0,
    conversationHistory: [],
    mode: 'tutor',
    language: 'en',
  };

  await saveContext(newContext);
  return newContext;
}

/**
 * Save conversation context
 */
async function saveContext(context: ConversationContext): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: SESSIONS_TABLE,
      Item: {
        ...context,
        timestamp: 0, // Use 0 for context record
        ttl: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days TTL
      },
    })
  );
}

/**
 * Detect intent from user message
 */
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Check for positive confirmation
  if (CONFIRMATION_KEYWORDS.positive.some(keyword => lowerMessage.includes(keyword))) {
    return 'positive_confirmation';
  }

  // Check for negative confirmation
  if (CONFIRMATION_KEYWORDS.negative.some(keyword => lowerMessage.includes(keyword))) {
    return 'negative_confirmation';
  }

  // Check for clarification request
  if (CONFIRMATION_KEYWORDS.clarification.some(keyword => lowerMessage.includes(keyword))) {
    return 'clarification';
  }

  return 'general_query';
}

/**
 * Check if we should wait for confirmation
 */
function checkIfShouldWaitForConfirmation(
  response: string,
  context: ConversationContext
): boolean {
  // Wait for confirmation after explaining a topic
  if (context.state === ConversationState.EXPLAINING) {
    // Check if response is substantial (more than 100 words)
    const wordCount = response.split(/\s+/).length;
    return wordCount > 100;
  }

  // Wait for confirmation after clarification
  if (context.state === ConversationState.CLARIFYING) {
    return true;
  }

  return false;
}

/**
 * Generate AI response
 */
async function generateAIResponse(
  userId: string,
  message: string,
  context: ConversationContext
): Promise<{ text: string; suggestions?: string[] }> {
  // Invoke response generator Lambda
  try {
    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: RESPONSE_GENERATOR_FUNCTION,
        Payload: JSON.stringify({
          userId,
          query: message,
          context: {
            currentTopic: context.currentTopic,
            mode: context.mode,
            language: context.language,
            conversationHistory: context.conversationHistory.slice(-3),
          },
        }),
      })
    );

    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    const body = JSON.parse(payload.body);

    return {
      text: body.response || 'I apologize, but I encountered an issue generating a response.',
      suggestions: body.suggestions,
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      text: 'I apologize, but I encountered an issue. Could you please try again?',
    };
  }
}

/**
 * Generate clarification response
 */
async function generateClarificationResponse(
  userId: string,
  message: string,
  context: ConversationContext
): Promise<{ text: string }> {
  // Similar to generateAIResponse but with clarification context
  return await generateAIResponse(userId, message, {
    ...context,
    state: ConversationState.CLARIFYING,
  });
}

/**
 * Mark topic as completed
 */
async function markTopicCompleted(userId: string, topicId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: PROGRESS_TABLE,
      Key: {
        userId,
        topicId,
      },
      UpdateExpression: 'SET #status = :completed, #completedAt = :timestamp',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#completedAt': 'completedAt',
      },
      ExpressionAttributeValues: {
        ':completed': 'completed',
        ':timestamp': Date.now(),
      },
    })
  );
}

/**
 * Get next topic for user
 */
async function getNextTopic(userId: string): Promise<{ topicId: string } | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: PROGRESS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: '#status = :pending',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':pending': 'pending',
        },
        Limit: 1,
      })
    );

    if (result.Items && result.Items.length > 0) {
      return { topicId: result.Items[0].topicId };
    }

    return null;
  } catch (error) {
    console.error('Error getting next topic:', error);
    return null;
  }
}

/**
 * Generate transition message
 */
function generateTransitionMessage(
  currentTopic: string,
  nextTopic: string,
  language: string
): string {
  if (language === 'hi') {
    return `बहुत अच्छा! आपने ${currentTopic} को समझ लिया है। अब हम ${nextTopic} पर आगे बढ़ेंगे। क्या आप तैयार हैं?`;
  } else {
    return `Great! You've understood ${currentTopic}. Now let's move on to ${nextTopic}. Are you ready?`;
  }
}

/**
 * Generate completion message
 */
function generateCompletionMessage(language: string): string {
  if (language === 'hi') {
    return 'बधाई हो! आपने सभी विषयों को पूरा कर लिया है। आपने बहुत अच्छा काम किया!';
  } else {
    return 'Congratulations! You\'ve completed all topics. You did a great job!';
  }
}

/**
 * Generate confirmation prompt
 */
function generateConfirmationPrompt(language: string): string {
  if (language === 'hi') {
    return 'क्या आप इस विषय को समझ गए हैं? कृपया "हाँ" या "नहीं" कहें।';
  } else {
    return 'Do you understand this topic? Please say "yes" or "no".';
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  details?: Record<string, any>
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  };
}
