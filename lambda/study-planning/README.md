# Study Planning System

This directory contains the Lambda functions for the study planning system of the Voice-First AI Learning Assistant.

## Overview

The study planning system helps students create personalized study plans based on their goals, available time, and skill level. It consists of three main components:

1. **Goal Analysis Service** - Analyzes study goals and validates time constraints
2. **Plan Generator** - Creates detailed study plans with topic prioritization
3. **Plan Tracker** - Manages plan modifications and tracks progress

## Components

### 1. Goal Analysis Service (`goal-analysis/`)

**Purpose**: Analyzes study goals, validates time constraints, and calculates realistic timelines.

**Requirements**: 2.1 (goal specification), 2.3 (realistic alternatives)

**Key Features**:
- Validates study goal requests
- Calculates time constraints and feasibility
- Estimates topic count and hours per topic
- Generates feasibility scores (0-100)
- Suggests alternative timelines when goals are not feasible
- Provides personalized recommendations

**API Endpoints**:
- `POST /study-plan/analyze-goal` - Analyze a study goal
- `GET /study-plan/goal?goalId={goalId}` - Get goal analysis

**Request Example**:
```json
{
  "userId": "user123",
  "goalType": "interview",
  "subject": "JavaScript",
  "targetDate": "2024-06-01T00:00:00Z",
  "availableDailyHours": 3,
  "currentLevel": "beginner",
  "specificTopics": ["Arrays", "Functions", "Promises"]
}
```

**Response Example**:
```json
{
  "goalId": "goal_user123_1234567890",
  "feasibilityScore": 75,
  "isFeasible": true,
  "estimatedCompletionDate": "2024-05-28T00:00:00Z",
  "recommendations": [
    "Your timeline is feasible but will require consistent effort.",
    "Stick to your daily study schedule to stay on track."
  ],
  "topicCount": 15,
  "estimatedHoursPerTopic": 4
}
```

### 2. Plan Generator (`plan-generator/`)

**Purpose**: Generates personalized study plans with topic prioritization and daily breakdowns.

**Requirements**: 2.2 (topic prioritization), 2.4 (daily session breakdown)

**Key Features**:
- Generates topics based on subject and syllabus
- Prioritizes topics by importance and prerequisites
- Creates daily session breakdowns
- Validates plan feasibility
- Generates milestones and checkpoints
- Supports custom topics and syllabus documents

**API Endpoints**:
- `POST /study-plan/generate` - Generate a study plan
- `GET /study-plan/plan?planId={planId}` - Get study plan

**Request Example**:
```json
{
  "userId": "user123",
  "goalId": "goal_user123_1234567890",
  "syllabusDocumentIds": ["doc123"],
  "customTopics": ["React Hooks", "Redux"]
}
```

**Response Example**:
```json
{
  "planId": "plan_user123_1234567890",
  "dailySessions": [
    {
      "day": 1,
      "date": "2024-03-01",
      "topics": [
        {
          "topicId": "topic_1",
          "topicName": "Variables and Data Types",
          "allocatedHours": 3,
          "activities": ["Watch tutorial videos", "Practice exercises"],
          "learningObjectives": ["Understand core concepts"]
        }
      ],
      "totalHours": 3,
      "focusArea": "Variables and Data Types",
      "goals": ["Complete 3 hours on Variables and Data Types"]
    }
  ],
  "totalDuration": 30,
  "estimatedCompletion": "2024-03-30T00:00:00Z",
  "milestones": [
    {
      "day": 7,
      "description": "25% completion checkpoint",
      "checkpointType": "review"
    }
  ]
}
```

### 3. Plan Tracker (`plan-tracker/`)

**Purpose**: Handles plan modifications, progress tracking, and completion status management.

**Requirements**: 2.5 (plan modifications), 5.1 (session persistence and progress)

**Key Features**:
- Modify study plans (extend deadline, adjust hours, skip/add topics)
- Track topic-level progress
- Calculate overall progress and completion percentage
- Determine if user is on track
- Pause and resume plans
- Maintain modification history

**API Endpoints**:
- `POST /study-plan/modify` - Modify a study plan
- `POST /study-plan/progress` - Update topic progress
- `GET /study-plan/progress?planId={planId}&userId={userId}` - Get progress
- `POST /study-plan/pause` - Pause a plan
- `POST /study-plan/resume` - Resume a plan

