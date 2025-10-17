# Story 4.5: Adaptive Questioning and Progressive Assessment

Status: Ready

## Story

As a medical student,
I want assessment questions that adapt to my responses and knowledge level in real-time,
so that I'm optimally challenged, efficiently assessed, and can demonstrate mastery without unnecessary repetition.

## Context

**Epic:** Epic 4 - Understanding Validation Engine
**Priority:** High (Fifth story in Epic 4, implements intelligent assessment adaptation)
**Dependencies:** Story 4.1 (Natural Language Comprehension), Story 4.2 (Clinical Reasoning), Story 4.3 (Controlled Failure), Story 4.4 (Confidence Calibration), Story 3.2 (Knowledge Graph)

**Business Value:** Differentiation through adaptive assessment technology - reduces assessment time while increasing accuracy, provides Netflix-level personalization for medical education testing.

**User Value:** Spend less time on redundant easy questions, receive appropriate challenge level, build confidence through progressive mastery demonstration, get to mastery verification faster.

## Acceptance Criteria

1. **AC#1 - Initial Difficulty Calibration**: System determines starting difficulty based on user's historical performance
   - Analyze last 10 assessments for concept and related concepts
   - Calculate baseline difficulty score (0-100 scale: 0=Basic, 50=Intermediate, 100=Advanced)
   - Consider user's confidence calibration accuracy (Story 4.4)
   - Start at baseline difficulty ± 10 points for initial challenge
   - Store initial difficulty selection rationale for analysis

2. **AC#2 - Real-Time Difficulty Adjustment**: Question difficulty adapts based on user's response quality
   - After each response, calculate performance indicator (score, confidence, time taken)
   - If user scores > 85%: Increase difficulty by 15 points (max 100)
   - If user scores 60-85%: Maintain current difficulty ± 5 points (random variation)
   - If user scores < 60%: Decrease difficulty by 15 points (min 0)
   - Difficulty adjustment logged for transparency and algorithm improvement
   - Maximum 3 difficulty adjustments per assessment session (prevent whiplash)

3. **AC#3 - Knowledge Graph-Based Follow-Up Questions**: System generates follow-up questions exploring related concepts
   - After each response, query Knowledge Graph (Story 3.2) for related concepts
   - Identify prerequisite concepts if user struggled (score < 60%)
   - Identify advanced applications if user excelled (score > 85%)
   - Generate follow-up question targeting identified related concept
   - Follow-up question type adapts: Prerequisite check, lateral connection, advanced application
   - Maximum 2 follow-up questions per original prompt (prevent session bloat)
   - User can skip follow-ups if time-constrained (tracked as skipped)

4. **AC#4 - Mastery Verification Protocol**: System verifies mastery through multi-dimensional assessment
   - Mastery criteria: 3 consecutive assessments scoring > 80% at appropriate difficulty
   - Must demonstrate competence across assessment types: Comprehension (Story 4.1), Reasoning (Story 4.2), Application
   - Difficulty must match or exceed user's complexity level (INTERMEDIATE for intermediate concepts)
   - Confidence calibration must be accurate (within ±15 points of score)
   - Time-spaced verification: 3 assessments spread across ≥ 2 days (prevent cramming)
   - Mastery status: VERIFIED, IN_PROGRESS, NOT_STARTED
   - Mastery badge displayed in UI (gold star) with verification date

5. **AC#5 - Adaptive Question Bank Management**: System maintains personalized question bank for each user
   - Question pool per learning objective with difficulty ratings
   - Track questions already answered (avoid immediate repetition)
   - Minimum 2-week cooldown before repeating same question
   - Prioritize unused questions over repeated questions
   - Generate new questions via ChatMock (GPT-5) when pool depleted
   - Question effectiveness tracked (discrimination index, pass rate)
   - Remove ineffective questions (discrimination < 0.2 after 20+ responses)

6. **AC#6 - Progressive Complexity Revelation**: System gradually reveals concept complexity as user demonstrates readiness
   - Learning objectives tagged with complexity levels (BASIC, INTERMEDIATE, ADVANCED)
   - Initially present BASIC complexity for new concepts
   - After mastery verification at current level, reveal next complexity level
   - User sees complexity progression visualization (skill tree / pathway)
   - Unlock notifications: "You've mastered Basic Cardiac Physiology - Advanced topics now available!"
   - Can't skip complexity levels (must demonstrate prerequisite mastery)
   - User can review lower complexity levels anytime (reinforcement)

