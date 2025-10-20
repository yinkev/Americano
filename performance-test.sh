#!/bin/bash

# Epic 5 Performance Testing Script
# Research-Grade Performance Validation

echo "================================================"
echo "Epic 5 Performance Testing - API Response Times"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test API endpoint with timing
time_request() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local data=${4:-}
  local target_ms=$5

  echo -n "Testing: $name... "

  if [ "$method" = "POST" ]; then
    if [ -n "$data" ]; then
      result=$(curl -X POST -H "Content-Type: application/json" -d "$data" -o /dev/null -s -w "%{time_total},%{http_code}" "$url" 2>/dev/null)
    else
      result=$(curl -X POST -o /dev/null -s -w "%{time_total},%{http_code}" "$url" 2>/dev/null)
    fi
  else
    result=$(curl -o /dev/null -s -w "%{time_total},%{http_code}" "$url" 2>/dev/null)
  fi

  time_total=$(echo $result | cut -d',' -f1)
  status_code=$(echo $result | cut -d',' -f2)
  time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)

  # Determine pass/fail
  if [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
    if [ $time_ms -le $target_ms ]; then
      echo -e "${GREEN}✅ PASS${NC} | ${time_ms}ms (target: <${target_ms}ms) | HTTP $status_code"
      echo "$name,$time_ms,$target_ms,PASS,$status_code" >> /tmp/epic5_perf_results.csv
    else
      echo -e "${YELLOW}⚠️  SLOW${NC} | ${time_ms}ms (target: <${target_ms}ms) | HTTP $status_code"
      echo "$name,$time_ms,$target_ms,SLOW,$status_code" >> /tmp/epic5_perf_results.csv
    fi
  else
    echo -e "${RED}❌ FAIL${NC} | ${time_ms}ms | HTTP $status_code"
    echo "$name,$time_ms,$target_ms,FAIL,$status_code" >> /tmp/epic5_perf_results.csv
  fi
}

# Initialize results file
echo "Endpoint,Time(ms),Target(ms),Status,HTTP Code" > /tmp/epic5_perf_results.csv

echo "Starting API Performance Tests..."
echo ""

# Story 5.1: Learning Pattern Recognition and Analysis
echo "=== Story 5.1: Pattern Analysis ==="
time_request "Behavioral Patterns" "http://localhost:3000/api/analytics/patterns?userId=user-kevy" GET "" 2000
time_request "All Patterns" "http://localhost:3000/api/analytics/patterns/all?userId=user-kevy" GET "" 2000
time_request "Learning Insights" "http://localhost:3000/api/analytics/insights?userId=user-kevy" GET "" 2000
time_request "Learning Profile" "http://localhost:3000/api/analytics/learning-profile?userId=user-kevy" GET "" 200
time_request "Stress Patterns" "http://localhost:3000/api/analytics/stress-patterns?userId=user-kevy" GET "" 200
time_request "Study Time Heatmap" "http://localhost:3000/api/analytics/study-time-heatmap?userId=user-kevy" GET "" 200
echo ""

# Story 5.2: Predictive Struggle Detection
echo "=== Story 5.2: Predictions ==="
time_request "Get Predictions" "http://localhost:3000/api/analytics/predictions?userId=user-kevy" GET "" 1000
time_request "Interventions List" "http://localhost:3000/api/analytics/interventions?userId=user-kevy" GET "" 200
time_request "Model Performance" "http://localhost:3000/api/analytics/model-performance" GET "" 200
time_request "Struggle Reduction" "http://localhost:3000/api/analytics/struggle-reduction?userId=user-kevy" GET "" 200
echo ""

# Story 5.3: Intelligent Study Orchestration
echo "=== Story 5.3: Orchestration ==="
time_request "Cognitive Load" "http://localhost:3000/api/analytics/cognitive-load/current?userId=user-kevy" GET "" 200
time_request "Cognitive Load History" "http://localhost:3000/api/analytics/cognitive-load/history?userId=user-kevy" GET "" 200
time_request "Orchestration Recommendations" "http://localhost:3000/api/orchestration/recommendations?userId=user-kevy" GET "" 200
time_request "Session Plan" "http://localhost:3000/api/orchestration/session-plan?userId=user-kevy" GET "" 200
echo ""

# Story 5.4: Mission Reflection System
echo "=== Story 5.4: Missions ==="
time_request "Mission Summary" "http://localhost:3000/api/analytics/missions/summary?userId=user-kevy" GET "" 200
time_request "Mission Trends" "http://localhost:3000/api/analytics/missions/trends?userId=user-kevy" GET "" 200
time_request "Mission Correlation" "http://localhost:3000/api/analytics/missions/correlation?userId=user-kevy" GET "" 200
echo ""

# Story 5.5: Continuous Personalization
echo "=== Story 5.5: Personalization ==="
time_request "Personalization Config" "http://localhost:3000/api/personalization/config?userId=user-kevy" GET "" 200
time_request "Personalization Effectiveness" "http://localhost:3000/api/personalization/effectiveness?userId=user-kevy" GET "" 200
time_request "Personalization Preferences" "http://localhost:3000/api/personalization/preferences?userId=user-kevy" GET "" 200
echo ""

# Story 5.6: Behavioral Insights Dashboard
echo "=== Story 5.6: Insights Dashboard ==="
time_request "Dashboard Data" "http://localhost:3000/api/analytics/behavioral-insights/dashboard?userId=user-kevy" GET "" 3000
time_request "Goals List" "http://localhost:3000/api/analytics/behavioral-insights/goals?userId=user-kevy" GET "" 200
time_request "Recommendations" "http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=user-kevy" GET "" 200
time_request "Pattern Evolution" "http://localhost:3000/api/analytics/behavioral-insights/patterns/evolution?userId=user-kevy" GET "" 200
time_request "Performance Correlation" "http://localhost:3000/api/analytics/behavioral-insights/correlation?userId=user-kevy" GET "" 200
echo ""

echo "================================================"
echo "API Performance Test Complete"
echo "================================================"
echo ""
echo "Results saved to: /tmp/epic5_perf_results.csv"
echo ""

# Calculate summary statistics
total_tests=$(tail -n +2 /tmp/epic5_perf_results.csv | wc -l)
passed=$(tail -n +2 /tmp/epic5_perf_results.csv | grep -c "PASS")
slow=$(tail -n +2 /tmp/epic5_perf_results.csv | grep -c "SLOW")
failed=$(tail -n +2 /tmp/epic5_perf_results.csv | grep -c "FAIL")

echo "Summary:"
echo "--------"
echo "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Slow: ${YELLOW}$slow${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

# Calculate average response time
avg_time=$(tail -n +2 /tmp/epic5_perf_results.csv | cut -d',' -f2 | awk '{sum+=$1} END {print sum/NR}')
echo "Average Response Time: ${avg_time}ms"
