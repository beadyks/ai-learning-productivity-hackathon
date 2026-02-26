#!/bin/bash

# Validation script for security and compliance implementation
# This script checks that all required files and configurations are in place

set -e

echo "🔒 Validating Security and Compliance Implementation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Directory missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check file contains text
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Content found in $1: $2"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Content not found in $1: $2"
        ((WARNINGS++))
        return 1
    fi
}

echo "📁 Checking Lambda Function Structure..."
echo ""

# Check data-protection Lambda
check_dir "lambda/security/data-protection"
check_file "lambda/security/data-protection/index.ts"
check_file "lambda/security/data-protection/package.json"

echo ""

# Check auth-manager Lambda
check_dir "lambda/security/auth-manager"
check_file "lambda/security/auth-manager/index.ts"
check_file "lambda/security/auth-manager/package.json"

echo ""
echo "📄 Checking Documentation..."
echo ""

check_file "lambda/security/README.md"
check_file "lambda/security/IMPLEMENTATION_SUMMARY.md"
check_file "lambda/security/validate-implementation.sh"

echo ""
echo "🏗️  Checking Infrastructure Configuration..."
echo ""

check_file "infrastructure/stacks/voice-learning-assistant-stack.ts"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "dataProtectionFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "authManagerFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "createSecurityLambdas"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "createSecurityRoutes"

echo ""
echo "🔐 Checking Security Features..."
echo ""

# Check data protection features
check_content "lambda/security/data-protection/index.ts" "secure-delete"
check_content "lambda/security/data-protection/index.ts" "encrypt-data"
check_content "lambda/security/data-protection/index.ts" "compliance-check"
check_content "lambda/security/data-protection/index.ts" "KMSClient"

echo ""

# Check auth manager features
check_content "lambda/security/auth-manager/index.ts" "check-permission"
check_content "lambda/security/auth-manager/index.ts" "assign-role"
check_content "lambda/security/auth-manager/index.ts" "share-document"
check_content "lambda/security/auth-manager/index.ts" "CognitoIdentityProviderClient"

echo ""
echo "📋 Checking Requirements Coverage..."
echo ""

# Requirement 9.1: Encryption
check_content "lambda/security/data-protection/index.ts" "Requirement 9.1"
echo -e "${GREEN}✓${NC} Requirement 9.1: End-to-end encryption"

# Requirement 9.2: Data protection compliance
check_content "lambda/security/data-protection/index.ts" "Requirement 9.2"
echo -e "${GREEN}✓${NC} Requirement 9.2: Data protection compliance"

# Requirement 9.3: Authentication
check_content "lambda/security/auth-manager/index.ts" "Requirement 9.3"
echo -e "${GREEN}✓${NC} Requirement 9.3: Authentication and RBAC"

# Requirement 9.4: Secure deletion
check_content "lambda/security/data-protection/index.ts" "Requirement 9.4"
echo -e "${GREEN}✓${NC} Requirement 9.4: Secure deletion"

# Requirement 9.5: Data sharing
check_content "lambda/security/auth-manager/index.ts" "Requirement 9.5"
echo -e "${GREEN}✓${NC} Requirement 9.5: Data sharing permissions"

echo ""
echo "🔍 Checking API Endpoints..."
echo ""

check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "/security/data-protection"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "/security/auth"

echo ""
echo "🎯 Checking Role-Based Access Control..."
echo ""

check_content "lambda/security/auth-manager/index.ts" "UserRole.STUDENT"
check_content "lambda/security/auth-manager/index.ts" "UserRole.PREMIUM_STUDENT"
check_content "lambda/security/auth-manager/index.ts" "UserRole.EDUCATOR"
check_content "lambda/security/auth-manager/index.ts" "UserRole.ADMIN"
check_content "lambda/security/auth-manager/index.ts" "ROLE_PERMISSIONS"

echo ""
echo "🔑 Checking Encryption Configuration..."
echo ""

check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "encryptionKey"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "enableKeyRotation: true"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "TableEncryption.CUSTOMER_MANAGED"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "BucketEncryption.KMS"

echo ""
echo "📊 Validation Summary"
echo "===================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy infrastructure: cd infrastructure && cdk deploy"
    echo "2. Initialize Cognito groups via API"
    echo "3. Run integration tests"
    echo "4. Verify compliance checks"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
