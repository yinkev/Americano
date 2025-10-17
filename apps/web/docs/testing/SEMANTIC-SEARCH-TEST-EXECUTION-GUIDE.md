# Semantic Search E2E Test Execution Guide

## Executive Summary

This guide provides step-by-step instructions for executing the comprehensive E2E test suite for semantic search (Story 3.1). The test suite includes 54 tests across Jest integration tests and Playwright browser tests.

**Test Suite**: 54 total tests
- **Jest Integration Tests**: 30 tests (API + Database integration)
- **Playwright Browser Tests**: 24 tests (Full E2E workflow)

**Estimated Execution Time**: 8-12 minutes
**Expected Success Rate**: > 95%

---

## Prerequisites

### 1. Environment Setup

```bash
# Navigate to project
cd /Users/kyin/Projects/Americano-epic3/apps/web

# Verify Node version (should be 18+)
node --version

# Install dependencies
pnpm install

# Update Playwright browsers
npx playwright install
```

### 2. Database Setup

```bash
# Verify Prisma is configured
npx prisma --version

# Generate Prisma Client
npx prisma generate

# Run migrations (if not already done)
npx prisma migrate dev

# Seed test data (optional)
pnpm prisma db seed
```

### 3. Environment Variables

Verify `.env.local` contains:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/americano_dev
GEMINI_API_KEY=your-gemini-api-key
BASE_URL=http://localhost:3000
NODE_ENV=test
```

---

## Running Tests

### Option 1: Run All E2E Tests (Recommended)

```bash
# Run all Playwright E2E tests
pnpm test:e2e

# Expected output:
# ✓ [chromium] Semantic Search E2E Tests
#   ✓ TC-1: Empty search returns no results
#   ✓ TC-2: Valid query returns results
#   ... (24 tests)
```

### Option 2: Run Jest Integration Tests

```bash
# Run all Jest integration tests
pnpm test:integration

# Or specifically semantic search tests
jest --testPathPattern=semantic-search --testPathPattern=e2e
```

### Option 3: Run Specific Test Category

```bash
# Query validation tests only
npx jest --testNamePattern="Query Validation" --detectOpenHandles

# Pagination tests only
npx jest --testNamePattern="Pagination" --detectOpenHandles

# Performance tests only
npx jest --testNamePattern="Performance" --detectOpenHandles

# Error handling tests only
npx jest --testNamePattern="Error Handling" --detectOpenHandles
```

### Option 4: Run with Watch Mode (Development)

```bash
# Jest watch mode
pnpm test:watch -- semantic-search

# Playwright watch mode
pnpm test:e2e -- --workers=1

# In the watch mode, you can:
# Press 'a' to run all tests
# Press 'f' to run only failed tests
# Press 'q' to quit
```

### Option 5: Run with UI (Visual Mode)

```bash
# Playwright Test UI (visual test explorer)
pnpm test:e2e:ui

# This opens an interactive browser showing:
# - Test file structure
# - Individual test cases
# - Real-time execution
# - Browser screenshots
```

### Option 6: Run with Headed Browser (See What's Happening)

```bash
# Run with visible browser windows
pnpm test:e2e:headed

# Watch the tests execute in real Chromium/Firefox browser
```

---

## Detailed Test Execution

### 1. Jest Integration Tests (30 tests)

**File**: `/apps/web/src/app/api/search/__tests__/semantic-search.e2e.test.ts`

```bash
# Run Jest tests with verbose output
jest \
  --testPathPattern=semantic-search.e2e \
  --verbose \
  --collectCoverage \
  --detectOpenHandles

# Run with specific timeout (tests may need longer)
jest \
  --testPathPattern=semantic-search.e2e \
  --testTimeout=30000 \
  --maxWorkers=2
```

**Expected Results**:
```
Test Suites: 7 passed, 7 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        45.234 s
```

**Test Groups**:
1. **Query Validation** (5 tests): TC-1 to TC-5
2. **Response Structure** (5 tests): TC-6 to TC-10
3. **Pagination/Filtering** (5 tests): TC-11 to TC-15
4. **Performance & Cache** (5 tests): TC-16 to TC-20
5. **Error Handling** (5 tests): TC-21 to TC-25
6. **Analytics** (2 tests): TC-26 to TC-27
7. **Advanced Features** (3 tests): TC-28 to TC-30

### 2. Playwright Browser Tests (24 tests)

**File**: `/apps/web/e2e/epic3/semantic-search.e2e.test.ts`

```bash
# Run Playwright tests
npx playwright test e2e/epic3/semantic-search.e2e.test.ts

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run with mobile emulation
npx playwright test --project="iPhone 11"
npx playwright test --project="Pixel 5"
```

**Expected Results**:
```
Running 24 tests using 3 workers

  ✓ Semantic Search E2E Tests (24 tests)
  ✓ Semantic Search Performance Tests (2 tests)
  ✓ Semantic Search Accessibility (2 tests)

48 passed (8.2s)
```

**Test Groups**:
1. **Query Validation** (10 tests): TC-1 to TC-10
2. **Pagination** (2 tests): TC-8, TC-9
3. **Response Structure** (3 tests): TC-3, TC-4, TC-12
4. **Analytics & Tracking** (2 tests): TC-5, TC-6
5. **Performance** (3 tests): TC-7, TC-21, TC-22
6. **Browser UI** (5 tests): TC-16 to TC-20
7. **Accessibility** (2 tests): TC-23, TC-24

---

## Monitoring Test Execution

### Real-Time Monitoring

```bash
# Terminal 1: Start test server
pnpm dev

# Terminal 2: Run tests with output
pnpm test:e2e -- --reporter=list

