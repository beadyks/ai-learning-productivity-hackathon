import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Study Plan Generator Lambda Function
 * Generates personalized study plans with topic prioritization and daily breakdowns
 * Requirements: 2.2 (topic prioritization), 2.4 (daily session breakdown)
 */

// Initialize AWS clients
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// Environment variables
const PROGRESS_TABLE = process.env.PROGRESS_TABLE || '';
const EMBEDDINGS_TABLE = process.env.EMBEDDINGS_TABLE || '';

interface StudyPlanRequest {
  userId: string;
  goalId: string;
  syllabusDocumentIds?: string[];
  customTopics?: string[];
}

interface Topic {
  topicId: string;
  name: string;
  description: string;
  priority: number; // 1-5, 5 being highest
  estimatedHours: number;
  prerequisites: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface DailySession {
  day: number;
  date: string;
  topics: SessionTopic[];
  totalHours: number;
  focusArea: string;
  goals: string[];
}

interface SessionTopic {
  topicId: string;
  topicName: string;
  allocatedHours: number;
  activities: string[];
  learningObjectives: string[];
}

interface StudyPlan {
  planId: string;
  userId: string;
  goalId: string;
  dailySessions: DailySession[];
  totalDuration: number;
  estimatedCompletion: string;
  topicSequence: string[];
  milestones: Milestone[];
  createdAt: number;
  status: 'active' | 'completed' | 'paused';
}

interface Milestone {
  day: number;
  description: string;
  topics: string[];
  checkpointType: 'review' | 'practice' | 'assessment';
}

interface GoalAnalysis {
  goalId: string;
  userId: string;
  subject: string;
  targetDate: string;
  timeConstraints: {
    totalDays: number;
    dailyHours: number;
  };
  topicCount: number;
  estimatedHoursPerTopic: number;
  currentLevel: string;
}

/**
 * Main Lambda handler for plan generation
 */
export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  try {
    console.log('Plan Generator invoked', { path: event.rawPath, method: event.requestContext.http.method });

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/study-plan/generate')) {
      return await handlePlanGeneration(event);
    } else if (method === 'GET' && path.includes('/study-plan/plan')) {
      return await handleGetPlan(event);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Error in plan generation:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate study plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle plan generation request
 * Requirement 2.2: Prioritize topics based on syllabus
 * Requirement 2.4: Break down into daily sessions
 */
async function handlePlanGeneration(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const body: StudyPlanRequest = JSON.parse(event.body || '{}');

  // Validate required fields
  if (!body.userId || !body.goalId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: userId, goalId',
      }),
    };
  }

  // Get goal analysis
  const goalAnalysis = await getGoalAnalysis(body.goalId);
  if (!goalAnalysis) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Goal analysis not found' }),
    };
  }

  // Generate topics based on subject and syllabus
  const topics = await generateTopics(
    goalAnalysis.subject,
    goalAnalysis.topicCount,
    goalAnalysis.estimatedHoursPerTopic,
    body.syllabusDocumentIds,
    body.customTopics
  );

  // Prioritize topics (Requirement 2.2)
  const prioritizedTopics = prioritizeTopics(topics, goalAnalysis.currentLevel);

  // Validate plan feasibility
  const feasibility = validatePlanFeasibility(
    prioritizedTopics,
    goalAnalysis.timeConstraints
  );

  if (!feasibility.isFeasible) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Plan is not feasible with current constraints',
        details: feasibility.reason,
        suggestions: feasibility.suggestions,
      }),
    };
  }

  // Generate daily sessions (Requirement 2.4)
  const dailySessions = generateDailySessions(
    prioritizedTopics,
    goalAnalysis.timeConstraints.totalDays,
    goalAnalysis.timeConstraints.dailyHours
  );

  // Add milestones for checkpoints
  const milestones = generateMilestones(dailySessions);

  // Create study plan
  const planId = `plan_${body.userId}_${Date.now()}`;
  const studyPlan: StudyPlan = {
    planId,
    userId: body.userId,
    goalId: body.goalId,
    dailySessions,
    totalDuration: goalAnalysis.timeConstraints.totalDays,
    estimatedCompletion: goalAnalysis.targetDate,
    topicSequence: prioritizedTopics.map(t => t.topicId),
    milestones,
    createdAt: Date.now(),
    status: 'active',
  };

  // Save study plan to DynamoDB
  await saveStudyPlan(studyPlan);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studyPlan),
  };
}

