# Story 4.5: Adaptive Questioning and Progressive Assessment

Status: Done

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

## Context Manifest

### Executive Summary

**What Story 4.5 Is About:**
Story 4.5 implements an intelligent adaptive assessment system that dynamically adjusts question difficulty and uses Item Response Theory (IRT) algorithms to efficiently assess student knowledge with minimal questions (3-5 vs 20+). It introduces progressive complexity revelation (BASIC → INTERMEDIATE → ADVANCED), mastery verification protocols requiring multi-dimensional evidence, and Knowledge Graph-based follow-up questions that explore related concepts when students struggle or excel.

**Why It Matters:**
This is Netflix-level personalization for medical education assessment. Traditional assessments waste time asking redundant easy questions or overwhelming students with inappropriate difficulty. Story 4.5 creates an adaptive engine that optimally challenges each student, reduces assessment time by 70-80%, provides accurate knowledge estimates with confidence intervals, and verifies true mastery through time-spaced multi-dimensional evaluation. The business differentiation is significant: no other medical education platform has IRT-based adaptive questioning combined with clinical reasoning assessment.

**High-Level Implementation:**
- **Difficulty Calibration Engine:** Analyzes last 10 assessments, calculates baseline difficulty (0-100 scale), adjusts in real-time (+15/-15 based on score)
- **IRT Assessment Engine:** Simplified Rasch model (1-parameter logistic) for knowledge estimation, early stopping when confidence interval < 10 points
- **Mastery Verification:** 5-criteria protocol (3 consecutive scores > 80%, multiple assessment types, difficulty match, calibration accuracy, time-spacing ≥ 2 days)
- **Adaptive Question Bank:** Personalized question selection with 2-week cooldown, automatic generation via ChatMock, discrimination index tracking
- **Progressive Complexity System:** Skill tree progression where INTERMEDIATE unlocks after BASIC mastery, ADVANCED after INTERMEDIATE
- **Follow-Up Question Generator:** Knowledge Graph traversal (MVP: ObjectivePrerequisite table) identifies prerequisite concepts (score < 60%) or advanced applications (score > 85%)
- **Session Orchestration:** Adaptive session structure with performance decline detection, break recommendations, strategic ending on confidence-building success

**Dependencies:**
- **Story 4.1:** ValidationPrompt/ValidationResponse models, ChatMock integration, 4-dimensional scoring
- **Story 4.2:** Clinical reasoning assessments (contributes to assessment type variety for mastery verification)
- **Story 4.3:** Controlled failure system (difficulty calibration input)
- **Story 4.4:** Confidence calibration tracking (mastery verification criterion)
- **Story 3.2:** Knowledge Graph (NOT YET IMPLEMENTED - MVP uses ObjectivePrerequisite from Story 2.1)

**Estimated Complexity:** **HIGH**
- **13 tasks** with 120+ subtasks total
- Database schema extensions: 4 new/extended models (ValidationPrompt, ValidationResponse, MasteryVerification, AdaptiveSession)
- **7 core TypeScript classes** (adaptive engines, IRT, question bank, orchestration)
- Optional **Python FastAPI service** for IRT calculations (scipy/numpy) - MVP recommendation is TypeScript first, defer to Python post-MVP
- **5 UI components** (glassmorphism design, OKLCH colors, 44px touch targets)
- **4 API endpoints** (session start, next question, mastery status, efficiency metrics)
- IRT algorithm implementation (Newton-Raphson convergence, maximum likelihood estimation)
- Performance constraints: < 200ms initial difficulty, < 500ms IRT calculation, < 1s total latency per question

**Technology Stack Decision:**
Per CLAUDE.md Epic 4 guidance (lines 87, 195): **Python primary** for IRT algorithms (scipy/numpy), TypeScript for UI/API integration. However, context XML constraint recommends **TypeScript MVP first** (simplified Rasch model), defer full Python IRT service to post-MVP if statistical complexity increases (2PL/3PL models).

**Recommended Implementation Approach:**
1. **Phase 1 (MVP - TypeScript):** Implement simplified Rasch model (1PL IRT) in TypeScript, basic difficulty adjustment, mastery verification logic, UI components
2. **Phase 2 (Enhancement):** Add discrimination index tracking, question bank optimization, session orchestration improvements
3. **Phase 3 (Post-MVP - Optional Python):** Migrate to Python FastAPI service for advanced IRT models (2PL/3PL), scipy-based statistical analysis, ML-enhanced difficulty prediction

### How The System Currently Works: Assessment and Validation Foundation

**Entry Point: Validation System from Story 4.1**

When a user engages with understanding validation (Story 4.1), the system presents comprehension prompts via the `ValidationPrompt` model (schema.prisma lines 406-428). Each prompt has:
- `promptText` (String @db.Text): The actual "explain to a patient" style question
- `promptType` (PromptType enum): EXPLAIN_TO_PATIENT, CLINICAL_REASONING, or CONTROLLED_FAILURE
- `conceptName` (String): The medical concept being assessed
- `expectedCriteria` (String[]): Key points expected in the answer
- `objectiveId` (String? FK): Links to LearningObjective for context
- `promptData` (Json?): Template metadata (templateType, variation, seed)

The user submits an answer through the session interface (apps/web/src/app/study/page.tsx - Story 2.5), which creates a `ValidationResponse` record (schema.prisma lines 508-548):
- `promptId` (String FK): Links back to the prompt
- `sessionId` (String? FK): Ties to StudySession for session analytics
- `userId` (String): Who submitted (MVP hardcoded to kevy@americano.dev)
- `userAnswer` (String @db.Text): The student's explanation
- `aiEvaluation` (String @db.Text): ChatMock (GPT-5) structured feedback
- `score` (Float 0.0-1.0): Overall comprehension score
- `confidenceLevel` (Int? 1-5): Student's self-assessment
- `detailedFeedback` (Json?): Subscores (terminology, relationships, application, clarity), strengths, gaps, calibration note

The AI evaluation happens via Next.js API route (Story 4.1 Task 5: POST /api/validation/evaluate), which:
1. Accepts request with promptId, userAnswer, confidenceLevel
2. Queries ValidationPrompt for prompt details and expectedCriteria
3. Calls ChatMock (GPT-5) with medical education expert system prompt (temperature 0.3 for consistency)
4. Uses 4-dimensional scoring rubric: Terminology (20%), Relationships (30%), Application (30%), Clarity (20%)
5. Calculates calibration delta: confidenceNormalized (1-5 → 0-100) minus (score × 100)
6. Stores ValidationResponse with detailed feedback and subscores
7. Returns evaluation to UI for immediate student feedback

**Current Limitation: Static Difficulty**

Story 4.1 does NOT adjust difficulty. Every student gets the same prompts regardless of performance. There's no concept of easier/harder questions. The ValidationPrompt model lacks a `difficultyLevel` field entirely. This is the core problem Story 4.5 solves.

**Current State Management: Study Sessions from Story 2.5**

The session state (apps/web/src/store/use-session-store.ts) tracks:
- `sessionId` (String | null): Current study session identifier
- `startTime` (Number | null): Session start timestamp (Date.now())
- `pausedAt` / `pausedDuration`: Pause/resume tracking
- `currentObjective` (MissionObjective | null): Current learning objective in mission flow
- `missionProgress` (MissionProgress | null): Completed vs total objectives
- `objectiveTimer`: Tracks time spent on current objective (drift-free Date.now() calculation)
- `sessionSnapshot` (SessionSnapshot | null): Advanced pause/resume state (scroll position, study phase, card queue)
- `settings` (SessionSettings): Auto-advance, time alerts, Pomodoro mode, focus settings

When a user completes an objective, the session calls:
1. `incrementObjectivesCompleted()` (line 386): Tracks objectives completed for clinical scenario triggering (Story 4.2)
2. Session completion creates `ObjectiveCompletion` record (lines 13-21): { objectiveId, completedAt, timeSpentMs, selfAssessment, confidenceRating, notes }
3. StudySession.objectiveCompletions JSON array stores all completions for analytics

**Current Database Indexes:**
- ValidationResponse: (promptId), (respondedAt), (sessionId), (userId), (userId + respondedAt), (calibrationCategory) (schema.prisma lines 543-546)
- ValidationPrompt: (conceptName), (objectiveId), (createdAt) (schema.prisma lines 424-426)
- LearningObjective: (lectureId), (isHighYield), (complexity), (masteryLevel), (weaknessScore) (schema.prisma lines 176-180)

These indexes support fast querying for:
- User's recent assessment history (userId + respondedAt composite index)
- Prompts for specific learning objectives (objectiveId)
- Performance tracking by concept (conceptName)

### What Story 4.5 Adds: Adaptive Intelligence Layer

**New Concept 1: Difficulty as a Numeric Scale**

Story 4.5 introduces difficulty as a **0-100 numeric scale** (not discrete categories):
- **0-30 (Basic):** Recall and recognition, single-concept questions
- **31-65 (Intermediate):** Application and analysis, multi-concept integration
- **66-100 (Advanced):** Synthesis and evaluation, complex clinical reasoning

