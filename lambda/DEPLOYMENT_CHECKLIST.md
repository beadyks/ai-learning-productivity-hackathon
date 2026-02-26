# Document Processing Pipeline - Deployment Checklist

## Pre-Deployment

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install Lambda dependencies (optional - CDK will bundle)
cd lambda/document-processing/upload-handler && npm install && cd ../../..
cd lambda/document-processing/upload-progress && npm install && cd ../../..
cd lambda/document-processing/text-extraction && npm install && cd ../../..
cd lambda/document-processing/content-chunking && npm install && cd ../../..
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Bootstrap CDK (First Time Only)

```bash
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

### 4. Review Configuration

Check `infrastructure/config/dev.json` or `infrastructure/config/prod.json`:
- Verify region settings
- Confirm resource naming conventions
- Review cost optimization settings

## Deployment Steps

### 1. Build TypeScript

```bash
npm run build
```

### 2. Synthesize CloudFormation Template

```bash
npm run synth
```

Review the generated CloudFormation template in `cdk.out/`.

### 3. Deploy Stack

```bash
# Deploy to development
npm run deploy

# Or deploy with specific profile
npm run deploy -- --profile your-aws-profile

# Deploy to production
npm run deploy -- -c environment=production
```

### 4. Capture Outputs

Save the CloudFormation outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --query 'Stacks[0].Outputs' \
  --output table > deployment-outputs.txt
```

Key outputs to save:
- `HttpApiUrl` - API Gateway endpoint
- `UserPoolId` - Cognito User Pool ID
- `UserPoolClientId` - Cognito Client ID
- `DocumentBucketName` - S3 bucket name
- `UserProfilesTableName` - DynamoDB table name
- `SessionsTableName` - DynamoDB table name
- `ProgressTableName` - DynamoDB table name
- `EmbeddingsTableName` - DynamoDB table name

## Post-Deployment Verification

### 1. Verify Lambda Functions

```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `voice-learning`)].FunctionName'

# Expected functions:
# - voice-learning-upload-handler
# - voice-learning-upload-progress
# - voice-learning-text-extraction
# - voice-learning-content-chunking
```

### 2. Verify S3 Bucket

```bash
# Check bucket exists
aws s3 ls | grep voice-learning-documents

# Verify encryption
aws s3api get-bucket-encryption --bucket voice-learning-documents-ACCOUNT_ID
```

### 3. Verify DynamoDB Tables

```bash
# List tables
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `voice-learning`)]'

# Expected tables:
# - voice-learning-user-profiles
# - voice-learning-sessions
# - voice-learning-progress
# - voice-learning-embeddings

# Check table details
aws dynamodb describe-table --table-name voice-learning-progress
```

### 4. Verify API Gateway

```bash
# Get API details
aws apigatewayv2 get-apis --query 'Items[?Name==`voice-learning-api`]'

# Test API endpoint
curl https://YOUR_API_URL/documents/upload \
  -H "Authorization: Bearer INVALID_TOKEN"

# Expected: 401 Unauthorized (authentication working)
```

### 5. Verify Event Triggers

```bash
# Check S3 event notifications
aws s3api get-bucket-notification-configuration \
  --bucket voice-learning-documents-ACCOUNT_ID

# Check DynamoDB stream
aws dynamodb describe-table \
  --table-name voice-learning-progress \
  --query 'Table.StreamSpecification'

# Check Lambda event source mappings
aws lambda list-event-source-mappings \
  --function-name voice-learning-content-chunking
```

### 6. Verify IAM Permissions

```bash
# Check Lambda execution roles
aws iam get-role --role-name VoiceLearningAssistantStack-UploadHandlerServiceRole*

# Verify policies attached
aws iam list-attached-role-policies \
  --role-name VoiceLearningAssistantStack-UploadHandlerServiceRole*
```

### 7. Test Document Upload Flow

```bash
# 1. Create test user in Cognito
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com

# 2. Set password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser \
  --password TestPassword123! \
  --permanent

# 3. Get authentication token
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=testuser,PASSWORD=TestPassword123!

# 4. Test upload endpoint
curl -X POST https://YOUR_API_URL/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileType": "text/plain",
    "fileSize": 100
  }'
```

