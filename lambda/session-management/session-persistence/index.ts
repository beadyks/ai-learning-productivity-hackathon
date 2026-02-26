/**
 * Session Persistence Service
 * Handles CRUD operations for user learning sessions
 * Requirements: 5.1 (session restoration), 5.4 (data persistence)
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || '';
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || '';

// Session TTL: 30 days (in seconds)
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

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

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  language?: string;
}

interface SessionContext {
  language: string;
  recentQueries: string[];
  relevantDocuments: string[];
  userUnderstandingLevel: number;
  topicProgress: Record<string, number>;
}

enum InteractionMode {
  TUTOR = 'tutor',
  INTERVIEWER = 'interviewer',
  MENTOR = 'mentor',
}

interface SessionRequest {
  action: 'create' | 'get' | 'update' | 'delete' | 'list' | 'restore';
  sessionId?: string;
  userId?: string;
  session?: Partial<LearningSession>;
}

/**
 * Lambda handler for session persistence operations
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Session Persistence Event:', JSON.stringify(event, null, 2));

  try {
    // Extract user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return createResponse(401, { error: 'Unauthorized: User ID not found' });
    }

    // Parse request body
    const request: SessionRequest = JSON.parse(event.body || '{}');

    // Route to appropriate handler based on action
    switch (request.action) {
      case 'create':
        return await createSession(userId, request.session);
      case 'get':
        return await getSession(request.sessionId!);
      case 'update':
        return await updateSession(request.sessionId!, request.session!);
      case 'delete':
        return await deleteSession(request.sessionId!);
      case 'list':
        return await listUserSessions(userId);
      case 'restore':
        return await restoreLatestSession(userId);
      default:
        return createResponse(400, { error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in session persistence:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create a new learning session
 * Requirement 5.1: Session state management
 */
async function createSession(
  userId: string,
  sessionData?: Partial<LearningSession>
): Promise<APIGatewayProxyResult> {
  const now = Date.now();
  const sessionId = `session-${userId}-${now}`;

  const session: LearningSession = {
    sessionId,
    userId,
    timestamp: now,
    startTime: new Date(now).toISOString(),
    currentTopic: sessionData?.currentTopic || '',
    conversationHistory: sessionData?.conversationHistory || [],
    mode: sessionData?.mode || InteractionMode.TUTOR,
    context: sessionData?.context || {
      language: 'en',
      recentQueries: [],
      relevantDocuments: [],
      userUnderstandingLevel: 0.5,
      topicProgress: {},
    },
    ttl: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    lastUpdated: now,
  };

  try {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: SESSIONS_TABLE,
        Item: marshall(session, { removeUndefinedValues: true }),
      })
    );

    console.log('Session created:', sessionId);
    return createResponse(201, {
      message: 'Session created successfully',
      session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get a specific session by ID
 * Requirement 5.1: Session restoration
 */
async function getSession(
  sessionId: string
): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamoClient.send(
      new GetItemCommand({
        TableName: SESSIONS_TABLE,
        Key: marshall({ sessionId }),
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Session not found' });
    }

    const session = unmarshall(result.Item) as LearningSession;
    return createResponse(200, { session });
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}

/**
 * Update an existing session
 * Requirement 5.4: Data persistence across system restarts
 */
async function updateSession(
  sessionId: string,
  updates: Partial<LearningSession>
): Promise<APIGatewayProxyResult> {
  const now = Date.now();

  // Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (updates.currentTopic !== undefined) {
    updateExpressions.push('#currentTopic = :currentTopic');
    expressionAttributeNames['#currentTopic'] = 'currentTopic';
    expressionAttributeValues[':currentTopic'] = updates.currentTopic;
  }

  if (updates.conversationHistory !== undefined) {
    updateExpressions.push('#conversationHistory = :conversationHistory');
    expressionAttributeNames['#conversationHistory'] = 'conversationHistory';
    expressionAttributeValues[':conversationHistory'] = updates.conversationHistory;
  }

  if (updates.mode !== undefined) {
    updateExpressions.push('#mode = :mode');
    expressionAttributeNames['#mode'] = 'mode';
    expressionAttributeValues[':mode'] = updates.mode;
  }

  if (updates.context !== undefined) {
    updateExpressions.push('#context = :context');
    expressionAttributeNames['#context'] = 'context';
    expressionAttributeValues[':context'] = updates.context;
  }

  // Always update lastUpdated and TTL
  updateExpressions.push('#lastUpdated = :lastUpdated');
  expressionAttributeNames['#lastUpdated'] = 'lastUpdated';
  expressionAttributeValues[':lastUpdated'] = now;

  updateExpressions.push('#ttl = :ttl');
  expressionAttributeNames['#ttl'] = 'ttl';
  expressionAttributeValues[':ttl'] = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  try {
    // First, get the timestamp for the update
    const getResult = await dynamoClient.send(
      new GetItemCommand({
        TableName: SESSIONS_TABLE,
        Key: marshall({ sessionId }),
      })
    );

    if (!getResult.Item) {
      return createResponse(404, { error: 'Session not found' });
    }

    const existingSession = unmarshall(getResult.Item) as LearningSession;

    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: SESSIONS_TABLE,
        Key: marshall({ sessionId, timestamp: existingSession.timestamp }),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: marshall(expressionAttributeValues, {
          removeUndefinedValues: true,
        }),
        ReturnValues: 'ALL_NEW',
      })
    );

    console.log('Session updated:', sessionId);
    return createResponse(200, {
      message: 'Session updated successfully',
      sessionId,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

/**
 * Delete a session
 */
async function deleteSession(
  sessionId: string
): Promise<APIGatewayProxyResult> {
  try {
    // First get the session to retrieve the timestamp
    const getResult = await dynamoClient.send(
      new GetItemCommand({
        TableName: SESSIONS_TABLE,
        Key: marshall({ sessionId }),
      })
    );

    if (!getResult.Item) {
      return createResponse(404, { error: 'Session not found' });
    }

    const session = unmarshall(getResult.Item) as LearningSession;

    await dynamoClient.send(
      new DeleteItemCommand({
        TableName: SESSIONS_TABLE,
        Key: marshall({ sessionId, timestamp: session.timestamp }),
      })
    );

    console.log('Session deleted:', sessionId);
    return createResponse(200, {
      message: 'Session deleted successfully',
      sessionId,
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * List all sessions for a user
 * Uses GSI for efficient querying
 */
async function listUserSessions(
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'UserSessionIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
        ScanIndexForward: false, // Most recent first
        Limit: 20, // Limit to last 20 sessions
      })
    );

    const sessions = (result.Items || []).map((item) =>
      unmarshall(item)
    ) as LearningSession[];

    return createResponse(200, {
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('Error listing sessions:', error);
    throw error;
  }
}

/**
 * Restore the most recent session for a user
 * Requirement 5.1: Session restoration on return
 */
async function restoreLatestSession(
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: SESSIONS_TABLE,
        IndexName: 'UserSessionIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
        ScanIndexForward: false, // Most recent first
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(404, {
        error: 'No previous session found',
        message: 'User has no existing sessions to restore',
      });
    }

    const session = unmarshall(result.Items[0]) as LearningSession;

    console.log('Session restored:', session.sessionId);
    return createResponse(200, {
      message: 'Session restored successfully',
      session,
    });
  } catch (error) {
    console.error('Error restoring session:', error);
    throw error;
  }
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
