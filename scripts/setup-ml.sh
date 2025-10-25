#!/bin/bash

# ML Service Setup Script
# Ensures Python 3.11+ and sets up a venv via uv (preferred) or python3.11 fallback

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== ML Service Setup (Python 3.11+) ===${NC}\n"

cd apps/ml-service

# Ensure uv is installed (preferred Python manager)
if ! command -v uv >/dev/null 2>&1; then
  echo -e "${YELLOW}Installing uv (lightweight Python manager)...${NC}"
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

# Create virtual environment with Python 3.11 via uv if possible
if command -v uv >/dev/null 2>&1; then
  echo -e "${YELLOW}Creating venv with uv (Python 3.11)...${NC}"
  uv venv --python 3.11 .venv
  # Activate
  # shellcheck disable=SC1091
  source .venv/bin/activate
  echo -e "${GREEN}✓ Venv ready (Python $(python -V))${NC}"
  echo -e "${YELLOW}Installing dependencies with uv pip...${NC}"
  uv pip install -r requirements.txt
else
  # Fallback to python3.11 if available
  if command -v python3.11 >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating venv with python3.11...${NC}"
    python3.11 -m venv .venv
    # shellcheck disable=SC1091
    source .venv/bin/activate
    python -m pip install --upgrade pip
    pip install -r requirements.txt
  else
    echo -e "${RED}✗ Neither uv nor python3.11 is available. Please install one of them.${NC}"
    exit 1
  fi
fi

# Setup environment file
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ Created .env file from .env.example${NC}\n"
fi

echo -e "${GREEN}=== ML Service Setup Complete ===${NC}\n"
echo -e "${YELLOW}To start the service:${NC}"
echo "  source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo ""
echo -e "${YELLOW}Or from root:${NC}"
echo "  npm run dev:ml-only"
echo ""
