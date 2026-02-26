import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Study Goal Analysis Lambda Function
 * Analyzes study goals, validates time constraints, and calculates realistic timelines
 * Requirements: 2.1 (goal specification), 2.3 (realistic alternatives)
 */

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE || '';
const PROGRESS_TABLE = process.env.PROGRESS_TABLE || '';

// Study goal types
export enum StudyGoalType {
  EXAM = 'exam',
  INTERVIEW = 'interview',
  JOB = 'job',
  PROJECT = 'project',
}

// Skill levels
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

interface StudyGoalRequest {
  userId: string;
  goalType: StudyGoalType;
  subject: string;
  targetDate: string; // ISO date string
  availableDailyHours: number;
  currentLevel: SkillLevel;
  specificTopics?: string[];
  additionalContext?: string;
}

interface TimeConstraints {
  totalDays: number;
  totalHours: number;
  dailyHours: number;
  weeklyHours: number;
}

interface GoalAnalysisResult {
  goalId: string;
  userId: string;
  goalType: StudyGoalType;
  subject: string;
  targetDate: string;
  timeConstraints: TimeConstraints;
  feasibilityScore: number; // 0-100
  isFeasible: boolean;
  estimatedCompletionDate: string;
  recommendations: string[];
  alternatives?: AlternativeTimeline[];
  topicCount: number;
  estimatedHoursPerTopic: number;
  createdAt: number;
}

interface AlternativeTimeline {
  description: string;
  adjustedTargetDate: string;
  adjustedDailyHours: number;
  feasibilityScore: number;
  reasoning: string;
}

/**
 * Main Lambda handler for goal analysis
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Goal Analysis invoked', { path: event.rawPath, method: event.requestContext.http.method });

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/study-plan/analyze-goal')) {
      return await handleGoalAnalysis(event);
    } else if (method === 'GET' && path.includes('/study-plan/goal')) {
      return await handleGetGoal(event);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in goal analysis:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to analyze study goal',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle goal analysis request
 * Requirement 2.1: Process study goal with time constraints
 * Requirement 2.3: Suggest realistic alternatives when insufficient time
 */
async function handleGoalAnalysis(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: StudyGoalRequest = JSON.parse(event.body || '{}');

  // Validate required fields
  const validation = validateGoalRequest(body);
  if (!validation.valid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Invalid goal request',
        details: validation.errors,
      }),
    };
  }

  // Calculate time constraints
  const timeConstraints = calculateTimeConstraints(
    body.targetDate,
    body.availableDailyHours
  );

  // Validate time constraints
  if (timeConstraints.totalDays <= 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Target date must be in the future',
        suggestion: 'Please select a target date that is at least 1 day from now',
      }),
    };
  }

  // Estimate topic count based on subject and goal type
  const topicCount = estimateTopicCount(body.subject, body.goalType, body.specificTopics);

  // Calculate estimated hours per topic based on skill level
  const hoursPerTopic = calculateHoursPerTopic(body.currentLevel, body.goalType);

  // Calculate total required hours
  const totalRequiredHours = topicCount * hoursPerTopic;

  // Calculate feasibility score
  const feasibilityScore = calculateFeasibilityScore(
    timeConstraints.totalHours,
    totalRequiredHours,
    body.currentLevel
  );

  // Determine if goal is feasible
  const isFeasible = feasibilityScore >= 60; // 60% threshold for feasibility

  // Generate recommendations
  const recommendations = generateRecommendations(
    feasibilityScore,
    timeConstraints,
    totalRequiredHours,
    body.currentLevel
  );

  // Generate alternatives if not feasible
  let alternatives: AlternativeTimeline[] | undefined;
  if (!isFeasible) {
    alternatives = generateAlternativeTimelines(
      body.targetDate,
      body.availableDailyHours,
      totalRequiredHours,
      timeConstraints
    );
  }

  // Calculate estimated completion date
  const estimatedCompletionDate = calculateEstimatedCompletion(
    totalRequiredHours,
    body.availableDailyHours
  );

  // Create goal analysis result
  const goalId = `goal_${body.userId}_${Date.now()}`;
  const result: GoalAnalysisResult = {
    goalId,
    userId: body.userId,
    goalType: body.goalType,
    subject: body.subject,
    targetDate: body.targetDate,
    timeConstraints,
    feasibilityScore,
    isFeasible,
    estimatedCompletionDate,
    recommendations,
    alternatives,
    topicCount,
    estimatedHoursPerTopic: hoursPerTopic,
    createdAt: Date.now(),
  };

  // Save goal analysis to DynamoDB
  await saveGoalAnalysis(result);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

