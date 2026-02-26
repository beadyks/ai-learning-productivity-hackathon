import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Plan Tracker Lambda Function
 * Handles plan modifications, progress tracking, and completion status management
 * Requirements: 2.5 (plan modifications), 5.1 (session persistence and progress)
 */

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const PROGRESS_TABLE = process.env.PROGRESS_TABLE || '';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || '';

interface PlanModificationRequest {
  userId: string;
  planId: string;
  modificationType: 'extend_deadline' | 'adjust_daily_hours' | 'skip_topic' | 'add_topic' | 'reorder_topics';
  modifications: {
    newTargetDate?: string;
    newDailyHours?: number;
    topicId?: string;
    newTopicName?: string;
    newTopicOrder?: string[];
  };
  reason?: string;
}

interface ProgressUpdateRequest {
  userId: string;
  planId: string;
  topicId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  hoursSpent?: number;
  notes?: string;
  confidence?: number; // 1-5 scale
}

interface TopicProgress {
  topicId: string;
  topicName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  hoursSpent: number;
  hoursAllocated: number;
  completionPercentage: number;
  lastUpdated: number;
  notes: string[];
  confidence: number;
}

interface StudyPlan {
  planId: string;
  userId: string;
  goalId: string;
  dailySessions: any[];
  totalDuration: number;
  estimatedCompletion: string;
  topicSequence: string[];
  milestones: any[];
  createdAt: number;
  status: 'active' | 'completed' | 'paused';
  lastModified?: number;
  modificationHistory?: PlanModification[];
}

interface PlanModification {
  timestamp: number;
  modificationType: string;
  changes: any;
  reason: string;
}

interface PlanProgress {
  planId: string;
  userId: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  skippedTopics: number;
  totalHoursSpent: number;
  totalHoursAllocated: number;
  overallProgress: number; // 0-100
  currentDay: number;
  daysRemaining: number;
  onTrack: boolean;
  topicProgress: TopicProgress[];
  lastUpdated: number;
}

/**
 * Main Lambda handler for plan tracking
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Plan Tracker invoked', { path: event.rawPath, method: event.requestContext.http.method });

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/study-plan/modify')) {
      return await handlePlanModification(event);
    } else if (method === 'POST' && path.includes('/study-plan/progress')) {
      return await handleProgressUpdate(event);
    } else if (method === 'GET' && path.includes('/study-plan/progress')) {
      return await handleGetProgress(event);
    } else if (method === 'POST' && path.includes('/study-plan/pause')) {
      return await handlePausePlan(event);
    } else if (method === 'POST' && path.includes('/study-plan/resume')) {
      return await handleResumePlan(event);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in plan tracker:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to process plan tracking request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle plan modification request
 * Requirement 2.5: Adjust schedule while maintaining goal feasibility
 */
async function handlePlanModification(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: PlanModificationRequest = JSON.parse(event.body || '{}');

  // Validate required fields
  if (!body.userId || !body.planId || !body.modificationType) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: userId, planId, modificationType',
      }),
    };
  }

  // Get existing plan
  const plan = await getStudyPlan(body.planId);
  if (!plan) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Study plan not found' }),
    };
  }

  // Verify ownership
  if (plan.userId !== body.userId) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized to modify this plan' }),
    };
  }

  // Apply modifications based on type
  let modifiedPlan: StudyPlan;
  switch (body.modificationType) {
    case 'extend_deadline':
      modifiedPlan = await extendDeadline(plan, body.modifications.newTargetDate!);
      break;
    case 'adjust_daily_hours':
      modifiedPlan = await adjustDailyHours(plan, body.modifications.newDailyHours!);
      break;
    case 'skip_topic':
      modifiedPlan = await skipTopic(plan, body.modifications.topicId!);
      break;
    case 'add_topic':
      modifiedPlan = await addTopic(plan, body.modifications.newTopicName!);
      break;
    case 'reorder_topics':
      modifiedPlan = await reorderTopics(plan, body.modifications.newTopicOrder!);
      break;
    default:
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid modification type' }),
      };
  }

  // Record modification
  const modification: PlanModification = {
    timestamp: Date.now(),
    modificationType: body.modificationType,
    changes: body.modifications,
    reason: body.reason || 'User requested modification',
  };

  modifiedPlan.modificationHistory = modifiedPlan.modificationHistory || [];
  modifiedPlan.modificationHistory.push(modification);
  modifiedPlan.lastModified = Date.now();

  // Save modified plan
  await saveStudyPlan(modifiedPlan);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      plan: modifiedPlan,
      modification: modification,
    }),
  };
}

/**
 * Handle progress update request
 * Requirement 5.1: Track learning progress
 */
