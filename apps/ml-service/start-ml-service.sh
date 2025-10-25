#!/bin/bash
# Americano ML Service Startup Script
# Starts the ML service with proper environment setup

set -e

echo "Starting Americano ML Service..."
echo ""

# Prefer uv-managed Python 3.11 venv
export PATH="$HOME/.local/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

if [ ! -d ".venv" ]; then
  echo "Creating Python 3.11 virtualenv with uv..."
  uv venv --python 3.11 .venv
fi

source .venv/bin/activate

# Export environment
if [ -f ".env" ]; then
  set -a
  source .env
  set +a
fi

# Free port if occupied
if lsof -ti tcp:8000 >/dev/null 2>&1; then
  echo "Freeing port 8000..."
  lsof -ti tcp:8000 | xargs -r kill -9 || true
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found. Please create it from .env.example"
    exit 1
fi

# Install/update dependencies
echo "Installing/updating dependencies..."
if command -v uv >/dev/null 2>&1; then
  uv pip install -r requirements.txt
else
  python -m pip install --upgrade pip
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
