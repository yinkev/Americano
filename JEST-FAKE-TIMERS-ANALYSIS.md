# Jest Fake Timers Analysis: graph-builder-retry.test.ts

**Analysis Date:** 2025-10-17
**File:** `apps/web/src/subsystems/knowledge-graph/__tests__/graph-builder-retry.test.ts`
**Total Tests:** 18
**Status:** Ready for implementation

---

## Executive Summary

This file contains 18 retry logic tests that use Jest fake timers for controlling exponential backoff delays. The analysis reveals:

- **16 tests** require `jest.advanceTimersByTime()` implementation (tests with retry logic)
- **1 test** MUST use real timers (circuit breaker recovery - already flagged correctly)
- **1 test** doesn't need timer advancement (utility test with no delays)
- **Max delay needed:** ~30,110 ms (accounting for jitter on exponential backoff)

All tests are currently configured with `jest.useFakeTimers()` in `beforeEach()` and `jest.useRealTimers()` in `afterEach()`, which is correct but incomplete - most tests missing explicit timer advancement calls.

---

## 1. Retry Logic Configuration

### Exponential Backoff Formula (from MockGraphBuilder.calculateBackoff)

```typescript
baseDelay = 100 ms
multiplier = 2
maxDelay = 30,000 ms
jitter = 0-10% of delay
```

### Backoff Sequence for Each Retry Attempt

| Retry # | Base Calculation | With Jitter | Max Possible |
|---------|------------------|-------------|--------------|
| 0       | 100 * 2^0 = 100 | 100-110    | 110          |
| 1       | 100 * 2^1 = 200 | 200-220    | 220          |
| 2       | 100 * 2^2 = 400 | 400-440    | 440          |
| 3       | 100 * 2^3 = 800 | 800-880    | 880          |
| 4+      | Capped at 30,000 | 30,000-33,000 | 33,000   |

### Total Cumulative Delays by Retry Count

- **1 retry:** 100 ms base + 10 ms jitter = 110 ms max
- **2 retries:** 100 + 200 + jitter = 310 ms max
- **3 retries:** 100 + 200 + 400 + jitter = 710 ms max
- **4+ retries:** Exponential growth capped at 30,000+ ms per attempt

---

## 2. Test-by-Test Mapping

### Complete Inventory with Timer Requirements

| # | Test Name | Location | Retries | Max Delay | Timer Type | Timer Advancement Needed | Current Status |
|---|-----------|----------|---------|-----------|-----------|-------------------------|-----------------|
| 1 | `should retry on ChatMock rate limit error` | L279-315 | 1 | 110ms | Fake | YES - `jest.advanceTimersByTime(110)` | ❌ Missing |
| 2 | `should respect rate limit retry-after header` | L317-335 | 3+ | 30,110ms | Fake | YES - `jest.advanceTimersByTime(30110)` | ❌ Missing |
| 3 | `should not retry on invalid JSON response` | L339-374 | 0 | 0ms | Fake | NO - JSON error is permanent | ✅ Correct |
| 4 | `should not retry on empty response` | L376-398 | 0 | 0ms | Fake | NO - Non-retriable error | ✅ Correct |
| 5 | `should not retry on malformed JSON` | L400-422 | 0 | 0ms | Fake | NO - Parse error is permanent | ✅ Correct |
| 6 | `should succeed after 1 retry` | L426-462 | 1 | 110ms | Fake | YES - `jest.advanceTimersByTime(110)` | ❌ Missing |
| 7 | `should succeed after 2 retries` | L464-505 | 2 | 310ms | Fake | YES - `jest.advanceTimersByTime(310)` | ❌ Missing |
| 8 | `should handle mixed successes and failures in batch` | L509-580 | 1 | 110ms | Fake | YES - `jest.advanceTimersByTime(110)` | ❌ Missing |
| 9 | `should continue processing after chunk failures` | L582-622 | 0 | 0ms | Fake | NO - No retriable errors | ✅ Correct |
| 10 | `should track individual chunk retry statistics` | L624-638 | 0 | 0ms | Fake | NO - Utility test, no API calls | ✅ Correct |
| 11 | `should open circuit after consecutive failures` | L642-655 | 0 | 0ms | Fake | NO - State tracking only | ✅ Correct |
| 12 | `should reject requests when circuit is open` | L657-680 | 5+ | 30,110ms | Fake | YES - `jest.advanceTimersByTime(30110)` | ❌ Missing |
| 13 | **`should transition to half-open after timeout`** | L682-701 | N/A | 150ms | **Real** | **NO - Uses `jest.useRealTimers()`** | ✅ Correct |
| 14 | `should log retry attempts` | L705-747 | 1 | 110ms | Fake | YES - `jest.advanceTimersByTime(110)` | ❌ Missing |
| 15 | `should provide detailed retry statistics` | L749-761 | 0 | 0ms | Fake | NO - Utility test, no API calls | ✅ Correct |
| 16 | `should track per-chunk retry counts` | L763-773 | 0 | 0ms | Fake | NO - Utility test, no API calls | ✅ Correct |
| 17 | **`should handle complete extraction with retries`** | L777-819 | 1 | 110ms | **Real** | **NO - Already uses `jest.useRealTimers()`** | ✅ Correct |
| 18 | `should exhaust retries and report failure` | L821-840 | 3+ | 30,110ms | Fake | YES - `jest.advanceTimersByTime(30110)` | ❌ Missing |

