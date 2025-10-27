#!/bin/bash

# Integration Test Verification Script
# Runs each test file individually to verify they work correctly

set -e  # Exit on error

echo "======================================"
echo "Integration Test Verification"
echo "======================================"
echo ""

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to web app directory
cd "$(dirname "$0")/../.."

echo "${YELLOW}Test 1: Hook Integration Test${NC}"
echo "Testing: useStudyOrchestration hook"
echo "--------------------------------------"
npm run test -- __tests__/integration/hooks/use-study-orchestration.test.ts --verbose
if [ $? -eq 0 ]; then
  echo "${GREEN}✓ Hook test passed${NC}"
else
  echo "${RED}✗ Hook test failed${NC}"
  exit 1
fi
echo ""

echo "${YELLOW}Test 2: API Route Integration Test${NC}"
echo "Testing: POST /api/validation/prompts/generate"
echo "--------------------------------------"
npm run test -- __tests__/integration/api-routes/validation-evaluate.test.ts --verbose
if [ $? -eq 0 ]; then
  echo "${GREEN}✓ API route test passed${NC}"
else
  echo "${RED}✗ API route test failed${NC}"
  exit 1
fi
echo ""

echo "${YELLOW}Test 3: Component Integration Test${NC}"
echo "Testing: UnderstandingDashboard component"
echo "--------------------------------------"
npm run test -- __tests__/integration/components/dashboard.test.tsx --verbose
if [ $? -eq 0 ]; then
  echo "${GREEN}✓ Component test passed${NC}"
else
  echo "${RED}✗ Component test failed${NC}"
  exit 1
fi
echo ""

echo "======================================"
echo "${GREEN}All integration tests passed!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review test output above for any warnings"
echo "2. Run tests with coverage: npm run test:coverage"
echo "3. Adapt patterns to your own tests"
echo "4. See README.md for detailed explanations"