## Monitoring Setup

### 1. Create CloudWatch Dashboard

```bash
# Create dashboard for monitoring
aws cloudwatch put-dashboard \
  --dashboard-name VoiceLearningAssistant \
  --dashboard-body file://cloudwatch-dashboard.json
```

### 2. Set Up Alarms

```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name voice-learning-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name voice-learning-api-errors \
  --alarm-description "Alert on API 5xx errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### 3. Enable X-Ray Tracing (Optional)

```bash
# Enable X-Ray for Lambda functions
aws lambda update-function-configuration \
  --function-name voice-learning-upload-handler \
  --tracing-config Mode=Active
```

## Cost Monitoring

### 1. Set Up Cost Alerts

```bash
# Create budget alert
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget-config.json
```

### 2. Monitor Service Costs

```bash
# Check Lambda costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://lambda-filter.json

# Check Textract costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://textract-filter.json

# Check Bedrock costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-filter.json
```

## Rollback Plan

### If Deployment Fails

```bash
# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name VoiceLearningAssistantStack

# Or delete and redeploy
npm run cdk destroy
npm run deploy
```

### If Issues Found Post-Deployment

```bash
# Update specific Lambda function
aws lambda update-function-code \
  --function-name voice-learning-upload-handler \
  --zip-file fileb://function.zip

# Or redeploy entire stack
npm run deploy
```

## Security Hardening

### 1. Review IAM Policies

- Ensure least privilege access
- Remove wildcard permissions where possible
- Enable MFA for sensitive operations

### 2. Enable Logging

```bash
# Enable S3 access logging
aws s3api put-bucket-logging \
  --bucket voice-learning-documents-ACCOUNT_ID \
  --bucket-logging-status file://logging-config.json

# Enable API Gateway logging
aws apigatewayv2 update-stage \
  --api-id YOUR_API_ID \
  --stage-name $default \
  --access-log-settings file://api-logging.json
```

### 3. Enable AWS Config

```bash
# Enable AWS Config for compliance monitoring
aws configservice put-configuration-recorder \
  --configuration-recorder file://config-recorder.json

aws configservice start-configuration-recorder \
  --configuration-recorder-name default
```

## Documentation

### Update Documentation

- [ ] Update API documentation with endpoints
- [ ] Document authentication flow
- [ ] Create user guide for document upload
- [ ] Document error codes and messages
- [ ] Create troubleshooting guide

### Share with Team

- [ ] Share deployment outputs
- [ ] Provide API Gateway URL
- [ ] Share Cognito User Pool details
- [ ] Document testing procedures
- [ ] Share monitoring dashboard links

## Cleanup (If Needed)

### Delete Stack

```bash
# Delete all resources
npm run cdk destroy

# Or use CloudFormation
aws cloudformation delete-stack \
  --stack-name VoiceLearningAssistantStack
```

### Manual Cleanup

Some resources may need manual deletion:
- S3 buckets with objects
- CloudWatch log groups
- KMS keys (if not using automatic deletion)

```bash
# Empty S3 bucket
aws s3 rm s3://voice-learning-documents-ACCOUNT_ID --recursive

# Delete log groups
aws logs delete-log-group --log-group-name /aws/lambda/voice-learning-upload-handler
```

## Success Criteria

- [ ] All Lambda functions deployed successfully
- [ ] S3 bucket created with encryption enabled
- [ ] DynamoDB tables created with correct schema
- [ ] API Gateway endpoints accessible
- [ ] Cognito authentication working
- [ ] Event triggers configured correctly
- [ ] IAM permissions set correctly
- [ ] CloudWatch logging enabled
- [ ] Test document upload successful
- [ ] Text extraction working
- [ ] Embeddings generated successfully
- [ ] Monitoring dashboards created
- [ ] Cost alerts configured
- [ ] Documentation updated

## Next Steps After Deployment

1. Implement property-based tests (Task 2.2, 2.5)
2. Set up CI/CD pipeline
3. Configure production environment
4. Implement additional features (voice processing, AI response generation)
5. Conduct load testing
6. Optimize costs based on usage patterns
