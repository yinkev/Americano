# Next.js ML Service Proxy Integration Tests

**Story 5.2: Predictive Analytics for Learning Struggles**

Comprehensive integration test suite for the Next.js → FastAPI ML service proxy layer.

## Overview

This test suite verifies that the Next.js API routes correctly proxy requests to the FastAPI ML service, handle errors gracefully, and maintain data consistency across the system.

## Test Structure

```
__tests__/
├── setup.ts                          # MSW configuration and handlers
├── api/
│   └── analytics/
│       ├── predictions.test.ts       # GET /api/analytics/predictions
│       ├── predictions-generate.test.ts  # POST /api/analytics/predictions/generate
│       ├── predictions-feedback.test.ts  # POST /api/analytics/predictions/[id]/feedback
│       ├── interventions.test.ts     # GET /api/analytics/interventions
│       ├── interventions-apply.test.ts   # POST /api/analytics/interventions/[id]/apply
│       ├── model-performance.test.ts # GET /api/analytics/model-performance
│       └── struggle-reduction.test.ts    # GET /api/analytics/struggle-reduction
└── integration/
    └── ml-service-proxy.test.ts      # End-to-end workflow tests
```

## Technology Stack

- **Jest**: Test framework
- **MSW (Mock Service Worker)**: API mocking for Node.js
- **@testing-library/react**: Component testing utilities
- **ts-jest**: TypeScript support for Jest
- **Next.js 15**: App Router API route testing

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run Tests with Coverage

```bash
pnpm test:coverage
```

### Run Specific Test Suite

```bash
# Single file
pnpm test predictions.test.ts

# By pattern
pnpm test api/analytics

# Integration tests only
pnpm test integration/
```

### CI/CD

```bash
pnpm test:ci
```

## Test Categories

### 1. API Route Tests (Individual)

Each API route has dedicated tests covering:

- **Success Cases**: Happy path scenarios with valid inputs
- **Error Cases**: 404, 500, 503 error responses from ML service
- **Edge Cases**: Boundary values, special characters, concurrent requests
- **Validation**: Data structure and type validation

**Example Test Structure:**

```typescript
describe('GET /api/analytics/predictions', () => {
  describe('Success Cases', () => {
    it('should return predictions with default parameters', async () => {
      // Test implementation
    })
  })

  describe('Error Cases', () => {
    it('should handle 503 service unavailable', async () => {
      // Test implementation
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      // Test implementation
    })
  })
})
```

### 2. Integration Tests (Workflow)

End-to-end tests simulating complete user workflows:

- **Complete Prediction Lifecycle**: Generate → Retrieve → Feedback → Model Update
- **Intervention Workflow**: Get Interventions → Apply → Verify Reduction
- **Error Recovery**: Graceful degradation, cascading failures, retry logic
- **Performance**: Concurrent request handling, consistent response times
- **Data Consistency**: Cross-endpoint data validation
- **Security**: Input sanitization, request body validation

## MSW Mock Service Worker

### Setup

The MSW server is configured in `__tests__/setup.ts`:

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Default Handlers

Default handlers mock FastAPI responses for all 7 endpoints:

1. `GET /predictions` - Retrieve predictions
2. `POST /predictions/generate` - Generate new predictions
3. `POST /predictions/:id/feedback` - Submit feedback
4. `GET /interventions` - Get active interventions
5. `POST /interventions/:id/apply` - Apply intervention
6. `GET /model-performance` - Get model metrics
7. `GET /struggle-reduction` - Get reduction metrics

### Overriding Handlers

Tests can override default handlers for specific scenarios:

```typescript
import { server, createErrorHandler } from '../setup'

it('should handle 404 from FastAPI', async () => {
  server.use(
    createErrorHandler('get', '/predictions', 404, 'Not found')
  )

  // Test with error handler
})
```

### Helper Functions

- `createErrorHandler(method, path, status, message)` - Create error response
- `create503Handler(method, path)` - Simulate service unavailable
- `createTimeoutHandler(method, path)` - Simulate network timeout

## Coverage Goals

### Global Coverage Targets

- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 70%
- **Branches**: 70%

### API Route Coverage Targets

Proxy routes have higher standards:

- **Lines**: 85%
- **Statements**: 85%
- **Functions**: 85%
- **Branches**: 80%

