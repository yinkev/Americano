#!/bin/bash

# ML Service Setup Script
# Sets up just the FastAPI ML service

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== ML Service Setup ===${NC}\n"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python3 not found. Please install Python 3.11+${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ ${PYTHON_VERSION}${NC}\n"

cd services/ml-service

# Create virtual environment
echo -e "${YELLOW}Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate and install
source venv/bin/activate

echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Generate Prisma Client
echo -e "${YELLOW}Generating Prisma Client...${NC}"
if command -v prisma &> /dev/null; then
    prisma generate
    echo -e "${GREEN}✓ Prisma Client generated${NC}\n"
else
    echo -e "${YELLOW}Note: Prisma CLI not found. Run from web app:${NC}"
    echo "  cd apps/web && npx prisma generate"
    echo -e "${NC}"
fi

# Setup environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file from .env.example${NC}\n"
    fi
fi

echo -e "${GREEN}=== ML Service Setup Complete ===${NC}\n"
echo -e "${YELLOW}To start the service:${NC}"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo -e "${YELLOW}Or from root:${NC}"
echo "  npm run dev:ml-only"
echo ""
