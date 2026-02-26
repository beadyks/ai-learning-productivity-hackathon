# CI/CD Pipeline Documentation

Complete documentation for the Voice-First AI Learning Assistant CI/CD pipeline.

## Overview

Two CI/CD options are available:

1. **AWS CodePipeline** (Recommended for AWS-native deployments)
2. **GitHub Actions** (Alternative for GitHub-centric workflows)

Both support:
- Automated testing
- Staging deployments
- Integration testing
- Blue-green production deployments
- Manual approval gates

## AWS CodePipeline Setup

### Architecture

```
GitHub → CodePipeline → CodeBuild → Staging → Integration Tests → Approval → Production
```

### Quick Start

```bash
# Run setup script
chmod +x scripts/setup-pipeline.sh
./scripts/setup-pipeline.sh
```

### Manual Setup

1. **Store GitHub Token**
```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-token"
```

2. **Deploy Pipeline**
```bash
npm install
npm run build
npm run deploy:pipeline
```

3. **Trigger Pipeline**
```bash
git push origin main
```

### Pipeline Stages

#### 1. Source Stage
- Monitors GitHub repository
- Triggers on push to main branch
- Uses webhook for instant triggering

#### 2. Build Stage
- Installs dependencies
- Compiles TypeScript
- Runs linting
- Builds Lambda functions
- Creates artifacts

**BuildSpec**: `buildspec.yml`

#### 3. Test Stage
- Runs unit tests
- Generates coverage reports
- Publishes test results

**BuildSpec**: `buildspec-test.yml`

#### 4. Deploy Staging
- Deploys to staging environment
- Creates all AWS resources
- Outputs stack information

#### 5. Integration Test
- Runs end-to-end tests
- Tests cross-service communication
- Validates error handling

#### 6. Manual Approval
- Sends email notification
- Requires manual approval
- Allows staging review

#### 7. Deploy Production
- Blue-green deployment
- Smoke tests
- Traffic swap
- Health monitoring
- Cleanup

**BuildSpec**: `buildspec-deploy.yml`

### Cost

- Pipeline: $1/month
- CodeBuild: ~$2-3/month
- S3 artifacts: ~$0.50/month
- **Total: ~$3-5/month**

## GitHub Actions Setup

### Architecture

```
GitHub Push → Build → Test → Deploy Staging → Integration Tests → Deploy Production
```

### Quick Start

1. **Add GitHub Secrets**

Go to Repository Settings → Secrets and add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

2. **Push to Trigger**
```bash
git push origin main
```

### Workflow Jobs

#### 1. Build and Test
- Checkout code
- Install dependencies
- Run linting
- Build project
- Run unit tests
- Upload coverage

#### 2. Deploy Staging
- Download artifacts
- Configure AWS credentials
- Deploy to staging
- Output API endpoint

#### 3. Integration Tests
- Download staging outputs
- Run integration tests
- Upload test results

#### 4. Deploy Production
- Deploy green environment
- Run smoke tests
- Run health checks
- Notify on completion

### Cost

- GitHub Actions: Free for public repos
- 2,000 minutes/month for private repos
- **Total: $0 (public) or included in GitHub plan**

## Blue-Green Deployment

### Process

1. **Deploy Green**
   - New version deployed alongside Blue
   - Independent environment
   - No impact on production traffic

2. **Smoke Tests**
   - Basic health checks
   - API availability
   - Critical endpoints

3. **Traffic Swap**
   - Route53 or API Gateway update
   - Gradual or instant switch
   - Blue kept for rollback

4. **Monitor**
   - 5-minute observation period
   - CloudWatch metrics
   - Error rate monitoring

5. **Health Check**
   - Comprehensive validation
   - Response time checks
   - Error rate verification

6. **Cleanup**
   - Remove Blue environment
   - Free up resources
   - Green becomes new Blue

### Rollback

Instant rollback to Blue if issues detected:

```bash
# Automatic rollback on health check failure
# Or manual rollback:
node scripts/blue-green-swap.js VoiceLearningAssistantStack-Production --rollback
```

## Testing Strategy

### Unit Tests

**Location**: `lambda/*/tests/`

**Run**: `cd lambda && npm test`

**Coverage**: Minimum 70% required

### Integration Tests

**Location**: `tests/integration/`

**Run**: `cd tests/integration && npm test`

**Suites**:
- User journey tests
- Cross-service tests
- Error handling tests

### Smoke Tests

**Location**: `scripts/smoke-test.js`

**Run**: `node scripts/smoke-test.js outputs.json`

