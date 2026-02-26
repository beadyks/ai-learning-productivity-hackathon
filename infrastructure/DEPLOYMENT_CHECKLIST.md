# Deployment Checklist

Use this checklist to ensure a successful deployment of the Voice-First AI Learning Assistant infrastructure.

## Pre-Deployment

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] AWS CLI installed and configured
- [ ] AWS CDK CLI installed globally (`npm install -g aws-cdk`)
- [ ] AWS account with appropriate permissions
- [ ] AWS credentials configured (`aws configure`)

### Account Setup
- [ ] Verify AWS account ID: `aws sts get-caller-identity`
- [ ] Confirm target region (default: us-east-1)
- [ ] Check service quotas for:
  - [ ] DynamoDB tables (default: 2,500 per region)
  - [ ] S3 buckets (default: 100 per account)
  - [ ] Cognito User Pools (default: 1,000 per region)
  - [ ] API Gateway APIs (default: 600 per region)

### Cost Planning
- [ ] Review estimated costs (~$25/month for infrastructure)
- [ ] Set up AWS Budgets for cost alerts
- [ ] Enable Cost Explorer
- [ ] Tag resources for cost tracking

## Deployment Steps

### 1. Install Dependencies
```bash
cd infrastructure
npm install
```
- [ ] Dependencies installed successfully
- [ ] No security vulnerabilities reported

### 2. Bootstrap CDK
```bash
cdk bootstrap aws://ACCOUNT_ID/REGION
```
- [ ] CDK bootstrap completed
- [ ] CDKToolkit stack created in CloudFormation

### 3. Review Configuration
- [ ] Review `infrastructure/config/dev.json` for development settings
- [ ] Review `infrastructure/config/prod.json` for production settings
- [ ] Update CORS origins with actual domain
- [ ] Update Cognito callback URLs with actual URLs

### 4. Synthesize Template
```bash
npm run synth
```
- [ ] CloudFormation template generated successfully
- [ ] Review `cdk.out/VoiceLearningAssistantStack.template.json`
- [ ] No synthesis errors

### 5. Deploy Infrastructure
```bash
./infrastructure/deploy.sh
# OR
npm run deploy
```
- [ ] Deployment initiated
- [ ] Review changes before confirming
- [ ] Deployment completed successfully
- [ ] Stack status: CREATE_COMPLETE or UPDATE_COMPLETE

### 6. Verify Deployment
```bash
./infrastructure/validate.sh
```
- [ ] All DynamoDB tables active
- [ ] S3 bucket accessible with encryption
- [ ] Cognito User Pool configured
- [ ] API Gateway endpoint reachable
- [ ] KMS key active with rotation enabled

## Post-Deployment

