# Story 4.2: Clinical Reasoning Scenario Assessment

Status: Ready

## Story

As a medical student,
I want to solve clinical reasoning scenarios that test my ability to apply knowledge,
so that I can validate my clinical decision-making skills and identify gaps in my diagnostic reasoning.

## Context

**Epic:** Epic 4 - Understanding Validation Engine
**Priority:** High (Second story in Epic 4, builds on Story 4.1)
**Dependencies:** Story 4.1 (Comprehension Prompts infrastructure), Story 2.1 (Learning Objectives), Story 2.5 (Session Orchestration)

**Business Value:** Differentiates from competitors by testing clinical application, not just recall. Prepares students for real-world clinical scenarios and board exam case-based questions.

**User Value:** Practice clinical reasoning in safe environment, identify diagnostic blind spots, build confidence in applying knowledge to patient cases.

## Acceptance Criteria

1. **AC#1 - Scenario Generation**: System generates clinical case scenarios from learning objectives
   - Multi-step cases with patient presentation, history, physical exam findings
   - Questions test diagnostic reasoning, treatment planning, differential diagnosis
   - Scenarios aligned with USMLE/COMLEX case formats
   - Difficulty varies based on objective complexity (BASIC → single-step, ADVANCED → multi-step)

2. **AC#2 - Interactive Case Progression**: User progresses through scenario in stages (history → exam → labs → diagnosis → treatment)
   - Each stage presents information incrementally
   - User makes decisions at key decision points
   - Can request additional information (costs time/points)
   - Choices affect next stage (branching scenarios)

3. **AC#3 - Reasoning Evaluation**: AI evaluates diagnostic reasoning process, not just final answer
   - Assesses differential diagnosis breadth and prioritization
   - Evaluates test ordering appropriateness (avoid shotgun approach)
   - Checks treatment plan safety and efficacy
   - Scores clinical reasoning pathway (0-100)

4. **AC#4 - Multi-Dimensional Scoring**: System scores across clinical competencies
   - Data gathering (20%): Obtained relevant history/exam findings
   - Diagnosis (30%): Correct differential, appropriate testing
   - Management (30%): Safe and effective treatment plan
   - Clinical reasoning (20%): Logical thought process, avoided cognitive biases
   - Overall score with competency breakdown

5. **AC#5 - Detailed Feedback**: User receives specific feedback on reasoning strengths/weaknesses
   - Highlights missed red flags or critical findings
   - Explains optimal diagnostic pathway
   - Identifies cognitive biases (anchoring, premature closure, etc.)
   - Provides teaching points and resources

6. **AC#6 - Session Integration**: Clinical scenarios integrate into study sessions alongside comprehension prompts
   - Appear after objective mastery reaches INTERMEDIATE+ level
   - Frequency: 1 scenario per 3-4 objectives (avoid fatigue)
   - Time-boxed: 5-15 minutes depending on complexity
   - Results tracked in Session Summary

7. **AC#7 - Performance Tracking**: System tracks clinical reasoning performance over time
   - ClinicalReasoningMetric model (scenarioType, competency scores, timestamp)
   - Progress page shows competency radar chart (4 dimensions)
   - Identifies weak competencies (e.g., consistently poor differential diagnosis)