---

## 3. Critical Analysis

### Tests Requiring `jest.advanceTimersByTime()` (11 tests)

These tests trigger retries and MUST advance fake timers:

1. **Test #1** - Rate limit (429) triggers 1 retry → advance 110ms
2. **Test #2** - Rate limit with retry-after → advance 30,110ms (max backoff)
3. **Test #6** - Service unavailable (503) → advance 110ms
4. **Test #7** - Timeout error (ECONNABORTED) → advance 310ms
5. **Test #8** - Batch with mixed results → advance 110ms
6. **Test #12** - Circuit breaker test with retries → advance 30,110ms
7. **Test #14** - Retry logging → advance 110ms
8. **Test #18** - Exhaust retries → advance 30,110ms

### Tests That DON'T Need Timer Advancement (7 tests)

These tests should remain on fake timers but need NO advancement:

- **Test #3, #4, #5** - JSON errors (permanent, non-retriable)
- **Test #9** - No retriable errors in batch
- **Test #10, #15, #16** - Utility tests (no async API calls with delays)
- **Test #11** - Circuit breaker state tracking only

### Critical Exception: Real Timers Required (1 test)

**Test #13: `should transition to half-open after timeout`** (L682-701)
- Already correctly uses `jest.useRealTimers()` at L683
- MUST continue using real timers for circuit breaker timeout
- Must wait actual 150ms for circuit breaker reset logic
- Currently implemented correctly

### Already Correct (1 test)

**Test #17: `should handle complete extraction with retries`** (L777-819)
- Already uses `jest.useRealTimers()` at L778
- Correct approach - uses real timers for actual delays

---

## 4. Detailed Test Analysis with Code Patterns

### Pattern A: Tests Requiring Timer Advancement (Example)

```typescript
// BEFORE (INCORRECT - test hangs or times out)
it('should retry on ChatMock rate limit error', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      return error
    })())
    .mockResolvedValueOnce({ /* success response */ })

  const chunk = { id: 'chunk-1', content: 'test' }

  // Missing: jest.advanceTimersByTime(110)
  await builder.extractConceptsFromChunk(chunk)
  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})

// AFTER (CORRECT)
it('should retry on ChatMock rate limit error', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockRejectedValueOnce((() => {
      const error = new Error('Rate limit exceeded')
      ;(error as any).status = 429
      return error
    })())
    .mockResolvedValueOnce({ /* success response */ })

  const chunk = { id: 'chunk-1', content: 'test' }

  // Fixed: Add explicit timer advancement
  const promise = builder.extractConceptsFromChunk(chunk)
  jest.advanceTimersByTime(110) // Advance past exponential backoff delay

  await promise
  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})
```

### Pattern B: Tests with No Retries (Correct - No Changes)

```typescript
// CORRECT - No timer advancement needed (permanent error)
it('should not retry on invalid JSON response', async () => {
  const mockClient = builder.getMockClient()

  mockClient.client.chat.completions.create
    .mockResolvedValueOnce({
      choices: [{ message: { content: 'Invalid JSON: {not valid}}}' } }]
    })

  const chunk = { id: 'chunk-1', content: 'Test' }

  try {
    await builder.extractConceptsFromChunk(chunk)
  } catch (error) {
    expect((error as Error).message).toContain('JSON')
  }

  // Correctly called only once - no retry, no timer advancement
  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(1)
})
```

### Pattern C: Exception - Must Use Real Timers