/**
 * Handle get goal request
 */
async function handleGetGoal(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const goalId = event.queryStringParameters?.goalId;

  if (!goalId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing goalId parameter' }),
    };
  }

  const goal = await getGoalAnalysis(goalId);
  if (!goal) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Goal not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  };
}

/**
 * Validate goal request
 */
function validateGoalRequest(request: StudyGoalRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.userId) {
    errors.push('userId is required');
  }

  if (!request.goalType || !Object.values(StudyGoalType).includes(request.goalType)) {
    errors.push('Valid goalType is required (exam, interview, job, project)');
  }

  if (!request.subject || request.subject.trim().length === 0) {
    errors.push('subject is required');
  }

  if (!request.targetDate) {
    errors.push('targetDate is required');
  } else {
    const targetDate = new Date(request.targetDate);
    if (isNaN(targetDate.getTime())) {
      errors.push('targetDate must be a valid ISO date string');
    }
  }

  if (!request.availableDailyHours || request.availableDailyHours <= 0) {
    errors.push('availableDailyHours must be greater than 0');
  } else if (request.availableDailyHours > 24) {
    errors.push('availableDailyHours cannot exceed 24 hours');
  }

  if (!request.currentLevel || !Object.values(SkillLevel).includes(request.currentLevel)) {
    errors.push('Valid currentLevel is required (beginner, intermediate, advanced)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate time constraints based on target date and daily hours
 */
function calculateTimeConstraints(targetDate: string, dailyHours: number): TimeConstraints {
  const now = new Date();
  const target = new Date(targetDate);
  
  // Calculate total days
  const totalDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total hours available
  const totalHours = totalDays * dailyHours;
  
  // Calculate weekly hours
  const weeklyHours = dailyHours * 7;

  return {
    totalDays,
    totalHours,
    dailyHours,
    weeklyHours,
  };
}

/**
 * Estimate topic count based on subject and goal type
 */
function estimateTopicCount(
  subject: string,
  goalType: StudyGoalType,
  specificTopics?: string[]
): number {
  // If specific topics provided, use that count
  if (specificTopics && specificTopics.length > 0) {
    return specificTopics.length;
  }

  // Otherwise, estimate based on subject and goal type
  const subjectLower = subject.toLowerCase();
  
  // Base topic counts for common subjects
  const subjectTopicMap: Record<string, number> = {
    'javascript': 15,
    'python': 15,
    'java': 18,
    'react': 12,
    'node': 12,
    'data structures': 20,
    'algorithms': 25,
    'system design': 15,
    'database': 12,
    'sql': 10,
    'aws': 20,
    'machine learning': 18,
    'web development': 20,
  };

  // Find matching subject
  let topicCount = 15; // Default
  for (const [key, count] of Object.entries(subjectTopicMap)) {
    if (subjectLower.includes(key)) {
      topicCount = count;
      break;
    }
  }

  // Adjust based on goal type
  switch (goalType) {
    case StudyGoalType.EXAM:
      topicCount = Math.ceil(topicCount * 1.2); // Exams need more comprehensive coverage
      break;
    case StudyGoalType.INTERVIEW:
      topicCount = Math.ceil(topicCount * 0.8); // Interviews focus on key topics
      break;
    case StudyGoalType.PROJECT:
      topicCount = Math.ceil(topicCount * 0.6); // Projects focus on specific skills
      break;
    case StudyGoalType.JOB:
      topicCount = Math.ceil(topicCount * 1.0); // Job prep needs balanced coverage
      break;
  }

  return topicCount;
}

/**
 * Calculate hours per topic based on skill level and goal type
 */
function calculateHoursPerTopic(skillLevel: SkillLevel, goalType: StudyGoalType): number {
  // Base hours per topic
  let baseHours = 3;

  // Adjust for skill level
  switch (skillLevel) {
    case SkillLevel.BEGINNER:
      baseHours = 4; // Beginners need more time
      break;
    case SkillLevel.INTERMEDIATE:
      baseHours = 3;
      break;
    case SkillLevel.ADVANCED:
      baseHours = 2; // Advanced learners are faster
      break;
  }

  // Adjust for goal type
  switch (goalType) {
    case StudyGoalType.EXAM:
      baseHours *= 1.3; // Exams need deeper understanding
      break;
    case StudyGoalType.INTERVIEW:
      baseHours *= 1.2; // Interviews need practice
      break;
    case StudyGoalType.PROJECT:
      baseHours *= 1.5; // Projects need hands-on time
      break;
    case StudyGoalType.JOB:
      baseHours *= 1.1; // Job prep needs practical skills
      break;
  }

  return Math.ceil(baseHours);
}

/**
 * Calculate feasibility score (0-100)
 */
function calculateFeasibilityScore(
  availableHours: number,
  requiredHours: number,
  skillLevel: SkillLevel
): number {
  // Base score on time ratio
  const timeRatio = availableHours / requiredHours;
  let score = Math.min(timeRatio * 100, 100);

  // Adjust for skill level (advanced learners can be more efficient)
  if (skillLevel === SkillLevel.ADVANCED) {
    score = Math.min(score * 1.2, 100);
  } else if (skillLevel === SkillLevel.BEGINNER) {
    score = score * 0.9; // Beginners need buffer time
  }

  // Add buffer consideration (ideal is 20% more time than required)
  if (timeRatio >= 1.2) {
    score = Math.min(score + 10, 100); // Bonus for having buffer
  } else if (timeRatio < 0.8) {
    score = score * 0.8; // Penalty for tight timeline
  }

  return Math.round(score);
}

/**
 * Generate recommendations based on feasibility analysis
 */
function generateRecommendations(
  feasibilityScore: number,
  timeConstraints: TimeConstraints,
  requiredHours: number,
  skillLevel: SkillLevel
): string[] {
  const recommendations: string[] = [];

  if (feasibilityScore >= 80) {
    recommendations.push('Your timeline looks great! You have sufficient time to cover all topics thoroughly.');
    recommendations.push('Consider using extra time for practice problems and mock tests.');
  } else if (feasibilityScore >= 60) {
    recommendations.push('Your timeline is feasible but will require consistent effort.');
    recommendations.push('Stick to your daily study schedule to stay on track.');
    recommendations.push('Focus on understanding core concepts before moving to advanced topics.');
  } else if (feasibilityScore >= 40) {
    recommendations.push('Your timeline is tight. Consider extending your target date if possible.');
    recommendations.push('Prioritize high-impact topics and skip less critical areas.');
    recommendations.push('Increase daily study hours if you can manage it.');
  } else {
    recommendations.push('Your current timeline is not realistic for comprehensive preparation.');
    recommendations.push('We strongly recommend extending your target date or increasing daily study hours.');
    recommendations.push('See alternative timelines below for more feasible options.');
  }

  // Add skill-level specific recommendations
  if (skillLevel === SkillLevel.BEGINNER) {
    recommendations.push('As a beginner, allocate extra time for foundational concepts.');
    recommendations.push('Don\'t rush - understanding basics well will help you learn faster later.');
  } else if (skillLevel === SkillLevel.ADVANCED) {
    recommendations.push('Leverage your experience to move quickly through familiar topics.');
    recommendations.push('Focus more time on areas outside your expertise.');
  }

  // Add time management recommendations
  if (timeConstraints.dailyHours < 2) {
    recommendations.push('Consider increasing daily study time to at least 2 hours for better retention.');
  } else if (timeConstraints.dailyHours > 6) {
    recommendations.push('Be careful not to burn out with long study sessions. Take regular breaks.');
  }

  return recommendations;
}

/**
 * Generate alternative timelines when goal is not feasible
 * Requirement 2.3: Suggest realistic alternatives
 */
function generateAlternativeTimelines(
  originalTargetDate: string,
  originalDailyHours: number,
  requiredHours: number,
  originalConstraints: TimeConstraints
): AlternativeTimeline[] {
  const alternatives: AlternativeTimeline[] = [];
  const now = new Date();

  // Alternative 1: Extend target date by 50%
  const extendedDays = Math.ceil(originalConstraints.totalDays * 1.5);
  const extendedDate = new Date(now.getTime() + extendedDays * 24 * 60 * 60 * 1000);
  const extendedTotalHours = extendedDays * originalDailyHours;
  const extendedScore = calculateFeasibilityScore(extendedTotalHours, requiredHours, SkillLevel.INTERMEDIATE);
  
  alternatives.push({
    description: 'Extended Timeline',
    adjustedTargetDate: extendedDate.toISOString(),
    adjustedDailyHours: originalDailyHours,
    feasibilityScore: extendedScore,
    reasoning: `Extend your target date by ${Math.ceil(originalConstraints.totalDays * 0.5)} days to have more comfortable preparation time.`,
  });

  // Alternative 2: Increase daily hours by 50%
  const increasedDailyHours = Math.min(originalDailyHours * 1.5, 8); // Cap at 8 hours
  const increasedTotalHours = originalConstraints.totalDays * increasedDailyHours;
  const increasedScore = calculateFeasibilityScore(increasedTotalHours, requiredHours, SkillLevel.INTERMEDIATE);
  
  alternatives.push({
    description: 'Increased Daily Hours',
    adjustedTargetDate: originalTargetDate,
    adjustedDailyHours: increasedDailyHours,
    feasibilityScore: increasedScore,
    reasoning: `Increase daily study time to ${increasedDailyHours.toFixed(1)} hours while keeping the same target date.`,
  });

  // Alternative 3: Balanced approach (moderate extension + moderate increase)
  const balancedDays = Math.ceil(originalConstraints.totalDays * 1.25);
  const balancedDailyHours = Math.min(originalDailyHours * 1.25, 6);
  const balancedDate = new Date(now.getTime() + balancedDays * 24 * 60 * 60 * 1000);
  const balancedTotalHours = balancedDays * balancedDailyHours;
  const balancedScore = calculateFeasibilityScore(balancedTotalHours, requiredHours, SkillLevel.INTERMEDIATE);
  
  alternatives.push({
    description: 'Balanced Approach',
    adjustedTargetDate: balancedDate.toISOString(),
    adjustedDailyHours: balancedDailyHours,
    feasibilityScore: balancedScore,
    reasoning: `Extend target date by ${Math.ceil(originalConstraints.totalDays * 0.25)} days and increase daily hours to ${balancedDailyHours.toFixed(1)} for a balanced approach.`,
  });

  // Sort by feasibility score (best first)
  alternatives.sort((a, b) => b.feasibilityScore - a.feasibilityScore);

  return alternatives;
}

/**
 * Calculate estimated completion date based on required hours
 */
function calculateEstimatedCompletion(requiredHours: number, dailyHours: number): string {
  const daysNeeded = Math.ceil(requiredHours / dailyHours);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeeded);
  return completionDate.toISOString();
}

/**
 * Save goal analysis to DynamoDB
 */
async function saveGoalAnalysis(result: GoalAnalysisResult): Promise<void> {
  try {
    await dynamoClient.send(
      new PutCommand({
        TableName: PROGRESS_TABLE,
        Item: {
          userId: result.userId,
          topicId: result.goalId,
          ...result,
        },
      })
    );
  } catch (error) {
    console.error('Error saving goal analysis:', error);
    throw error;
  }
}

/**
 * Get goal analysis from DynamoDB
 */
async function getGoalAnalysis(goalId: string): Promise<GoalAnalysisResult | null> {
  try {
    // Extract userId from goalId (format: goal_userId_timestamp)
    const parts = goalId.split('_');
    if (parts.length < 3) {
      return null;
    }
    const userId = parts[1];

    const result = await dynamoClient.send(
      new GetCommand({
        TableName: PROGRESS_TABLE,
        Key: {
          userId,
          topicId: goalId,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as GoalAnalysisResult;
  } catch (error) {
    console.error('Error getting goal analysis:', error);
    throw error;
  }
}
