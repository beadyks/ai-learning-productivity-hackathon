#!/bin/bash

# Content Indexing Property Tests Runner
# This script sets up and runs the property-based tests for content indexing

set -e

echo "========================================="
echo "Content Indexing Property Tests"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "Please install npm"
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run the tests
echo "🧪 Running property-based tests..."
echo "   - 100 iterations per property"
echo "   - Testing cross-document search"
echo "   - Testing metadata preservation"
echo "   - Testing chunk completeness"
echo "   - Testing embedding consistency"
echo ""

npm test

echo ""
echo "========================================="
echo "✅ All tests completed!"
echo "========================================="