**Modification Types**:
- `extend_deadline` - Extend the target date
- `adjust_daily_hours` - Change daily study hours
- `skip_topic` - Skip a topic
- `add_topic` - Add a new topic
- `reorder_topics` - Reorder topic sequence

**Progress Update Example**:
```json
{
  "userId": "user123",
  "planId": "plan_user123_1234567890",
  "topicId": "topic_1",
  "status": "completed",
  "hoursSpent": 3.5,
  "notes": "Completed all exercises",
  "confidence": 4
}
```

**Progress Response Example**:
```json
{
  "planId": "plan_user123_1234567890",
  "totalTopics": 15,
  "completedTopics": 5,
  "inProgressTopics": 1,
  "skippedTopics": 0,
  "totalHoursSpent": 18,
  "overallProgress": 33,
  "currentDay": 10,
  "daysRemaining": 20,
  "onTrack": true,
  "topicProgress": [...]
}
```

## Data Models

### Study Goal
```typescript
interface StudyGoalRequest {
  userId: string;
  goalType: 'exam' | 'interview' | 'job' | 'project';
  subject: string;
  targetDate: string;
  availableDailyHours: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  specificTopics?: string[];
}
```

### Study Plan
```typescript
interface StudyPlan {
  planId: string;
  userId: string;
  goalId: string;
  dailySessions: DailySession[];
  totalDuration: number;
  estimatedCompletion: string;
  topicSequence: string[];
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
}
```

### Topic Progress
```typescript
interface TopicProgress {
  topicId: string;
  topicName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  hoursSpent: number;
  hoursAllocated: number;
  completionPercentage: number;
  confidence: number; // 1-5 scale
}
```

## DynamoDB Storage

All study planning data is stored in the `PROGRESS_TABLE` DynamoDB table with the following structure:

**Primary Key**:
- Partition Key: `userId` (string)
- Sort Key: `topicId` (string)

**Item Types**:
1. Goal Analysis: `topicId` starts with `goal_`
2. Study Plan: `topicId` starts with `plan_`
3. Topic Progress: `topicId` format is `{planId}_{topicId}`

## Environment Variables

All Lambda functions require the following environment variables:

- `PROGRESS_TABLE` - DynamoDB table name for progress tracking
- `USER_PROFILES_TABLE` - DynamoDB table name for user profiles
- `EMBEDDINGS_TABLE` - DynamoDB table name for document embeddings
- `SESSIONS_TABLE` - DynamoDB table name for session data
- `AWS_REGION` - AWS region

## Deployment

Each Lambda function has its own `package.json` and can be deployed independently:

```bash
# Install dependencies
cd goal-analysis && npm install
cd ../plan-generator && npm install
cd ../plan-tracker && npm install

# Build TypeScript
npm run build

# Deploy using AWS CDK (from infrastructure directory)
cd ../../infrastructure
npm run cdk deploy
```

## Testing

Unit tests can be added to each Lambda function:

```bash
cd goal-analysis
npm test
```

## Algorithm Details

### Feasibility Score Calculation

The feasibility score (0-100) is calculated based on:
1. Time ratio: `availableHours / requiredHours`
2. Skill level adjustment (advanced learners get bonus)
3. Buffer consideration (20% extra time is ideal)

Score >= 80: Excellent timeline
Score >= 60: Feasible timeline
Score >= 40: Tight timeline
Score < 40: Not realistic

### Topic Prioritization

Topics are prioritized by:
1. Priority level (1-5, higher first)
2. Difficulty (easier first for beginners)
3. Prerequisites (topics with fewer prerequisites first)
4. Topological sort to ensure prerequisites are met

### Daily Session Generation

Sessions are generated by:
1. Distributing topics across available days
2. Respecting daily hour limits
3. Ensuring topics are not split unnecessarily
4. Adding milestones at 25%, 50%, 75%, and 100% completion

## Cost Optimization

- Uses ARM64 Lambda architecture (20% cost savings)
- On-demand DynamoDB billing
- Efficient data storage with TTL for temporary data
- Minimal external API calls

## Future Enhancements

1. Integration with syllabus document analysis
2. AI-powered topic difficulty estimation
3. Adaptive learning path based on progress
4. Spaced repetition scheduling
5. Integration with calendar systems
6. Mobile push notifications for daily reminders
7. Gamification with achievements and streaks