/**
 * Handle get plan request
 */
async function handleGetPlan(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const planId = event.queryStringParameters?.planId;

  if (!planId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing planId parameter' }),
    };
  }

  const plan = await getStudyPlan(planId);
  if (!plan) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Study plan not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  };
}

/**
 * Generate topics based on subject and syllabus
 */
async function generateTopics(
  subject: string,
  topicCount: number,
  hoursPerTopic: number,
  syllabusDocumentIds?: string[],
  customTopics?: string[]
): Promise<Topic[]> {
  const topics: Topic[] = [];

  // If custom topics provided, use them
  if (customTopics && customTopics.length > 0) {
    customTopics.forEach((topicName, index) => {
      topics.push({
        topicId: `topic_${Date.now()}_${index}`,
        name: topicName,
        description: `Study ${topicName}`,
        priority: 3, // Default medium priority
        estimatedHours: hoursPerTopic,
        prerequisites: [],
        difficulty: 'medium',
        category: 'custom',
      });
    });
    return topics;
  }

  // If syllabus documents provided, extract topics from them
  if (syllabusDocumentIds && syllabusDocumentIds.length > 0) {
    // In a real implementation, this would analyze the syllabus documents
    // For now, we'll generate based on subject
  }

  // Generate topics based on subject
  const subjectTopics = getSubjectTopics(subject);
  
  // Take the required number of topics
  const selectedTopics = subjectTopics.slice(0, topicCount);
  
  selectedTopics.forEach((topicData, index) => {
    topics.push({
      topicId: `topic_${Date.now()}_${index}`,
      name: topicData.name,
      description: topicData.description,
      priority: topicData.priority,
      estimatedHours: hoursPerTopic,
      prerequisites: topicData.prerequisites,
      difficulty: topicData.difficulty,
      category: topicData.category,
    });
  });

  return topics;
}

/**
 * Get predefined topics for common subjects
 */
