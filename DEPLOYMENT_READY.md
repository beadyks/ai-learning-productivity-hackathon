# 🚀 Deployment Ready - Voice-First AI Learning Assistant

**Status:** ✅ System validated and ready for deployment  
**Date:** February 25, 2026  
**Validation:** 65/65 checks passed (100%)

---

## Quick Start - Choose Your Deployment Method

### Option 1: Quick Manual Deployment (Recommended for First Time)

**Time:** ~15 minutes  
**Best for:** Testing and initial deployment

```bash
# 1. Install dependencies
npm install

# 2. Configure AWS credentials (if not already done)
aws configure

# 3. Deploy infrastructure
chmod +x infrastructure/deploy.sh
./infrastructure/deploy.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Bootstrap CDK
- ✅ Deploy infrastructure
- ✅ Output API endpoints

---

### Option 2: Automated CI/CD Pipeline (Recommended for Production)

**Time:** ~20 minutes setup, then automatic  
**Best for:** Production deployments with testing

```bash
# 1. Setup GitHub token in AWS Secrets Manager
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-personal-access-token"

# 2. Run automated pipeline setup
chmod +x scripts/setup-pipeline.sh
./scripts/setup-pipeline.sh

# 3. Push to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

The pipeline will:
- ✅ Build all Lambda functions
- ✅ Run tests
- ✅ Deploy to staging
- ✅ Run integration tests
- ✅ Request approval
- ✅ Deploy to production (blue-green)

---

### Option 3: GitHub Actions (Simplest)

**Time:** ~5 minutes setup  
**Best for:** GitHub-hosted projects

```bash
# 1. Add AWS credentials to GitHub Secrets
# Go to: GitHub repo → Settings → Secrets → Actions
# Add: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

# 2. Push to main branch
git push origin main
```

GitHub Actions workflow is already configured in `.github/workflows/deploy.yml`

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] ✅ AWS account with appropriate permissions
- [x] ✅ AWS CLI installed and configured
- [x] ✅ Node.js 18+ installed
- [x] ✅ All code validated (65/65 checks passed)
- [x] ✅ Documentation complete
- [ ] AWS credentials configured (`aws configure`)
- [ ] GitHub token created (for CI/CD option)
- [ ] Notification email configured (for CI/CD option)

---

## Deployment Steps (Manual Method)

### Step 1: Verify Prerequisites

```bash
# Check Node.js
node --version  # Should be 18+

# Check AWS CLI
aws --version

# Check AWS credentials
aws sts get-caller-identity
```

### Step 2: Install Dependencies

```bash
# Root dependencies
npm install

# Lambda dependencies (optional - done during build)
cd lambda && npm install
cd ..
```

### Step 3: Build Project

```bash
# Build TypeScript
npm run build

# Verify build
ls -la infrastructure/stacks/*.js
ls -la lambda/*/index.js
```

### Step 4: Deploy Infrastructure

```bash
# Option A: Use deployment script (recommended)
chmod +x infrastructure/deploy.sh
./infrastructure/deploy.sh

# Option B: Use CDK directly
npm run deploy

# Option C: Deploy specific environment
npm run deploy:staging  # For staging
npm run deploy:production  # For production
```

### Step 5: Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].StackStatus'

# Get API endpoint
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text

# Test health endpoint
curl $(aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)/health
```

---

## Post-Deployment Validation

### 1. Run Smoke Tests

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs' > outputs.json

# Run smoke tests
node scripts/smoke-test.js outputs.json
```

### 2. Run Health Checks

```bash
# Run health checks
node scripts/health-check.js outputs.json
```

### 3. Monitor CloudWatch

```bash
# View Lambda logs
aws logs tail /aws/lambda/upload-handler --follow

# View API Gateway logs
aws logs tail /aws/apigateway/VoiceLearningAssistant --follow
```

---

## Expected Costs

### Development/Staging
- **Lambda:** ~$2-5/month (free tier covers most)
- **DynamoDB:** ~$1-2/month (on-demand)
- **S3:** ~$0.50-1/month
- **API Gateway:** ~$1-2/month (HTTP API)
- **CloudWatch:** ~$0.50/month (free tier)
- **Total:** ~$5-10/month

### Production (1,000 students)
- **Lambda:** ~$20/month
- **DynamoDB:** ~$5/month
- **S3:** ~$6/month
- **API Gateway:** ~$10/month
- **Bedrock (Haiku):** ~$30/month
- **EC2 Spot (Chroma):** ~$5/month
- **CloudWatch:** ~$2/month
- **Total:** ~$78-100/month

