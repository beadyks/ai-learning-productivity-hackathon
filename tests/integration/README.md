# Integration Tests

End-to-end integration tests for the Voice-First AI Learning Assistant.

## Overview

This test suite validates complete user journeys, cross-service communication, and error handling across all system components.

## Test Categories

### 1. User Journey Tests (`user-journey.test.ts`)
Tests complete user workflows:
- Document upload to AI response flow
- Study plan creation and tracking
- Multilingual conversation flows
- Mode switching with context preservation

### 2. Cross-Service Tests (`cross-service.test.ts`)
Tests interactions between Lambda functions:
- Document processing pipeline
- AI response generation pipeline
- Session and context management
- Multilingual processing
- Study planning coordination
- Security and authentication

### 3. Error Handling Tests (`error-handling.test.ts`)
Tests error scenarios:
- Document processing errors
- AI service failures
- Network connectivity issues
- Session state errors
- Input validation
- Resource limits

## Prerequisites

1. AWS credentials configured
2. Infrastructure deployed
3. Environment variables set

## Environment Variables

```bash
# Required
export AWS_REGION=us-east-1
export API_ENDPOINT=https://your-api-gateway-url
export USER_TABLE_NAME=voice-learning-users
export SESSION_TABLE_NAME=voice-learning-sessions
export DOCUMENT_BUCKET=voice-learning-documents

# Lambda Function Names
export UPLOAD_HANDLER_FUNCTION=upload-handler
export TEXT_EXTRACTION_FUNCTION=text-extraction
export RESPONSE_GENERATOR_FUNCTION=response-generator
export MODE_CONTROLLER_FUNCTION=mode-controller
export SESSION_PERSISTENCE_FUNCTION=session-persistence
export CONTEXT_MANAGER_FUNCTION=context-manager
export LANGUAGE_DETECTOR_FUNCTION=language-detector
export RESPONSE_FORMATTER_FUNCTION=response-formatter
export GOAL_ANALYSIS_FUNCTION=goal-analysis
export PLAN_GENERATOR_FUNCTION=plan-generator
export AUTH_MANAGER_FUNCTION=auth-manager
export DATA_PROTECTION_FUNCTION=data-protection
```

## Running Tests

### Install Dependencies
```bash
cd tests/integration
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm run test:user-journey
npm run test:cross-service
npm run test:error-handling
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Configuration

Tests are configured with:
- 30-second timeout for long-running operations
- Sequential execution (`--runInBand`) to avoid race conditions
- Automatic cleanup of test data after each suite

## Writing New Tests

1. Import test utilities from `setup.ts`
2. Use `generateTestUserId()` and `generateTestSessionId()` for unique IDs
3. Clean up test data in `afterAll()` hooks
4. Follow existing test patterns for consistency

Example:
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateTestUserId, cleanupTestData, getTestConfig } from './setup';

describe('My New Test Suite', () => {
  let testUserId: string;
  const config = getTestConfig();

  beforeAll(() => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should test something', async () => {
    // Your test code here
  });
});
```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:
- Tests run sequentially to avoid conflicts
- Automatic cleanup prevents data accumulation
- Environment variables configure test targets
- Exit codes indicate pass/fail status

## Troubleshooting

### Tests Timeout
- Increase `testTimeout` in `jest.config.js`
- Check AWS service availability
- Verify network connectivity

### Authentication Errors
- Verify AWS credentials are configured
- Check IAM permissions for test user
- Ensure API Gateway authentication is configured

### Resource Not Found
- Verify infrastructure is deployed
- Check environment variables are set correctly
- Ensure Lambda functions are deployed

## Requirements Coverage

These integration tests validate:
- **Requirements 1.1-1.5**: Document processing
- **Requirements 2.1-2.5**: Study planning
- **Requirements 3.1-3.5**: Response quality
- **Requirements 4.1-4.5**: Voice processing
- **Requirements 5.1-5.5**: Context management
- **Requirements 6.1-6.5**: Multilingual support
- **Requirements 7.1-7.5**: Content prioritization
- **Requirements 8.1-8.5**: Performance optimization
- **Requirements 9.1-9.5**: Security and privacy
- **Requirements 10.1-10.5**: Adaptive modes
- **Requirements 11.1-11.5**: Scalability