8. **AC#8 - Board Exam Alignment**: Scenarios map to USMLE/COMLEX blueprint topics
   - Tag scenarios with exam topics (Cardiology, Neurology, etc.)
   - Track coverage across organ systems
   - Prioritize high-yield exam topics from board exam tags (Story 2.1)

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Extensions** (AC: #7, #8)
  - [ ] 1.1: Create ClinicalScenario model (id, objectiveId FK, scenarioType enum, difficulty, caseText JSON, createdAt)
  - [ ] 1.2: Add scenarioType enum (DIAGNOSIS, MANAGEMENT, DIFFERENTIAL, COMPLICATIONS)
  - [ ] 1.3: Create ScenarioResponse model (id, scenarioId FK, userId FK, sessionId FK, userChoices JSON, reasoning text, score, competencyScores JSON, respondedAt)
  - [ ] 1.4: Create ClinicalReasoningMetric model (id, userId, scenarioType, competencyScores JSON, boardExamTopic, date)
  - [ ] 1.5: Add indexes for performance (userId+date, scenarioType, boardExamTopic)
  - [ ] 1.6: Generate Prisma migration and apply

- [ ] **Task 2: Scenario Generation Engine** (AC: #1, #8)
  - [ ] 2.1: Create `ClinicalScenarioGenerator` class in `src/lib/clinical-scenario-generator.ts`
  - [ ] 2.2: Implement `generateScenario(objectiveId, difficulty)` method
  - [ ] 2.3: Fetch objective and construct ChatMock (GPT-5) prompt for case generation
  - [ ] 2.4: System prompt emphasizes USMLE/COMLEX format, realistic patient presentations
  - [ ] 2.5: Generate multi-stage case structure (Chief Complaint → HPI → Physical Exam → Labs/Imaging → Questions)
  - [ ] 2.6: Parse ChatMock response into structured caseText JSON
  - [ ] 2.7: Tag scenario with boardExamTopic from objective.boardExamTags
  - [ ] 2.8: Store ClinicalScenario in database
  - [ ] 2.9: Cache scenarios (avoid regenerating for same objective within 30 days)

- [ ] **Task 3: Interactive Case Component** (AC: #2)
  - [ ] 3.1: Create `ClinicalCaseDialog.tsx` in `src/components/study/`
  - [ ] 3.2: Implement stage-based progression (ChiefComplaint → History → PhysicalExam → Workup → Diagnosis → Management)
  - [ ] 3.3: Display patient info card (age, sex, presenting complaint)
  - [ ] 3.4: Add "Request More Info" buttons (vitals, labs, imaging) with cost indicators
  - [ ] 3.5: Display decision point radio buttons / checkboxes for key choices
  - [ ] 3.6: Track user selections in state (userChoices object)
  - [ ] 3.7: Add timer display (time spent tracked for scoring)
  - [ ] 3.8: Add submit button (triggers AI evaluation)
  - [ ] 3.9: Apply glassmorphism design (NO gradients), OKLCH colors, min 44px touch targets

- [ ] **Task 4: Clinical Reasoning Evaluator** (AC: #3, #4)
  - [ ] 4.1: Create `ClinicalReasoningEvaluator` class in `src/lib/clinical-reasoning-evaluator.ts`
  - [ ] 4.2: Implement `evaluateReasoning(scenarioId, userChoices, userReasoning)` method
  - [ ] 4.3: Construct ChatMock (GPT-5) prompt with evaluation rubric (4 competencies)
  - [ ] 4.4: Rubric includes: Data Gathering (relevant history/exam), Diagnosis (differential + testing), Management (treatment safety/efficacy), Clinical Reasoning (logic, bias detection)
  - [ ] 4.5: Parse AI response into competency scores (0-100 each)
  - [ ] 4.6: Calculate weighted overall score: (DataGathering*0.20 + Diagnosis*0.30 + Management*0.30 + Reasoning*0.20)
  - [ ] 4.7: Extract strengths[], weaknesses[], missedFindings[], cognitiveBiases[]
  - [ ] 4.8: Generate teaching points and resource links
  - [ ] 4.9: Return structured evaluation object

- [ ] **Task 5: Feedback Display** (AC: #5)
  - [ ] 5.1: Create `ClinicalFeedbackPanel.tsx` component
  - [ ] 5.2: Display overall score with progress ring (color-coded: <60 red, 60-79 yellow, 80+ green)
  - [ ] 5.3: Display competency radar chart (4 axes: Data, Diagnosis, Management, Reasoning)
  - [ ] 5.4: Display strengths section (what user did well, bulleted)
  - [ ] 5.5: Display weaknesses section (errors, missed findings, bulleted with hints)
  - [ ] 5.6: Display cognitive biases detected (if any, with explanations)
  - [ ] 5.7: Display optimal pathway (ideal diagnostic approach)
  - [ ] 5.8: Display teaching points with external resource links
  - [ ] 5.9: Add "Review Case" button (reopen scenario in read-only mode)
  - [ ] 5.10: Add "Next" button (continue session)

- [ ] **Task 6: API Endpoints** (AC: #1, #3, #7)
  - [ ] 6.1: Create POST `/api/validation/scenarios/generate` (generate scenario for objectiveId)
  - [ ] 6.2: Request body: { objectiveId: string, difficulty?: string }
  - [ ] 6.3: Response: { scenario: ClinicalScenario }
  - [ ] 6.4: Create POST `/api/validation/scenarios/submit` (submit and evaluate)
  - [ ] 6.5: Request body: { scenarioId, sessionId?, userChoices: JSON, userReasoning: string }
  - [ ] 6.6: Call ClinicalReasoningEvaluator
  - [ ] 6.7: Save ScenarioResponse to database
  - [ ] 6.8: Update ClinicalReasoningMetric aggregates (daily rollup)
  - [ ] 6.9: Response: { evaluation, score, competencyScores, feedback }
  - [ ] 6.10: Create GET `/api/validation/scenarios/metrics` (clinical reasoning history)
  - [ ] 6.11: Response: { metrics: ClinicalReasoningMetric[], competencyAverages, weakCompetencies[] }

- [ ] **Task 7: Session Integration** (AC: #6)
  - [ ] 7.1: Update Study Session Orchestration (Story 2.5) to inject clinical scenarios
  - [ ] 7.2: Trigger condition: Objective mastery level >= INTERMEDIATE
  - [ ] 7.3: Frequency control: 1 scenario per 3-4 objectives (avoid fatigue)
  - [ ] 7.4: Check if objective has scenario completed recently (last 14 days)
  - [ ] 7.5: If not completed, generate and show ClinicalCaseDialog
  - [ ] 7.6: Track time spent on scenario (add to session duration)
  - [ ] 7.7: Update Session Summary with scenario results (competency scores, time)
  - [ ] 7.8: Mission objective completion considers scenario score (threshold: 60%)

- [ ] **Task 8: Clinical Reasoning Analytics** (AC: #7, #8)
  - [ ] 8.1: Create `/progress/clinical-reasoning` page or section
  - [ ] 8.2: Fetch user's ClinicalReasoningMetric history (last 30/90 days)
  - [ ] 8.3: Display competency radar chart (Recharts): Average scores per competency
  - [ ] 8.4: Display scenario type breakdown (bar chart: Diagnosis, Management, Differential, Complications)
  - [ ] 8.5: Display board exam coverage (pie chart: organ systems attempted)
  - [ ] 8.6: Highlight weak competencies (avg score < 60% over 5+ scenarios)
  - [ ] 8.7: Display recent scenarios list (date, topic, score, competency breakdown)
  - [ ] 8.8: Add filter by scenario type, board exam topic, date range
  - [ ] 8.9: Apply glassmorphism design (NO gradients), OKLCH colors

- [ ] **Task 9: Scenario Difficulty Scaling** (AC: #1)
  - [ ] 9.1: Map objective complexity to scenario difficulty (BASIC → single-step diagnosis, INTERMEDIATE → multi-step, ADVANCED → complex with comorbidities)
  - [ ] 9.2: BASIC scenarios: Straightforward presentation, clear diagnosis, simple management
  - [ ] 9.3: INTERMEDIATE scenarios: Atypical presentation, differential required, workup planning
  - [ ] 9.4: ADVANCED scenarios: Multiple comorbidities, rare conditions, complex decision trees
  - [ ] 9.5: Store difficulty in ClinicalScenario model
  - [ ] 9.6: Adaptive difficulty: Increase complexity if user scores consistently high (>85%)

- [ ] **Task 10: Testing and Validation** (AC: All)
  - [ ] 10.1: Generate 10 test scenarios across difficulty levels and scenario types
  - [ ] 10.2: Submit 20 test responses (correct, partially correct, incorrect)
  - [ ] 10.3: Verify AI evaluation accuracy (competency scores make sense)
  - [ ] 10.4: Test session integration (scenarios appear at correct time, frequency control works)
  - [ ] 10.5: Test analytics page (charts render, filters work, weak competencies identified)
  - [ ] 10.6: Verify database indexes (query performance < 150ms)
  - [ ] 10.7: Verify ChatMock error handling (retry logic, user-friendly errors)

## Dev Notes

### Architecture Context

**Subsystem:** Understanding Validation Engine (Epic 4)
**Dependencies:**
- **Story 4.1**: ValidationPrompt/ValidationResponse models, ChatMock evaluation patterns
- **Story 2.1**: LearningObjective model, boardExamTags
- **Story 2.2**: MasteryLevel tracking (trigger condition)
- **Story 2.5**: Study Session Orchestration (integration point)

**Database Models (New):**
- `ClinicalScenario`: Stores generated case scenarios with difficulty, type, case structure JSON
- `ScenarioResponse`: Stores user responses, reasoning, evaluation results
- `ClinicalReasoningMetric`: Aggregates performance over time per competency

**AI Integration:**
- ChatMock (GPT-5) for scenario generation and evaluation
- Temperature: 0.4 for scenario generation (creative but consistent)
- Temperature: 0.3 for evaluation (consistent scoring)
- Max tokens: 4000 for complex scenarios

### Technical Implementation Notes

**1. Case Structure JSON Format:**
```json
{
  "chiefComplaint": "72-year-old man with sudden chest pain",
  "demographics": { "age": 72, "sex": "M", "occupation": "retired" },
  "history": {
    "presenting": "Sudden onset substernal chest pain...",
    "past": "Hypertension, hyperlipidemia, type 2 diabetes",
    "medications": ["Lisinopril", "Atorvastatin", "Metformin"],
    "socialHistory": "Former smoker (30 pack-years), quit 10 years ago"
  },
  "physicalExam": {
    "vitals": { "BP": "160/95", "HR": "102", "RR": "22", "T": "37.1C" },
    "general": "Diaphoretic, anxious",
    "cardiovascular": "S4 gallop, no murmurs",
    "respiratory": "Clear bilaterally"
  },
  "labs": {
    "available": false,
    "options": ["CBC", "BMP", "Troponin", "ECG", "CXR", "Cardiac enzymes"]
  },
  "questions": [
    {
      "stage": "workup",
      "prompt": "What is your next best step?",
      "options": ["Order ECG", "Give aspirin", "Order CT angiography", "Wait and observe"],
      "correctAnswer": "Order ECG",
      "reasoning": "ECG is first-line for suspected ACS..."
    }
  ]
}
```

**2. Evaluation Rubric (ChatMock Prompt):**
```
Evaluate this medical student's clinical reasoning on a case scenario.

Case: [scenario text]
Student Response: [userChoices + userReasoning]

Score on 4 competencies (0-100 each):

1. Data Gathering (20%):
   - Did they obtain relevant history/exam findings?
   - Did they avoid unnecessary tests?
   - Did they recognize red flags?

2. Diagnosis (30%):
   - Is differential diagnosis appropriate and prioritized?
   - Are diagnostic tests ordered appropriately?
   - Did they reach correct diagnosis?

3. Management (30%):
   - Is treatment plan safe and effective?
   - Are medications dosed correctly?
   - Are contraindications considered?

4. Clinical Reasoning (20%):
   - Is thought process logical and systematic?
   - Did they avoid cognitive biases (anchoring, premature closure)?
   - Can they justify decisions?

Provide:
- Competency scores (0-100 each)
- Strengths (what they did well)
- Weaknesses (errors, missed findings)
- Cognitive biases detected (if any)
- Optimal pathway (ideal approach)
- Teaching points with resources
```

**3. Competency Score Calculation:**
```typescript
const overallScore =
  (dataGatheringScore * 0.20) +
  (diagnosisScore * 0.30) +
  (managementScore * 0.30) +
  (clinicalReasoningScore * 0.20);
```

**4. Session Integration Logic:**
```typescript
// In session orchestrator, after objective content review:
if (objective.masteryLevel === 'INTERMEDIATE' || objective.masteryLevel === 'ADVANCED') {
  const objectivesSinceLastScenario = sessionState.objectivesCompletedSinceScenario;

  if (objectivesSinceLastScenario >= 3) {
    const lastScenarioDate = await getLastScenarioDate(objective.id);
    const daysSinceLastScenario = getDaysSince(lastScenarioDate);

    if (daysSinceLastScenario >= 14) {
      // Generate and show clinical scenario
      const scenario = await generateScenario(objective.id, objective.complexity);
      return { type: 'CLINICAL_SCENARIO', scenario };
    }
  }
}
```

**5. Difficulty Scaling:**
- BASIC (Bloom's: Remember/Understand): Single-step diagnosis, classic presentation, 1-2 decision points
- INTERMEDIATE (Bloom's: Apply/Analyze): Multi-step workup, differential required, 3-4 decision points
- ADVANCED (Bloom's: Evaluate/Create): Complex comorbidities, rare conditions, 5+ decision points, multiple pathways

### Project Structure Notes

**New Files:**
```
apps/web/src/lib/clinical-scenario-generator.ts
apps/web/src/lib/clinical-reasoning-evaluator.ts
apps/web/src/components/study/ClinicalCaseDialog.tsx
apps/web/src/components/study/ClinicalFeedbackPanel.tsx
apps/web/src/app/api/validation/scenarios/generate/route.ts
apps/web/src/app/api/validation/scenarios/submit/route.ts
apps/web/src/app/api/validation/scenarios/metrics/route.ts
apps/web/src/app/progress/clinical-reasoning/page.tsx
apps/web/prisma/migrations/XXX_add_clinical_scenarios/migration.sql
```

**Modified Files:**
```
apps/web/src/app/study/page.tsx (inject ClinicalCaseDialog)
apps/web/src/lib/session-orchestrator.ts (trigger scenarios)
apps/web/prisma/schema.prisma (add ClinicalScenario, ScenarioResponse, ClinicalReasoningMetric)
```

### Design System Compliance

- **Competency Colors** (OKLCH):
  - Data Gathering: `oklch(0.65 0.18 200)` (Blue)
  - Diagnosis: `oklch(0.7 0.15 145)` (Green)
  - Management: `oklch(0.68 0.16 280)` (Purple)
  - Clinical Reasoning: `oklch(0.72 0.12 45)` (Orange)

- **Score Thresholds**:
  - 0-59: `oklch(0.65 0.20 25)` (Red - Needs Improvement)
  - 60-79: `oklch(0.75 0.12 85)` (Yellow - Developing)
  - 80-100: `oklch(0.7 0.15 145)` (Green - Proficient)

- **Glassmorphism**: `bg-white/95 backdrop-blur-xl`
- **Typography**: Inter (body), DM Sans (headings)
- **Touch Targets**: Minimum 44px

### References

- **Source**: [PRD-Americano-2025-10-14.md](../PRD-Americano-2025-10-14.md) - FR5: Understanding Validation
- **Source**: [epics-Americano-2025-10-14.md](../epics-Americano-2025-10-14.md) - Epic 4, Story 4.2
- **Source**: [solution-architecture.md](../solution-architecture.md) - Subsystem 4: Understanding Validation Engine
- **Source**: [AGENTS.MD](../../AGENTS.MD) - ChatMock prompt engineering patterns
- **Source**: USMLE Step 2 CK Content Outline - Clinical case formats
- **Source**: COMLEX Level 2-CE Blueprint - Osteopathic clinical reasoning

## Dev Agent Record

### Context Reference

- docs/stories/story-context-4.2.xml (Generated 2025-10-16 via story-context workflow)

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added during implementation -->

### File List

<!-- Will be added during implementation -->
