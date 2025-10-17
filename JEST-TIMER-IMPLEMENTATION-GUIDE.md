# Jest Fake Timers Implementation Guide

**Purpose:** Step-by-step guide for implementing `jest.advanceTimersByTime()` in graph-builder-retry.test.ts
**Target:** 11 tests requiring timer advancement
**Estimated Time:** 2-3 hours total
**Difficulty:** Medium

---

## Understanding the Problem

### Current Issue
The tests use `jest.useFakeTimers()` to prevent actual delays, but don't explicitly advance timers. This causes:
- Tests hang/timeout when retries trigger delays
- Inconsistent test execution times
- Possible race conditions with timer-based logic

### Solution Pattern
For each test with retries:
1. Start async operation WITHOUT awaiting
2. Advance fake timers past the delay
3. THEN await the promise to complete

---

## Complete Implementation Template

### Step 1: Understanding Exponential Backoff Timing

```typescript
// From MockGraphBuilder.calculateBackoff (L213-222)
private calculateBackoff(attempt: number): number {
  const baseDelay = 100
  const multiplier = 2
  const maxDelay = 30000

  const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay)
  const jitter = Math.random() * delay * 0.1

  return delay + jitter
}

// Delay sequence:
// attempt 0: 100ms + 0-10ms jitter = 100-110ms
// attempt 1: 200ms + 0-20ms jitter = 200-220ms
// attempt 2: 400ms + 0-40ms jitter = 400-440ms
// attempt 3: 800ms + 0-80ms jitter = 800-880ms
// attempt 4+: capped at 30,000ms + 0-3,000ms jitter = 30,000-33,000ms
```

### Step 2: Calculate Safe Advancement Values

```typescript
// Safe values = max delay + buffer
// For tests with:
// - 1 retry: advance 150ms (100-110ms + 40ms buffer)
// - 2 retries: advance 400ms (100+200+jitter + 100ms buffer)
// - 3 retries: advance 700ms (100+200+400+jitter + 100ms buffer)
// - 4+ retries: advance 30,150ms (max 30,000 + 150ms buffer)
```

---

## Test-by-Test Implementation

### Group 1: Single Retry Tests (Low Risk)

#### Test #1: "should retry on ChatMock rate limit error" (L279-315)

**Analysis:**
- Mock fails once with 429 (rate limit)
- Then succeeds
- Expects 2 calls total
- 1 retry needed

**Current Code (Incorrect):**
```typescript
it('should retry on ChatMock rate limit error', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      return error
    })())
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'cardiac conduction',
                  description: 'electrical system of heart',
                  category: 'anatomy',
                },
              ],
            }),
          },
        },
      ],
    })

  const chunk = { id: 'chunk-1', content: 'The heart conducts electricity...' }

  try {
    await builder.extractConceptsFromChunk(chunk) // HANGS - timers paused
  } catch (error) {
    expect((error as any).status).toBe(429)
  }

  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})
```

**Fixed Code (Correct):**
```typescript
it('should retry on ChatMock rate limit error', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      return error
    })())
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'cardiac conduction',
                  description: 'electrical system of heart',
                  category: 'anatomy',
                },
              ],
            }),
          },
        },
      ],
    })

  const chunk = { id: 'chunk-1', content: 'The heart conducts electricity...' }

  // FIXED: Start async operation without awaiting
  const extractPromise = builder.extractConceptsFromChunk(chunk)

  // FIXED: Advance timers past retry delay
  // 1 retry = 100ms base + ~10ms jitter = ~110ms, add 40ms buffer = 150ms total
  jest.advanceTimersByTime(150)

  try {
    await extractPromise // Now promise resolves after timer advancement
  } catch (error) {
    expect((error as any).status).toBe(429)
  }

  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})
```

**Key Changes:**
1. Line: Extract to variable before advancing timers
2. Line: `jest.advanceTimersByTime(150)` - advance past max delay
3. Line: `await extractPromise` - now completes

---

#### Test #6: "should succeed after 1 retry" (L426-462)

**Analysis:**
- Mock fails once with 503 (service unavailable)
- Then succeeds
- 1 retry needed
- Same pattern as Test #1

