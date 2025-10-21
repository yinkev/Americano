#!/bin/bash

# Test script for weekly pattern analysis cron job
# Story 5.1 Task 10
#
# Usage:
#   chmod +x test.sh
#   ./test.sh [local|production]

# Configuration
LOCAL_URL="http://localhost:3000/api/cron/weekly-pattern-analysis"
PROD_URL="https://your-domain.vercel.app/api/cron/weekly-pattern-analysis"

# Determine which URL to use
ENV=${1:-local}
if [ "$ENV" = "production" ]; then
  URL=$PROD_URL
  echo "Testing PRODUCTION endpoint: $URL"
  echo "⚠️  WARNING: This will trigger real pattern analysis!"
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
else
  URL=$LOCAL_URL
  echo "Testing LOCAL endpoint: $URL"
fi

# Check if CRON_SECRET is set
if [ -n "$CRON_SECRET" ]; then
  echo "Using CRON_SECRET for authentication"
  AUTH_HEADER="-H \"Authorization: Bearer $CRON_SECRET\""
else
  echo "No CRON_SECRET set (skipping authentication)"
  AUTH_HEADER=""
fi

# Test GET request
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing GET request..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$CRON_SECRET" ]; then
  curl -v "$URL" -H "Authorization: Bearer $CRON_SECRET" | jq '.'
else
  curl -v "$URL" | jq '.'
fi

# Test POST request
echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing POST request..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$CRON_SECRET" ]; then
  curl -X POST -v "$URL" -H "Authorization: Bearer $CRON_SECRET" | jq '.'
else
  curl -X POST -v "$URL" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Check your application logs for detailed output:"
echo "  [Cron] Starting weekly pattern analysis job..."
echo "  [Cron] Found X users with behavioral analysis enabled"
echo "  [Cron] Weekly pattern analysis job complete: {...}"
echo ""
