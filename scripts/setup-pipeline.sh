#!/bin/bash

# Setup CI/CD Pipeline Script
# Initializes and deploys the CI/CD pipeline for Voice Learning Assistant

set -e

echo "========================================="
echo "Voice Learning Assistant - Pipeline Setup"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not found. Please install it first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install it first."
    exit 1
fi

# Check CDK
if ! command -v cdk &> /dev/null; then
    echo "Installing AWS CDK..."
    npm install -g aws-cdk
fi

echo "✓ Prerequisites check passed"
echo ""

# Get configuration
echo "Pipeline Configuration:"
echo "----------------------"

read -p "GitHub Owner (username/org): " GITHUB_OWNER
read -p "GitHub Repository: " GITHUB_REPO
read -p "GitHub Branch [main]: " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}
read -p "Notification Email: " NOTIFICATION_EMAIL

echo ""
echo "Configuration:"
echo "  GitHub: $GITHUB_OWNER/$GITHUB_REPO@$GITHUB_BRANCH"
echo "  Email: $NOTIFICATION_EMAIL"
echo ""

read -p "Continue with this configuration? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Setup cancelled"
    exit 0
fi

# Check for GitHub token
echo ""
echo "Checking GitHub token in Secrets Manager..."

if aws secretsmanager describe-secret --secret-id github-token &> /dev/null; then
    echo "✓ GitHub token found in Secrets Manager"
else
    echo "GitHub token not found. Please create it:"
    echo ""
    echo "1. Go to GitHub Settings → Developer settings → Personal access tokens"
    echo "2. Generate new token with 'repo' and 'admin:repo_hook' scopes"
    echo "3. Copy the token"
    echo ""
    read -p "Enter GitHub token: " GITHUB_TOKEN
    
    echo "Storing token in Secrets Manager..."
    aws secretsmanager create-secret \
        --name github-token \
        --secret-string "$GITHUB_TOKEN" \
        --description "GitHub token for CI/CD pipeline"
    
    echo "✓ GitHub token stored"
fi

# Bootstrap CDK if needed
echo ""
echo "Checking CDK bootstrap..."

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
AWS_REGION=${AWS_REGION:-us-east-1}

if aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    echo "✓ CDK already bootstrapped"
else
    echo "Bootstrapping CDK..."
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
    echo "✓ CDK bootstrapped"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Build project
echo ""
echo "Building project..."
npm run build
echo "✓ Project built"

# Deploy pipeline
echo ""
echo "Deploying CI/CD pipeline..."
cdk deploy CICDPipelineStack \
    --context githubOwner=$GITHUB_OWNER \
    --context githubRepo=$GITHUB_REPO \
    --context githubBranch=$GITHUB_BRANCH \
    --context notificationEmail=$NOTIFICATION_EMAIL \
    --require-approval never

echo ""
echo "========================================="
echo "Pipeline Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Go to AWS Console → CodePipeline"
echo "2. Find 'VoiceLearningAssistantPipeline'"
echo "3. Push code to trigger the pipeline:"
echo ""
echo "   git add ."
echo "   git commit -m 'Trigger pipeline'"
echo "   git push origin $GITHUB_BRANCH"
echo ""
echo "4. Monitor pipeline execution in AWS Console"
echo "5. Approve production deployment when ready"
echo ""
echo "Pipeline URL:"
echo "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/VoiceLearningAssistantPipeline/view"
echo ""
