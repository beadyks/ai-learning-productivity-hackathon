#!/bin/bash

# Fix GitHub Authentication
# This script helps you authenticate with GitHub properly

set -e

echo "🔐 GitHub Authentication Fix"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}GitHub no longer accepts passwords for git operations.${NC}"
echo "You need to use either:"
echo "  1. GitHub CLI (gh) - Recommended ✅"
echo "  2. Personal Access Token (PAT)"
echo ""

# Check if gh is installed
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI is already installed${NC}"
    echo ""
else
    echo -e "${YELLOW}📦 Installing GitHub CLI...${NC}"
    
    # Install gh based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        type -p curl >/dev/null || sudo apt install curl -y
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh -y
        echo -e "${GREEN}✅ GitHub CLI installed${NC}"
    else
        echo -e "${RED}Please install GitHub CLI manually:${NC}"
        echo "Visit: https://cli.github.com/manual/installation"
        exit 1
    fi
    echo ""
fi

# Login to GitHub
echo -e "${BLUE}🔑 Logging in to GitHub...${NC}"
echo ""
echo "This will open a browser window for authentication."
echo "Follow these steps:"
echo "  1. Press Enter to continue"
echo "  2. Browser will open with a code"
echo "  3. Confirm the code matches"
echo "  4. Click 'Authorize github'"
echo "  5. Return here when done"
echo ""
read -p "Press Enter to start GitHub authentication..."
echo ""

# Run gh auth login
gh auth login

echo ""
echo -e "${GREEN}✅ GitHub authentication complete!${NC}"
echo ""

# Verify authentication
echo -e "${YELLOW}🔍 Verifying authentication...${NC}"
if gh auth status; then
    echo ""
    echo -e "${GREEN}✅✅✅ SUCCESS! You're authenticated with GitHub! ✅✅✅${NC}"
    echo ""
    echo "🎉 You can now push to GitHub!"
    echo ""
    echo "Run this command to push your code:"
    echo -e "${BLUE}  ./PUSH_NOW.sh${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Authentication verification failed${NC}"
    echo "Please try again or use a Personal Access Token"
    echo ""
    exit 1
fi
