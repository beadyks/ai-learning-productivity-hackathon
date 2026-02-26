#!/bin/bash

# System Validation Script
# Validates the complete Voice-First AI Learning Assistant system

set -e

echo "=========================================="
echo "Voice-First AI Learning Assistant"
echo "Complete System Validation"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "  $message"
    fi
}

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_status "PASS" "$description: $file"
        return 0
    else
        print_status "FAIL" "$description: $file (NOT FOUND)"
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        print_status "PASS" "$description: $dir"
        return 0
    else
        print_status "FAIL" "$description: $dir (NOT FOUND)"
        return 1
    fi
}

echo "1. Infrastructure Validation"
echo "----------------------------"

# Check CDK infrastructure files
check_file "infrastructure/app.ts" "CDK App"
check_file "infrastructure/stacks/voice-learning-assistant-stack.ts" "Main Stack"
check_file "infrastructure/stacks/cicd-pipeline-stack.ts" "CI/CD Stack"
check_file "cdk.json" "CDK Configuration"

echo ""
echo "2. Lambda Functions Validation"
echo "------------------------------"

# Document Processing
check_directory "lambda/document-processing/upload-handler" "Upload Handler"
check_directory "lambda/document-processing/text-extraction" "Text Extraction"
check_directory "lambda/document-processing/content-chunking" "Content Chunking"
check_directory "lambda/document-processing/upload-progress" "Upload Progress"

# Voice Processing
check_directory "lambda/voice-processing/speech-to-text" "Speech-to-Text"
check_directory "lambda/voice-processing/text-to-speech" "Text-to-Speech"
check_directory "lambda/voice-processing/voice-orchestrator" "Voice Orchestrator"

# AI Response
check_directory "lambda/ai-response/response-generator" "Response Generator"
check_directory "lambda/ai-response/mode-controller" "Mode Controller"
check_directory "lambda/ai-response/semantic-search" "Semantic Search"

# Study Planning
check_directory "lambda/study-planning/goal-analysis" "Goal Analysis"
check_directory "lambda/study-planning/plan-generator" "Plan Generator"
check_directory "lambda/study-planning/plan-tracker" "Plan Tracker"

# Session Management
check_directory "lambda/session-management/session-persistence" "Session Persistence"
check_directory "lambda/session-management/context-manager" "Context Manager"

# Multilingual
check_directory "lambda/multilingual/language-detector" "Language Detector"
check_directory "lambda/multilingual/response-formatter" "Response Formatter"

# Security
check_directory "lambda/security/auth-manager" "Auth Manager"
check_directory "lambda/security/data-protection" "Data Protection"

# Performance
check_directory "lambda/performance-optimization/bandwidth-optimizer" "Bandwidth Optimizer"
check_directory "lambda/performance-optimization/error-handler" "Error Handler"

# API Orchestration
check_directory "lambda/api-orchestrator" "API Orchestrator"
check_directory "lambda/conversation-orchestrator" "Conversation Orchestrator"
check_directory "lambda/response-quality-optimizer" "Response Quality Optimizer"

echo ""
echo "3. Testing Infrastructure"
echo "------------------------"

# Integration tests
check_file "tests/integration/user-journey.test.ts" "User Journey Tests"
check_file "tests/integration/cross-service.test.ts" "Cross-Service Tests"
check_file "tests/integration/error-handling.test.ts" "Error Handling Tests"
check_file "tests/integration/package.json" "Integration Test Config"

# Property-based tests
check_file "lambda/document-processing/content-chunking/index.test.ts" "Content Chunking PBT"

echo ""
echo "4. Configuration Files"
echo "---------------------"

check_file "package.json" "Root Package Config"
check_file "tsconfig.json" "TypeScript Config"
check_file "lambda/tsconfig.json" "Lambda TypeScript Config"

echo ""
echo "5. CI/CD Pipeline"
echo "----------------"

check_file "buildspec.yml" "Build Spec"
check_file "buildspec-test.yml" "Test Build Spec"
check_file "buildspec-deploy.yml" "Deploy Build Spec"
check_file "scripts/setup-pipeline.sh" "Pipeline Setup Script"
check_file "scripts/health-check.js" "Health Check Script"
check_file "scripts/smoke-test.js" "Smoke Test Script"
check_file "scripts/blue-green-swap.js" "Blue-Green Swap Script"

echo ""
echo "6. Documentation"
echo "---------------"

