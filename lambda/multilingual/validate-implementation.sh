#!/bin/bash

# Multilingual Support Implementation Validation Script
# This script validates the multilingual support implementation

# Don't exit on error - we want to count all failures
set +e

echo "=========================================="
echo "Multilingual Support Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation results
PASSED=0
FAILED=0

# Function to check if a file exists
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

# Function to check if a directory exists
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

# Function to check if a string exists in a file
check_content() {
    if grep -q "$2" "$1"; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Missing '$2' in $1"
        ((FAILED++))
        return 1
    fi
}

echo "1. Checking Directory Structure..."
echo "-----------------------------------"
check_directory "lambda/multilingual"
check_directory "lambda/multilingual/language-detector"
check_directory "lambda/multilingual/response-formatter"
echo ""

echo "2. Checking Language Detector Files..."
echo "---------------------------------------"
check_file "lambda/multilingual/language-detector/index.ts"
check_file "lambda/multilingual/language-detector/package.json"
echo ""

echo "3. Checking Response Formatter Files..."
echo "----------------------------------------"
check_file "lambda/multilingual/response-formatter/index.ts"
check_file "lambda/multilingual/response-formatter/package.json"
echo ""

echo "4. Checking Documentation..."
echo "-----------------------------"
check_file "lambda/multilingual/README.md"
check_file "lambda/multilingual/IMPLEMENTATION_SUMMARY.md"
echo ""

echo "5. Validating Language Detector Implementation..."
echo "--------------------------------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "detectLanguage"
check_content "lambda/multilingual/language-detector/index.ts" "countDevanagariCharacters"
check_content "lambda/multilingual/language-detector/index.ts" "detectHinglishPatterns"
check_content "lambda/multilingual/language-detector/index.ts" "switchLanguage"
check_content "lambda/multilingual/language-detector/index.ts" "LanguageCode.HINDI"
check_content "lambda/multilingual/language-detector/index.ts" "LanguageCode.HINGLISH"
echo ""

echo "6. Validating Response Formatter Implementation..."
echo "---------------------------------------------------"
check_content "lambda/multilingual/response-formatter/index.ts" "formatResponse"
check_content "lambda/multilingual/response-formatter/index.ts" "extractTechnicalTerms"
check_content "lambda/multilingual/response-formatter/index.ts" "translateTechnicalTerm"
check_content "lambda/multilingual/response-formatter/index.ts" "applyLanguageSpecificFormatting"
check_content "lambda/multilingual/response-formatter/index.ts" "technicalTermPreference"
echo ""

echo "7. Checking Requirements Coverage..."
echo "-------------------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "Requirements: 6.1"
check_content "lambda/multilingual/language-detector/index.ts" "Requirements: 6.2"
check_content "lambda/multilingual/language-detector/index.ts" "Requirements: 6.5"
check_content "lambda/multilingual/response-formatter/index.ts" "Requirements: 6.3"
check_content "lambda/multilingual/response-formatter/index.ts" "Requirements: 6.4"
echo ""

echo "8. Checking API Endpoints..."
echo "-----------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "/language/detect"
check_content "lambda/multilingual/language-detector/index.ts" "/language/switch"
check_content "lambda/multilingual/language-detector/index.ts" "/language/current"
check_content "lambda/multilingual/response-formatter/index.ts" "/format/response"
check_content "lambda/multilingual/response-formatter/index.ts" "/format/preferences"
check_content "lambda/multilingual/response-formatter/index.ts" "/format/translate-term"
echo ""

echo "9. Checking Error Handling..."
echo "------------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "try {" 
check_content "lambda/multilingual/language-detector/index.ts" "catch (error)"
check_content "lambda/multilingual/response-formatter/index.ts" "try {"
check_content "lambda/multilingual/response-formatter/index.ts" "catch (error)"
echo ""

echo "10. Checking DynamoDB Integration..."
echo "-------------------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "DynamoDBClient"
check_content "lambda/multilingual/language-detector/index.ts" "GetCommand"
check_content "lambda/multilingual/language-detector/index.ts" "UpdateCommand"
check_content "lambda/multilingual/response-formatter/index.ts" "DynamoDBClient"
check_content "lambda/multilingual/response-formatter/index.ts" "PutCommand"
echo ""

echo "11. Checking TypeScript Types..."
echo "---------------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "interface LanguageDetectionRequest"
check_content "lambda/multilingual/language-detector/index.ts" "interface LanguageDetectionResponse"
check_content "lambda/multilingual/language-detector/index.ts" "interface LanguageSwitchRequest"
check_content "lambda/multilingual/response-formatter/index.ts" "interface ResponseFormattingRequest"
check_content "lambda/multilingual/response-formatter/index.ts" "interface TechnicalTerm"
check_content "lambda/multilingual/response-formatter/index.ts" "interface LanguagePreference"
echo ""

echo "12. Checking Language Support..."
echo "---------------------------------"
check_content "lambda/multilingual/language-detector/index.ts" "ENGLISH"
check_content "lambda/multilingual/language-detector/index.ts" "HINDI"
check_content "lambda/multilingual/language-detector/index.ts" "HINGLISH"
echo ""

echo "13. Checking Technical Term Translations..."
echo "--------------------------------------------"
check_content "lambda/multilingual/response-formatter/index.ts" "function"
check_content "lambda/multilingual/response-formatter/index.ts" "variable"
check_content "lambda/multilingual/response-formatter/index.ts" "array"
check_content "lambda/multilingual/response-formatter/index.ts" "loop"
check_content "lambda/multilingual/response-formatter/index.ts" "algorithm"
echo ""

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Install dependencies: cd lambda/multilingual/language-detector && npm install"
    echo "2. Install dependencies: cd lambda/multilingual/response-formatter && npm install"
    echo "3. Run TypeScript compilation: npm run build"
    echo "4. Deploy to AWS: cd infrastructure && npm run deploy"
    echo "5. Run integration tests"
    exit 0
else
    echo -e "${RED}✗ Some validations failed. Please review the errors above.${NC}"
    exit 1
fi
