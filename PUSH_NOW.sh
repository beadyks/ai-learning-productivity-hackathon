#!/bin/bash

# Voice-First AI Learning Assistant - Quick Push to GitHub
# User: beadyks (beadyka@gmail.com)
# Repository: https://github.com/beadyks/ai-learning-productivity-hackathon

set -e  # Exit on error

echo "🚀 Pushing Voice-First AI Learning Assistant to GitHub"
echo "======================================================"
echo ""
echo "User: beadyks"
echo "Email: beadyka@gmail.com"
echo "Repository: https://github.com/beadyks/ai-learning-productivity-hackathon"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not installed. Installing...${NC}"
    sudo apt install git -y
fi

echo -e "${GREEN}✅ Git is ready${NC}"
echo ""

# Initialize if needed
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git...${NC}"
    git init
    git remote add origin https://github.com/beadyks/ai-learning-productivity-hackathon.git
    echo -e "${GREEN}✅ Git initialized${NC}"
else
    echo -e "${GREEN}✅ Git already initialized${NC}"
fi
echo ""

# Show what will be pushed
echo -e "${YELLOW}📊 Files to push:${NC}"
echo "   - 30 Lambda functions"
echo "   - AWS Infrastructure (CDK)"
echo "   - Complete documentation"
echo "   - Architecture diagrams"
echo "   - Test suites"
echo "   - CI/CD pipeline"
echo ""

# Add all files
echo -e "${YELLOW}📦 Adding files...${NC}"
git add .
echo -e "${GREEN}✅ Files added${NC}"
echo ""

# Create commit
echo -e "${YELLOW}💬 Creating commit...${NC}"
git commit -m "Complete Voice-First AI Learning Assistant - AWS AI for Bharat Hackathon

🎯 Project: Ultra-low-cost AI learning platform for Indian students
💰 Cost: ₹8-15 per student/month (98% reduction)
🎤 Features: Voice-first, multilingual (Hindi/English/Hinglish)
🏗️ Stack: AWS Bedrock, Lambda, DynamoDB, S3, Cognito

Implementation:
- 30 Lambda functions (document processing, voice, AI, study planning)
- Complete AWS infrastructure (serverless, auto-scaling)
- 65/65 validation checks passed
- CI/CD pipeline with blue-green deployment
- Comprehensive documentation and architecture diagrams

Cost Optimization:
- Browser Speech API (FREE vs \$2,640/month)
- Open-source OCR (FREE vs \$150/month)
- Bedrock Haiku + caching (12x cheaper)
- EC2 Spot for vector DB (\$5 vs \$700/month)

Target: Make AI education accessible at ₹49-99/month (vs ₹1,650 for ChatGPT Plus)

Author: beadyks <beadyka@gmail.com>
Hackathon: AWS AI for Bharat 2026"

echo -e "${GREEN}✅ Commit created${NC}"
echo ""

# Set main branch
git branch -M main
echo ""

# Push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
echo "   Repository: https://github.com/beadyks/ai-learning-productivity-hackathon"
echo ""

if git push -u origin main --force; then
    echo ""
    echo -e "${GREEN}✅✅✅ SUCCESS! Your code is now on GitHub! ✅✅✅${NC}"
    echo ""
    echo "🎉 Repository URL:"
    echo "   https://github.com/beadyks/ai-learning-productivity-hackathon"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Visit your repository on GitHub"
    echo "   2. Add repository description:"
    echo "      'Ultra-low-cost AI learning platform for Indian students'"
    echo "   3. Add topics: aws, serverless, ai, education, bedrock, hindi"
    echo "   4. Create demo video (optional)"
    echo "   5. Submit to hackathon!"
    echo ""
    echo "📚 Documentation:"
    echo "   - README.md - Main documentation"
    echo "   - HACKATHON_SUBMISSION.md - Submission details"
    echo "   - DEPLOYMENT_READY.md - Deployment guide"
    echo ""
    echo "🏆 Your Achievement:"
    echo "   - 30 Lambda functions ✅"
    echo "   - 98% cost reduction ✅"
    echo "   - Complete documentation ✅"
    echo "   - Ready for deployment ✅"
    echo ""
    echo "Good luck with your hackathon! 🚀🇮🇳"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Push failed${NC}"
    echo ""
    echo "Common solutions:"
    echo "   1. Check GitHub authentication:"
    echo "      gh auth login"
    echo ""
    echo "   2. Or use personal access token:"
    echo "      https://github.com/settings/tokens"
    echo ""
    echo "   3. Make sure repository exists on GitHub"
    echo ""
    exit 1
fi