async function handleProgressUpdate(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: ProgressUpdateRequest = JSON.parse(event.body || '{}');

  // Validate required fields
  if (!body.userId || !body.planId || !body.topicId || !body.status) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: userId, planId, topicId, status',
      }),
    };
  }

  // Get existing plan
  const plan = await getStudyPlan(body.planId);
  if (!plan) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Study plan not found' }),
    };
  }

  // Update topic progress
  const progressKey = `${body.planId}_${body.topicId}`;
  await updateTopicProgress(
    body.userId,
    progressKey,
    body.status,
    body.hoursSpent || 0,
    body.notes,
    body.confidence
  );

  // Get updated overall progress
  const overallProgress = await calculateOverallProgress(body.userId, body.planId);

  // Check if plan is complete
  if (overallProgress.completedTopics === overallProgress.totalTopics) {
    await updatePlanStatus(body.planId, 'completed');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      topicProgress: {
        topicId: body.topicId,
        status: body.status,
        hoursSpent: body.hoursSpent,
      },
      overallProgress: overallProgress,
    }),
  };
}

/**
 * Handle get progress request
 */
async function handleGetProgress(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const planId = event.queryStringParameters?.planId;
  const userId = event.queryStringParameters?.userId;

  if (!planId || !userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing planId or userId parameter' }),
    };
  }

  const progress = await calculateOverallProgress(userId, planId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  };
}

/**
 * Handle pause plan request
 */
async function handlePausePlan(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}');
  const { userId, planId } = body;

  if (!userId || !planId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing userId or planId' }),
    };
  }

  await updatePlanStatus(planId, 'paused');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, status: 'paused' }),
  };
}

/**
 * Handle resume plan request
 */
async function handleResumePlan(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || '{}');
  const { userId, planId } = body;

  if (!userId || !planId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing userId or planId' }),
    };
  }

  await updatePlanStatus(planId, 'active');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, status: 'active' }),
  };
}

/**
 * Extend plan deadline
 */
async function extendDeadline(plan: StudyPlan, newTargetDate: string): Promise<StudyPlan> {
  const oldDate = new Date(plan.estimatedCompletion);
  const newDate = new Date(newTargetDate);
  
  // Calculate additional days
  const additionalDays = Math.ceil((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Update plan
  plan.estimatedCompletion = newTargetDate;
  plan.totalDuration += additionalDays;
  
  // Redistribute topics across new timeline
  // This is a simplified version - in production, you'd regenerate sessions
  
  return plan;
}

/**
 * Adjust daily hours
 */
async function adjustDailyHours(plan: StudyPlan, newDailyHours: number): Promise<StudyPlan> {
  // Recalculate sessions with new daily hours
  // This is a simplified version - in production, you'd regenerate sessions
  
  plan.dailySessions = plan.dailySessions.map(session => ({
    ...session,
    totalHours: newDailyHours,
  }));
  
  return plan;
}

/**
 * Skip a topic
 */
async function skipTopic(plan: StudyPlan, topicId: string): Promise<StudyPlan> {
  // Remove topic from sequence
  plan.topicSequence = plan.topicSequence.filter(id => id !== topicId);
  
  // Remove from daily sessions
  plan.dailySessions = plan.dailySessions.map(session => ({
    ...session,
    topics: session.topics.filter((t: any) => t.topicId !== topicId),
  }));
  
  return plan;
}

/**
 * Add a new topic
 */
async function addTopic(plan: StudyPlan, newTopicName: string): Promise<StudyPlan> {
  const newTopicId = `topic_${Date.now()}`;
  
  // Add to sequence
  plan.topicSequence.push(newTopicId);
  
  // Add to last session (simplified - in production, you'd redistribute)
  if (plan.dailySessions.length > 0) {
    const lastSession = plan.dailySessions[plan.dailySessions.length - 1];
    lastSession.topics.push({
      topicId: newTopicId,
      topicName: newTopicName,
      allocatedHours: 2,
      activities: [`Study ${newTopicName}`],
      learningObjectives: [`Understand ${newTopicName}`],
    });
  }
  
  return plan;
}

/**
 * Reorder topics
 */
async function reorderTopics(plan: StudyPlan, newTopicOrder: string[]): Promise<StudyPlan> {
  // Validate that all topics are present
  const currentTopics = new Set(plan.topicSequence);
  const newTopics = new Set(newTopicOrder);
  
  if (currentTopics.size !== newTopics.size) {
    throw new Error('New topic order must contain all existing topics');
  }
  
  // Update sequence
  plan.topicSequence = newTopicOrder;
  
  // Regenerate sessions with new order (simplified)
  // In production, you'd fully regenerate the daily sessions
  
  return plan;
}

/**
 * Update topic progress
 */
async function updateTopicProgress(
  userId: string,
  progressKey: string,
  status: string,
  hoursSpent: number,
  notes?: string,
  confidence?: number
): Promise<void> {
  try {
    const existingProgress = await getTopicProgress(userId, progressKey);
    
    const updatedNotes = existingProgress?.notes || [];
    if (notes) {
      updatedNotes.push(notes);
    }

    await dynamoClient.send(
      new PutCommand({
        TableName: PROGRESS_TABLE,
        Item: {
          userId,
          topicId: progressKey,
          status,
          hoursSpent: (existingProgress?.hoursSpent || 0) + hoursSpent,
          notes: updatedNotes,
          confidence: confidence || existingProgress?.confidence || 3,
          lastUpdated: Date.now(),
        },
      })
    );
  } catch (error) {
    console.error('Error updating topic progress:', error);
    throw error;
  }
}

/**
 * Get topic progress
 */
async function getTopicProgress(userId: string, progressKey: string): Promise<any> {
  try {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: PROGRESS_TABLE,
        Key: {
          userId,
          topicId: progressKey,
        },
      })
    );

    return result.Item || null;
  } catch (error) {
    console.error('Error getting topic progress:', error);
    return null;
  }
}

