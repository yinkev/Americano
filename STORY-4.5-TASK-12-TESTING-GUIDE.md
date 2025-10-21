# Story 4.5 Task 12 - Testing Guide

**Task:** Session Integration for Adaptive Assessment
**Status:** Implementation Complete - Ready for Testing
**Date:** 2025-10-17

---

## Quick Start

### Prerequisites
1. **Database:** Ensure Prisma schema includes adaptive assessment models
   ```bash
   cd apps/web
   npx prisma db push
   ```

2. **Dependencies:** All dependencies already installed (no new packages)

3. **Dev Server:** Start Next.js (port 3001 for Epic 4)
   ```bash
   cd apps/web
   PORT=3001 npm run dev
   ```

---

## Test Scenarios

### Scenario 1: Adaptive Assessment Trigger Detection

**Objective:** Verify that 3 failed comprehension attempts trigger adaptive assessment

**Steps:**
1. Start a study session with a mission (`/study?missionId=...`)
2. Complete the content review phase
3. Click "Continue to Review Cards" (triggers comprehension prompt)
4. **Attempt 1:** Submit answer with low quality (< 50 characters) → expect score < 60%
   - **Expected:** Warning toast "Comprehension score below 60% (1/3 attempts)"
5. Click "Try Again" (if available) or navigate to next comprehension prompt
6. **Attempt 2:** Submit another low-quality answer → expect score < 60%
   - **Expected:** Warning toast "Comprehension score below 60% (2/3 attempts)"
7. **Attempt 3:** Submit third low-quality answer → expect score < 60%
   - **Expected:** Info toast "Adaptive assessment recommended to identify knowledge gaps"
   - **Expected:** Phase transitions to `studyPhase = 'adaptive'`
   - **Expected:** Adaptive assessment UI renders with banner

**Pass Criteria:**
- ✅ Counter increments on each failure (1/3, 2/3, 3/3)
- ✅ Adaptive assessment triggers on 3rd failure
- ✅ UI transitions to adaptive phase
- ✅ Banner displays: "🎯 Adaptive Assessment Active"

**Cleanup:**
- If test passes, reset by passing a comprehension prompt (score ≥ 60%) to reset counter

---

### Scenario 2: Adaptive Session Initialization

**Objective:** Verify AdaptiveSession is created with initial difficulty

**Steps:**
1. Trigger adaptive assessment (follow Scenario 1)
2. **Observe:** API call to `POST /api/adaptive/next-question`
3. **Inspect:** Browser DevTools → Network tab → Check request/response

**Expected Request:**
```json
{
  "sessionId": "session-id-here",
  "objectiveId": "objective-id-here"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "adaptiveSessionId": "adaptive-session-id",
    "prompt": {
      "id": "prompt-id",
      "promptText": "Explain...",
      "difficultyLevel": 50
    },
    "difficulty": 50,
    "difficultyAdjustment": {
      "adjustment": 0,
      "reason": "Baseline 50 from 0 recent assessments..."
    },
    "canStopEarly": false,
    "irtEstimate": null
  }
}
```

**Database Verification:**
```sql
-- Check AdaptiveSession was created
SELECT * FROM "AdaptiveSession"
WHERE "sessionId" = 'your-session-id'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Expected fields:
-- - id (adaptive session ID)
-- - sessionId (study session ID)
-- - initialDifficulty (e.g., 50)
-- - currentDifficulty (e.g., 50)
-- - questionCount (0 initially)
-- - trajectory (empty array initially)
```

**Pass Criteria:**
- ✅ API call succeeds (200 OK)
- ✅ Response includes `adaptiveSessionId`
- ✅ Initial difficulty calculated (default 50 if no history)
- ✅ Database record created in `AdaptiveSession` table
- ✅ Local state updated: `adaptiveSessionId` set
- ✅ Zustand store updated: `storeSetAdaptiveSessionId()` called

---

### Scenario 3: Adaptive Assessment UI Rendering

**Objective:** Verify AdaptiveAssessmentInterface renders correctly

**Steps:**
1. Trigger adaptive assessment (follow Scenario 1)
2. **Observe:** Adaptive UI renders

**Expected UI Elements:**
1. **Banner Card:**
   - Background: `oklch(0.95 0.05 230)` (light blue)
   - Header: "🎯 Adaptive Assessment Active"
   - Text: "Questions will adapt to your performance in real-time..."

2. **AdaptiveAssessmentInterface Component:**
   - Question card with difficulty indicator
   - Textarea for answer input (min 10 characters)
   - Difficulty gauge (0-100 scale, color-coded)
   - Submit button ("Submit Answer")

3. **Current Difficulty Display:**
   - Shows current difficulty value (e.g., "50/100")
   - Color-coded indicator:
     - Green (0-40): Low
     - Yellow (41-70): Medium
     - Red (71-100): High

