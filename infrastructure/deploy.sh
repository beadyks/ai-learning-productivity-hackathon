#!/bin/bash

# Voice-First AI Learning Assistant - Deployment Script
# This script helps deploy the AWS infrastructure using CDK

set -e

echo "=========================================="
echo "Voice-First AI Learning Assistant"
echo "Infrastructure Deployment"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ npm version: $(npm --version)"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI is not installed. It's recommended for deployment."
    echo "   Visit: https://aws.amazon.com/cli/"
else
    echo "✓ AWS CLI version: $(aws --version)"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Check if CDK is installed globally
if ! command -v cdk &> /dev/null; then
    echo ""
    echo "⚠️  AWS CDK is not installed globally."
    echo "   Installing locally..."
    npm install -g aws-cdk
fi

echo "✓ CDK version: $(cdk --version)"

# Check AWS credentials
echo ""
echo "Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✓ AWS credentials configured"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "  Account ID: $ACCOUNT_ID"
else
    echo "❌ AWS credentials not configured."
    echo "   Run: aws configure"
    exit 1
fi

# Set environment variables
export CDK_DEFAULT_ACCOUNT=$ACCOUNT_ID
export CDK_DEFAULT_REGION=${AWS_REGION:-us-east-1}

echo "  Region: $CDK_DEFAULT_REGION"

# Bootstrap CDK (if needed)
echo ""
echo "Checking CDK bootstrap status..."
if aws cloudformation describe-stacks --stack-name CDKToolkit --region $CDK_DEFAULT_REGION &> /dev/null; then
    echo "✓ CDK already bootstrapped"
else
    echo "Bootstrapping CDK..."
    cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
fi

# Synthesize CloudFormation template
echo ""
echo "Synthesizing CloudFormation template..."
npm run synth

# Show diff (if stack exists)
echo ""
echo "Checking for changes..."
if aws cloudformation describe-stacks --stack-name VoiceLearningAssistantStack --region $CDK_DEFAULT_REGION &> /dev/null; then
    echo "Stack exists. Showing differences..."
    cdk diff || true
else
    echo "This is a new stack deployment."
fi

# Deploy
echo ""
read -p "Do you want to deploy the infrastructure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Deploying infrastructure..."
    npm run deploy
    
    echo ""
    echo "=========================================="
    echo "✓ Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "Stack outputs have been saved."
    echo "Check the AWS Console or run:"
    echo "  aws cloudformation describe-stacks --stack-name VoiceLearningAssistantStack --region $CDK_DEFAULT_REGION"
    echo ""
else
    echo ""
    echo "Deployment cancelled."
fi