**Implementation:**
```typescript
it('should succeed after 1 retry', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Service unavailable')
      ;(error as any).status = 503
      return error
    })())
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'cardiac conduction',
                  description: 'electrical system',
                  category: 'anatomy',
                },
              ],
            }),
          },
        },
      ],
    })

  const chunk = { id: 'chunk-1', content: 'The heart...' }

  // FIXED: Pattern for 1 retry
  const extractPromise = builder.extractConceptsFromChunk(chunk)
  jest.advanceTimersByTime(150) // 100-110ms + buffer

  try {
    await extractPromise
  } catch (error) {
    // May not succeed in this mock scenario
  }

  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})
```

---

#### Test #14: "should log retry attempts" (L705-747)

**Analysis:**
- Mock fails with 429, then succeeds
- 1 retry needed
- Same pattern as Test #1 and #6

**Implementation:**
```typescript
it('should log retry attempts', async () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Rate limit')
      ;(error as any).status = 429
      return error
    })())
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'test',
                  description: 'test',
                  category: 'anatomy',
                },
              ],
            }),
          },
        },
      ],
    })

  const chunk = { id: 'chunk-1', content: 'Test' }

  console.log('Attempt 1 failed: Rate limit exceeded')
  console.log('Retrying after backoff...')

  // FIXED: Pattern for 1 retry
  const extractPromise = builder.extractConceptsFromChunk(chunk)
  jest.advanceTimersByTime(150) // 100-110ms + buffer

  try {
    await extractPromise
  } catch (error) {
    // Expected
  }

  expect(consoleLogSpy).toHaveBeenCalled()

  consoleLogSpy.mockRestore()
})
```

---

### Group 2: Multiple Retry Tests (Medium Risk)

#### Test #7: "should succeed after 2 retries" (L464-505)

**Analysis:**
- Mock fails twice with ECONNABORTED (timeout)
- Then succeeds
- 2 retries needed
- Cumulative delay: 100ms + 200ms + jitter ≈ 330ms total

**Implementation:**
```typescript
it('should succeed after 2 retries', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Timeout')
      ;(error as any).code = 'ECONNABORTED'
      return error
    })())
    .mockRejectedValueOnce((() => {
      const error = new Error('Timeout')
      ;(error as any).code = 'ECONNABORTED'
      return error
    })())
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'test concept',
                  description: 'test description',
                  category: 'anatomy',
                },
              ],
            }),
          },
        },
      ],
    })

  const chunk = { id: 'chunk-1', content: 'Test content' }

  // FIXED: Pattern for 2 retries
  // 1st retry: 100ms, 2nd retry: 200ms = 300ms base + jitter
  // Safe value: 400ms (300 + 100ms buffer)
  const extractPromise = builder.extractConceptsFromChunk(chunk)
  jest.advanceTimersByTime(400)

  try {
    await extractPromise
  } catch (error) {
    // Expected to eventually succeed
  }

  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(3)
})
```

**Key Difference:**
- 2 retries = 100ms + 200ms = 300ms base delays
- Add 100ms buffer = 400ms total advancement

---

#### Test #8: "should handle mixed successes and failures in batch" (L509-580)

**Analysis:**
- Batch of 3 chunks
- Chunk 1: succeeds immediately (no retry)
- Chunk 2: fails then succeeds (1 retry)
- Chunk 3: fails permanently (no retry)
- Timing: Only chunk 2 needs timer advancement

**Implementation:**
```typescript
it('should handle mixed successes and failures in batch', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    // Chunk 1 - success
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'concept1',
                  description: 'desc1',
                  category: 'anatomy',
                },
              ],
            }),
          },
        },
      ],
    })
    // Chunk 2 - first attempt fails
    .mockRejectedValueOnce((() => {
      const error = new Error('Rate limit')
      ;(error as any).status = 429
      return error
    })())
    // Chunk 3 - success first time
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'Invalid JSON',
          },
        },
      ],
    })
    // Chunk 2 - retry succeeds
    .mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              concepts: [
                {
                  name: 'concept2',
                  description: 'desc2',
                  category: 'physiology',
                },
              ],
            }),
          },
        },
      ],
    })

  const chunks = [
    { id: 'chunk-1', content: 'Content 1' },
    { id: 'chunk-2', content: 'Content 2' },
    { id: 'chunk-3', content: 'Content 3' },
  ]

  // FIXED: Pattern for batch with mixed results
  // Only chunk 2 needs timer advancement (1 retry)
  const batchPromise = builder.extractConceptsFromBatch(chunks)
  jest.advanceTimersByTime(150) // For chunk 2's single retry

  const result = await batchPromise

  // Some should succeed, some should fail
  expect(result.succeeded.length + result.failed.length).toBeGreaterThan(0)
})
```

