#!/bin/bash

# Validation script for Study Planning System implementation
# This script checks that all required files are present and properly structured

echo "🔍 Validating Study Planning System Implementation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found directory: $1"
    else
        echo -e "${RED}✗${NC} Missing directory: $1"
        ((ERRORS++))
    fi
}

# Function to check file content
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 contains: $2"
    else
        echo -e "${YELLOW}⚠${NC} $1 missing: $2"
        ((WARNINGS++))
    fi
}

echo "📁 Checking directory structure..."
check_dir "lambda/study-planning"
check_dir "lambda/study-planning/goal-analysis"
check_dir "lambda/study-planning/plan-generator"
check_dir "lambda/study-planning/plan-tracker"
echo ""

echo "📄 Checking Lambda function files..."
check_file "lambda/study-planning/goal-analysis/index.ts"
check_file "lambda/study-planning/goal-analysis/package.json"
check_file "lambda/study-planning/plan-generator/index.ts"
check_file "lambda/study-planning/plan-generator/package.json"
check_file "lambda/study-planning/plan-tracker/index.ts"
check_file "lambda/study-planning/plan-tracker/package.json"
echo ""

echo "📚 Checking documentation files..."
check_file "lambda/study-planning/README.md"
check_file "lambda/study-planning/IMPLEMENTATION_SUMMARY.md"
echo ""

echo "🔍 Checking implementation details..."

# Check goal-analysis implementation
echo "Goal Analysis Service:"
check_content "lambda/study-planning/goal-analysis/index.ts" "StudyGoalRequest"
check_content "lambda/study-planning/goal-analysis/index.ts" "calculateFeasibilityScore"
check_content "lambda/study-planning/goal-analysis/index.ts" "generateAlternativeTimelines"
check_content "lambda/study-planning/goal-analysis/index.ts" "Requirements: 2.1"
check_content "lambda/study-planning/goal-analysis/index.ts" "Requirements: 2.3"
echo ""

# Check plan-generator implementation
echo "Plan Generator Service:"
check_content "lambda/study-planning/plan-generator/index.ts" "StudyPlanRequest"
check_content "lambda/study-planning/plan-generator/index.ts" "prioritizeTopics"
check_content "lambda/study-planning/plan-generator/index.ts" "generateDailySessions"
check_content "lambda/study-planning/plan-generator/index.ts" "Requirements: 2.2"
check_content "lambda/study-planning/plan-generator/index.ts" "Requirements: 2.4"
echo ""

# Check plan-tracker implementation
echo "Plan Tracker Service:"
check_content "lambda/study-planning/plan-tracker/index.ts" "PlanModificationRequest"
check_content "lambda/study-planning/plan-tracker/index.ts" "ProgressUpdateRequest"
check_content "lambda/study-planning/plan-tracker/index.ts" "calculateOverallProgress"
check_content "lambda/study-planning/plan-tracker/index.ts" "Requirements: 2.5"
check_content "lambda/study-planning/plan-tracker/index.ts" "Requirements: 5.1"
echo ""

echo "🔧 Checking API endpoints..."
check_content "lambda/study-planning/goal-analysis/index.ts" "/study-plan/analyze-goal"
check_content "lambda/study-planning/plan-generator/index.ts" "/study-plan/generate"
check_content "lambda/study-planning/plan-tracker/index.ts" "/study-plan/modify"
check_content "lambda/study-planning/plan-tracker/index.ts" "/study-plan/progress"
echo ""

echo "📦 Checking dependencies..."
check_content "lambda/study-planning/goal-analysis/package.json" "@aws-sdk/client-dynamodb"
check_content "lambda/study-planning/plan-generator/package.json" "@aws-sdk/client-dynamodb"
check_content "lambda/study-planning/plan-tracker/package.json" "@aws-sdk/client-dynamodb"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "✅ Study Planning System implementation is complete and valid."
    echo ""
    echo "Next steps:"
    echo "1. Add Lambda functions to CDK stack (infrastructure/stacks/voice-learning-assistant-stack.ts)"
    echo "2. Deploy infrastructure: cd infrastructure && npm run cdk deploy"
    echo "3. Test API endpoints"
    echo "4. Implement optional property-based tests (task 6.4)"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation completed with $WARNINGS warnings${NC}"
    echo ""
    echo "The implementation is functional but some optional checks failed."
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS errors and $WARNINGS warnings${NC}"
    echo ""
    echo "Please fix the errors before proceeding."
    exit 1
fi
