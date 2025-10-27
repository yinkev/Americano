# Integration Test Examples - Complete Guide

**Created:** 2025-10-26
**Framework:** Jest + MSW (Mock Service Worker) + React Testing Library
**Purpose:** Demonstrate integration testing patterns for Next.js + Python FastAPI hybrid architecture

---

## Overview

This directory contains 3 comprehensive integration test examples that demonstrate best practices for testing different layers of the Americano platform:

1. **Hook Integration Test** (`hooks/use-study-orchestration.test.ts`)
   - Testing custom React hooks with React Query
   - Managing Zustand state in tests
   - Mocking external services
   - Testing async state updates

2. **API Route Integration Test** (`api-routes/validation-evaluate.test.ts`)
   - Testing Next.js API routes that proxy to Python FastAPI
   - Database mocking with Prisma
   - Request validation with Zod
   - Caching behavior and edge cases

3. **Component Integration Test** (`components/dashboard.test.tsx`)
   - Testing complete React components with data fetching
   - User interactions with React Testing Library
   - Loading/error/empty states
   - End-to-end user flows

---

## Quick Start

### Prerequisites

```bash
# Install dependencies (if not already installed)
cd apps/web
npm install

# Ensure MSW setup exists
cat __tests__/setup.ts
```

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test __tests__/integration/hooks/use-study-orchestration.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode for development
npm run test:watch
```

---

## Test File 1: Hook Integration Test

**File:** `hooks/use-study-orchestration.test.ts`
**What it tests:** `useStudyOrchestration` custom hook
**Key patterns:**

### Pattern 1: Hook Testing with renderHook

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'

it('should initialize with default options', () => {
  const { result } = renderHook(() => useStudyOrchestration())

  expect(result.current).toMatchObject({
    isActive: expect.any(Boolean),
    recordAnswer: expect.any(Function),
    // ... other properties
  })
})
```

**Why this matters:**
- `renderHook` is the correct way to test custom hooks (not regular `render`)
- `result.current` gives you access to the hook's return value
- Use `expect.any(Function)` for function properties

### Pattern 2: Testing Async State Updates

```typescript
it('should record answers and update metrics', async () => {
  const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

  // Trigger state change inside act()
  act(() => {
    result.current.recordAnswer(true, 5000, 4)
  })

  // Wait for async updates
  await waitFor(() => {
    const metrics = result.current.performanceMetrics
    expect(metrics).toBeDefined()
  })
})
```

**Why this matters:**
- All state updates must be wrapped in `act()`
- Use `waitFor()` for async state changes (React Query, useEffect, etc.)
- Don't access `result.current` inside `act()` (it's stale)

### Pattern 3: Mocking Global State (Zustand)

```typescript
beforeEach(() => {
  // Reset Zustand store to initial state
  useSessionStore.setState({
    sessionId: 'test-session-123',
    orchestration: {
      isActive: true,
      currentPhase: 'content',
    },
    settings: {
      enableRealtimeOrchestration: true,
    },
  })
})
```

**Why this matters:**
- Zustand state persists between tests (global state)
- Always reset state in `beforeEach` for test isolation
- Use `setState` to inject test data

### Pattern 4: Testing Timers and Intervals

```typescript
it('should trigger periodic checks', async () => {
  jest.useFakeTimers()

  const { result } = renderHook(() => useStudyOrchestration({ sensitivity: 'high' }))

  act(() => {
    jest.advanceTimersByTime(30000) // Fast-forward 30 seconds
  })

  expect(result.current.performanceMetrics).toBeDefined()

  jest.useRealTimers()
})
```

**Why this matters:**
- Use `jest.useFakeTimers()` to control time-based logic
- Always restore real timers with `jest.useRealTimers()` in cleanup
- `advanceTimersByTime` simulates time passing without waiting

---

## Test File 2: API Route Integration Test

**File:** `api-routes/validation-evaluate.test.ts`
**What it tests:** `POST /api/validation/prompts/generate` route
**Key patterns:**

### Pattern 1: Testing Next.js API Routes

```typescript
import { POST } from '@/app/api/validation/prompts/generate/route'
import { NextRequest } from 'next/server'

it('should generate new prompt', async () => {
  const request = new NextRequest(
    'http://localhost:3000/api/validation/prompts/generate',
    {
      method: 'POST',
      body: JSON.stringify({
        objectiveId: 'obj-123',
      }),
    },
  )

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data.success).toBe(true)
})
```

**Why this matters:**
- Import the handler function directly (not HTTP call)
- Use `NextRequest` constructor to simulate requests
- Test returns `NextResponse` (use `.json()` to get data)

### Pattern 2: Mocking Prisma Database

```typescript
jest.mock('@/lib/db', () => ({
  prisma: {
    learningObjective: {
      findUnique: jest.fn(),
    },
    validationPrompt: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

beforeEach(() => {
  // Mock database responses
  (prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
    id: 'obj-123',
    objective: 'Understand cardiac conduction system',
    lecture: { /* ... */ },
  })

  (prisma.validationPrompt.create as jest.Mock).mockResolvedValue({
    id: 'prompt-new-123',
    promptText: 'Explain...',
  })
})
```