### 1. Save Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' > stack-outputs.json
```
- [ ] Stack outputs saved
- [ ] User Pool ID recorded
- [ ] User Pool Client ID recorded
- [ ] API Gateway URL recorded
- [ ] S3 bucket name recorded
- [ ] DynamoDB table names recorded

### 2. Configure Application
- [ ] Update frontend with Cognito User Pool ID
- [ ] Update frontend with User Pool Client ID
- [ ] Update frontend with API Gateway URL
- [ ] Update Lambda environment variables with stack outputs
- [ ] Configure CORS origins in production

### 3. Security Configuration
- [ ] Review IAM roles and policies
- [ ] Enable MFA for Cognito (if required)
- [ ] Configure S3 bucket policies
- [ ] Set up CloudWatch alarms
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Review KMS key policies

### 4. Monitoring Setup
- [ ] Create CloudWatch dashboard
- [ ] Set up alarms for:
  - [ ] DynamoDB throttling
  - [ ] API Gateway 4xx/5xx errors
  - [ ] Lambda errors and timeouts
  - [ ] S3 bucket size
  - [ ] Cost threshold exceeded
- [ ] Configure SNS topics for alerts
- [ ] Test alarm notifications

### 5. Testing
- [ ] Run infrastructure tests: `./infrastructure/validate.sh`
- [ ] Test DynamoDB read/write operations
- [ ] Test S3 upload/download with encryption
- [ ] Test Cognito user registration
- [ ] Test API Gateway CORS
- [ ] Verify KMS encryption/decryption

### 6. Documentation
- [ ] Document stack outputs
- [ ] Update README with deployment details
- [ ] Document any custom configurations
- [ ] Create runbook for common operations
- [ ] Document rollback procedures

## Production Deployment

### Additional Steps for Production
- [ ] Use production configuration (`config/prod.json`)
- [ ] Update CORS origins with production domain
- [ ] Update Cognito callback URLs with production URLs
- [ ] Enable detailed CloudWatch metrics
- [ ] Set up automated backups
- [ ] Configure DynamoDB point-in-time recovery
- [ ] Enable S3 versioning and lifecycle policies
- [ ] Set up AWS Backup for critical resources
- [ ] Configure Route 53 for custom domain
- [ ] Set up CloudFront distribution
- [ ] Enable WAF for API Gateway
- [ ] Configure AWS Shield for DDoS protection

### Compliance and Security
- [ ] Review security best practices
- [ ] Enable AWS Config for compliance monitoring
- [ ] Set up AWS Security Hub
- [ ] Configure AWS GuardDuty
- [ ] Enable VPC Flow Logs (if using VPC)
- [ ] Review data retention policies
- [ ] Document data protection measures
- [ ] Conduct security audit

## Rollback Plan

### If Deployment Fails
1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name VoiceLearningAssistantStack \
     --region us-east-1
   ```

2. Review error messages and fix issues

3. Rollback if necessary:
   ```bash
   cdk deploy --rollback
   ```

4. Or delete and redeploy:
   ```bash
   cdk destroy
   cdk deploy
   ```

### If Issues Found Post-Deployment
1. Identify the issue
2. Fix in code
3. Test locally with `cdk synth`
4. Review changes with `cdk diff`
5. Deploy update with `cdk deploy`

## Maintenance

### Regular Tasks
- [ ] Weekly: Review CloudWatch metrics
- [ ] Weekly: Check cost reports
- [ ] Monthly: Review and optimize costs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Quarterly: Review and update documentation

### Cost Optimization
- [ ] Monitor DynamoDB usage and adjust capacity
- [ ] Review S3 storage classes and lifecycle policies
- [ ] Optimize Lambda memory and timeout settings
- [ ] Review and clean up unused resources
- [ ] Implement caching strategies
- [ ] Use Reserved Instances or Savings Plans if applicable

## Troubleshooting

### Common Issues

**Issue: CDK Bootstrap Fails**
- Solution: Ensure AWS credentials have CloudFormation permissions
- Check: `aws sts get-caller-identity`

**Issue: Stack Deployment Fails**
- Solution: Review CloudFormation events for specific error
- Check: Resource limits and quotas

**Issue: DynamoDB Table Creation Fails**
- Solution: Check table name uniqueness and region limits
- Verify: KMS key permissions

**Issue: S3 Bucket Creation Fails**
- Solution: Bucket names must be globally unique
- Try: Different bucket name or let CDK generate name

**Issue: Cognito User Pool Creation Fails**
- Solution: Check domain prefix uniqueness
- Verify: Region supports Cognito

**Issue: API Gateway Creation Fails**
- Solution: Check API limits and quotas
- Verify: Authorizer configuration

## Support

### Resources
- AWS CDK Documentation: https://docs.aws.amazon.com/cdk/
- AWS CloudFormation: https://docs.aws.amazon.com/cloudformation/
- Project README: `infrastructure/README.md`
- Testing Guide: `infrastructure/TESTING.md`

### Getting Help
- Review CloudFormation events
- Check CloudWatch logs
- Consult AWS documentation
- Contact AWS Support (if applicable)

## Sign-Off

### Deployment Completed By
- Name: ___________________________
- Date: ___________________________
- Environment: [ ] Dev [ ] Staging [ ] Production

### Verified By
- Name: ___________________________
- Date: ___________________________

### Notes
_______________________________________
_______________________________________
_______________________________________
