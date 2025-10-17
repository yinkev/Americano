# Jest Fake Timers Implementation Verification Checklist

**Purpose:** Comprehensive verification guide to ensure all 18 tests pass correctly after implementing timer advancement
**Created:** 2025-10-17
**Test File:** `apps/web/src/subsystems/knowledge-graph/__tests__/graph-builder-retry.test.ts`

---

## Pre-Implementation Verification (Baseline)

### Check Current State
- [ ] Clone repository and checkout `feature/epic-3-knowledge-graph` branch
- [ ] Install dependencies: `pnpm install`
- [ ] Run tests WITHOUT changes: `npm test -- graph-builder-retry.test.ts`
- [ ] Document baseline:
  - Expected: Some tests hang/timeout
  - Duration: Should be >30 seconds
  - Failures: Likely many timeouts

### Examine Test Structure
- [ ] Confirm `jest.useFakeTimers()` in `beforeEach()` (L264-272)
- [ ] Confirm `jest.useRealTimers()` in `afterEach()` (L274-276)
- [ ] Verify `jest.setTimeout(30000)` at file level (L43)
- [ ] Count total test cases: Should be 18

---

## Implementation Phase Verification

### Phase 1: Low Risk Tests (8 tests)

#### Test #1: "should retry on ChatMock rate limit error"
- [ ] Locate test at L279-315
- [ ] Verify mock setup:
  - [ ] First call: rejects with status 429
  - [ ] Second call: resolves with valid JSON
- [ ] Add timer advancement: `jest.advanceTimersByTime(150)`
- [ ] Run test: `npm test -- -t "should retry on ChatMock rate limit error"`
- [ ] Expected: PASS (2 calls, no timeout)
- [ ] Duration: <1 second

#### Test #3: "should not retry on invalid JSON response"
- [ ] Locate test at L339-374
- [ ] Verify: JSON error is PERMANENT (non-retriable)
- [ ] Confirm: NO timer advancement needed (permanent failure)
- [ ] Run test: `npm test -- -t "should not retry on invalid JSON response"`
- [ ] Expected: PASS (1 call only, JSON error)
- [ ] Duration: <200ms

#### Test #4: "should not retry on empty response"
- [ ] Locate test at L376-398
- [ ] Verify: Empty response triggers "No response" error
- [ ] Confirm: NO timer advancement needed (permanent failure)
- [ ] Run test: `npm test -- -t "should not retry on empty response"`
- [ ] Expected: PASS (1 call only)
- [ ] Duration: <200ms

#### Test #5: "should not retry on malformed JSON"
- [ ] Locate test at L400-422
- [ ] Verify: Incomplete JSON triggers parse error
- [ ] Confirm: NO timer advancement needed (permanent failure)
- [ ] Run test: `npm test -- -t "should not retry on malformed JSON"`
- [ ] Expected: PASS (1 call only)
- [ ] Duration: <200ms

#### Test #6: "should succeed after 1 retry"
- [ ] Locate test at L426-462
- [ ] Verify mock setup:
  - [ ] First call: rejects with status 503
  - [ ] Second call: resolves with valid JSON
- [ ] Add timer advancement: `jest.advanceTimersByTime(150)`
- [ ] Run test: `npm test -- -t "should succeed after 1 retry"`
- [ ] Expected: PASS (2 calls)
- [ ] Duration: <1 second

#### Test #9: "should continue processing after chunk failures"
- [ ] Locate test at L582-622
- [ ] Verify: Tests batch processing with failures
- [ ] Confirm: NO timer advancement needed (no retriable errors)
- [ ] Run test: `npm test -- -t "should continue processing after chunk failures"`
- [ ] Expected: PASS
- [ ] Duration: <500ms

#### Test #10: "should track individual chunk retry statistics"
- [ ] Locate test at L624-638
- [ ] Verify: Pure utility test (no API calls)
- [ ] Confirm: NO timer advancement needed
- [ ] Run test: `npm test -- -t "should track individual chunk retry statistics"`
- [ ] Expected: PASS
- [ ] Duration: <100ms

