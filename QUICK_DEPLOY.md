# Quick Deployment Guide

Fast-track guide to deploy the Voice-First AI Learning Assistant.

## Prerequisites (5 minutes)

```bash
# 1. Install AWS CLI
# https://aws.amazon.com/cli/

# 2. Configure AWS credentials
aws configure

# 3. Install Node.js 20+
# https://nodejs.org/

# 4. Install dependencies
npm install
```

## Option 1: Automated Pipeline (Recommended)

### Setup (10 minutes)

```bash
# Run automated setup
chmod +x scripts/setup-pipeline.sh
./scripts/setup-pipeline.sh
```

Follow prompts to enter:
- GitHub owner/repo
- GitHub branch (default: main)
- Notification email

### Deploy

```bash
# Push to trigger pipeline
git add .
git commit -m "Deploy"
git push origin main
```

### Monitor

Go to: https://console.aws.amazon.com/codesuite/codepipeline/pipelines

## Option 2: Manual Deployment

### Deploy Staging (5 minutes)

```bash
npm run build
npm run deploy:staging
```

### Test Staging

```bash
cd tests/integration
npm install
export API_ENDPOINT=<staging-api-endpoint>
npm test
```

### Deploy Production (5 minutes)

```bash
npm run deploy:production
```

## Option 3: GitHub Actions

### Setup (2 minutes)

1. Go to GitHub repo → Settings → Secrets
2. Add secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### Deploy

```bash
# Push to main branch
git push origin main
```

GitHub Actions will automatically:
- Build
- Test
- Deploy to staging
- Run integration tests
- Deploy to production (on approval)

## Verify Deployment

### Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack-Staging
```

### Test API

```bash
# Get API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack-Staging \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Test health endpoint
curl $API_ENDPOINT/health
```

### Run Integration Tests

```bash
cd tests/integration
npm install
export API_ENDPOINT=$API_ENDPOINT
npm test
```

## Troubleshooting

### Build Fails

```bash
# Test locally
npm run build
cd lambda && npm run build
```

### Tests Fail

```bash
# Run tests locally
cd lambda && npm test
cd tests/integration && npm test
```

### Deployment Fails

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name VoiceLearningAssistantStack-Staging
```

## Cost Estimate

- **Staging**: ~$5-10/month
- **Production**: ~$10-20/month (scales with usage)
- **CI/CD Pipeline**: ~$3-5/month
- **Total**: ~$18-35/month

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Run integration tests
3. ✅ Monitor CloudWatch
4. ✅ Set up alarms
5. ✅ Configure domain (optional)
6. ✅ Enable HTTPS (optional)

## Support

- **Documentation**: See DEPLOYMENT.md and CI-CD.md
- **Integration Tests**: See tests/integration/README.md
- **Troubleshooting**: See DEPLOYMENT.md troubleshooting section

## Quick Commands

```bash
# Deploy pipeline
npm run deploy:pipeline

# Deploy staging
npm run deploy:staging

# Deploy production
npm run deploy:production

# Run tests
npm test

# Run integration tests
npm run test:integration

# Check logs
aws logs tail /aws/lambda/function-name --follow

# Destroy stack
cdk destroy VoiceLearningAssistantStack-Staging
```

## Production Checklist

Before deploying to production:

- [ ] Staging deployed successfully
- [ ] Integration tests passing
- [ ] CloudWatch alarms configured
- [ ] Backup strategy in place
- [ ] Monitoring dashboard created
- [ ] Cost alerts configured
- [ ] Security review completed
- [ ] Documentation updated

## Emergency Rollback

```bash
# Rollback to previous version
node scripts/blue-green-swap.js \
  VoiceLearningAssistantStack-Production \
  --rollback
```

---

**Ready to deploy?** Run `./scripts/setup-pipeline.sh` to get started!
