#!/bin/bash

# Americano Services Health Check (soft playful)
# Verifies that both Next.js and FastAPI services are running

set -e

# Colors for output
GREEN='\033[1;92m'
RED='\033[1;91m'
BLUE='\033[1;94m'
CYAN='\033[1;96m'
HL_CYAN='\033[1;30;106m'
NC='\033[0m' # No Color

echo -e "${CYAN}[ ${WHITE}Americano Health Check${CYAN} ]${NC}"

# Check Next.js
echo -e "${BLUE}🔎 Next.js${NC}  http://localhost:3000"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js is running${NC}"
    NEXT_STATUS="ok"
else
    echo -e "${RED}❌ Next.js is NOT running${NC}"
    NEXT_STATUS="fail"
fi

# Check FastAPI
echo -e "${BLUE}🔎 FastAPI${NC} http://localhost:8000"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FastAPI is running${NC}"
    FASTAPI_STATUS="ok"
else
    echo -e "${RED}❌ FastAPI is NOT running${NC}"
    FASTAPI_STATUS="fail"
fi

echo ""

# Summary
if [ "$NEXT_STATUS" = "ok" ] && [ "$FASTAPI_STATUS" = "ok" ]; then
    echo -e "${GREEN}🎉 All good — happy studying!${NC}"
    echo ""
    echo "Frontend:    http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "API Docs:    http://localhost:8000/docs"
    echo ""
    exit 0
else
    echo -e "${RED}=== Some services are not running ===${NC}"
    echo ""
    if [ "$NEXT_STATUS" = "fail" ]; then
        echo -e "${YELLOW}Next.js not running. Start with:${NC}"
        echo "  npm run dev:web-only"
    fi
    if [ "$FASTAPI_STATUS" = "fail" ]; then
        echo -e "${YELLOW}FastAPI not running. Start with:${NC}"
        echo "  npm run dev:ml-only"
    fi
    echo ""
    echo -e "${CYAN}To start both services:${NC}"
    echo "  make up"
    echo ""
    exit 1
fi
