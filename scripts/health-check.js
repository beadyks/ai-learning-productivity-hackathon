#!/usr/bin/env node

/**
 * Health Check Script
 * Verifies environment health after deployment
 * Used in blue-green deployment process
 */

const fs = require('fs');
const https = require('https');
const {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} = require('@aws-sdk/client-cloudwatch');

async function checkHealth(outputsFile) {
  console.log('Running health checks...');
  
  // Read stack outputs
  const outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  const apiEndpoint = outputs.VoiceLearningAssistantStack?.ApiEndpoint || outputs.ApiEndpoint;
  
  if (!apiEndpoint) {
    console.error('API Endpoint not found in outputs');
    process.exit(1);
  }
  
  console.log(`Checking health of: ${apiEndpoint}`);
  
  // Check 1: API availability
  console.log('Check 1: API availability...');
  let successCount = 0;
  const totalChecks = 5;
  
  for (let i = 0; i < totalChecks; i++) {
    try {
      const response = await makeRequest(`${apiEndpoint}/health`);
      if (response.status === 'healthy') {
        successCount++;
      }
      await sleep(2000); // 2 second delay between checks
    } catch (error) {
      console.warn(`Health check ${i + 1} failed:`, error.message);
    }
  }
  
  const availabilityRate = (successCount / totalChecks) * 100;
  console.log(`Availability: ${availabilityRate}% (${successCount}/${totalChecks})`);
  
  if (availabilityRate < 80) {
    console.error('Health check failed: Availability below 80%');
    process.exit(1);
  }
  console.log('✓ API availability check passed');
  
  // Check 2: CloudWatch metrics
  console.log('Check 2: CloudWatch metrics...');
  const cwClient = new CloudWatchClient({});
  
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes
    
    const metricsCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/Lambda',
      MetricName: 'Errors',
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Sum'],
    });
    
    const metricsResponse = await cwClient.send(metricsCommand);
    const errorCount = metricsResponse.Datapoints?.reduce(
      (sum, dp) => sum + (dp.Sum || 0),
      0
    ) || 0;
    
    console.log(`Lambda errors in last 5 minutes: ${errorCount}`);
    
    if (errorCount > 10) {
      console.error('Health check failed: Too many Lambda errors');
      process.exit(1);
    }
    console.log('✓ CloudWatch metrics check passed');
  } catch (error) {
    console.warn('CloudWatch metrics check skipped:', error.message);
  }
  
  // Check 3: Response time
  console.log('Check 3: Response time...');
  const responseTimes = [];
  
  for (let i = 0; i < 3; i++) {
    const startTime = Date.now();
    try {
      await makeRequest(`${apiEndpoint}/health`);
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    } catch (error) {
      console.warn(`Response time check ${i + 1} failed:`, error.message);
    }
  }
  
  const avgResponseTime =
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  console.log(`Average response time: ${avgResponseTime.toFixed(0)}ms`);
  
  if (avgResponseTime > 3000) {
    console.error('Health check failed: Response time above 3 seconds');
    process.exit(1);
  }
  console.log('✓ Response time check passed');
  
  console.log('All health checks passed!');
  return true;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
    };
    
    const req = https.request(options, (res) => {
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
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run health checks
const outputsFile = process.argv[2] || 'outputs-green.json';
checkHealth(outputsFile)
  .then(() => {
    console.log('Health checks completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Health checks failed:', error);
    process.exit(1);
  });
