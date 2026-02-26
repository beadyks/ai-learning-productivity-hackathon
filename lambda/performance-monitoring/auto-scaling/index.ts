/**
 * Auto-Scaling Configuration Service
 * Requirements: 11.2, 11.3 (Auto-scaling resources, maintain performance)
 * 
 * This service manages auto-scaling for:
 * - Lambda reserved concurrency
 * - DynamoDB on-demand capacity (automatic)
 * - API Gateway throttling limits
 * - EC2 Spot instances for vector search (if needed)
 */

import {
  ApplicationAutoScaling,
  RegisterScalableTargetCommand,
  PutScalingPolicyCommand,
  DescribeScalableTargetsCommand,
} from '@aws-sdk/client-application-auto-scaling';
import { Lambda, PutFunctionConcurrencyCommand } from '@aws-sdk/client-lambda';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const autoScaling = new ApplicationAutoScaling({ region: process.env.AWS_REGION });
const lambda = new Lambda({ region: process.env.AWS_REGION });

interface ScalingConfig {
  resourceId: string;
  minCapacity: number;
  maxCapacity: number;
  targetValue: number;
  scaleInCooldown?: number;
  scaleOutCooldown?: number;
}

/**
 * Configure Lambda reserved concurrency for critical functions
 */
export async function configureLambdaConcurrency(
  functionName: string,
  reservedConcurrency: number
): Promise<void> {
  try {
    await lambda.send(
      new PutFunctionConcurrencyCommand({
        FunctionName: functionName,
        ReservedConcurrentExecutions: reservedConcurrency,
      })
    );
    console.log(`Set reserved concurrency for ${functionName}: ${reservedConcurrency}`);
  } catch (error) {
    console.error(`Error setting concurrency for ${functionName}:`, error);
    throw error;
  }
}

/**
 * Register DynamoDB table for auto-scaling (if using provisioned capacity)
 * Note: On-demand tables scale automatically, this is for provisioned mode
 */
export async function registerDynamoDBScaling(
  tableName: string,
  config: ScalingConfig
): Promise<void> {
  try {
    // Register read capacity scaling
    await autoScaling.send(
      new RegisterScalableTargetCommand({
        ServiceNamespace: 'dynamodb',
        ResourceId: `table/${tableName}`,
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        MinCapacity: config.minCapacity,
        MaxCapacity: config.maxCapacity,
      })
    );

    // Register write capacity scaling
    await autoScaling.send(
      new RegisterScalableTargetCommand({
        ServiceNamespace: 'dynamodb',
        ResourceId: `table/${tableName}`,
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
        MinCapacity: config.minCapacity,
        MaxCapacity: config.maxCapacity,
      })
    );

    console.log(`Registered auto-scaling for table: ${tableName}`);
  } catch (error) {
    console.error(`Error registering scaling for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create target tracking scaling policy for DynamoDB
 */
export async function createDynamoDBScalingPolicy(
  tableName: string,
  config: ScalingConfig
): Promise<void> {
  try {
    // Read capacity scaling policy
    await autoScaling.send(
      new PutScalingPolicyCommand({
        ServiceNamespace: 'dynamodb',
        ResourceId: `table/${tableName}`,
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        PolicyName: `${tableName}-read-scaling-policy`,
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: config.targetValue, // Target utilization (e.g., 70%)
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBReadCapacityUtilization',
          },
          ScaleInCooldown: config.scaleInCooldown || 60,
          ScaleOutCooldown: config.scaleOutCooldown || 60,
        },
      })
    );

    // Write capacity scaling policy
    await autoScaling.send(
      new PutScalingPolicyCommand({
        ServiceNamespace: 'dynamodb',
        ResourceId: `table/${tableName}`,
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
        PolicyName: `${tableName}-write-scaling-policy`,
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: config.targetValue,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBWriteCapacityUtilization',
          },
          ScaleInCooldown: config.scaleInCooldown || 60,
          ScaleOutCooldown: config.scaleOutCooldown || 60,
        },
      })
    );

    console.log(`Created scaling policies for table: ${tableName}`);
  } catch (error) {
    console.error(`Error creating scaling policy for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get current scaling configuration
 */
export async function getScalingConfiguration(
  serviceNamespace: string,
  resourceId: string
): Promise<any> {
  try {
    const response = await autoScaling.send(
      new DescribeScalableTargetsCommand({
        ServiceNamespace: serviceNamespace as any,
        ResourceIds: [resourceId],
      })
    );
    return response.ScalableTargets;
  } catch (error) {
    console.error('Error getting scaling configuration:', error);
    throw error;
  }
}

/**
 * Configure auto-scaling for all critical resources
 */
export async function configureAutoScaling(
  lambdaFunctions: string[],
  dynamoDBTables: string[]
): Promise<void> {
  // Configure Lambda concurrency for critical functions
  const criticalFunctions = [
    'voice-learning-response-generator',
    'voice-learning-semantic-search',
    'voice-learning-conversation-orchestrator',
  ];

  for (const functionName of lambdaFunctions) {
    if (criticalFunctions.includes(functionName)) {
      // Reserve higher concurrency for critical functions
      await configureLambdaConcurrency(functionName, 100);
    } else {
      // Standard concurrency for other functions
      await configureLambdaConcurrency(functionName, 50);
    }
  }

  // Note: DynamoDB tables are using on-demand billing mode
  // which automatically scales. If switching to provisioned mode,
  // uncomment the following code:
  
  /*
  for (const tableName of dynamoDBTables) {
    await registerDynamoDBScaling(tableName, {
      resourceId: `table/${tableName}`,
      minCapacity: 5,
      maxCapacity: 100,
      targetValue: 70, // 70% utilization target
      scaleInCooldown: 60,
      scaleOutCooldown: 60,
    });

    await createDynamoDBScalingPolicy(tableName, {
      resourceId: `table/${tableName}`,
      minCapacity: 5,
      maxCapacity: 100,
      targetValue: 70,
      scaleInCooldown: 60,
      scaleOutCooldown: 60,
    });
  }
  */

  console.log('Auto-scaling configuration completed');
}

/**
 * Lambda handler for auto-scaling management
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { action, lambdaFunctions, dynamoDBTables, functionName, concurrency } = body;

    switch (action) {
      case 'configure':
        await configureAutoScaling(lambdaFunctions || [], dynamoDBTables || []);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Auto-scaling configured successfully' }),
        };

      case 'setLambdaConcurrency':
        if (!functionName || concurrency === undefined) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing functionName or concurrency' }),
          };
        }
        await configureLambdaConcurrency(functionName, concurrency);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `Concurrency set for ${functionName}`,
            concurrency,
          }),
        };

      case 'getConfiguration':
        const config = await getScalingConfiguration(
          body.serviceNamespace,
          body.resourceId
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ configuration: config }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error managing auto-scaling:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to manage auto-scaling' }),
    };
  }
};