/**
 * Calculate overall progress for a plan
 */
async function calculateOverallProgress(userId: string, planId: string): Promise<PlanProgress> {
  try {
    // Get plan
    const plan = await getStudyPlan(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Get all topic progress for this plan
    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: PROGRESS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'begins_with(topicId, :planPrefix)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':planPrefix': planId,
        },
      })
    );

    const topicProgressList: TopicProgress[] = [];
    let completedTopics = 0;
    let inProgressTopics = 0;
    let skippedTopics = 0;
    let totalHoursSpent = 0;

    // Process each topic progress
    for (const item of result.Items || []) {
      if (item.status === 'completed') completedTopics++;
      if (item.status === 'in_progress') inProgressTopics++;
      if (item.status === 'skipped') skippedTopics++;
      totalHoursSpent += item.hoursSpent || 0;

      topicProgressList.push({
        topicId: item.topicId,
        topicName: item.topicName || 'Unknown',
        status: item.status,
        hoursSpent: item.hoursSpent || 0,
        hoursAllocated: item.hoursAllocated || 0,
        completionPercentage: item.status === 'completed' ? 100 : item.status === 'in_progress' ? 50 : 0,
        lastUpdated: item.lastUpdated,
        notes: item.notes || [],
        confidence: item.confidence || 3,
      });
    }

    const totalTopics = plan.topicSequence.length;
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Calculate days remaining
    const now = new Date();
    const targetDate = new Date(plan.estimatedCompletion);
    const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = plan.totalDuration - daysRemaining;

    // Determine if on track
    const expectedProgress = currentDay > 0 ? (currentDay / plan.totalDuration) * 100 : 0;
    const onTrack = overallProgress >= expectedProgress * 0.9; // 90% of expected progress

    return {
      planId,
      userId,
      totalTopics,
      completedTopics,
      inProgressTopics,
      skippedTopics,
      totalHoursSpent,
      totalHoursAllocated: plan.totalDuration * (plan.dailySessions[0]?.totalHours || 0),
      overallProgress,
      currentDay: Math.max(0, currentDay),
      daysRemaining: Math.max(0, daysRemaining),
      onTrack,
      topicProgress: topicProgressList,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error calculating overall progress:', error);
    throw error;
  }
}

/**
 * Update plan status
 */
async function updatePlanStatus(planId: string, status: 'active' | 'completed' | 'paused'): Promise<void> {
  try {
    // Extract userId from planId
    const parts = planId.split('_');
    if (parts.length < 3) {
      throw new Error('Invalid planId format');
    }
    const userId = parts[1];

    await dynamoClient.send(
      new UpdateCommand({
        TableName: PROGRESS_TABLE,
        Key: {
          userId,
          topicId: planId,
        },
        UpdateExpression: 'SET #status = :status, lastModified = :timestamp',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':timestamp': Date.now(),
        },
      })
    );
  } catch (error) {
    console.error('Error updating plan status:', error);
    throw error;
  }
}

/**
 * Get study plan from DynamoDB
 */
async function getStudyPlan(planId: string): Promise<StudyPlan | null> {
  try {
    // Extract userId from planId
    const parts = planId.split('_');
    if (parts.length < 3) {
      return null;
    }
    const userId = parts[1];

    const result = await dynamoClient.send(
      new GetCommand({
        TableName: PROGRESS_TABLE,
        Key: {
          userId,
          topicId: planId,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as StudyPlan;
  } catch (error) {
    console.error('Error getting study plan:', error);
    throw error;
  }
}

/**
 * Save study plan to DynamoDB
 */
async function saveStudyPlan(plan: StudyPlan): Promise<void> {
  try {
    await dynamoClient.send(
      new PutCommand({
        TableName: PROGRESS_TABLE,
        Item: {
          userId: plan.userId,
          topicId: plan.planId,
          ...plan,
        },
      })
    );
  } catch (error) {
    console.error('Error saving study plan:', error);
    throw error;
  }
}
