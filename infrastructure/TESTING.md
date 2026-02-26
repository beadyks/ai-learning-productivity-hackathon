# Infrastructure Testing Guide

This guide covers testing and validation of the Voice-First AI Learning Assistant infrastructure.

## Prerequisites

- AWS CLI configured with appropriate credentials
- jq installed for JSON parsing
- curl for API endpoint testing

## Automated Validation

Run the automated validation script:

```bash
./infrastructure/validate.sh
```

This script validates:
- Stack deployment status
- DynamoDB table configuration
- S3 bucket encryption and versioning
- Cognito User Pool settings
- API Gateway endpoint accessibility
- Cost estimates

## Manual Testing

### 1. DynamoDB Tables

#### Test User Profiles Table

```bash
# Get table description
aws dynamodb describe-table \
  --table-name voice-learning-user-profiles \
  --region us-east-1

# Test write operation
aws dynamodb put-item \
  --table-name voice-learning-user-profiles \
  --item '{
    "userId": {"S": "test-user-123"},
    "email": {"S": "test@example.com"},
    "name": {"S": "Test User"},
    "preferredLanguage": {"S": "en"},
    "createdAt": {"S": "2024-01-01T00:00:00Z"}
  }' \
  --region us-east-1

# Test read operation
aws dynamodb get-item \
  --table-name voice-learning-user-profiles \
  --key '{"userId": {"S": "test-user-123"}}' \
  --region us-east-1

# Test query by email (GSI)
aws dynamodb query \
  --table-name voice-learning-user-profiles \
  --index-name EmailIndex \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email": {"S": "test@example.com"}}' \
  --region us-east-1

# Clean up test data
aws dynamodb delete-item \
  --table-name voice-learning-user-profiles \
  --key '{"userId": {"S": "test-user-123"}}' \
  --region us-east-1
```

#### Test Sessions Table

```bash
# Test write with TTL
CURRENT_TIME=$(date +%s)
TTL_TIME=$((CURRENT_TIME + 2592000))  # 30 days from now

aws dynamodb put-item \
  --table-name voice-learning-sessions \
  --item "{
    \"sessionId\": {\"S\": \"test-session-123\"},
    \"userId\": {\"S\": \"test-user-123\"},
    \"timestamp\": {\"N\": \"$CURRENT_TIME\"},
    \"ttl\": {\"N\": \"$TTL_TIME\"},
    \"mode\": {\"S\": \"tutor\"}
  }" \
  --region us-east-1

# Test query by user (GSI)
aws dynamodb query \
  --table-name voice-learning-sessions \
  --index-name UserSessionIndex \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "test-user-123"}}' \
  --region us-east-1

# Clean up
aws dynamodb delete-item \
  --table-name voice-learning-sessions \
  --key "{\"sessionId\": {\"S\": \"test-session-123\"}, \"timestamp\": {\"N\": \"$CURRENT_TIME\"}}" \
  --region us-east-1
```

#### Test Progress Table

```bash
# Test write operation
aws dynamodb put-item \
  --table-name voice-learning-progress \
  --item '{
    "userId": {"S": "test-user-123"},
    "topicId": {"S": "javascript-basics"},
    "completionStatus": {"S": "in_progress"},
    "lastUpdated": {"N": "1704067200"}
  }' \
  --region us-east-1

# Test read operation
aws dynamodb get-item \
  --table-name voice-learning-progress \
  --key '{
    "userId": {"S": "test-user-123"},
    "topicId": {"S": "javascript-basics"}
  }' \
  --region us-east-1

# Clean up
aws dynamodb delete-item \
  --table-name voice-learning-progress \
  --key '{
    "userId": {"S": "test-user-123"},
    "topicId": {"S": "javascript-basics"}
  }' \
  --region us-east-1
```

### 2. S3 Document Storage

#### Test Upload and Encryption

```bash
# Create test file
echo "Test document content" > test-document.txt

# Upload to S3
aws s3 cp test-document.txt s3://voice-learning-documents-ACCOUNT_ID/test/test-document.txt \
  --region us-east-1

# Verify encryption
aws s3api head-object \
  --bucket voice-learning-documents-ACCOUNT_ID \
  --key test/test-document.txt \
  --region us-east-1

# Download and verify
aws s3 cp s3://voice-learning-documents-ACCOUNT_ID/test/test-document.txt downloaded.txt \
  --region us-east-1

diff test-document.txt downloaded.txt

# Clean up
aws s3 rm s3://voice-learning-documents-ACCOUNT_ID/test/test-document.txt \
  --region us-east-1
rm test-document.txt downloaded.txt
```

#### Test Lifecycle Policies

```bash
# Check lifecycle configuration
aws s3api get-bucket-lifecycle-configuration \
  --bucket voice-learning-documents-ACCOUNT_ID \
  --region us-east-1
```

### 3. Cognito User Pool

#### Test User Registration

```bash
# Get User Pool ID from stack outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com Name=given_name,Value=Test \
  --temporary-password "TempPass123!" \
  --region us-east-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --password "SecurePass123!" \
  --permanent \
  --region us-east-1

# Get user details
aws cognito-idp admin-get-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --region us-east-1

# Clean up
aws cognito-idp admin-delete-user \
  --user-pool-id $USER_POOL_ID \
  --username testuser@example.com \
  --region us-east-1
```

