# Performance Monitoring and Optimization

This module provides comprehensive performance monitoring and optimization capabilities for the Voice-First AI Learning Assistant.

## Requirements

- **11.1**: Response times under 3 seconds
- **11.2**: Auto-scaling for concurrent users
- **11.3**: Performance monitoring and metrics
- **11.4**: Memory and timeout optimization
- **11.5**: Cost optimization strategies

## Components

### 1. CloudWatch Metrics (`cloudwatch-metrics/`)

Centralized performance monitoring with custom CloudWatch metrics:

- **Response Time Tracking**: Monitor function execution times
- **Error Rate Monitoring**: Track errors by function and type
- **Cache Hit Rate**: Monitor caching effectiveness (target: 60%)
- **Cost Tracking**: Per-student cost monitoring (target: ₹8-15/month)
- **User Metrics**: Study time, document count, query count
- **Scaling Metrics**: Concurrent users, active connections, queue depth

**Usage:**
```typescript
import { trackResponseTime, trackCostMetrics } from './cloudwatch-metrics';

// Track response time
await trackResponseTime({
  responseTime: 1500,
  functionName: 'voice-learning-response-generator',
  userId: 'user123',
  statusCode: 200,
  cacheHit: true,
  cost: 0.0001,
});

// Track cost metrics
await trackCostMetrics('user123', 0.05, 0.02, 0.01);
```

### 2. CloudWatch Alarms (`cloudwatch-alarms/`)

Automated alerting for performance and cost issues:

- **High Response Time**: Alert when > 3 seconds
- **High Error Rate**: Alert when > 5%
- **Low Cache Hit Rate**: Alert when < 40%
- **High Cost**: Alert when > ₹15/student/month
- **Lambda Throttling**: Alert on function throttles
- **DynamoDB Throttling**: Alert on table throttles

**Usage:**
```typescript
import { createPerformanceAlarms, createDynamoDBAlarms } from './cloudwatch-alarms';

// Create alarms for Lambda functions
await createPerformanceAlarms(snsTopicArn, [
  'voice-learning-response-generator',
  'voice-learning-semantic-search',
]);

// Create alarms for DynamoDB tables
await createDynamoDBAlarms(snsTopicArn, [
  'voice-learning-sessions',
  'voice-learning-embeddings',
]);
```

### 3. Auto-Scaling (`auto-scaling/`)

Automatic resource scaling based on load:

- **Lambda Concurrency**: Reserved concurrency for critical functions
- **DynamoDB Capacity**: Auto-scaling for provisioned tables (on-demand by default)
- **Target Tracking**: Scale based on utilization metrics

**Usage:**
```typescript
import { configureAutoScaling, configureLambdaConcurrency } from './auto-scaling';

// Configure auto-scaling for all resources
await configureAutoScaling(
  ['voice-learning-response-generator', 'voice-learning-semantic-search'],
  ['voice-learning-sessions', 'voice-learning-embeddings']
);

// Set specific concurrency for a function
await configureLambdaConcurrency('voice-learning-response-generator', 100);
```

### 4. Lambda Optimizer (`lambda-optimizer/`)

Intelligent memory and timeout optimization:

- **Performance Analysis**: Analyze function metrics over time
- **Cost Optimization**: Recommend optimal memory/timeout settings
- **Automatic Application**: Apply optimizations automatically
- **Cost Savings Estimation**: Calculate potential savings

**Usage:**
```typescript
import { analyzeFunction, optimizeAllFunctions } from './lambda-optimizer';

// Analyze a single function
const recommendation = await analyzeFunction('voice-learning-response-generator');
console.log(recommendation);
// {
//   functionName: 'voice-learning-response-generator',
//   currentMemory: 1024,
//   recommendedMemory: 768,
//   currentTimeout: 30,
//   recommendedTimeout: 20,
//   estimatedCostSavings: 0.05,
//   reason: 'Function completes quickly; reducing memory may save costs'
// }

// Optimize all functions
const recommendations = await optimizeAllFunctions(
  ['voice-learning-response-generator', 'voice-learning-semantic-search'],
  true // auto-apply optimizations
);
```

### 5. Connection Pool (`connection-pool/`)

Connection pooling and caching for performance:

- **Client Reuse**: Reuse AWS SDK clients across invocations
- **Response Caching**: In-memory cache with TTL
- **Cache Key Generation**: Automatic cache key generation
- **Cold Start Mitigation**: Pre-initialize clients

