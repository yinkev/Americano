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

export PATH="$HOME/.local/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  echo "📦 Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

if [ ! -d ".venv" ]; then
  echo "📦 Creating Python 3.11 venv (uv)..."
  uv venv --python 3.11 .venv
  echo "✅ Virtual environment created"
fi

source .venv/bin/activate

# Install dependencies if needed
echo "📦 Installing dependencies..."
if command -v uv >/dev/null 2>&1; then
  uv pip install -r requirements.txt
else
  python -m pip install --upgrade pip
  pip install -r requirements.txt
fi
echo "✅ Dependencies installed"

# Generate Prisma client if needed
# Generate Prisma client is managed from apps/web; skip here

echo ""
echo "✨ Starting FastAPI server..."
echo "📍 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo "❤️  Health: http://localhost:8000/health"
echo ""

# Start uvicorn
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
