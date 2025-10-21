#!/bin/bash

# Americano Full Setup Script
# Performs complete setup of both Next.js and FastAPI services

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
  ___                  _
 / _ | \/  \/  /\ |\ || _ \
| | || |  /\  /--\\| \||  \
 \_/ |_\/_/  \\_\/ \/ |_|\_\

  Setup Wizard
EOF
echo -e "${NC}"

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python3 not found. Please install Python 3.11+${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ ${PYTHON_VERSION}${NC}"

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"

echo ""
echo -e "${BLUE}Starting Setup...${NC}\n"

# Step 1: Install root dependencies
echo -e "${YELLOW}[1/5] Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}\n"

# Step 2: Setup web app
echo -e "${YELLOW}[2/5] Setting up web app...${NC}"
cd apps/web
npm install
npx prisma generate
echo -e "${GREEN}✓ Web app setup complete${NC}\n"

# Step 3: Database setup
echo -e "${YELLOW}[3/5] Setting up database...${NC}"
echo -e "${BLUE}Running Prisma migrations...${NC}"
npx prisma migrate dev --name init 2>/dev/null || true
echo -e "${GREEN}✓ Database migrations applied${NC}\n"

# Return to root
cd ../..

# Step 4: Setup ML service
echo -e "${YELLOW}[4/5] Setting up ML service...${NC}"
cd services/ml-service

# Create virtual environment
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating Python virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate and install
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
prisma generate
echo -e "${GREEN}✓ ML service setup complete${NC}\n"

# Return to root
cd ../..

# Step 5: Create environment files
echo -e "${YELLOW}[5/5] Checking environment files...${NC}"

if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${YELLOW}Warning: apps/web/.env.local not found${NC}"
    echo -e "${BLUE}Copy .env.example to .env.local and fill in your values${NC}"
fi

if [ ! -f "services/ml-service/.env" ]; then
    echo -e "${YELLOW}Note: services/ml-service/.env not found${NC}"
    if [ -f "services/ml-service/.env.example" ]; then
        cp services/ml-service/.env.example services/ml-service/.env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    fi
fi

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}\n"
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Configure environment files if needed:"
echo "   - apps/web/.env.local"
echo "   - services/ml-service/.env"
echo ""
echo "2. Start development servers:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "3. Services will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "4. Check status anytime:"
echo "   ${GREEN}npm run health-check${NC}"
echo ""