#### Test Authentication Flow

```bash
# Get User Pool Client ID
CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

# Initiate auth (requires user to exist)
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id $CLIENT_ID \
  --auth-parameters USERNAME=testuser@example.com,PASSWORD=SecurePass123! \
  --region us-east-1
```

### 4. API Gateway

#### Test Endpoint Accessibility

```bash
# Get API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text)

# Test CORS preflight
curl -X OPTIONS $API_URL \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Test unauthenticated request (should return 401 or 403)
curl -X GET $API_URL/test -v
```

### 5. KMS Encryption

#### Test Encryption Key

```bash
# Get encryption key ID
KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`EncryptionKeyId`].OutputValue' \
  --output text)

# Describe key
aws kms describe-key \
  --key-id $KEY_ID \
  --region us-east-1

# Check key rotation status
aws kms get-key-rotation-status \
  --key-id $KEY_ID \
  --region us-east-1

# Test encryption/decryption
echo "Test data" > plaintext.txt
aws kms encrypt \
  --key-id $KEY_ID \
  --plaintext fileb://plaintext.txt \
  --output text \
  --query CiphertextBlob \
  --region us-east-1 > encrypted.txt

aws kms decrypt \
  --ciphertext-blob fileb://encrypted.txt \
  --output text \
  --query Plaintext \
  --region us-east-1 | base64 -d

rm plaintext.txt encrypted.txt
```

## Performance Testing

### DynamoDB Performance

```bash
# Test write throughput (on-demand should handle bursts)
for i in {1..100}; do
  aws dynamodb put-item \
    --table-name voice-learning-user-profiles \
    --item "{\"userId\": {\"S\": \"perf-test-$i\"}, \"email\": {\"S\": \"test$i@example.com\"}}" \
    --region us-east-1 &
done
wait

# Clean up
for i in {1..100}; do
  aws dynamodb delete-item \
    --table-name voice-learning-user-profiles \
    --key "{\"userId\": {\"S\": \"perf-test-$i\"}}" \
    --region us-east-1 &
done
wait
```

### S3 Upload Performance

```bash
# Create test file
dd if=/dev/urandom of=large-file.bin bs=1M count=10

# Time upload
time aws s3 cp large-file.bin s3://voice-learning-documents-ACCOUNT_ID/test/large-file.bin \
  --region us-east-1

# Time download
time aws s3 cp s3://voice-learning-documents-ACCOUNT_ID/test/large-file.bin downloaded-large.bin \
  --region us-east-1

# Clean up
aws s3 rm s3://voice-learning-documents-ACCOUNT_ID/test/large-file.bin \
  --region us-east-1
rm large-file.bin downloaded-large.bin
```

## Security Testing

### Test IAM Permissions

```bash
# Verify least privilege - these should fail without proper IAM role
aws dynamodb scan --table-name voice-learning-user-profiles --region us-east-1
aws s3 ls s3://voice-learning-documents-ACCOUNT_ID --region us-east-1
```

### Test Encryption

```bash
# Verify S3 encryption is enforced
aws s3api put-object \
  --bucket voice-learning-documents-ACCOUNT_ID \
  --key test-unencrypted.txt \
  --body test.txt \
  --server-side-encryption none \
  --region us-east-1
# Should fail if encryption is enforced
```

## Cost Monitoring

### Check Current Costs

```bash
# Get cost for last 30 days
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '30 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cost-filter.json

# cost-filter.json:
# {
#   "Tags": {
#     "Key": "Project",
#     "Values": ["VoiceLearningAssistant"]
#   }
# }
```

## Troubleshooting

### Stack Deployment Issues

```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --max-items 20

# Check stack status
aws cloudformation describe-stacks \
  --stack-name VoiceLearningAssistantStack \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Resource Access Issues

```bash
# Check DynamoDB table status
aws dynamodb describe-table \
  --table-name voice-learning-user-profiles \
  --region us-east-1 \
  --query 'Table.TableStatus'

# Check S3 bucket policy
aws s3api get-bucket-policy \
  --bucket voice-learning-documents-ACCOUNT_ID \
  --region us-east-1
```

## Cleanup

To remove all test data and resources:

```bash
# Delete test items from DynamoDB
# (Use scan and batch-write-item for bulk deletion)

# Empty S3 bucket
aws s3 rm s3://voice-learning-documents-ACCOUNT_ID --recursive --region us-east-1

# Delete test users from Cognito
# (Use list-users and admin-delete-user)

# Destroy stack (if needed)
cdk destroy
```

## Continuous Monitoring

Set up CloudWatch alarms for:
- DynamoDB throttling
- S3 bucket size
- API Gateway 4xx/5xx errors
- Cognito authentication failures
- KMS key usage

```bash
# Example: Create alarm for DynamoDB throttling
aws cloudwatch put-metric-alarm \
  --alarm-name voice-learning-dynamodb-throttle \
  --alarm-description "Alert on DynamoDB throttling" \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region us-east-1
```