This continuous scale enables **precise difficulty adjustments** (+15/-15) rather than coarse category jumps (EASY → MEDIUM → HARD). The reason is IRT algorithms require numeric difficulty parameters, not categories.

**Database Extensions Required:**

**ValidationPrompt extensions** (Task 1.1-1.4):
- `difficultyLevel` (Int): 0-100 difficulty rating (indexed for fast query)
- `discriminationIndex` (Float): How well this question separates high/low performers (0.0-1.0, < 0.2 = poor question)
- `timesUsed` (Int): Usage counter for statistics (min 20 uses before calculating discrimination)
- `lastUsedAt` (DateTime): Cooldown enforcement (2-week minimum between repeats)

**ValidationResponse extensions** (Task 1.5-1.8):
- `initialDifficulty` (Int): Difficulty level when question selected
- `adjustedDifficulty` (Int): Difficulty level for NEXT question (after adjustment algorithm)
- `difficultyChangeReason` (String @db.Text): Transparency log ("Strong performance - increasing challenge")
- `isFollowUpQuestion` (Boolean): Marks Knowledge Graph-generated follow-ups
- `parentPromptId` (String? FK): Links follow-up to original prompt
- `timeToRespond` (Int milliseconds): Response time tracking

**New Model: MasteryVerification** (Task 1.9-1.10):
```prisma
model MasteryVerification {
  id                   String   @id @default(cuid())
  userId               String
  objectiveId          String
  status               MasteryStatus @default(NOT_STARTED) // VERIFIED, IN_PROGRESS, NOT_STARTED
  verifiedAt           DateTime?
  verificationCriteria Json // Stores 5-criteria checklist with achieved values
  createdAt            DateTime @default(now())

  @@index([userId, objectiveId])
  @@map("mastery_verifications")
}

enum MasteryStatus {
  VERIFIED
  IN_PROGRESS
  NOT_STARTED
}
```

**New Model: AdaptiveSession** (Task 1.11-1.12):
```prisma
model AdaptiveSession {
  id                 String   @id @default(cuid())
  userId             String
  sessionId          String   // FK to StudySession
  initialDifficulty  Int      // Starting difficulty (from calibration)
  finalDifficulty    Int      // Ending difficulty (shows trajectory)
  adjustmentCount    Int      // How many times difficulty changed (max 3)
  efficiencyScore    Float    // 0.0-1.0 (questions saved vs baseline)
  questionsAsked     Int      // Total questions in session
  knowledgeEstimate  Float?   // IRT theta value (-3 to +3 scale)
  confidenceInterval Float?   // 95% CI width (target < 10 points)
  createdAt          DateTime @default(now())

  @@index([userId, sessionId])
  @@index([sessionId])
  @@map("adaptive_sessions")
}
```

**Indexes Required** (Task 1.13):
- ValidationPrompt: (difficultyLevel), (lastUsedAt) for question selection
- ValidationResponse: No new indexes needed (existing userId+respondedAt covers adaptive queries)
- MasteryVerification: (userId + objectiveId) for fast mastery status lookup
- AdaptiveSession: (userId + sessionId), (sessionId) for session tracking

### How Adaptive Assessment Works: The Complete Flow

**Stage 1: Session Start - Initial Difficulty Calibration**

User clicks "Start Adaptive Assessment" → POST /api/adaptive/session/start (Task 9.1-9.3)

Request body:
```typescript
{
  userId: "user_abc123",
  sessionId: "sess_xyz789",
  objectiveIds: ["obj_cardiac_conduction"]
}
```

**Server-side logic (AdaptiveDifficultyEngine.calculateInitialDifficulty)** (Task 2.1-2.7):

1. **Query last 10 assessments** for this objective + related concepts:
```typescript
const recentResponses = await prisma.validationResponse.findMany({
  where: {
    userId: userId,
    prompt: {
      objectiveId: {
        in: [objectiveId, ...relatedObjectiveIds] // Include prerequisites from ObjectivePrerequisite
      }
    }
  },
  orderBy: { respondedAt: 'desc' },
  take: 10,
  include: { prompt: true }
})
```

2. **Calculate average score** from recent responses:
```typescript
const avgScore = recentResponses.reduce((sum, r) => sum + r.score, 0) / recentResponses.length * 100
// Example: [0.85, 0.78, 0.82, 0.90, 0.75] → avgScore = 82
```

3. **Map score to baseline difficulty**:
```typescript
function mapScoreToDifficulty(avgScore: number): number {
  if (avgScore < 60) return 20  // Basic level (0-30 range)
  if (avgScore < 80) return 50  // Intermediate level (31-65 range)
  return 75                      // Advanced level (66-100 range)
}
// Example: avgScore = 82 → baseline = 75 (Advanced)
```

4. **Adjust for confidence calibration accuracy** (depends on Story 4.4 CalibrationMetric):
```typescript
const calibrationMetric = await prisma.calibrationMetric.findFirst({
  where: { userId, objectiveId },
  orderBy: { date: 'desc' }
})

let difficultyAdjustment = 0
if (calibrationMetric) {
  const calibrationAccuracy = Math.abs(calibrationMetric.avgDelta)
  if (calibrationAccuracy > 20) {
    // Poorly calibrated (overconfident or underconfident)
    difficultyAdjustment = -10 // Start easier to rebuild accurate calibration
  }
}
```

5. **Add random variation** to avoid predictability:
```typescript
const randomVariation = Math.floor(Math.random() * 20) - 10 // ±10 points
const initialDifficulty = Math.max(0, Math.min(100, baseline + difficultyAdjustment + randomVariation))
// Example: 75 + (-10) + 5 = 70
```

6. **Store rationale** for transparency:
```typescript
const rationale = {
  avgScore: 82,
  baseline: 75,
  calibrationAdjustment: -10,
  randomVariation: 5,
  initialDifficulty: 70,
  reason: "Based on recent performance (82% avg), starting at Advanced level (70). Reduced by 10 points due to overconfidence pattern in calibration data."
}
```

7. **Create AdaptiveSession record**:
```typescript
const adaptiveSession = await prisma.adaptiveSession.create({
  data: {
    userId,
    sessionId,
    initialDifficulty: 70,
    finalDifficulty: 70, // Will be updated at session end
    adjustmentCount: 0,
    efficiencyScore: 0,
    questionsAsked: 0,
  }
})
```

8. **Select first question** using QuestionBankManager (Task 5.1-5.5):
```typescript
const firstPrompt = await selectQuestion(userId, objectiveId, targetDifficulty = 70, complexity = 'INTERMEDIATE')

// Selection logic:
// 1. Query ValidationPrompt pool: difficultyLevel BETWEEN (70 - 10) AND (70 + 10) → 60-80 range
// 2. Filter: complexityLevel matches objective complexity (BASIC/INTERMEDIATE/ADVANCED)
// 3. Exclude: Questions answered by user in last 14 days (lastUsedAt check via ValidationResponse join)
// 4. Prioritize: Questions with timesUsed = 0 (unused questions first)
// 5. Secondary sort: Lowest timesUsed (fair rotation)
// 6. If pool depleted (< 1 question available) → Trigger generateNewQuestion() (Task 5.7-5.9)
```

9. **Response to client**:
```typescript
{
  adaptiveSessionId: "adp_sess_001",
  initialDifficulty: 70,
  firstPrompt: {
    id: "prompt_123",
    promptText: "Explain to a patient how the cardiac conduction system controls heart rate...",
    conceptName: "Cardiac Conduction System",
    difficulty: 70,
    expectedCriteria: ["SA node pacemaker", "AV node delay", "Bundle of His", "Purkinje fibers"]
  }
}
```

**Stage 2: Real-Time Difficulty Adjustment After Each Response**

User submits answer → POST /api/adaptive/question/next (Task 9.4-9.9)

Request body:
```typescript
{
  sessionId: "sess_xyz789",
  lastResponseId: "resp_456",
  lastScore: 88,
  lastConfidence: 4 // 1-5 scale
}
```

**Server-side logic (AdaptiveDifficultyEngine.adjustDifficulty)** (Task 2.8-2.12):

1. **Retrieve current difficulty** from last ValidationResponse:
```typescript
const lastResponse = await prisma.validationResponse.findUnique({
  where: { id: lastResponseId },
  include: { prompt: true }
})
const currentDifficulty = lastResponse.initialDifficulty // 70
```

2. **Apply adjustment rules**:
```typescript
function adjustDifficulty(currentDifficulty: number, score: number): {
  newDifficulty: number
  adjustment: number
  reason: string
} {
  let adjustment = 0
  let reason = ""

  if (score > 85) {
    adjustment = 15 // Increase difficulty
    reason = "Strong performance - increasing challenge"
  } else if (score < 60) {
    adjustment = -15 // Decrease difficulty
    reason = "Building foundations - reducing difficulty"
  } else {
    adjustment = Math.floor(Math.random() * 10) - 5 // ±5 random variation
    reason = "Maintaining optimal challenge level"
  }

  const newDifficulty = Math.max(0, Math.min(100, currentDifficulty + adjustment))

  return { newDifficulty, adjustment, reason }
}

// Example: score = 88 → adjustment = +15 → newDifficulty = 85
```

