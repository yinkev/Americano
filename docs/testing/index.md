---
title: "Testing Documentation Hub - Americano"
description: "Comprehensive testing guide covering test strategies, run commands, coverage targets, and test reports across Epic 3, 4, and 5 implementations"
type: "Testing"
status: "Active"
version: "1.0"

owner: "QA Lead"
dri_backup: "Winston (Architect)"
contributors: ["Testing Team", "Epic Leads"]
review_cadence: "Per Epic"

created_date: "2025-10-23T12:55:00-07:00"
last_updated: "2025-10-23T12:55:00-07:00"
last_reviewed: "2025-10-23T12:55:00-07:00"
next_review_due: "2025-11-23"

depends_on:
  - apps/web/package.json
  - apps/api/pyproject.toml (future)
affects:
  - All code quality and reliability
related_adrs: []

audience:
  - developers
  - qa-engineers
  - testers
technical_level: "Intermediate"
tags: ["testing", "qa", "coverage", "jest", "pytest", "e2e"]
keywords: ["unit tests", "integration tests", "test coverage", "Jest", "pytest", "testing strategy"]
search_priority: "high"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 4000
  reading_time_min: 20
  code_examples: 20
  last_link_check: "2025-10-23T12:55:00-07:00"
  broken_links: 0

changelog:
  - version: "1.0"
    date: "2025-10-23"
    author: "QA Lead"
    changes:
      - "Initial testing documentation hub"
      - "Comprehensive run commands for all apps"
      - "Test reports linked across Epic 3/4/5"
---

# Testing Documentation Hub - Americano

## Overview

This hub centralizes all testing documentation, run commands, test reports, and coverage targets for the Americano adaptive learning platform.

**Testing Philosophy:** Test-driven development (TDD) where appropriate, with focus on critical paths and regression prevention.

---

## Quick Start

### Run All Tests (Root Level)

```bash
# From project root
npm run test:all
```

This runs tests for all applications in sequence.

---

## Testing by Application

### 1. Next.js Web App (TypeScript)

**Location:** `apps/web`
**Framework:** Jest + React Testing Library
**Coverage Target:** 70%+ for critical paths

#### Run Commands

```bash
# Navigate to web app
cd apps/web

# Run all tests
npm test

# Run tests in watch mode (dev)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- ContentChunk.test.ts

# Run tests matching pattern
npm test -- --testPathPattern=validation
```

#### Test Structure

```
apps/web/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       └── Component.test.tsx
│   ├── lib/
│   │   └── __tests__/
│   │       └── utility.test.ts
│   └── subsystems/
│       └── behavioral-analytics/
│           └── __tests__/
│               ├── session-duration-analyzer.test.ts
│               ├── study-time-analyzer.test.ts
│               └── forgetting-curve-analyzer.test.ts
└── jest.config.js
```

#### Coverage Report

```bash
npm run test:coverage

# Output:
# ----------------------------|---------|----------|---------|---------|
# File                        | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------------|---------|----------|---------|---------|
# All files                   |   68.5  |   62.3   |   71.2  |   68.5  |
#  subsystems/behavioral      |   72.1  |   68.5   |   75.3  |   72.1  |
#  components/ui              |   65.3  |   58.2   |   67.4  |   65.3  |
# ----------------------------|---------|----------|---------|---------|
```

---

### 2. FastAPI ML Service (Python)

**Location:** `apps/api` (future)
**Framework:** pytest
**Coverage Target:** 80%+ for ML/stats code

#### Run Commands

```bash
# Navigate to API service
cd apps/api

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Run all tests
pytest

# Run tests with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_irt.py

# Run tests matching pattern
pytest -k "prediction"

# Run with verbose output
pytest -v

# Run tests in parallel (faster)
pytest -n auto
```

#### Test Structure

```
apps/api/
├── src/
│   ├── routes/
│   ├── services/
│   └── models/
├── tests/
│   ├── conftest.py           # Shared fixtures
│   ├── test_irt.py
│   ├── test_predictions.py
│   └── integration/
│       └── test_api_routes.py
└── pytest.ini
```