**Usage:**
```typescript
import {
  getDynamoDBClient,
  getBedrockClient,
  cacheResponse,
  getCachedResponse,
  withConnectionPool,
} from './connection-pool';

// Use pooled clients
const dynamoDB = getDynamoDBClient();
const bedrock = getBedrockClient();

// Cache responses
const cacheKey = 'user:123:query:hello';
cacheResponse(cacheKey, { response: 'Hello!' }, 3600); // 1 hour TTL

// Get cached response
const cached = getCachedResponse(cacheKey);

// Wrap handler with connection pooling
export const handler = withConnectionPool(async (event) => {
  const dynamoDB = getDynamoDBClient();
  // Use client...
});
```

### 6. Cold Start Mitigation (`cold-start-mitigation/`)

Strategies to reduce Lambda cold starts:

- **Provisioned Concurrency**: Keep functions warm (for critical functions)
- **Periodic Warm-up**: EventBridge scheduled warm-up (cost-effective)
- **Code Optimization**: Bundling and initialization tips
- **Strategy Recommendations**: Automatic strategy selection by function type

**Usage:**
```typescript
import {
  applyColdStartMitigation,
  getRecommendedStrategy,
  createWarmUpSchedule,
} from './cold-start-mitigation';

// Apply mitigation to all functions
await applyColdStartMitigation([
  { name: 'voice-learning-response-generator', type: 'critical' },
  { name: 'voice-learning-semantic-search', type: 'standard' },
  { name: 'voice-learning-content-chunking', type: 'batch' },
]);

// Get recommended strategy
const strategy = getRecommendedStrategy('critical');
// {
//   strategy: 'provisioned-concurrency',
//   provisionedConcurrency: 2,
//   description: 'Critical functions should use provisioned concurrency...'
// }

// Create warm-up schedule
await createWarmUpSchedule({
  functionName: 'voice-learning-response-generator',
  scheduleExpression: 'rate(5 minutes)',
  enabled: true,
});
```

## Performance Targets

### Response Times (Requirement 11.1)
- **Target**: < 3 seconds for all API endpoints
- **Monitoring**: CloudWatch metrics with alarms
- **Optimization**: Memory tuning, caching, connection pooling

### Scalability (Requirement 11.2)
- **Target**: Support 10,000+ concurrent users
- **Strategy**: Auto-scaling Lambda concurrency, DynamoDB on-demand
- **Monitoring**: Concurrent users, queue depth metrics

### Cost Optimization (Requirements 11.4, 11.5)
- **Target**: ₹8-15 per student per month
- **Strategies**:
  - ARM64 Lambda (20% cheaper)
  - Response caching (60% cache hit rate)
  - Memory optimization
  - Connection pooling
  - Cold start mitigation

## Deployment

### 1. Deploy Performance Monitoring Functions

```bash
# Deploy CloudWatch metrics function
cd cloudwatch-metrics
npm install
npm run build

# Deploy CloudWatch alarms function
cd ../cloudwatch-alarms
npm install
npm run build

# Deploy auto-scaling function
cd ../auto-scaling
npm install
npm run build

# Deploy Lambda optimizer
cd ../lambda-optimizer
npm install
npm run build

# Deploy cold start mitigation
cd ../cold-start-mitigation
npm install
npm run build
```

### 2. Configure Monitoring

```bash
# Set up alarms (replace with your email)
curl -X POST https://your-api.execute-api.region.amazonaws.com/alarms \
  -H "Content-Type: application/json" \
  -d '{
    "action": "setup",
    "email": "alerts@example.com",
    "functionNames": [
      "voice-learning-response-generator",
      "voice-learning-semantic-search"
    ],
    "tableNames": [
      "voice-learning-sessions",
      "voice-learning-embeddings"
    ]
  }'
```

### 3. Configure Auto-Scaling

```bash
# Configure auto-scaling for all resources
curl -X POST https://your-api.execute-api.region.amazonaws.com/auto-scaling \
  -H "Content-Type: application/json" \
  -d '{
    "action": "configure",
    "lambdaFunctions": [
      "voice-learning-response-generator",
      "voice-learning-semantic-search"
    ],
    "dynamoDBTables": [
      "voice-learning-sessions",
      "voice-learning-embeddings"
    ]
  }'
```

### 4. Optimize Lambda Functions