**Cost per student:** ~$0.08-0.10/month (₹8-10)

---

## Monitoring After Deployment

### CloudWatch Dashboard

```bash
# Create monitoring dashboard
aws cloudwatch put-dashboard \
  --dashboard-name VoiceLearningAssistant \
  --dashboard-body file://monitoring-dashboard.json
```

### Set Up Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name HighErrorRate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

### View Metrics

- Go to: https://console.aws.amazon.com/cloudwatch/
- Select: Dashboards → VoiceLearningAssistant
- Monitor: Lambda invocations, errors, duration, costs

---

## Troubleshooting

### Deployment Fails

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name VoiceLearningAssistantStack \
  --max-items 20

# Check CDK synthesis
npm run synth

# Validate template
aws cloudformation validate-template \
  --template-body file://cdk.out/VoiceLearningAssistantStack.template.json
```

### Lambda Function Errors

```bash
# View recent logs
aws logs tail /aws/lambda/function-name --since 1h

# View specific log stream
aws logs get-log-events \
  --log-group-name /aws/lambda/function-name \
  --log-stream-name 'stream-name'
```

### API Gateway Issues

```bash
# Test API endpoint
curl -X POST https://your-api-endpoint/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# Check API Gateway logs
aws logs tail /aws/apigateway/VoiceLearningAssistant --follow
```

---

## Rollback Procedure

### If Deployment Fails

```bash
# CDK will automatically rollback on failure
# Check rollback status
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].StackStatus'
```

### Manual Rollback

```bash
# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name VoiceLearningAssistantStack

# Or delete and redeploy
cdk destroy VoiceLearningAssistantStack
cdk deploy VoiceLearningAssistantStack
```

### Blue-Green Rollback (Production)

```bash
# Swap back to blue environment
node scripts/blue-green-swap.js \
  VoiceLearningAssistantStack-Production \
  --rollback
```

---

## Next Steps After Deployment

1. **Verify All Services**
   - [ ] Test document upload
   - [ ] Test AI query
   - [ ] Test study plan creation
   - [ ] Test multilingual support

2. **Configure Monitoring**
   - [ ] Set up CloudWatch alarms
   - [ ] Configure SNS notifications
   - [ ] Create monitoring dashboard

3. **Security Hardening**
   - [ ] Review IAM policies
   - [ ] Enable CloudTrail
   - [ ] Configure WAF (optional)
   - [ ] Set up VPC (optional)

4. **Performance Optimization**
   - [ ] Monitor Lambda cold starts
   - [ ] Optimize memory allocation
   - [ ] Configure reserved concurrency
   - [ ] Enable X-Ray tracing

5. **User Testing**
   - [ ] Invite beta users
   - [ ] Collect feedback
   - [ ] Monitor usage patterns
   - [ ] Iterate on features

---

## Support Resources

### Documentation
- **Main README:** `README.md`
- **Full Deployment Guide:** `DEPLOYMENT.md`
- **CI/CD Guide:** `CI-CD.md`
- **Testing Guide:** `tests/TESTING_CHECKLIST.md`
- **Architecture:** `infrastructure/ARCHITECTURE.md`

### Validation Reports
- **System Validation:** `SYSTEM_VALIDATION_REPORT.md`
- **Final Checkpoint:** `FINAL_CHECKPOINT_SUMMARY.md`
- **Optional Tests:** `OPTIONAL_TESTS_SUMMARY.md`

### Scripts
- **Deployment:** `infrastructure/deploy.sh`
- **Validation:** `scripts/validate-system.sh`
- **Health Check:** `scripts/health-check.js`
- **Smoke Test:** `scripts/smoke-test.js`

---

## Quick Commands Reference

```bash
# Deploy
npm run deploy

# Deploy staging
npm run deploy:staging

# Deploy production
npm run deploy:production

# Run tests
npm test

# Run integration tests
npm run test:integration

# View logs
aws logs tail /aws/lambda/function-name --follow

# Check stack status
aws cloudformation describe-stacks --stack-name VoiceLearningAssistantStack

# Destroy stack
cdk destroy VoiceLearningAssistantStack
```

---

## 🎉 Ready to Deploy!

Your Voice-First AI Learning Assistant is fully validated and ready for deployment.

**Choose your deployment method above and follow the steps.**

**Recommended:** Start with Option 1 (Manual Deployment) for your first deployment to understand the process, then set up Option 2 (CI/CD Pipeline) for ongoing deployments.

---

**Questions?** Review the documentation or check the troubleshooting section above.

**Good luck with your deployment! 🚀**