# Terminal 3: Monitor system resources
watch -n 1 'ps aux | grep node | grep -v grep'
```

### Capture Test Logs

```bash
# Save test output to file
pnpm test:e2e > test-results.log 2>&1

# View logs in real-time
tail -f test-results.log
```

### Generate Coverage Report

```bash
# Generate coverage report
pnpm test:coverage -- --testPathPattern=semantic-search

# View coverage summary
cat coverage/lcov-report/index.html

# View coverage by file
open coverage/lcov-report/index.html
```

---

## Troubleshooting

### Issue: Tests Timeout

**Symptoms**: Tests hang or timeout after 30 seconds

**Solutions**:
```bash
# Increase timeout
jest --testTimeout=60000

# Run with fewer workers
jest --maxWorkers=1

# Check if server is running
curl http://localhost:3000

# Restart server
pkill -f "next dev"
pnpm dev
```

### Issue: Playwright Tests Fail to Start Browser

**Symptoms**: "Browser not found" error

**Solutions**:
```bash
# Reinstall Playwright browsers
npx playwright install --with-deps

# Clear Playwright cache
rm -rf ~/Library/Caches/ms-playwright

# Reinstall and try again
npx playwright install
```

### Issue: Database Connection Failed

**Symptoms**: "Connection to database refused"

**Solutions**:
```bash
# Check if database is running
docker ps | grep postgres

# Start database if needed
docker-compose up -d

# Verify connection string
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin < /dev/null

# Run migrations
npx prisma migrate deploy
```

### Issue: Tests Are Flaky

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
```bash
# Run tests multiple times to detect flakiness
for i in {1..5}; do pnpm test:e2e && echo "Run $i: PASS" || echo "Run $i: FAIL"; done

# Run with explicit seed for reproducibility
jest --seed=12345

# Increase timeout for network-dependent tests
jest --testTimeout=45000
```

### Issue: Rate Limit Errors

**Symptoms**: 429 Too Many Requests errors

**Solutions**:
```bash
# Run tests with delay between requests
jest --runInBand  # Sequential execution

# Reduce concurrency
jest --maxWorkers=1

# Wait between test groups
sleep 60 && pnpm test:e2e
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/semantic-search-tests.yml`:

```yaml
name: Semantic Search E2E Tests

on:
  push:
    branches: [main, feature/**]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: americano_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: |
          npm install -g pnpm
          pnpm install

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Setup database
        run: |
          npx prisma migrate deploy
          npx prisma db seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/americano_test

      - name: Run Jest tests
        run: pnpm test:integration -- semantic-search.e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/americano_test

      - name: Run Playwright tests
        run: pnpm test:e2e -- e2e/epic3/semantic-search.e2e.test.ts
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/americano_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Archive test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            test-results/
            coverage/
```

---

## Test Results Interpretation

### Success Indicators
- ✓ All tests pass (green checkmarks)
- Performance metrics < thresholds
- Code coverage > 90%
- No flaky test failures
- All accessibility checks pass

### Warning Indicators
- ⚠ Tests pass but near timeout (>80% of limit)
- Performance metrics close to threshold
- Coverage between 80-90%
- Occasional flaky failures (<5%)

### Failure Indicators
- ✗ Tests fail consistently
- Performance metrics exceed threshold
- Coverage < 80%
- Accessibility failures
- Database errors
- Connection refused errors

---

## Performance Analysis

### Expected Performance Metrics

| Metric | Target | Acceptable | Investigate |
|--------|--------|------------|-------------|
| Search latency | <800ms | <1000ms | >1000ms |
| Cache hit | <200ms | <300ms | >300ms |
| Result rendering | <500ms | <600ms | >600ms |
| API response | <1000ms | <1200ms | >1200ms |
| Full flow | <2000ms | <2500ms | >2500ms |

### Generate Performance Report

```bash
# Run performance tests with profiling
jest \
  --testNamePattern="Performance" \
  --reporters=default \
  --reporters=json \
  --outputFile=perf-results.json

# Analyze results
node scripts/analyze-performance.js perf-results.json
```

---

## Continuous Monitoring

### Post-Merge Monitoring

After tests pass and code is merged:

1. Monitor production search latency
2. Track error rates
3. Monitor cache hit rates
4. Verify analytics data
5. Monitor database query performance

```bash
# Commands to monitor
curl http://production-api/api/search/metrics
curl http://production-api/api/health
```

---

## Documentation and Reporting

### Generate Test Report

```bash
# HTML test report
jest \
  --testPathPattern=semantic-search \
  --reporters=jest-html-reporters

# Markdown test report
jest \
  --testPathPattern=semantic-search \
  --coverage \
  --coverageReporters=text-summary > TEST_REPORT.md
```

### Share Results

Email template:
```
Subject: Semantic Search E2E Tests - Story 3.1 Complete

Test Results:
- Total Tests: 54
- Passed: 54 (100%)
- Failed: 0
- Skipped: 0
- Duration: 8m 42s

Coverage:
- Statements: 92%
- Branches: 88%
- Functions: 94%
- Lines: 93%

Performance:
- Average search latency: 650ms (target: <1000ms)
- 95th percentile: 920ms
- Cache hit rate: 32%

Files:
- Test Results: test-results.html
- Coverage Report: coverage/index.html
```

---

## Next Steps

After successful test execution:

1. **Code Review**: Submit PR with test results
2. **Merge**: Merge to main branch
3. **Deploy**: Deploy to staging environment
4. **Monitor**: Monitor production metrics
5. **Document**: Update test documentation

---

## Support and Questions

For questions or issues:
- Check SEMANTIC-SEARCH-E2E-TESTING.md for details
- Review test fixtures in semantic-search-fixtures.ts
- Check CI/CD logs for error details
- Contact: QA Team or Kevy

---

**Last Updated**: 2025-10-17
**Guide Version**: 1.0
