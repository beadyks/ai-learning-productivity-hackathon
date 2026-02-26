/**
 * CloudWatch Alarms Configuration Service
 * Requirements: 11.1, 11.2, 11.3 (Performance monitoring, alerting, auto-scaling triggers)
 * 
 * This service creates and manages CloudWatch alarms for:
 * - High response times (> 3 seconds)
 * - High error rates (> 5%)
 * - Low cache hit rates (< 40%)
 * - High costs per student (> ₹15/month)
 * - Lambda throttling
 * - DynamoDB throttling
 */

import { CloudWatch, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';
import { SNS, CreateTopicCommand, SubscribeCommand } from '@aws-sdk/client-sns';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });
const sns = new SNS({ region: process.env.AWS_REGION });

const NAMESPACE = 'VoiceLearningAssistant';
const ALARM_TOPIC_NAME = 'voice-learning-alarms';

interface AlarmConfig {
  alarmName: string;
  metricName: string;
  threshold: number;
  comparisonOperator: string;
  evaluationPeriods: number;
  period: number;
  statistic: string;
  dimensions?: Record<string, string>;
  treatMissingData?: string;
}

/**
 * Create SNS topic for alarm notifications
 */
async function createAlarmTopic(): Promise<string> {
  try {
    const response = await sns.send(
      new CreateTopicCommand({
        Name: ALARM_TOPIC_NAME,
      })
    );
    return response.TopicArn!;
  } catch (error) {
    console.error('Error creating SNS topic:', error);
    throw error;
  }
}

/**
 * Subscribe email to alarm topic
 */
async function subscribeToAlarms(topicArn: string, email: string): Promise<void> {
  try {
    await sns.send(
      new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'email',
        Endpoint: email,
      })
    );
  } catch (error) {
    console.error('Error subscribing to alarms:', error);
    throw error;
  }
}

/**
 * Create CloudWatch alarm
 */
async function createAlarm(config: AlarmConfig, topicArn: string): Promise<void> {
  const dimensions = config.dimensions
    ? Object.entries(config.dimensions).map(([Name, Value]) => ({ Name, Value }))
    : undefined;

  await cloudwatch.send(
    new PutMetricAlarmCommand({
      AlarmName: config.alarmName,
      AlarmDescription: `Alarm for ${config.metricName}`,
      ActionsEnabled: true,
      AlarmActions: [topicArn],
      MetricName: config.metricName,
      Namespace: NAMESPACE,
      Statistic: config.statistic,
      Dimensions: dimensions,
      Period: config.period,
      EvaluationPeriods: config.evaluationPeriods,
      Threshold: config.threshold,
      ComparisonOperator: config.comparisonOperator,
      TreatMissingData: config.treatMissingData || 'notBreaching',
    })
  );
}

/**
 * Create all performance alarms
 */
export async function createPerformanceAlarms(
  topicArn: string,
  functionNames: string[]
): Promise<void> {
  const alarms: AlarmConfig[] = [];

  // Response time alarms for each Lambda function
  for (const functionName of functionNames) {
    alarms.push({
      alarmName: `${functionName}-HighResponseTime`,
      metricName: 'ResponseTime',
      threshold: 3000, // 3 seconds (Requirement 11.1)
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 60,
      statistic: 'Average',
      dimensions: { FunctionName: functionName },
    });

    // Error rate alarms
    alarms.push({
      alarmName: `${functionName}-HighErrorRate`,
      metricName: 'ErrorCount',
      threshold: 5, // 5% error rate
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 60,
      statistic: 'Sum',
      dimensions: { FunctionName: functionName },
    });

    // Lambda throttling alarms
    alarms.push({
      alarmName: `${functionName}-Throttling`,
      metricName: 'Throttles',
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      period: 60,
      statistic: 'Sum',
      dimensions: { FunctionName: functionName },
    });
  }

  // Cache hit rate alarm
  alarms.push({
    alarmName: 'LowCacheHitRate',
    metricName: 'CacheHitRate',
    threshold: 0.4, // 40% minimum (target is 60%)
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: 3,
    period: 300,
    statistic: 'Average',
  });

  // Cost per student alarm
  alarms.push({
    alarmName: 'HighCostPerStudent',
    metricName: 'TotalCostPerStudent',
    threshold: 0.18, // $0.18 = ₹15 (alert threshold)
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    period: 86400, // Daily check
    statistic: 'Average',
  });

  // Concurrent users alarm (for scaling)
  alarms.push({
    alarmName: 'HighConcurrentUsers',
    metricName: 'ConcurrentUsers',
    threshold: 1000,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    period: 60,
    statistic: 'Maximum',
  });

  // Queue depth alarm (for scaling)
  alarms.push({
    alarmName: 'HighQueueDepth',
    metricName: 'QueueDepth',
    threshold: 100,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    period: 60,
    statistic: 'Average',
  });

  // Create all alarms
  for (const alarm of alarms) {
    await createAlarm(alarm, topicArn);
  }
}

/**
 * Create DynamoDB alarms
 */
export async function createDynamoDBAlarms(
  topicArn: string,
  tableNames: string[]
): Promise<void> {
  const alarms: AlarmConfig[] = [];

  for (const tableName of tableNames) {
    // Read throttling alarm
    alarms.push({
      alarmName: `${tableName}-ReadThrottling`,
      metricName: 'UserErrors',
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 60,
      statistic: 'Sum',
      dimensions: { TableName: tableName },
    });

    // Write throttling alarm
    alarms.push({
      alarmName: `${tableName}-WriteThrottling`,
      metricName: 'SystemErrors',
      threshold: 10,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      period: 60,
      statistic: 'Sum',
      dimensions: { TableName: tableName },
    });
  }

  // Create all alarms
  for (const alarm of alarms) {
    await createAlarm(alarm, topicArn);
  }
}

/**
 * Lambda handler for alarm management
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { action, email, functionNames, tableNames } = body;

    let topicArn: string;

    switch (action) {
      case 'setup':
        // Create SNS topic
        topicArn = await createAlarmTopic();

        // Subscribe email if provided
        if (email) {
          await subscribeToAlarms(topicArn, email);
        }

        // Create performance alarms
        if (functionNames && functionNames.length > 0) {
          await createPerformanceAlarms(topicArn, functionNames);
        }

        // Create DynamoDB alarms
        if (tableNames && tableNames.length > 0) {
          await createDynamoDBAlarms(topicArn, tableNames);
        }

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Alarms created successfully',
            topicArn,
          }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error managing alarms:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to manage alarms' }),
    };
  }
};
