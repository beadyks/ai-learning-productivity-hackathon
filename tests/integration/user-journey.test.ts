/**
 * End-to-End User Journey Integration Tests
 * Tests complete user workflows from document upload to AI response
 * 
 * Requirements: All requirements (1.1-11.5)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  generateTestUserId,
  generateTestSessionId,
  cleanupTestData,
  getTestConfig,
} from './setup';

describe('Complete User Journey - Document Upload to Response', () => {
  let testUserId: string;
  let testSessionId: string;
  let documentId: string;
  const config = getTestConfig();

  beforeAll(() => {
    testUserId = generateTestUserId();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should complete full document upload and processing flow', async () => {
    // Step 1: Upload document
    const uploadResponse = await fetch(`${config.apiEndpoint}/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
      },
      body: JSON.stringify({
        fileName: 'test-syllabus.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
      }),
    });

    expect(uploadResponse.status).toBe(200);
    const uploadData = await uploadResponse.json();
    expect(uploadData).toHaveProperty('documentId');
    expect(uploadData).toHaveProperty('uploadUrl');
    documentId = uploadData.documentId;

    // Step 2: Check processing status
    const statusResponse = await fetch(
      `${config.apiEndpoint}/documents/${documentId}/status`,
      {
        headers: { 'x-user-id': testUserId },
      }
    );

    expect(statusResponse.status).toBe(200);
    const statusData = await statusResponse.json();
    expect(statusData).toHaveProperty('status');
    expect(['processing', 'completed', 'pending']).toContain(statusData.status);

    // Step 3: Query content from uploaded document
    const queryResponse = await fetch(`${config.apiEndpoint}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        query: 'What topics are covered in this document?',
        mode: 'tutor',
      }),
    });

    expect(queryResponse.status).toBe(200);
    const queryData = await queryResponse.json();
    expect(queryData).toHaveProperty('response');
    expect(queryData).toHaveProperty('sources');
    expect(queryData.response).toBeTruthy();
  });

  it('should handle document upload errors gracefully', async () => {
    // Test unsupported file format
    const uploadResponse = await fetch(`${config.apiEndpoint}/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
      },
      body: JSON.stringify({
        fileName: 'test.exe',
        fileType: 'application/x-msdownload',
        fileSize: 1024,
      }),
    });

    expect(uploadResponse.status).toBe(400);
    const errorData = await uploadResponse.json();
    expect(errorData).toHaveProperty('error');
    expect(errorData.error).toContain('supported formats');
  });
});

describe('Complete User Journey - Study Planning', () => {
  let testUserId: string;
  let studyPlanId: string;
  const config = getTestConfig();

  beforeAll(() => {
    testUserId = generateTestUserId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should create and track study plan', async () => {
    // Step 1: Create study plan
    const createPlanResponse = await fetch(`${config.apiEndpoint}/study-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
      },
      body: JSON.stringify({
        goal: {
          type: 'exam',
          subject: 'Data Structures',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          currentLevel: 'beginner',
        },
        constraints: {
          dailyHours: 2,
          daysPerWeek: 5,
        },
      }),
    });

    expect(createPlanResponse.status).toBe(200);
    const planData = await createPlanResponse.json();
    expect(planData).toHaveProperty('planId');
    expect(planData).toHaveProperty('dailySessions');
    expect(planData.dailySessions.length).toBeGreaterThan(0);
    studyPlanId = planData.planId;

    // Step 2: Update progress
    const updateProgressResponse = await fetch(
      `${config.apiEndpoint}/study-plan/${studyPlanId}/progress`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testUserId,
        },
        body: JSON.stringify({
          topicId: planData.dailySessions[0].topics[0].id,
          completionStatus: 'completed',
        }),
      }
    );

    expect(updateProgressResponse.status).toBe(200);

    // Step 3: Get progress summary
    const progressResponse = await fetch(
      `${config.apiEndpoint}/study-plan/${studyPlanId}/summary`,
      {
        headers: { 'x-user-id': testUserId },
      }
    );

    expect(progressResponse.status).toBe(200);
    const progressData = await progressResponse.json();
    expect(progressData).toHaveProperty('completedTopics');
    expect(progressData.completedTopics).toBeGreaterThan(0);
  });
});

describe('Complete User Journey - Multilingual Conversation', () => {
  let testUserId: string;
  let testSessionId: string;
  const config = getTestConfig();

  beforeAll(() => {
    testUserId = generateTestUserId();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should handle multilingual conversation flow', async () => {
    // Step 1: English query
    const englishResponse = await fetch(`${config.apiEndpoint}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        query: 'Explain arrays in simple terms',
        language: 'en',
        mode: 'tutor',
      }),
    });

    expect(englishResponse.status).toBe(200);
    const englishData = await englishResponse.json();
    expect(englishData).toHaveProperty('response');
    expect(englishData.language).toBe('en');

    // Step 2: Hindi query in same session
    const hindiResponse = await fetch(`${config.apiEndpoint}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        query: 'Array kya hota hai?',
        language: 'hi',
        mode: 'tutor',
      }),
    });

    expect(hindiResponse.status).toBe(200);
    const hindiData = await hindiResponse.json();
    expect(hindiData).toHaveProperty('response');
    expect(hindiData.language).toBe('hi');

    // Step 3: Verify context preservation
    const contextResponse = await fetch(
      `${config.apiEndpoint}/session/${testSessionId}/context`,
      {
        headers: { 'x-user-id': testUserId },
      }
    );

    expect(contextResponse.status).toBe(200);
    const contextData = await contextResponse.json();
    expect(contextData.conversationHistory.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Complete User Journey - Mode Switching', () => {
  let testUserId: string;
  let testSessionId: string;
  const config = getTestConfig();

  beforeAll(() => {
    testUserId = generateTestUserId();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should handle mode switching with context preservation', async () => {
    // Step 1: Tutor mode
    const tutorResponse = await fetch(`${config.apiEndpoint}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        query: 'Teach me about binary search',
        mode: 'tutor',
      }),
    });

    expect(tutorResponse.status).toBe(200);
    const tutorData = await tutorResponse.json();
    expect(tutorData.mode).toBe('tutor');

    // Step 2: Switch to interviewer mode
    const interviewerResponse = await fetch(`${config.apiEndpoint}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUserId,
        'x-session-id': testSessionId,
      },
      body: JSON.stringify({
        query: 'Ask me a question about binary search',
        mode: 'interviewer',
      }),
    });

    expect(interviewerResponse.status).toBe(200);
    const interviewerData = await interviewerResponse.json();
    expect(interviewerData.mode).toBe('interviewer');
    expect(interviewerData.response).toContain('?'); // Should ask a question

    // Step 3: Verify context maintained
    const contextResponse = await fetch(
      `${config.apiEndpoint}/session/${testSessionId}/context`,
      {
        headers: { 'x-user-id': testUserId },
      }
    );

    expect(contextResponse.status).toBe(200);
    const contextData = await contextResponse.json();
    expect(contextData.currentTopic).toContain('binary search');
  });
});
