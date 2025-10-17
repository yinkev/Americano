# Jest Fake Timers Quick Reference Card

**Use this for fast lookups while implementing**

---

## Timer Advancement Quick Look

```
NO ADVANCEMENT NEEDED     │  150ms ADVANCEMENT    │  400ms ADVANCEMENT    │  800ms ADVANCEMENT    │  30,150ms ADVANCEMENT
Tests #3-5, #9-11, #15-16│  Tests #1, #6, #14    │  Test #7              │  Tests #12, #18       │  Test #2
(Permanent errors)        │  (1 retry)            │  (2 retries)          │  (3 retries)          │  (max retries)
```

---

## Implementation Patterns (Copy-Paste Ready)

### Pattern A: Single Retry (150ms)
```typescript
// Tests #1, #6, #14
const extractPromise = builder.extractConceptsFromChunk(chunk)
jest.advanceTimersByTime(150)
await extractPromise
```

### Pattern B: Two Retries (400ms)
```typescript
// Test #7
const extractPromise = builder.extractConceptsFromChunk(chunk)
jest.advanceTimersByTime(400)
await extractPromise
```

### Pattern C: Max Retries (800ms or 30,150ms)
```typescript
// Tests #12, #18, optionally #2
const extractPromise = builder.extractConceptsFromChunk(chunk)
jest.advanceTimersByTime(800) // or 30,150 for absolute max
await extractPromise
```

### Pattern D: No Advancement (Keep As-Is)
```typescript
// Tests #3-5, #9-11, #15-16
// NO CHANGES - test runs as-is
await builder.extractConceptsFromChunk(chunk)
```

### Pattern E: Real Timers (No Changes)
```typescript
// Tests #13, #17 - ALREADY CORRECT
jest.useRealTimers() // Already in place
// No advancement needed
```

---

## Decision Tree

```
START: Does test trigger retries?
  │
  ├─ NO  → Go to "Non-Retry Tests"
  │
  └─ YES → Does it use real timers (circuit breaker recovery)?
      │
      ├─ YES (Tests #13, #17) → NO CHANGES NEEDED
      │
      └─ NO → How many retries?
          │
          ├─ 1 retry (Tests #1, #6, #14)     → Advance 150ms
          ├─ 2 retries (Test #7)              → Advance 400ms
          ├─ 3 retries (Tests #18)            → Advance 800ms
          ├─ 3+ retries in loop (Test #12)    → Advance 800ms per loop
          └─ Max possible (Test #2)           → Advance 30,150ms

NON-RETRY TESTS (Permanent errors or utilities)
  │
  ├─ Tests #3, #4, #5 (JSON errors)    → NO CHANGES
  ├─ Tests #9, #10, #11                → NO CHANGES
  ├─ Tests #15, #16 (Utilities)        → NO CHANGES
```

---

## Changes Required by Test

| Test | Change | Add Line |
|------|--------|----------|
| 1 | YES | `jest.advanceTimersByTime(150)` |
| 2 | YES | `jest.advanceTimersByTime(30150)` |
| 3 | NO | - |
| 4 | NO | - |
| 5 | NO | - |
| 6 | YES | `jest.advanceTimersByTime(150)` |
| 7 | YES | `jest.advanceTimersByTime(400)` |
| 8 | YES | `jest.advanceTimersByTime(150)` |
| 9 | NO | - |
| 10 | NO | - |
| 11 | NO | - |
| 12 | YES | `jest.advanceTimersByTime(800)` (in loop) |
| 13 | NO | (already uses real timers) |
| 14 | YES | `jest.advanceTimersByTime(150)` |
| 15 | NO | - |
| 16 | NO | - |
| 17 | NO | (already uses real timers) |
| 18 | YES | `jest.advanceTimersByTime(800)` |

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Test hangs/times out | Add: `jest.advanceTimersByTime(150/400/800/30150)` BEFORE `await` |
| "Cannot find module" error | Check import paths in test file |
| "Timer not advancing" | Verify timer advancement is AFTER operation starts |
| "Too much time advanced" | Reduce advancement value by 50-100ms |
| Test still flaky | Increase advancement by buffer amount |