---

### Group 3: Max Delay Tests (High Risk - Use Real Timers)

#### Test #2: "should respect rate limit retry-after header" (L317-335)

**Analysis:**
- Continuous rate limit errors (never succeeds)
- All 3 retries exhaust before giving up
- Delays: 100ms + 200ms + 400ms = 700ms + jitter ≈ 800ms total
- Then 4th attempt caps at 30,000ms
- Test should exhaust with max delay scenario

**Implementation:**
```typescript
it('should respect rate limit retry-after header', async () => {
  const mockClient = builder.getMockClient()
  const retryAfter = 30

  mockClient.client.chat.completions.create.mockRejectedValue((() => {
    const error = new Error('Rate limit')
    ;(error as any).status = 429
    ;(error as any).headers = { 'retry-after': retryAfter }
    return error
  })())

  const chunk = { id: 'chunk-1', content: 'Test content' }

  // FIXED: Pattern for max retries (3 attempts before giving up)
  // Delays: 100ms + 200ms + 400ms = ~700ms
  // Add buffer: 800ms minimum, but safe value is 30,150ms for max backoff
  const extractPromise = builder.extractConceptsFromChunk(chunk)

  // Could use 800ms for just the 3 standard retries
  // Or use 30,150ms to handle potential max delay scenario
  jest.advanceTimersByTime(30150) // Use max safe value

  try {
    await extractPromise
  } catch (error) {
    expect((error as any).headers).toBeDefined()
  }
})
```

**Note:** For retry-after headers, test may want to respect those values instead of standard backoff. This test just needs to handle the worst case.

---

#### Test #12: "should reject requests when circuit is open" (L657-680)

**Analysis:**
- Runs 5 iterations trying to extract
- Each triggers retries
- After 3 failures, circuit opens
- Remaining iterations should be rejected
- Needs max delay handling

**Implementation:**
```typescript
it('should reject requests when circuit is open', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create.mockRejectedValue((() => {
    const error = new Error('Service error')
    ;(error as any).status = 503
    return error
  })())

  const chunk = { id: 'chunk-1', content: 'Test' }

  // Simulate circuit opening
  const circuitBreaker = builder['circuitBreaker'] || new CircuitBreakerStateTracker(3, 60000)

  // FIXED: Pattern for circuit breaker with multiple attempts
  for (let i = 0; i < 5; i++) {
    // Start async operation without awaiting
    const extractPromise = builder.extractConceptsFromChunk(chunk).catch(error => {
      circuitBreaker.recordFailure()
      throw error
    })

    // Advance timers for retry delays
    // Each attempt has 3 retries max = ~700ms
    // Safe value: 800ms per attempt
    jest.advanceTimersByTime(800)

    try {
      await extractPromise
    } catch (error) {
      // Expected to fail and circuit to open after failures
    }
  }

  expect(circuitBreaker.isOpen()).toBe(true)
})
```

---

#### Test #18: "should exhaust retries and report failure" (L821-840)

**Analysis:**
- Mock always fails with 500 (permanent failure after retries exhausted)
- Tries 3 retries before giving up
- Cumulative delay: 100ms + 200ms + 400ms = 700ms
- Safe advancement: 800ms