function getSubjectTopics(subject: string): Array<{
  name: string;
  description: string;
  priority: number;
  prerequisites: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}> {
  const subjectLower = subject.toLowerCase();

  // JavaScript topics
  if (subjectLower.includes('javascript')) {
    return [
      { name: 'Variables and Data Types', description: 'Learn about var, let, const and data types', priority: 5, prerequisites: [], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Functions', description: 'Function declarations, expressions, and arrow functions', priority: 5, prerequisites: ['Variables and Data Types'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Objects and Arrays', description: 'Working with objects and arrays', priority: 5, prerequisites: ['Variables and Data Types'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Control Flow', description: 'If statements, loops, and switch cases', priority: 4, prerequisites: ['Variables and Data Types'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Scope and Closures', description: 'Understanding scope and closures', priority: 4, prerequisites: ['Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Promises and Async/Await', description: 'Asynchronous programming', priority: 5, prerequisites: ['Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'DOM Manipulation', description: 'Working with the Document Object Model', priority: 4, prerequisites: ['Objects and Arrays'], difficulty: 'medium', category: 'web' },
      { name: 'Event Handling', description: 'Handling user events', priority: 4, prerequisites: ['DOM Manipulation'], difficulty: 'medium', category: 'web' },
      { name: 'ES6+ Features', description: 'Modern JavaScript features', priority: 3, prerequisites: ['Functions', 'Objects and Arrays'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Error Handling', description: 'Try-catch and error handling', priority: 3, prerequisites: ['Functions'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Modules', description: 'Import/export and module systems', priority: 3, prerequisites: ['Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Classes and OOP', description: 'Object-oriented programming in JavaScript', priority: 3, prerequisites: ['Objects and Arrays', 'Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Array Methods', description: 'Map, filter, reduce, and other array methods', priority: 4, prerequisites: ['Objects and Arrays', 'Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Fetch API', description: 'Making HTTP requests', priority: 4, prerequisites: ['Promises and Async/Await'], difficulty: 'medium', category: 'web' },
      { name: 'Local Storage', description: 'Browser storage APIs', priority: 2, prerequisites: ['Objects and Arrays'], difficulty: 'easy', category: 'web' },
    ];
  }

  // Python topics
  if (subjectLower.includes('python')) {
    return [
      { name: 'Variables and Data Types', description: 'Python data types and variables', priority: 5, prerequisites: [], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Control Flow', description: 'If statements and loops', priority: 5, prerequisites: ['Variables and Data Types'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Functions', description: 'Defining and using functions', priority: 5, prerequisites: ['Variables and Data Types'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Lists and Tuples', description: 'Working with lists and tuples', priority: 5, prerequisites: ['Variables and Data Types'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Dictionaries and Sets', description: 'Dictionary and set data structures', priority: 4, prerequisites: ['Lists and Tuples'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'List Comprehensions', description: 'Pythonic list operations', priority: 3, prerequisites: ['Lists and Tuples', 'Control Flow'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Classes and OOP', description: 'Object-oriented programming', priority: 4, prerequisites: ['Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'File I/O', description: 'Reading and writing files', priority: 3, prerequisites: ['Functions'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Exception Handling', description: 'Try-except blocks', priority: 3, prerequisites: ['Functions'], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Modules and Packages', description: 'Importing and creating modules', priority: 3, prerequisites: ['Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Decorators', description: 'Function decorators', priority: 2, prerequisites: ['Functions'], difficulty: 'hard', category: 'advanced' },
      { name: 'Generators', description: 'Generator functions and expressions', priority: 2, prerequisites: ['Functions'], difficulty: 'hard', category: 'advanced' },
      { name: 'Lambda Functions', description: 'Anonymous functions', priority: 3, prerequisites: ['Functions'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Regular Expressions', description: 'Pattern matching with regex', priority: 2, prerequisites: ['Variables and Data Types'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Virtual Environments', description: 'Managing Python environments', priority: 2, prerequisites: ['Modules and Packages'], difficulty: 'easy', category: 'tools' },
    ];
  }

  // Data Structures and Algorithms
  if (subjectLower.includes('data structures') || subjectLower.includes('algorithms')) {
    return [
      { name: 'Arrays and Strings', description: 'Basic array and string operations', priority: 5, prerequisites: [], difficulty: 'easy', category: 'fundamentals' },
      { name: 'Linked Lists', description: 'Singly and doubly linked lists', priority: 5, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'fundamentals' },
      { name: 'Stacks and Queues', description: 'Stack and queue data structures', priority: 5, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'fundamentals' },
      { name: 'Hash Tables', description: 'Hash maps and hash sets', priority: 5, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'fundamentals' },
      { name: 'Trees', description: 'Binary trees and tree traversal', priority: 4, prerequisites: ['Linked Lists'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Binary Search Trees', description: 'BST operations', priority: 4, prerequisites: ['Trees'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Heaps', description: 'Min heap and max heap', priority: 4, prerequisites: ['Trees'], difficulty: 'medium', category: 'intermediate' },
      { name: 'Graphs', description: 'Graph representation and traversal', priority: 4, prerequisites: ['Trees'], difficulty: 'hard', category: 'intermediate' },
      { name: 'Sorting Algorithms', description: 'Quick sort, merge sort, etc.', priority: 5, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'algorithms' },
      { name: 'Searching Algorithms', description: 'Binary search and variations', priority: 5, prerequisites: ['Arrays and Strings'], difficulty: 'easy', category: 'algorithms' },
      { name: 'Dynamic Programming', description: 'DP concepts and patterns', priority: 3, prerequisites: ['Arrays and Strings'], difficulty: 'hard', category: 'algorithms' },
      { name: 'Greedy Algorithms', description: 'Greedy approach problems', priority: 3, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'algorithms' },
      { name: 'Backtracking', description: 'Backtracking problems', priority: 3, prerequisites: ['Arrays and Strings'], difficulty: 'hard', category: 'algorithms' },
      { name: 'Two Pointers', description: 'Two pointer technique', priority: 4, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'techniques' },
      { name: 'Sliding Window', description: 'Sliding window technique', priority: 4, prerequisites: ['Arrays and Strings'], difficulty: 'medium', category: 'techniques' },
    ];
  }

  // Default generic topics
  return Array.from({ length: 15 }, (_, i) => ({
    name: `Topic ${i + 1}`,
    description: `Study topic ${i + 1} for ${subject}`,
    priority: i < 5 ? 5 : i < 10 ? 4 : 3,
    prerequisites: i > 0 ? [`Topic ${i}`] : [],
    difficulty: i < 5 ? 'easy' : i < 10 ? 'medium' : 'hard',
    category: i < 5 ? 'fundamentals' : i < 10 ? 'intermediate' : 'advanced',
  }));
}

/**
 * Prioritize topics based on prerequisites and importance
 * Requirement 2.2: Topic prioritization
 */
function prioritizeTopics(topics: Topic[], currentLevel: string): Topic[] {
  // Create a copy to avoid mutating original
  const sortedTopics = [...topics];

  // Sort by:
  // 1. Priority (higher first)
  // 2. Difficulty (easier first for beginners)
  // 3. Prerequisites (topics with no prerequisites first)
  sortedTopics.sort((a, b) => {
    // First, sort by priority
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // For beginners, prioritize easier topics
    if (currentLevel === 'beginner') {
      const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
      if (a.difficulty !== b.difficulty) {
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
    }

    // Prioritize topics with fewer prerequisites
    return a.prerequisites.length - b.prerequisites.length;
  });

  // Ensure prerequisites are met (topological sort)
  const ordered: Topic[] = [];
  const completed = new Set<string>();

  while (ordered.length < sortedTopics.length) {
    let addedAny = false;

    for (const topic of sortedTopics) {
      if (completed.has(topic.topicId)) {
        continue;
      }

      // Check if all prerequisites are completed
      const prerequisitesMet = topic.prerequisites.every(prereq =>
        completed.has(prereq) || !sortedTopics.find(t => t.name === prereq)
      );

      if (prerequisitesMet) {
        ordered.push(topic);
        completed.add(topic.topicId);
        addedAny = true;
      }
    }

    // Prevent infinite loop if there are circular dependencies
    if (!addedAny && ordered.length < sortedTopics.length) {
      // Add remaining topics anyway
      for (const topic of sortedTopics) {
        if (!completed.has(topic.topicId)) {
          ordered.push(topic);
          completed.add(topic.topicId);
        }
      }
      break;
    }
  }

  return ordered;
}

/**
 * Validate plan feasibility
 */
function validatePlanFeasibility(
  topics: Topic[],
  timeConstraints: { totalDays: number; dailyHours: number }
): { isFeasible: boolean; reason?: string; suggestions?: string[] } {
  const totalRequiredHours = topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);
  const totalAvailableHours = timeConstraints.totalDays * timeConstraints.dailyHours;

  if (totalRequiredHours > totalAvailableHours * 1.2) {
    return {
      isFeasible: false,
      reason: `Required ${totalRequiredHours} hours but only ${totalAvailableHours} hours available`,
      suggestions: [
        'Extend your target date',
        'Increase daily study hours',
        'Reduce the number of topics to cover',
      ],
    };
  }

  if (timeConstraints.totalDays < 7) {
    return {
      isFeasible: false,
      reason: 'Study plan requires at least 7 days for effective learning',
      suggestions: ['Extend your target date to at least 7 days from now'],
    };
  }

  return { isFeasible: true };
}

/**
 * Generate daily sessions with topic breakdown
 * Requirement 2.4: Daily session breakdown
 */
function generateDailySessions(
  topics: Topic[],
  totalDays: number,
  dailyHours: number
): DailySession[] {
  const sessions: DailySession[] = [];
  const startDate = new Date();
  
  let currentTopicIndex = 0;
  let remainingHoursInTopic = topics[0]?.estimatedHours || 0;

  for (let day = 1; day <= totalDays; day++) {
    const sessionDate = new Date(startDate);
    sessionDate.setDate(sessionDate.getDate() + day - 1);

    const sessionTopics: SessionTopic[] = [];
    let remainingDailyHours = dailyHours;

    // Allocate topics to this day
    while (remainingDailyHours > 0 && currentTopicIndex < topics.length) {
      const currentTopic = topics[currentTopicIndex];
      const hoursToAllocate = Math.min(remainingDailyHours, remainingHoursInTopic);

      // Add topic to session
      sessionTopics.push({
        topicId: currentTopic.topicId,
        topicName: currentTopic.name,
        allocatedHours: hoursToAllocate,
        activities: generateActivities(currentTopic, hoursToAllocate),
        learningObjectives: generateLearningObjectives(currentTopic),
      });

      remainingDailyHours -= hoursToAllocate;
      remainingHoursInTopic -= hoursToAllocate;

      // Move to next topic if current is complete
      if (remainingHoursInTopic <= 0) {
        currentTopicIndex++;
        if (currentTopicIndex < topics.length) {
          remainingHoursInTopic = topics[currentTopicIndex].estimatedHours;
        }
      }
    }

    // Determine focus area for the day
    const focusArea = sessionTopics.length > 0
      ? sessionTopics[0].topicName
      : 'Review and Practice';

    // Generate daily goals
    const goals = sessionTopics.map(st =>
      `Complete ${st.allocatedHours.toFixed(1)} hours on ${st.topicName}`
    );

    sessions.push({
      day,
      date: sessionDate.toISOString().split('T')[0],
      topics: sessionTopics,
      totalHours: dailyHours - remainingDailyHours,
      focusArea,
      goals,
    });
  }

  return sessions;
}

/**
 * Generate activities for a topic session
 */
function generateActivities(topic: Topic, hours: number): string[] {
  const activities: string[] = [];

  if (hours >= 1) {
    activities.push(`Watch tutorial videos on ${topic.name}`);
    activities.push(`Read documentation and examples`);
  }

  if (hours >= 2) {
    activities.push(`Practice coding exercises`);
    activities.push(`Build small projects`);
  }

  if (hours >= 3) {
    activities.push(`Review and debug code`);
    activities.push(`Take notes and create summaries`);
  }

  return activities;
}

/**
 * Generate learning objectives for a topic
 */
function generateLearningObjectives(topic: Topic): string[] {
  return [
    `Understand core concepts of ${topic.name}`,
    `Apply ${topic.name} in practical scenarios`,
    `Identify common patterns and best practices`,
  ];
}

/**
 * Generate milestones for checkpoints
 */
function generateMilestones(sessions: DailySession[]): Milestone[] {
  const milestones: Milestone[] = [];
  const totalDays = sessions.length;

  // Add milestone every 7 days or at 25%, 50%, 75% completion
  const milestonePoints = [
    Math.floor(totalDays * 0.25),
    Math.floor(totalDays * 0.50),
    Math.floor(totalDays * 0.75),
    totalDays,
  ];

  milestonePoints.forEach((day, index) => {
    if (day > 0 && day <= totalDays) {
      const session = sessions[day - 1];
      const topicsCovered = sessions
        .slice(0, day)
        .flatMap(s => s.topics.map(t => t.topicName));

      milestones.push({
        day,
        description: index === milestonePoints.length - 1
          ? 'Complete all topics and final review'
          : `${(index + 1) * 25}% completion checkpoint`,
        topics: [...new Set(topicsCovered)],
        checkpointType: index === milestonePoints.length - 1 ? 'assessment' : 'review',
      });
    }
  });

  return milestones;
}

/**
 * Get goal analysis from DynamoDB
 */
async function getGoalAnalysis(goalId: string): Promise<GoalAnalysis | null> {
  try {
    // Extract userId from goalId
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

    return result.Item as GoalAnalysis;
  } catch (error) {
    console.error('Error getting goal analysis:', error);
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
