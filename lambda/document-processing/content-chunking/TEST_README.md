# Content Indexing Property Tests

## Overview

This directory contains property-based tests for the content indexing functionality of the Voice-First AI Learning Assistant. The tests validate Requirements 1.2 (content chunking) and 1.3 (embedding generation and indexing).

## Test Coverage

### Property 1: Cross-Document Search Capabilities
**Feature:** voice-first-ai-learning-assistant, Property 1: Document Processing Completeness  
**Validates:** Requirements 1.2, 1.3

Tests that:
- All uploaded documents are successfully chunked
- Content is embedded and indexed
- Content is searchable across multiple documents
- Search results span multiple documents correctly

### Property 2: Metadata Preservation
**Feature:** voice-first-ai-learning-assistant, Property 1: Document Processing Completeness  
**Validates:** Requirements 1.2, 1.3

Tests that:
- Document metadata (subject, type, language, etc.) is preserved through chunking
- Metadata is correctly associated with indexed chunks
- Chunk position and boundaries are maintained

### Property 3: Chunk Completeness
**Feature:** voice-first-ai-learning-assistant, Property 1: Document Processing Completeness  
**Validates:** Requirements 1.2

Tests that:
- No content is lost during chunking
- All significant words from original document appear in chunks
- 95%+ content preservation rate is maintained

### Property 4: Embedding Consistency
**Feature:** voice-first-ai-learning-assistant, Property 1: Document Processing Completeness  
**Validates:** Requirements 1.3

Tests that:
- Embeddings are generated for all chunks
- Embeddings have correct dimensions (1536 for Titan)
- Embeddings are deterministic (same input = same output)
- All embedding values are valid numbers

## Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### Dependencies
- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `fast-check`: Property-based testing library
- `@types/jest`: TypeScript types for Jest

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run specific test suite
```bash
npm test -- --testNamePattern="Cross-Document Search"
```

## Test Configuration

- **Test Iterations:** 100 runs per property test (as specified in design document)
- **Test Timeout:** 30 seconds (to accommodate property test iterations)
- **Test Environment:** Node.js

## Property-Based Testing Approach

These tests use `fast-check` to generate random test data and verify that properties hold across all inputs. Each test:

1. Generates random documents with varying:
   - Text content (using lorem ipsum)
   - Metadata (subject, type, language)
   - Document IDs and user IDs

2. Processes the documents through:
   - Text chunking
   - Embedding generation
   - Content indexing

3. Verifies properties such as:
   - All content is indexed
   - Metadata is preserved
   - Content is searchable
   - No data loss occurs

## Mock Implementation

The tests use mock implementations for:
- **AWS SDK clients:** S3, Bedrock, DynamoDB
- **Embedding generation:** Deterministic mock based on text content
- **Content index:** In-memory storage for testing

This allows tests to run quickly without AWS dependencies while still validating the core logic.

## Expected Results

All tests should pass with 100 iterations each. If any test fails:

1. Check the failing input (fast-check will shrink it to minimal case)
2. Verify the property being tested
3. Check if the implementation needs adjustment
4. Consider if the property definition needs refinement

## Integration with CI/CD

These tests should be run:
- On every commit (pre-commit hook)
- In CI/CD pipeline before deployment
- As part of the deployment validation

## Troubleshooting

### Tests timeout
- Increase `testTimeout` in jest.config.js
- Reduce `numRuns` temporarily for debugging

### Mock issues
- Ensure AWS SDK mocks are properly configured
- Check that mock implementations match real behavior

### Property violations
- Review the shrunk counterexample from fast-check
- Verify the property definition is correct
- Check if edge cases need special handling

## Future Enhancements

1. Add integration tests with real AWS services (using LocalStack)
2. Add performance benchmarks for chunking and indexing
3. Add tests for multilingual content (Hindi, Hinglish)
4. Add tests for different document formats (PDF, DOC, images)
5. Add tests for error handling and edge cases

## References

- Design Document: `.kiro/specs/voice-first-ai-learning-assistant/design.md`
- Requirements: `.kiro/specs/voice-first-ai-learning-assistant/requirements.md`
- fast-check Documentation: https://fast-check.dev/
- Jest Documentation: https://jestjs.io/
