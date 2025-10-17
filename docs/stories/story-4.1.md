# Story 4.1: Natural Language Comprehension Prompts

Status: Ready

## Story

As a medical student,
I want to explain concepts in natural language (as if teaching a patient),
so that I can validate my true understanding beyond rote memorization and pattern recognition.

## Context

**Epic:** Epic 4 - Understanding Validation Engine
**Priority:** High (First story in Epic 4, foundation for comprehension testing)
**Dependencies:** Story 2.1 (Learning Objectives), Story 2.4 (Mission Generation), Story 2.5 (Session Orchestration)

**Business Value:** Core market differentiator - addresses critical gap competitors (Anki, AMBOSS, UWorld) don't solve by validating genuine comprehension vs. superficial pattern recognition.

**User Value:** Build confidence in knowledge application for clinical scenarios, identify comprehension gaps before exam day.

## Acceptance Criteria

1. **AC#1 - Prompt Generation**: System automatically generates "Explain to a patient" prompts for learning objectives during study sessions
   - Prompts use plain language appropriate for patient education
   - Prompts vary in structure to prevent pattern recognition
   - Generation integrated with Study Session Orchestration (Story 2.5)

2. **AC#2 - Natural Language Input**: User can type multi-paragraph explanations in textarea with no character limits
   - Interface provides guidance on what makes a good explanation
   - User can edit/revise before submission
   - Submission triggers AI evaluation

3. **AC#3 - AI Evaluation (ChatMock/GPT-5)**: AI evaluates response for comprehension depth using rubric
   - Medical accuracy check (correct terminology, facts, relationships)
   - Clarity assessment (patient-appropriate language, logical flow)
   - Completeness scoring (covers key concepts from learning objective)
   - Generates structured evaluation object (score 0-100, strengths[], gaps[])

4. **AC#4 - Comprehension Scoring**: System calculates multi-dimensional score reflecting understanding depth
   - Terminology usage (20%): Correct medical terms in appropriate context
   - Concept relationships (30%): Demonstrates connections between ideas
   - Clinical application (30%): Can apply to real-world patient scenarios
   - Communication clarity (20%): Patient-friendly language without losing accuracy
   - Overall score: 0-100 scale with thresholds (0-59: Needs Review, 60-79: Developing, 80-100: Proficient)

5. **AC#5 - Feedback Display**: User receives actionable feedback highlighting strengths and knowledge gaps
   - Visual score display (progress ring, color-coded)
   - Strengths section: What user explained well (bulleted list)
   - Gaps section: What's missing or incorrect (bulleted list with hints)
   - Specific suggestions for improvement
   - Option to retry explanation after reviewing feedback

6. **AC#6 - Session Integration**: Comprehension prompts seamlessly integrate into study session flow (Story 2.5)
   - Appear after objective content review (before flashcard reviews)
   - Optional: User can skip if time-pressured (but tracked as skipped)
   - Results feed into Session Summary (time spent, score, improvement)
   - Mission objective completion considers comprehension score (threshold: 60%)

7. **AC#7 - Historical Metrics**: System tracks comprehension performance over time per learning objective
   - ComprehensionMetric model stores (objectiveId, date, score, attempt, feedback summary)
   - Progress page displays comprehension trends (line chart: score over time per objective)
   - Identifies objectives with consistently low comprehension scores (< 60% avg over 3+ attempts)

