#!/bin/bash

# Validation script for Session Management implementation
# This script checks that all required files and components are in place

echo "==================================="
echo "Session Management Validation"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_PASSED=true

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        VALIDATION_PASSED=false
    fi
}

# Function to check if directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found directory: $1"
    else
        echo -e "${RED}✗${NC} Missing directory: $1"
        VALIDATION_PASSED=false
    fi
}

echo "Checking Session Management Structure..."
echo ""

# Check directories
check_directory "lambda/session-management"
check_directory "lambda/session-management/session-persistence"
check_directory "lambda/session-management/context-manager"

echo ""
echo "Checking Session Persistence Files..."
echo ""

# Check session persistence files
check_file "lambda/session-management/session-persistence/index.ts"
check_file "lambda/session-management/session-persistence/package.json"

echo ""
echo "Checking Context Manager Files..."
echo ""

# Check context manager files
check_file "lambda/session-management/context-manager/index.ts"
check_file "lambda/session-management/context-manager/package.json"

echo ""
echo "Checking Documentation..."
echo ""

# Check documentation
check_file "lambda/session-management/README.md"
check_file "lambda/session-management/IMPLEMENTATION_SUMMARY.md"

echo ""
echo "Checking Infrastructure Integration..."
echo ""

# Check if infrastructure stack includes session management
if grep -q "sessionPersistenceFunction" infrastructure/stacks/voice-learning-assistant-stack.ts; then
    echo -e "${GREEN}✓${NC} Session persistence function defined in infrastructure"
else
    echo -e "${RED}✗${NC} Session persistence function not found in infrastructure"
    VALIDATION_PASSED=false
fi

if grep -q "contextManagerFunction" infrastructure/stacks/voice-learning-assistant-stack.ts; then
    echo -e "${GREEN}✓${NC} Context manager function defined in infrastructure"
else
    echo -e "${RED}✗${NC} Context manager function not found in infrastructure"
    VALIDATION_PASSED=false
fi

if grep -q "createSessionManagementLambdas" infrastructure/stacks/voice-learning-assistant-stack.ts; then
    echo -e "${GREEN}✓${NC} Session management Lambda creation method exists"
else
    echo -e "${RED}✗${NC} Session management Lambda creation method not found"
    VALIDATION_PASSED=false
fi

if grep -q "createSessionManagementRoutes" infrastructure/stacks/voice-learning-assistant-stack.ts; then
    echo -e "${GREEN}✓${NC} Session management API routes method exists"
else
    echo -e "${RED}✗${NC} Session management API routes method not found"
    VALIDATION_PASSED=false
fi

echo ""
echo "Checking Code Quality..."
echo ""

# Check for key functions in session persistence
if grep -q "createSession" lambda/session-management/session-persistence/index.ts; then
    echo -e "${GREEN}✓${NC} createSession function implemented"
else
    echo -e "${RED}✗${NC} createSession function not found"
    VALIDATION_PASSED=false
fi

if grep -q "getSession" lambda/session-management/session-persistence/index.ts; then
    echo -e "${GREEN}✓${NC} getSession function implemented"
else
    echo -e "${RED}✗${NC} getSession function not found"
    VALIDATION_PASSED=false
fi

if grep -q "updateSession" lambda/session-management/session-persistence/index.ts; then
    echo -e "${GREEN}✓${NC} updateSession function implemented"
else
    echo -e "${RED}✗${NC} updateSession function not found"
    VALIDATION_PASSED=false
fi

if grep -q "restoreLatestSession" lambda/session-management/session-persistence/index.ts; then
    echo -e "${GREEN}✓${NC} restoreLatestSession function implemented"
else
    echo -e "${RED}✗${NC} restoreLatestSession function not found"
    VALIDATION_PASSED=false
fi

# Check for key functions in context manager
if grep -q "addConversationTurn" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} addConversationTurn function implemented"
else
    echo -e "${RED}✗${NC} addConversationTurn function not found"
    VALIDATION_PASSED=false
fi

if grep -q "switchMode" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} switchMode function implemented"
else
    echo -e "${RED}✗${NC} switchMode function not found"
    VALIDATION_PASSED=false
fi

if grep -q "switchTopic" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} switchTopic function implemented"
else
    echo -e "${RED}✗${NC} switchTopic function not found"
    VALIDATION_PASSED=false
fi

if grep -q "getConversationContext" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} getConversationContext function implemented"
else
    echo -e "${RED}✗${NC} getConversationContext function not found"
    VALIDATION_PASSED=false
fi

echo ""
echo "Checking Requirements Coverage..."
echo ""

# Check requirements comments
if grep -q "5.1" lambda/session-management/session-persistence/index.ts; then
    echo -e "${GREEN}✓${NC} Requirement 5.1 (session restoration) referenced"
else
    echo -e "${YELLOW}⚠${NC} Requirement 5.1 not explicitly referenced"
fi

if grep -q "5.4" lambda/session-management/session-persistence/index.ts; then
    echo -e "${GREEN}✓${NC} Requirement 5.4 (data persistence) referenced"
else
    echo -e "${YELLOW}⚠${NC} Requirement 5.4 not explicitly referenced"
fi

if grep -q "4.4" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} Requirement 4.4 (context across modes) referenced"
else
    echo -e "${YELLOW}⚠${NC} Requirement 4.4 not explicitly referenced"
fi

if grep -q "5.2" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} Requirement 5.2 (conversation history) referenced"
else
    echo -e "${YELLOW}⚠${NC} Requirement 5.2 not explicitly referenced"
fi

if grep -q "5.3" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} Requirement 5.3 (follow-up questions) referenced"
else
    echo -e "${YELLOW}⚠${NC} Requirement 5.3 not explicitly referenced"
fi

if grep -q "5.5" lambda/session-management/context-manager/index.ts; then
    echo -e "${GREEN}✓${NC} Requirement 5.5 (topic threads) referenced"
else
    echo -e "${YELLOW}⚠${NC} Requirement 5.5 not explicitly referenced"
fi

echo ""
echo "==================================="
if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo "==================================="
    exit 0
else
    echo -e "${RED}✗ Some validations failed${NC}"
    echo "==================================="
    exit 1
fi
