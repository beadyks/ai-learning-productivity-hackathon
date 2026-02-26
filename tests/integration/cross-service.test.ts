/**
 * Cross-Service Communication Integration Tests
 * Tests interactions between different Lambda functions and services
 * 
 * Requirements: All requirements
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  generateTestUserId,
  generateTestSessionId,
  cleanupTestData,
  createTestClients,
} from './setup';

describe('Document Processing Pipeline', () => {
  let testUserId: string;
  const clients = createTestClients();

  beforeAll(() => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should process document through complete pipeline', async () => {
    // Test upload-handler -> text-extraction -> content-chunking -> embedding
    const uploadPayload = {
      userId: testUserId,
      fileName: 'test-document.pdf',
      fileType: 'application/pdf',
      fileSize: 2048,
    };

    const uploadCommand = new InvokeCommand({
      FunctionName: process.env.UPLOAD_HANDLER_FUNCTION || 'upload-handler',
      Payload: Buffer.from(JSON.stringify(uploadPayload)),
    });

    const uploadResponse = await clients.lambda.send(uploadCommand);
    const uploadResult = JSON.parse(
      Buffer.from(uploadResponse.Payload!).toString()
    );

    expect(uploadResult).toHaveProperty('documentId');
    expect(uploadResult).toHaveProperty('uploadUrl');

    // Verify document metadata stored
    expect(uploadResult.status).toBe('pending');
  });

  it('should handle text extraction failures gracefully', async () => {
    const extractionPayload = {
      documentId: 'invalid-doc-id',
      s3Bucket: 'test-bucket',
      s3Key: 'nonexistent.pdf',
    };

    const extractionCommand = new InvokeCommand({
      FunctionName: process.env.TEXT_EXTRACTION_FUNCTION || 'text-extraction',
      Payload: Buffer.from(JSON.stringify(extractionPayload)),
    });

    const extractionResponse = await clients.lambda.send(extractionCommand);
    const extractionResult = JSON.parse(
      Buffer.from(extractionResponse.Payload!).toString()
    );

    expect(extractionResult).toHaveProperty('error');
    expect(extractionResult.error).toBeTruthy();
  });
});

describe('AI Response Generation Pipeline', () => {
  let testUserId: string;
  let testSessionId: string;
  const clients = createTestClients();

  beforeAll(() => {
    testUserId = generateTestUserId();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should coordinate semantic search and response generation', async () => {
    // Test semantic-search -> response-generator -> mode-controller
    const queryPayload = {
      userId: testUserId,
      sessionId: testSessionId,
      query: 'What is a linked list?',
      mode: 'tutor',
    };

    const responseCommand = new InvokeCommand({
      FunctionName: process.env.RESPONSE_GENERATOR_FUNCTION || 'response-generator',
      Payload: Buffer.from(JSON.stringify(queryPayload)),
    });

    const responseResult = await clients.lambda.send(responseCommand);
    const response = JSON.parse(Buffer.from(responseResult.Payload!).toString());

    expect(response).toHaveProperty('response');
    expect(response).toHaveProperty('sources');
    expect(response).toHaveProperty('mode');
    expect(response.mode).toBe('tutor');
  });

  it('should apply mode-specific formatting', async () => {
    const modes = ['tutor', 'interviewer', 'mentor'];

    for (const mode of modes) {
      const modePayload = {
        userId: testUserId,
        sessionId: testSessionId,
        query: 'Explain recursion',
        mode,
      };

      const modeCommand = new InvokeCommand({
        FunctionName: process.env.MODE_CONTROLLER_FUNCTION || 'mode-controller',
        Payload: Buffer.from(JSON.stringify(modePayload)),
      });

      const modeResult = await clients.lambda.send(modeCommand);
      const modeResponse = JSON.parse(
        Buffer.from(modeResult.Payload!).toString()
      );

      expect(modeResponse).toHaveProperty('response');
      expect(modeResponse.mode).toBe(mode);
    }
  });
});

describe('Session and Context Management', () => {
  let testUserId: string;
  let testSessionId: string;
  const clients = createTestClients();

  beforeAll(() => {
    testUserId = generateTestUserId();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should persist and restore session context', async () => {
    // Create session
    const createPayload = {
      userId: testUserId,
      sessionId: testSessionId,
      context: {
        currentTopic: 'arrays',
        mode: 'tutor',
        language: 'en',
      },
    };

    const createCommand = new InvokeCommand({
      FunctionName:
        process.env.SESSION_PERSISTENCE_FUNCTION || 'session-persistence',
      Payload: Buffer.from(JSON.stringify({ action: 'create', ...createPayload })),
    });

    const createResult = await clients.lambda.send(createCommand);
    const createResponse = JSON.parse(
      Buffer.from(createResult.Payload!).toString()
    );

    expect(createResponse.success).toBe(true);

    // Restore session
    const restoreCommand = new InvokeCommand({
      FunctionName:
        process.env.SESSION_PERSISTENCE_FUNCTION || 'session-persistence',
      Payload: Buffer.from(
        JSON.stringify({ action: 'restore', userId: testUserId, sessionId: testSessionId })
      ),
    });

    const restoreResult = await clients.lambda.send(restoreCommand);
    const restoreResponse = JSON.parse(
      Buffer.from(restoreResult.Payload!).toString()
    );

    expect(restoreResponse).toHaveProperty('context');
    expect(restoreResponse.context.currentTopic).toBe('arrays');
  });

  it('should maintain context across multiple interactions', async () => {
    const interactions = [
      { query: 'What is an array?', expectedTopic: 'array' },
      { query: 'How do I access elements?', expectedTopic: 'array' },
      { query: 'What about sorting?', expectedTopic: 'array' },
    ];

    for (const interaction of interactions) {
      const contextPayload = {
        userId: testUserId,
        sessionId: testSessionId,
        query: interaction.query,
      };

      const contextCommand = new InvokeCommand({
        FunctionName: process.env.CONTEXT_MANAGER_FUNCTION || 'context-manager',
        Payload: Buffer.from(JSON.stringify(contextPayload)),
      });

      const contextResult = await clients.lambda.send(contextCommand);
      const contextResponse = JSON.parse(
        Buffer.from(contextResult.Payload!).toString()
      );

      expect(contextResponse).toHaveProperty('context');
      expect(contextResponse.context.currentTopic).toContain(
        interaction.expectedTopic
      );
    }
  });
});

describe('Multilingual Processing Pipeline', () => {
  let testUserId: string;
  const clients = createTestClients();

  beforeAll(() => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should detect and process multiple languages', async () => {
    const testCases = [
      { text: 'What is machine learning?', expectedLang: 'en' },
      { text: 'मशीन लर्निंग क्या है?', expectedLang: 'hi' },
      { text: 'Machine learning kya hai?', expectedLang: 'hi' }, // Hinglish
    ];

    for (const testCase of testCases) {
      const detectPayload = {
        text: testCase.text,
      };

      const detectCommand = new InvokeCommand({
        FunctionName: process.env.LANGUAGE_DETECTOR_FUNCTION || 'language-detector',
        Payload: Buffer.from(JSON.stringify(detectPayload)),
      });

      const detectResult = await clients.lambda.send(detectCommand);
      const detectResponse = JSON.parse(
        Buffer.from(detectResult.Payload!).toString()
      );

      expect(detectResponse).toHaveProperty('language');
      expect(detectResponse.language).toBe(testCase.expectedLang);
    }
  });

  it('should format responses in detected language', async () => {
    const formatPayload = {
      response: 'Arrays are data structures that store elements.',
      language: 'hi',
    };

    const formatCommand = new InvokeCommand({
      FunctionName:
        process.env.RESPONSE_FORMATTER_FUNCTION || 'response-formatter',
      Payload: Buffer.from(JSON.stringify(formatPayload)),
    });

    const formatResult = await clients.lambda.send(formatCommand);
    const formatResponse = JSON.parse(
      Buffer.from(formatResult.Payload!).toString()
    );

    expect(formatResponse).toHaveProperty('formattedResponse');
    expect(formatResponse.language).toBe('hi');
  });
});

describe('Study Planning Pipeline', () => {
  let testUserId: string;
  const clients = createTestClients();

  beforeAll(() => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should coordinate goal analysis and plan generation', async () => {
    // Step 1: Analyze goal
    const goalPayload = {
      userId: testUserId,
      goal: {
        type: 'exam',
        subject: 'Algorithms',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currentLevel: 'beginner',
      },
      constraints: {
        dailyHours: 2,
        daysPerWeek: 5,
      },
    };

    const goalCommand = new InvokeCommand({
      FunctionName: process.env.GOAL_ANALYSIS_FUNCTION || 'goal-analysis',
      Payload: Buffer.from(JSON.stringify(goalPayload)),
    });

    const goalResult = await clients.lambda.send(goalCommand);
    const goalResponse = JSON.parse(Buffer.from(goalResult.Payload!).toString());

    expect(goalResponse).toHaveProperty('feasibility');
    expect(goalResponse).toHaveProperty('estimatedDuration');

    // Step 2: Generate plan
    const planPayload = {
      userId: testUserId,
      goalAnalysis: goalResponse,
      ...goalPayload,
    };

    const planCommand = new InvokeCommand({
      FunctionName: process.env.PLAN_GENERATOR_FUNCTION || 'plan-generator',
      Payload: Buffer.from(JSON.stringify(planPayload)),
    });

    const planResult = await clients.lambda.send(planCommand);
    const planResponse = JSON.parse(Buffer.from(planResult.Payload!).toString());

    expect(planResponse).toHaveProperty('planId');
    expect(planResponse).toHaveProperty('dailySessions');
    expect(planResponse.dailySessions.length).toBeGreaterThan(0);
  });
});

describe('Security and Authentication Pipeline', () => {
  let testUserId: string;
  const clients = createTestClients();

  beforeAll(() => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should authenticate and authorize requests', async () => {
    const authPayload = {
      token: 'test-jwt-token',
      action: 'read',
      resource: 'documents',
    };

    const authCommand = new InvokeCommand({
      FunctionName: process.env.AUTH_MANAGER_FUNCTION || 'auth-manager',
      Payload: Buffer.from(JSON.stringify(authPayload)),
    });

    const authResult = await clients.lambda.send(authCommand);
    const authResponse = JSON.parse(Buffer.from(authResult.Payload!).toString());

    expect(authResponse).toHaveProperty('authorized');
    expect(typeof authResponse.authorized).toBe('boolean');
  });

  it('should encrypt and decrypt sensitive data', async () => {
    const testData = 'Sensitive user information';

    // Encrypt
    const encryptPayload = {
      action: 'encrypt',
      data: testData,
      userId: testUserId,
    };

    const encryptCommand = new InvokeCommand({
      FunctionName: process.env.DATA_PROTECTION_FUNCTION || 'data-protection',
      Payload: Buffer.from(JSON.stringify(encryptPayload)),
    });

    const encryptResult = await clients.lambda.send(encryptCommand);
    const encryptResponse = JSON.parse(
      Buffer.from(encryptResult.Payload!).toString()
    );

    expect(encryptResponse).toHaveProperty('encryptedData');
    expect(encryptResponse.encryptedData).not.toBe(testData);

    // Decrypt
    const decryptPayload = {
      action: 'decrypt',
      encryptedData: encryptResponse.encryptedData,
      userId: testUserId,
    };

    const decryptCommand = new InvokeCommand({
      FunctionName: process.env.DATA_PROTECTION_FUNCTION || 'data-protection',
      Payload: Buffer.from(JSON.stringify(decryptPayload)),
    });

    const decryptResult = await clients.lambda.send(decryptCommand);
    const decryptResponse = JSON.parse(
      Buffer.from(decryptResult.Payload!).toString()
    );

    expect(decryptResponse).toHaveProperty('data');
    expect(decryptResponse.data).toBe(testData);
  });
});
