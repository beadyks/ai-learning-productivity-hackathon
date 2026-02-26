#!/bin/bash

# Voice-First AI Learning Assistant - Infrastructure Validation Script
# This script validates the deployed infrastructure

set -e

echo "=========================================="
echo "Infrastructure Validation"
echo "=========================================="
echo ""

STACK_NAME="VoiceLearningAssistantStack"
REGION=${AWS_REGION:-us-east-1}

# Check if stack exists
echo "Checking if stack exists..."
if ! aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo "❌ Stack '$STACK_NAME' not found in region $REGION"
    echo "   Please deploy the stack first using: ./infrastructure/deploy.sh"
    exit 1
fi

echo "✓ Stack found"

# Get stack outputs
echo ""
echo "Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs' --output json)

# Extract values
USER_POOL_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
USER_POOL_CLIENT_ID=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
API_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="HttpApiUrl") | .OutputValue')
DOCUMENT_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DocumentBucketName") | .OutputValue')
PROFILES_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UserProfilesTableName") | .OutputValue')
SESSIONS_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="SessionsTableName") | .OutputValue')
PROGRESS_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ProgressTableName") | .OutputValue')

echo ""
echo "=========================================="
echo "Stack Outputs"
echo "=========================================="
echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "API URL: $API_URL"
echo "Document Bucket: $DOCUMENT_BUCKET"
echo "Profiles Table: $PROFILES_TABLE"
echo "Sessions Table: $SESSIONS_TABLE"
echo "Progress Table: $PROGRESS_TABLE"

# Validate DynamoDB tables
echo ""
echo "=========================================="
echo "Validating DynamoDB Tables"
echo "=========================================="

for TABLE in $PROFILES_TABLE $SESSIONS_TABLE $PROGRESS_TABLE; do
    echo -n "Checking $TABLE... "
    if aws dynamodb describe-table --table-name $TABLE --region $REGION &> /dev/null; then
        STATUS=$(aws dynamodb describe-table --table-name $TABLE --region $REGION --query 'Table.TableStatus' --output text)
        echo "✓ $STATUS"
    else
        echo "❌ Not found"
    fi
done

# Validate S3 bucket
echo ""
echo "=========================================="
echo "Validating S3 Bucket"
echo "=========================================="
echo -n "Checking $DOCUMENT_BUCKET... "
if aws s3 ls s3://$DOCUMENT_BUCKET --region $REGION &> /dev/null; then
    echo "✓ Accessible"
    
    # Check encryption
    ENCRYPTION=$(aws s3api get-bucket-encryption --bucket $DOCUMENT_BUCKET --region $REGION 2>/dev/null || echo "none")
    if [ "$ENCRYPTION" != "none" ]; then
        echo "  ✓ Encryption enabled"
    else
        echo "  ⚠️  Encryption not configured"
    fi
    
    # Check versioning
    VERSIONING=$(aws s3api get-bucket-versioning --bucket $DOCUMENT_BUCKET --region $REGION --query 'Status' --output text)
    if [ "$VERSIONING" == "Enabled" ]; then
        echo "  ✓ Versioning enabled"
    else
        echo "  ⚠️  Versioning not enabled"
    fi
else
    echo "❌ Not accessible"
fi

# Validate Cognito User Pool
echo ""
echo "=========================================="
echo "Validating Cognito User Pool"
echo "=========================================="
echo -n "Checking User Pool $USER_POOL_ID... "
if aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION &> /dev/null; then
    echo "✓ Active"
    
    # Check MFA configuration
    MFA=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION --query 'UserPool.MfaConfiguration' --output text)
    echo "  MFA Configuration: $MFA"
    
    # Check auto-verify
    AUTO_VERIFY=$(aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $REGION --query 'UserPool.AutoVerifiedAttributes' --output text)
    echo "  Auto-verify: $AUTO_VERIFY"
else
    echo "❌ Not found"
fi

# Validate API Gateway
echo ""
echo "=========================================="
echo "Validating API Gateway"
echo "=========================================="
echo -n "Checking API endpoint... "
if curl -s -o /dev/null -w "%{http_code}" $API_URL | grep -q "404\|403"; then
    echo "✓ Reachable (no routes configured yet)"
else
    echo "⚠️  Unexpected response"
fi

# Cost estimation
echo ""
echo "=========================================="
echo "Estimated Monthly Costs"
echo "=========================================="
echo "Based on 1,000 active students:"
echo ""
echo "DynamoDB (On-Demand):     ~$5"
echo "S3 (Intelligent-Tiering): ~$6"
echo "API Gateway (HTTP):       ~$10"
echo "Cognito (Free Tier):      $0 (up to 50K MAU)"
echo "KMS:                      ~$1"
echo "CloudWatch:               ~$3"
echo "--------------------------------"
echo "Total Infrastructure:     ~$25/month"
echo ""
echo "Note: Actual costs depend on usage patterns."
echo "Lambda, Bedrock, and other compute costs are additional."

echo ""
echo "=========================================="
echo "✓ Validation Complete"
echo "=========================================="