#### Coverage Report

```bash
pytest --cov=src --cov-report=term-missing

# Output:
# Name                    Stmts   Miss  Cover   Missing
# -----------------------------------------------------
# src/routes/irt.py          45      3    93%   12-14
# src/services/ml.py         67      8    88%   34-41
# -----------------------------------------------------
# TOTAL                     250     18    93%
```

---

### 3. End-to-End Tests (Playwright)

**Location:** `tests/e2e` (future)
**Framework:** Playwright
**Coverage Target:** Critical user flows only

#### Run Commands

```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode (watch browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/login.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# Debug test
npx playwright test --debug
```

#### Test Structure

```
tests/e2e/
├── fixtures/
│   └── auth.ts              # Shared fixtures
├── pages/
│   └── dashboardPage.ts     # Page objects
└── tests/
    ├── login.spec.ts
    ├── semantic-search.spec.ts
    └── behavioral-insights.spec.ts
```

---

## Testing Strategy by Epic

### Epic 3: Adaptive Content Delivery

**Test Coverage:** ~85%
**Test Count:** TBD
**Key Test Files:**
- Semantic search functionality
- Knowledge graph traversal
- First Aid integration

#### Test Reports
- [Story 3.4 Test Summary](./story-3.4-test-summary.md)
- [Story 3.4 Final Validation Report](./story-3.4-FINAL-VALIDATION-REPORT.md)
- [Story 3.6 Test Report](./story-3.6-test-report.md)
- [Story 3.6 Integration Report](./story-3.6-task-4-integration-report.md)

#### Critical Test Cases

**Semantic Search:**
```typescript
// apps/web/src/lib/__tests__/semantic-search.test.ts
describe('Semantic Search', () => {
  it('should return relevant results for medical queries', async () => {
    const results = await semanticSearch('heart failure treatment')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].similarity).toBeGreaterThan(0.8)
  })

  it('should handle synonym queries', async () => {
    const results1 = await semanticSearch('CHF')
    const results2 = await semanticSearch('congestive heart failure')
    expect(results1[0].chunkId).toBe(results2[0].chunkId)
  })
})
```

---

### Epic 4: Understanding Validation Engine

**Test Coverage:** 65%+ (critical paths)
**Test Count:** 65+ tests passing
**Key Test Files:**
- Validation prompt generation
- AI evaluation (mocked)
- Calibration calculations
- Clinical scenario evaluation

#### Test Reports
- [Story 4.1 Testing Checklist](../stories/story-4.1-testing-checklist.md)
- [Story 4.3 Testing Quick Start](../STORY-4.3-TESTING-QUICK-START.md)

#### Critical Test Cases

**Validation Evaluation:**
```typescript
// apps/web/src/app/api/validation/__tests__/evaluate.test.ts
describe('POST /api/validation/evaluate', () => {
  it('should evaluate user explanation with AI', async () => {
    const response = await POST(mockRequest({
      promptId: 'uuid',
      answer: 'Heart failure occurs when...',
      confidence: 4,
    }))

    const result = await response.json()
    expect(result.evaluation.overallScore).toBeGreaterThan(0)
    expect(result.evaluation.overallScore).toBeLessThanOrEqual(100)
    expect(result.evaluation.calibrationDelta).toBeDefined()
  })

  it('should detect overconfidence', async () => {
    const response = await POST(mockRequest({
      promptId: 'uuid',
      answer: 'Short incomplete answer',
      confidence: 5,  // Very confident
    }))

    const result = await response.json()
    expect(result.evaluation.calibrationDelta).toBeGreaterThan(15)
    expect(result.evaluation.calibrationNote).toContain('overconfidence')
  })
})
```

---

### Epic 5: Behavioral Twin Engine

**Test Coverage:** 50-60%
**Test Count:** 291+ tests passing
**Key Test Files:**
- Behavioral pattern recognition
- Struggle prediction ML model
- Cognitive load calculation
- Personalization A/B testing

