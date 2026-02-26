/**
 * Type definitions for Voice-First AI Learning Assistant infrastructure outputs
 * These types match the CloudFormation stack outputs
 */

export interface StackOutputs {
  userPoolId: string;
  userPoolClientId: string;
  httpApiUrl: string;
  httpApiId: string;
  documentBucketName: string;
  userProfilesTableName: string;
  sessionsTableName: string;
  progressTableName: string;
  encryptionKeyId: string;
  region: string;
}

export interface DynamoDBTableConfig {
  tableName: string;
  partitionKey: string;
  sortKey?: string;
  gsiIndexes?: string[];
}

export interface S3BucketConfig {
  bucketName: string;
  region: string;
  encryptionKeyId: string;
}

export interface CognitoConfig {
  userPoolId: string;
  userPoolClientId: string;
  region: string;
}

export interface ApiGatewayConfig {
  apiUrl: string;
  apiId: string;
  region: string;
}

/**
 * Environment configuration for Lambda functions
 */
export interface LambdaEnvironment {
  // DynamoDB Tables
  USER_PROFILES_TABLE: string;
  SESSIONS_TABLE: string;
  PROGRESS_TABLE: string;
  
  // S3 Buckets
  DOCUMENT_BUCKET: string;
  
  // Cognito
  USER_POOL_ID: string;
  USER_POOL_CLIENT_ID: string;
  
  // API Gateway
  API_URL: string;
  
  // KMS
  ENCRYPTION_KEY_ID: string;
  
  // AWS Region
  AWS_REGION: string;
  
  // Cost Optimization
  CACHE_TTL_SECONDS?: string;
  USE_HAIKU_MODEL?: string;
  ENABLE_RESPONSE_CACHING?: string;
}

/**
 * Helper function to create Lambda environment from stack outputs
 */
export function createLambdaEnvironment(outputs: StackOutputs): LambdaEnvironment {
  return {
    USER_PROFILES_TABLE: outputs.userProfilesTableName,
    SESSIONS_TABLE: outputs.sessionsTableName,
    PROGRESS_TABLE: outputs.progressTableName,
    DOCUMENT_BUCKET: outputs.documentBucketName,
    USER_POOL_ID: outputs.userPoolId,
    USER_POOL_CLIENT_ID: outputs.userPoolClientId,
    API_URL: outputs.httpApiUrl,
    ENCRYPTION_KEY_ID: outputs.encryptionKeyId,
    AWS_REGION: outputs.region,
    CACHE_TTL_SECONDS: '86400', // 24 hours
    USE_HAIKU_MODEL: 'true',
    ENABLE_RESPONSE_CACHING: 'true',
  };
}
