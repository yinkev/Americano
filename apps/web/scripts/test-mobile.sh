#!/bin/bash

# Story 3.6 - Mobile Interface E2E Test Execution Script
# This script runs all mobile test suites for AC8 validation

set -e

echo "=========================================="
echo "Story 3.6 - Mobile Interface E2E Tests"
echo "AC8: Mobile-optimized search interface"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "playwright.config.ts" ]; then
    echo -e "${RED}Error: Must run from apps/web directory${NC}"
    exit 1
fi

# Function to run a specific test suite
run_suite() {
    local suite_name=$1
    local file_path=$2

    echo -e "${YELLOW}Running: ${suite_name}${NC}"
    echo "File: ${file_path}"
    echo ""

    if pnpm playwright test "${file_path}" --reporter=list; then
        echo -e "${GREEN}✅ ${suite_name} - PASSED${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ ${suite_name} - FAILED${NC}"
        echo ""
        return 1
    fi
}

# Check for command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: ./scripts/test-mobile.sh [options]"
    echo ""
    echo "Options:"
    echo "  --all          Run all mobile test suites (default)"
    echo "  --responsive   Run only responsive design tests"
    echo "  --voice        Run only voice search tests"
    echo "  --offline      Run only offline capabilities tests"
    echo "  --performance  Run only performance tests"
    echo "  --touch        Run only touch interaction tests"
    echo "  --pwa          Run only PWA feature tests"
    echo "  --ui           Run with Playwright UI mode"
    echo "  --headed       Run in headed mode (show browser)"
    echo "  --help, -h     Show this help message"
    echo ""
    exit 0
fi

# Parse arguments
UI_MODE=""
HEADED_MODE=""
TEST_SUITE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --ui)
            UI_MODE="--ui"
            shift
            ;;
        --headed)
            HEADED_MODE="--headed"
            shift
            ;;
        --responsive)
            TEST_SUITE="responsive"
            shift
            ;;
        --voice)
            TEST_SUITE="voice"
            shift
            ;;
        --offline)
            TEST_SUITE="offline"
            shift
            ;;
        --performance)
            TEST_SUITE="performance"
            shift
            ;;
        --touch)
            TEST_SUITE="touch"
            shift
            ;;
        --pwa)
            TEST_SUITE="pwa"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Run tests based on selection
case $TEST_SUITE in
    responsive)
        run_suite "Responsive Design Tests" "e2e/mobile/responsive-design.spec.ts"
        ;;
    voice)
        run_suite "Voice Search Tests" "e2e/mobile/voice-search.spec.ts"
        ;;
    offline)
        run_suite "Offline Capabilities Tests" "e2e/mobile/offline-capabilities.spec.ts"
        ;;
    performance)
        run_suite "Mobile Performance Tests" "e2e/mobile/mobile-performance.spec.ts"
        ;;
    touch)
        run_suite "Touch Interactions Tests" "e2e/mobile/touch-interactions.spec.ts"
        ;;
    pwa)
        run_suite "PWA Features Tests" "e2e/mobile/pwa-features.spec.ts"
        ;;
    all)
        echo "Running all mobile test suites..."
        echo ""

        FAILED=0

        run_suite "1/6 - Responsive Design" "e2e/mobile/responsive-design.spec.ts" || FAILED=1
        run_suite "2/6 - Voice Search" "e2e/mobile/voice-search.spec.ts" || FAILED=1
        run_suite "3/6 - Offline Capabilities" "e2e/mobile/offline-capabilities.spec.ts" || FAILED=1
        run_suite "4/6 - Mobile Performance" "e2e/mobile/mobile-performance.spec.ts" || FAILED=1
        run_suite "5/6 - Touch Interactions" "e2e/mobile/touch-interactions.spec.ts" || FAILED=1
        run_suite "6/6 - PWA Features" "e2e/mobile/pwa-features.spec.ts" || FAILED=1

        echo "=========================================="
        echo "Test Execution Complete"
        echo "=========================================="
        echo ""

        if [ $FAILED -eq 0 ]; then
            echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
            echo -e "${GREEN}AC8 FULLY VALIDATED${NC}"
            echo ""
            echo "Test Report: /TEST-REPORT-STORY-3.6-AC8.md"
            echo "Test Documentation: /apps/web/e2e/mobile/README.md"
            echo ""
            exit 0
        else
            echo -e "${RED}❌ SOME TESTS FAILED${NC}"
            echo ""
            echo "Please review test output above for details."
            echo "Test Report: /TEST-REPORT-STORY-3.6-AC8.md"
            echo ""
            exit 1
        fi
        ;;
esac

echo ""
echo "To view HTML report:"
echo "  pnpm playwright show-report"
echo ""