#### Test Reports
- [Story 5.5 A/B Testing Implementation](../STORY-5.5-AB-TESTING-IMPLEMENTATION.md)

#### Critical Test Cases

**Session Duration Analyzer:**
```typescript
// apps/web/src/subsystems/behavioral-analytics/__tests__/session-duration-analyzer.test.ts
import { SessionDurationAnalyzer } from '../session-duration-analyzer'

describe('SessionDurationAnalyzer', () => {
  it('should calculate baseline session duration', () => {
    const analyzer = new SessionDurationAnalyzer()
    const sessions = [
      { duration: 45, performance: 0.8 },
      { duration: 50, performance: 0.85 },
      { duration: 55, performance: 0.82 },
    ]

    const baseline = analyzer.calculateBaseline(sessions)
    expect(baseline).toBeCloseTo(50, 0)
  })

  it('should detect optimal duration with performance weighting', () => {
    const analyzer = new SessionDurationAnalyzer()
    const sessions = [
      { duration: 45, performance: 0.7 },
      { duration: 60, performance: 0.9 },  // Best performance
      { duration: 75, performance: 0.75 }, // Fatigue
    ]

    const optimal = analyzer.findOptimalDuration(sessions)
    expect(optimal).toBeCloseTo(60, 5)
  })
})
```

**Struggle Prediction:**
```typescript
// apps/web/src/subsystems/behavioral-analytics/__tests__/struggle-prediction.test.ts
describe('Struggle Prediction Model', () => {
  it('should predict struggle with 70%+ confidence', async () => {
    const prediction = await generatePrediction({
      userId: 'test-user',
      objectiveId: 'cardiovascular-pharm',
      features: buildFeatureVector(),
    })

    expect(prediction.confidence).toBeGreaterThanOrEqual(0.7)
    expect(prediction.predictionType).toBeDefined()
    expect(prediction.suggestedInterventions.length).toBeGreaterThan(0)
  })

  it('should incorporate user feedback for model improvement', async () => {
    const prediction = await generatePrediction(userId, objectiveId)

    // Submit feedback
    await submitPredictionFeedback(prediction.id, {
      accurate: true,
      helpful: true,
    })

    // Model should learn from feedback
    const modelMetrics = await getModelMetrics()
    expect(modelMetrics.feedbackCount).toBeGreaterThan(0)
  })
})
```

---

## Test Configuration Files

### Jest Configuration (Next.js)

```javascript
// apps/web/jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThresholds: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },
}
```

### pytest Configuration (Python)

```ini
# apps/api/pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --strict-markers
    -v
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests (>1s)
```

---

## Coverage Targets

| Component | Target | Achieved | Status |
|-----------|--------|----------|--------|
| **Next.js Web App** | 70%+ | ~68.5% | ⚠️ Close |
| - Critical Paths | 85%+ | ~80% | ✅ |
| - Subsystems (Epic 5) | 70%+ | ~72% | ✅ |
| - Components | 65%+ | ~65% | ✅ |
| **FastAPI ML Service** | 80%+ | TBD | ⏳ Future |
| - IRT Algorithms | 90%+ | TBD | ⏳ Future |
| - ML Models | 85%+ | TBD | ⏳ Future |
| **E2E Tests** | Critical flows | TBD | ⏳ Future |

---

## Testing Conventions

### 1. File Naming

```
Component.tsx         → Component.test.tsx
utility.ts            → utility.test.ts
api-route/route.ts    → api-route/route.test.ts
```

### 2. Test Structure (AAA Pattern)

```typescript
describe('FeatureName', () => {
  it('should do something when condition', () => {
    // Arrange
    const input = 'test'
    const expected = 'expected result'

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toBe(expected)
  })
})
```

### 3. Mock External Dependencies

```typescript
// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked' }),
  })
) as jest.Mock
```

### 4. Test Data Factories

```typescript
// tests/factories/user.ts
export function createMockUser(overrides = {}) {
  return {
    id: 'test-uuid',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    ...overrides,
  }
}
```

---

## Continuous Integration (CI)

