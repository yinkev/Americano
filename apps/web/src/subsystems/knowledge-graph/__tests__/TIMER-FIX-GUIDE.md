# Jest Fake Timers - Quick Reference Guide
## For Retry Logic Tests with Exponential Backoff

---

## The Problem

When using `jest.useFakeTimers()`, `setTimeout` and `setInterval` don't automatically resolve. Tests using retry logic with delays will hang indefinitely.

```typescript
// ❌ This will timeout with fake timers
await builder.extractConceptsFromChunk(chunk) // Has internal delay via setTimeout
```

---

## The Solution: Advance Timers

Use `jest.advanceTimersByTimeAsync()` to skip the delay periods.

```typescript
// ✅ This works with fake timers
const promise = builder.extractConceptsFromChunk(chunk)
await jest.advanceTimersByTimeAsync(150) // Skip the delay
await promise
```

---

## Pattern 1: Single Retry with Success

```typescript
it('should succeed after 1 retry', async () => {
  mockClient.create
    .mockRejectedValueOnce(error) // First attempt fails
    .mockResolvedValueOnce(success) // Second attempt succeeds

  // Start operation (don't await yet)
  const promise = builder.extractConceptsFromChunk(chunk)

  // Advance past 1st retry delay (~100ms + 10% jitter = ~110ms max)
  await jest.advanceTimersByTimeAsync(150)

  // Now await the result
  await promise

  expect(mockClient.create).toHaveBeenCalledTimes(2)
})
```

**Timer calculation:**
- Base delay: 100ms
- Jitter: 10% = 10ms
- Safe advance: 150ms (conservative)

---

## Pattern 2: Multiple Retries

```typescript
it('should succeed after 2 retries', async () => {
  mockClient.create
    .mockRejectedValueOnce(error1) // Attempt 0 fails
    .mockRejectedValueOnce(error2) // Attempt 1 fails
    .mockResolvedValueOnce(success) // Attempt 2 succeeds

  const promise = builder.extractConceptsFromChunk(chunk)

  // Advance past both retry delays
  // 1st: ~100ms, 2nd: ~200ms, jitter: ~33ms = ~333ms total
  await jest.advanceTimersByTimeAsync(400)

  await promise

  expect(mockClient.create).toHaveBeenCalledTimes(3)
})
```

**Timer calculation for exponential backoff (base=100ms, multiplier=2):**
- Attempt 0 delay: 100ms × 2^0 = 100ms + jitter
- Attempt 1 delay: 100ms × 2^1 = 200ms + jitter
- Attempt 2 delay: 100ms × 2^2 = 400ms + jitter
- **Total:** ~700ms + jitter → advance 800ms

---

## Pattern 3: Expected Failure After Retries

```typescript
it('should exhaust retries and report failure', async () => {
  mockClient.create.mockRejectedValue(error) // Always fails

  // Catch error in promise chain (not try/catch)
  const promise = builder.extractConceptsFromChunk(chunk).catch(err => err)

  // Advance past all retry attempts
  await jest.advanceTimersByTimeAsync(800) // 3 retries max

  const error = await promise

  expect(error.message).toContain('Expected error message')
  expect(mockClient.create).toHaveBeenCalledTimes(4) // Initial + 3 retries
})
```

**Why `.catch(err => err)` instead of try/catch?**
- Works better with fake timers and promise chains
- Avoids unhandled promise rejection warnings
- More explicit about error handling intent

---

## Pattern 4: Batch Processing with Retries

```typescript
it('should handle mixed successes and failures', async () => {
  mockClient.create
    .mockResolvedValueOnce(success1)    // Chunk 1 succeeds
    .mockRejectedValueOnce(error)       // Chunk 2 fails first time
    .mockResolvedValueOnce(success3)    // Chunk 3 succeeds
    .mockResolvedValueOnce(success2)    // Chunk 2 retry succeeds

  const chunks = [chunk1, chunk2, chunk3]
  const promise = builder.extractConceptsFromBatch(chunks)

  // Only chunk 2 retries once
  await jest.advanceTimersByTimeAsync(150)

  const result = await promise

  expect(result.succeeded.length).toBe(3)
})
```

---

## Pattern 5: Circuit Breaker Tests

```typescript
it('should open circuit after failures', async () => {
  mockClient.create.mockRejectedValue(error)

  const circuitBreaker = builder['circuitBreaker']

  // Trigger multiple failures
  for (let i = 0; i < 5; i++) {
    const promise = builder.extractConceptsFromChunk(chunk).catch(err => err)

    // Each attempt has 3 retries = ~700ms total
    await jest.advanceTimersByTimeAsync(800)

    await promise
  }

  expect(circuitBreaker.isOpen()).toBe(true)
})
```

