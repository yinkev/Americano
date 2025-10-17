#!/bin/bash

################################################################################
# Story 4.4 Task 4: API Endpoints Testing Script
#
# Usage: ./test-calibration-endpoints.sh [base_url]
# Example: ./test-calibration-endpoints.sh http://localhost:3001
#
# Tests all three calibration endpoints:
# 1. POST /api/validation/responses (extended)
# 2. GET /api/calibration/metrics
# 3. GET /api/calibration/peer-comparison
################################################################################

# Configuration
BASE_URL="${1:-http://localhost:3001}"
VERBOSE="${VERBOSE:-1}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test API endpoint with curl
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    echo ""
    log_info "Testing: $description"
    echo "  Endpoint: $method $endpoint"

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi

    # Extract status code (last line)
    status=$(echo "$response" | tail -n 1)
    # Extract body (all but last line)
    body=$(echo "$response" | sed '$d')

    if [ "$status" -eq "$expected_status" ]; then
        log_success "Status: $status (expected $expected_status)"
        if [ "$VERBOSE" -eq 1 ]; then
            echo "  Response:"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
    else
        log_error "Status: $status (expected $expected_status)"
        echo "  Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi

    return 0
}

################################################################################
# Main Test Suite
################################################################################

echo "=================================="
echo "Calibration Endpoints Test Suite"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Test counter
total_tests=0
passed_tests=0

################################################################################
# Test 1: POST /api/validation/responses (with confidence data)
################################################################################

total_tests=$((total_tests + 1))
test_data='{
  "promptId": "clxtest123",
  "sessionId": "clxsess456",
  "userAnswer": "The cardiac cycle consists of systole (ventricular contraction) and diastole (ventricular relaxation). During systole, blood is pumped from the ventricles to the arteries. During diastole, the ventricles fill with blood from the atria.",
  "confidenceLevel": 4,
  "objectiveId": "clxobj789",
  "preAssessmentConfidence": 3,
  "postAssessmentConfidence": 4,
  "confidenceRationale": "I felt more confident after reviewing the prompt",
  "reflectionNotes": "I realized I need to review the valve mechanics more thoroughly"
}'

if test_endpoint "POST" "/api/validation/responses" "$test_data" 200 \
    "Submit validation response with confidence tracking"; then
    passed_tests=$((passed_tests + 1))
else
    log_warn "This may fail if promptId/objectiveId don't exist in database"
fi

################################################################################
# Test 2: GET /api/calibration/metrics (default parameters)
################################################################################

total_tests=$((total_tests + 1))
if test_endpoint "GET" "/api/calibration/metrics" "" 200 \
    "Fetch calibration metrics (default 30 days)"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test 3: GET /api/calibration/metrics (7 days filter)
################################################################################

total_tests=$((total_tests + 1))
if test_endpoint "GET" "/api/calibration/metrics?dateRange=7d" "" 200 \
    "Fetch calibration metrics (last 7 days)"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test 4: GET /api/calibration/metrics (90 days filter)
################################################################################

total_tests=$((total_tests + 1))
if test_endpoint "GET" "/api/calibration/metrics?dateRange=90d" "" 200 \
    "Fetch calibration metrics (last 90 days)"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test 5: GET /api/calibration/metrics (with assessment type filter)
################################################################################

total_tests=$((total_tests + 1))
if test_endpoint "GET" "/api/calibration/metrics?assessmentType=comprehension" "" 200 \
    "Fetch calibration metrics (comprehension only)"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test 6: GET /api/calibration/peer-comparison
################################################################################

total_tests=$((total_tests + 1))
if test_endpoint "GET" "/api/calibration/peer-comparison" "" 200 \
    "Fetch peer comparison data (requires opt-in)"; then
    passed_tests=$((passed_tests + 1))
else
    log_warn "Expected if user hasn't opted-in (status 403) or insufficient peers (status 400)"
fi

################################################################################
# Test 7: POST /api/validation/responses (missing required field)
################################################################################

total_tests=$((total_tests + 1))
invalid_data='{
  "promptId": "clxtest123",
  "userAnswer": "Too short",
  "confidenceLevel": 4,
  "objectiveId": "clxobj789"
}'

if test_endpoint "POST" "/api/validation/responses" "$invalid_data" 400 \
    "Submit invalid response (missing preAssessmentConfidence)"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test 8: POST /api/validation/responses (invalid confidence range)
################################################################################

total_tests=$((total_tests + 1))
invalid_data='{
  "promptId": "clxtest123",
  "userAnswer": "The cardiac cycle consists of systole and diastole phases",
  "confidenceLevel": 6,
  "objectiveId": "clxobj789",
  "preAssessmentConfidence": 6
}'

if test_endpoint "POST" "/api/validation/responses" "$invalid_data" 400 \
    "Submit invalid response (confidence > 5)"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test 9: GET /api/calibration/metrics (invalid date range)
################################################################################

total_tests=$((total_tests + 1))
if test_endpoint "GET" "/api/calibration/metrics?dateRange=invalid" "" 400 \
    "Fetch metrics with invalid dateRange parameter"; then
    passed_tests=$((passed_tests + 1))
fi

################################################################################
# Test Summary
################################################################################

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "Total Tests: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    log_success "All tests passed! ✅"
    exit 0
else
    log_error "Some tests failed. Review output above."
    exit 1
fi
