import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Mode Controller Lambda Function
 * Manages interaction modes (tutor, interviewer, mentor) with adaptive behavior
 * Requirements: 10.1, 10.2, 10.3, 10.4 (adaptive mode switching and personality)
 */

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || '';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || '';

// Interaction modes
export enum InteractionMode {
  TUTOR = 'tutor',
  INTERVIEWER = 'interviewer',
  MENTOR = 'mentor',
}

interface ModeContext {
  previousMode?: InteractionMode;
  reason?: string;
  userRequest?: boolean;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  preferredLanguage: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  currentMode: InteractionMode;
  modeHistory: ModeTransition[];
  preferences: {
    explanationStyle: 'detailed' | 'concise' | 'visual';
    difficultyLevel: 'easy' | 'medium' | 'hard';
  };
}

interface ModeTransition {
  fromMode: InteractionMode | null;
  toMode: InteractionMode;
  timestamp: number;
  reason: string;
}

interface PersonalityConfig {
  tone: string;
  responseStyle: string;
  questioningApproach: string;
  feedbackStyle: string;
  exampleUsage: string;
  languageComplexity: string;
}

interface ModeSwitchRequest {
  userId: string;
  targetMode: InteractionMode;
  context?: ModeContext;
  sessionId: string;
}

interface ModeSwitchResponse {
  success: boolean;
  currentMode: InteractionMode;
  previousMode: InteractionMode | null;
  transitionMessage: string;
  personalityConfig: PersonalityConfig;
}

/**
 * Main Lambda handler for mode switching
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Mode Controller invoked', { path: event.rawPath, method: event.requestContext.http.method });

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/mode/switch')) {
      return await handleModeSwitch(event);
    } else if (method === 'GET' && path.includes('/mode/current')) {
      return await handleGetCurrentMode(event);
    } else if (method === 'POST' && path.includes('/mode/validate')) {
      return await handleValidateTransition(event);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in mode controller:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process mode request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle mode switch request
 * Requirement 10.1, 10.2, 10.3: Mode switching with personality adaptation
 */