**Pass Criteria:**
- ✅ Banner renders with correct text and OKLCH colors
- ✅ AdaptiveAssessmentInterface renders
- ✅ Question text displays
- ✅ Difficulty indicator shows (default 50)
- ✅ Answer textarea accepts input
- ✅ Submit button enabled after 10+ characters

**Visual Check:**
- Take screenshot and verify glassmorphism design (bg-white/95, backdrop-blur-xl)

---

### Scenario 4: Full Adaptive Flow (Next-Question → Submit Loop)

**Objective:** Verify question → submit → next-question cycle works

**Steps:**
1. Trigger adaptive assessment (follow Scenario 1)
2. **Question 1:** Submit a high-quality answer (> 100 characters, detailed explanation)
   - **Expected:** API call to `POST /api/adaptive/next-question` with `lastScore`
   - **Expected:** Difficulty adjustment notification (if score > 85% or < 60%)
   - **Expected:** Next question rendered with adjusted difficulty
3. **Question 2:** Submit another answer
   - **Expected:** Difficulty adjusts again
   - **Expected:** IRT estimate starts calculating (after 3+ questions)
4. **Question 3-5:** Continue answering
   - **Expected:** After 3 questions, IRT early stopping may trigger
   - **Expected:** Badge appears: "Early Stop Available"
   - **Expected:** Efficiency metrics display

**Expected Difficulty Adjustments:**
- **High Score (> 85%):** Difficulty increases by +15 (e.g., 50 → 65)
  - Notification: "Excellent performance (90%) - increasing difficulty"
  - Arrow icon: Up (green)
- **Medium Score (60-85%):** Difficulty maintains ±5 (e.g., 50 → 52)
  - Notification: "Good performance (75%) - maintaining difficulty"
  - Arrow icon: Trending (blue)
- **Low Score (< 60%):** Difficulty decreases by -15 (e.g., 50 → 35)
  - Notification: "Struggling (45%) - decreasing difficulty"
  - Arrow icon: Down (yellow)

**Pass Criteria:**
- ✅ Each submission triggers next-question API call
- ✅ Difficulty adjusts based on score (+ 15, ±5, -15)
- ✅ Adjustment notification displays with reason
- ✅ Next question renders after submission
- ✅ IRT estimate calculates after 3+ questions
- ✅ Early stop badge appears when IRT converges

**Network Inspection:**
```bash
# Check DevTools → Network → Filter "adaptive"
# Should see repeated calls:
POST /api/adaptive/next-question (with lastScore, lastConfidence)
```

---

### Scenario 5: IRT Early Stopping

**Objective:** Verify IRT convergence triggers early stop option

**Steps:**
1. Trigger adaptive assessment (follow Scenario 1)
2. Answer 3-5 questions consistently (all high scores or all low scores)
3. **Observe:** After 3+ questions, IRT confidence interval should converge
4. **Expected:** Badge appears "Early Stop Available" (green)
5. **Expected:** Two buttons:
   - "Stop Early (Optimal)" (outline)
   - "Continue Anyway" (primary)
6. Click "Stop Early (Optimal)"
7. **Expected:** Adaptive assessment completes
8. **Expected:** Efficiency toast: "Assessment complete! Saved X questions (Y% efficiency)"

**Pass Criteria:**
- ✅ IRT estimate calculates (theta value)
- ✅ Confidence interval narrows (< 10 points threshold)
- ✅ Early stop badge appears
- ✅ Two-button choice renders
- ✅ Stop Early button completes assessment
- ✅ Efficiency metrics display (questions saved)

**Efficiency Calculation:**
```typescript
// Baseline: 15 traditional questions
// Adaptive: 3-5 questions (IRT early stop)
savedQuestions = 15 - questionsAsked // e.g., 15 - 4 = 11
efficiencyScore = (1 - questionsAsked / 15) * 100 // e.g., 73%
```

---

### Scenario 6: Adaptive Assessment Completion

**Objective:** Verify completion handler processes results correctly

**Steps:**
1. Complete adaptive assessment (either IRT early stop or manual completion)
2. **Observe:** `handleAdaptiveAssessmentComplete()` called
3. **Expected:** Success toast with efficiency metrics
4. **Expected:** Phase transitions to `cards` or `assessment`
5. **Expected:** Local state updated:
   - `adaptiveScore` set
   - `adaptiveQuestionsAsked` set
   - `adaptiveEfficiency` set
6. **Expected:** Zustand store updated:
   - `storeSetAdaptiveMetrics()` called
7. **Expected:** Console log displays metrics:
   ```
   Adaptive Assessment Efficiency: {
     questionsAsked: 4,
     efficiencyScore: 73,
     timeSpentMs: 120000
   }
   ```