### GitHub Actions (Future)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd apps/web && npm install
      - run: cd apps/web && npm test -- --coverage

  test-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd apps/api && pip install -r requirements.txt
      - run: cd apps/api && pytest --cov
```

---

## Test Data Management

### Seed Data for Testing

```bash
# Seed development database with test data
cd apps/web
npx prisma db seed

# Seed script location
apps/web/prisma/seed.ts
```

### Test Database

```bash
# Use separate test database
DATABASE_URL="postgresql://localhost:5432/americano_test" npm test

# Reset test database
npx prisma migrate reset --force
```

---

## Debugging Tests

### Jest Debug Mode

```bash
# Run single test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts

# In Chrome, open: chrome://inspect
# Click "Open dedicated DevTools for Node"
```

### pytest Debug Mode

```bash
# Drop into debugger on failure
pytest --pdb

# Use breakpoint() in test
def test_something():
    result = function_under_test()
    breakpoint()  # Pauses here
    assert result == expected
```

---

## Common Issues & Solutions

### Issue 1: Tests Fail Locally but Pass in CI

**Cause:** Different environments (Node version, dependencies)
**Solution:**
```bash
# Match CI environment
nvm use 20
rm -rf node_modules package-lock.json
npm install
npm test
```

### Issue 2: Prisma Client Not Found

**Cause:** Prisma client not generated after schema change
**Solution:**
```bash
npx prisma generate
npm test
```

### Issue 3: Tests Timeout

**Cause:** Slow database queries, API calls not mocked
**Solution:**
```typescript
// Increase timeout
jest.setTimeout(10000)  // 10 seconds

// Mock slow operations
jest.mock('@/lib/slow-function', () => ({
  slowFunction: jest.fn().mockResolvedValue('instant'),
}))
```

---

## Test Reporting

### HTML Coverage Report

```bash
# Generate HTML report
npm run test:coverage

# Open in browser
open coverage/lcov-report/index.html
```

### CI Test Summary

- **Total Tests:** 291+ (Epic 5), 65+ (Epic 4), TBD (Epic 3)
- **Pass Rate:** >99%
- **Coverage:** 50-72% depending on component
- **Average Runtime:** 3-5 minutes (all tests)

---

## Future Testing Improvements

### Planned Enhancements

1. **Increase Coverage:** 70% → 85% for all critical paths
2. **E2E Tests:** Playwright for critical user flows
3. **Visual Regression:** Percy for UI component testing
4. **Performance Tests:** k6 load testing (already implemented)
5. **Mutation Testing:** Stryker for test quality assessment
6. **Contract Testing:** Pact for API consumer testing

### Timeline

| Enhancement | Priority | Estimated Effort | Target Date |
|-------------|----------|------------------|-------------|
| E2E Tests (Critical Flows) | High | 2 weeks | Month 2 |
| Increase Coverage to 85% | High | 3 weeks | Month 3 |
| Visual Regression | Medium | 1 week | Month 4 |
| Performance Tests (More) | Medium | 1 week | Month 3 |
| Mutation Testing | Low | 2 weeks | Month 6 |

---

## Cross-References

### Related Documentation
- [API Contracts](../api-contracts.md) - API endpoints to test
- [Data Models](../data-models.md) - Database models to test
- [Solution Architecture](../solution-architecture.md) - System overview

### Test Reports
- [Epic 3 Test Reports](#epic-3-adaptive-content-delivery)
- [Epic 4 Test Reports](#epic-4-understanding-validation-engine)
- [Epic 5 Test Reports](#epic-5-behavioral-twin-engine)

---

## Support

**Questions or Issues:**
- **Test Failures:** Check [Common Issues](#common-issues--solutions)
- **Coverage Gaps:** Review [Coverage Targets](#coverage-targets)
- **New Tests:** Follow [Testing Conventions](#testing-conventions)

---

**Last Updated:** 2025-10-23T12:55:00-07:00
**Maintainer:** QA Lead
**Review Schedule:** After each epic completion or major test infrastructure changes