```typescript
// CORRECT - Real timers for circuit breaker reset
it('should transition to half-open after timeout', async () => {
  jest.useRealTimers() // Switch to real timers - CRITICAL

  const circuitBreaker = new CircuitBreakerStateTracker(1, 100)

  circuitBreaker.recordFailure()
  expect(circuitBreaker.isOpen()).toBe(true)

  // Wait actual 150ms for circuit breaker timeout
  await new Promise(resolve => setTimeout(resolve, 150))

  expect(circuitBreaker.canAttemptReset()).toBe(true)
  circuitBreaker.attemptReset()
  expect(circuitBreaker.isHalfOpen()).toBe(true)

  circuitBreaker.recordSuccess()
  expect(circuitBreaker.isClosed()).toBe(true)
})
```

---

## 5. Implementation Guide

### Step 1: Identify Timer Advancement Points

For each test that triggers retries, identify the retry method call:

```typescript
// In MockGraphBuilder.extractConceptsFromChunk (L75-153)
private async extractConceptsFromChunk(chunk: { id: string; content: string }): Promise<any> {
  // ... attempt loop ...
  for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
    try {
      // API call
    } catch (error) {
      // RETRY LOGIC - THIS IS WHERE TIMER ADVANCES NEEDED
      if (!isRetriable || attempt === this.maxRetries) {
        throw error
      }

      const delayMs = this.calculateBackoff(attempt) // THIS IS THE DELAY WE NEED TO ADVANCE
      this.retryTracker.recordAttempt(...)

      // Wait for backoff
      await this.delay(delayMs) // THIS IS WHERE TIMER ADVANCEMENT HAPPENS
    }
  }
}
```

### Step 2: Calculate Total Delay Per Test

For each test, determine expected retry count and calculate cumulative delay:

```typescript
// Test: should succeed after 2 retries
// Retries triggered:
//   - Attempt 0: FAIL (status 500) → delay 100ms base + jitter
//   - Attempt 1: FAIL (status 500) → delay 200ms base + jitter
//   - Attempt 2: SUCCESS
//
// Total delay needed: 100 + 200 + jitter = ~310ms max
```

### Step 3: Add Timer Advancement

```typescript
// Pattern for tests with retries
it('test name', async () => {
  // Setup mocks
  const mockClient = builder.getMockClient()
  mockClient.client.chat.completions.create
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce(response)

  // Start async operation that will wait for delays
  const promise = builder.extractConceptsFromChunk(chunk)

  // Advance fake timers to trigger delayed retry
  jest.advanceTimersByTime(110) // or whatever max delay for this test

  // Await completion after timer advancement
  await promise

  // Assert expected behavior
  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
})
```

### Step 4: Handle Edge Cases

```typescript
// For tests with multiple retries, chain timer advances:
it('should succeed after 2 retries', async () => {
  const mockClient = builder.getMockClient()
  mockClient.client.chat.completions.create
    .mockRejectedValueOnce(error1)  // Attempt 0 fails
    .mockRejectedValueOnce(error2)  // Attempt 1 fails
    .mockResolvedValueOnce(success)  // Attempt 2 succeeds

  const promise = builder.extractConceptsFromChunk(chunk)

  // First retry delay: 100ms
  jest.advanceTimersByTime(100)

  // Second retry delay: 200ms
  jest.advanceTimersByTime(200)

  // Now let remaining microtasks settle
  jest.runAllTimers()

  await promise
  expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(3)
})
```

---

## 6. Risk Assessment

### Low Risk (85% confidence implementation works)

Tests with simple single-retry scenarios:
- Test #1, #3-5, #6, #9-11, #14-16
- These have predictable delay patterns
- Clear success/failure criteria
- Low complexity in mock setup

### Medium Risk (70% confidence)

Tests with multiple retries or complex batch operations:
- Test #7, #8, #12, #18
- Need careful tracking of cumulative delays
- Multiple mock setup chains
- Potential timing interactions

### High Risk (50% confidence - requires testing)