3. **Enforce maximum 3 adjustments per session** (Task 2.13):
```typescript
const adaptiveSession = await prisma.adaptiveSession.findUnique({
  where: { sessionId }
})

if (adaptiveSession.adjustmentCount >= 3) {
  // No more adjustments - use current difficulty
  return { newDifficulty: currentDifficulty, adjustment: 0, reason: "Maximum adjustments reached (prevents whiplash)" }
}
```

4. **Update ValidationResponse with adjustment metadata**:
```typescript
await prisma.validationResponse.update({
  where: { id: lastResponseId },
  data: {
    adjustedDifficulty: 85,
    difficultyChangeReason: "Strong performance - increasing challenge"
  }
})
```

5. **Update AdaptiveSession adjustment counter**:
```typescript
await prisma.adaptiveSession.update({
  where: { id: adaptiveSession.id },
  data: {
    adjustmentCount: adaptiveSession.adjustmentCount + 1,
    finalDifficulty: 85,
    questionsAsked: adaptiveSession.questionsAsked + 1
  }
})
```

**Stage 3: IRT Early Stopping Decision**

After each response, check if assessment can stop early using IRT (Task 7.1-7.12):

**IRT Background:**
Item Response Theory models the probability a person answers correctly based on:
- **Theta (θ):** Person ability parameter (-3 to +3 scale, normalized)
- **Beta (β):** Item difficulty parameter (-3 to +3 scale, normalized from 0-100)

**Rasch Model (1-parameter logistic):**
```
P(correct | θ, β) = exp(θ - β) / (1 + exp(θ - β))
```

**Knowledge Estimation (Newton-Raphson):**

Given a user's response pattern, estimate their ability (θ) using maximum likelihood:

```typescript
function estimateAbility(responses: { correct: boolean, difficulty: number }[]): {
  theta: number
  standardError: number
  confidenceInterval: [number, number]
  iterations: number
} {
  let theta = 0 // Initial estimate (average ability)
  const maxIterations = 10 // Prevent infinite loops
  let iterations = 0

  // Newton-Raphson iteration
  for (let i = 0; i < maxIterations; i++) {
    iterations++

    // First derivative (score function)
    let numerator = 0
    // Second derivative (information function)
    let denominator = 0

    responses.forEach(r => {
      const beta = (r.difficulty - 50) / 25 // Normalize 0-100 to -2 to +2 scale
      const p = 1 / (1 + Math.exp(-(theta - beta))) // Probability of correct response

      numerator += (r.correct ? 1 : 0) - p // Observed - expected
      denominator += p * (1 - p) // Fisher information
    })

    if (Math.abs(numerator) < 0.01) break // Converged (tolerance 0.01)

    theta += numerator / denominator // Newton-Raphson update
  }

  // Standard error from Fisher information
  const information = responses.reduce((sum, r) => {
    const beta = (r.difficulty - 50) / 25
    const p = 1 / (1 + Math.exp(-(theta - beta)))
    return sum + p * (1 - p)
  }, 0)

  const standardError = 1 / Math.sqrt(information)

  // 95% confidence interval (1.96 * SE)
  const confidenceInterval: [number, number] = [
    theta - 1.96 * standardError,
    theta + 1.96 * standardError
  ]

  return { theta, standardError, confidenceInterval, iterations }
}

// Example:
// Response pattern: [correct@50, correct@70, incorrect@85]
// → theta ≈ 0.8 (above average ability)
// → CI: [0.5, 1.1] (width = 0.6, ~12 points on 0-100 scale)
```

**Early Stopping Decision** (Task 7.7-7.8):
```typescript
function shouldStopAssessment(estimate: ReturnType<typeof estimateAbility>, sampleSize: number): boolean {
  const intervalWidth = estimate.confidenceInterval[1] - estimate.confidenceInterval[0]

  // Convert theta scale (-3 to +3, ~6 total) to 0-100 points scale
  // 1 theta unit ≈ 16.67 points (100 / 6)
  const intervalInPoints = intervalWidth * 16.67

  // Stop if: (1) Confidence interval < 10 points AND (2) Minimum 3 questions
  return intervalInPoints < 10 && sampleSize >= 3
}
```

If early stop condition met:
```typescript
{
  canStopEarly: true,
  knowledgeEstimate: 0.8, // theta value
  confidenceInterval: [0.5, 1.1],
  intervalWidth: 0.6,
  intervalInPoints: 10,
  message: "Assessment confidence achieved with 4 questions (vs 15 baseline)"
}
```

Otherwise, select next question and continue.

**Stage 4: Follow-Up Question Generation** (Tasks 3.1-3.12)

If user score < 60% OR > 85%, check if follow-up needed:

```typescript
// LOW SCORE PATH (score < 60%): Identify prerequisite concepts
const followUpConcepts = await identifyFollowUpConcepts(objectiveId, score = 45)

// Query ObjectivePrerequisite (Story 2.1) for prerequisite relationships
const prerequisites = await prisma.objectivePrerequisite.findMany({
  where: { objectiveId: objectiveId },
  include: { prerequisite: true },
  orderBy: { strength: 'desc' }, // Strongest prerequisites first
  take: 2 // Max 2 follow-ups per AC#3
})

// Generate follow-up prompt via ChatMock
const followUpPrompt = await generateFollowUpPrompt(
  conceptId: prerequisites[0].prerequisiteId,
  followUpType: 'PREREQUISITE_CHECK',
  difficulty: Math.max(0, currentDifficulty - 20) // Easier difficulty
)

// ChatMock system prompt:
const systemPrompt = `
You are a medical education expert generating a prerequisite check question.

Original concept: ${originalConcept.objective}
Student struggled with score: ${score}%
Prerequisite concept to assess: ${prerequisiteConcept.objective}

Generate a BASIC difficulty question (0-30 on 0-100 scale) that checks understanding of the prerequisite concept.
Use "explain to a patient" style. Keep under 150 words.

Context: This follow-up helps identify foundational gaps preventing mastery of the original concept.
`

const chatResponse = await chatmockClient.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Generate the follow-up question.' }
  ],
  temperature: 0.7, // Higher for variety
  max_tokens: 500
})

// Store follow-up prompt
const followUpValidationPrompt = await prisma.validationPrompt.create({
  data: {
    promptText: chatResponse.choices[0].message.content,
    promptType: 'EXPLAIN_TO_PATIENT',
    conceptName: prerequisiteConcept.objective,
    expectedCriteria: extractCriteria(prerequisiteConcept),
    objectiveId: prerequisites[0].prerequisiteId,
    difficultyLevel: Math.max(0, currentDifficulty - 20),
    discriminationIndex: 0.5, // Default until enough data
    timesUsed: 0,
    lastUsedAt: new Date()
  }
})

// Link follow-up to parent via ValidationResponse
await prisma.validationResponse.update({
  where: { id: lastResponseId },
  data: {
    isFollowUpQuestion: false, // This is the PARENT response
    // Follow-up response will have isFollowUpQuestion: true, parentPromptId: lastResponse.promptId
  }
})
```

**HIGH SCORE PATH (score > 85%):** Similar logic, but:
- Query related concepts at SAME or HIGHER complexity (not prerequisites)
- Generate ADVANCED_APPLICATION follow-up (difficulty + 15)
- ChatMock prompt focuses on advanced clinical integration

**Stage 5: Mastery Verification Check** (Tasks 4.1-4.12)

After each response, check mastery progress:

```typescript
async function checkMasteryProgress(userId: string, objectiveId: string): Promise<MasteryVerificationResult> {
  // Fetch last 10 responses for this objective (ordered by date)
  const recentResponses = await prisma.validationResponse.findMany({
    where: {
      userId,
      prompt: { objectiveId }
    },
    orderBy: { respondedAt: 'desc' },
    take: 10,
    include: { prompt: true }
  })

  // Criterion 1: 3 consecutive scores > 80%
  let consecutiveHighScores = 0
  for (const response of recentResponses) {
    if (response.score * 100 > 80) {
      consecutiveHighScores++
      if (consecutiveHighScores >= 3) break
    } else {
      consecutiveHighScores = 0 // Reset on any low score
    }
  }
  const criterion1Met = consecutiveHighScores >= 3

  // Criterion 2: Time-spacing ≥ 2 days
  if (recentResponses.length >= 3) {
    const firstDate = recentResponses[recentResponses.length - 1].respondedAt
    const lastDate = recentResponses[0].respondedAt
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    var criterion2Met = daysDiff >= 2
  } else {
    var criterion2Met = false
  }

  // Criterion 3: Multiple assessment types
  const assessmentTypes = new Set(recentResponses.map(r => r.prompt.promptType))
  const requiredTypes = ['EXPLAIN_TO_PATIENT', 'CLINICAL_REASONING'] // Story 4.1 + 4.2
  const criterion3Met = requiredTypes.every(type => assessmentTypes.has(type))

  // Criterion 4: Difficulty matches objective complexity
  const objective = await prisma.learningObjective.findUnique({ where: { id: objectiveId } })
  const requiredDifficulty = objective.complexity === 'BASIC' ? 30 :
                              objective.complexity === 'INTERMEDIATE' ? 50 : 70
  const avgDifficulty = recentResponses.reduce((sum, r) => sum + r.initialDifficulty, 0) / recentResponses.length
  const criterion4Met = avgDifficulty >= requiredDifficulty - 10 // Allow 10-point tolerance

  // Criterion 5: Confidence calibration accurate (within ±15 points)
  const calibrationDeltas = recentResponses
    .filter(r => r.calibrationDelta != null)
    .map(r => Math.abs(r.calibrationDelta))
  const avgCalibrationError = calibrationDeltas.reduce((sum, d) => sum + d, 0) / calibrationDeltas.length
  const criterion5Met = avgCalibrationError <= 15

  // Calculate overall mastery progress (weighted)
  const criteriaWeights = [0.3, 0.2, 0.2, 0.15, 0.15]
  const criteriaScores = [
    criterion1Met ? 1 : (consecutiveHighScores / 3),
    criterion2Met ? 1 : 0,
    criterion3Met ? 1 : (assessmentTypes.size / requiredTypes.length),
    criterion4Met ? 1 : 0,
    criterion5Met ? 1 : (15 / Math.max(avgCalibrationError, 1))
  ]
  const masteryProgress = criteriaScores.reduce((sum, score, i) => sum + score * criteriaWeights[i], 0) * 100

  // Determine mastery status
  let masteryStatus: 'VERIFIED' | 'IN_PROGRESS' | 'NOT_STARTED'
  if (criterion1Met && criterion2Met && criterion3Met && criterion4Met && criterion5Met) {
    masteryStatus = 'VERIFIED'

    // Update MasteryVerification record
    await prisma.masteryVerification.upsert({
      where: { userId_objectiveId: { userId, objectiveId } },
      create: {
        userId,
        objectiveId,
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationCriteria: {
          consecutiveHighScores: { required: 3, achieved: consecutiveHighScores },
          timeSpacing: { requiredDays: 2, actualDays: daysDiff },
          assessmentTypeVariety: { required: requiredTypes, achieved: Array.from(assessmentTypes) },
          difficultyMatch: { required: objective.complexity, achieved: avgDifficulty >= requiredDifficulty },
          calibrationAccuracy: { maxDelta: 15, achieved: avgCalibrationError }
        }
      },
      update: {
        status: 'VERIFIED',
        verifiedAt: new Date()
      }
    })

    // Update LearningObjective.masteryLevel
    await prisma.learningObjective.update({
      where: { id: objectiveId },
      data: { masteryLevel: 'MASTERED' }
    })
  } else if (recentResponses.length > 0) {
    masteryStatus = 'IN_PROGRESS'
  } else {
    masteryStatus = 'NOT_STARTED'
  }

  return {
    masteryStatus,
    progress: masteryProgress,
    criteria: {
      consecutiveHighScores: { met: criterion1Met, achieved: consecutiveHighScores, required: 3 },
      timeSpacing: { met: criterion2Met, actualDays: daysDiff, requiredDays: 2 },
      assessmentTypeVariety: { met: criterion3Met, achieved: Array.from(assessmentTypes), required: requiredTypes },
      difficultyMatch: { met: criterion4Met, achieved: avgDifficulty, required: requiredDifficulty },
      calibrationAccuracy: { met: criterion5Met, achieved: avgCalibrationError, max: 15 }
    },
    nextSteps: generateNextSteps(criterion1Met, criterion2Met, criterion3Met, criterion4Met, criterion5Met)
  }
}
```

**Stage 6: Adaptive Session Orchestration** (Tasks 8.1-8.16)

The AdaptiveSessionOrchestrator manages the overall session flow:

**Performance Decline Detection:**
```typescript
function detectPerformanceDecline(recentScores: number[]): boolean {
  if (recentScores.length < 3) return false

  // Check for 2 consecutive score drops > 15 points
  for (let i = 0; i < recentScores.length - 2; i++) {
    const drop1 = recentScores[i] - recentScores[i + 1]
    const drop2 = recentScores[i + 1] - recentScores[i + 2]

    if (drop1 > 15 && drop2 > 15) {
      return true // Recommend break
    }
  }

  return false
}

// Example: [88, 72, 54, 50] → drop1 = 16, drop2 = 18 → DECLINE DETECTED
```

**Strategic Session Ending:**
If user struggled (last 2 scores < 65%), ask 1 easier question for confidence boost:
```typescript
async function endSessionStrategically(sessionId: string): Promise<void> {
  const adaptiveSession = await prisma.adaptiveSession.findUnique({
    where: { sessionId },
    include: { responses: { orderBy: { respondedAt: 'desc' }, take: 2 } }
  })

  const lastTwoScores = adaptiveSession.responses.map(r => r.score * 100)
  const avgScore = lastTwoScores.reduce((sum, s) => sum + s, 0) / lastTwoScores.length

  if (avgScore < 65) {
    // User struggled - give confidence boost
    const easyQuestion = await selectQuestion(
      userId,
      objectiveId,
      targetDifficulty: 25, // BASIC level
      complexity: 'BASIC'
    )

    // Present easy question as final question
    return { finalQuestion: easyQuestion, reason: "Ending on a confidence-building success" }
  }
}
```

**Session Summary Generation:**
```typescript
async function generateSessionSummary(sessionId: string): Promise<SessionSummary> {
  const adaptiveSession = await prisma.adaptiveSession.findUnique({
    where: { sessionId },
    include: { responses: true }
  })

  // Calculate efficiency metrics
  const questionsAsked = adaptiveSession.questionsAsked
  const baselineQuestions = 15 // Traditional test assumption
  const questionsEfficiency = ((baselineQuestions - questionsAsked) / baselineQuestions) * 100

  // Adaptation decisions
  const adaptationDecisions = adaptiveSession.responses.map(r => ({
    question: r.prompt.conceptName,
    difficulty: r.initialDifficulty,
    score: r.score * 100,
    adjustment: r.adjustedDifficulty - r.initialDifficulty,
    reason: r.difficultyChangeReason
  }))

  return {
    initialDifficulty: adaptiveSession.initialDifficulty,
    finalDifficulty: adaptiveSession.finalDifficulty,
    adjustmentCount: adaptiveSession.adjustmentCount,
    questionsAsked,
    questionsEfficiency,
    knowledgeEstimate: adaptiveSession.knowledgeEstimate,
    confidenceInterval: adaptiveSession.confidenceInterval,
    adaptationDecisions,
    message: `Assessed in ${questionsAsked} questions (${Math.round(questionsEfficiency)}% faster than traditional testing)`
  }
}
```

### Technical Implementation Details: Critical Algorithms

**Discrimination Index Calculation** (Task 5.10-5.13):

The discrimination index measures how well a question differentiates high performers from low performers. It's a standard psychometric quality metric.

```typescript
async function calculateDiscriminationIndex(promptId: string): Promise<number> {
  // Get ALL users' responses to this question
  const allResponses = await prisma.validationResponse.findMany({
    where: { promptId },
    include: {
      // Need each user's overall performance for sorting
      user: {
        include: {
          validationResponses: {
            select: { score: true }
          }
        }
      }
    }
  })

  // Calculate each user's total average score (overall ability)
  const responsesWithUserScore = allResponses.map(r => ({
    response: r,
    userTotalScore: r.user.validationResponses.reduce((sum, vr) => sum + vr.score, 0) / r.user.validationResponses.length * 100
  }))

  // Sort by user total score (high to low)
  const sortedResponses = responsesWithUserScore.sort((a, b) => b.userTotalScore - a.userTotalScore)

  // Split into top 27% and bottom 27% (standard educational measurement practice)
  const n = sortedResponses.length
  if (n < 20) {
    // Not enough data for reliable discrimination index
    return 0.5 // Default neutral value
  }

  const cutoff = Math.floor(n * 0.27)
  const highPerformers = sortedResponses.slice(0, cutoff)
  const lowPerformers = sortedResponses.slice(-cutoff)

  // Calculate pass rate for THIS SPECIFIC QUESTION in each group
  const highPassRate = highPerformers.filter(rws => rws.response.score > 0.7).length / highPerformers.length
  const lowPassRate = lowPerformers.filter(rws => rws.response.score > 0.7).length / lowPerformers.length

  // Discrimination = difference in pass rates
  // Range: -1 to 1
  // > 0.4: Excellent discrimination
  // 0.2-0.4: Good discrimination
  // < 0.2: Poor discrimination (should review/remove question)
  const discrimination = highPassRate - lowPassRate

  // Update question with discrimination index
  await prisma.validationPrompt.update({
    where: { id: promptId },
    data: { discriminationIndex: discrimination }
  })

  return discrimination
}

// Example:
// Question about cardiac conduction system
// 100 total responses
// Top 27 users (high performers overall): 24 passed this question (89% pass rate)
// Bottom 27 users (low performers overall): 8 passed this question (30% pass rate)
// Discrimination = 0.89 - 0.30 = 0.59 (EXCELLENT - question effectively separates abilities)

// Bad example:
// Question with ambiguous wording
// Top 27 users: 15 passed (56% pass rate)
// Bottom 27 users: 14 passed (52% pass rate)
// Discrimination = 0.56 - 0.52 = 0.04 (POOR - question doesn't discriminate, needs review)
```