**Pass Criteria:**
- ✅ Completion handler executes
- ✅ Toast displays efficiency (e.g., "Saved 11 questions (73% efficiency)")
- ✅ State updated (local + Zustand)
- ✅ Console log shows metrics
- ✅ Phase transitions to next (cards or assessment)

---

### Scenario 7: Session Summary Integration

**Objective:** Verify adaptive metrics included in objective completion

**Steps:**
1. Complete adaptive assessment (follow Scenarios 1-6)
2. Continue to next phase (cards or skip to assessment)
3. Complete objective (self-assessment dialog)
4. **Inspect:** Network → `POST /api/learning/sessions/{sessionId}/objectives/{objectiveId}/complete`

**Expected Payload:**
```json
{
  "selfAssessment": 4,
  "confidenceRating": 4,
  "notes": "...",
  "timeSpentMs": 300000,
  "comprehensionScore": 45,           // From Story 4.1
  "clinicalScenarioScore": null,       // From Story 4.2 (if applicable)
  "clinicalScenarioTime": null,
  "adaptiveScore": 78,                 // Story 4.5 Task 12.5
  "adaptiveQuestionsAsked": 4,         // Story 4.5 Task 12.5
  "adaptiveEfficiency": 73,            // Story 4.5 Task 12.5
  "adaptiveTimeSpent": 120000          // Story 4.5 Task 12.6 (separate time)
}
```

**Database Verification:**
```sql
-- Check ObjectiveCompletion record
SELECT
  "comprehensionScore",
  "clinicalScenarioScore",
  "adaptiveScore",
  "adaptiveQuestionsAsked",
  "adaptiveEfficiency",
  "adaptiveTimeSpent"
FROM "ObjectiveCompletion"
WHERE "objectiveId" = 'your-objective-id'
ORDER BY "completedAt" DESC
LIMIT 1;
```

**Pass Criteria:**
- ✅ API call includes all adaptive metrics
- ✅ Database record stores adaptive fields
- ✅ Separate time tracking (adaptiveTimeSpent vs timeSpentMs)

---

### Scenario 8: State Persistence (Page Refresh)

**Objective:** Verify Zustand store persists adaptive state across refresh

