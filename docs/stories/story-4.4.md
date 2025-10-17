# Story 4.4: Confidence Calibration and Metacognitive Assessment

Status: Ready

## Story

As a medical student,
I want to accurately assess my own understanding and confidence levels,
so that I can identify overconfidence, recognize genuine mastery, and develop better metacognitive awareness of my learning process.

## Context

**Epic:** Epic 4 - Understanding Validation Engine
**Priority:** High (Fourth story in Epic 4, builds metacognitive layer on comprehension foundation)
**Dependencies:** Story 4.1 (Natural Language Comprehension), Story 4.2 (Clinical Reasoning), Story 4.3 (Controlled Failure), Story 2.2 (Performance Tracking)

**Business Value:** Addresses dangerous overconfidence patterns common in medical education - helps students distinguish "I think I know" from "I actually know", reducing exam-day surprises and building clinical competence.

**User Value:** Develop accurate self-assessment skills critical for clinical practice, identify blind spots before they matter, build genuine confidence through calibrated understanding.

## Acceptance Criteria

1. **AC#1 - Pre-Assessment Confidence Capture**: User indicates confidence level before each validation assessment
   - 5-point confidence scale: Very Uncertain (1) → Very Confident (5)
   - Visual confidence slider with descriptive labels
   - Confidence captured BEFORE user sees assessment prompt details
   - Optional confidence rationale text box ("Why this confidence level?")
   - Confidence data stored with ValidationResponse for analysis

2. **AC#2 - Post-Assessment Confidence Update**: User can update confidence after seeing assessment but before response submission
   - Post-assessment confidence slider (separate from pre-assessment)
   - Visual comparison showing pre vs. post confidence shift
   - Confidence shift tracked as metacognitive signal
   - Rationale field for confidence change explanation

