#!/bin/bash

# Americano Services Health Check
# Verifies that both Next.js and FastAPI services are running

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Americano Services Health Check ===${NC}\n"

# Check Next.js
echo "Checking Next.js on http://localhost:3000..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Next.js is running${NC}"
    NEXT_STATUS="ok"
else
    echo -e "${RED}✗ Next.js is NOT running${NC}"
    NEXT_STATUS="fail"
fi

# Check FastAPI
echo "Checking FastAPI on http://localhost:8000..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ FastAPI is running${NC}"
    FASTAPI_STATUS="ok"
else
    echo -e "${RED}✗ FastAPI is NOT running${NC}"
    FASTAPI_STATUS="fail"
fi

echo ""

# Summary
if [ "$NEXT_STATUS" = "ok" ] && [ "$FASTAPI_STATUS" = "ok" ]; then
    echo -e "${GREEN}=== All services running! ===${NC}"
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
    echo -e "${YELLOW}To start both services:${NC}"
    echo "  npm run dev"
    echo ""
    exit 1
fi
