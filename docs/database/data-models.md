---
title: "Data Models Summary - Americano"
description: "Comprehensive overview of all 77 Prisma models, relationships, indexes, and pgvector configuration across Epic 3, 4, and 5 implementations"
type: "Data"
status: "Active"
version: "1.0"

owner: "Database Optimizer"
dri_backup: "Winston (Architect)"
contributors: ["Backend Team", "Epic Leads"]
review_cadence: "Per Epic"

created_date: "2025-10-23T12:50:00-07:00"
last_updated: "2025-10-23T12:50:00-07:00"
last_reviewed: "2025-10-23T12:50:00-07:00"
next_review_due: "2025-11-23"

depends_on:
  - apps/web/prisma/schema.prisma
  - docs/DATABASE-MIGRATION-STRATEGY.md
affects:
  - All database operations
  - API data contracts
related_adrs:
  - docs/architecture/ADR-005-gemini-embeddings-1536.md
  - docs/architecture/ADR-003-two-tier-caching.md

audience:
  - backend-devs
  - database-admins
  - architects
technical_level: "Advanced"
tags: ["data", "models", "prisma", "database", "schema", "indexes", "pgvector"]
keywords: ["Prisma models", "PostgreSQL", "relationships", "foreign keys", "indexes", "migrations"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 5000
  reading_time_min: 25
  code_examples: 30
  last_link_check: "2025-10-23T12:50:00-07:00"
  broken_links: 0

changelog:
  - version: "1.0"
    date: "2025-10-23"
    author: "Database Optimizer"
    changes:
      - "Initial data models summary"
      - "77 Prisma models documented"
      - "27 strategic indexes listed"
      - "Epic 3/4/5 model categorization"
---

# Data Models Summary - Americano

## Overview

The Americano adaptive learning platform uses **77 Prisma models** stored in PostgreSQL, with **27 strategic indexes** for performance optimization and **pgvector** extension for semantic search.

**Canonical Source:** [`apps/web/prisma/schema.prisma`](../apps/web/prisma/schema.prisma)

---

## Database Statistics

| Metric | Value |
|--------|-------|
| **Total Models** | 77 |
| **Strategic Indexes** | 27 (Epic 5 optimization) |
| **Database** | PostgreSQL 16 |
| **Extensions** | pgvector (vector embeddings) |
| **Vector Dimensions** | 1536 (Gemini embeddings) |
| **Total Migrations** | 40+ |

---

## Model Categories by Epic

### Core Models (Foundation)
**Count:** 15 models
- User, Course, Lecture, ContentChunk, LearningObjective
- Mission, Card, Review, StudySession
- Exam, Streak, Achievement, StudyGoal
- CoursePriority, PriorityFeedback

### Epic 3: Adaptive Content Delivery
**Count:** 12 models
- **Semantic Search:** ContentChunk, Embedding, ContentRecommendation
- **Knowledge Graph:** Concept, ConceptRelationship
- **First Aid Integration:** FirstAidEdition, FirstAidSection, LectureFirstAidMapping
- **Search Analytics:** SearchAnalytic, UserSearchHistory
- **Recommendations:** RecommendationAnalytic, RecommendationFeedback

### Epic 4: Understanding Validation Engine
**Count:** 11 models
- ValidationPrompt, ValidationResponse
- ComprehensionMetric, ClinicalScenario, ScenarioAttempt
- ControlledChallenge, ChallengeGeneration
- CalibrationMetric, MasteryVerification
- AdaptiveSession, UnderstandingAnalytic

### Epic 5: Behavioral Twin Engine
**Count:** 20+ models
- **Patterns:** BehavioralEvent, BehavioralPattern, BehavioralInsight, InsightPattern
- **Profiles:** UserLearningProfile, LearningPattern
- **Predictions:** PerformancePrediction, StrugglePrediction, StruggleIntervention
- **Cognitive Health:** CognitiveLoadMetric, BurnoutRiskAssessment, DifficultyAdjustment
- **Personalization:** PersonalizationConfig, PersonalizationStrategy, ABTest, TestParticipation, PersonalizationEffectiveness
- **Orchestration:** StudyTimeRecommendation, SessionDurationOptimization, ContentSequence, StudyIntensityModulation
- **Goals:** GoalProgress, GoalMilestone, GoalAchievement
- **Articles:** LearningArticle, ArticleRecommendation

### Utility Models
**Count:** 19 models
- **Missions:** MissionAnalytics, MissionFeedback, MissionStreak, MissionReview
- **Conflicts:** conflict_flags, conflict_history, conflict_resolutions, conflicts
- **Performance:** PerformanceMetric, PerformanceCorrelation
- **Prerequisites:** ObjectivePrerequisite, PrerequisiteGap, PrerequisiteReview
- **Session Tracking:** SessionPause, SessionBreak, FatigueDetection
- **Misc:** RetrievalPracticeAttempt, InterventionApplication, FailurePatternDetection

---

## Core Data Models (Detailed)

### User Model

```prisma
model User {
  id                 String   @id @default(uuid())
  email              String   @unique
  name               String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relationships
  studySessions      StudySession[]
  reviews            Review[]
  courses            Course[]
  learningProfile    UserLearningProfile?
  behavioralEvents   BehavioralEvent[]
  predictions        PerformancePrediction[]

  @@index([email])
}
```

**Key Relationships:**
- One-to-many: StudySession, Review, Course
- One-to-one: UserLearningProfile
- Foreign keys in: BehavioralEvent, PerformancePrediction

---

### Course Model

```prisma
model Course {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String?  // UI display color
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  lectures    Lecture[]
  objectives  LearningObjective[]
  missions    Mission[]

  @@index([userId])
  @@index([name])
}
```

---

### ContentChunk Model

```prisma
model ContentChunk {
  id           String   @id @default(uuid())
  content      String   @db.Text
  contentType  ContentType
  source       String?  // Lecture ID, PDF page, etc.
  metadata     Json?    // Flexible metadata (title, tags, etc.)
  createdAt    DateTime @default(now())

  // Relationships
  lectureId    String?
  lecture      Lecture?   @relation(fields: [lectureId], references: [id])
  objectiveId  String?
  objective    LearningObjective? @relation(fields: [objectiveId], references: [id])
  embedding    Embedding?
  recommendations ContentRecommendation[]

  @@index([lectureId])
  @@index([objectiveId])
  @@index([contentType])
}

enum ContentType {
  TEXT
  IMAGE
  VIDEO
  PDF
  FLASHCARD
  CLINICAL_CASE
}
```

---

## Epic 3: Semantic Search Models

### Embedding Model (pgvector)

```prisma
model Embedding {
  id          String   @id @default(uuid())
  chunkId     String   @unique
  vector      Unsupported("vector(1536)")  // 1536-dim Gemini embeddings
  model       String   @default("text-embedding-001")
  createdAt   DateTime @default(now())

  // Relationships
  chunk       ContentChunk @relation(fields: [chunkId], references: [id])

  @@index([vector(ops: raw("vector_cosine_ops"))], type: IVFFlat, name: "embedding_vector_idx")
}
```

**pgvector Configuration:**
- **Dimensions:** 1536 (Gemini text-embedding-001)
- **Index Type:** IVFFlat (100 lists for ~50K vectors)
- **Distance Metric:** Cosine similarity
- **Query Performance:** <500ms for 50K vectors

See [ADR-005: Gemini Embeddings](./architecture/ADR-005-gemini-embeddings-1536.md)

---

### Concept Model (Knowledge Graph)

```prisma
model Concept {
  id              String   @id @default(uuid())
  name            String
  definition      String?  @db.Text
  category        String?  // e.g., "Cardiovascular", "Pharmacology"
  difficulty      Int?     // 1-10 scale
  createdAt       DateTime @default(now())

  // Relationships (graph edges)
  outgoingRelations ConceptRelationship[] @relation("FromConcept")
  incomingRelations ConceptRelationship[] @relation("ToConcept")
  objectives        LearningObjective[]

  @@index([name])
  @@index([category])
}

model ConceptRelationship {
  id            String   @id @default(uuid())
  type          RelationType
  strength      Float?   // 0.0-1.0 (relationship strength)
  createdAt     DateTime @default(now())

  // Graph edges
  fromConceptId String
  toConceptId   String
  fromConcept   Concept  @relation("FromConcept", fields: [fromConceptId], references: [id])
  toConcept     Concept  @relation("ToConcept", fields: [toConceptId], references: [id])

  @@index([fromConceptId])
  @@index([toConceptId])
}

enum RelationType {
  PREREQUISITE
  RELATED
  SIMILAR
  OPPOSITE
  EXAMPLE_OF
  CAUSES
  TREATS
}
```

---

### First Aid Integration Models

```prisma
model FirstAidEdition {
  id        String   @id @default(uuid())
  year      Int      // e.g., 2025
  isbn      String?
  createdAt DateTime @default(now())

  // Relationships
  sections  FirstAidSection[]

  @@unique([year])
}

model FirstAidSection {
  id            String   @id @default(uuid())
  editionId     String
  edition       FirstAidEdition @relation(fields: [editionId], references: [id])
  title         String
  pageStart     Int?
  pageEnd       Int?
  content       String?  @db.Text
  createdAt     DateTime @default(now())

  // Relationships
  lectureMappings LectureFirstAidMapping[]

  @@index([editionId])
  @@index([title])
}

model LectureFirstAidMapping {
  id              String   @id @default(uuid())
  lectureId       String
  lecture         Lecture  @relation(fields: [lectureId], references: [id])
  firstAidSectionId String
  firstAidSection FirstAidSection @relation(fields: [firstAidSectionId], references: [id])
  relevanceScore  Float?   // 0.0-1.0
  createdAt       DateTime @default(now())

  @@index([lectureId])
  @@index([firstAidSectionId])
}
```

---

## Epic 4: Validation Models

### ValidationPrompt Model

```prisma
model ValidationPrompt {
  id              String   @id @default(uuid())
  objectiveId     String
  objective       LearningObjective @relation(fields: [objectiveId], references: [id])
  promptText      String   @db.Text
  context         String?  @db.Text
  difficulty      Int      // 1-5 scale
  conceptDomain   String?  // e.g., "pathophysiology", "pharmacology"
  createdAt       DateTime @default(now())

  // Relationships
  responses       ValidationResponse[]

  @@index([objectiveId])
  @@index([difficulty])
}

model ValidationResponse {
  id              String   @id @default(uuid())
  promptId        String
  prompt          ValidationPrompt @relation(fields: [promptId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  userAnswer      String   @db.Text
  confidenceLevel Int      // 1-5 scale
  aiEvaluation    Json     // Structured feedback from ChatMock/GPT-5
  overallScore    Int      // 0-100
  createdAt       DateTime @default(now())

  // Relationships
  metrics         ComprehensionMetric?

  @@index([promptId])
  @@index([userId])
  @@index([createdAt])
}

model ComprehensionMetric {
  id                    String   @id @default(uuid())
  responseId            String   @unique
  response              ValidationResponse @relation(fields: [responseId], references: [id])
  terminologyScore      Int      // 0-100
  relationshipsScore    Int      // 0-100
  applicationScore      Int      // 0-100
  clarityScore          Int      // 0-100
  calibrationDelta      Float    // confidence - performance
  createdAt             DateTime @default(now())

  @@index([createdAt])
}
```

---

### ClinicalScenario Model

```prisma
model ClinicalScenario {
  id              String   @id @default(uuid())
  objectiveId     String
  objective       LearningObjective @relation(fields: [objectiveId], references: [id])
  scenarioText    String   @db.Text
  clinicalContext String?  @db.Text
  difficulty      Int      // 1-5 scale
  expectedSteps   Json     // Array of expected reasoning steps
  createdAt       DateTime @default(now())

  // Relationships
  attempts        ScenarioAttempt[]

  @@index([objectiveId])
  @@index([difficulty])
}

model ScenarioAttempt {
  id              String   @id @default(uuid())
  scenarioId      String
  scenario        ClinicalScenario @relation(fields: [scenarioId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  userSteps       Json     // Array of user's reasoning steps
  evaluation      Json     // AI evaluation of reasoning
  score           Int      // 0-100
  createdAt       DateTime @default(now())

  @@index([scenarioId])
  @@index([userId])
}
```

---

## Epic 5: Behavioral Models

### UserLearningProfile Model

```prisma
model UserLearningProfile {
  id                    String   @id @default(uuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])

  // 7 Behavioral Dimensions
  optimalStudyTime      Json?    // Array of time slots with performance scores
  sessionDurationPref   Int?     // Minutes (baseline)
  contentTypePref       Json?    // { visual: 0.3, auditory: 0.2, kinesthetic: 0.1, reading: 0.4 }
  performancePeaks      Json?    // Time-of-day performance data
  attentionCycles       Json?    // Break timing patterns
  forgettingCurve       Json?    // Personalized retention model
  learningStyle         String?  // VARK model result

  // Data Quality
  dataQualityScore      Float    @default(0.0)  // 0.0-1.0
  lastAnalyzedAt        DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  patterns              LearningPattern[]
  predictions           PerformancePrediction[]

  @@index([userId])
  @@index([dataQualityScore])
}

model LearningPattern {
  id              String   @id @default(uuid())
  profileId       String
  profile         UserLearningProfile @relation(fields: [profileId], references: [id])
  patternType     PatternType
  patternData     Json     // Pattern-specific data
  confidence      Float    // 0.0-1.0
  detectedAt      DateTime @default(now())

  @@index([profileId])
  @@index([patternType])
  @@index([confidence])
}

enum PatternType {
  TIME_OF_DAY
  SESSION_DURATION
  CONTENT_PREFERENCE
  PERFORMANCE_PEAK
  ATTENTION_CYCLE
  FORGETTING_CURVE
  LEARNING_STYLE
}
```

---

### StrugglePrediction Model

```prisma
model StrugglePrediction {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  objectiveId       String
  objective         LearningObjective @relation(fields: [objectiveId], references: [id])
  predictionType    PredictionType
  confidence        Float    // 0.0-1.0 (ML model confidence)
  timeframe         String   // "3-7 days", "1-2 weeks"
  features          Json     // 24-dimensional feature vector
  rationale         String?  @db.Text
  predictedAt       DateTime @default(now())

  // Feedback Loop
  userFeedback      String?  // "accurate", "inaccurate", "helpful", "not-helpful"
  actualOutcome     Boolean? // Did struggle occur?
  feedbackAt        DateTime?

  // Relationships
  interventions     StruggleIntervention[]

  @@index([userId])
  @@index([objectiveId])
  @@index([confidence])
  @@index([predictedAt])
}

enum PredictionType {
  PERFORMANCE_DROP
  PREREQUISITE_GAP
  COGNITIVE_OVERLOAD
  FORGETTING_RISK
  DIFFICULTY_MISMATCH
}

model StruggleIntervention {
  id              String   @id @default(uuid())
  predictionId    String
  prediction      StrugglePrediction @relation(fields: [predictionId], references: [id])
  type            InterventionType
  priority        Int      // 1-10 (urgency + impact)
  description     String   @db.Text
  status          InterventionStatus
  appliedAt       DateTime?
  createdAt       DateTime @default(now())

  @@index([predictionId])
  @@index([status])
}

enum InterventionType {
  PREREQUISITE_REVIEW
  DIFFICULTY_PROGRESSION
  SPACING_ADJUSTMENT
  CONTENT_VARIATION
  BREAK_RECOMMENDATION
  WORKLOAD_REDUCTION
  CONFIDENCE_CALIBRATION
  CLINICAL_CONTEXT
  SPACED_REPETITION
  RETRIEVAL_PRACTICE
}

enum InterventionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  DISMISSED
}
```

---

### CognitiveLoadMetric Model

```prisma
model CognitiveLoadMetric {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  sessionId         String?
  session           StudySession? @relation(fields: [sessionId], references: [id])

  // Cognitive Load Calculation (0-100 scale)
  loadScore         Int      // Overall cognitive load

  // 5 Stress Indicators
  responseLatency   Float?   // Average response time (ms)
  errorClustering   Boolean? // Errors clustered in time?
  repeatAttempts    Int?     // Number of repeat attempts
  engagementDrop    Boolean? // Sudden engagement decrease?
  abandonmentSignal Boolean? // Mid-session abandonment?

  calculatedAt      DateTime @default(now())

  @@index([userId])
  @@index([sessionId])
  @@index([calculatedAt])
  @@index([loadScore])
}

model BurnoutRiskAssessment {
  id                  String   @id @default(uuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id])
  riskScore           Int      // 0-100
  riskLevel           RiskLevel

  // 6 Contributing Factors
  studyIntensity      Float?   // Hours/day over 14 days
  performanceDecline  Boolean?
  chronicHighLoad     Boolean? // Load >60 for 5+ days
  irregularity        Float?   // Schedule inconsistency
  engagementDecay     Float?   // Engagement trend
  recoveryDeficit     Boolean? // Insufficient rest days

  assessedAt          DateTime @default(now())

  // Relationships
  adjustments         DifficultyAdjustment[]

  @@index([userId])
  @@index([riskLevel])
  @@index([assessedAt])
}

enum RiskLevel {
  LOW      // <25
  MEDIUM   // 25-50
  HIGH     // 50-75
  CRITICAL // >75
}
```

---

## Strategic Indexes (Epic 5 Optimization)

### Performance Impact
- **Query Time:** 800ms → 120ms (85% improvement)
- **Cache Hit Rate:** 65-85%
- **Total Indexes:** 27 (carefully selected)

### Index List

**Behavioral Analytics (7 indexes):**
```sql
-- BehavioralEvent indexes
CREATE INDEX idx_behavioral_event_user_timestamp ON "BehavioralEvent"(user_id, timestamp);
CREATE INDEX idx_behavioral_event_type ON "BehavioralEvent"(event_type);

-- BehavioralPattern indexes
CREATE INDEX idx_behavioral_pattern_user ON "BehavioralPattern"(user_id);
CREATE INDEX idx_behavioral_pattern_confidence ON "BehavioralPattern"(confidence);

-- UserLearningProfile indexes
CREATE INDEX idx_learning_profile_quality ON "UserLearningProfile"(data_quality_score);
CREATE INDEX idx_learning_profile_analyzed ON "UserLearningProfile"(last_analyzed_at);
CREATE INDEX idx_learning_pattern_type ON "LearningPattern"(pattern_type);
```

**Predictions (5 indexes):**
```sql
-- StrugglePrediction indexes
CREATE INDEX idx_struggle_prediction_user ON "StrugglePrediction"(user_id);
CREATE INDEX idx_struggle_prediction_objective ON "StrugglePrediction"(objective_id);
CREATE INDEX idx_struggle_prediction_confidence ON "StrugglePrediction"(confidence);
CREATE INDEX idx_struggle_prediction_time ON "StrugglePrediction"(predicted_at);

-- StruggleIntervention indexes
CREATE INDEX idx_intervention_status ON "StruggleIntervention"(status);
```

**Cognitive Health (4 indexes):**
```sql
-- CognitiveLoadMetric indexes
CREATE INDEX idx_cognitive_load_user_time ON "CognitiveLoadMetric"(user_id, calculated_at);
CREATE INDEX idx_cognitive_load_score ON "CognitiveLoadMetric"(load_score);

-- BurnoutRiskAssessment indexes
CREATE INDEX idx_burnout_risk_user ON "BurnoutRiskAssessment"(user_id);
CREATE INDEX idx_burnout_risk_level ON "BurnoutRiskAssessment"(risk_level);
```

**Personalization (5 indexes):**
```sql
-- PersonalizationConfig indexes
CREATE INDEX idx_personalization_config_user ON "PersonalizationConfig"(user_id);
CREATE INDEX idx_personalization_strategy_user ON "PersonalizationStrategy"(user_id);

-- ABTest indexes
CREATE INDEX idx_ab_test_status ON "ABTest"(status);
CREATE INDEX idx_test_participation_user ON "TestParticipation"(user_id);
CREATE INDEX idx_test_participation_test ON "TestParticipation"(test_id);
```

**Session Orchestration (6 indexes):**
```sql
-- StudyTimeRecommendation indexes
CREATE INDEX idx_time_recommendation_user ON "StudyTimeRecommendation"(user_id);
CREATE INDEX idx_time_recommendation_date ON "StudyTimeRecommendation"(date);

-- ContentSequence indexes
CREATE INDEX idx_content_sequence_session ON "ContentSequence"(session_id);

-- StudyIntensityModulation indexes
CREATE INDEX idx_intensity_modulation_user ON "StudyIntensityModulation"(user_id);
CREATE INDEX idx_intensity_modulation_time ON "StudyIntensityModulation"(modulated_at);

-- SessionPause indexes
CREATE INDEX idx_session_pause_session ON "SessionPause"(session_id);
```

---

## Database Relationships

### Primary Foreign Key Relationships

**User → Many:**
- StudySession (1:N)
- Review (1:N)
- Course (1:N)
- BehavioralEvent (1:N)
- StrugglePrediction (1:N)
- CognitiveLoadMetric (1:N)

**Course → Many:**
- Lecture (1:N)
- LearningObjective (1:N)
- Mission (1:N)

**LearningObjective → Many:**
- ContentChunk (1:N)
- ValidationPrompt (1:N)
- ClinicalScenario (1:N)
- StrugglePrediction (1:N)

**One-to-One Relationships:**
- User ↔ UserLearningProfile
- ContentChunk ↔ Embedding
- ValidationResponse ↔ ComprehensionMetric

---

## pgvector Configuration

### Embedding Specifications

```prisma
model Embedding {
  vector Unsupported("vector(1536)")  // Custom pgvector type

  @@index([vector(ops: raw("vector_cosine_ops"))], type: IVFFlat, name: "embedding_vector_idx")
}
```

**Configuration Details:**
- **Dimensions:** 1536 (Gemini text-embedding-001)
- **Index Type:** IVFFlat (Inverted File Flat)
- **Index Lists:** 100 (optimal for 50K vectors)
- **Distance Metric:** Cosine similarity
- **Performance:** <500ms query time for 50K vectors

**Index Creation:**
```sql
CREATE INDEX embedding_vector_idx
ON "Embedding"
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);
```

See [ADR-005: Gemini Embeddings](./architecture/ADR-005-gemini-embeddings-1536.md)

---

## Migration Strategy

### Current Migration Count
- **Total:** 40+ migrations
- **Epic 3:** ~10 migrations
- **Epic 4:** ~8 migrations
- **Epic 5:** ~15 migrations
- **Core:** ~10 migrations

### Migration Files Location
`apps/web/prisma/migrations/`

### Running Migrations

```bash
# Development (apply migrations)
npx prisma migrate dev

# Production (deploy migrations)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Check migration status
npx prisma migrate status
```

See [DATABASE-MIGRATION-STRATEGY.md](./DATABASE-MIGRATION-STRATEGY.md)

---

## Common Queries

### Get User with Full Profile

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    learningProfile: {
      include: {
        patterns: true,
        predictions: true,
      },
    },
    courses: {
      include: {
        lectures: true,
        objectives: true,
      },
    },
    studySessions: {
      orderBy: { startedAt: 'desc' },
      take: 10,
    },
  },
})
```

### Semantic Search Query

```typescript
const results = await prisma.$queryRaw`
  SELECT
    c.id,
    c.content,
    1 - (e.vector <=> ${queryVector}::vector) as similarity
  FROM "ContentChunk" c
  JOIN "Embedding" e ON e.chunk_id = c.id
  ORDER BY e.vector <=> ${queryVector}::vector
  LIMIT 10
`
```

### Get Recent Predictions with Interventions

```typescript
const predictions = await prisma.strugglePrediction.findMany({
  where: {
    userId,
    confidence: { gte: 0.7 },
  },
  include: {
    objective: true,
    interventions: {
      where: { status: 'PENDING' },
      orderBy: { priority: 'desc' },
    },
  },
  orderBy: { predictedAt: 'desc' },
  take: 5,
})
```

---

## Schema Evolution Best Practices

### Adding New Models

1. **Update Prisma Schema**
   ```prisma
   model NewModel {
     id        String   @id @default(uuid())
     field     String
     createdAt DateTime @default(now())

     @@index([field])
   }
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_new_model
   ```

3. **Update This Documentation**
   - Add model to relevant epic section
   - Document relationships
   - List any indexes

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

---

## Cross-References

### Related Documentation
- [Prisma Schema](../apps/web/prisma/schema.prisma) - Canonical schema
- [API Contracts](./api-contracts.md) - API endpoints using these models
- [Migration Strategy](./DATABASE-MIGRATION-STRATEGY.md) - Migration management
- [ADR-005: Gemini Embeddings](./architecture/ADR-005-gemini-embeddings-1536.md) - pgvector config

### Epic Documentation
- [Epic 3: Semantic Search](./EPIC3-COMPLETION-SUMMARY.md) - Knowledge graph models
- [Epic 4: Understanding Validation](./ARCHITECTURE-DECISION-EPIC4.md) - Validation models
- [Epic 5: Behavioral Twin](./EPIC5-MASTER-SUMMARY.md) - Behavioral models

---

## Database Management Tools

### Prisma Studio (GUI)

```bash
npx prisma studio
# Opens http://localhost:5555
```

Browse and edit database data with GUI.

### psql (CLI)

```bash
psql postgresql://user@localhost:5432/americano

# List all tables
\dt

# Describe table schema
\d+ "User"

# Count records
SELECT COUNT(*) FROM "User";
```

---

## Performance Monitoring

### Database Metrics to Track

- **Query Performance:** P50, P95, P99 response times
- **Index Utilization:** Check unused indexes with `pg_stat_user_indexes`
- **Connection Pool:** Monitor active/idle connections
- **Cache Hit Ratio:** Target 99%+ (PostgreSQL buffer cache)
- **Table Sizes:** Monitor growth with `pg_total_relation_size()`

### Slow Query Analysis

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 200;  -- Log queries >200ms

-- Check slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 200
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

**Last Updated:** 2025-10-23T12:50:00-07:00
**Maintainer:** Database Optimizer
**Review Schedule:** After schema changes or major migrations
