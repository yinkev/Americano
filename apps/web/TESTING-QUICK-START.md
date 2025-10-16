# Jest Testing Quick Start Guide
## For Story 2.6 Test Implementation

---

## Run Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/__tests__/smoke.test.ts

# Watch mode (development)
pnpm test:watch

# Coverage report
pnpm test:coverage

# CI/CD mode
pnpm test:ci
```

---

## Test File Structure

### Unit Tests (Engines)
```typescript
// src/__tests__/lib/my-engine.test.ts
import { MyEngine } from '@/lib/my-engine'
import { prisma } from '@/lib/db'

jest.mock('@/lib/db')

describe('MyEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should calculate correctly', async () => {
    // Arrange
    (prisma.mission.findMany as jest.Mock).mockResolvedValue([...])

    // Act
    const result = await engine.calculate()

    // Assert
    expect(result).toBe(expected)
  })
})
```

### Component Tests
```typescript
// src/__tests__/components/my-component.test.tsx
import { render, screen } from '@/__tests__/test-utils'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />)

    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### API Route Tests
```typescript
// src/__tests__/api/my-route.test.ts
import { GET } from '@/app/api/my-route/route'
import { createMockRequest } from '@/__tests__/test-utils'

describe('GET /api/my-route', () => {
  it('should return 200', async () => {
    const req = createMockRequest({ method: 'GET' })
    const response = await GET(req)

    expect(response.status).toBe(200)
  })
})
```

---

## Available Test Fixtures

```typescript
import {
  mockMissions,
  mockMissionReviews,
  mockMissionFeedback,
  mockUserPreferences,
  mockAnalyticsData,
} from '@/__tests__/fixtures/mission-data'
```

---

## Available Mocks (Already Set Up)

### Prisma
```typescript
import { prisma } from '@/lib/db'
// Already mocked globally in jest.setup.ts
// Just use jest.Mock assertions:
(prisma.mission.findMany as jest.Mock).mockResolvedValue([...])
```

### Next.js Navigation
```typescript
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
// Already mocked - just use in components
```

### Web APIs
```typescript
// ResizeObserver - Already mocked
// IntersectionObserver - Already mocked
```

---

## Common Test Patterns

### Test Async Functions
```typescript
it('should handle async', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expected)
})
```

### Test Error Cases
```typescript
it('should handle errors', async () => {
  (prisma.mission.findMany as jest.Mock).mockRejectedValue(
    new Error('Database error')
  )

  await expect(engine.calculate()).rejects.toThrow('Database error')
})
```

### Test with Timers
```typescript
it('should handle timeouts', () => {
  jest.useFakeTimers()

  const callback = jest.fn()
  setTimeout(callback, 1000)

  jest.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalled()

  jest.useRealTimers()
})
```

---

## Useful Matchers

### Jest
```typescript
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(array).toContain(item)
expect(object).toHaveProperty('key', value)
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(args)
expect(promise).resolves.toBe(value)
expect(promise).rejects.toThrow(error)
```

### jest-dom
```typescript
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toHaveTextContent('text')
expect(element).toHaveAttribute('attr', 'value')
expect(element).toHaveClass('class-name')
expect(input).toHaveValue('value')
expect(input).toBeDisabled()
```

---

## Debugging Tests

### Focus on One Test
```typescript
it.only('focused test', () => {
  // Only this test runs
})
```

### Skip a Test
```typescript
it.skip('skipped test', () => {
  // This test won't run
})
```

### Debug Output
```typescript
import { screen, debug } from '@/__tests__/test-utils'

render(<Component />)
debug() // Prints DOM to console
screen.debug() // Same as above
```

### Check Mock Calls
```typescript
console.log((prisma.mission.findMany as jest.Mock).mock.calls)
console.log((prisma.mission.findMany as jest.Mock).mock.results)
```

---

## Fix Existing Test Failures

### Issue 1: Missing user model mock
```typescript
// Add to jest.setup.ts
prisma: {
  // ... existing mocks
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  }
}
```

### Issue 2: MissionStatus enum
```typescript
// Import at top of test file
import { MissionStatus } from '@prisma/client'

// Then use:
status: MissionStatus.COMPLETED
```

### Issue 3: Missing Prisma methods
```typescript
// Add to jest.setup.ts under relevant model
findFirst: jest.fn(),
updateMany: jest.fn(),
deleteMany: jest.fn(),
```

---

## Test Implementation Priority

### Phase 1: Fix Existing Tests (66 failures)
1. Add user model mock
2. Fix MissionStatus imports
3. Add missing Prisma methods

### Phase 2: Implement New Tests (87 from TASK-12-VALIDATION-REPORT.md)

#### 12.1: Analytics Calculations (20 tests)
- [ ] Completion rate accuracy
- [ ] Performance correlation
- [ ] Adaptation triggers
- [ ] Edge cases
- [ ] Success score calculation
- [ ] Daily analytics

#### 12.2: Adaptation Engine (15 tests)
- [ ] Difficulty adjustments
- [ ] Throttling enforcement
- [ ] Manual override preservation
- [ ] Pattern detection
- [ ] Recommendation generation

#### 12.3: UI Components (25 tests)
- [ ] ReviewCard rendering
- [ ] Chart data formatting
- [ ] Filter functionality
- [ ] Edge cases
- [ ] Accessibility
- [ ] Responsive design

#### 12.4: Feedback Loop (12 tests)
- [ ] Feedback submission
- [ ] Rating validation
- [ ] Aggregation
- [ ] Adaptation triggers
- [ ] Pace adjustments

#### 12.5: Performance (15 tests)
- [ ] Query performance < 1s
- [ ] Chart rendering < 500ms
- [ ] Recommendations < 300ms
- [ ] Concurrent requests
- [ ] Memory usage

---

## Coverage Requirements

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 80,
    statements: 80,
  }
}
```

View coverage:
```bash
pnpm test:coverage
# Opens: coverage/lcov-report/index.html
```

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

---

## Troubleshooting

### Tests timing out
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 30000) // 30 second timeout
```

### Module resolution errors
```typescript
// Use absolute imports with @/ alias
import { Component } from '@/components/component'
// NOT: import { Component } from '../../components/component'
```

### Mock not working
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

---

## Resources

- **Full Setup Report:** `/apps/web/JEST-SETUP-REPORT.md`
- **Test Specifications:** `/TASK-12-VALIDATION-REPORT.md`
- **Story Details:** `/docs/stories/story-2.6.md`
- **Jest Docs:** https://jestjs.io/
- **RTL Docs:** https://testing-library.com/react
- **jest-dom:** https://github.com/testing-library/jest-dom

---

**Happy Testing! 🧪**