**Why this matters:**
- Mock Prisma at the import level (not per-test)
- Use `mockResolvedValue` for async database operations
- Cast to `jest.Mock` for TypeScript compatibility

### Pattern 3: MSW for External API Calls

```typescript
beforeAll(() => {
  server.use(
    http.post(`${PYTHON_SERVICE_URL}/validation/generate-prompt`, async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({
        prompt_text: `Explain ${body.objective_text} to a patient.`,
        concept_name: body.objective_text,
        expected_criteria: ['Uses terminology', 'Clear language'],
        prompt_type: 'DIRECT',
      })
    })
  )
})
```

**Why this matters:**
- MSW intercepts network requests (fetch, axios, etc.)
- Define handlers in `beforeAll` for all tests
- Override per-test with `server.use()` in individual tests

### Pattern 4: Testing Validation Errors

```typescript
it('should return 400 for missing objectiveId', async () => {
  const request = new NextRequest(
    'http://localhost:3000/api/validation/prompts/generate',
    {
      method: 'POST',
      body: JSON.stringify({}), // Missing objectiveId
    },
  )

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(400)
  expect(data.error).toBe('VALIDATION_ERROR')
  expect(data.message).toBe('Invalid request data')
})
```

**Why this matters:**
- Test validation before business logic
- Verify correct status codes (400 for validation, 404 for not found, etc.)
- Check error response structure matches API contract

### Pattern 5: Testing Caching Behavior

```typescript
it('should return cached prompt when available', async () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  (prisma.validationPrompt.findFirst as jest.Mock).mockResolvedValue({
    id: 'prompt-cached-123',
    promptText: 'Cached prompt',
    createdAt: threeDaysAgo,
  })

  const response = await POST(request)
  const data = await response.json()

  expect(data.data.cached).toBe(true)
  expect(prisma.validationPrompt.create).not.toHaveBeenCalled()
})
```

**Why this matters:**
- Test both cache hits and misses
- Verify cache expiration logic (7-day window)
- Confirm expensive operations (Python service call) are skipped when cached

---

## Test File 3: Component Integration Test

**File:** `components/dashboard.test.tsx`
**What it tests:** `UnderstandingDashboard` React component
**Key patterns:**

### Pattern 1: React Query Test Wrapper

```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,      // Disable retries for faster tests
        gcTime: 0,         // Disable cache for fresh data
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// Usage
const Wrapper = createWrapper()
render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })
```

**Why this matters:**
- React Query requires `QueryClientProvider` in tests
- Create new `QueryClient` per test for isolation
- Disable retries/cache to make tests deterministic

### Pattern 2: Testing Loading States

```typescript
it('should render loading state initially', () => {
  const Wrapper = createWrapper()

  render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

  // Should show loading indicators
  expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
})
```

**Why this matters:**
- Loading state is shown before data arrives
- Use `getByTestId` for structural elements
- Don't use `waitFor` when testing loading state (it's synchronous)

### Pattern 3: Testing Async Data Rendering

```typescript
it('should render dashboard with data after loading', async () => {
  const Wrapper = createWrapper()

  render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
  }, { timeout: 3000 })

  // Verify data is displayed
  expect(screen.getByText(/pred-1|Cardiac/i)).toBeInTheDocument()
})
```

**Why this matters:**
- Use `waitFor` for data fetching (React Query, useEffect, etc.)
- Set timeout to account for network delays (default: 1000ms)
- Check for specific data content after loading

### Pattern 4: Testing User Interactions

```typescript
it('should allow filtering predictions', async () => {
  const user = userEvent.setup()
  const Wrapper = createWrapper()

  render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

  // Wait for initial load
  await waitFor(() => {
    expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
  })

  // User interaction
  const filterDropdown = screen.getByRole('combobox', { name: /filter/i })
  await user.click(filterDropdown)
  await user.click(screen.getByRole('option', { name: /confirmed/i }))

  // Verify filter was applied
  await waitFor(() => {
    expect(filterDropdown).toHaveValue('CONFIRMED')
  })
})
```

**Why this matters:**
- Use `userEvent.setup()` (not `fireEvent`) for realistic interactions
- Await all user actions (`await user.click()`)
- Query by role/name for accessibility-friendly tests

### Pattern 5: Testing Error States

```typescript
it('should display error when API fails', async () => {
  const Wrapper = createWrapper()

  // Mock API error
  server.use(
    http.get(`${API_BASE_URL}/api/analytics/predictions`, () => {
      return HttpResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      )
    })
  )

  render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

  // Wait for error state
  await waitFor(() => {
    expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
  })
})
```

**Why this matters:**
- Override MSW handlers with `server.use()` to simulate errors
- Test all error types (500, 503, network errors, etc.)
- Verify error messages are user-friendly

### Pattern 6: Testing Empty States

```typescript
it('should display empty state when no data', async () => {
  const Wrapper = createWrapper()

  // Mock empty response
  server.use(
    http.get(`${API_BASE_URL}/api/analytics/predictions`, () => {
      return HttpResponse.json({
        success: true,
        predictions: [],
        count: 0,
      })
    })
  )

  render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

  await waitFor(() => {
    expect(screen.getByText(/no predictions|empty/i)).toBeInTheDocument()
  })
})
```