---

## Correct vs Incorrect Patterns

```
❌ WRONG - Timers advance before operation starts
jest.advanceTimersByTime(150)
await builder.extractConceptsFromChunk(chunk)

✓ CORRECT - Operation starts first, then timers advance
const promise = builder.extractConceptsFromChunk(chunk)
jest.advanceTimersByTime(150)
await promise

❌ WRONG - Using jest.runAllTimers()
jest.runAllTimers() // Could run for 30+ seconds

✓ CORRECT - Advance specific amount
jest.advanceTimersByTime(150) // Advance exactly 150ms

❌ WRONG - Forgetting real timers
jest.useFakeTimers()
// No jest.useRealTimers() in afterEach

✓ CORRECT - Always restore
beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())
```

---

## Exponential Backoff Reference

For calculating advancement values:

```
Formula: baseDelay × 2^attempt + jitter (0-10% of baseDelay)
baseDelay = 100ms, maxDelay = 30,000ms

Attempt 0: 100 × 2^0 = 100ms (+0-10ms jitter) = 100-110ms
Attempt 1: 100 × 2^1 = 200ms (+0-20ms jitter) = 200-220ms
Attempt 2: 100 × 2^2 = 400ms (+0-40ms jitter) = 400-440ms
Attempt 3: 100 × 2^3 = 800ms (+0-80ms jitter) = 800-880ms
Attempt 4+: Capped at 30,000ms (+ 0-3,000ms jitter) = 30,000-33,000ms

Safe advancement values (with buffer):
1 retry:  100-110ms    → use 150ms
2 retries: 100+200+jitter = 300ms  → use 400ms
3 retries: 100+200+400+jitter = 700ms → use 800ms
Max:      30,000ms max → use 30,150ms
```

---

## Checklist for Each Implementation

- [ ] Test identified (number and name)
- [ ] Retries triggered? (yes/no)
- [ ] Timer advancement value calculated
- [ ] Added: `const promise = builder...`
- [ ] Added: `jest.advanceTimersByTime(XXX)`
- [ ] Modified: `await promise` instead of `await builder...`
- [ ] Test passes: `npm test -- -t "test name"`
- [ ] No errors or warnings
- [ ] Ready for next test

---

## Verification Commands

```bash
# Test single test
npm test -- -t "test name"

# Test whole file
npm test -- graph-builder-retry.test.ts

# Test with verbose output
npm test -- graph-builder-retry.test.ts --verbose

# Run 5 times to check flakiness
for i in {1..5}; do npm test -- graph-builder-retry.test.ts; done

# Check coverage
npm test -- graph-builder-retry.test.ts --coverage
```

---

## Files in This Analysis

1. **JEST-FAKE-TIMERS-ANALYSIS.md** ← Main analysis (start here)
2. **JEST-TIMER-IMPLEMENTATION-GUIDE.md** ← Implementation details
3. **JEST-TIMER-VERIFICATION-CHECKLIST.md** ← QA checklist
4. **JEST-TIMER-TESTS-CSV.csv** ← Data table
5. **JEST-TIMER-ANALYSIS-SUMMARY.md** ← Executive summary
6. **JEST-TIMER-QUICK-REFERENCE.md** ← This file (quick lookup)

---

## Contact & Questions

- **Main Analysis:** See JEST-FAKE-TIMERS-ANALYSIS.md (Section 2 & 3)
- **Implementation Help:** See JEST-TIMER-IMPLEMENTATION-GUIDE.md (Section 1-2)
- **Troubleshooting:** See JEST-TIMER-VERIFICATION-CHECKLIST.md (Troubleshooting section)
- **Data Table:** See JEST-TIMER-TESTS-CSV.csv

---

**Bookmark this file for quick reference during implementation!**

Last Updated: 2025-10-17
