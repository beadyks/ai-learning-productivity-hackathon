#!/bin/bash

# AI Learning Assistant - Startup Script
# This script starts the full development environment

echo "🚀 Starting AI Learning Assistant..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --no-bin-links
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
fi

echo "🌐 Starting development servers..."
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Mock API will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers
npm run dev:full
