# Deployment Guide

Complete guide for deploying the Voice-First AI Learning Assistant using the CI/CD pipeline.

## Overview

The deployment process uses AWS CodePipeline with automated testing and blue-green deployment strategy for production.

## Pipeline Stages

1. **Source** - GitHub webhook triggers on push to main branch
2. **Build** - Compile Lambda functions and infrastructure code
3. **Test** - Run unit tests with coverage reporting
4. **Deploy Staging** - Deploy to staging environment
5. **Integration Test** - Run end-to-end integration tests
6. **Manual Approval** - Require approval before production deployment
7. **Deploy Production** - Blue-green deployment to production

## Prerequisites

### 1. AWS Account Setup

```bash
# Configure AWS credentials
aws configure

# Bootstrap CDK (if not already done)
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 2. GitHub Token

Create a GitHub personal access token with `repo` and `admin:repo_hook` permissions:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with required scopes
3. Store in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-token"
```

### 3. Environment Variables

Create `.env` file:

```bash
GITHUB_OWNER=your-github-username
GITHUB_REPO=voice-learning-assistant
GITHUB_BRANCH=main
NOTIFICATION_EMAIL=your-email@example.com
```

## Initial Deployment

### Step 1: Deploy CI/CD Pipeline

```bash
# Install dependencies
npm install

# Deploy the CI/CD pipeline stack
cdk deploy CICDPipelineStack \
  --context githubOwner=YOUR_GITHUB_USERNAME \
  --context githubRepo=YOUR_REPO_NAME \
  --context githubBranch=main \
  --context notificationEmail=your-email@example.com
```

### Step 2: Verify Pipeline

1. Go to AWS Console → CodePipeline
2. Find "VoiceLearningAssistantPipeline"
3. Verify all stages are created

### Step 3: Trigger First Deployment

```bash
# Push to main branch to trigger pipeline
git add .
git commit -m "Initial deployment"
git push origin main
```

## Pipeline Configuration

### Build Stage

- Installs dependencies
- Compiles TypeScript
- Runs linting
- Creates build artifacts

### Test Stage

- Runs unit tests for all Lambda functions
- Generates coverage reports
- Publishes test results to CodeBuild

### Deploy Staging

- Deploys full stack to staging environment
- Creates/updates all AWS resources
- Outputs stack information

### Integration Test Stage

- Runs end-to-end integration tests
- Tests cross-service communication
- Validates error handling
- Requires staging environment to be healthy

### Manual Approval

- Sends email notification
- Requires manual approval in AWS Console
- Allows review of staging deployment

### Deploy Production (Blue-Green)

1. **Deploy Green** - Creates new production environment
2. **Smoke Tests** - Validates Green environment health
3. **Traffic Swap** - Routes traffic to Green environment
4. **Monitor** - 5-minute monitoring period
5. **Health Check** - Verifies Green environment stability
6. **Cleanup** - Removes old Blue environment

## Blue-Green Deployment

### How It Works

1. Current production is "Blue"
2. New version deploys as "Green"
3. Green is tested and validated
4. Traffic switches from Blue to Green
5. Blue is kept for quick rollback
6. After validation, Blue is removed

### Rollback Process

If issues are detected:

```bash
# Immediate rollback to Blue
node scripts/blue-green-swap.js VoiceLearningAssistantStack-Production --rollback

# Or manually in AWS Console:
# 1. Update Route53 to point back to Blue
# 2. Or update API Gateway stage
```

## Manual Deployment

For manual deployments without pipeline:

### Deploy Staging

```bash
npm run build
cdk deploy VoiceLearningAssistantStack-Staging
```

### Deploy Production

```bash
npm run build
cdk deploy VoiceLearningAssistantStack-Production
```

## Monitoring Deployments

### CloudWatch Logs

```bash
# View pipeline execution logs
aws codepipeline get-pipeline-execution \
  --pipeline-name VoiceLearningAssistantPipeline \
  --pipeline-execution-id EXECUTION_ID
```

### CodeBuild Logs

```bash
# View build logs
aws codebuild batch-get-builds \
  --ids BUILD_ID
```

### Stack Status

```bash
# Check stack deployment status
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack-Staging
```

## Troubleshooting

### Pipeline Fails at Build Stage

- Check buildspec.yml syntax
- Verify Node.js version compatibility
- Check for TypeScript compilation errors

```bash
# Test build locally
npm run build
cd lambda && npm run build
```

### Pipeline Fails at Test Stage

- Review test logs in CodeBuild
- Check test environment variables
- Verify test dependencies installed

```bash
# Run tests locally
cd lambda && npm test
cd tests/integration && npm test
```

### Pipeline Fails at Deploy Stage

- Check CDK synthesis errors
- Verify IAM permissions
- Check CloudFormation events

```bash
# Test CDK synthesis locally
npm run synth
```

### Integration Tests Fail

- Verify staging environment is healthy
- Check Lambda function logs
- Verify DynamoDB tables exist
- Check S3 bucket permissions

```bash
# Check staging stack outputs
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack-Staging \
  --query 'Stacks[0].Outputs'
```

### Blue-Green Deployment Issues

- Check Green environment health
- Verify smoke tests pass
- Review CloudWatch metrics
- Check Route53 configuration

```bash
# Run smoke tests manually
node scripts/smoke-test.js outputs-green.json

# Run health checks manually
node scripts/health-check.js outputs-green.json
```

## Cost Optimization

### Pipeline Costs

- CodePipeline: $1/month per active pipeline
- CodeBuild: $0.005/minute (free tier: 100 minutes/month)
- S3 artifacts: ~$0.50/month
- CloudWatch Logs: ~$0.50/month

**Total: ~$2-5/month**

### Optimization Tips

1. Use CodeBuild cache to speed up builds
2. Run integration tests only on staging
3. Clean up old artifacts automatically (30-day lifecycle)
4. Use small compute instances for builds

## Security Best Practices

1. **Secrets Management**
   - Store GitHub token in Secrets Manager
   - Use IAM roles for service access
   - Rotate tokens regularly

2. **Access Control**
   - Limit pipeline access with IAM policies
   - Require MFA for manual approvals
   - Use least-privilege permissions

3. **Artifact Security**
   - Encrypt artifacts at rest
   - Block public access to artifact bucket
   - Enable versioning for rollback

4. **Audit Logging**
   - Enable CloudTrail for pipeline actions
   - Monitor CodeBuild logs
   - Set up CloudWatch alarms

## Maintenance

### Update Pipeline

```bash
# Modify pipeline stack
vim infrastructure/stacks/cicd-pipeline-stack.ts

# Deploy changes
cdk deploy CICDPipelineStack
```

### Update Buildspec

```bash
# Modify buildspec files
vim buildspec.yml
vim buildspec-test.yml
vim buildspec-deploy.yml

# Commit and push (pipeline will use new buildspec)
git add buildspec*.yml
git commit -m "Update buildspec"
git push
```

### Clean Up

```bash
# Delete pipeline stack
cdk destroy CICDPipelineStack

# Delete application stacks
cdk destroy VoiceLearningAssistantStack-Staging
cdk destroy VoiceLearningAssistantStack-Production
```

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review CodeBuild execution logs
3. Check CloudFormation events
4. Contact DevOps team

## References

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Blue-Green Deployment Guide](https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/)