async function handleModeSwitch(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: ModeSwitchRequest = JSON.parse(event.body || '{}');

  // Validate required fields
  if (!body.userId || !body.targetMode || !body.sessionId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: userId, targetMode, sessionId',
      }),
    };
  }

  // Validate target mode
  if (!Object.values(InteractionMode).includes(body.targetMode)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Invalid target mode. Must be: tutor, interviewer, or mentor',
      }),
    };
  }

  // Get user profile
  const userProfile = await getUserProfile(body.userId);
  if (!userProfile) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'User profile not found' }),
    };
  }

  const currentMode = userProfile.currentMode;

  // Check if already in target mode
  if (currentMode === body.targetMode) {
    const personalityConfig = adaptPersonality(body.targetMode, userProfile);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        currentMode: currentMode,
        previousMode: currentMode,
        transitionMessage: `You are already in ${body.targetMode} mode.`,
        personalityConfig: personalityConfig,
      }),
    };
  }

  // Validate mode transition
  const isValid = validateModeTransition(currentMode, body.targetMode);
  if (!isValid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Cannot transition from ${currentMode} to ${body.targetMode}`,
        suggestion: 'Please complete current mode session before switching',
      }),
    };
  }

  // Perform mode switch
  const result = await switchMode(body.userId, body.targetMode, currentMode, body.context, body.sessionId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

/**
 * Handle get current mode request
 */
async function handleGetCurrentMode(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing userId parameter' }),
    };
  }

  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'User profile not found' }),
    };
  }

  const personalityConfig = adaptPersonality(userProfile.currentMode, userProfile);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentMode: userProfile.currentMode,
      personalityConfig: personalityConfig,
      modeHistory: userProfile.modeHistory.slice(-5), // Last 5 transitions
    }),
  };
}

/**
 * Handle validate transition request
 */
async function handleValidateTransition(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}');
  const { currentMode, targetMode } = body;

  if (!currentMode || !targetMode) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing currentMode or targetMode' }),
    };
  }

  const isValid = validateModeTransition(currentMode, targetMode);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valid: isValid,
      currentMode: currentMode,
      targetMode: targetMode,
      message: isValid
        ? `Transition from ${currentMode} to ${targetMode} is allowed`
        : `Transition from ${currentMode} to ${targetMode} is not recommended`,
    }),
  };
}

/**
 * Switch user to new interaction mode
 * Requirement 10.4: Clear mode transition communication
 */
async function switchMode(
  userId: string,
  targetMode: InteractionMode,
  currentMode: InteractionMode,
  context: ModeContext | undefined,
  sessionId: string
): Promise<ModeSwitchResponse> {
  // Get user profile for personality adaptation
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('User profile not found');
  }

  // Create mode transition record
  const transition: ModeTransition = {
    fromMode: currentMode,
    toMode: targetMode,
    timestamp: Date.now(),
    reason: context?.reason || 'User requested mode change',
  };

  // Update user profile with new mode
  await updateUserMode(userId, targetMode, transition);

  // Adapt personality for new mode
  const personalityConfig = adaptPersonality(targetMode, userProfile);

  // Generate transition message (Requirement 10.4)
  const transitionMessage = generateTransitionMessage(currentMode, targetMode, userProfile);

  // Log mode change to session
  await logModeChange(sessionId, userId, transition);

  return {
    success: true,
    currentMode: targetMode,
    previousMode: currentMode,
    transitionMessage: transitionMessage,
    personalityConfig: personalityConfig,
  };
}

/**
 * Adapt personality configuration based on mode and user profile
 * Requirement 10.2: Personality adaptation for each mode
 */
function adaptPersonality(mode: InteractionMode, userProfile: UserProfile): PersonalityConfig {
  const skillLevel = userProfile.skillLevel;
  const explanationStyle = userProfile.preferences.explanationStyle;

  let config: PersonalityConfig;

  switch (mode) {
    case InteractionMode.TUTOR:
      config = {
        tone: 'patient, encouraging, and supportive',
        responseStyle: explanationStyle === 'detailed' 
          ? 'comprehensive explanations with step-by-step breakdowns'
          : explanationStyle === 'concise'
          ? 'clear and concise explanations'
          : 'visual explanations with diagrams and examples',
        questioningApproach: 'Socratic method - guide through questions',
        feedbackStyle: 'constructive and positive',
        exampleUsage: 'frequent real-world examples and analogies',
        languageComplexity: skillLevel === 'beginner' 
          ? 'simple, beginner-friendly language'
          : skillLevel === 'intermediate'
          ? 'moderate technical terminology'
          : 'advanced technical language',
      };
      break;

    case InteractionMode.INTERVIEWER:
      config = {
        tone: 'professional, objective, and evaluative',
        responseStyle: 'structured interview questions with follow-ups',
        questioningApproach: 'progressive difficulty - start easy, increase complexity',
        feedbackStyle: 'honest and constructive with improvement suggestions',
        exampleUsage: 'scenario-based questions and case studies',
        languageComplexity: 'professional interview language',
      };
      break;

    case InteractionMode.MENTOR:
      config = {
        tone: 'friendly, experienced, and motivational',
        responseStyle: 'advice-oriented with practical strategies',
        questioningApproach: 'reflective questions to encourage self-discovery',
        feedbackStyle: 'supportive with actionable guidance',
        exampleUsage: 'career stories and learning path examples',
        languageComplexity: 'conversational and relatable',
      };
      break;

    default:
      config = {
        tone: 'neutral and helpful',
        responseStyle: 'balanced and informative',
        questioningApproach: 'clarifying questions',
        feedbackStyle: 'objective',
        exampleUsage: 'relevant examples',
        languageComplexity: 'moderate',
      };
  }

  return config;
}

/**
 * Validate if mode transition is allowed
 * All transitions are allowed, but some may require confirmation
 */
function validateModeTransition(
  currentMode: InteractionMode,
  targetMode: InteractionMode
): boolean {
  // All mode transitions are valid
  // In a more complex system, you might restrict certain transitions
  // For example, might want to complete an interview before switching
  return true;
}

/**
 * Generate user-friendly transition message
 * Requirement 10.4: Clear mode change communication
 */
function generateTransitionMessage(
  fromMode: InteractionMode,
  toMode: InteractionMode,
  userProfile: UserProfile
): string {
  const name = userProfile.name || 'there';
  let message = '';

  switch (toMode) {
    case InteractionMode.TUTOR:
      message = `Hi ${name}! I'm now in Tutor mode. I'll help you learn by explaining concepts step-by-step with examples. `;
      message += `Feel free to ask questions and request clarification anytime. Let's learn together!`;
      break;

    case InteractionMode.INTERVIEWER:
      message = `Hello ${name}! I'm now in Interview mode. I'll simulate a realistic interview experience. `;
      message += `I'll ask you technical questions and provide feedback on your answers. Ready to practice?`;
      break;

    case InteractionMode.MENTOR:
      message = `Hey ${name}! I'm now in Mentor mode. I'm here to provide guidance on your learning journey. `;
      message += `We can discuss study strategies, career goals, and how to overcome challenges. What's on your mind?`;
      break;
  }

  // Add context about previous mode if switching
  if (fromMode !== toMode) {
    message += `\n\n(Switched from ${fromMode} mode)`;
  }

  return message;
}

/**
 * Get user profile from DynamoDB
 */
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: USER_PROFILES_TABLE,
        Key: { userId },
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user's current mode in profile
 */
async function updateUserMode(
  userId: string,
  newMode: InteractionMode,
  transition: ModeTransition
): Promise<void> {
  try {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: USER_PROFILES_TABLE,
        Key: { userId },
        UpdateExpression: 'SET currentMode = :mode, modeHistory = list_append(if_not_exists(modeHistory, :empty), :transition), lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':mode': newMode,
          ':transition': [transition],
          ':empty': [],
          ':timestamp': Date.now(),
        },
      })
    );
  } catch (error) {
    console.error('Error updating user mode:', error);
    throw error;
  }
}

/**
 * Log mode change to session for context preservation
 */
async function logModeChange(
  sessionId: string,
  userId: string,
  transition: ModeTransition
): Promise<void> {
  try {
    const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    await dynamoClient.send(
      new PutCommand({
        TableName: SESSIONS_TABLE,
        Item: {
          sessionId: sessionId,
          timestamp: transition.timestamp,
          userId: userId,
          eventType: 'mode_change',
          fromMode: transition.fromMode,
          toMode: transition.toMode,
          reason: transition.reason,
          ttl: ttl,
        },
      })
    );
  } catch (error) {
    console.error('Error logging mode change:', error);
    // Don't throw - logging failure shouldn't break mode switch
  }
}