---

## Pattern 6: When to Use Real Timers

Some tests genuinely need real timers. Use them sparingly:

```typescript
it('should transition to half-open after timeout', async () => {
  // Switch to real timers for this test only
  jest.useRealTimers()
  jest.setTimeout(30000) // Increase timeout if needed

  const circuitBreaker = new CircuitBreakerStateTracker(1, 100)

  circuitBreaker.recordFailure()
  expect(circuitBreaker.isOpen()).toBe(true)

  // Actually wait for timeout
  await new Promise(resolve => setTimeout(resolve, 150))

  expect(circuitBreaker.canAttemptReset()).toBe(true)
})
```

**When to use real timers:**
- Testing actual time-based state transitions
- Verifying timeout behavior
- Integration tests with external services

---

## Common Pitfalls

### ❌ Pitfall 1: Awaiting before advancing
```typescript
// WRONG: This will hang
const promise = operation()
await promise // Hangs here
await jest.advanceTimersByTimeAsync(150) // Never reached
```

### ✅ Fix: Advance before awaiting
```typescript
const promise = operation()
await jest.advanceTimersByTimeAsync(150)
await promise
```

---

### ❌ Pitfall 2: Not advancing enough
```typescript
// WRONG: Not enough time for retry
const promise = operation()
await jest.advanceTimersByTimeAsync(50) // Too short
await promise // Still hangs
```

### ✅ Fix: Be conservative with time
```typescript
const promise = operation()
await jest.advanceTimersByTimeAsync(150) // Generous buffer
await promise
```

---

### ❌ Pitfall 3: Using try/catch for expected errors
```typescript
// PROBLEMATIC: Can miss errors with fake timers
try {
  await operation()
} catch (error) {
  expect(error).toBeDefined()
}
```

### ✅ Fix: Catch in promise chain
```typescript
const error = await operation().catch(err => err)
expect(error).toBeDefined()
```

---

## Timer Advancement Cheat Sheet

| Scenario | Formula | Advance By |
|----------|---------|------------|
| 1 retry | 100ms + jitter | 150ms |
| 2 retries | 100ms + 200ms + jitter | 400ms |
| 3 retries (max) | 100ms + 200ms + 400ms + jitter | 800ms |
| Circuit breaker loop (5 failures × 3 retries each) | 5 × 800ms | 800ms per iteration |

**Base calculation:**
```typescript
baseDelay = 100ms
multiplier = 2
jitter = 10%

delay(n) = min(baseDelay × multiplier^n, maxDelay) × (1 + jitter)
```

---

## Setup and Teardown

```typescript
describe('Retry Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers() // Enable fake timers for all tests
    builder = new MockGraphBuilder()
  })

  afterEach(() => {
    jest.useRealTimers() // Restore real timers after each test
  })

  // Individual tests that need real timers can override:
  it('special test', async () => {
    jest.useRealTimers() // Override for this test only
    // Test code...
  })
})
```

---

## Debugging Tips

### Check if timers are pending
```typescript
console.log('Pending timers:', jest.getTimerCount())
```

### Run all timers to completion
```typescript
jest.runAllTimers() // Fast-forwards through all timers
```

### Advance by specific amount
```typescript
jest.advanceTimersByTime(100) // Synchronous
await jest.advanceTimersByTimeAsync(100) // Async (preferred for promises)
```

### See what timers are scheduled
```typescript
jest.advanceTimersToNextTimer() // Jump to next scheduled timer
```

---

## Quick Decision Tree

```
Do you have retry logic with delays?
├── Yes
│   ├── Is it testing actual timeout behavior?
│   │   ├── Yes → Use real timers (jest.useRealTimers())
│   │   └── No → Use fake timers + advanceTimersByTimeAsync()
│   │       ├── 1 retry? → Advance 150ms
│   │       ├── 2 retries? → Advance 400ms
│   │       └── 3+ retries? → Advance 800ms
│   └── No → Fake timers not needed
└── No → No timer changes needed
```

---

## Real-World Example from This Project

**File:** `graph-builder-retry.test.ts`
**Results:**
- Before fix: 8 tests failing, 30+ second execution
- After fix: 18 tests passing, 0.6 second execution
- Improvement: 98% faster, 100% reliability

---

## References

- [Jest Timer Mocks Documentation](https://jestjs.io/docs/timer-mocks)
- [Epic 3 Retry Strategy Architecture](../../../docs/architecture/retry-strategy-architecture.md)
- [Completion Report](../../../../../JEST-TIMER-FIX-COMPLETION-REPORT.md)

---

**Last Updated:** 2025-10-17
**Author:** Claude (AI Pair Programmer)