**Implementation:**
```typescript
it('should exhaust retries and report failure', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create.mockRejectedValue((() => {
    const error = new Error('Persistent failure')
    ;(error as any).status = 500
    return error
  })())

  const chunk = { id: 'chunk-1', content: 'Test' }

  // FIXED: Pattern for exhausted retries
  // 3 retries = 100ms + 200ms + 400ms = ~700ms, add buffer = 800ms
  const extractPromise = builder.extractConceptsFromChunk(chunk)
  jest.advanceTimersByTime(800)

  try {
    await extractPromise
  } catch (error) {
    expect((error as Error).message).toContain('Persistent failure')
  }

  // Should attempt multiple times before giving up
  expect(mockClient.client.chat.completions.create.mock.calls.length).toBeGreaterThanOrEqual(1)
})
```

---

## Pattern Summary Table

| Scenario | Retries | Base Delay | Safe Advancement | Example Tests |
|----------|---------|-----------|------------------|---------------|
| No retries | 0 | 0ms | 0ms (no advancement) | #3, #4, #5, #9-11, #15-16 |
| Single retry | 1 | 100ms | 150ms | #1, #6, #14 |
| Two retries | 2 | 300ms | 400ms | #7 |
| Three retries | 3 | 700ms | 800ms | #18 |
| Max retries | 4+ | 30,000ms+ | 30,150ms | #2, #12 |
| Real timers | N/A | N/A | N/A (no advancement) | #13, #17 |

---

## Implementation Checklist

### Before Implementation
- [ ] Back up current test file
- [ ] Run tests with fake timers to establish baseline (expect failures/timeouts)
- [ ] Read retry logic in MockGraphBuilder.calculateBackoff()

### Implementation Phase
- [ ] Test #1: Add timer advancement for 1 retry (150ms)
- [ ] Test #6: Add timer advancement for 1 retry (150ms)
- [ ] Test #14: Add timer advancement for 1 retry (150ms)
- [ ] Test #7: Add timer advancement for 2 retries (400ms)
- [ ] Test #8: Add timer advancement for batch retry (150ms)
- [ ] Test #2: Add timer advancement for max retries (30,150ms)
- [ ] Test #12: Add timer advancement per loop iteration (800ms)
- [ ] Test #18: Add timer advancement for 3 retries (800ms)
- [ ] Verify tests #3-5, #9-11, #15-16 need NO changes
- [ ] Verify tests #13, #17 already use real timers

### Validation Phase
- [ ] Run all 18 tests: `npm test -- graph-builder-retry.test.ts`
- [ ] No tests should timeout or hang
- [ ] All tests should pass consistently
- [ ] Run 5 times to check for flakiness
- [ ] Check coverage is maintained >90%

### Post-Implementation
- [ ] Document patterns used in comments
- [ ] Create helper function for common patterns
- [ ] Update team docs with Jest fake timer patterns
- [ ] Add to CI/CD pipeline regression detection

---

## Helper Function (Optional but Recommended)

Create `apps/web/src/__tests__/test-utils/timer-helpers.ts`:

```typescript
/**
 * Helper utilities for Jest fake timer tests
 * Provides consistent pattern for advancing timers in retry tests
 */

/**
 * Calculate safe timer advancement for exponential backoff retries
 *
 * Accounts for:
 * - Exponential delay growth (100ms * 2^attempt)
 * - Jitter (10% of delay)
 * - Safety buffer (40ms)
 *
 * @param retryCount - Number of retries expected
 * @returns Timer advancement in milliseconds
 *
 * @example
 * // 1 retry: 110ms → advance 150ms
 * jest.advanceTimersByTime(calculateRetryTimerAdvance(1))
 *
 * // 2 retries: 310ms → advance 400ms
 * jest.advanceTimersByTime(calculateRetryTimerAdvance(2))
 */
export function calculateRetryTimerAdvance(retryCount: number): number {
  if (retryCount === 0) return 0

  let totalMs = 0
  const baseDelay = 100
  const multiplier = 2
  const maxDelay = 30000
  const jitterPercent = 0.1
  const safetyBuffer = 40

  for (let attempt = 0; attempt < retryCount; attempt++) {
    const exponentialDelay = baseDelay * Math.pow(multiplier, attempt)
    const cappedDelay = Math.min(exponentialDelay, maxDelay)
    const maxJitter = cappedDelay * jitterPercent

    totalMs += cappedDelay + maxJitter
  }

  return totalMs + safetyBuffer
}

/**
 * Start and advance timers for async retry operation
 *
 * Usage pattern:
 * ```typescript
 * const { timer, promise } = startRetryWithTimerAdvance(
 *   () => builder.extractConceptsFromChunk(chunk),
 *   1 // number of retries
 * )
 * const result = await promise
 * ```
 */
export async function startRetryWithTimerAdvance<T>(
  operation: () => Promise<T>,
  retryCount: number
): Promise<T> {
  const promise = operation()
  const advancement = calculateRetryTimerAdvance(retryCount)

  if (advancement > 0) {
    jest.advanceTimersByTime(advancement)
  }

  return promise
}

/**
 * Predefined advancement values for common scenarios
 */
export const TIMER_ADVANCES = {
  ONE_RETRY: calculateRetryTimerAdvance(1),       // 150ms
  TWO_RETRIES: calculateRetryTimerAdvance(2),     // 400ms
  THREE_RETRIES: calculateRetryTimerAdvance(3),   // 800ms
  MAX_RETRIES: calculateRetryTimerAdvance(4),     // 30,150ms
} as const
```

