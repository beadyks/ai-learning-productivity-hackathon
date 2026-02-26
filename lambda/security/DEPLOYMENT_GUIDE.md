# Security Services Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the security and compliance features of the Voice-First AI Learning Assistant.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 18.x or later
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Valid AWS credentials

## Pre-Deployment Checklist

- [ ] AWS account configured
- [ ] AWS CLI credentials set up
- [ ] Node.js and npm installed
- [ ] CDK CLI installed
- [ ] Repository cloned
- [ ] Dependencies installed

## Deployment Steps

### 1. Install Dependencies

```bash
# Install infrastructure dependencies
cd infrastructure
npm install

# Install Lambda dependencies (optional, CDK will bundle)
cd ../lambda/security/data-protection
npm install

cd ../auth-manager
npm install
```

### 2. Configure Environment

Create or update `infrastructure/config/dev.json` or `infrastructure/config/prod.json`:

```json
{
  "environment": "dev",
  "region": "us-east-1",
  "accountId": "YOUR_AWS_ACCOUNT_ID",
  "stackName": "voice-learning-assistant-dev",
  "tags": {
    "Project": "VoiceLearningAssistant",
    "Environment": "dev",
    "ManagedBy": "CDK"
  }
}
```

### 3. Bootstrap CDK (First Time Only)

```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 4. Synthesize CloudFormation Template

```bash
cd infrastructure
npm run build
cdk synth
```

Review the generated CloudFormation template to ensure all resources are correct.

### 5. Deploy Infrastructure

```bash
cd infrastructure
cdk deploy
```

This will deploy:
- KMS encryption key
- DynamoDB tables (with encryption)
- S3 bucket (with encryption)
- Cognito User Pool
- HTTP API Gateway
- Lambda functions (including security functions)
- IAM roles and policies

**Note:** Deployment takes approximately 5-10 minutes.

### 6. Capture Outputs

After deployment, save the CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name voice-learning-assistant-dev \
  --query 'Stacks[0].Outputs' \
  --output table
```

Important outputs:
- `UserPoolId` - Cognito User Pool ID
- `UserPoolClientId` - Cognito Client ID
- `HttpApiUrl` - API Gateway URL
- `EncryptionKeyId` - KMS Key ID

### 7. Initialize Cognito Groups

Create the RBAC groups in Cognito:

```bash
# Get an admin token first (create an admin user in Cognito console)
# Then call the initialize-groups endpoint

curl -X POST https://YOUR_API_URL/security/auth \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "initialize-groups"
  }'
```

This creates the following groups:
- `student` (default)
- `premium_student`
- `educator`
- `admin`

### 8. Verify Deployment

#### Test Data Protection Endpoint

```bash
curl -X POST https://YOUR_API_URL/security/data-protection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "compliance-check"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "All compliance checks passed",
  "complianceStatus": {
    "encryptionAtRest": true,
    "encryptionInTransit": true,
    "dataRetention": true,
    "accessControl": true,
    "auditLogging": true,
    "secureDelete": true,
    "overallCompliant": true,
    "issues": []
  }
}
```

#### Test Auth Manager Endpoint

```bash
curl -X POST https://YOUR_API_URL/security/auth \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get-user-roles"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User roles retrieved successfully",
  "roles": ["student"],
  "permissions": [
    "read:own_data",
    "write:own_data",
    "delete:own_data",
    "upload:documents",
    "access:ai_features"
  ]
}
```

### 9. Create Test Users

Create test users for each role:

```bash
# Create student user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username student@example.com \
  --user-attributes Name=email,Value=student@example.com \
  --temporary-password TempPass123!

# Create premium student user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username premium@example.com \
  --user-attributes Name=email,Value=premium@example.com \
  --temporary-password TempPass123!

# Assign premium role
curl -X POST https://YOUR_API_URL/security/auth \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "assign-role",
    "targetUserId": "premium-user-id",
    "role": "premium_student"
  }'
```

## Post-Deployment Configuration

### 1. Configure CORS

Update the API Gateway CORS settings if needed:

```typescript
// In infrastructure/stacks/voice-learning-assistant-stack.ts
corsPreflight: {
  allowOrigins: ['https://yourdomain.com'], // Update with actual domain
  allowMethods: [
    apigateway.CorsHttpMethod.GET,
    apigateway.CorsHttpMethod.POST,
    apigateway.CorsHttpMethod.PUT,
    apigateway.CorsHttpMethod.DELETE,
    apigateway.CorsHttpMethod.OPTIONS,
  ],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token',
  ],
  maxAge: cdk.Duration.days(1),
}
```

### 2. Configure Cognito Callback URLs

Update Cognito callback URLs for your frontend:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --callback-urls https://yourdomain.com/callback \
  --logout-urls https://yourdomain.com/logout
```

### 3. Enable CloudWatch Alarms

Set up alarms for security events:

```bash
# Failed authentication alarm
aws cloudwatch put-metric-alarm \
  --alarm-name security-failed-auth \
  --alarm-description "Alert on high failed authentication rate" \
  --metric-name FailedAuthentications \
  --namespace VoiceLearningAssistant \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# Secure deletion alarm
aws cloudwatch put-metric-alarm \
  --alarm-name security-bulk-deletion \
  --alarm-description "Alert on bulk data deletion" \
  --metric-name SecureDeletions \
  --namespace VoiceLearningAssistant \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### 4. Configure Backup and Recovery

Enable point-in-time recovery for DynamoDB tables:

```bash
aws dynamodb update-continuous-backups \
  --table-name voice-learning-user-profiles \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name voice-learning-sessions \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name voice-learning-progress \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

## Monitoring and Maintenance

### CloudWatch Logs

View Lambda function logs:

```bash
# Data protection logs
aws logs tail /aws/lambda/voice-learning-data-protection --follow

# Auth manager logs
aws logs tail /aws/lambda/voice-learning-auth-manager --follow
```

### CloudWatch Metrics

Monitor key metrics:

```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=voice-learning-data-protection \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=voice-learning-auth-manager \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Cost Monitoring

Track security service costs:

```bash
# Get cost for Lambda functions
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://lambda-filter.json

# Get cost for KMS
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://kms-filter.json
```

## Troubleshooting

### Issue: Cognito groups not created

**Solution:**
```bash
# Manually create groups
aws cognito-idp create-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --group-name student \
  --description "Student role"

aws cognito-idp create-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --group-name premium_student \
  --description "Premium student role"

aws cognito-idp create-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --group-name educator \
  --description "Educator role"

aws cognito-idp create-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --group-name admin \
  --description "Admin role"
```

### Issue: KMS permissions denied

**Solution:**
Check Lambda execution role has KMS permissions:
```bash
aws iam get-role-policy \
  --role-name voice-learning-data-protection-role \
  --policy-name KMSPolicy
```

### Issue: API Gateway 401 Unauthorized

**Solution:**
Verify JWT token is valid and not expired:
```bash
# Decode JWT token
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq
```

### Issue: Secure deletion fails

**Solution:**
Check Lambda timeout and memory:
```bash
aws lambda update-function-configuration \
  --function-name voice-learning-data-protection \
  --timeout 300 \
  --memory-size 1024
```

## Rollback Procedure

If deployment fails or issues arise:

```bash
# Rollback to previous version
cd infrastructure
cdk deploy --rollback

# Or delete and redeploy
cdk destroy
cdk deploy
```

## Security Best Practices

1. **Rotate KMS Keys**: Enable automatic key rotation
2. **Monitor Logs**: Set up CloudWatch Logs Insights queries
3. **Enable MFA**: Require MFA for admin users
4. **Least Privilege**: Review IAM policies regularly
5. **Backup Data**: Enable point-in-time recovery
6. **Audit Access**: Review CloudTrail logs monthly
7. **Update Dependencies**: Keep Lambda runtimes updated
8. **Test Disaster Recovery**: Practice restore procedures

## Support

For deployment issues:
- Check CloudFormation events: AWS Console → CloudFormation → Stack → Events
- Review Lambda logs: AWS Console → CloudWatch → Log Groups
- Check IAM permissions: AWS Console → IAM → Roles
- Contact: devops@voicelearning.example.com

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Lambda Documentation](https://docs.aws.amazon.com/lambda/)
