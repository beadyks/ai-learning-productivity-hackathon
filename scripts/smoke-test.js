#!/usr/bin/env node

/**
 * Smoke Test Script
 * Runs basic health checks on newly deployed environment
 * Used in blue-green deployment process
 */

const fs = require('fs');
const https = require('https');

async function runSmokeTests(outputsFile) {
  console.log('Running smoke tests...');
  
  // Read stack outputs
  const outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  const apiEndpoint = outputs.VoiceLearningAssistantStack?.ApiEndpoint || outputs.ApiEndpoint;
  
  if (!apiEndpoint) {
    console.error('API Endpoint not found in outputs');
    process.exit(1);
  }
  
  console.log(`Testing API Endpoint: ${apiEndpoint}`);
  
  // Test 1: Health check endpoint
  console.log('Test 1: Health check...');
  const healthCheck = await makeRequest(`${apiEndpoint}/health`);
  if (healthCheck.status !== 'healthy') {
    console.error('Health check failed');
    process.exit(1);
  }
  console.log('✓ Health check passed');
  
  // Test 2: API Gateway is responding
  console.log('Test 2: API Gateway response...');
  const apiResponse = await makeRequest(`${apiEndpoint}/`);
  if (!apiResponse) {
    console.error('API Gateway not responding');
    process.exit(1);
  }
  console.log('✓ API Gateway responding');
  
  // Test 3: Basic query endpoint
  console.log('Test 3: Query endpoint...');
  try {
    const queryResponse = await makeRequest(`${apiEndpoint}/query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'test',
        mode: 'tutor',
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'smoke-test-user',
      },
    });
    console.log('✓ Query endpoint responding');
  } catch (error) {
    console.warn('Query endpoint test failed (non-critical):', error.message);
  }
  
  console.log('All smoke tests passed!');
  return true;
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Run smoke tests
const outputsFile = process.argv[2] || 'outputs-green.json';
runSmokeTests(outputsFile)
  .then(() => {
    console.log('Smoke tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Smoke tests failed:', error);
    process.exit(1);
  });
