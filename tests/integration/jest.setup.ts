/**
 * Jest Setup for Integration Tests
 * Configures test environment and global settings
 */

// Set test environment variables
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('Starting integration test suite...');
  console.log('AWS Region:', process.env.AWS_REGION);
  console.log('API Endpoint:', process.env.API_ENDPOINT || 'http://localhost:3000');
});

// Global test teardown
afterAll(() => {
  console.log('Integration test suite completed');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