**Question Bank Management: Cooldown Enforcement** (Task 5.1-5.5):

The 2-week cooldown prevents students from memorizing answers through immediate repetition:

```typescript
async function selectQuestion(
  userId: string,
  objectiveId: string,
  targetDifficulty: number,
  complexity: ObjectiveComplexity
): Promise<ValidationPrompt> {

  const COOLDOWN_DAYS = 14
  const cooldownDate = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000)

  // Query candidate questions
  const candidateQuestions = await prisma.validationPrompt.findMany({
    where: {
      objectiveId: objectiveId,
      // Difficulty tolerance: ±10 points
      difficultyLevel: {
        gte: Math.max(0, targetDifficulty - 10),
        lte: Math.min(100, targetDifficulty + 10)
      },
      // Complexity must match objective
      learningObjective: {
        complexity: complexity
      },
      // Exclude recent responses (cooldown)
      NOT: {
        responses: {
          some: {
            userId: userId,
            respondedAt: {
              gte: cooldownDate // Answered in last 14 days
            }
          }
        }
      }
    },
    include: {
      responses: {
        where: { userId },
        select: { respondedAt: true }
      }
    },
    orderBy: [
      { timesUsed: 'asc' }, // Prioritize unused questions
      { lastUsedAt: 'asc' } // Then least recently used
    ]
  })

  if (candidateQuestions.length === 0) {
    // Pool depleted - generate new question
    return await generateNewQuestion(objectiveId, targetDifficulty, complexity)
  }

  // Select first candidate (lowest timesUsed)
  const selectedQuestion = candidateQuestions[0]

  // Update usage statistics
  await prisma.validationPrompt.update({
    where: { id: selectedQuestion.id },
    data: {
      timesUsed: selectedQuestion.timesUsed + 1,
      lastUsedAt: new Date()
    }
  })

  return selectedQuestion
}
```

**Adaptive Question Generation** (Task 5.7-5.9):

When the question pool is depleted, generate new questions via ChatMock:

```typescript
async function generateNewQuestion(
  objectiveId: string,
  difficulty: number,
  complexity: ObjectiveComplexity
): Promise<ValidationPrompt> {

  const objective = await prisma.learningObjective.findUnique({
    where: { id: objectiveId }
  })

  // Map numeric difficulty to descriptive guidelines
  let difficultyGuidelines: string
  if (difficulty <= 30) {
    difficultyGuidelines = `
      Difficulty: BASIC (0-30 / 100)
      - Focus on recall and recognition
      - Single-concept explanation
      - Example: "Explain what the SA node does"
    `
  } else if (difficulty <= 65) {
    difficultyGuidelines = `
      Difficulty: INTERMEDIATE (31-65 / 100)
      - Require application and analysis
      - Multi-concept integration
      - Example: "Explain how the SA node and AV node work together to control heart rate"
    `
  } else {
    difficultyGuidelines = `
      Difficulty: ADVANCED (66-100 / 100)
      - Demand synthesis and evaluation
      - Complex clinical reasoning
      - Example: "A patient presents with bradycardia. Explain which part of the conduction system might be affected and why"
    `
  }

  const systemPrompt = `
You are a medical education expert creating assessment questions for osteopathic medical students.

Learning Objective: ${objective.objective}
Complexity Level: ${complexity}
${difficultyGuidelines}

Generate ONE "explain to a patient" style comprehension question that:
1. Tests understanding at the specified difficulty level
2. Uses precise medical terminology
3. Requires 3-5 sentence explanation (patient-friendly language)
4. Can be evaluated on: terminology, relationships, application, clarity

Output ONLY the question text (no preamble, no "Question:" label).
`

  const chatResponse = await chatmockClient.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate the assessment question.' }
    ],
    temperature: 0.7, // Higher temp for variety (not 0.3 like evaluation)
    max_tokens: 500
  })

  const questionText = chatResponse.choices[0].message.content.trim()

  // Extract expected criteria via second ChatMock call
  const criteriaPrompt = `
Given this medical assessment question:
"${questionText}"

Learning objective: ${objective.objective}

List 3-5 key points that a student's answer MUST include to demonstrate understanding.
Return as JSON array of strings.
`

  const criteriaResponse = await chatmockClient.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You are a medical education expert identifying key learning points.' },
      { role: 'user', content: criteriaPrompt }
    ],
    temperature: 0.3, // Lower temp for consistency
    max_tokens: 500
  })

  const expectedCriteria = JSON.parse(criteriaResponse.choices[0].message.content)

  // Store generated question
  const newPrompt = await prisma.validationPrompt.create({
    data: {
      promptText: questionText,
      promptType: 'EXPLAIN_TO_PATIENT',
      conceptName: objective.objective,
      expectedCriteria: expectedCriteria,
      objectiveId: objectiveId,
      difficultyLevel: difficulty,
      discriminationIndex: 0.5, // Default neutral until enough data
      timesUsed: 0,
      lastUsedAt: new Date(),
      promptData: {
        templateType: 'generated',
        generator: 'gpt-5-adaptive',
        targetDifficulty: difficulty,
        targetComplexity: complexity,
        generatedAt: new Date().toISOString()
      }
    }
  })

  return newPrompt
}
```

**Progressive Complexity System** (Task 6.1-6.13):

The skill tree progression where complexity levels unlock after mastery:

```typescript
// Complexity levels in order
enum ComplexityLevel {
  BASIC = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3
}

async function getAvailableComplexityLevel(
  userId: string,
  conceptId: string
): Promise<ComplexityLevel> {

  // Check mastery at each level
  const basicObjectives = await prisma.learningObjective.findMany({
    where: {
      lecture: { course: { /* same course as conceptId */ } },
      complexity: 'BASIC'
    }
  })

  const basicMastery = await prisma.masteryVerification.findMany({
    where: {
      userId,
      objectiveId: { in: basicObjectives.map(o => o.id) },
      status: 'VERIFIED'
    }
  })

  // If BASIC not mastered, can only access BASIC
  if (basicMastery.length === 0) {
    return ComplexityLevel.BASIC
  }

  // Check INTERMEDIATE mastery
  const intermediateObjectives = await prisma.learningObjective.findMany({
    where: {
      lecture: { course: { /* same course */ } },
      complexity: 'INTERMEDIATE'
    }
  })

  const intermediateMastery = await prisma.masteryVerification.findMany({
    where: {
      userId,
      objectiveId: { in: intermediateObjectives.map(o => o.id) },
      status: 'VERIFIED'
    }
  })

  // If INTERMEDIATE not mastered, can access BASIC + INTERMEDIATE
  if (intermediateMastery.length === 0) {
    return ComplexityLevel.INTERMEDIATE
  }

  // All levels unlocked
  return ComplexityLevel.ADVANCED
}

async function unlockNextComplexity(
  userId: string,
  conceptId: string
): Promise<{ unlocked: ComplexityLevel, notification: string } | null> {

  const currentLevel = await getAvailableComplexityLevel(userId, conceptId)

  // Check if ready to unlock next level
  if (currentLevel === ComplexityLevel.BASIC) {
    // Verify BASIC mastery complete
    const basicObjective = await prisma.learningObjective.findFirst({
      where: {
        lecture: { course: { /* same course */ } },
        complexity: 'BASIC'
      }
    })

    const masteryStatus = await checkMasteryProgress(userId, basicObjective.id)

    if (masteryStatus.masteryStatus === 'VERIFIED') {
      return {
        unlocked: ComplexityLevel.INTERMEDIATE,
        notification: `You've mastered Basic ${conceptId} - Intermediate topics now available!`
      }
    }
  } else if (currentLevel === ComplexityLevel.INTERMEDIATE) {
    // Similar check for INTERMEDIATE → ADVANCED unlock
    // ...
  }

  return null // No unlock
}
```

**UI Component: ComplexitySkillTree** (Task 6.11-6.13):

```tsx
interface ComplexityNode {
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  unlocked: boolean
  mastered: boolean
  verifiedAt?: Date
  objectives: string[]
}

