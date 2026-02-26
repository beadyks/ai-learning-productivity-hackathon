#!/bin/bash

# Validation script for API Orchestration implementation
# Checks that all required components are properly implemented

echo "=========================================="
echo "API Orchestration Implementation Validation"
echo "=========================================="
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

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found directory: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing directory: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check if string exists in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing '$2' in $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check if function is exported
check_export() {
    if grep -q "export.*$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Function '$2' is exported in $1"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Function '$2' may not be exported in $1"
        ((WARNINGS++))
        return 1
    fi
}

echo "Checking API Orchestrator..."
echo "----------------------------"
check_directory "lambda/api-orchestrator"
check_file "lambda/api-orchestrator/index.ts"
check_file "lambda/api-orchestrator/package.json"
check_content "lambda/api-orchestrator/index.ts" "checkRateLimit"
check_content "lambda/api-orchestrator/index.ts" "validateRequest"
check_content "lambda/api-orchestrator/index.ts" "routeRequest"
check_content "lambda/api-orchestrator/index.ts" "RATE_LIMITS"
check_export "lambda/api-orchestrator/index.ts" "handler"
echo ""

echo "Checking Conversation Orchestrator..."
echo "--------------------------------------"
check_directory "lambda/conversation-orchestrator"
check_file "lambda/conversation-orchestrator/index.ts"
check_file "lambda/conversation-orchestrator/package.json"
check_content "lambda/conversation-orchestrator/index.ts" "ConversationState"
check_content "lambda/conversation-orchestrator/index.ts" "handleMessage"
check_content "lambda/conversation-orchestrator/index.ts" "handleConfirmationResponse"
check_content "lambda/conversation-orchestrator/index.ts" "detectIntent"
check_content "lambda/conversation-orchestrator/index.ts" "CONFIRMATION_KEYWORDS"
check_export "lambda/conversation-orchestrator/index.ts" "handler"
echo ""

echo "Checking Response Quality Optimizer..."
echo "---------------------------------------"
check_directory "lambda/response-quality-optimizer"
check_file "lambda/response-quality-optimizer/index.ts"
check_file "lambda/response-quality-optimizer/package.json"
check_content "lambda/response-quality-optimizer/index.ts" "optimizeResponse"
check_content "lambda/response-quality-optimizer/index.ts" "simplifyComplexTerms"
check_content "lambda/response-quality-optimizer/index.ts" "extractAndFormatCode"
check_content "lambda/response-quality-optimizer/index.ts" "generateExamples"
check_content "lambda/response-quality-optimizer/index.ts" "generateAnalogies"
check_content "lambda/response-quality-optimizer/index.ts" "calculateReadabilityScore"
check_export "lambda/response-quality-optimizer/index.ts" "handler"
echo ""

echo "Checking Infrastructure Integration..."
echo "--------------------------------------"
check_file "infrastructure/stacks/voice-learning-assistant-stack.ts"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "apiOrchestratorFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "conversationOrchestratorFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "responseQualityOptimizerFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "rateLimitsTable"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "createApiOrchestratorLambda"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "createConversationOrchestratorLambda"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "createResponseQualityOptimizerLambda"
echo ""

echo "Checking Documentation..."
echo "-------------------------"
check_file "lambda/api-orchestration/README.md"
check_content "lambda/api-orchestration/README.md" "API Orchestrator"
check_content "lambda/api-orchestration/README.md" "Conversation Orchestrator"
check_content "lambda/api-orchestration/README.md" "Response Quality Optimizer"
check_content "lambda/api-orchestration/README.md" "Rate Limiting"
check_content "lambda/api-orchestration/README.md" "11.1"
check_content "lambda/api-orchestration/README.md" "3.4"
check_content "lambda/api-orchestration/README.md" "3.1"
echo ""

echo "Checking TypeScript Configuration..."
echo "------------------------------------"
if [ -f "lambda/tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} Found TypeScript configuration"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} TypeScript configuration not found at lambda/tsconfig.json"
    ((WARNINGS++))
fi
echo ""

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Install dependencies: cd lambda/api-orchestrator && npm install"
    echo "2. Install dependencies: cd lambda/conversation-orchestrator && npm install"
    echo "3. Install dependencies: cd lambda/response-quality-optimizer && npm install"
    echo "4. Deploy infrastructure: cd infrastructure && npm run deploy"
    echo "5. Test API endpoints using the HTTP API URL from CloudFormation outputs"
    exit 0
else
    echo -e "${RED}✗ Validation failed with $FAILED error(s)${NC}"
    echo "Please fix the errors above before deploying."
    exit 1
fi
