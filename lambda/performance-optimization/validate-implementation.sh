#!/bin/bash

# Validation script for Performance Optimization implementation
# This script checks that all required components are properly implemented

echo "=========================================="
echo "Performance Optimization Validation"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
ERRORS=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found directory: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing directory: $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check for required content in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Missing '$2' in $1"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo "1. Checking directory structure..."
echo "-----------------------------------"
check_directory "lambda/performance-optimization"
check_directory "lambda/performance-optimization/bandwidth-optimizer"
check_directory "lambda/performance-optimization/error-handler"
echo ""

echo "2. Checking Bandwidth Optimizer files..."
echo "-----------------------------------"
check_file "lambda/performance-optimization/bandwidth-optimizer/index.ts"
check_file "lambda/performance-optimization/bandwidth-optimizer/package.json"
echo ""

echo "3. Checking Error Handler files..."
echo "-----------------------------------"
check_file "lambda/performance-optimization/error-handler/index.ts"
check_file "lambda/performance-optimization/error-handler/package.json"
echo ""

echo "4. Checking documentation..."
echo "-----------------------------------"
check_file "lambda/performance-optimization/README.md"
check_file "lambda/performance-optimization/IMPLEMENTATION_SUMMARY.md"
echo ""

echo "5. Validating Bandwidth Optimizer implementation..."
echo "-----------------------------------"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "compressResponse"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "selectCompressionAlgorithm"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "chunkContent"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "OfflineCacheManager"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "progressive"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "cache-set"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "cache-get"
echo ""

echo "6. Validating Error Handler implementation..."
echo "-----------------------------------"
check_content "lambda/performance-optimization/error-handler/index.ts" "CircuitBreaker"
check_content "lambda/performance-optimization/error-handler/index.ts" "GracefulDegradationManager"
check_content "lambda/performance-optimization/error-handler/index.ts" "formatErrorResponse"
check_content "lambda/performance-optimization/error-handler/index.ts" "ServiceUnavailableError"
check_content "lambda/performance-optimization/error-handler/index.ts" "TimeoutError"
check_content "lambda/performance-optimization/error-handler/index.ts" "ValidationError"
check_content "lambda/performance-optimization/error-handler/index.ts" "CircuitState"
echo ""

echo "7. Checking requirements coverage..."
echo "-----------------------------------"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "Requirements: 8.1, 8.4"
check_content "lambda/performance-optimization/error-handler/index.ts" "Requirements: 1.4, 1.5, 4.5, 8.5"
echo ""

echo "8. Checking compression algorithms..."
echo "-----------------------------------"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "gzip"
check_content "lambda/performance-optimization/bandwidth-optimizer/index.ts" "brotli"
echo ""

echo "9. Checking error types coverage..."
echo "-----------------------------------"
check_content "lambda/performance-optimization/error-handler/index.ts" "unsupported file format"
check_content "lambda/performance-optimization/error-handler/index.ts" "file too large"
check_content "lambda/performance-optimization/error-handler/index.ts" "extraction failed"
check_content "lambda/performance-optimization/error-handler/index.ts" "transcription failed"
check_content "lambda/performance-optimization/error-handler/index.ts" "audio quality"
echo ""

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Implementation is complete and ready for deployment."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation completed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Implementation is functional but some optional items are missing."
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors before deployment."
    exit 1
fi