**Checks**:
- API health endpoint
- Basic query functionality
- Service availability

### Health Checks

**Location**: `scripts/health-check.js`

**Run**: `node scripts/health-check.js outputs.json`

**Checks**:
- API availability (80%+ success rate)
- CloudWatch metrics (error count)
- Response time (<3 seconds)

## Environment Management

### Staging Environment

**Purpose**: Pre-production testing

**Stack**: `VoiceLearningAssistantStack-Staging`

**Features**:
- Identical to production
- Lower resource limits
- Test data only

**Access**:
```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack-Staging
```

### Production Environment

**Purpose**: Live user traffic

**Stack**: `VoiceLearningAssistantStack-Production`

**Features**:
- Blue-green deployment
- High availability
- Auto-scaling
- Monitoring

**Access**:
```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack-Production
```

## Monitoring and Alerts

### CloudWatch Dashboards

- Pipeline execution metrics
- Build success/failure rates
- Deployment duration
- Test results

### Alarms

- Build failures
- Test failures
- Deployment failures
- Health check failures

### Notifications

- Email notifications via SNS
- Pipeline state changes
- Manual approval requests
- Deployment completions

## Security

### Secrets Management

- GitHub token in Secrets Manager
- AWS credentials in GitHub Secrets
- No secrets in code
- Automatic rotation recommended

### IAM Permissions

**CodeBuild Role**:
- Lambda deployment
- CloudFormation access
- S3 artifact access
- CloudWatch logging

**Pipeline Role**:
- CodeBuild invocation
- S3 artifact management
- CloudFormation access

### Artifact Security

- Encrypted at rest
- Private S3 bucket
- 30-day retention
- Versioning enabled

## Troubleshooting

### Build Failures

**Symptoms**: Build stage fails

**Solutions**:
1. Check buildspec.yml syntax
2. Verify Node.js version
3. Check TypeScript errors
4. Review CodeBuild logs

```bash
# Test locally
npm run build
cd lambda && npm run build
```

### Test Failures

**Symptoms**: Test stage fails

**Solutions**:
1. Review test logs
2. Check test environment
3. Verify dependencies
4. Run tests locally

```bash
# Run locally
cd lambda && npm test
cd tests/integration && npm test
```

### Deployment Failures

**Symptoms**: Deploy stage fails

**Solutions**:
1. Check CloudFormation events
2. Verify IAM permissions
3. Check resource limits
4. Review stack outputs

```bash
# Check stack status
aws cloudformation describe-stack-events \
  --stack-name VoiceLearningAssistantStack-Staging
```

### Integration Test Failures

**Symptoms**: Integration tests fail

**Solutions**:
1. Verify staging is healthy
2. Check Lambda logs
3. Verify DynamoDB tables
4. Check API Gateway

```bash
# Check staging health
curl https://staging-api-endpoint/health
```

### Blue-Green Issues

**Symptoms**: Production deployment fails

**Solutions**:
1. Check Green health
2. Verify smoke tests
3. Review metrics
4. Manual rollback if needed

```bash
# Manual rollback
node scripts/blue-green-swap.js \
  VoiceLearningAssistantStack-Production \
  --rollback
```

## Best Practices

### Code Quality

1. Run linting before commit
2. Write unit tests for new code
3. Maintain >70% coverage
4. Use TypeScript strict mode

### Deployment

1. Always deploy to staging first
2. Run integration tests
3. Review staging before production
4. Use blue-green for production

### Monitoring

1. Check CloudWatch after deployment
2. Monitor error rates
3. Review response times
4. Set up alarms

### Security

1. Rotate secrets regularly
2. Use least-privilege IAM
3. Enable CloudTrail
4. Review access logs

## Maintenance

### Update Pipeline

```bash
# Modify pipeline code
vim infrastructure/stacks/cicd-pipeline-stack.ts

# Deploy changes
npm run deploy:pipeline
```

### Update Buildspec

```bash
# Modify buildspec
vim buildspec.yml

# Commit and push (auto-updates)
git add buildspec.yml
git commit -m "Update buildspec"
git push
```

### Clean Up

```bash
# Delete pipeline
cdk destroy CICDPipelineStack

# Delete environments
cdk destroy VoiceLearningAssistantStack-Staging
cdk destroy VoiceLearningAssistantStack-Production
```

## References

- [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild](https://docs.aws.amazon.com/codebuild/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Blue-Green Deployments](https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/)

## Support

For issues:
1. Check pipeline logs
2. Review CloudWatch
3. Check CloudFormation events
4. Contact DevOps team
