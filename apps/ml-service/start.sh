#!/bin/bash
# Quick start script for Americano ML Service

set -e

echo "🚀 Starting Americano ML Service..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please edit it with your DATABASE_URL before continuing."
    echo ""
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    echo "✅ Dependencies installed"
fi

# Generate Prisma client if needed
if [ ! -d "node_modules" ]; then
    echo "🔧 Generating Prisma client..."
    prisma generate
    echo "✅ Prisma client generated"
fi

echo ""
echo "✨ Starting FastAPI server..."
echo "📍 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "❤️  Health: http://localhost:8000/health"
echo ""

# Start uvicorn
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
