# Architecture Documentation

## Overview

The Voice-First AI Learning Assistant uses a serverless, ultra-low-cost architecture on AWS, designed to serve Indian students at ₹49-99/month while maintaining operational costs of only ₹8-15 per student per month.

## Architecture Principles

### 1. Cost Optimization First
- **Target**: 98% cost reduction from traditional architecture
- **Strategy**: Use free tiers, open-source alternatives, and cost-optimized services
- **Result**: $0.08/student/month operational cost

### 2. Serverless Architecture
- **No servers to manage**: All compute is serverless (Lambda, API Gateway)
- **Auto-scaling**: Automatically handles traffic spikes
- **Pay-per-use**: Only pay for actual usage

### 3. Security by Design
- **Encryption at rest**: All data encrypted with KMS
- **Encryption in transit**: HTTPS/TLS for all communications
- **Authentication**: Cognito User Pool with OAuth 2.0
- **Least privilege**: Minimal IAM permissions

### 4. High Availability
- **Multi-AZ**: All services are multi-AZ by default
- **No single point of failure**: Distributed architecture
- **Automatic failover**: Built into AWS services

## Core Components

### 1. API Layer

#### HTTP API Gateway
- **Service**: Amazon API Gateway (HTTP API)
- **Cost**: $1.00 per million requests (70% cheaper than REST API)
- **Features**:
  - CORS pre-flight configuration
  - Cognito authorizer integration
  - Auto-scaling
  - Request/response transformation
- **Endpoints**: All API routes go through this gateway

#### Cognito User Pool
- **Service**: Amazon Cognito
- **Cost**: FREE for first 50,000 MAU
- **Features**:
  - User registration and authentication
  - OAuth 2.0 support
  - Custom attributes (language, skill level, subscription)
  - Email verification
  - Password recovery
  - Hosted UI

### 2. Compute Layer

#### Lambda Functions (Future)
- **Service**: AWS Lambda (ARM64)
- **Cost**: 20% cheaper than x86, FREE tier: 1M requests/month
- **Configuration**:
  - Runtime: Node.js 18+ or Python 3.11
  - Architecture: ARM64 (Graviton2)
  - Memory: Optimized per function
  - Timeout: Function-specific
- **Functions** (to be implemented):
  - Document processing
  - Voice processing orchestration
  - AI response generation
  - Study plan generation
  - Session management

### 3. Data Layer

#### DynamoDB Tables

**User Profiles Table**
- **Partition Key**: userId (String)
- **Billing**: On-Demand (pay per request)
- **Encryption**: Customer-managed KMS key
- **Features**:
  - Point-in-time recovery
  - Global Secondary Index on email
- **Data**: User profile, preferences, settings

**Sessions Table**
- **Partition Key**: sessionId (String)
- **Sort Key**: timestamp (Number)
- **Billing**: On-Demand
- **Encryption**: Customer-managed KMS key
- **Features**:
  - TTL enabled (auto-delete after 30 days)
  - Global Secondary Index on userId + timestamp
- **Data**: Session state, conversation history, context

**Progress Table**
- **Partition Key**: userId (String)
- **Sort Key**: topicId (String)
- **Billing**: On-Demand
- **Encryption**: Customer-managed KMS key
- **Features**:
  - Point-in-time recovery
  - Global Secondary Index on topicId + lastUpdated
- **Data**: Learning progress, completion status, metrics

#### S3 Document Storage
- **Bucket**: voice-learning-documents-{account-id}
- **Encryption**: KMS (customer-managed key)
- **Features**:
  - Versioning enabled
  - Intelligent-Tiering (automatic cost optimization)
  - Lifecycle policies (move to Glacier after 90 days)
  - CORS configuration for web uploads
  - Server access logging
- **Data**: User-uploaded documents (PDF, DOC, images)

### 4. Security Layer

#### KMS Encryption Key
- **Service**: AWS Key Management Service
- **Features**:
  - Customer-managed key
  - Automatic key rotation
  - Used for DynamoDB and S3 encryption
- **Cost**: ~$1/month

#### IAM Roles and Policies
- **Principle**: Least privilege access
- **Roles** (to be created):
  - Lambda execution roles
  - API Gateway invocation roles
  - Service-to-service access roles

## Data Flow

### 1. User Authentication Flow
```
User → API Gateway → Cognito Authorizer → Verify Token → Allow/Deny
```

### 2. Document Upload Flow (Future)
```
User → API Gateway → Lambda (Upload Handler) → S3 (Encrypted Storage)
                                             → DynamoDB (Metadata)
```

### 3. Query Processing Flow (Future)
```
User → API Gateway → Lambda (Query Handler) → DynamoDB (Context)
                                            → Bedrock (AI Response)
                                            → Return Response
```

### 4. Session Management Flow (Future)
```
User → API Gateway → Lambda (Session Handler) → DynamoDB (Save/Restore)
                                               → Return Session State
```

## Cost Breakdown

### Infrastructure Costs (Per 1,000 Students/Month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| DynamoDB | On-Demand, 3 tables | $5 |
| S3 | Intelligent-Tiering, 10GB | $6 |
| API Gateway | HTTP API, 1M requests | $10 |
| Cognito | 1,000 MAU | $0 (free tier) |
| KMS | 1 key | $1 |
| CloudWatch | Basic metrics | $3 |
| **Total** | | **$25** |