8. **AC#8 - Confidence Calibration**: User self-assesses confidence before typing explanation
   - 5-point scale: Very Uncertain → Very Confident
   - Tracked alongside AI score to detect overconfidence/underconfidence
   - Feedback includes calibration note: "You felt X, AI scored Y - calibration insight"
   - Historical calibration accuracy tracked (correlation coefficient between confidence and score)

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Extensions** (AC: #7)
  - [ ] 1.1: Extend ValidationPrompt model with promptType='EXPLAIN_TO_PATIENT' and conceptName field
  - [ ] 1.2: Extend ValidationResponse model with confidenceLevel (1-5), calibrationDelta, and detailedFeedback JSON field
  - [ ] 1.3: Create ComprehensionMetric model (objectiveId FK, date, score, sampleSize, trend enum)
  - [ ] 1.4: Add indexes for performance (objectiveId, userId+date, respondedAt)
  - [ ] 1.5: Generate Prisma migration and apply to local DB

- [ ] **Task 2: Prompt Generation Engine** (AC: #1)
  - [ ] 2.1: Create `ValidationPromptGenerator` class in `src/lib/validation-prompt-generator.ts`
  - [ ] 2.2: Implement `generateExplainToPatientPrompt(objectiveId)` method
  - [ ] 2.3: Fetch objective from database with context (lecture title, course)
  - [ ] 2.4: Use ChatMock (GPT-5) to generate patient-appropriate explanation prompt
  - [ ] 2.5: Vary prompt structure (scenario-based, direct question, case study)
  - [ ] 2.6: Store generated prompt in ValidationPrompt table
  - [ ] 2.7: Return prompt object with id, text, expectedCriteria

- [ ] **Task 3: AI Evaluation Engine** (AC: #3, #4)
  - [ ] 3.1: Create `ResponseEvaluator` class in `src/lib/response-evaluator.ts`
  - [ ] 3.2: Implement `evaluateResponse(promptId, userAnswer, confidenceLevel)` method
  - [ ] 3.3: Construct structured ChatMock (GPT-5) prompt with evaluation rubric
  - [ ] 3.4: Parse AI response into score breakdown (terminology, relationships, application, clarity)
  - [ ] 3.5: Calculate weighted overall score (formula from AC#4)
  - [ ] 3.6: Extract strengths[] and gaps[] from AI feedback
  - [ ] 3.7: Calculate calibrationDelta (confidenceLevel - score normalized)
  - [ ] 3.8: Return structured evaluation object { score, subscores, strengths, gaps, calibrationNote }

- [ ] **Task 4: API Endpoints** (AC: #1, #2, #3, #6, #7)
  - [ ] 4.1: Create POST `/api/validation/prompts/generate` (generate prompt for objectiveId)
  - [ ] 4.2: Request body: { objectiveId: string, sessionId?: string }
  - [ ] 4.3: Response: { prompt: ValidationPrompt }
  - [ ] 4.4: Create POST `/api/validation/responses` (submit and evaluate answer)
  - [ ] 4.5: Request body: { promptId, sessionId?, userAnswer: string, confidenceLevel: number }
  - [ ] 4.6: Call ResponseEvaluator to get evaluation
  - [ ] 4.7: Save ValidationResponse to database
  - [ ] 4.8: Update ComprehensionMetric aggregates (daily rollup)
  - [ ] 4.9: Response: { evaluation, score, feedback, calibration }
  - [ ] 4.10: Create GET `/api/validation/metrics/:objectiveId` (comprehension history)
  - [ ] 4.11: Response: { metrics: ComprehensionMetric[], trend, avgScore }

- [ ] **Task 5: Comprehension Prompt Component** (AC: #2, #5, #8)
  - [ ] 5.1: Create `ComprehensionPromptDialog.tsx` in `src/components/study/`
  - [ ] 5.2: Display prompt text and learning objective context
  - [ ] 5.3: Add confidence slider (1-5 scale with labels: Very Uncertain → Very Confident)
  - [ ] 5.4: Add textarea for explanation (min-height: 200px, auto-expand, markdown support)
  - [ ] 5.5: Add guidance tooltip ("Good explanations include: terminology, relationships, examples...")
  - [ ] 5.6: Add submit button (calls POST /api/validation/responses)
  - [ ] 5.7: Display loading state during AI evaluation (progress spinner + "Evaluating...")
  - [ ] 5.8: Display evaluation results (score, strengths, gaps, calibration note)
  - [ ] 5.9: Add retry button (clears textarea, allows resubmission)
  - [ ] 5.10: Add skip button (saves as skipped, continues session)
  - [ ] 5.11: Apply glassmorphism design (NO gradients), OKLCH colors, min 44px touch targets

- [ ] **Task 6: Session Integration** (AC: #6)
  - [ ] 6.1: Update Study Session Orchestration (Story 2.5) to inject comprehension prompts
  - [ ] 6.2: Add prompt trigger after objective content review (before flashcards)
  - [ ] 6.3: Check if objective has been validated recently (last 7 days)
  - [ ] 6.4: If not validated, generate and show ComprehensionPromptDialog
  - [ ] 6.5: Track time spent on comprehension prompt (add to session duration)
  - [ ] 6.6: Update Mission objective completion logic (require score >= 60% OR skip acknowledged)
  - [ ] 6.7: Include comprehension metrics in Session Summary (score, improvement vs last attempt)

- [ ] **Task 7: Comprehension Analytics Page** (AC: #7)
  - [ ] 7.1: Create `/progress/comprehension` page or section
  - [ ] 7.2: Fetch user's ComprehensionMetric history (last 30/90 days)
  - [ ] 7.3: Display line chart (Recharts): Score over time per objective (grouped by course/lecture)
  - [ ] 7.4: Display weak comprehension areas (objectives with avg score < 60% over 3+ attempts)
  - [ ] 7.5: Add filter by course, date range, comprehension level
  - [ ] 7.6: Display calibration accuracy chart (confidence vs. AI score scatter plot)
  - [ ] 7.7: Apply glassmorphism design (NO gradients), OKLCH colors

- [ ] **Task 8: Prompt Variation System** (AC: #1 - Prevent Pattern Recognition)
  - [ ] 8.1: Define 3 prompt templates (Direct Question, Clinical Scenario, Teaching Simulation)
  - [ ] 8.2: Randomly select template when generating prompt
  - [ ] 8.3: Store template type in ValidationPrompt.promptData JSON field
  - [ ] 8.4: Ensure variation within template (ChatMock generates unique phrasing)

- [ ] **Task 9: Calibration Insights Engine** (AC: #8)
  - [ ] 9.1: Create `ConfidenceCalibrator` class in `src/lib/confidence-calibrator.ts`
  - [ ] 9.2: Calculate calibrationDelta = (confidenceLevel - scoreNormalized)
  - [ ] 9.3: Classify calibration: Overconfident (delta > 1.5), Underconfident (delta < -1.5), Calibrated (else)
  - [ ] 9.4: Generate calibration note text based on classification
  - [ ] 9.5: Track historical calibration over time (rolling average of calibrationDelta)
  - [ ] 9.6: Display calibration trend in Progress Analytics (improving/stable/worsening)

- [ ] **Task 10: Testing and Validation** (AC: All)
  - [ ] 10.1: Manual test prompt generation for 5 different learning objectives
  - [ ] 10.2: Submit 10 test explanations (strong, weak, incorrect) and verify evaluation accuracy
  - [ ] 10.3: Test confidence calibration (submit overconfident/underconfident examples)
  - [ ] 10.4: Test session integration (prompts appear at correct time, skip works, results save)
  - [ ] 10.5: Test comprehension analytics page (charts render, filters work)
  - [ ] 10.6: Verify database indexes (query performance < 100ms for metrics fetch)
  - [ ] 10.7: Verify ChatMock API error handling (retry logic, user-friendly errors)

## Dev Notes

### Architecture Context

**Subsystem:** Understanding Validation Engine (Epic 4)
**Dependencies:**
- **Story 2.1**: LearningObjective model (objectiveId, objective text)
- **Story 2.4**: Mission model (mission objectives to validate)
- **Story 2.5**: Study Session Orchestration (integration point)

**Database Models (from Solution Architecture):**
- `ValidationPrompt` (already exists): id, promptText, promptType, conceptName, expectedCriteria[], createdAt
- `ValidationResponse` (already exists): id, promptId FK, sessionId FK, userAnswer, aiEvaluation, score, confidence, respondedAt
- `ComprehensionMetric` (exists): id, conceptName, date, avgScore, sampleSize, trend

**API Pattern:**
- RESTful Next.js API Routes
- Consistent error handling (errorResponse helper)
- Zod validation schemas for all endpoints

**AI Integration:**
- ChatMock (GPT-5) via `src/lib/ai/chatmock-client.ts` (from Story 2.1)
- Temperature: 0.3 for consistency in evaluation
- Max tokens: 2000 for detailed feedback
- Retry logic for transient API failures

### Technical Implementation Notes

**1. Prompt Generation Strategy:**
- Use ChatMock (GPT-5) to generate varied prompts from learning objective text
- System prompt emphasizes patient education context
- Inject random seed to ensure variation
- Store generated prompt to avoid regenerating for same objective

**2. Evaluation Rubric (ChatMock Prompt Engineering):**
```
Evaluate this medical student's explanation on 4 dimensions:
1. Terminology (20%): Correct medical terms used appropriately
2. Relationships (30%): Demonstrates connections between concepts
3. Application (30%): Applies knowledge to clinical scenarios
4. Clarity (20%): Patient-friendly language without losing accuracy

Provide:
- Scores for each dimension (0-100)
- Strengths: What they explained well (2-3 bullet points)
- Gaps: What's missing or incorrect (2-3 bullet points)
- Overall assessment: Proficient/Developing/Needs Review
```

**3. Score Thresholds:**
- 0-59: Needs Review (Red badge, flag for targeted study)
- 60-79: Developing (Yellow badge, progressing)
- 80-100: Proficient (Green badge, confident understanding)

**4. Calibration Formula:**
```typescript
const confidenceNormalized = (confidenceLevel - 1) * 25; // 1-5 → 0-100
const calibrationDelta = confidenceNormalized - score;

if (calibrationDelta > 15) return "You felt more confident than your explanation showed - beware overconfidence!";
if (calibrationDelta < -15) return "Your understanding is stronger than you think - trust yourself!";
return "Your confidence matches your comprehension - well calibrated!";
```

**5. Session Integration Flow:**
```
Study Session → Objective Content Review → [NEW: Comprehension Prompt] → Flashcard Reviews → Objective Complete
```

**6. Performance Considerations:**
- Cache recent prompts (avoid regenerating same prompt within 7 days)
- Batch ComprehensionMetric updates (daily rollup cron job future improvement)
- Debounce textarea input (avoid premature API calls)

### Project Structure Notes

**New Files to Create:**
```
apps/web/src/lib/validation-prompt-generator.ts      (PromptGenerator class)
apps/web/src/lib/response-evaluator.ts              (AI evaluation logic)
apps/web/src/lib/confidence-calibrator.ts            (Calibration calculations)
apps/web/src/components/study/ComprehensionPromptDialog.tsx
apps/web/src/app/api/validation/prompts/generate/route.ts
apps/web/src/app/api/validation/responses/route.ts
apps/web/src/app/api/validation/metrics/[objectiveId]/route.ts
apps/web/src/app/progress/comprehension/page.tsx
apps/web/prisma/migrations/XXX_add_comprehension_validation/migration.sql
```

**Modified Files:**
```
apps/web/src/app/study/page.tsx                     (Inject ComprehensionPromptDialog)
apps/web/src/lib/session-orchestrator.ts            (Trigger prompts after content review)
apps/web/prisma/schema.prisma                        (Extend ValidationPrompt, ValidationResponse, ComprehensionMetric)
```

### Design System Compliance

- **Colors**: OKLCH color space (NO gradients)
  - Success: `oklch(0.7 0.15 145)` (Green for Proficient)
  - Warning: `oklch(0.75 0.12 85)` (Yellow for Developing)
  - Error: `oklch(0.65 0.20 25)` (Red for Needs Review)
  - Primary: `oklch(0.6 0.18 230)` (Blue for buttons)

- **Glassmorphism**: `bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]`

- **Typography**: Inter (body), DM Sans (headings)

- **Touch Targets**: Minimum 44px for all interactive elements

- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### References

- **Source**: [PRD-Americano-2025-10-14.md](../PRD-Americano-2025-10-14.md) - FR5: Understanding Validation, Epic 4
- **Source**: [epics-Americano-2025-10-14.md](../epics-Americano-2025-10-14.md) - Epic 4, Story 4.1 details
- **Source**: [solution-architecture.md](../solution-architecture.md) - Subsystem 4: Understanding Validation Engine
- **Source**: [AGENTS.MD](../../AGENTS.MD) - ChatMock integration patterns, medical terminology preservation

## Dev Agent Record

### Context Reference

- `/Users/kyin/Projects/Americano-epic4/docs/stories/story-context-4.1.xml` (Generated: 2025-10-16)

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added during implementation -->

### File List

<!-- Will be added during implementation -->
