/**
 * Conversation Context Manager
 * Manages conversation history, context preservation across mode switches, and topic thread separation
 * Requirements: 4.4 (context across modes), 5.2 (conversation history), 5.3 (follow-up questions), 5.5 (topic threads)
 */

import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || '';

// Maximum conversation history to maintain (for cost optimization)
const MAX_CONVERSATION_HISTORY = 50;
const MAX_RECENT_QUERIES = 10;

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  language?: string;
  mode?: InteractionMode;
  topicId?: string;
}

interface SessionContext {
  language: string;
  recentQueries: string[];
  relevantDocuments: string[];
  userUnderstandingLevel: number;
  topicProgress: Record<string, number>;
  currentTopicThread?: TopicThread;
  topicThreads: TopicThread[];
}

interface TopicThread {
  topicId: string;
  topicName: string;
  startTimestamp: number;
  lastTimestamp: number;
  conversationTurns: ConversationTurn[];
  mode: InteractionMode;
  understandingLevel: number;
}

enum InteractionMode {
  TUTOR = 'tutor',
  INTERVIEWER = 'interviewer',
  MENTOR = 'mentor',
}

interface ContextRequest {
  action:
    | 'add_turn'
    | 'get_context'
    | 'switch_mode'
    | 'switch_topic'
    | 'get_history'
    | 'update_understanding';
  sessionId: string;
  turn?: ConversationTurn;
  newMode?: InteractionMode;
  topicId?: string;
  topicName?: string;
  understandingLevel?: number;
  limit?: number;
}

/**
 * Lambda handler for context management operations
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Context Manager Event:', JSON.stringify(event, null, 2));

  try {
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return createResponse(401, { error: 'Unauthorized: User ID not found' });
    }

    // Parse request body
    const request: ContextRequest = JSON.parse(event.body || '{}');

    // Route to appropriate handler based on action
    switch (request.action) {
      case 'add_turn':
        return await addConversationTurn(request.sessionId, request.turn!);
      case 'get_context':
        return await getConversationContext(request.sessionId);
      case 'switch_mode':
        return await switchMode(request.sessionId, request.newMode!);
      case 'switch_topic':
        return await switchTopic(
          request.sessionId,
          request.topicId!,
          request.topicName!
        );
      case 'get_history':
        return await getConversationHistory(request.sessionId, request.limit);
      case 'update_understanding':
        return await updateUnderstandingLevel(
          request.sessionId,
          request.understandingLevel!
        );
      default:
        return createResponse(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in context manager:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Add a conversation turn to the session
 * Requirement 5.2: Conversation history management
 */
async function addConversationTurn(
  sessionId: string,
  turn: ConversationTurn
): Promise<APIGatewayProxyResult> {
  try {
    // Get current session
    const session = await getSession(sessionId);
    if (!session) {
      return createResponse(404, { error: 'Session not found' });
    }

    // Add timestamp if not provided
    if (!turn.timestamp) {
      turn.timestamp = Date.now();
    }

    // Add turn to conversation history
    const conversationHistory = session.conversationHistory || [];
    conversationHistory.push(turn);

    // Trim history if it exceeds maximum
    if (conversationHistory.length > MAX_CONVERSATION_HISTORY) {
      conversationHistory.shift();
    }

    // Update recent queries if this is a user turn
    const context = session.context || createDefaultContext();
    if (turn.role === 'user') {
      context.recentQueries = context.recentQueries || [];
      context.recentQueries.push(turn.content);
      if (context.recentQueries.length > MAX_RECENT_QUERIES) {
        context.recentQueries.shift();
      }
    }

    // Update topic thread if topicId is provided
    if (turn.topicId) {
      context.topicThreads = context.topicThreads || [];
      const threadIndex = context.topicThreads.findIndex(
        (t) => t.topicId === turn.topicId
      );

      if (threadIndex >= 0) {
        // Update existing thread
        context.topicThreads[threadIndex].conversationTurns.push(turn);
        context.topicThreads[threadIndex].lastTimestamp = turn.timestamp;
      } else {
        // Create new thread
        const newThread: TopicThread = {
          topicId: turn.topicId,
          topicName: turn.topicId, // Will be updated when topic is switched
          startTimestamp: turn.timestamp,
          lastTimestamp: turn.timestamp,
          conversationTurns: [turn],
          mode: turn.mode || InteractionMode.TUTOR,
          understandingLevel: context.userUnderstandingLevel || 0.5,
        };
        context.topicThreads.push(newThread);
        context.currentTopicThread = newThread;
      }
    }

    // Update session in DynamoDB
    await updateSessionData(sessionId, session.timestamp, {
      conversationHistory,
      context,
      lastUpdated: Date.now(),
    });

    console.log('Conversation turn added to session:', sessionId);
    return createResponse(200, {
      message: 'Conversation turn added successfully',
      historyLength: conversationHistory.length,
    });
  } catch (error) {
    console.error('Error adding conversation turn:', error);
    throw error;
  }
}

/**
 * Get conversation context for a session
 * Requirement 5.3: Context for follow-up questions
 */
async function getConversationContext(
  sessionId: string
): Promise<APIGatewayProxyResult> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return createResponse(404, { error: 'Session not found' });
    }

    const context = session.context || createDefaultContext();

    // Get recent conversation (last 10 turns for context)
    const recentConversation = (session.conversationHistory || []).slice(-10);

    return createResponse(200, {
      context,
      recentConversation,
      currentTopic: session.currentTopic,
      mode: session.mode,
    });
  } catch (error) {
    console.error('Error getting conversation context:', error);
    throw error;
  }
}

/**
 * Switch interaction mode while preserving context
 * Requirement 4.4: Context preservation across mode switches
 */