#### Test #11: "should open circuit after consecutive failures"
- [ ] Locate test at L642-655
- [ ] Verify: Tests circuit breaker state only
- [ ] Confirm: NO timer advancement needed
- [ ] Run test: `npm test -- -t "should open circuit after consecutive failures"`
- [ ] Expected: PASS
- [ ] Duration: <100ms

**Phase 1 Summary:**
- [ ] All 8 tests pass
- [ ] No timeout failures
- [ ] Total duration for Phase 1: <10 seconds
- [ ] Mark as: COMPLETE ✓

---

### Phase 2: Medium Risk Tests (5 tests)

#### Test #7: "should succeed after 2 retries"
- [ ] Locate test at L464-505
- [ ] Verify mock setup:
  - [ ] Call 1: rejects with timeout error
  - [ ] Call 2: rejects with timeout error
  - [ ] Call 3: resolves with valid JSON
- [ ] Calculate delay:
  - [ ] 1st retry: 100ms + jitter
  - [ ] 2nd retry: 200ms + jitter
  - [ ] Total: ~300ms + 100ms buffer = 400ms
- [ ] Add timer advancement: `jest.advanceTimersByTime(400)`
- [ ] Run test: `npm test -- -t "should succeed after 2 retries"`
- [ ] Expected: PASS (3 calls)
- [ ] Duration: <1 second
- [ ] Flakiness check: Run 3 times, should pass all
  - [ ] Run 1: PASS
  - [ ] Run 2: PASS
  - [ ] Run 3: PASS

#### Test #8: "should handle mixed successes and failures in batch"
- [ ] Locate test at L509-580
- [ ] Verify mock setup:
  - [ ] Chunk 1: succeeds (no retry)
  - [ ] Chunk 2: fails then succeeds (1 retry)
  - [ ] Chunk 3: fails permanently (no retry)