### Current Coverage

Run `pnpm test:coverage` to see detailed coverage report.

**Expected Coverage Areas:**

- ✅ API route handlers (85%+ target)
- ✅ Error handling paths (100% target)
- ✅ Query parameter parsing
- ✅ Request body validation
- ✅ Response transformation
- ✅ Network error handling

## Test Data

### Test User

Default test user: `kevy@americano.dev`

Custom test user for integration: `integration-test@example.com`

### Mock Response Examples

**Prediction:**

```json
{
  "id": "pred-1",
  "userId": "kevy@americano.dev",
  "learningObjectiveId": "obj-123",
  "predictedStruggleProbability": 0.75,
  "predictionConfidence": 0.85,
  "predictionStatus": "PENDING"
}
```

**Intervention:**

```json
{
  "id": "int-1",
  "interventionType": "PREREQUISITE_REVIEW",
  "description": "Review prerequisite topics",
  "priority": 9,
  "effectiveness": 0.85
}
```

## Debugging Tests

### Enable Debug Logging

```bash
DEBUG=msw* pnpm test
```

### View Console Output

Remove console mocks in `jest.setup.ts`:

```typescript
// Comment out to see console logs
// global.console = { ...console, error: jest.fn(), warn: jest.fn() }
```

### Run Single Test

```bash
pnpm test -t "should return predictions with default parameters"
```

### Debug in VS Code

Add breakpoint and run with debugger:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Issue: Tests timing out

**Solution**: Increase timeout or check network mocks

```typescript
jest.setTimeout(15000) // Increase timeout
```

### Issue: MSW handlers not working

**Solution**: Ensure MSW server is started in setup

```typescript
// In jest.setup.ts
import './__tests__/setup'
```

### Issue: Fetch is not defined

**Solution**: Next.js provides global fetch, ensure using Node 18+

```bash
node --version  # Should be >= 18.0.0
```

### Issue: Cannot find module '@/...'

**Solution**: Check `moduleNameMapper` in jest.config.ts

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

## Best Practices

### 1. Isolate Tests

Each test should be independent and not rely on others:

```typescript
afterEach(() => {
  server.resetHandlers() // Reset MSW handlers
})
```

### 2. Use Type-Safe Mocks

Leverage TypeScript for mock data:

```typescript
interface MockPrediction {
  id: string
  userId: string
  predictedStruggleProbability: number
}

const mockPrediction: MockPrediction = { ... }
```

### 3. Test Error Paths

Ensure all error scenarios are covered:

```typescript
it('should handle 404', async () => { ... })
it('should handle 500', async () => { ... })
it('should handle 503', async () => { ... })
it('should handle network errors', async () => { ... })
```

### 4. Validate Response Structure

Check response shapes, not just status codes:

```typescript
expect(data).toMatchObject({
  id: expect.any(String),
  probability: expect.any(Number),
})
```

### 5. Test Concurrent Scenarios

Verify behavior under concurrent load:

```typescript
const requests = Array.from({ length: 10 }, () => makeRequest())
const responses = await Promise.all(requests)
```

## Related Documentation

- **Story 5.2**: `/Users/kyin/Projects/Americano-epic5/docs/stories/story-5.2.md`
- **API Routes**: `/Users/kyin/Projects/Americano-epic5/apps/web/src/app/api/analytics/`
- **MSW Documentation**: https://mswjs.io/docs/
- **Jest Documentation**: https://jestjs.io/docs/

## Continuous Improvement

### Adding New Tests

1. Create test file in appropriate directory
2. Import necessary dependencies and setup
3. Write tests following existing patterns
4. Run coverage to ensure >80%
5. Update this README if adding new test categories

### Updating Mock Data

Modify `__tests__/setup.ts` handlers to reflect API changes:

```typescript
export const handlers = [
  http.get(`${ML_SERVICE_URL}/new-endpoint`, () => {
    return HttpResponse.json({ ... })
  }),
]
```

## Contributors

- Development Agent: Sonnet 4.5 (claude-sonnet-4-5-20250929)
- Story 5.2: Predictive Analytics for Learning Struggles
- Date: 2025-10-16

## License

Part of Americano - AI-Powered Medical Education Platform
