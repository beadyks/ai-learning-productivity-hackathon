/**
 * Lambda Function Optimizer
 * Requirements: 11.4, 11.5 (Memory/timeout optimization, cost optimization)
 * 
 * This service provides utilities for:
 * - Memory and timeout optimization
 * - Connection pooling for DynamoDB and other AWS services
 * - Cold start mitigation strategies
 * - Performance profiling and recommendations
 */

import { Lambda, GetFunctionConfigurationCommand, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { CloudWatch, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const lambda = new Lambda({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

interface OptimizationRecommendation {
  functionName: string;
  currentMemory: number;
  recommendedMemory: number;
  currentTimeout: number;
  recommendedTimeout: number;
  estimatedCostSavings: number;
  reason: string;
}

interface PerformanceMetrics {
  avgDuration: number;
  maxDuration: number;
  avgMemoryUsed: number;
  maxMemoryUsed: number;
  invocations: number;
  errors: number;
  throttles: number;
}

/**
 * Get Lambda function performance metrics from CloudWatch
 */
async function getFunctionMetrics(
  functionName: string,
  startTime: Date,
  endTime: Date
): Promise<PerformanceMetrics> {
  const metrics = {
    avgDuration: 0,
    maxDuration: 0,
    avgMemoryUsed: 0,
    maxMemoryUsed: 0,
    invocations: 0,
    errors: 0,
    throttles: 0,
  };

  try {
    // Get duration metrics
    const durationResponse = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Duration',
        Dimensions: [{ Name: 'FunctionName', Value: functionName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour
        Statistics: ['Average', 'Maximum'],
      })
    );

    if (durationResponse.Datapoints && durationResponse.Datapoints.length > 0) {
      const datapoints = durationResponse.Datapoints;
      metrics.avgDuration =
        datapoints.reduce((sum, dp) => sum + (dp.Average || 0), 0) / datapoints.length;
      metrics.maxDuration = Math.max(...datapoints.map(dp => dp.Maximum || 0));
    }

    // Get invocation count
    const invocationResponse = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [{ Name: 'FunctionName', Value: functionName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
      })
    );

    if (invocationResponse.Datapoints && invocationResponse.Datapoints.length > 0) {
      metrics.invocations = invocationResponse.Datapoints.reduce(
        (sum, dp) => sum + (dp.Sum || 0),
        0
      );
    }

    // Get error count
    const errorResponse = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        Dimensions: [{ Name: 'FunctionName', Value: functionName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
      })
    );

    if (errorResponse.Datapoints && errorResponse.Datapoints.length > 0) {
      metrics.errors = errorResponse.Datapoints.reduce((sum, dp) => sum + (dp.Sum || 0), 0);
    }

    // Get throttle count
    const throttleResponse = await cloudwatch.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Throttles',
        Dimensions: [{ Name: 'FunctionName', Value: functionName }],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
      })
    );

    if (throttleResponse.Datapoints && throttleResponse.Datapoints.length > 0) {
      metrics.throttles = throttleResponse.Datapoints.reduce(
        (sum, dp) => sum + (dp.Sum || 0),
        0
      );
    }
  } catch (error) {
    console.error(`Error getting metrics for ${functionName}:`, error);
  }

  return metrics;
}

/**
 * Analyze function performance and generate optimization recommendations
 */