async function switchMode(
  sessionId: string,
  newMode: InteractionMode
): Promise<APIGatewayProxyResult> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return createResponse(404, { error: 'Session not found' });
    }

    const oldMode = session.mode;

    // Add a system message to conversation history about mode switch
    const conversationHistory = session.conversationHistory || [];
    conversationHistory.push({
      role: 'assistant',
      content: `Switching from ${oldMode} mode to ${newMode} mode. Context and conversation history preserved.`,
      timestamp: Date.now(),
      mode: newMode,
    });

    // Update current topic thread with new mode
    const context = session.context || createDefaultContext();
    if (context.currentTopicThread) {
      context.currentTopicThread.mode = newMode;
    }

    // Update session
    await updateSessionData(sessionId, session.timestamp, {
      mode: newMode,
      conversationHistory,
      context,
      lastUpdated: Date.now(),
    });

    console.log(`Mode switched from ${oldMode} to ${newMode} for session:`, sessionId);
    return createResponse(200, {
      message: 'Mode switched successfully',
      oldMode,
      newMode,
      contextPreserved: true,
    });
  } catch (error) {
    console.error('Error switching mode:', error);
    throw error;
  }
}

/**
 * Switch to a new topic while maintaining separate thread
 * Requirement 5.5: Topic thread separation
 */
async function switchTopic(
  sessionId: string,
  topicId: string,
  topicName: string
): Promise<APIGatewayProxyResult> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return createResponse(404, { error: 'Session not found' });
    }

    const context = session.context || createDefaultContext();
    context.topicThreads = context.topicThreads || [];

    // Find existing thread or create new one
    let topicThread = context.topicThreads.find((t) => t.topicId === topicId);

    if (!topicThread) {
      // Create new topic thread
      topicThread = {
        topicId,
        topicName,
        startTimestamp: Date.now(),
        lastTimestamp: Date.now(),
        conversationTurns: [],
        mode: session.mode,
        understandingLevel: context.userUnderstandingLevel || 0.5,
      };
      context.topicThreads.push(topicThread);
    } else {
      // Update existing thread
      topicThread.lastTimestamp = Date.now();
    }

    // Set as current topic thread
    context.currentTopicThread = topicThread;

    // Add system message about topic switch
    const conversationHistory = session.conversationHistory || [];
    conversationHistory.push({
      role: 'assistant',
      content: `Switching to topic: ${topicName}. Previous topic context preserved in separate thread.`,
      timestamp: Date.now(),
      topicId,
    });

    // Update session
    await updateSessionData(sessionId, session.timestamp, {
      currentTopic: topicName,
      conversationHistory,
      context,
      lastUpdated: Date.now(),
    });

    console.log(`Topic switched to ${topicName} for session:`, sessionId);
    return createResponse(200, {
      message: 'Topic switched successfully',
      topicId,
      topicName,
      threadCount: context.topicThreads.length,
    });
  } catch (error) {
    console.error('Error switching topic:', error);
    throw error;
  }
}

/**
 * Get conversation history with optional filtering
 * Requirement 5.2: Conversation history reference
 */
async function getConversationHistory(
  sessionId: string,
  limit?: number
): Promise<APIGatewayProxyResult> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return createResponse(404, { error: 'Session not found' });
    }

    const conversationHistory = session.conversationHistory || [];
    const limitValue = limit || conversationHistory.length;
    const history = conversationHistory.slice(-limitValue);

    return createResponse(200, {
      history,
      totalTurns: conversationHistory.length,
      returnedTurns: history.length,
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
}

/**
 * Update user understanding level for adaptive responses
 */
async function updateUnderstandingLevel(
  sessionId: string,
  understandingLevel: number
): Promise<APIGatewayProxyResult> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return createResponse(404, { error: 'Session not found' });
    }

    const context = session.context || createDefaultContext();
    context.userUnderstandingLevel = Math.max(0, Math.min(1, understandingLevel));

    // Update current topic thread understanding level
    if (context.currentTopicThread) {
      context.currentTopicThread.understandingLevel = context.userUnderstandingLevel;
    }

    await updateSessionData(sessionId, session.timestamp, {
      context,
      lastUpdated: Date.now(),
    });

    console.log(`Understanding level updated to ${understandingLevel} for session:`, sessionId);
    return createResponse(200, {
      message: 'Understanding level updated successfully',
      understandingLevel: context.userUnderstandingLevel,
    });
  } catch (error) {
    console.error('Error updating understanding level:', error);
    throw error;
  }
}

/**
 * Helper: Get session from DynamoDB
 */
async function getSession(sessionId: string): Promise<any | null> {
  const result = await dynamoClient.send(
    new GetItemCommand({
      TableName: SESSIONS_TABLE,
      Key: marshall({ sessionId }),
    })
  );

  if (!result.Item) {
    return null;
  }

  return unmarshall(result.Item);
}

/**
 * Helper: Update session data in DynamoDB
 */
async function updateSessionData(
  sessionId: string,
  timestamp: number,
  updates: Record<string, any>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = updates[key];
  });

  await dynamoClient.send(
    new UpdateItemCommand({
      TableName: SESSIONS_TABLE,
      Key: marshall({ sessionId, timestamp }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues, {
        removeUndefinedValues: true,
      }),
    })
  );
}

/**
 * Helper: Create default context
 */
function createDefaultContext(): SessionContext {
  return {
    language: 'en',
    recentQueries: [],
    relevantDocuments: [],
    userUnderstandingLevel: 0.5,
    topicProgress: {},
    topicThreads: [],
  };
}

/**
 * Helper function to create API Gateway response
 */
function createResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}