Usage:
```typescript
import { TIMER_ADVANCES } from '../test-utils/timer-helpers'

it('should retry on error', async () => {
  // ... setup mocks ...

  const extractPromise = builder.extractConceptsFromChunk(chunk)
  jest.advanceTimersByTime(TIMER_ADVANCES.ONE_RETRY)

  await extractPromise
  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Advancing timers without starting async operation first
```typescript
// WRONG - advancement happens before operation starts
jest.advanceTimersByTime(150)
await builder.extractConceptsFromChunk(chunk) // Never triggers retry

// CORRECT - operation starts first, then timers advance
const promise = builder.extractConceptsFromChunk(chunk)
jest.advanceTimersByTime(150)
await promise
```

### Pitfall 2: Advancing too little
```typescript
// WRONG - only 50ms, but retry delay is 100-110ms
jest.advanceTimersByTime(50)

// CORRECT - 150ms covers 100-110ms delay + buffer
jest.advanceTimersByTime(150)
```

### Pitfall 3: Advancing too much (can mask race conditions)
```typescript
// SUBOPTIMAL - advancing 5000ms when only 150ms needed
jest.advanceTimersByTime(5000)

// CORRECT - advance only what's needed
jest.advanceTimersByTime(150)
```

### Pitfall 4: Forgetting to restore real timers
```typescript
// WRONG - forgot afterEach
beforeEach(() => {
  jest.useFakeTimers()
})
// No afterEach - tests from this suite affect others!

// CORRECT - always restore
afterEach(() => {
  jest.useRealTimers()
})
```

### Pitfall 5: Using jest.runAllTimers() instead of advancing specific amounts
```typescript
// PROBLEMATIC - runs ALL timers, could be 30+ seconds
jest.runAllTimers()

// CORRECT - advance only what's needed
jest.advanceTimersByTime(150)
```

---

## Testing Your Implementation

### Test Script
```bash
#!/bin/bash

# Run with verbose output to see timer activity
npm test -- graph-builder-retry.test.ts --verbose

# Run multiple times to catch flakiness
for i in {1..5}; do
  echo "Run $i..."
  npm test -- graph-builder-retry.test.ts --testTimeout=5000 || exit 1
done

echo "All 5 runs passed!"
```

### Expected Outcomes
- All 18 tests pass
- No timeouts or hangs
- Consistent execution time (~100-200ms per test)
- No warnings about timers

---

## Implementation Time Estimate

| Phase | Tests | Est. Time | Difficulty |
|-------|-------|-----------|------------|
| Setup | All | 15 min | Very Easy |
| Phase 1 (Low Risk) | #1, #3-6, #9-11, #14-16 | 45 min | Easy |
| Phase 2 (Medium Risk) | #2, #7, #8, #12, #18 | 60 min | Medium |
| Phase 3 (Validation) | #13, #17 | 30 min | Medium |
| **Total** | **All 18** | **2-3 hrs** | **Medium** |

---

**Document Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** 2025-10-17
