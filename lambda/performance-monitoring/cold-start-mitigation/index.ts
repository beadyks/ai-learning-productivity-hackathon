/**
 * Cold Start Mitigation Strategies
 * Requirements: 11.4, 11.5 (Performance optimization, cold start reduction)
 * 
 * This module provides strategies to reduce Lambda cold starts:
 * - Provisioned concurrency configuration
 * - Warm-up scheduling with EventBridge
 * - Lambda layer optimization
 * - Code bundling optimization
 */

import { Lambda, PutProvisionedConcurrencyConfigCommand, GetProvisionedConcurrencyConfigCommand } from '@aws-sdk/client-lambda';
import { EventBridge, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const lambda = new Lambda({ region: process.env.AWS_REGION });
const eventBridge = new EventBridge({ region: process.env.AWS_REGION });

interface ProvisionedConcurrencyConfig {
  functionName: string;
  qualifier: string; // Version or alias
  provisionedConcurrentExecutions: number;
}

interface WarmUpConfig {
  functionName: string;
  scheduleExpression: string; // e.g., "rate(5 minutes)"
  enabled: boolean;
}

/**
 * Configure provisioned concurrency for a Lambda function
 * This keeps functions warm and eliminates cold starts
 * Note: Provisioned concurrency has additional costs
 */
export async function configureProvisionedConcurrency(
  config: ProvisionedConcurrencyConfig
): Promise<void> {
  try {
    await lambda.send(
      new PutProvisionedConcurrencyConfigCommand({
        FunctionName: config.functionName,
        Qualifier: config.qualifier,
        ProvisionedConcurrentExecutions: config.provisionedConcurrentExecutions,
      })
    );

    console.log(
      `Configured provisioned concurrency for ${config.functionName}: ${config.provisionedConcurrentExecutions}`
    );
  } catch (error) {
    console.error(`Error configuring provisioned concurrency:`, error);
    throw error;
  }
}

/**
 * Get current provisioned concurrency configuration
 */
export async function getProvisionedConcurrency(
  functionName: string,
  qualifier: string
): Promise<number> {
  try {
    const response = await lambda.send(
      new GetProvisionedConcurrencyConfigCommand({
        FunctionName: functionName,
        Qualifier: qualifier,
      })
    );

    return response.AllocatedProvisionedConcurrentExecutions || 0;
  } catch (error) {
    console.error(`Error getting provisioned concurrency:`, error);
    return 0;
  }
}

/**
 * Create EventBridge rule to warm up Lambda functions periodically
 * This is a cost-effective alternative to provisioned concurrency
 */
export async function createWarmUpSchedule(config: WarmUpConfig): Promise<void> {
  const ruleName = `${config.functionName}-warmup`;

  try {
    // Create EventBridge rule
    await eventBridge.send(
      new PutRuleCommand({
        Name: ruleName,
        Description: `Warm up schedule for ${config.functionName}`,
        ScheduleExpression: config.scheduleExpression,
        State: config.enabled ? 'ENABLED' : 'DISABLED',
      })
    );

    // Add Lambda function as target
    await eventBridge.send(
      new PutTargetsCommand({
        Rule: ruleName,
        Targets: [
          {
            Id: '1',
            Arn: `arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:${config.functionName}`,
            Input: JSON.stringify({ warmup: true }),
          },
        ],
      })
    );

    console.log(`Created warm-up schedule for ${config.functionName}`);
  } catch (error) {
    console.error(`Error creating warm-up schedule:`, error);
    throw error;
  }
}

/**
 * Recommended cold start mitigation strategies by function type
 */
export function getRecommendedStrategy(
  functionType: 'critical' | 'standard' | 'batch'
): {
  strategy: string;
  provisionedConcurrency?: number;
  warmUpSchedule?: string;
  description: string;
} {
  switch (functionType) {
    case 'critical':
      // Critical functions: Use provisioned concurrency
      return {
        strategy: 'provisioned-concurrency',
        provisionedConcurrency: 2,
        description:
          'Critical functions (API endpoints, real-time processing) should use provisioned concurrency to eliminate cold starts',
      };

    case 'standard':
      // Standard functions: Use periodic warm-up
      return {
        strategy: 'periodic-warmup',
        warmUpSchedule: 'rate(5 minutes)',
        description:
          'Standard functions should use periodic warm-up (every 5 minutes) for cost-effective cold start reduction',
      };

    case 'batch':
      // Batch functions: Accept cold starts
      return {
        strategy: 'accept-cold-starts',
        description:
          'Batch processing functions can accept cold starts as they run infrequently and performance is less critical',
      };

    default:
      return {
        strategy: 'periodic-warmup',
        warmUpSchedule: 'rate(10 minutes)',
        description: 'Default strategy: periodic warm-up every 10 minutes',
      };
  }
}

/**
 * Apply cold start mitigation for all functions
 */
export async function applyColdStartMitigation(
  functions: Array<{ name: string; type: 'critical' | 'standard' | 'batch' }>
): Promise<void> {
  for (const func of functions) {
    const strategy = getRecommendedStrategy(func.type);

    console.log(`Applying ${strategy.strategy} to ${func.name}`);

    if (strategy.strategy === 'provisioned-concurrency' && strategy.provisionedConcurrency) {
      // For critical functions, use provisioned concurrency
      await configureProvisionedConcurrency({
        functionName: func.name,
        qualifier: '$LATEST',
        provisionedConcurrentExecutions: strategy.provisionedConcurrency,
      });
    } else if (strategy.strategy === 'periodic-warmup' && strategy.warmUpSchedule) {
      // For standard functions, use periodic warm-up
      await createWarmUpSchedule({
        functionName: func.name,
        scheduleExpression: strategy.warmUpSchedule,
        enabled: true,
      });
    }
    // For batch functions, do nothing (accept cold starts)
  }

  console.log('Cold start mitigation applied to all functions');
}

/**
 * Code optimization recommendations for reducing cold starts
 */
export const codeOptimizationTips = {
  bundling: {
    title: 'Optimize Code Bundling',
    tips: [
      'Use esbuild or webpack to bundle and minify code',
      'Enable tree-shaking to remove unused code',
      'Use Lambda layers for shared dependencies',
      'Minimize package.json dependencies',
      'Use ARM64 architecture (20% faster cold starts)',
    ],
  },
  initialization: {
    title: 'Optimize Initialization Code',
    tips: [
      'Move SDK client initialization outside handler',
      'Use lazy loading for heavy dependencies',
      'Avoid synchronous operations in global scope',
      'Pre-compile regular expressions',
      'Cache configuration and environment variables',
    ],
  },
  runtime: {
    title: 'Runtime Optimization',
    tips: [
      'Use Node.js 18.x or later (faster startup)',
      'Increase memory allocation (faster CPU = faster cold start)',
      'Use SnapStart for Java functions',
      'Minimize Lambda layer count and size',
      'Use container images only when necessary',
    ],
  },
};

/**
 * Lambda handler for cold start mitigation management
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Handle warm-up requests
    const body = JSON.parse(event.body || '{}');
    if (body.warmup) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Function warmed up' }),
      };
    }

    const { action, functionName, qualifier, provisionedConcurrency, scheduleExpression, functions } = body;

    switch (action) {
      case 'configureProvisioned':
        if (!functionName || !qualifier || provisionedConcurrency === undefined) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters' }),
          };
        }
        await configureProvisionedConcurrency({
          functionName,
          qualifier,
          provisionedConcurrentExecutions: provisionedConcurrency,
        });
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Provisioned concurrency configured' }),
        };

      case 'createWarmUp':
        if (!functionName || !scheduleExpression) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters' }),
          };
        }
        await createWarmUpSchedule({
          functionName,
          scheduleExpression,
          enabled: true,
        });
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Warm-up schedule created' }),
        };

      case 'applyAll':
        if (!functions || functions.length === 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing functions array' }),
          };
        }
        await applyColdStartMitigation(functions);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Cold start mitigation applied to all functions' }),
        };

      case 'getRecommendations':
        return {
          statusCode: 200,
          body: JSON.stringify({ recommendations: codeOptimizationTips }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error in cold start mitigation handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to manage cold start mitigation' }),
    };
  }
};