check_file "README.md" "Main README"
check_file "DEPLOYMENT.md" "Deployment Guide"
check_file "CI-CD.md" "CI/CD Documentation"
check_file "QUICK_DEPLOY.md" "Quick Deploy Guide"
check_file "infrastructure/README.md" "Infrastructure README"
check_file "infrastructure/ARCHITECTURE.md" "Architecture Documentation"
check_file "tests/TESTING_CHECKLIST.md" "Testing Checklist"

echo ""
echo "7. Spec Files"
echo "------------"

check_file ".kiro/specs/voice-first-ai-learning-assistant/requirements.md" "Requirements"
check_file ".kiro/specs/voice-first-ai-learning-assistant/design.md" "Design"
check_file ".kiro/specs/voice-first-ai-learning-assistant/tasks.md" "Tasks"

echo ""
echo "8. Lambda Function Implementation Check"
echo "---------------------------------------"

# Count Lambda functions with index.ts
LAMBDA_COUNT=$(find lambda -name "index.ts" -not -path "*/node_modules/*" | wc -l)
print_status "PASS" "Found $LAMBDA_COUNT Lambda function implementations"

# Check for package.json in Lambda functions
PACKAGE_COUNT=$(find lambda -name "package.json" -not -path "*/node_modules/*" | wc -l)
print_status "PASS" "Found $PACKAGE_COUNT Lambda package.json files"

echo ""
echo "9. Code Quality Checks"
echo "---------------------"

# Check for TypeScript files
TS_FILES=$(find lambda infrastructure -name "*.ts" -not -path "*/node_modules/*" -not -name "*.test.ts" | wc -l)
if [ $TS_FILES -gt 0 ]; then
    print_status "PASS" "Found $TS_FILES TypeScript source files"
else
    print_status "FAIL" "No TypeScript source files found"
fi

# Check for test files
TEST_FILES=$(find . -name "*.test.ts" -not -path "*/node_modules/*" | wc -l)
if [ $TEST_FILES -gt 0 ]; then
    print_status "PASS" "Found $TEST_FILES test files"
else
    print_status "WARN" "No test files found"
fi

echo ""
echo "10. Implementation Summary Files"
echo "-------------------------------"

# Check for implementation summaries
IMPL_SUMMARIES=$(find lambda -name "IMPLEMENTATION_SUMMARY.md" | wc -l)
if [ $IMPL_SUMMARIES -gt 0 ]; then
    print_status "PASS" "Found $IMPL_SUMMARIES implementation summaries"
else
    print_status "WARN" "No implementation summaries found"
fi

# Check for task completion reports
TASK_REPORTS=$(find lambda -name "TASK_COMPLETION_REPORT.md" | wc -l)
if [ $TASK_REPORTS -gt 0 ]; then
    print_status "PASS" "Found $TASK_REPORTS task completion reports"
else
    print_status "WARN" "No task completion reports found"
fi

echo ""
echo "11. Deployment Scripts"
echo "---------------------"

check_file "infrastructure/deploy.sh" "Deployment Script"
check_file "infrastructure/validate.sh" "Validation Script"
check_file "infrastructure/cost-monitor.sh" "Cost Monitor Script"

# Check if scripts are executable
if [ -x "infrastructure/deploy.sh" ]; then
    print_status "PASS" "Deploy script is executable"
else
    print_status "WARN" "Deploy script is not executable"
fi

echo ""
echo "12. Configuration Files"
echo "----------------------"

check_file "infrastructure/config/dev.json" "Dev Configuration"
check_file "infrastructure/config/prod.json" "Prod Configuration"

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo ""
echo "Total Checks:   $TOTAL_CHECKS"
echo -e "${GREEN}Passed:         $PASSED_CHECKS${NC}"
echo -e "${RED}Failed:         $FAILED_CHECKS${NC}"
echo -e "${YELLOW}Warnings:       $WARNINGS${NC}"
echo ""

# Calculate success rate
if [ $TOTAL_CHECKS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "Success Rate:   $SUCCESS_RATE%"
    echo ""
fi

# Determine overall status
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ System validation PASSED${NC}"
    echo ""
    echo "All critical components are in place."
    echo "The system is ready for deployment."
    exit 0
elif [ $FAILED_CHECKS -lt 5 ]; then
    echo -e "${YELLOW}⚠ System validation PASSED with warnings${NC}"
    echo ""
    echo "Most components are in place, but some issues were found."
    echo "Review the failed checks above before deployment."
    exit 0
else
    echo -e "${RED}✗ System validation FAILED${NC}"
    echo ""
    echo "Critical components are missing or misconfigured."
    echo "Please address the failed checks before deployment."
    exit 1
fi