```bash
# Analyze and optimize all functions
curl -X POST https://your-api.execute-api.region.amazonaws.com/optimizer \
  -H "Content-Type: application/json" \
  -d '{
    "action": "optimizeAll",
    "functionNames": [
      "voice-learning-response-generator",
      "voice-learning-semantic-search"
    ],
    "autoApply": true
  }'
```

### 5. Apply Cold Start Mitigation

```bash
# Apply cold start mitigation strategies
curl -X POST https://your-api.execute-api.region.amazonaws.com/cold-start \
  -H "Content-Type: application/json" \
  -d '{
    "action": "applyAll",
    "functions": [
      { "name": "voice-learning-response-generator", "type": "critical" },
      { "name": "voice-learning-semantic-search", "type": "standard" },
      { "name": "voice-learning-content-chunking", "type": "batch" }
    ]
  }'
```

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Response Time**
   - Average: < 1.5 seconds
   - P95: < 3 seconds
   - P99: < 5 seconds

2. **Error Rate**
   - Target: < 1%
   - Alert: > 5%

3. **Cache Hit Rate**
   - Target: 60%
   - Alert: < 40%

4. **Cost per Student**
   - Target: ₹8-15/month
   - Alert: > ₹15/month

5. **Concurrent Users**
   - Monitor: Real-time
   - Scale trigger: > 1,000 users

6. **Lambda Throttles**
   - Target: 0
   - Alert: > 10 per minute

## Best Practices

### 1. Connection Pooling
- Always use `getDynamoDBClient()` instead of creating new clients
- Reuse clients across Lambda invocations
- Pre-initialize clients on cold start

### 2. Caching
- Cache AI responses for 24 hours (60% hit rate target)
- Cache embeddings to avoid regeneration
- Use cache key generation for consistency

### 3. Memory Optimization
- Run optimizer weekly to adjust memory settings
- Monitor cost savings from optimizations
- Balance memory vs. execution time

### 4. Cold Start Mitigation
- Use provisioned concurrency for critical functions only
- Use periodic warm-up for standard functions
- Accept cold starts for batch processing

### 5. Cost Monitoring
- Track cost per student daily
- Alert when exceeding ₹15/month
- Optimize high-cost functions first

## Troubleshooting

### High Response Times
1. Check Lambda memory allocation
2. Verify cache hit rate
3. Check for DynamoDB throttling
4. Review connection pooling usage

### High Costs
1. Check AI API usage (should be 95% Haiku)
2. Verify cache hit rate (target: 60%)
3. Review Lambda memory settings
4. Check for unnecessary provisioned concurrency

### Cold Starts
1. Verify warm-up schedules are enabled
2. Check provisioned concurrency configuration
3. Review code bundling and initialization
4. Consider increasing memory for faster cold starts

## Integration with Existing Code

To integrate performance monitoring into existing Lambda functions:

```typescript
import { withConnectionPool, getDynamoDBClient } from './connection-pool';
import { trackResponseTime } from './cloudwatch-metrics';

export const handler = withConnectionPool(async (event) => {
  const startTime = Date.now();
  
  try {
    // Use pooled client
    const dynamoDB = getDynamoDBClient();
    
    // Your function logic here
    const result = await processRequest(event);
    
    // Track metrics
    await trackResponseTime({
      responseTime: Date.now() - startTime,
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
      statusCode: 200,
      cacheHit: false,
    });
    
    return result;
  } catch (error) {
    // Track error metrics
    await trackResponseTime({
      responseTime: Date.now() - startTime,
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
      statusCode: 500,
      errorType: error.name,
    });
    
    throw error;
  }
});
```

## Cost Analysis

### Monthly Costs (1,000 students)

| Component | Cost |
|-----------|------|
| CloudWatch Metrics | $3 |
| CloudWatch Alarms | $1 |
| Lambda Execution | $20 |
| DynamoDB | $5 |
| S3 Storage | $6 |
| AI/ML (Bedrock) | $30 |
| **Total** | **$65** |

**Cost per student**: $0.065/month (₹5.40/month)

### Optimization Impact

- **Without optimization**: $150/month (₹12,450/month)
- **With optimization**: $65/month (₹5,395/month)
- **Savings**: 57% reduction

## Support

For issues or questions:
1. Check CloudWatch Logs for error details
2. Review CloudWatch Metrics dashboard
3. Check alarm notifications
4. Run optimizer for recommendations
