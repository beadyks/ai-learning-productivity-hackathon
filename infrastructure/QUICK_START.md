# Quick Start Guide

Get the Voice-First AI Learning Assistant infrastructure up and running in minutes.

## Prerequisites

Install these tools before starting:

```bash
# Node.js 18+ (check version)
node --version

# AWS CLI (check version)
aws --version

# Configure AWS credentials
aws configure
```

## 5-Minute Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Deploy Infrastructure

```bash
# Automated deployment (recommended)
./infrastructure/deploy.sh

# Or manual deployment
cdk bootstrap  # First time only
npm run deploy
```

### Step 3: Verify Deployment

```bash
./infrastructure/validate.sh
```

### Step 4: Save Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs' > outputs.json
```

## What Gets Created

### DynamoDB Tables
- `voice-learning-user-profiles` - User data
- `voice-learning-sessions` - Session state (with TTL)
- `voice-learning-progress` - Learning progress

### S3 Buckets
- `voice-learning-documents-{account}` - Document storage
- `voice-learning-documents-logs-{account}` - Access logs

### Cognito
- User Pool for authentication
- User Pool Client for web/mobile apps
- Hosted UI domain

### API Gateway
- HTTP API endpoint (cost-optimized)
- CORS configuration
- Cognito authorizer

### Security
- KMS encryption key (auto-rotation enabled)
- IAM roles and policies
- Encrypted storage

## Next Steps

### 1. Configure Your Application

Use the stack outputs in your application:

```typescript
// Example: Frontend configuration
const config = {
  userPoolId: 'us-east-1_XXXXXXXXX',
  userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
  apiUrl: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com',
  region: 'us-east-1'
};
```

### 2. Test the Infrastructure

```bash
# Run comprehensive tests
./infrastructure/validate.sh

# Monitor costs
./infrastructure/cost-monitor.sh
```

### 3. Deploy Lambda Functions

Proceed to Task 2 in the implementation plan:
- Document processing pipeline
- Voice processing capabilities
- AI response generation
- Study planning system

## Common Commands

```bash
# View stack status
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack

# View stack outputs
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs'

# Update infrastructure
cdk diff    # Preview changes
cdk deploy  # Apply changes

# Delete infrastructure
cdk destroy
```

## Troubleshooting

### Issue: "CDK not found"
```bash
npm install -g aws-cdk
```

### Issue: "AWS credentials not configured"
```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

### Issue: "Stack already exists"
```bash
# Update existing stack
cdk deploy

# Or delete and recreate
cdk destroy
cdk deploy
```

### Issue: "Bucket name already exists"
The bucket name includes your account ID, so this should be unique. If it fails:
1. Check if bucket exists: `aws s3 ls`
2. Delete if needed: `aws s3 rb s3://bucket-name --force`
3. Redeploy: `cdk deploy`

## Cost Monitoring

### View Current Costs
```bash
./infrastructure/cost-monitor.sh
```

### Expected Costs (1,000 students)
- Infrastructure: ~$25/month
- Total with compute: ~$80/month
- Cost per student: ~$0.08/month

### Cost Optimization Tips
- ✓ Using On-Demand DynamoDB (no minimum cost)
- ✓ Using HTTP API (70% cheaper than REST)
- ✓ Using Intelligent-Tiering for S3
- ✓ Using Cognito free tier (50K MAU)
- ✓ Using Lambda ARM64 (20% cheaper)

## Security Checklist

- [x] Encryption at rest (KMS)
- [x] Encryption in transit (HTTPS/TLS)
- [x] Authentication (Cognito)
- [x] Block public access (S3)
- [x] Least privilege IAM
- [ ] Enable MFA (optional)
- [ ] Configure WAF (production)
- [ ] Enable GuardDuty (production)

## Support

### Documentation
- [README](README.md) - Detailed documentation
- [ARCHITECTURE](ARCHITECTURE.md) - Architecture overview
- [DEPLOYMENT_CHECKLIST](DEPLOYMENT_CHECKLIST.md) - Complete checklist
- [TESTING](TESTING.md) - Testing guide

### AWS Resources
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Support](https://console.aws.amazon.com/support/)

### Project Resources
- Requirements: `.kiro/specs/voice-first-ai-learning-assistant/requirements.md`
- Design: `.kiro/specs/voice-first-ai-learning-assistant/design.md`
- Tasks: `.kiro/specs/voice-first-ai-learning-assistant/tasks.md`

## What's Next?

After infrastructure is deployed:

1. **Task 2**: Implement document processing pipeline
2. **Task 3**: Build voice processing capabilities
3. **Task 4**: Implement AI response generation
4. **Task 5**: Create study planning system

Each task builds on the infrastructure you just deployed!

---

**Need Help?** Check the [DEPLOYMENT_CHECKLIST](DEPLOYMENT_CHECKLIST.md) for detailed steps or [TESTING](TESTING.md) for validation procedures.