**Steps:**
1. Trigger adaptive assessment (follow Scenario 1)
2. Answer 1-2 questions (don't complete)
3. **Refresh Page:** Press F5 or Cmd+R
4. **Observe:** Session resume dialog appears (Story 2.5)
5. Click "Resume Session"
6. **Expected:** Adaptive state restored:
   - `adaptiveSessionId` recovered from localStorage
   - Phase returns to `adaptive`
   - AdaptiveAssessmentInterface renders
7. **Inspect:** DevTools → Application → Local Storage → `study-session-storage`

**Expected localStorage Entry:**
```json
{
  "state": {
    "sessionId": "session-id",
    "adaptiveSessionId": "adaptive-session-id",
    "adaptiveScore": 78,
    "adaptiveQuestionsAsked": 2,
    "adaptiveEfficiency": null,
    ...
  },
  "version": 0
}
```

**Pass Criteria:**
- ✅ localStorage contains adaptive fields
- ✅ Page refresh preserves adaptive session ID
- ✅ Resume dialog restores session
- ✅ Adaptive phase continues seamlessly

---

### Scenario 9: Comprehension Failure Counter Reset

**Objective:** Verify counter resets on successful comprehension

**Steps:**
1. Fail comprehension once (score < 60%)
   - **Expected:** Counter at 1/3
2. Fail comprehension again (score < 60%)
   - **Expected:** Counter at 2/3
3. **Pass comprehension** (score ≥ 60%)
   - **Expected:** Counter resets to 0
4. Fail comprehension once more
   - **Expected:** Counter back at 1/3 (not 3/3)

**Pass Criteria:**
- ✅ Counter resets on success (score ≥ 60%)
- ✅ Does not trigger adaptive after reset

---

### Scenario 10: Coexistence with Other Epic 4 Features

**Objective:** Verify adaptive assessment works alongside Stories 4.1-4.4

**Steps:**
1. **Story 4.1 (Comprehension):** Complete comprehension prompt successfully → counter resets
2. **Story 4.2 (Clinical Scenarios):** Trigger clinical scenario (3+ objectives, INTERMEDIATE+ mastery) → clinical UI renders
3. **Story 4.3 (Challenge Mode):** Complete 2-3 objectives → challenge mode triggers
4. **Story 4.4 (Calibration):** Confidence calibration workflow (pre/post confidence) → calibration metrics saved
5. **Story 4.5 (Adaptive):** Fail comprehension 3 times → adaptive triggers

**Pass Criteria:**
- ✅ No conflicts between features
- ✅ All triggers work independently
- ✅ Session summary includes all metrics (comprehension, clinical, challenge, calibration, adaptive)

---

## Manual Testing Checklist

| Test | Status | Notes |
|------|--------|-------|
| **Scenario 1:** Trigger Detection (3 failures) | ⬜ | |
| **Scenario 2:** Session Initialization (API + DB) | ⬜ | |
| **Scenario 3:** UI Rendering (Banner + Component) | ⬜ | |
| **Scenario 4:** Full Flow (Next-Question Loop) | ⬜ | |
| **Scenario 5:** IRT Early Stopping | ⬜ | |
| **Scenario 6:** Completion Handler | ⬜ | |
| **Scenario 7:** Session Summary Integration | ⬜ | |
| **Scenario 8:** State Persistence (Refresh) | ⬜ | |
| **Scenario 9:** Counter Reset (Success) | ⬜ | |
| **Scenario 10:** Coexistence (Other Epic 4 Features) | ⬜ | |

**Overall Status:** ⬜ PENDING

---

## Debugging Tips

### Issue: Adaptive Assessment Not Triggering
**Check:**
1. Comprehension failure counter increments (check component state)
2. Score threshold correct (< 60%)
3. `handleComprehensionComplete()` called with low score

**Debug:**
```typescript
// Add console.log in handleComprehensionComplete()
console.log('Comprehension score:', response.score);
console.log('Failure count:', comprehensionFailureCount);
```

### Issue: API Call Fails (404/500)
**Check:**
1. Python FastAPI service running (port 8001 for Epic 4)?
   - No, this uses TypeScript API routes (Next.js)
2. API route exists: `/apps/web/src/app/api/adaptive/next-question/route.ts`
3. Database schema up-to-date: `npx prisma db push`

**Debug:**
```bash
# Check API route logs
# DevTools → Network → Response tab
# Server logs in terminal running `npm run dev`
```

### Issue: Difficulty Not Adjusting
**Check:**
1. `lastScore` included in next-question request
2. `AdaptiveDifficultyEngine.adjustDifficulty()` called in API
3. Response includes `difficultyAdjustment` object

**Debug:**
```typescript
// Check API response in DevTools
{
  "difficultyAdjustment": {
    "adjustment": 15,
    "reason": "Excellent performance (90%) - increasing difficulty"
  }
}
```

### Issue: IRT Early Stop Not Appearing
**Check:**
1. Answered 3+ questions
2. IRT calculation succeeds (no errors)
3. Confidence interval < 10 points (threshold for early stop)

**Debug:**
```typescript
// Check API response after 3+ questions
{
  "canStopEarly": true,
  "irtEstimate": {
    "theta": 0.75,
    "confidenceInterval": 8.5,
    "iterations": 4
  }
}
```

### Issue: State Not Persisting on Refresh
**Check:**
1. Zustand `persist` middleware configured correctly
2. localStorage key: `study-session-storage`
3. Browser allows localStorage (not incognito/private mode)

**Debug:**
```javascript
// DevTools → Console
localStorage.getItem('study-session-storage')
// Should return JSON string with adaptive fields
```

---

## Performance Benchmarks

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Initial Difficulty Calculation | < 200ms | TBD | ⬜ |
| Next-Question API | < 1s | TBD | ⬜ |
| Questions Asked (Adaptive) | 3-5 | TBD | ⬜ |
| Questions Saved vs Baseline | 10-12 (67-80%) | TBD | ⬜ |
| Time Savings | 67-80% | TBD | ⬜ |

---

## Known Issues

1. **Python IRT Service:** MVP uses TypeScript Rasch (1PL) implementation. Full 2PL/3PL deferred to Python service.
2. **Knowledge Graph:** Follow-up questions use prerequisite table. Full Knowledge Graph (Story 3.2) not yet implemented.
3. **Question Bank Depletion:** If no unused questions at target difficulty, API returns 404. Future: ChatMock generation fallback.

---

## Success Criteria

✅ **Task 12 is ready for PR when:**
1. All 10 test scenarios pass
2. Manual testing checklist 100% complete
3. No critical bugs blocking user flow
4. Performance benchmarks meet targets
5. State persists correctly across refresh

**Current Status:** Implementation complete, testing pending

---

## Next Actions

1. **Run Tests:** Execute all 10 scenarios above
2. **Document Results:** Update checklist with pass/fail status
3. **Fix Bugs:** Address any issues discovered during testing
4. **Performance Test:** Measure API response times
5. **Mark Complete:** Update Story 4.5 tracking (Task 12 DONE)
6. **Prepare PR:** Once all tests pass, include in Story 4.5 pull request

---

**Happy Testing! 🎯**

For questions or issues, refer to:
- Summary: `STORY-4.5-TASK-12-SESSION-INTEGRATION-SUMMARY.md`
- Completion: `STORY-4.5-TASK-12-COMPLETION.json`
- Story Context: `docs/stories/story-context-4.5.xml`