**Why this matters:**
- Empty state is different from loading/error states
- Test with valid response structure but empty data
- Verify helpful empty state messages

---

## Common Patterns & Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
it('should do something', async () => {
  // Arrange: Set up test data, mocks, and initial state
  const Wrapper = createWrapper()
  server.use(/* custom handler */)

  // Act: Perform the action being tested
  render(<Component />, { wrapper: Wrapper })
  await user.click(screen.getByRole('button'))

  // Assert: Verify expected outcomes
  expect(screen.getByText('Result')).toBeInTheDocument()
})
```

### 2. Isolation and Cleanup

```typescript
beforeEach(() => {
  // Reset mocks and state before each test
  jest.clearAllMocks()
  useSessionStore.setState({ /* initial state */ })
})

afterEach(() => {
  // Clean up timers, intervals, etc.
  jest.clearAllTimers()
})
```

### 3. Querying the DOM

**Priority order (accessibility-first):**
1. `getByRole` - Most accessible (e.g., `getByRole('button', { name: /submit/i })`)
2. `getByLabelText` - For form inputs
3. `getByPlaceholderText` - For inputs without labels
4. `getByText` - For visible text content
5. `getByTestId` - Last resort for structural elements

**Async vs Sync queries:**
- `getBy*` - Synchronous, throws if not found (use for elements that should exist)
- `queryBy*` - Synchronous, returns `null` if not found (use for asserting absence)
- `findBy*` - Asynchronous (returns promise), waits for element (use after data fetching)

### 4. MSW Handler Overrides

```typescript
// Global handler (applies to all tests)
beforeAll(() => {
  server.use(
    http.get('/api/data', () => HttpResponse.json({ data: 'default' }))
  )
})

// Per-test override
it('should handle error', async () => {
  server.use(
    http.get('/api/data', () => HttpResponse.json({ error: 'fail' }, { status: 500 }))
  )
  // Test error handling...
})
```

### 5. Testing Async Operations

```typescript
// WRONG: Race condition
it('test', async () => {
  render(<Component />)
  expect(screen.getByText('Loaded')).toBeInTheDocument() // Might fail if data not loaded yet
})

// CORRECT: Wait for async operation
it('test', async () => {
  render(<Component />)
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})

// ALTERNATIVE: Use findBy (implicit waitFor)
it('test', async () => {
  render(<Component />)
  expect(await screen.findByText('Loaded')).toBeInTheDocument()
})
```

---

## Troubleshooting

### Issue 1: "Cannot find module '@/hooks/use-study-orchestration'"

**Solution:** Check TypeScript path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 2: "React Query: No QueryClient set"

**Solution:** Wrap component in `QueryClientProvider`:
```typescript
const Wrapper = createWrapper() // Use helper from test file
render(<Component />, { wrapper: Wrapper })
```

### Issue 3: "MSW handler not intercepting requests"

**Solution:**
1. Verify `setupMSW()` is called in test file
2. Check URL matches exactly (including protocol and port)
3. Add handler in `beforeAll()` block, not per-test

### Issue 4: "act() warning: state update not wrapped"

**Solution:** Wrap state-changing operations in `act()`:
```typescript
// WRONG
result.current.recordAnswer(true, 5000)

// CORRECT
act(() => {
  result.current.recordAnswer(true, 5000)
})
```

### Issue 5: Test timeout after 5000ms

**Solution:**
1. Increase timeout: `waitFor(() => { ... }, { timeout: 10000 })`
2. Check if MSW handler is responding (add console.log)
3. Verify async operations are completing (check for infinite loops)

---

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci
        working-directory: apps/web

      - name: Run integration tests
        run: npm run test:integration
        working-directory: apps/web
        env:
          CI: true
          ML_SERVICE_URL: http://localhost:8000
```

---

## Next Steps

### Extend These Tests

1. **Add More Edge Cases**
   - Test concurrent requests
   - Test network interruptions (AbortController)
   - Test rate limiting scenarios

2. **Add Visual Regression Tests**
   - Use Playwright or Chromatic for screenshot diffs
   - Test responsive breakpoints

3. **Add E2E Tests**
   - Use Playwright for full browser automation
   - Test multi-page user flows

4. **Add Performance Tests**
   - Measure React Query cache hit rates
   - Track component render counts

### Test Coverage Goals

- **Hooks:** 80%+ coverage (critical business logic)
- **API Routes:** 90%+ coverage (data integrity crucial)
- **Components:** 70%+ coverage (UI can have more manual testing)

---

## Additional Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [React Query Testing Guide](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
- [Jest Async Testing](https://jestjs.io/docs/asynchronous)

---

**Questions?** See existing tests in:
- `apps/web/__tests__/api/analytics/*.test.ts` - More API route examples
- `apps/web/__tests__/subsystems/**/*.test.ts` - More component examples
- `apps/web/__tests__/setup.ts` - MSW configuration

**Last Updated:** 2025-10-26
