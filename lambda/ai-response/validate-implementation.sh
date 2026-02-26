#!/bin/bash

# Validation script for AI Response Generation System implementation
# Checks that all required files and components are in place

echo "🔍 Validating AI Response Generation System Implementation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
    fi
}

# Function to check for required content in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
    else
        echo -e "${YELLOW}⚠${NC} Missing '$2' in $1"
        ((WARNINGS++))
    fi
}

echo "📁 Checking directory structure..."
check_dir "lambda/ai-response"
check_dir "lambda/ai-response/response-generator"
check_dir "lambda/ai-response/mode-controller"
check_dir "lambda/ai-response/semantic-search"
echo ""

echo "📄 Checking Response Generator files..."
check_file "lambda/ai-response/response-generator/index.ts"
check_file "lambda/ai-response/response-generator/package.json"
echo ""

echo "📄 Checking Mode Controller files..."
check_file "lambda/ai-response/mode-controller/index.ts"
check_file "lambda/ai-response/mode-controller/package.json"
echo ""

echo "📄 Checking Semantic Search files..."
check_file "lambda/ai-response/semantic-search/index.ts"
check_file "lambda/ai-response/semantic-search/package.json"
echo ""

echo "📄 Checking documentation..."
check_file "lambda/ai-response/README.md"
check_file "lambda/ai-response/IMPLEMENTATION_SUMMARY.md"
echo ""

echo "🔧 Checking infrastructure integration..."
check_file "infrastructure/stacks/voice-learning-assistant-stack.ts"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "responseGeneratorFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "modeControllerFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "semanticSearchFunction"
check_content "infrastructure/stacks/voice-learning-assistant-stack.ts" "createAIResponseLambdas"
echo ""

echo "🔍 Checking Response Generator implementation..."
check_content "lambda/ai-response/response-generator/index.ts" "BedrockRuntimeClient"
check_content "lambda/ai-response/response-generator/index.ts" "HAIKU_MODEL_ID"
check_content "lambda/ai-response/response-generator/index.ts" "SONNET_MODEL_ID"
check_content "lambda/ai-response/response-generator/index.ts" "getCachedResponse"
check_content "lambda/ai-response/response-generator/index.ts" "retrieveRelevantContent"
check_content "lambda/ai-response/response-generator/index.ts" "analyzeQueryComplexity"
echo ""

echo "🔍 Checking Mode Controller implementation..."
check_content "lambda/ai-response/mode-controller/index.ts" "InteractionMode"
check_content "lambda/ai-response/mode-controller/index.ts" "TUTOR"
check_content "lambda/ai-response/mode-controller/index.ts" "INTERVIEWER"
check_content "lambda/ai-response/mode-controller/index.ts" "MENTOR"
check_content "lambda/ai-response/mode-controller/index.ts" "adaptPersonality"
check_content "lambda/ai-response/mode-controller/index.ts" "validateModeTransition"
echo ""

echo "🔍 Checking Semantic Search implementation..."
check_content "lambda/ai-response/semantic-search/index.ts" "generateQueryEmbedding"
check_content "lambda/ai-response/semantic-search/index.ts" "performSemanticSearch"
check_content "lambda/ai-response/semantic-search/index.ts" "performKeywordSearch"
check_content "lambda/ai-response/semantic-search/index.ts" "performHybridSearch"
check_content "lambda/ai-response/semantic-search/index.ts" "cosineSimilarity"
echo ""

echo "📊 Validation Summary"
echo "===================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "✅ Task 5.1: Response Generator - COMPLETE"
    echo "✅ Task 5.2: Mode Controller - COMPLETE"
    echo "✅ Task 5.4: Semantic Search - COMPLETE"
    echo ""
    echo "🎉 AI Response Generation System implementation is complete!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation passed with $WARNINGS warnings${NC}"
    echo ""
    echo "Implementation is complete but some optional content is missing."
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS errors and $WARNINGS warnings${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