### Additional Costs (To Be Added)
- Lambda compute: ~$20/month
- Bedrock AI: ~$30/month (with caching)
- EC2 Spot (Chroma DB): ~$5/month
- **Grand Total**: ~$80/month for 1,000 students

### Cost Per Student
- **Operational Cost**: $0.08/month (₹8/month)
- **Revenue (Basic Plan)**: $0.60/month (₹49/month)
- **Profit Margin**: 87%

## Scalability

### Horizontal Scaling
- **DynamoDB**: Auto-scales with on-demand billing
- **S3**: Unlimited storage capacity
- **API Gateway**: Auto-scales to handle traffic
- **Lambda**: Concurrent execution up to account limits
- **Cognito**: Supports millions of users

### Performance Targets
- **API Response Time**: < 3 seconds (Requirement 11.1)
- **Document Processing**: < 5 minutes for large documents
- **Voice Processing**: Real-time (browser-based)
- **AI Response**: < 2 seconds (with caching)

### Capacity Planning
- **1,000 students**: Current infrastructure sufficient
- **10,000 students**: No changes needed (serverless auto-scales)
- **100,000 students**: May need Reserved Capacity for DynamoDB
- **1,000,000 students**: Consider multi-region deployment

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- HTTPS/TLS for all communications
- API Gateway with CORS restrictions
- No public access to data stores

**Layer 2: Authentication**
- Cognito User Pool with OAuth 2.0
- JWT tokens for API access
- MFA support (optional)

**Layer 3: Authorization**
- IAM roles with least privilege
- Resource-based policies
- API Gateway authorizers

**Layer 4: Data Protection**
- KMS encryption at rest
- TLS encryption in transit
- S3 bucket policies
- DynamoDB encryption

**Layer 5: Monitoring**
- CloudWatch logs and metrics
- CloudTrail for audit logging
- AWS Config for compliance
- GuardDuty for threat detection (optional)

### Compliance

**Data Protection**
- Encryption at rest and in transit
- Secure deletion capabilities
- Data retention policies
- User consent management

**Privacy**
- User data isolation
- Access controls
- Audit logging
- GDPR-ready architecture

## Disaster Recovery

### Backup Strategy

**DynamoDB**
- Point-in-time recovery enabled
- Continuous backups
- 35-day retention
- Cross-region replication (optional)

**S3**
- Versioning enabled
- Cross-region replication (optional)
- Lifecycle policies for archival
- Glacier for long-term storage

**Cognito**
- User pool export capability
- Backup user data to S3
- Regular exports recommended

### Recovery Procedures

**RTO (Recovery Time Objective)**: < 4 hours
**RPO (Recovery Point Objective)**: < 1 hour

**Disaster Scenarios**:
1. **Region failure**: Deploy to new region from backup
2. **Data corruption**: Restore from point-in-time backup
3. **Accidental deletion**: Restore from S3 versioning
4. **Security breach**: Rotate keys, audit access, restore clean data

## Monitoring and Observability

### CloudWatch Metrics

**DynamoDB**
- Read/Write capacity units
- Throttled requests
- System errors
- Latency

**S3**
- Bucket size
- Number of objects
- Request metrics
- Error rates

**API Gateway**
- Request count
- Latency
- 4xx/5xx errors
- Integration latency

**Lambda** (Future)
- Invocations
- Duration
- Errors
- Throttles
- Concurrent executions

### Alarms

**Critical Alarms**
- DynamoDB throttling > 10 requests/5min
- API Gateway 5xx errors > 1%
- Lambda errors > 5%
- Cost exceeds budget

**Warning Alarms**
- API Gateway 4xx errors > 5%
- Lambda duration > 80% of timeout
- S3 bucket size > 80% of quota

### Logging

**CloudWatch Logs**
- API Gateway access logs
- Lambda function logs
- Application logs

**CloudTrail**
- API calls audit
- Resource changes
- Security events

## Future Enhancements

### Phase 2: Compute Layer
- Implement Lambda functions for all services
- Add Step Functions for workflow orchestration
- Implement SQS for async processing

### Phase 3: AI/ML Layer
- Integrate Amazon Bedrock (Haiku + Sonnet)
- Add response caching layer (Redis/ElastiCache)
- Implement vector search (Chroma on EC2 Spot)

### Phase 4: Advanced Features
- Multi-region deployment
- CDN with CloudFront
- Real-time features with WebSocket
- Advanced analytics with Athena

### Phase 5: Optimization
- Reserved Capacity for predictable workloads
- Savings Plans for compute
- Advanced caching strategies
- Performance tuning

## References

### AWS Documentation
- [AWS CDK](https://docs.aws.amazon.com/cdk/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [S3](https://docs.aws.amazon.com/s3/)
- [Cognito](https://docs.aws.amazon.com/cognito/)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [Lambda](https://docs.aws.amazon.com/lambda/)

### Best Practices
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Serverless Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

### Project Documentation
- [README](README.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Testing Guide](TESTING.md)
- [Requirements](../.kiro/specs/voice-first-ai-learning-assistant/requirements.md)
- [Design](../.kiro/specs/voice-first-ai-learning-assistant/design.md)