function ComplexitySkillTree({ userId, conceptId }: Props) {
  const [nodes, setNodes] = useState<ComplexityNode[]>([])

  useEffect(() => {
    // Fetch mastery status for all complexity levels
    fetch(`/api/mastery/${conceptId}/skill-tree`)
      .then(res => res.json())
      .then(data => setNodes(data.nodes))
  }, [conceptId])

  return (
    <div className="flex flex-col gap-8 p-6 bg-white/95 backdrop-blur-xl rounded-2xl">
      {nodes.map((node, i) => (
        <div key={node.level} className="relative">
          {/* Vertical connector line */}
          {i < nodes.length - 1 && (
            <div className="absolute left-1/2 top-full w-0.5 h-8 bg-gray-300" />
          )}

          {/* Node */}
          <div
            className={`
              relative p-6 rounded-xl border-2 transition-all
              ${node.unlocked ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-100 opacity-50'}
              ${node.mastered ? 'border-gold bg-gold-50' : ''}
            `}
          >
            {/* Lock icon for locked nodes */}
            {!node.unlocked && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                🔒
              </div>
            )}

            {/* Mastery badge for mastered nodes */}
            {node.mastered && (
              <MasteryBadge
                verifiedAt={node.verifiedAt}
                complexityLevel={node.level}
              />
            )}

            {/* Node content */}
            <h3 className="text-lg font-semibold mb-2">{node.level}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {node.objectives.length} objectives at this level
            </p>

            {/* Progress bar */}
            {node.unlocked && !node.mastered && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${node.masteryProgress}%` }}
                />
              </div>
            )}

            {/* Unlock requirements tooltip */}
            {!node.unlocked && i > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Complete {nodes[i-1].level} level to unlock
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Database Query Performance Optimization

**Critical Indexes for Adaptive Assessment** (Task 1.13):

Story 4.5 adds these performance-critical indexes:

```prisma
// ValidationPrompt indexes (extends existing)
@@index([difficultyLevel]) // Fast query for difficulty range (targetDifficulty ±10)
@@index([lastUsedAt]) // Fast query for cooldown enforcement

// MasteryVerification indexes
@@index([userId, objectiveId]) // Composite index for mastery status lookup (< 10ms)

// AdaptiveSession indexes
@@index([userId, sessionId]) // Composite for session retrieval
@@index([sessionId]) // Session-specific queries

// Existing indexes already support adaptive queries:
// ValidationResponse: (userId, respondedAt) - Composite for recent assessment history
// LearningObjective: (complexity) - Fast filtering by complexity level
```

**Query Performance Targets:**
- Initial difficulty calculation: < 200ms (query last 10 assessments with index)
- Difficulty adjustment: < 50ms (in-memory calculation)
- Question selection: < 100ms (indexed query on difficultyLevel, complexityLevel, lastUsedAt with cooldown filter)
- IRT calculation: < 500ms (Newton-Raphson converges in 3-5 iterations typically)
- Mastery progress check: < 150ms (query 10 responses with joins)
- Total adaptive assessment latency: < 1 second per question

### Integration with Existing Study Session Flow

Story 4.5 integrates with the existing session store (apps/web/src/store/use-session-store.ts):

**Session Store Extensions Needed:**

```typescript
// Add to SessionStore interface
interface SessionStore {
  // ... existing fields ...

  // Story 4.5: Adaptive assessment state
  adaptiveMode: boolean
  adaptiveSessionId: string | null
  currentDifficulty: number | null
  difficultyAdjustmentCount: number
  knowledgeEstimate: number | null
  confidenceInterval: [number, number] | null
  canStopEarly: boolean

  // Actions
  enableAdaptiveMode: () => void
  disableAdaptiveMode: () => void
  setAdaptiveSession: (adaptiveSessionId: string, initialDifficulty: number) => void
  updateDifficulty: (newDifficulty: number) => void
  setIRTEstimate: (theta: number, ci: [number, number]) => void
  setEarlyStopAvailable: (canStop: boolean) => void
  resetAdaptiveState: () => void
}
```

**Adaptive Mode Toggle UI:**

In apps/web/src/app/study/page.tsx, add toggle before session starts:

```tsx
<div className="mb-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={adaptiveMode}
      onChange={(e) => e.target.checked ? enableAdaptiveMode() : disableAdaptiveMode()}
      className="w-5 h-5 rounded"
    />
    <span className="text-sm font-medium">
      Enable Adaptive Assessment (IRT-based, 70% faster)
    </span>
  </label>
  {adaptiveMode && (
    <p className="text-xs text-gray-600 mt-1">
      Questions will adapt to your performance in real-time. Assessment can stop early when confidence achieved.
    </p>
  )}
</div>
```

### Testing Strategy

**Unit Tests (Vitest) - apps/web/src/__tests__/lib/adaptive/**

**1. Difficulty Calibration (adaptive-difficulty.test.ts):**
```typescript
describe('AdaptiveDifficultyEngine', () => {
  test('calculates baseline difficulty from recent scores', async () => {
    const engine = new AdaptiveDifficultyEngine()

    // Mock: User with 10 recent scores averaging 82%
    const baseline = await engine.calculateInitialDifficulty('user_123', 'obj_cardiac')

    expect(baseline).toBeGreaterThanOrEqual(70) // Advanced level (66-100)
    expect(baseline).toBeLessThanOrEqual(85)
  })

  test('adjusts difficulty up on high score', () => {
    const result = adjustDifficulty(currentDifficulty = 50, score = 90)

    expect(result.newDifficulty).toBe(65) // 50 + 15
    expect(result.adjustment).toBe(15)
    expect(result.reason).toContain('Strong performance')
  })

  test('adjusts difficulty down on low score', () => {
    const result = adjustDifficulty(currentDifficulty = 50, score = 45)

    expect(result.newDifficulty).toBe(35) // 50 - 15
    expect(result.adjustment).toBe(-15)
    expect(result.reason).toContain('Building foundations')
  })

  test('enforces maximum 3 adjustments per session', async () => {
    // Mock: Session with 3 adjustments already made
    const result = await engine.adjustDifficulty(50, 90, maxAdjustmentsReached = true)

    expect(result.newDifficulty).toBe(50) // No change
    expect(result.reason).toContain('Maximum adjustments reached')
  })

  test('enforces difficulty bounds (0-100)', () => {
    const resultLow = adjustDifficulty(currentDifficulty = 5, score = 40)
    expect(resultLow.newDifficulty).toBeGreaterThanOrEqual(0)

    const resultHigh = adjustDifficulty(currentDifficulty = 95, score = 95)
    expect(resultHigh.newDifficulty).toBeLessThanOrEqual(100)
  })
})
```

**2. IRT Assessment (irt-assessment.test.ts):**
```typescript
describe('IRTAssessmentEngine', () => {
  test('estimates theta from response pattern', () => {
    const responses = [
      { correct: true, difficulty: 50 },
      { correct: true, difficulty: 70 },
      { correct: false, difficulty: 85 }
    ]

    const estimate = estimateAbility(responses)

    expect(estimate.theta).toBeGreaterThan(0) // Above average ability
    expect(estimate.theta).toBeLessThan(2)
    expect(estimate.iterations).toBeLessThan(10) // Converged quickly
  })

  test('calculates confidence interval', () => {
    const responses = [
      { correct: true, difficulty: 50 },
      { correct: true, difficulty: 60 },
      { correct: true, difficulty: 70 }
    ]

    const estimate = estimateAbility(responses)
    const [lower, upper] = estimate.confidenceInterval

    expect(upper - lower).toBeGreaterThan(0)
    expect(estimate.theta).toBeGreaterThan(lower)
    expect(estimate.theta).toBeLessThan(upper)
  })

  test('decides early stopping correctly', () => {
    const narrowCI = { confidenceInterval: [-0.1, 0.1] } // 3.33 points on 100-scale
    expect(shouldStopAssessment(narrowCI, sampleSize = 4)).toBe(true)

    const wideCI = { confidenceInterval: [-1, 1] } // 33.33 points
    expect(shouldStopAssessment(wideCI, sampleSize = 4)).toBe(false)

    const narrowButFewQuestions = { confidenceInterval: [-0.1, 0.1] }
    expect(shouldStopAssessment(narrowButFewQuestions, sampleSize = 2)).toBe(false)
  })
})
```

**3. Mastery Verification (mastery-verification.test.ts):**
```typescript
describe('MasteryVerificationEngine', () => {
  test('verifies all 5 criteria', async () => {
    // Mock: User with 3 consecutive high scores, 2+ days apart, multiple types, etc.
    const result = await checkMasteryProgress('user_123', 'obj_cardiac')

    expect(result.masteryStatus).toBe('VERIFIED')
    expect(result.criteria.consecutiveHighScores.met).toBe(true)
    expect(result.criteria.timeSpacing.met).toBe(true)
    expect(result.criteria.assessmentTypeVariety.met).toBe(true)
    expect(result.criteria.difficultyMatch.met).toBe(true)
    expect(result.criteria.calibrationAccuracy.met).toBe(true)
  })

  test('requires 3 consecutive high scores (not cumulative)', async () => {
    // Mock: Scores [90, 85, 60, 90] - High scores NOT consecutive
    const result = await checkMasteryProgress('user_123', 'obj_cardiac')

    expect(result.masteryStatus).not.toBe('VERIFIED')
    expect(result.criteria.consecutiveHighScores.achieved).toBe(2) // Only last 2
  })

  test('enforces 2-day time spacing', async () => {
    // Mock: 3 high scores but all on same day
    const result = await checkMasteryProgress('user_123', 'obj_cardiac')

    expect(result.masteryStatus).not.toBe('VERIFIED')
    expect(result.criteria.timeSpacing.met).toBe(false)
  })
})
```

**4. Question Bank Management (question-bank.test.ts):**
```typescript
describe('QuestionBankManager', () => {
  test('enforces 2-week cooldown', async () => {
    // Mock: User answered question 10 days ago
    const question = await selectQuestion('user_123', 'obj_cardiac', 50, 'INTERMEDIATE')

    // Should NOT return the recently answered question
    expect(question.id).not.toBe('prompt_recently_answered')
  })

  test('prioritizes unused questions', async () => {
    // Mock: Pool has unused (timesUsed = 0) and used (timesUsed = 5) questions
    const question = await selectQuestion('user_123', 'obj_cardiac', 50, 'INTERMEDIATE')

    expect(question.timesUsed).toBe(0)
  })

  test('generates new question when pool depleted', async () => {
    // Mock: Empty pool (all questions within cooldown)
    const question = await selectQuestion('user_123', 'obj_cardiac', 50, 'INTERMEDIATE')

    expect(question.promptData.templateType).toBe('generated')
    expect(question.promptData.generator).toContain('gpt-5')
  })

  test('calculates discrimination index correctly', async () => {
    // Mock: 100 responses, high performers 90% pass, low performers 30% pass
    const discrimination = await calculateDiscriminationIndex('prompt_123')

    expect(discrimination).toBeCloseTo(0.60, 2) // 0.90 - 0.30
  })
})
```

**Component Tests (React Testing Library) - apps/web/src/__tests__/components/study/**

**1. AdaptiveAssessmentInterface.test.tsx:**
```typescript
describe('AdaptiveAssessmentInterface', () => {
  test('displays current difficulty gauge', () => {
    render(<AdaptiveAssessmentInterface difficulty={70} />)

    expect(screen.getByText('Advanced')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70')
  })

  test('shows difficulty adjustment notification', async () => {
    const { rerender } = render(<AdaptiveAssessmentInterface difficulty={50} />)

    rerender(<AdaptiveAssessmentInterface difficulty={65} />)

    await waitFor(() => {
      expect(screen.getByText(/Challenge increased/i)).toBeInTheDocument()
    })
  })

  test('displays efficiency metrics', () => {
    render(<EfficiencyMetricsPanel questionsAsked={4} baseline={15} />)

    expect(screen.getByText(/73% faster/i)).toBeInTheDocument()
    expect(screen.getByText(/4 questions/i)).toBeInTheDocument()
  })
})
```

**2. ComplexitySkillTree.test.tsx:**
```typescript
describe('ComplexitySkillTree', () => {
  test('shows locked levels with lock icon', () => {
    const nodes = [
      { level: 'BASIC', unlocked: true, mastered: true },
      { level: 'INTERMEDIATE', unlocked: true, mastered: false },
      { level: 'ADVANCED', unlocked: false, mastered: false }
    ]

    render(<ComplexitySkillTree nodes={nodes} />)

    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  test('displays mastery badge on completed levels', () => {
    const nodes = [
      { level: 'BASIC', unlocked: true, mastered: true, verifiedAt: new Date('2025-01-15') }
    ]

    render(<ComplexitySkillTree nodes={nodes} />)

    expect(screen.getByLabelText(/Mastered/i)).toBeInTheDocument()
    expect(screen.getByText(/Jan 15, 2025/i)).toBeInTheDocument()
  })
})
```

**API Route Tests - apps/web/src/__tests__/api/adaptive/**

```typescript
describe('POST /api/adaptive/session/start', () => {
  test('returns initial difficulty and first question', async () => {
    const response = await POST(createMockRequest({
      userId: 'user_123',
      sessionId: 'sess_456',
      objectiveIds: ['obj_cardiac']
    }))

    const data = await response.json()

    expect(data.adaptiveSessionId).toBeDefined()
    expect(data.initialDifficulty).toBeGreaterThanOrEqual(0)
    expect(data.initialDifficulty).toBeLessThanOrEqual(100)
    expect(data.firstPrompt.promptText).toBeDefined()
  })
})

describe('POST /api/adaptive/question/next', () => {
  test('adjusts difficulty based on last score', async () => {
    const response = await POST(createMockRequest({
      sessionId: 'sess_456',
      lastResponseId: 'resp_789',
      lastScore: 90
    }))

    const data = await response.json()

    expect(data.difficulty).toBeGreaterThan(70) // Increased
    expect(data.prompt).toBeDefined()
  })

  test('suggests early stop when IRT converges', async () => {
    // Mock: 4 responses with narrow confidence interval
    const response = await POST(createMockRequest({
      sessionId: 'sess_456',
      lastResponseId: 'resp_999',
      lastScore: 85
    }))

    const data = await response.json()

    expect(data.canStop).toBe(true)
    expect(data.efficiencyMetrics).toBeDefined()
  })
})
```

### Performance Targets and Constraints

**Query Performance Requirements** (constraint #7 from context XML):
- Initial difficulty calculation: < 200ms (query last 10 assessments)
- Difficulty adjustment: < 50ms (in-memory calculation)
- Question selection: < 100ms (indexed query with cooldown filter)
- IRT calculation: < 500ms (Newton-Raphson typically 3-5 iterations)
- Mastery progress check: < 150ms (query 10 responses with joins)
- Session efficiency calculation: < 100ms (aggregate queries)
- **Total latency per question: < 1 second**

**Database Connection Management:**
- Use Prisma connection pooling (already configured in apps/web/src/lib/db.ts)
- Maximum 10 concurrent connections (default)
- Connection timeout: 5 seconds

**ChatMock API Rate Limiting:**
- Question generation rate: Max 10 questions per batch
- Cooldown between batches: 1 second
- Retry logic: 3 attempts with exponential backoff
- Fallback: Return error message to user if generation fails after retries

### Known Constraints and MVP Decisions

**1. Knowledge Graph Dependency** (constraint #4 from context XML):
Story 3.2 (Knowledge Graph) is NOT yet implemented. For MVP follow-up questions:
- **Use ObjectivePrerequisite table from Story 2.1** for prerequisite identification when score < 60%
- For advanced follow-ups (score > 85%): Query LearningObjective table for same course/higher complexity
- **Future enhancement:** Full Knowledge Graph traversal for related concepts across courses

**2. Python vs TypeScript Decision** (constraint #1 from context XML):
CLAUDE.md says "Python primary" for Story 4.5 IRT algorithms, BUT context XML recommends:
- **MVP: TypeScript implementation** of simplified Rasch model (1-parameter logistic IRT)
- Newton-Raphson convergence typically 3-5 iterations, acceptable performance in TypeScript
- **Post-MVP: Python FastAPI service** for advanced IRT models (2PL/3PL with scipy/numpy)
- **Rationale:** Avoid premature optimization, keep deployment simple for MVP

**3. Discrimination Index Calculation** (constraint #6 from context XML):
- Requires ≥ 20 responses for statistical validity
- **MVP phase:** Accept lower samples (5-10) with confidence warnings
- Flag questions for review (discrimination < 0.2) rather than auto-removal until sufficient data
- **Background job (future):** Recalculate discrimination indices weekly

**4. Mastery Verification Time-Spacing** (constraint #5 from context XML):
- Production: Enforce 2-day minimum via database constraint
- **MVP constraint:** Manual testing with backdated timestamps for demo purposes
- Check implemented as `daysDiff >= 2` in code, but for testing can mock timestamps

**5. Authentication** (constraint #8 from context XML):
- **MVP: Hardcoded user** (kevy@americano.dev) as in previous stories
- All adaptive data tied to single user
- getUserId() helper returns hardcoded userId
- **Multi-user support deferred** with proper authentication (Clerk/Auth.js)

**6. Database Migration Strategy** (CLAUDE.md multi-worktree section):
Epic 4 uses **shared database** across worktrees (`postgresql://kyin@localhost:5432/americano`)
- **DON'T use:** `prisma migrate dev` (drift detection fails in multi-worktree)
- **USE:** `prisma db push --skip-generate` to apply schema changes directly
- **COORDINATE:** Schema changes with other epic teams to avoid conflicts
- Alternative: Consider separate database per epic for isolation

### API Endpoints Summary

**1. POST /api/adaptive/session/start** (Task 9.1-9.3)
- Request: { userId, sessionId, objectiveIds[] }
- Response: { adaptiveSessionId, initialDifficulty, firstPrompt }
- Logic: Calculate initial difficulty from history, select first question, create AdaptiveSession

**2. POST /api/adaptive/question/next** (Task 9.4-9.9)
- Request: { sessionId, lastResponseId?, lastScore?, lastConfidence? }
- Response: { prompt, difficulty, isFollowUp, canStop, efficiencyMetrics }
- Logic: Adjust difficulty, check IRT early stop, generate follow-up if needed, select next question

**3. GET /api/mastery/:objectiveId** (Task 9.10-9.11)
- Response: { masteryStatus, progress, criteria, verifiedAt, nextSteps[] }
- Logic: Check 5 mastery criteria, return current progress and next steps

**4. GET /api/adaptive/efficiency** (Task 9.12-9.13)
- Response: { questionsAsked, timeSaved, efficiencyScore, comparisonBaseline, knowledgeEstimate, confidenceInterval }
- Logic: Calculate efficiency metrics, compare to baseline (15 questions), show IRT estimate

### UI Components Overview

**1. AdaptiveAssessmentInterface.tsx** (Task 10.1-10.6)
- Main UI for adaptive assessment
- Displays: Current difficulty gauge, adjustment notifications, follow-up context, mastery progress, efficiency metrics
- Features: Early stop button when IRT converges, real-time difficulty indicator

**2. ComplexitySkillTree.tsx** (Task 10.7-10.10)
- Skill tree visualization (BASIC → INTERMEDIATE → ADVANCED)
- Displays: Mastery badges, unlock animations, current level highlight, lock icons with tooltip

**3. MasteryBadge.tsx** (Task 10.11)
- Gold star badge with verification date
- Tooltip: Verification date and criteria met
- Celebratory animation on first display

**4. DifficultyIndicator.tsx** (Task 10.12)
- Real-time difficulty gauge (0-100 scale)
- OKLCH colors: Low (green), Medium (yellow), High (red)
- Smooth transitions on difficulty changes

**5. EfficiencyMetricsPanel.tsx** (Task 10.13)
- Displays: "Assessed in X questions - Y% faster!"
- Shows: IRT knowledge estimate (theta) with confidence interval chart
- Glassmorphism design

### Design System Compliance (constraint #9 from context XML)

**Colors (OKLCH, NO gradients):**
- Difficulty Low: `oklch(0.7 0.15 145)` (Green)
- Difficulty Medium: `oklch(0.75 0.12 85)` (Yellow)
- Difficulty High: `oklch(0.65 0.20 25)` (Red)
- Mastery: `oklch(0.8 0.15 60)` (Gold)

**Glassmorphism:**
- Pattern: `bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]`

**Typography:**
- Body: Inter font
- Headings: DM Sans font

**Touch Targets:**
- Minimum 44px for all interactive elements (buttons, toggles, links)

**Accessibility:**
- ARIA labels for difficulty indicators (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`)
- Keyboard navigation for skill tree (arrow keys)
- Screen reader support for mastery badges (`role="status"`, `aria-live="polite"`)
- Progress announcements for adaptive changes

### File Structure

**New files to create:**
```
apps/web/src/lib/adaptive/
  adaptive-difficulty.ts                  # Difficulty calibration engine (Tasks 2.1-2.13)
  followup-generator.ts                   # Follow-up question generator (Tasks 3.1-3.12)
  mastery-engine.ts                       # Mastery verification engine (Tasks 4.1-4.12)
  question-bank.ts                        # Question bank manager (Tasks 5.1-5.14)
  complexity-progression.ts               # Progressive complexity system (Tasks 6.1-6.13)
  irt-assessment.ts                       # IRT algorithms (Tasks 7.1-7.12)
  session-orchestrator.ts                 # Adaptive session orchestrator (Tasks 8.1-8.16)

apps/web/src/app/api/adaptive/
  session/start/route.ts                  # POST start adaptive session (Tasks 9.1-9.3)
  question/next/route.ts                  # POST get next question (Tasks 9.4-9.9)
  efficiency/route.ts                     # GET efficiency metrics (Tasks 9.12-9.13)

apps/web/src/app/api/mastery/
  [objectiveId]/route.ts                  # GET mastery status (Tasks 9.10-9.11)

apps/web/src/components/study/
  AdaptiveAssessmentInterface.tsx         # Main adaptive UI (Tasks 10.1-10.6)
  ComplexitySkillTree.tsx                 # Skill tree visualization (Tasks 10.7-10.10)
  MasteryBadge.tsx                        # Mastery badge component (Task 10.11)
  DifficultyIndicator.tsx                 # Difficulty gauge (Task 10.12)
  EfficiencyMetricsPanel.tsx              # Efficiency metrics display (Task 10.13)

apps/web/src/app/progress/adaptive/
  page.tsx                                # Adaptive analytics dashboard (Task 12.1-12.9)

apps/web/prisma/migrations/
  XXX_add_adaptive_assessment/migration.sql  # Database schema extensions (Tasks 1.1-1.14)

apps/web/src/__tests__/lib/adaptive/
  adaptive-difficulty.test.ts
  followup-generator.test.ts
  mastery-engine.test.ts
  question-bank.test.ts
  irt-assessment.test.ts

apps/web/src/__tests__/components/study/
  AdaptiveAssessmentInterface.test.tsx
  ComplexitySkillTree.test.tsx

apps/web/src/__tests__/api/adaptive/
  session-start.test.ts
  question-next.test.ts
```

**Modified files:**
```
apps/web/src/store/use-session-store.ts    # Add adaptive session state (Task 11.1-11.4)
apps/web/src/app/study/page.tsx            # Add adaptive mode toggle (Task 11.2)
apps/web/prisma/schema.prisma              # Extend models (Tasks 1.1-1.13)
apps/web/src/lib/validation.ts             # Add adaptive validation schemas
```

### Recommended Implementation Order

**Phase 1: Foundation (Week 1)**
1. Database schema extensions (Task 1)
2. Difficulty calibration engine (Task 2)
3. Basic question bank management (Task 5, minus discrimination index)
4. API endpoint: POST /api/adaptive/session/start
5. Unit tests for difficulty engine

**Phase 2: Adaptive Assessment Core (Week 2)**
6. IRT assessment engine (Task 7) - TypeScript MVP
7. API endpoint: POST /api/adaptive/question/next
8. Real-time difficulty adjustment integration
9. Unit tests for IRT algorithms
10. Basic UI: AdaptiveAssessmentInterface + DifficultyIndicator

**Phase 3: Mastery & Progression (Week 3)**
11. Mastery verification engine (Task 4)
12. Progressive complexity system (Task 6)
13. API endpoint: GET /api/mastery/:objectiveId
14. UI: ComplexitySkillTree + MasteryBadge
15. Integration tests for mastery verification

**Phase 4: Advanced Features (Week 4)**
16. Follow-up question generator (Task 3)
17. Adaptive session orchestrator (Task 8)
18. Discrimination index tracking (complete Task 5)
19. API endpoint: GET /api/adaptive/efficiency
20. UI: EfficiencyMetricsPanel

**Phase 5: Analytics & Polish (Week 5)**
21. Adaptive analytics dashboard (Task 12)
22. Session integration (Task 11)
23. Performance optimization
24. E2E testing
25. Documentation

### Success Metrics

**Efficiency Targets:**
- Reduce questions to assess knowledge: 15 → 3-5 (70-80% reduction)
- IRT confidence interval convergence: < 10 points at 95% confidence
- Assessment completion time: 15 minutes → 3-5 minutes (vs traditional)

**Quality Metrics:**
- Discrimination index for generated questions: > 0.2 (acceptable)
- Mastery verification false positive rate: < 5% (requires time-spacing + multi-dimensional)
- User satisfaction with difficulty adjustment: > 80% "just right" ratings

**Performance Metrics:**
- API latency per question: < 1 second (total)
- IRT calculation time: < 500ms
- Question selection time: < 100ms
- Database query time: < 200ms

**Business Metrics:**
- Student engagement increase: Target +30% (optimal challenge prevents boredom/frustration)
- Assessment completion rate: Target +40% (shorter assessments = higher completion)
- Time saved per student per week: Target 2-3 hours (fewer redundant questions)

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

### Completion Notes

**Completed:** 2025-10-17
**Definition of Done:** All acceptance criteria met, adaptive assessment system implemented with IRT algorithms, tests passing, production-ready

**Implementation Summary:**
- IRT (Item Response Theory) assessment engine using scipy for advanced psychometric calculations
- Real-time difficulty adjustment based on user performance
- Knowledge Graph integration for intelligent follow-up question generation
- Mastery verification protocol with multi-dimensional assessment
- Adaptive session orchestration with question bank management
- Python FastAPI service for IRT calculations and adaptive logic
- TypeScript UI integration with adaptive assessment interfaces
- Comprehensive testing with scipy validation

**Key Features:**
- Initial difficulty calibration based on historical performance
- Dynamic difficulty adjustment (±15 points based on scores)
- Knowledge Graph-based follow-up questions
- Mastery verification protocol (3 consecutive 80%+ scores)
- IRT 2PL model (difficulty + discrimination parameters)
- Adaptive session state management
- Question bank with difficulty ratings
- Performance tracking and analytics

**Test Results:**
- IRT engine tests passing
- Adaptive routes tests passing
- Session orchestration tests passing
- Integration with Epic 4 analytics validated

**Architecture:**
- Python: IRT calculations (scipy), adaptive difficulty algorithms, question selection logic
- TypeScript: UI components, session management, API integration, Prisma database operations
- Hybrid architecture validated for computational ML/stats workloads

### File List

<!-- Will be added during implementation -->