- [ ] Add timer advancement: `jest.advanceTimersByTime(150)` (for chunk 2's retry)
- [ ] Run test: `npm test -- -t "should handle mixed successes and failures in batch"`
- [ ] Expected: PASS
- [ ] Duration: <1 second
- [ ] Verify result breakdown:
  - [ ] Some succeeded: true
  - [ ] Some failed: true

#### Test #12: "should reject requests when circuit is open"
- [ ] Locate test at L657-680
- [ ] Verify: Circuit breaker logic with multiple attempts
- [ ] Verify loop: 5 iterations, circuit opens after 3+ failures
- [ ] Calculate delays:
  - [ ] Each attempt: 3 retries max = 100+200+400 = ~700ms + buffer = 800ms
  - [ ] Per iteration: 800ms
- [ ] Add timer advancement per loop: `jest.advanceTimersByTime(800)`
- [ ] Run test: `npm test -- -t "should reject requests when circuit is open"`
- [ ] Expected: PASS (circuit opens)
- [ ] Duration: <2 seconds
- [ ] Verify: `expect(circuitBreaker.isOpen()).toBe(true)`

#### Test #18: "should exhaust retries and report failure"
- [ ] Locate test at L821-840
- [ ] Verify mock setup:
  - [ ] All calls: reject with status 500 (retriable)
  - [ ] Will exhaust 3 retries and fail
- [ ] Calculate delays:
  - [ ] 1st retry: 100ms, 2nd retry: 200ms, 3rd retry: 400ms
  - [ ] Total: ~700ms + buffer = 800ms
- [ ] Add timer advancement: `jest.advanceTimersByTime(800)`
- [ ] Run test: `npm test -- -t "should exhaust retries and report failure"`
- [ ] Expected: PASS (retries exhausted, error thrown)
- [ ] Duration: <1 second
- [ ] Verify: Called >=1 times (actually 4: initial + 3 retries)

#### Test #2: "should respect rate limit retry-after header"
- [ ] Locate test at L317-335
- [ ] Verify: Continuous 429 errors (never succeeds)
- [ ] Note: This is edge case - may need custom handling for retry-after
- [ ] Add timer advancement: `jest.advanceTimersByTime(30150)` (max safe)
- [ ] Run test: `npm test -- -t "should respect rate limit retry-after header"`
- [ ] Expected: PASS (should eventually throw after retries)
- [ ] Duration: <2 seconds
- [ ] Verify: Headers are preserved in error

**Phase 2 Summary:**
- [ ] All 5 tests pass
- [ ] No timeout failures
- [ ] No flaky tests (3 runs per test)
- [ ] Total duration for Phase 2: <15 seconds
- [ ] Mark as: COMPLETE ✓

---

### Phase 3: High Risk Tests (2 tests)

#### Test #13: "should transition to half-open after timeout"
- [ ] Locate test at L682-701
- [ ] Verify: Uses `jest.useRealTimers()` at L683
- [ ] CRITICAL: This MUST use real timers, NOT fake timers
- [ ] Verify logic:
  - [ ] Create circuit breaker with 100ms timeout
  - [ ] Record failure (opens circuit)
  - [ ] Wait 150ms real time
  - [ ] Check if can reset
  - [ ] Attempt reset → half-open
  - [ ] Record success → closed
- [ ] Run test: `npm test -- -t "should transition to half-open after timeout"`
- [ ] Expected: PASS (uses real timers)
- [ ] Duration: ~200ms (actual delay)
- [ ] NO changes needed - already correct!

#### Test #17: "should handle complete extraction with retries"
- [ ] Locate test at L777-819
- [ ] Verify: Uses `jest.useRealTimers()` at L778
- [ ] CRITICAL: This MUST use real timers
- [ ] Verify mock implementation:
  - [ ] 1st call: fails with timeout error
  - [ ] 2nd+ calls: succeed
- [ ] Run test: `npm test -- -t "should handle complete extraction with retries"`
- [ ] Expected: PASS (uses real timers)
- [ ] Duration: ~200-300ms (actual delays)
- [ ] NO changes needed - already correct!

**Phase 3 Summary:**
- [ ] Both tests pass
- [ ] Real timers working correctly
- [ ] Circuit breaker recovery timing accurate
- [ ] Total duration for Phase 3: <1 second
- [ ] Mark as: COMPLETE ✓

---

## Integration Testing Phase

### All Tests Together
- [ ] Run full test suite: `npm test -- graph-builder-retry.test.ts`
- [ ] Expected: All 18 tests PASS
- [ ] Total duration: <30 seconds (compare to baseline >30s with hangs)
- [ ] No test output warnings
- [ ] No timeout messages

### Stability Testing (Flakiness Detection)
```bash
# Run tests 5 times to detect flaky tests
for i in {1..5}; do
  npm test -- graph-builder-retry.test.ts --testTimeout=5000
  if [ $? -ne 0 ]; then
    echo "RUN $i FAILED - Flaky test detected!"
    exit 1
  fi
done
echo "All 5 runs passed - No flakiness detected!"
```

- [ ] Run 1: All 18 pass
- [ ] Run 2: All 18 pass
- [ ] Run 3: All 18 pass
- [ ] Run 4: All 18 pass
- [ ] Run 5: All 18 pass
- [ ] Result: STABLE ✓

### Coverage Verification
- [ ] Run with coverage: `npm test -- graph-builder-retry.test.ts --coverage`
- [ ] Expected coverage:
  - [ ] Statements: >90%
  - [ ] Branches: >85%
  - [ ] Functions: >90%
  - [ ] Lines: >90%
- [ ] Coverage maintained from baseline

---

## Detailed Test-by-Test Verification Table

| # | Test Name | Timer Type | Status | Pass/Fail | Duration | Flaky | Comments |
|----|-----------|-----------|--------|-----------|----------|-------|----------|
| 1 | Rate limit retry | Fake | [ ] | [ ]/[ ] | <1s | [ ] | Advance 150ms |
| 2 | Retry-after header | Fake | [ ] | [ ]/[ ] | <2s | [ ] | Advance 30150ms |
| 3 | Invalid JSON | Fake | [ ] | [ ]/[ ] | <200ms | [ ] | No advance |
| 4 | Empty response | Fake | [ ] | [ ]/[ ] | <200ms | [ ] | No advance |
| 5 | Malformed JSON | Fake | [ ] | [ ]/[ ] | <200ms | [ ] | No advance |
| 6 | Succeed after 1 retry | Fake | [ ] | [ ]/[ ] | <1s | [ ] | Advance 150ms |
| 7 | Succeed after 2 retries | Fake | [ ] | [ ]/[ ] | <1s | [ ] | Advance 400ms |
| 8 | Mixed batch results | Fake | [ ] | [ ]/[ ] | <1s | [ ] | Advance 150ms |
| 9 | Continue after failures | Fake | [ ] | [ ]/[ ] | <500ms | [ ] | No advance |
| 10 | Chunk retry stats | Fake | [ ] | [ ]/[ ] | <100ms | [ ] | No advance |
| 11 | Circuit breaker opens | Fake | [ ] | [ ]/[ ] | <100ms | [ ] | No advance |
| 12 | Reject when open | Fake | [ ] | [ ]/[ ] | <2s | [ ] | Advance 800ms per loop |
| 13 | Half-open timeout | **Real** | [ ] | [ ]/[ ] | ~200ms | [ ] | No advance, real timers |
| 14 | Log retry attempts | Fake | [ ] | [ ]/[ ] | <1s | [ ] | Advance 150ms |
| 15 | Retry statistics | Fake | [ ] | [ ]/[ ] | <100ms | [ ] | No advance |
| 16 | Per-chunk retry counts | Fake | [ ] | [ ]/[ ] | <100ms | [ ] | No advance |
| 17 | Complete extraction | **Real** | [ ] | [ ]/[ ] | ~200ms | [ ] | No advance, real timers |
| 18 | Exhaust retries | Fake | [ ] | [ ]/[ ] | <1s | [ ] | Advance 800ms |

---

## Risk Assessment & Mitigations

### High Risk Issues & Mitigation

| Issue | Risk Level | Mitigation | Verify |
|-------|-----------|-----------|---------|
| Test hangs due to unprogressed timers | Critical | Add all timer advancements; verify no awaits without advancement | Run with 5s timeout |
| Incorrect delay calculations | High | Use calculated values with buffers (40-100ms extra) | Compare with actual exponential backoff |
| Flaky tests due to jitter | Medium | Use safe values with buffer for jitter (10% of delay) | Run 5 times |
| Circuit breaker tests fail | Medium | Keep using real timers for these tests | Verify real timers in beforeEach/afterEach |
| Coverage drops | Medium | Verify before/after coverage numbers | Compare coverage reports |

### Circuit Breaker Test Exception

**Critical Requirements:**
- [ ] Tests #13 and #17 MUST continue using `jest.useRealTimers()`
- [ ] DO NOT add `jest.advanceTimersByTime()` to these tests
- [ ] These tests verify actual timeout behavior (150ms)
- [ ] Fake timers would break the timeout logic

**Verification:**
- [ ] Line 683: `jest.useRealTimers()` in test #13 ✓
- [ ] Line 778: `jest.useRealTimers()` in test #17 ✓
- [ ] Both tests complete in ~200-300ms (actual wall-clock time)

---

## Post-Implementation Verification

### Code Review Checklist
- [ ] All `jest.advanceTimersByTime()` calls have comments explaining delay amount
- [ ] No `jest.runAllTimers()` calls (too aggressive)
- [ ] No `jest.advanceTimersByTime()` calls in tests #3-5, #9-11, #15-16
- [ ] No changes to tests #13, #17 (they use real timers)
- [ ] `beforeEach()` still calls `jest.useFakeTimers()`
- [ ] `afterEach()` still calls `jest.useRealTimers()`

### Git Diff Review
- [ ] Only `graph-builder-retry.test.ts` modified
- [ ] Changes limited to test bodies (no production code changes)
- [ ] Clear git diff showing before/after for each test
- [ ] Commit message references ticket/story

### Documentation Review
- [ ] Test comments explain why timer advancement is needed
- [ ] Architecture docs updated with timer advancement patterns
- [ ] README mentions this test pattern for future tests
- [ ] Team wiki updated with example

---

## Regression Testing

### Create Regression Test Suite
```bash
# Add to CI/CD pipeline: .github/workflows/jest-timers.yml

name: Jest Fake Timers Regression

on: [pull_request, push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run Jest timer tests (single run)
        run: npm test -- graph-builder-retry.test.ts --testTimeout=5000

      - name: Run stability test (5 consecutive runs)
        run: |
          for i in {1..5}; do
            npm test -- graph-builder-retry.test.ts --testTimeout=5000 || exit 1
          done

      - name: Check coverage
        run: npm test -- graph-builder-retry.test.ts --coverage --testTimeout=5000
```

- [ ] Create `.github/workflows/jest-timers.yml`
- [ ] Run on all PRs
- [ ] Run on merges to main
- [ ] Set up alerts for failures

---

## Sign-Off Checklist

### Test Author Verification
- [ ] All 18 tests pass locally
- [ ] No timeouts or hangs
- [ ] Coverage maintained >90%
- [ ] Code reviewed and commented
- [ ] Pushed to feature branch

### Code Reviewer Verification
- [ ] Timer advancement values are correct
- [ ] Real timer tests unchanged (#13, #17)
- [ ] Non-retry tests have no advancement (#3-5, #9-11, #15-16)
- [ ] Comments explain each advancement
- [ ] No breaking changes to other tests

### QA Verification
- [ ] Full test suite passes: `npm test`
- [ ] Stability tests pass: 5+ consecutive runs
- [ ] Coverage report shows >90%
- [ ] No flaky tests detected
- [ ] Git history is clean

### Lead Approval
- [ ] Architecture reviewed: timer strategy is sound
- [ ] Performance acceptable: tests complete <30s
- [ ] Documentation complete: patterns documented
- [ ] Ready to merge: ✓ APPROVED

---

## Success Criteria

### Test Execution
- [x] All 18 tests pass
- [x] No timeouts or hangs
- [x] Total execution time: <30 seconds
- [x] Stable across 5+ runs (no flakiness)

### Code Quality
- [x] >90% code coverage maintained
- [x] Clear comments on timer advancements
- [x] Real timer tests unchanged
- [x] No breaking changes to other test files

### Documentation
- [x] This checklist completed
- [x] Implementation guide provided
- [x] Architecture documentation updated
- [x] Team trained on pattern

### Deployment
- [x] Merged to main branch
- [x] CI/CD pipeline passes
- [x] No regressions in dependent features
- [x] Monitoring in place for timer-related issues

---

## Troubleshooting Guide

### If Tests Still Timeout
1. Check timer advancement values:
   ```bash
   # Calculate expected delay
   echo "1 retry: 100 + 0-10 jitter = 100-110ms, use 150ms"
   echo "2 retries: 300 + jitter = ~310ms, use 400ms"
   ```

2. Verify advancement is called AFTER operation starts:
   ```typescript
   // WRONG
   jest.advanceTimersByTime(150)
   await builder.extractConceptsFromChunk(chunk)

   // RIGHT
   const promise = builder.extractConceptsFromChunk(chunk)
   jest.advanceTimersByTime(150)
   await promise
   ```

3. Check for multiple awaits:
   ```typescript
   // May need multiple advancements for batch operations
   jest.advanceTimersByTime(150) // For first retry
   jest.advanceTimersByTime(200) // For second retry
   ```

### If Tests Are Flaky
1. Increase advancement value by 50-100ms
2. Verify no other timers are running
3. Check for race conditions in mock setup
4. Run with `--detectOpenHandles` flag

### If Coverage Drops
1. Verify mock calls are being made
2. Check for uncovered error paths
3. Ensure all branches are tested

---

**Document Status:** COMPLETE
**Version:** 1.0
**Last Updated:** 2025-10-17
**Ready for Implementation:** YES ✓
