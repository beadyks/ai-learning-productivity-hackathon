#!/bin/bash

# Voice-First AI Learning Assistant - GitHub Push Script
# This script helps you push your code to GitHub

set -e  # Exit on error

echo "🚀 Voice-First AI Learning Assistant - GitHub Push Script"
echo "=========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    echo "Install git first:"
    echo "  Ubuntu/Debian: sudo apt install git"
    echo "  macOS: brew install git"
    echo "  Windows: Download from https://git-scm.com/"
    exit 1
fi

echo -e "${GREEN}✅ Git is installed${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Git repository already initialized${NC}"
    echo ""
fi

# Check if remote is configured
if ! git remote | grep -q "origin"; then
    echo -e "${YELLOW}🔗 Adding remote repository...${NC}"
    git remote add origin https://github.com/beadyks/ai-learning-productivity-hackathon.git
    echo -e "${GREEN}✅ Remote repository added${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Remote repository already configured${NC}"
    REMOTE_URL=$(git remote get-url origin)
    echo "   Remote URL: $REMOTE_URL"
    echo ""
fi

# Check git configuration
if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
    echo -e "${YELLOW}⚙️  Git user not configured${NC}"
    echo "Please configure git:"
    echo "  git config --global user.name \"Your Name\""
    echo "  git config --global user.email \"your.email@example.com\""
    echo ""
    read -p "Press Enter to continue after configuring git..."
fi

echo -e "${GREEN}✅ Git user configured${NC}"
echo "   Name: $(git config user.name)"
echo "   Email: $(git config user.email)"
echo ""

# Show current status
echo -e "${YELLOW}📊 Current git status:${NC}"
git status --short
echo ""

# Ask for confirmation
echo -e "${YELLOW}📝 This will:${NC}"
echo "   1. Add all files to git"
echo "   2. Create a commit"
echo "   3. Push to GitHub"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
fi

# Add all files
echo -e "${YELLOW}📦 Adding files to git...${NC}"
git add .
echo -e "${GREEN}✅ Files added${NC}"
echo ""

# Create commit
echo -e "${YELLOW}💬 Creating commit...${NC}"
COMMIT_MESSAGE="Complete Voice-First AI Learning Assistant implementation

- 30 Lambda functions implemented
- Infrastructure deployed (DynamoDB, S3, Cognito, API Gateway)
- 98% cost reduction achieved
- Multilingual support (Hindi/English/Hinglish)
- Voice-first interaction
- Complete documentation
- CI/CD pipeline configured
- Ready for deployment

Cost: ₹8-15 per student per month
Target: Make AI education accessible at ₹49-99/month"

git commit -m "$COMMIT_MESSAGE"
echo -e "${GREEN}✅ Commit created${NC}"
echo ""

# Set main branch
echo -e "${YELLOW}🌿 Setting main branch...${NC}"
git branch -M main
echo -e "${GREEN}✅ Main branch set${NC}"
echo ""

# Push to GitHub
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
echo "   This may take a few minutes..."
echo ""

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo "🎉 Your code is now on GitHub!"
    echo ""
    echo "📍 Repository URL:"
    echo "   https://github.com/beadyks/ai-learning-productivity-hackathon"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Visit your repository on GitHub"
    echo "   2. Add repository description and topics"
    echo "   3. Enable GitHub Pages (optional)"
    echo "   4. Add demo video link to README"
    echo "   5. Submit to hackathon"
    echo ""
    echo "📚 See GITHUB_SETUP.md for more details"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Push failed${NC}"
    echo ""
    echo "Common issues:"
    echo "   1. Authentication failed - Set up GitHub credentials"
    echo "   2. Repository doesn't exist - Create it on GitHub first"
    echo "   3. Permission denied - Check repository access"
    echo ""
    echo "For help, see: https://docs.github.com/en/get-started/getting-started-with-git"
    exit 1
fi
