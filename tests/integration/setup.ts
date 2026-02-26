/**
 * Integration Test Setup
 * Configures test environment for end-to-end integration tests
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';

export interface TestConfig {
  region: string;
  userTableName: string;
  sessionTableName: string;
  documentBucket: string;
  apiEndpoint: string;
}

export const getTestConfig = (): TestConfig => {
  return {
    region: process.env.AWS_REGION || 'us-east-1',
    userTableName: process.env.USER_TABLE_NAME || 'test-users',
    sessionTableName: process.env.SESSION_TABLE_NAME || 'test-sessions',
    documentBucket: process.env.DOCUMENT_BUCKET || 'test-documents',
    apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
  };
};

export const createTestClients = () => {
  const config = getTestConfig();
  
  return {
    dynamodb: new DynamoDBClient({ region: config.region }),
    s3: new S3Client({ region: config.region }),
    lambda: new LambdaClient({ region: config.region }),
  };
};

export const cleanupTestData = async (userId: string) => {
  const config = getTestConfig();
  const { dynamodb, s3 } = createTestClients();
  
  // Cleanup logic would go here
  console.log(`Cleaning up test data for user: ${userId}`);
};

export const generateTestUserId = (): string => {
  return `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

export const generateTestSessionId = (): string => {
  return `test-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};