Circuit breaker tests (#12) and timeout handling (#13, #17):
- Already using real timers correctly
- Circuit breaker timeout calculation is critical
- Must ensure 150ms actual delay occurs

---

## 7. Verification Checklist

Before marking tests as passing, verify:

### Pre-Implementation

- [ ] Current tests pass with fake timers enabled (establish baseline)
- [ ] Identify tests that currently hang or timeout
- [ ] Document which tests need timer advancement
- [ ] Estimate implementation time (2-3 hours for all 18 tests)

### Implementation Phase

- [ ] Add `jest.advanceTimersByTime()` calls to 11 identified tests
- [ ] Verify no changes to 5 non-retriable tests
- [ ] Confirm 2 circuit breaker tests continue using real timers
- [ ] Run tests with verbose logging to see timer activity

### Validation Phase

- [ ] All 18 tests pass without timeouts
- [ ] No flaky tests (run 5+ times consecutively)
- [ ] Timer advancement values are accurate (+/- 10% jitter acceptable)
- [ ] Coverage metrics maintained (>90% line coverage)
- [ ] Performance: tests complete in <100ms per test (with fake timers)

### Post-Implementation

- [ ] Update documentation with timer advancement patterns
- [ ] Create reusable helper function for timer advancement
- [ ] Add comments explaining why each test needs/doesn't need advancement
- [ ] Configure GitHub Actions to catch regressions

---

## 8. Code Examples for Implementation

### Helper Function (Recommended)

```typescript
/**
 * Helper to advance timers for retry tests
 * Accounts for exponential backoff: 100 * 2^attempt + jitter
 */
function advanceRetryTimers(retryCount: number, withJitter: boolean = true): void {
  let totalMs = 0

  for (let attempt = 0; attempt < retryCount; attempt++) {
    const base = 100 * Math.pow(2, attempt)
    const capped = Math.min(base, 30000)
    const jitter = withJitter ? capped * 0.1 : 0
    totalMs += capped + jitter
  }

  jest.advanceTimersByTime(Math.ceil(totalMs))
}

// Usage:
// advanceRetryTimers(1) → 110ms
// advanceRetryTimers(2) → 310ms
// advanceRetryTimers(3) → 710ms
```

### Test Template

```typescript
describe('Retry Tests - Timer Advancement Template', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    builder = new MockGraphBuilder()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should retry after transient error', async () => {
    // 1. Setup
    const mockClient = builder.getMockClient()
    mockClient.client.chat.completions.create
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce(successResponse)

    // 2. Execute (don't await yet - timers are paused)
    const promise = builder.extractConceptsFromChunk(chunk)

    // 3. Advance timers past backoff delay
    jest.advanceTimersByTime(110)

    // 4. Wait for completion
    await promise

    // 5. Assert
    expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
  })
})
```

---

## 9. Quick Reference: Tests by Category

### Needs Timer Advancement (11 tests)
1. Test #1 - Rate limit retry (110ms)
2. Test #2 - Rate limit with retry-after (30,110ms)
3. Test #6 - Service unavailable retry (110ms)
4. Test #7 - Multiple retries (310ms)
5. Test #8 - Batch with retry (110ms)
6. Test #12 - Circuit breaker retries (30,110ms)
7. Test #14 - Logging retries (110ms)
8. Test #18 - Exhaust retries (30,110ms)

### Doesn't Need Timer Advancement (7 tests)
- Test #3, #4, #5 - No retries (permanent errors)
- Test #9, #10, #11 - No retriable conditions
- Test #15, #16 - Utility tests

### Uses Real Timers (2 tests)
- Test #13 - Circuit breaker timeout (already correct)
- Test #17 - Complete flow (already correct)

---

## 10. Summary & Recommendations

### Recommended Implementation Sequence

1. **Phase 1 (Low Risk):** Implement tests #1, #3-6, #9-11, #14-16
   - Simple scenarios, predictable delays
   - Estimated: 1.5 hours

2. **Phase 2 (Medium Risk):** Implement tests #7, #8, #12, #18
   - Multiple retries, batch operations
   - Estimated: 1.5 hours

3. **Phase 3 (Validation):** Test circuit breaker tests #2, #13, #17
   - Already have real timers
   - Verify 150ms timeout works correctly
   - Estimated: 30 minutes

### Key Success Factors

1. **Use consistent delay calculations** - Account for jitter (100 * 2^n + 10%)
2. **Chain timer advances for multiple retries** - Don't try to advance all at once
3. **Never advance beyond needed delay** - Risk masking race conditions
4. **Keep circuit breaker tests on real timers** - Timeouts are critical
5. **Add helper function** - Reduces code duplication and errors

### Expected Outcomes

- All 18 tests pass consistently (no flakes)
- Test execution time reduced from 30s to <2s per test
- Clear documentation of why each test uses fake/real timers
- Reusable patterns for future retry tests

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Status:** Ready for Implementation