7. **AC#7 - Assessment Efficiency Optimization**: System minimizes time to accurate knowledge assessment
   - Target: Assess knowledge level within 3-5 questions (not 20+)
   - Implement Item Response Theory (IRT) algorithms for efficient assessment
   - Calculate knowledge estimate confidence interval (±X points at 95% confidence)
   - Stop assessment early if confidence interval < 10 points and sufficient samples (min 3 questions)
   - Display efficiency metrics: "Assessed in 4 questions (80% faster than traditional testing)"
   - Compare efficiency to non-adaptive baseline (track time saved)

8. **AC#8 - Adaptive Session Orchestration**: Assessment sessions adapt structure based on real-time performance
   - Session length adapts: Strong performance = shorter session, struggles = extended support
   - Break recommendations based on performance decline detection
   - Difficulty re-calibration mid-session if performance trend changes
   - Mix assessment types (comprehension, reasoning, clinical) based on weak areas
   - End session on confidence-building success (easy question if user struggled)
   - Session summary shows adaptation decisions and rationale

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Extensions** (AC: #1, #4, #5)
  - [ ] 1.1: Extend ValidationPrompt model with difficulty rating (0-100 scale)
  - [ ] 1.2: Add difficultyLevel field (numeric 0-100)
  - [ ] 1.3: Add discriminationIndex field (track question effectiveness)
  - [ ] 1.4: Add timesUsed counter and lastUsedAt timestamp
  - [ ] 1.5: Extend ValidationResponse with adaptation metadata
  - [ ] 1.6: Add initialDifficulty, adjustedDifficulty, difficultyChangeReason fields
  - [ ] 1.7: Add isFollowUpQuestion boolean and parentPromptId FK
  - [ ] 1.8: Add timeToRespond (seconds) field
  - [ ] 1.9: Create MasteryVerification model
  - [ ] 1.10: Fields: id, userId FK, objectiveId FK, status enum (VERIFIED, IN_PROGRESS, NOT_STARTED), verifiedAt, verificationCriteria JSON
  - [ ] 1.11: Create AdaptiveSession model
  - [ ] 1.12: Fields: id, userId FK, sessionId FK, initialDifficulty, finalDifficulty, adjustmentCount, efficiencyScore, questionsAsked
  - [ ] 1.13: Add indexes: (userId+objectiveId), (difficultyLevel), (lastUsedAt)
  - [ ] 1.14: Generate Prisma migration and apply to local DB

- [ ] **Task 2: Difficulty Calibration Engine** (AC: #1, #2)
  - [ ] 2.1: Create AdaptiveDifficultyEngine class in src/lib/adaptive-difficulty.ts
  - [ ] 2.2: Implement calculateInitialDifficulty(userId, objectiveId) method
  - [ ] 2.3: Query user's last 10 ValidationResponses for objective and related concepts
  - [ ] 2.4: Calculate average score from recent responses
  - [ ] 2.5: Map score to difficulty: 0-59 → 20 (Basic), 60-79 → 50 (Intermediate), 80-100 → 75 (Advanced)
  - [ ] 2.6: Consider confidence calibration accuracy (±10 difficulty if poorly calibrated)
  - [ ] 2.7: Add random variation (±10 points) to avoid predictability
  - [ ] 2.8: Implement adjustDifficulty(currentDifficulty, score, confidence) method
  - [ ] 2.9: Score > 85% → increase difficulty by 15 (max 100)
  - [ ] 2.10: Score 60-85% → maintain (±5 random variation)
  - [ ] 2.11: Score < 60% → decrease difficulty by 15 (min 0)
  - [ ] 2.12: Return { newDifficulty, adjustment, reason }
  - [ ] 2.13: Implement enforceDifficultyBounds(difficulty, maxAdjustments) (prevent > 3 adjustments)

- [ ] **Task 3: Knowledge Graph Follow-Up System** (AC: #3)
  - [ ] 3.1: Create FollowUpQuestionGenerator class in src/lib/follow-up-generator.ts
  - [ ] 3.2: Implement identifyFollowUpConcepts(objectiveId, score) method
  - [ ] 3.3: Query Knowledge Graph (Story 3.2) for related concepts
  - [ ] 3.4: If score < 60%: Identify prerequisite concepts (graph traversal upward)
  - [ ] 3.5: If score > 85%: Identify advanced applications (graph traversal downward/lateral)
  - [ ] 3.6: Rank related concepts by relationship strength (from Knowledge Graph)
  - [ ] 3.7: Select top 1-2 concepts for follow-up questions
  - [ ] 3.8: Implement generateFollowUpPrompt(conceptId, followUpType) method
  - [ ] 3.9: Use ChatMock (GPT-5) to generate contextually relevant follow-up question
  - [ ] 3.10: Follow-up types: PREREQUISITE_CHECK, LATERAL_CONNECTION, ADVANCED_APPLICATION
  - [ ] 3.11: Store follow-up question with parentPromptId reference
  - [ ] 3.12: Return { followUpPrompt, followUpType, relatedConceptId }

- [ ] **Task 4: Mastery Verification Engine** (AC: #4)
  - [ ] 4.1: Create MasteryVerificationEngine class in src/lib/mastery-verification.ts
  - [ ] 4.2: Implement checkMasteryProgress(userId, objectiveId) method
  - [ ] 4.3: Query user's ValidationResponses for objective (ordered by date)
  - [ ] 4.4: Check criterion 1: 3 consecutive scores > 80%
  - [ ] 4.5: Check criterion 2: Assessments span ≥ 2 days (time-spaced)
  - [ ] 4.6: Check criterion 3: Multiple assessment types (comprehension, reasoning, application)
  - [ ] 4.7: Check criterion 4: Difficulty matches objective complexity
  - [ ] 4.8: Check criterion 5: Confidence calibration accurate (within ±15 points)
  - [ ] 4.9: Calculate mastery progress percentage (0-100%)
  - [ ] 4.10: If all criteria met → Update MasteryVerification status to VERIFIED
  - [ ] 4.11: Generate mastery badge and verification timestamp
  - [ ] 4.12: Return { masteryStatus, progress, nextSteps[], verifiedAt }

- [ ] **Task 5: Adaptive Question Bank Manager** (AC: #5)
  - [ ] 5.1: Create QuestionBankManager class in src/lib/question-bank-manager.ts
  - [ ] 5.2: Implement selectQuestion(userId, objectiveId, targetDifficulty) method
  - [ ] 5.3: Query ValidationPrompt pool filtered by objective and difficulty (±10 points)
  - [ ] 5.4: Exclude questions answered by user in last 14 days (cooldown period)
  - [ ] 5.5: Prioritize unused questions (timesUsed = 0)
  - [ ] 5.6: If pool depleted, trigger new question generation
  - [ ] 5.7: Implement generateNewQuestion(objectiveId, difficulty) method
  - [ ] 5.8: Use ChatMock (GPT-5) to generate question at specified difficulty
  - [ ] 5.9: Store generated question in ValidationPrompt with difficulty rating
  - [ ] 5.10: Implement calculateDiscriminationIndex(promptId) method
  - [ ] 5.11: Query responses for question, separate into high/low performers
  - [ ] 5.12: Calculate discrimination = (% high scorers correct) - (% low scorers correct)
  - [ ] 5.13: If discrimination < 0.2 after 20+ uses → Flag question for review/removal
  - [ ] 5.14: Update question usage statistics (timesUsed++, lastUsedAt)

- [ ] **Task 6: Progressive Complexity System** (AC: #6)
  - [ ] 6.1: Create ComplexityProgressionManager class in src/lib/complexity-progression.ts
  - [ ] 6.2: Ensure LearningObjective model has complexityLevel field (BASIC, INTERMEDIATE, ADVANCED)
  - [ ] 6.3: Implement getAvailableComplexityLevel(userId, conceptId) method
  - [ ] 6.4: Query user's MasteryVerification for concept at current complexity
  - [ ] 6.5: If BASIC mastered → Unlock INTERMEDIATE
  - [ ] 6.6: If INTERMEDIATE mastered → Unlock ADVANCED
  - [ ] 6.7: Implement unlockNextComplexity(userId, conceptId) method
  - [ ] 6.8: Verify prerequisite mastery before unlocking
  - [ ] 6.9: Create unlock notification for user
  - [ ] 6.10: Update user's available objectives list
  - [ ] 6.11: Create ComplexityProgressionVisualizer component (skill tree UI)
  - [ ] 6.12: Display locked/unlocked complexity levels with progress indicators
  - [ ] 6.13: Show mastery badges and verification dates

- [ ] **Task 7: IRT Assessment Engine** (AC: #7)
  - [ ] 7.1: Create IRTAssessmentEngine class in src/lib/irt-assessment.ts
  - [ ] 7.2: Implement estimateKnowledgeLevel(responses[]) method
  - [ ] 7.3: Use simplified IRT model (Rasch or 2PL)
  - [ ] 7.4: Calculate knowledge estimate (theta) from response pattern
  - [ ] 7.5: Calculate standard error of estimate
  - [ ] 7.6: Derive 95% confidence interval from standard error
  - [ ] 7.7: Implement shouldStopAssessment(confidenceInterval, sampleSize) method
  - [ ] 7.8: Stop if confidence interval < 10 points AND sampleSize ≥ 3
  - [ ] 7.9: Implement calculateEfficiencyScore(questionsAsked, timeSpent) method
  - [ ] 7.10: Compare to baseline (assume 15 questions for traditional test)
  - [ ] 7.11: Efficiency = (baseline - actual) / baseline * 100
  - [ ] 7.12: Return { knowledgeEstimate, confidenceInterval, shouldStop, efficiency }

- [ ] **Task 8: Adaptive Session Orchestrator** (AC: #8)
  - [ ] 8.1: Create AdaptiveSessionOrchestrator class in src/lib/adaptive-session-orchestrator.ts
  - [ ] 8.2: Implement startAdaptiveSession(userId, sessionId, objectives[]) method
  - [ ] 8.3: Initialize AdaptiveSession record with starting difficulty
  - [ ] 8.4: Implement conductAdaptiveAssessment(sessionId, objectiveId) method
  - [ ] 8.5: Select initial question using QuestionBankManager
  - [ ] 8.6: After each response, call adjustDifficulty and determine next question
  - [ ] 8.7: Check if follow-up question needed (FollowUpQuestionGenerator)
  - [ ] 8.8: Check mastery progress after each question (MasteryVerificationEngine)
  - [ ] 8.9: Check if assessment can stop early (IRTAssessmentEngine)
  - [ ] 8.10: Implement detectPerformanceDecline(recentScores[]) method
  - [ ] 8.11: If 2+ consecutive score drops > 15 points → Recommend break
  - [ ] 8.12: Implement endSessionStrategically() method
  - [ ] 8.13: If user struggled → Ask 1 easier question for confidence boost before ending
  - [ ] 8.14: Generate session summary with adaptation decisions explained
  - [ ] 8.15: Calculate session efficiency score
  - [ ] 8.16: Update AdaptiveSession record with final metrics

- [ ] **Task 9: API Endpoints** (AC: All)
  - [ ] 9.1: Create POST /api/adaptive/session/start (initialize adaptive session)
  - [ ] 9.2: Request: { userId, sessionId, objectiveIds[] }
  - [ ] 9.3: Response: { sessionId, initialDifficulty, firstPrompt }
  - [ ] 9.4: Create POST /api/adaptive/question/next (get next adaptive question)
  - [ ] 9.5: Request: { sessionId, lastResponseId?, lastScore? }
  - [ ] 9.6: Call AdaptiveDifficultyEngine to adjust difficulty
  - [ ] 9.7: Check if follow-up needed
  - [ ] 9.8: Select next question from QuestionBankManager
  - [ ] 9.9: Response: { prompt, difficulty, isFollowUp, canStop }
  - [ ] 9.10: Create GET /api/mastery/:objectiveId (mastery status)
  - [ ] 9.11: Response: { masteryStatus, progress, criteria, verifiedAt, nextSteps[] }
  - [ ] 9.12: Create GET /api/adaptive/efficiency (session efficiency metrics)
  - [ ] 9.13: Response: { questionsAsked, timeSaved, efficiencyScore, comparisonBaseline }

- [ ] **Task 10: UI Components** (AC: #2, #3, #6, #7, #8)
  - [ ] 10.1: Create AdaptiveAssessmentInterface.tsx in src/components/study/
  - [ ] 10.2: Display current difficulty level indicator (visual gauge)
  - [ ] 10.3: Show difficulty adjustment notifications ("Challenge increased!")
  - [ ] 10.4: Display follow-up question context ("Let's check prerequisite: Cardiac anatomy")
  - [ ] 10.5: Show mastery progress bar for current objective
  - [ ] 10.6: Display efficiency metrics ("Assessed in 4 questions - 73% faster!")
  - [ ] 10.7: Create ComplexitySkillTree.tsx component
  - [ ] 10.8: Visualize complexity progression (BASIC → INTERMEDIATE → ADVANCED)
  - [ ] 10.9: Show locked/unlocked levels with mastery badges
  - [ ] 10.10: Display unlock notifications with celebration animation
  - [ ] 10.11: Create MasteryBadge.tsx component (gold star with verification date)
  - [ ] 10.12: Create DifficultyIndicator.tsx (visual gauge showing current difficulty)
  - [ ] 10.13: Create EfficiencyMetricsPanel.tsx (session efficiency display)
  - [ ] 10.14: Apply glassmorphism design, OKLCH colors, min 44px touch targets

- [ ] **Task 11: Session Integration** (AC: #1, #8)
  - [ ] 11.1: Update Study Session Orchestration to support adaptive mode
  - [ ] 11.2: Add adaptive session toggle (user can opt-in/out)
  - [ ] 11.3: If adaptive enabled, use AdaptiveSessionOrchestrator
  - [ ] 11.4: Display adaptive UI components (difficulty indicator, efficiency metrics)
  - [ ] 11.5: Show break recommendations from performance decline detection
  - [ ] 11.6: End session with confidence-building question if user struggled
  - [ ] 11.7: Include adaptation summary in Session Summary component
  - [ ] 11.8: Track adaptive vs. non-adaptive performance for comparison

- [ ] **Task 12: Adaptive Analytics Dashboard** (AC: #4, #7)
  - [ ] 12.1: Create /progress/adaptive page
  - [ ] 12.2: Display mastery verification status for all objectives
  - [ ] 12.3: Show complexity skill tree for user's learning path
  - [ ] 12.4: Display efficiency metrics over time (line chart)
  - [ ] 12.5: Compare adaptive vs. non-adaptive session performance
  - [ ] 12.6: Show difficulty progression visualization
  - [ ] 12.7: List mastered objectives with verification dates and badges
  - [ ] 12.8: Display upcoming mastery targets with progress indicators
  - [ ] 12.9: Apply glassmorphism design, OKLCH colors

- [ ] **Task 13: Testing and Validation** (AC: All)
  - [ ] 13.1: Test initial difficulty calibration with diverse user histories
  - [ ] 13.2: Test real-time difficulty adjustment (submit responses at different score levels)
  - [ ] 13.3: Test follow-up question generation (trigger with score < 60% and > 85%)
  - [ ] 13.4: Test mastery verification (submit 3 high-scoring responses across 2+ days)
  - [ ] 13.5: Test question bank management (deplete pool, verify new generation)
  - [ ] 13.6: Test discrimination index calculation with mock response data
  - [ ] 13.7: Test complexity progression (achieve mastery, verify unlock)
  - [ ] 13.8: Test IRT early stopping (achieve narrow confidence interval)
  - [ ] 13.9: Test performance decline detection
  - [ ] 13.10: Test strategic session ending (struggle scenario)
  - [ ] 13.11: Verify database indexes (query performance < 100ms)
  - [ ] 13.12: Test efficiency calculations (compare to baseline)

## Dev Notes

### Architecture Context

**Subsystem:** Understanding Validation Engine (Epic 4)
**Dependencies:**
- **Story 4.1**: ValidationPrompt, ValidationResponse models (base assessment data)
- **Story 4.2**: Clinical reasoning assessments (assessment type variety)
- **Story 4.3**: Controlled failure system (difficulty calibration input)
- **Story 4.4**: Confidence calibration (mastery verification criterion)
- **Story 3.2**: Knowledge Graph (follow-up question concept identification)

**Database Models (Extended):**
- `ValidationPrompt` (extend): Add difficultyLevel (0-100), discriminationIndex, timesUsed, lastUsedAt
- `ValidationResponse` (extend): Add initialDifficulty, adjustedDifficulty, difficultyChangeReason, isFollowUpQuestion, parentPromptId, timeToRespond
- `MasteryVerification` (new): id, userId FK, objectiveId FK, status enum, verifiedAt, verificationCriteria JSON
- `AdaptiveSession` (new): id, userId FK, sessionId FK, initialDifficulty, finalDifficulty, adjustmentCount, efficiencyScore, questionsAsked

**API Pattern:**
- RESTful Next.js API Routes
- Real-time difficulty adjustment (stateful session management)
- IRT calculations server-side (computationally intensive)

**AI Integration:**
- ChatMock (GPT-5) for generating new questions at specified difficulty
- ChatMock for follow-up question generation with context
- Temperature: 0.5 for question variety while maintaining quality

### Technical Implementation Notes

**1. Difficulty Mapping Formula:**
```typescript
// Score-to-Difficulty mapping
function mapScoreToDifficulty(avgScore: number): number {
  if (avgScore < 60) return 20;  // Basic level
  if (avgScore < 80) return 50;  // Intermediate level
  return 75;                      // Advanced level
}

// Real-time adjustment
function adjustDifficulty(current: number, score: number): { new: number, reason: string } {
  if (score > 85) {
    return {
      new: Math.min(current + 15, 100),
      reason: "Strong performance - increasing challenge"
    };
  }
  if (score < 60) {
    return {
      new: Math.max(current - 15, 0),
      reason: "Building foundations - reducing difficulty"
    };
  }
  return {
    new: current + (Math.random() * 10 - 5), // ±5 random variation
    reason: "Maintaining optimal challenge level"
  };
}
```

**2. Mastery Verification Criteria:**
```typescript
interface MasteryVerificationCriteria {
  consecutiveHighScores: {
    required: 3,
    threshold: 80,
    achieved: number
  };
  timeSpacing: {
    requiredDays: 2,
    actualDays: number
  };
  assessmentTypeVariety: {
    required: ['COMPREHENSION', 'REASONING', 'APPLICATION'],
    achieved: string[]
  };
  difficultyMatch: {
    required: 'INTERMEDIATE',  // Based on objective complexity
    achieved: 'INTERMEDIATE'
  };
  calibrationAccuracy: {
    maxDelta: 15,
    achieved: number
  };
}

function calculateMasteryProgress(criteria: MasteryVerificationCriteria): number {
  const weights = [0.3, 0.2, 0.2, 0.15, 0.15]; // Criterion weights
  const scores = [
    criteria.consecutiveHighScores.achieved / criteria.consecutiveHighScores.required,
    criteria.timeSpacing.actualDays >= criteria.timeSpacing.requiredDays ? 1 : 0,
    criteria.assessmentTypeVariety.achieved.length / criteria.assessmentTypeVariety.required.length,
    criteria.difficultyMatch.achieved === criteria.difficultyMatch.required ? 1 : 0,
    Math.abs(criteria.calibrationAccuracy.achieved) <= criteria.calibrationAccuracy.maxDelta ? 1 : 0
  ];

  return scores.reduce((sum, score, i) => sum + score * weights[i], 0) * 100;
}
```

**3. Simplified IRT Implementation (Rasch Model):**
```typescript
// Rasch model: P(correct) = exp(theta - beta) / (1 + exp(theta - beta))
// theta = person ability, beta = item difficulty

function estimateAbility(responses: { correct: boolean, difficulty: number }[]): {
  theta: number,
  standardError: number,
  confidenceInterval: [number, number]
} {
  let theta = 0; // Initial estimate
  const maxIterations = 20;

  // Newton-Raphson iteration
  for (let i = 0; i < maxIterations; i++) {
    let numerator = 0;
    let denominator = 0;

    responses.forEach(r => {
      const p = 1 / (1 + Math.exp(-(theta - r.difficulty / 50))); // Normalize difficulty
      numerator += (r.correct ? 1 : 0) - p;
      denominator += p * (1 - p);
    });

    if (Math.abs(numerator) < 0.001) break; // Converged
    theta += numerator / denominator;
  }

  const standardError = 1 / Math.sqrt(responses.reduce((sum, r) => {
    const p = 1 / (1 + Math.exp(-(theta - r.difficulty / 50)));
    return sum + p * (1 - p);
  }, 0));

  const confidenceInterval: [number, number] = [
    theta - 1.96 * standardError,
    theta + 1.96 * standardError
  ];

  return { theta, standardError, confidenceInterval };
}

function shouldStopAssessment(estimate: ReturnType<typeof estimateAbility>, sampleSize: number): boolean {
  const intervalWidth = estimate.confidenceInterval[1] - estimate.confidenceInterval[0];
  return intervalWidth < 0.2 && sampleSize >= 3; // 0.2 = 10 points on 50-point scale
}
```

**4. Follow-Up Question Generation Prompt:**
```typescript
const followUpPromptTemplate = {
  PREREQUISITE_CHECK: `
    The student struggled with: {originalConcept}
    Prerequisite concept to assess: {prerequisiteConcept}
    Generate a question at difficulty level {difficulty} that checks understanding of {prerequisiteConcept}.
    Context: This is a follow-up to help identify foundational gaps.
  `,
  LATERAL_CONNECTION: `
    The student demonstrated good understanding of: {originalConcept}
    Related concept to explore: {relatedConcept}
    Generate a question at difficulty level {difficulty} that connects {originalConcept} to {relatedConcept}.
    Context: This is a follow-up to deepen integrated understanding.
  `,
  ADVANCED_APPLICATION: `
    The student excelled at: {originalConcept}
    Advanced application: {advancedConcept}
    Generate a challenging question at difficulty level {difficulty} that requires applying {originalConcept} to {advancedConcept}.
    Context: This is a follow-up to verify mastery through advanced application.
  `
};
```

**5. Discrimination Index Calculation:**
```typescript
// Measure how well a question differentiates high vs. low performers
function calculateDiscriminationIndex(promptId: string, responses: ValidationResponse[]): number {
  // Sort responses by total user score (across all assessments)
  const sortedResponses = responses.sort((a, b) => b.userTotalScore - a.userTotalScore);

  // Split into top 27% and bottom 27% (standard for discrimination index)
  const n = responses.length;
  const cutoff = Math.floor(n * 0.27);
  const highPerformers = sortedResponses.slice(0, cutoff);
  const lowPerformers = sortedResponses.slice(-cutoff);

  // Calculate pass rates for this specific question
  const highPassRate = highPerformers.filter(r => r.promptId === promptId && r.score > 70).length / highPerformers.length;
  const lowPassRate = lowPerformers.filter(r => r.promptId === promptId && r.score > 70).length / lowPerformers.length;

  // Discrimination = difference in pass rates
  // Range: -1 to 1 (higher is better, < 0.2 is poor)
  return highPassRate - lowPassRate;
}
```

**6. Performance Decline Detection:**
```typescript
function detectPerformanceDecline(recentScores: number[]): boolean {
  if (recentScores.length < 3) return false;

  // Check for 2 consecutive score drops > 15 points
  for (let i = 0; i < recentScores.length - 2; i++) {
    const drop1 = recentScores[i] - recentScores[i + 1];
    const drop2 = recentScores[i + 1] - recentScores[i + 2];

    if (drop1 > 15 && drop2 > 15) return true;
  }

  return false;
}
```

**7. Efficiency Calculation:**
```typescript
function calculateEfficiencyScore(questionsAsked: number, timeSpent: number): {
  questionsEfficiency: number,
  timeEfficiency: number,
  overallEfficiency: number
} {
  const baselineQuestions = 15; // Traditional test assumption
  const baselineTime = 30 * 60; // 30 minutes (1800 seconds)

  const questionsEfficiency = ((baselineQuestions - questionsAsked) / baselineQuestions) * 100;
  const timeEfficiency = ((baselineTime - timeSpent) / baselineTime) * 100;
  const overallEfficiency = (questionsEfficiency + timeEfficiency) / 2;

  return { questionsEfficiency, timeEfficiency, overallEfficiency };
}
```

**8. ChatMock Question Generation at Specified Difficulty:**
```typescript
async function generateQuestionAtDifficulty(
  objectiveId: string,
  difficulty: number
): Promise<ValidationPrompt> {
  const objective = await prisma.learningObjective.findUnique({ where: { id: objectiveId } });

  const systemPrompt = `
    You are a medical education expert creating assessment questions.
    Generate a question at difficulty level ${difficulty}/100.

    Difficulty guidelines:
    - 0-30 (Basic): Recall and recognition, single-concept
    - 31-65 (Intermediate): Application and analysis, multi-concept integration
    - 66-100 (Advanced): Synthesis and evaluation, complex clinical reasoning

    Learning Objective: ${objective.objective}
    Question Type: Explain-to-patient style comprehension check
  `;

  const response = await chatmockClient.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate the assessment question.' }
    ],
    temperature: 0.5,
    max_tokens: 1000
  });

  // Store and return generated question
  // ...
}
```

### Project Structure Notes

**New Files to Create:**
```
apps/web/src/lib/adaptive-difficulty.ts                (Difficulty calibration engine)
apps/web/src/lib/follow-up-generator.ts                (Follow-up question logic)
apps/web/src/lib/mastery-verification.ts               (Mastery verification engine)
apps/web/src/lib/question-bank-manager.ts              (Question pool management)
apps/web/src/lib/complexity-progression.ts             (Progressive complexity system)
apps/web/src/lib/irt-assessment.ts                     (IRT algorithms)
apps/web/src/lib/adaptive-session-orchestrator.ts      (Adaptive session orchestration)
apps/web/src/components/study/AdaptiveAssessmentInterface.tsx
apps/web/src/components/study/ComplexitySkillTree.tsx
apps/web/src/components/study/MasteryBadge.tsx
apps/web/src/components/study/DifficultyIndicator.tsx
apps/web/src/components/study/EfficiencyMetricsPanel.tsx
apps/web/src/app/api/adaptive/session/start/route.ts
apps/web/src/app/api/adaptive/question/next/route.ts
apps/web/src/app/api/mastery/[objectiveId]/route.ts
apps/web/src/app/api/adaptive/efficiency/route.ts
apps/web/src/app/progress/adaptive/page.tsx           (Adaptive analytics dashboard)
apps/web/prisma/migrations/XXX_add_adaptive_assessment/migration.sql
```

**Modified Files:**
```
apps/web/src/lib/session-orchestrator.ts               (Add adaptive mode)
apps/web/src/app/study/page.tsx                        (Add adaptive UI toggle)
apps/web/prisma/schema.prisma                          (Extend models)
```

### Design System Compliance

- **Colors**: OKLCH color space (NO gradients)
  - Difficulty Low: `oklch(0.7 0.15 145)` (Green)
  - Difficulty Medium: `oklch(0.75 0.12 85)` (Yellow)
  - Difficulty High: `oklch(0.65 0.20 25)` (Red)
  - Mastery: `oklch(0.8 0.15 60)` (Gold)

- **Glassmorphism**: `bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]`

- **Typography**: Inter (body), DM Sans (headings)

- **Touch Targets**: Minimum 44px for all interactive elements

- **Accessibility**:
  - ARIA labels for difficulty indicators
  - Keyboard navigation for skill tree
  - Screen reader support for mastery badges
  - Progress announcements for adaptive changes

### References

- **Source**: [PRD-Americano-2025-10-14.md](../PRD-Americano-2025-10-14.md) - FR5: Understanding Validation, Epic 4
- **Source**: [epics-Americano-2025-10-14.md](../epics-Americano-2025-10-14.md) - Epic 4, Story 4.5 details
- **Source**: [solution-architecture.md](../solution-architecture.md) - Subsystem 4: Understanding Validation Engine
- **Source**: [AGENTS.MD](../../AGENTS.MD) - ChatMock patterns, medical terminology
- **Research**: Item Response Theory (Lord, 1980) - Adaptive testing foundations
- **Research**: Computer Adaptive Testing (Wainer, 2000) - CAT algorithms
- **Research**: Mastery learning (Bloom, 1968) - Progressive competency verification
- **Research**: Discrimination index (Ebel & Frisbie, 1991) - Question quality metrics

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