3. **AC#3 - Confidence vs. Performance Tracking**: System calculates calibration accuracy across all assessments
   - Confidence normalized to 0-100 scale (matches AI score scale)
   - Calibration delta = confidence - actual score
   - Categorization: Overconfident (delta > 15), Underconfident (delta < -15), Calibrated (-15 to +15)
   - Historical calibration accuracy tracked per user, per concept, per time period
   - Calibration correlation coefficient calculated (Pearson's r between confidence and performance)

4. **AC#4 - Calibration Feedback Display**: User receives immediate calibration insights after each assessment
   - Visual calibration indicator (gauge, color-coded)
   - Specific feedback message based on calibration category
   - Overconfident: "You felt [X]% confident but scored [Y]% - review areas where certainty exceeded accuracy"
   - Underconfident: "You felt [X]% confident but scored [Y]% - trust your understanding more!"
   - Calibrated: "Your confidence matches your performance - well calibrated!"
   - Trend note: "Your calibration accuracy is [improving/stable/declining] over last 7 days"

5. **AC#5 - Metacognitive Reflection Prompts**: System prompts user to reflect on learning process
   - Post-assessment reflection questions (randomized selection):
     - "What strategies helped you understand this concept?"
     - "What surprised you about your performance?"
     - "How would you approach studying this differently?"
     - "What prerequisite knowledge did you need?"
   - Optional text response (saved to ValidationResponse.reflectionNotes)
   - Reflection completion tracked (contributes to metacognitive engagement score)
   - Historical reflection archive accessible for user review

6. **AC#6 - Calibration Trends Dashboard**: User can view confidence calibration patterns over time
   - Line chart: Confidence vs. Actual Score over last 30/90 days
   - Scatter plot: Each assessment plotted (x=confidence, y=score) with ideal calibration line (y=x)
   - Calibration correlation coefficient displayed with interpretation
   - Trend analysis: Improving (r increasing toward 1.0), Stable, Declining
   - Filter by course, topic, assessment type (comprehension, reasoning, clinical)
   - Identify consistently overconfident topics (delta > 15 across 3+ assessments)
   - Identify consistently underconfident topics (delta < -15 across 3+ assessments)

7. **AC#7 - Metacognitive Intervention System**: System provides targeted interventions for poor calibration
   - Overconfidence intervention: Suggest reviewing weak areas before mission completion
   - Underconfidence intervention: Highlight strong performance patterns to build confidence
   - Calibration improvement resources: Educational content about metacognition
   - Guided self-assessment exercises for calibration practice
   - Interventions triggered when calibration accuracy < 0.5 correlation over 10+ assessments
   - User can dismiss interventions but dismissals tracked

8. **AC#8 - Peer Calibration Comparison**: User can compare calibration patterns with anonymized peers
   - Anonymized peer calibration distribution (box plot)
   - User's position within peer distribution highlighted
   - Calibration percentile (e.g., "Your calibration accuracy is better than 68% of peers")
   - Peer insights: Common overconfidence topics, average calibration correlation
   - Privacy: No individual peer data visible, only aggregated statistics
   - Opt-in feature with clear privacy notice

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Extensions** (AC: #1, #2, #3, #5)
  - [ ] 1.1: Extend ValidationResponse model with confidence fields
  - [ ] 1.2: Add preAssessmentConfidence (1-5 scale) field
  - [ ] 1.3: Add postAssessmentConfidence (1-5 scale) field
  - [ ] 1.4: Add confidenceShift (calculated: post - pre) field
  - [ ] 1.5: Add confidenceRationale (text) field
  - [ ] 1.6: Add reflectionNotes (text) field
  - [ ] 1.7: Add calibrationDelta (calculated: confidence - score normalized) field
  - [ ] 1.8: Add calibrationCategory (enum: OVERCONFIDENT, UNDERCONFIDENT, CALIBRATED) field
  - [ ] 1.9: Create CalibrationMetric model (userId, date, avgDelta, correlationCoeff, sampleSize, trend)
  - [ ] 1.10: Add indexes for performance (userId+date, conceptName, calibrationCategory)
  - [ ] 1.11: Generate Prisma migration and apply to local DB

- [ ] **Task 2: Confidence Capture Components** (AC: #1, #2)
  - [ ] 2.1: Create ConfidenceSlider.tsx component in src/components/study/
  - [ ] 2.2: Implement 5-point slider with descriptive labels (Very Uncertain → Very Confident)
  - [ ] 2.3: Add optional rationale textarea below slider
  - [ ] 2.4: Create PreAssessmentConfidenceDialog.tsx wrapping confidence capture
  - [ ] 2.5: Display before assessment prompt details shown
  - [ ] 2.6: Create PostAssessmentConfidenceDialog.tsx for confidence update
  - [ ] 2.7: Show pre-assessment confidence with option to update
  - [ ] 2.8: Visual diff indicator showing confidence shift (arrow up/down)
  - [ ] 2.9: Integrate with ComprehensionPromptDialog (Story 4.1) workflow
  - [ ] 2.10: Apply glassmorphism design, OKLCH colors, min 44px touch targets

- [ ] **Task 3: Calibration Calculation Engine** (AC: #3, #4)
  - [ ] 3.1: Create ConfidenceCalibrator class in src/lib/confidence-calibrator.ts
  - [ ] 3.2: Implement calculateCalibration(confidence, score) method
  - [ ] 3.3: Normalize confidence to 0-100 scale: (confidence - 1) * 25
  - [ ] 3.4: Calculate calibrationDelta = confidenceNormalized - score
  - [ ] 3.5: Categorize calibration: if (delta > 15) OVERCONFIDENT, if (delta < -15) UNDERCONFIDENT, else CALIBRATED
  - [ ] 3.6: Implement generateCalibrationFeedback(delta, category) method
  - [ ] 3.7: Return feedback message with specific guidance based on category
  - [ ] 3.8: Implement calculateCorrelation(confidenceArray, scoreArray) method
  - [ ] 3.9: Calculate Pearson's r correlation coefficient
  - [ ] 3.10: Interpret correlation: r > 0.7 (Strong), 0.4-0.7 (Moderate), < 0.4 (Weak)

- [ ] **Task 4: API Endpoints** (AC: #1, #2, #3, #6, #8)
  - [ ] 4.1: Extend POST /api/validation/responses to accept confidence data
  - [ ] 4.2: Request body: { promptId, userAnswer, preAssessmentConfidence, postAssessmentConfidence, confidenceRationale }
  - [ ] 4.3: Calculate calibration data using ConfidenceCalibrator
  - [ ] 4.4: Save calibration fields to ValidationResponse
  - [ ] 4.5: Update CalibrationMetric aggregates (daily rollup)
  - [ ] 4.6: Response includes calibration feedback and category
  - [ ] 4.7: Create GET /api/calibration/metrics (user's calibration history)
  - [ ] 4.8: Query CalibrationMetric and ValidationResponse for date range
  - [ ] 4.9: Calculate correlation coefficient from historical data
  - [ ] 4.10: Response: { metrics, correlationCoeff, trend, overconfidentTopics[], underconfidentTopics[] }
  - [ ] 4.11: Create GET /api/calibration/peer-comparison (anonymized peer data)
  - [ ] 4.12: Aggregate peer calibration statistics (requires user opt-in)
  - [ ] 4.13: Response: { peerDistribution, userPercentile, peerAvgCorrelation }

- [ ] **Task 5: Calibration Feedback Component** (AC: #4)
  - [ ] 5.1: Create CalibrationFeedbackPanel.tsx in src/components/study/
  - [ ] 5.2: Display visual calibration gauge (radial progress showing delta)
  - [ ] 5.3: Color-code gauge: Red (overconfident), Blue (underconfident), Green (calibrated)
  - [ ] 5.4: Show specific feedback message from ConfidenceCalibrator
  - [ ] 5.5: Display pre-assessment confidence, post-assessment confidence, actual score
  - [ ] 5.6: Show confidence shift indicator if confidence changed
  - [ ] 5.7: Display trend note from recent calibration history
  - [ ] 5.8: Integrate with ComprehensionPromptDialog results display
  - [ ] 5.9: Apply glassmorphism design, OKLCH colors

- [ ] **Task 6: Metacognitive Reflection System** (AC: #5)
  - [ ] 6.1: Create ReflectionPromptDialog.tsx in src/components/study/
  - [ ] 6.2: Define 8-10 metacognitive reflection questions in config
  - [ ] 6.3: Randomly select 1 question after each assessment
  - [ ] 6.4: Display question with optional textarea response
  - [ ] 6.5: Allow user to skip reflection (track skip rate)
  - [ ] 6.6: Save reflection to ValidationResponse.reflectionNotes
  - [ ] 6.7: Create reflection history view in progress dashboard
  - [ ] 6.8: Calculate metacognitive engagement score (reflection completion rate)
  - [ ] 6.9: Apply glassmorphism design, OKLCH colors

- [ ] **Task 7: Calibration Trends Dashboard** (AC: #6)
  - [ ] 7.1: Create /progress/calibration page
  - [ ] 7.2: Fetch user's CalibrationMetric and ValidationResponse history
  - [ ] 7.3: Display line chart (Recharts): Confidence vs. Actual Score over time (dual lines)
  - [ ] 7.4: Display scatter plot: Confidence (x) vs. Score (y) with ideal calibration line (y=x)
  - [ ] 7.5: Show correlation coefficient with interpretation label
  - [ ] 7.6: Display calibration category breakdown (pie chart or bar chart)
  - [ ] 7.7: List overconfident topics (consistently delta > 15)
  - [ ] 7.8: List underconfident topics (consistently delta < -15)
  - [ ] 7.9: Add filters: date range (7/30/90 days), course, topic, assessment type
  - [ ] 7.10: Display trend indicator (improving/stable/declining calibration accuracy)
  - [ ] 7.11: Apply glassmorphism design, OKLCH colors

- [ ] **Task 8: Metacognitive Intervention Engine** (AC: #7)
  - [ ] 8.1: Create MetacognitiveInterventionEngine class in src/lib/metacognitive-interventions.ts
  - [ ] 8.2: Implement checkCalibrationHealth(userId) method
  - [ ] 8.3: Query recent calibration metrics (last 10+ assessments)
  - [ ] 8.4: Calculate correlation coefficient from recent data
  - [ ] 8.5: If correlation < 0.5, trigger intervention flow
  - [ ] 8.6: Determine intervention type: Overconfidence pattern or Underconfidence pattern
  - [ ] 8.7: Create InterventionDialog.tsx component
  - [ ] 8.8: Display intervention message with specific recommendations
  - [ ] 8.9: Overconfidence: Suggest reviewing weak areas, show past overconfident examples
  - [ ] 8.10: Underconfidence: Highlight strong performance, show past successful assessments
  - [ ] 8.11: Include educational content about metacognition and calibration
  - [ ] 8.12: Provide guided self-assessment exercise (calibration practice)
  - [ ] 8.13: Track intervention dismissals and effectiveness (re-check calibration after 7 days)

- [ ] **Task 9: Peer Calibration Comparison** (AC: #8)
  - [ ] 9.1: Create privacy opt-in flow for peer comparison feature
  - [ ] 9.2: Add user preference field: sharePeerData (boolean, default false)
  - [ ] 9.3: Create PeerCalibrationAnalyzer class in src/lib/peer-calibration.ts
  - [ ] 9.4: Aggregate anonymized peer calibration data (only opted-in users)
  - [ ] 9.5: Calculate peer distribution statistics (quartiles, median, mean)
  - [ ] 9.6: Implement calculateUserPercentile(userCorrelation, peerDistribution) method
  - [ ] 9.7: Create PeerComparisonPanel.tsx component
  - [ ] 9.8: Display box plot showing peer calibration distribution
  - [ ] 9.9: Highlight user's position within distribution
  - [ ] 9.10: Show calibration percentile with interpretation
  - [ ] 9.11: Display common overconfidence topics from peer data
  - [ ] 9.12: Add privacy notice and opt-out option
  - [ ] 9.13: Integrate into calibration dashboard as optional section

- [ ] **Task 10: Session Integration and Workflow** (AC: #1, #2, #4, #5)
  - [ ] 10.1: Update Study Session Orchestration to include confidence capture
  - [ ] 10.2: Before assessment prompt: Show PreAssessmentConfidenceDialog
  - [ ] 10.3: After prompt shown but before response: Show PostAssessmentConfidenceDialog option
  - [ ] 10.4: After AI evaluation: Show CalibrationFeedbackPanel with results
  - [ ] 10.5: After feedback: Show ReflectionPromptDialog (1 random question)
  - [ ] 10.6: Track total time spent on calibration workflow
  - [ ] 10.7: Include calibration metrics in Session Summary
  - [ ] 10.8: Update Mission completion logic to consider calibration quality (optional metric)

- [ ] **Task 11: Testing and Validation** (AC: All)
  - [ ] 11.1: Test confidence capture workflow (pre and post assessment)
  - [ ] 11.2: Submit 15 test responses with varying confidence levels
  - [ ] 11.3: Verify calibration calculation accuracy (manual calculation check)
  - [ ] 11.4: Test calibration feedback messages for all categories
  - [ ] 11.5: Test correlation coefficient calculation with edge cases (all same confidence, perfect correlation)
  - [ ] 11.6: Test metacognitive reflection prompt randomization
  - [ ] 11.7: Test calibration trends dashboard (charts render, filters work)
  - [ ] 11.8: Test intervention triggers (simulate poor calibration pattern)
  - [ ] 11.9: Test peer comparison with opt-in/opt-out flows
  - [ ] 11.10: Verify database indexes (query performance < 100ms)
  - [ ] 11.11: Test session workflow integration (confidence → assessment → feedback → reflection)

## Dev Notes

### Architecture Context

**Subsystem:** Understanding Validation Engine (Epic 4)
**Dependencies:**
- **Story 4.1**: ValidationPrompt, ValidationResponse models (base for calibration data)
- **Story 4.2**: Clinical reasoning assessments (another calibration data source)
- **Story 4.3**: Controlled failure responses (calibration context)
- **Story 2.2**: Performance tracking system (correlation with calibration)

**Database Models (Extended):**
- `ValidationResponse` (extend): Add preAssessmentConfidence, postAssessmentConfidence, confidenceShift, confidenceRationale, reflectionNotes, calibrationDelta, calibrationCategory
- `CalibrationMetric` (new): id, userId FK, conceptName, date, avgDelta, correlationCoeff, sampleSize, trend enum
- `UserPreference` (extend): Add sharePeerCalibrationData boolean field

**API Pattern:**
- RESTful Next.js API Routes
- Zod validation for confidence data (1-5 range)
- Statistical calculations server-side (correlation, percentiles)

**AI Integration:**
- No new AI calls (uses existing evaluation results from Story 4.1)
- Calibration feedback generated algorithmically
- Future: ChatMock (GPT-5) could generate personalized metacognitive guidance

### Technical Implementation Notes

**1. Calibration Calculation Formula:**
```typescript
// Normalize confidence to 0-100 scale
const confidenceNormalized = (confidence - 1) * 25; // 1→0, 2→25, 3→50, 4→75, 5→100

// Calculate calibration delta
const calibrationDelta = confidenceNormalized - score;

// Categorize calibration (15-point threshold based on research)
if (calibrationDelta > 15) return 'OVERCONFIDENT';
if (calibrationDelta < -15) return 'UNDERCONFIDENT';
return 'CALIBRATED';
```

**2. Pearson Correlation Coefficient:**
```typescript
function calculateCorrelation(confidenceArray: number[], scoreArray: number[]): number {
  const n = confidenceArray.length;
  const sumX = confidenceArray.reduce((a, b) => a + b, 0);
  const sumY = scoreArray.reduce((a, b) => a + b, 0);
  const sumXY = confidenceArray.reduce((sum, x, i) => sum + x * scoreArray[i], 0);
  const sumX2 = confidenceArray.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = scoreArray.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}
```

**3. Calibration Feedback Messages:**
```typescript
const feedbackMessages = {
  OVERCONFIDENT: {
    title: "Overconfidence Detected",
    message: (delta: number, confidence: number, score: number) =>
      `You felt ${confidence}% confident but scored ${score}%. Your confidence exceeded accuracy by ${delta} points. Consider reviewing areas where you felt certain but performed weaker.`,
    color: "oklch(0.65 0.20 25)", // Red
    suggestion: "Review weak areas before marking objective complete"
  },
  UNDERCONFIDENT: {
    title: "Underconfidence Pattern",
    message: (delta: number, confidence: number, score: number) =>
      `You felt ${confidence}% confident but scored ${score}%. You're stronger than you think! Trust your understanding more.`,
    color: "oklch(0.60 0.18 230)", // Blue
    suggestion: "Build confidence by reviewing past successes"
  },
  CALIBRATED: {
    title: "Well Calibrated",
    message: (confidence: number, score: number) =>
      `Your ${confidence}% confidence matches your ${score}% score. You have accurate self-awareness!`,
    color: "oklch(0.7 0.15 145)", // Green
    suggestion: "Keep developing this metacognitive awareness"
  }
};
```

**4. Reflection Prompt Bank:**
```typescript
const reflectionPrompts = [
  "What strategies helped you understand this concept?",
  "What surprised you about your performance?",
  "How would you approach studying this differently next time?",
  "What prerequisite knowledge did you need to answer this?",
  "How confident do you feel about applying this in a clinical scenario?",
  "What would you tell a peer studying this same concept?",
  "What parts of the explanation were most challenging to articulate?",
  "How does this concept connect to what you already know?",
  "What would you need to review to improve your explanation?",
  "How would you verify your understanding of this concept?"
];
```

**5. Peer Comparison Privacy:**
- Only users who opt-in contribute to peer data (explicit consent)
- All peer data aggregated and anonymized (no individual identification)
- User can opt-out at any time (removes from future aggregations)
- Minimum peer pool size: 20 users (prevents identification)
- No demographic data shared (only calibration statistics)

**6. Intervention Trigger Logic:**
```typescript
async function checkInterventionNeeded(userId: string): Promise<boolean> {
  const recentResponses = await prisma.validationResponse.findMany({
    where: { userId },
    orderBy: { respondedAt: 'desc' },
    take: 10,
    select: { preAssessmentConfidence: true, score: true }
  });

  if (recentResponses.length < 10) return false; // Need sufficient data

  const confidences = recentResponses.map(r => (r.preAssessmentConfidence - 1) * 25);
  const scores = recentResponses.map(r => r.score);
  const correlation = calculateCorrelation(confidences, scores);

  return correlation < 0.5; // Poor calibration threshold
}
```

**7. Performance Optimization:**
- Cache calibration metrics (updated daily, not per-assessment)
- Pre-calculate correlation coefficients for dashboard (cron job)
- Index ValidationResponse by (userId, respondedAt) for fast historical queries
- Lazy-load peer comparison data (only when user views that section)

### Project Structure Notes

**New Files to Create:**
```
apps/web/src/lib/confidence-calibrator.ts              (Calibration calculation engine)
apps/web/src/lib/metacognitive-interventions.ts        (Intervention logic)
apps/web/src/lib/peer-calibration.ts                   (Peer comparison analytics)
apps/web/src/components/study/ConfidenceSlider.tsx     (5-point confidence slider)
apps/web/src/components/study/PreAssessmentConfidenceDialog.tsx
apps/web/src/components/study/PostAssessmentConfidenceDialog.tsx
apps/web/src/components/study/CalibrationFeedbackPanel.tsx
apps/web/src/components/study/ReflectionPromptDialog.tsx
apps/web/src/components/study/InterventionDialog.tsx
apps/web/src/app/api/calibration/metrics/route.ts     (Calibration history API)
apps/web/src/app/api/calibration/peer-comparison/route.ts
apps/web/src/app/progress/calibration/page.tsx        (Calibration dashboard)
apps/web/prisma/migrations/XXX_add_calibration_tracking/migration.sql
```

**Modified Files:**
```
apps/web/src/components/study/ComprehensionPromptDialog.tsx  (Add confidence capture)
apps/web/src/lib/session-orchestrator.ts                     (Add calibration workflow)
apps/web/src/app/api/validation/responses/route.ts           (Accept confidence data)
apps/web/prisma/schema.prisma                                (Extend models)
```

### Design System Compliance

- **Colors**: OKLCH color space (NO gradients)
  - Overconfident: `oklch(0.65 0.20 25)` (Red)
  - Underconfident: `oklch(0.60 0.18 230)` (Blue)
  - Calibrated: `oklch(0.7 0.15 145)` (Green)
  - Neutral: `oklch(0.6 0.05 240)` (Gray)

- **Glassmorphism**: `bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]`

- **Typography**: Inter (body), DM Sans (headings)

- **Touch Targets**: Minimum 44px for confidence slider thumb, buttons, interactive elements

- **Accessibility**:
  - ARIA labels for confidence levels
  - Keyboard navigation for slider (arrow keys)
  - Screen reader support for calibration feedback
  - Color + text indicators (not color alone)

### References

- **Source**: [PRD-Americano-2025-10-14.md](../PRD-Americano-2025-10-14.md) - FR5: Understanding Validation, Epic 4
- **Source**: [epics-Americano-2025-10-14.md](../epics-Americano-2025-10-14.md) - Epic 4, Story 4.4 details
- **Source**: [solution-architecture.md](../solution-architecture.md) - Subsystem 4: Understanding Validation Engine
- **Source**: [AGENTS.MD](../../AGENTS.MD) - ChatMock patterns, medical terminology
- **Research**: Dunning-Kruger Effect (Kruger & Dunning, 1999) - Overconfidence in low performers
- **Research**: Metacognitive monitoring (Nelson & Narens, 1990) - Confidence calibration theory
- **Research**: Self-regulated learning (Zimmerman, 2002) - Metacognitive awareness in education

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added during implementation -->

### File List

<!-- Will be added during implementation -->
