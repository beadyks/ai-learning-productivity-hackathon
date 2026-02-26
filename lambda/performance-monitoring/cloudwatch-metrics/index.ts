/**
 * CloudWatch Metrics and Monitoring Service
 * Requirements: 11.1, 11.2, 11.3 (Performance monitoring, response time tracking, auto-scaling)
 * 
 * This Lambda function provides centralized performance monitoring capabilities:
 * - Custom CloudWatch metrics for response times
 * - Cost tracking per student
 * - Cache hit rate monitoring
 * - Error rate tracking
 * - Auto-scaling metrics
 */

import { CloudWatch } from '@aws-sdk/client-cloudwatch';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

// Metric namespace for the application
const NAMESPACE = 'VoiceLearningAssistant';

interface MetricData {
  metricName: string;
  value: number;
  unit: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

interface PerformanceMetrics {
  responseTime: number;
  functionName: string;
  userId?: string;
  statusCode: number;
  errorType?: string;
  cacheHit?: boolean;
  cost?: number;
}

/**
 * Publish custom CloudWatch metrics
 */
async function publishMetrics(metrics: MetricData[]): Promise<void> {
  const metricData = metrics.map(metric => ({
    MetricName: metric.metricName,
    Value: metric.value,
    Unit: metric.unit,
    Timestamp: metric.timestamp || new Date(),
    Dimensions: metric.dimensions
      ? Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value }))
      : undefined,
  }));

  await cloudwatch.putMetricData({
    Namespace: NAMESPACE,
    MetricData: metricData,
  });
}

/**
 * Track response time metrics
 */
export async function trackResponseTime(metrics: PerformanceMetrics): Promise<void> {
  const metricsToPublish: MetricData[] = [
    {
      metricName: 'ResponseTime',
      value: metrics.responseTime,
      unit: 'Milliseconds',
      dimensions: {
        FunctionName: metrics.functionName,
        StatusCode: metrics.statusCode.toString(),
      },
    },
  ];

  // Track error rates
  if (metrics.statusCode >= 400) {
    metricsToPublish.push({
      metricName: 'ErrorCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        FunctionName: metrics.functionName,
        ErrorType: metrics.errorType || 'Unknown',
      },
    });
  }

  // Track cache hit rates
  if (metrics.cacheHit !== undefined) {
    metricsToPublish.push({
      metricName: 'CacheHitRate',
      value: metrics.cacheHit ? 1 : 0,
      unit: 'Count',
      dimensions: {
        FunctionName: metrics.functionName,
      },
    });
  }

  // Track cost per request
  if (metrics.cost !== undefined) {
    metricsToPublish.push({
      metricName: 'CostPerRequest',
      value: metrics.cost,
      unit: 'None',
      dimensions: {
        FunctionName: metrics.functionName,
      },
    });
  }

  await publishMetrics(metricsToPublish);
}

/**
 * Track user-level metrics
 */
export async function trackUserMetrics(
  userId: string,
  studyTime: number,
  documentCount: number,
  queryCount: number
): Promise<void> {
  const metrics: MetricData[] = [
    {
      metricName: 'StudyTimeMinutes',
      value: studyTime,
      unit: 'None',
      dimensions: { UserId: userId },
    },
    {
      metricName: 'DocumentCount',
      value: documentCount,
      unit: 'Count',
      dimensions: { UserId: userId },
    },
    {
      metricName: 'QueryCount',
      value: queryCount,
      unit: 'Count',
      dimensions: { UserId: userId },
    },
  ];

  await publishMetrics(metrics);
}

/**
 * Track cost metrics per student
 */
export async function trackCostMetrics(
  userId: string,
  aiCost: number,
  storageCost: number,
  computeCost: number
): Promise<void> {
  const totalCost = aiCost + storageCost + computeCost;

  const metrics: MetricData[] = [
    {
      metricName: 'AICost',
      value: aiCost,
      unit: 'None',
      dimensions: { UserId: userId },
    },
    {
      metricName: 'StorageCost',
      value: storageCost,
      unit: 'None',
      dimensions: { UserId: userId },
    },
    {
      metricName: 'ComputeCost',
      value: computeCost,
      unit: 'None',
      dimensions: { UserId: userId },
    },
    {
      metricName: 'TotalCostPerStudent',
      value: totalCost,
      unit: 'None',
      dimensions: { UserId: userId },
    },
  ];

  await publishMetrics(metrics);
}

/**
 * Track auto-scaling metrics
 */
export async function trackScalingMetrics(
  concurrentUsers: number,
  activeConnections: number,
  queueDepth: number
): Promise<void> {
  const metrics: MetricData[] = [
    {
      metricName: 'ConcurrentUsers',
      value: concurrentUsers,
      unit: 'Count',
    },
    {
      metricName: 'ActiveConnections',
      value: activeConnections,
      unit: 'Count',
    },
    {
      metricName: 'QueueDepth',
      value: queueDepth,
      unit: 'Count',
    },
  ];

  await publishMetrics(metrics);
}

/**
 * Lambda handler for metric collection
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { action, data } = body;

    switch (action) {
      case 'trackResponseTime':
        await trackResponseTime(data);
        break;
      case 'trackUserMetrics':
        await trackUserMetrics(
          data.userId,
          data.studyTime,
          data.documentCount,
          data.queryCount
        );
        break;
      case 'trackCostMetrics':
        await trackCostMetrics(
          data.userId,
          data.aiCost,
          data.storageCost,
          data.computeCost
        );
        break;
      case 'trackScalingMetrics':
        await trackScalingMetrics(
          data.concurrentUsers,
          data.activeConnections,
          data.queueDepth
        );
        break;
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Metrics published successfully' }),
    };
  } catch (error) {
    console.error('Error publishing metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to publish metrics' }),
    };
  }
};