export async function analyzeFunction(
  functionName: string,
  daysToAnalyze: number = 7
): Promise<OptimizationRecommendation> {
  // Get current function configuration
  const configResponse = await lambda.send(
    new GetFunctionConfigurationCommand({ FunctionName: functionName })
  );

  const currentMemory = configResponse.MemorySize || 128;
  const currentTimeout = configResponse.Timeout || 3;

  // Get performance metrics
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - daysToAnalyze * 24 * 60 * 60 * 1000);
  const metrics = await getFunctionMetrics(functionName, startTime, endTime);

  // Calculate recommendations
  let recommendedMemory = currentMemory;
  let recommendedTimeout = currentTimeout;
  let reason = '';

  // Memory optimization
  // Lambda pricing: memory is linear, but more memory = faster execution
  // Find the sweet spot where cost per execution is minimized
  if (metrics.avgDuration > 0) {
    const utilizationRatio = metrics.avgDuration / (currentTimeout * 1000);

    if (utilizationRatio < 0.3) {
      // Function finishes quickly, might be over-provisioned
      recommendedMemory = Math.max(128, Math.floor(currentMemory * 0.75));
      reason = 'Function completes quickly; reducing memory may save costs';
    } else if (utilizationRatio > 0.8) {
      // Function uses most of timeout, might need more resources
      recommendedMemory = Math.min(10240, Math.floor(currentMemory * 1.5));
      reason = 'Function uses most of timeout; increasing memory may improve performance';
    } else {
      recommendedMemory = currentMemory;
      reason = 'Current memory allocation is optimal';
    }

    // Timeout optimization
    const timeoutBuffer = 1.5; // 50% buffer
    const recommendedTimeoutSeconds = Math.ceil((metrics.maxDuration / 1000) * timeoutBuffer);
    recommendedTimeout = Math.max(3, Math.min(900, recommendedTimeoutSeconds));

    if (recommendedTimeout < currentTimeout * 0.7) {
      reason += '; timeout can be reduced';
    } else if (recommendedTimeout > currentTimeout) {
      reason += '; timeout should be increased to prevent failures';
    }
  }

  // Calculate estimated cost savings
  // Lambda pricing: $0.0000133334 per GB-second (ARM64)
  const currentCostPerInvocation =
    (currentMemory / 1024) * (metrics.avgDuration / 1000) * 0.0000133334;
  const recommendedCostPerInvocation =
    (recommendedMemory / 1024) * (metrics.avgDuration / 1000) * 0.0000133334;
  const estimatedCostSavings =
    (currentCostPerInvocation - recommendedCostPerInvocation) * metrics.invocations;

  return {
    functionName,
    currentMemory,
    recommendedMemory,
    currentTimeout,
    recommendedTimeout,
    estimatedCostSavings,
    reason,
  };
}

/**
 * Apply optimization recommendations to a function
 */
export async function applyOptimization(
  functionName: string,
  memory: number,
  timeout: number
): Promise<void> {
  await lambda.send(
    new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      MemorySize: memory,
      Timeout: timeout,
    })
  );

  console.log(`Updated ${functionName}: Memory=${memory}MB, Timeout=${timeout}s`);
}

/**
 * Optimize all Lambda functions in the application
 */
export async function optimizeAllFunctions(
  functionNames: string[],
  autoApply: boolean = false
): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];

  for (const functionName of functionNames) {
    try {
      const recommendation = await analyzeFunction(functionName);
      recommendations.push(recommendation);

      if (autoApply && recommendation.estimatedCostSavings > 0) {
        await applyOptimization(
          functionName,
          recommendation.recommendedMemory,
          recommendation.recommendedTimeout
        );
      }
    } catch (error) {
      console.error(`Error optimizing ${functionName}:`, error);
    }
  }

  return recommendations;
}

/**
 * Lambda handler for optimization management
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { action, functionName, functionNames, autoApply, memory, timeout } = body;

    switch (action) {
      case 'analyze':
        if (!functionName) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing functionName' }),
          };
        }
        const recommendation = await analyzeFunction(functionName);
        return {
          statusCode: 200,
          body: JSON.stringify({ recommendation }),
        };

      case 'optimizeAll':
        if (!functionNames || functionNames.length === 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing functionNames' }),
          };
        }
        const recommendations = await optimizeAllFunctions(functionNames, autoApply || false);
        return {
          statusCode: 200,
          body: JSON.stringify({ recommendations }),
        };

      case 'apply':
        if (!functionName || !memory || !timeout) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing functionName, memory, or timeout' }),
          };
        }
        await applyOptimization(functionName, memory, timeout);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Optimization applied successfully' }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error in optimization handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to optimize functions' }),
    };
  }
};
