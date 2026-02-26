# Session Management Deployment Guide

## Overview

This guide provides instructions for deploying the session management module to AWS.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- DynamoDB tables created (via infrastructure stack)
- Cognito User Pool configured

## Deployment Steps

### 1. Install Dependencies

```bash
# Install session persistence dependencies
cd lambda/session-management/session-persistence
npm install

# Install context manager dependencies
cd ../context-manager
npm install
```

### 2. Build Lambda Functions

```bash
# Build session persistence
cd lambda/session-management/session-persistence
npm run build

# Build context manager
cd ../context-manager
npm run build
```

### 3. Deploy Infrastructure

The session management Lambda functions are deployed as part of the main infrastructure stack:

```bash
cd infrastructure
npm install
cdk deploy
```

This will:
- Create the session persistence Lambda function
- Create the context manager Lambda function
- Configure IAM roles and permissions
- Set up API Gateway routes
- Configure DynamoDB access
- Enable KMS encryption

### 4. Verify Deployment

After deployment, verify the Lambda functions are created:

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `voice-learning-session`) || contains(FunctionName, `voice-learning-context`)].FunctionName'
```

Expected output:
```json
[
  "voice-learning-session-persistence",
  "voice-learning-context-manager"
]
```

### 5. Test API Endpoints

Get the API Gateway URL from CDK outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text
```

Test session creation:

```bash
# Get authentication token from Cognito
TOKEN="<your-cognito-jwt-token>"

# Create a session
curl -X POST https://<api-url>/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "session": {
      "currentTopic": "JavaScript Basics",
      "mode": "tutor"
    }
  }'
```

Test context management:

```bash
# Add a conversation turn
curl -X POST https://<api-url>/context \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_turn",
    "sessionId": "<session-id>",
    "turn": {
      "role": "user",
      "content": "What is a closure?",
      "language": "en"
    }
  }'
```

## Environment Variables

The Lambda functions use the following environment variables (automatically configured by CDK):

- `SESSIONS_TABLE` - DynamoDB sessions table name
- `USER_PROFILES_TABLE` - DynamoDB user profiles table name
- `AWS_REGION` - AWS region

## IAM Permissions

The Lambda functions require the following permissions:

### Session Persistence
- `dynamodb:PutItem` on sessions table
- `dynamodb:GetItem` on sessions table
- `dynamodb:UpdateItem` on sessions table
- `dynamodb:DeleteItem` on sessions table
- `dynamodb:Query` on UserSessionIndex GSI
- `kms:Decrypt` on encryption key
- `kms:Encrypt` on encryption key

### Context Manager
- `dynamodb:GetItem` on sessions table
- `dynamodb:UpdateItem` on sessions table
- `kms:Decrypt` on encryption key
- `kms:Encrypt` on encryption key

## Monitoring

### CloudWatch Logs

View logs for session persistence:
```bash
aws logs tail /aws/lambda/voice-learning-session-persistence --follow
```

View logs for context manager:
```bash
aws logs tail /aws/lambda/voice-learning-context-manager --follow
```

### CloudWatch Metrics

Key metrics to monitor:
- Lambda invocations
- Lambda errors
- Lambda duration
- DynamoDB read/write capacity
- DynamoDB throttles

Create CloudWatch dashboard:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name VoiceLearningSessionManagement \
  --dashboard-body file://cloudwatch-dashboard.json
```

## Cost Monitoring

Monitor costs with AWS Cost Explorer:

```bash
# Get Lambda costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://lambda-cost-filter.json

# Get DynamoDB costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://dynamodb-cost-filter.json
```

Expected costs per 1,000 students:
- Lambda: ~$2/month
- DynamoDB: ~$5/month
- Total: ~$7/month

## Troubleshooting

### Lambda Function Not Found

If Lambda functions are not created:
1. Check CDK deployment logs for errors
2. Verify IAM permissions for CDK deployment
3. Check CloudFormation stack status

### DynamoDB Access Denied

If Lambda functions cannot access DynamoDB:
1. Verify IAM role has correct permissions
2. Check KMS key policy allows Lambda role
3. Verify table names in environment variables

### API Gateway 401 Unauthorized

If API requests return 401:
1. Verify Cognito JWT token is valid
2. Check token is included in Authorization header
3. Verify User Pool Client ID matches

### Session Not Found

If session restoration fails:
1. Check session TTL (30 days)
2. Verify userId matches JWT claims
3. Check DynamoDB table for session data

## Rollback

To rollback deployment:

```bash
cd infrastructure
cdk destroy
```

This will remove:
- Lambda functions
- API Gateway routes
- IAM roles
- CloudWatch log groups

Note: DynamoDB tables are retained by default to prevent data loss.

## Performance Tuning

### Lambda Memory Optimization

Test different memory configurations:

```bash
# Update Lambda memory
aws lambda update-function-configuration \
  --function-name voice-learning-session-persistence \
  --memory-size 1024

# Monitor performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=voice-learning-session-persistence \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### DynamoDB Capacity

Monitor DynamoDB capacity:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=voice-learning-sessions \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Security Best Practices

1. **Rotate KMS Keys** - Enable automatic key rotation
2. **Update Dependencies** - Regularly update npm packages
3. **Monitor Access** - Review CloudTrail logs for unauthorized access
4. **Least Privilege** - Review and minimize IAM permissions
5. **Enable MFA** - Require MFA for Cognito users

## Backup and Recovery

### DynamoDB Backups

Enable point-in-time recovery:

```bash
aws dynamodb update-continuous-backups \
  --table-name voice-learning-sessions \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

Create on-demand backup:

```bash
aws dynamodb create-backup \
  --table-name voice-learning-sessions \
  --backup-name voice-learning-sessions-backup-$(date +%Y%m%d)
```

### Restore from Backup

```bash
aws dynamodb restore-table-from-backup \
  --target-table-name voice-learning-sessions-restored \
  --backup-arn <backup-arn>
```

## Support

For issues or questions:
1. Check CloudWatch logs for error details
2. Review IMPLEMENTATION_SUMMARY.md for architecture details
3. Consult README.md for API documentation
4. Run validate-implementation.sh to verify setup

## Next Steps

After deployment:
1. Run integration tests
2. Configure monitoring alerts
3. Set up cost budgets
4. Enable backup automation
5. Document API endpoints for frontend team
