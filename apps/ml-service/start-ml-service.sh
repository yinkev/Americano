#!/bin/bash
# Americano ML Service Startup Script
# Starts the ML service with proper environment setup

set -e

echo "Starting Americano ML Service..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found. Please create it from .env.example"
    exit 1
fi

# Install/update dependencies
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

echo ""
echo "Starting Uvicorn server..."
echo "API: http://localhost:8000"
echo "Docs: http://localhost:8000/docs"
echo "Health: http://localhost:8000/health"
echo ""

# Start uvicorn
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
