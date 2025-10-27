# Research Analytics System - Implementation Guide

**Version:** 1.0
**Date:** 2025-10-26
**Status:** In Progress
**Related ADR:** [ADR-006: Research-Grade Analytics System](./architecture/ADR-006-research-grade-analytics-system.md)

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema Changes](#database-schema-changes)
4. [Python Analytics Stack](#python-analytics-stack)
5. [Implementation Timeline](#implementation-timeline)
6. [API Endpoints](#api-endpoints)
7. [Frontend Integration](#frontend-integration)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)

---

## Overview

This guide documents the implementation of a world-class research-grade analytics system for Americano. The system enables:

- **N=1 Self-Experimentation:** ABAB designs, randomization tests, change point detection
- **Causal Inference:** Bayesian ITS, synthetic control, Granger causality
- **Publication Quality:** CENT/SPIRIT compliance, reproducible pipelines
- **Quantified Self:** Wearables integration (Oura, WHOOP, Apple Health)

### Why This Matters

Third-party analytics (Vercel, Google, Mixpanel) provide consumer-grade metrics:
- "Page views" and "bounce rates" (meaningless without context)
- No causal inference (correlation ≠ causation)
- No n=1 experimental design support
- Vendor lock-in and privacy concerns

Our custom system provides:
- **Statistical rigor:** p-values, effect sizes, credible intervals
- **Causal claims:** Bayesian counterfactuals prove causation
- **Full control:** Private data, custom methods, no limitations
- **Research-ready:** Publishable in academic journals

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  - React components tracking events                          │
│  - Real-time dashboards (ITS, ABAB, drift)                  │
│  - Experiment protocol UI (CENT compliance)                  │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Next.js + FastAPI)              │
│  - Next.js API routes (proxy to Python)                      │
│  - FastAPI endpoints (Bayesian ITS, SCED tests)             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (PostgreSQL + DuckDB)                │
│  - OLTP: PostgreSQL with RLS (source of truth)              │
│  - OLAP: DuckDB/MotherDuck (fast analytics)                 │
│  - Transform: dbt (documented SQL pipelines)                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│            Analytics Engine (Python + PyMC)                  │
│  - Bayesian ITS (CausalPy)                                  │
│  - ABAB randomization tests                                 │
│  - Change point detection (ruptures)                        │
│  - Drift monitoring (Evidently)                             │
└─────────────────────────────────────────────────────────────┘
```

### Separation of Concerns

**OLTP (PostgreSQL):**
- Transactional workloads (inserts, updates, deletes)
- Source of truth for all data
- Row-Level Security (RLS) for future multi-tenant
- Fast writes, slower complex queries

**OLAP (DuckDB/MotherDuck):**
- Analytical workloads (aggregations, time-series, joins)
- Read-only, synced from PostgreSQL nightly
- Columnar storage (Parquet) = 10-100x faster
- Local dev (DuckDB), cloud prod (MotherDuck)

**Why Separate?**
- Prevents analytics queries from slowing down app
- Optimizes each database for its workload
- Enables parallel scaling (more read replicas for analytics)

---

## Database Schema Changes

### New Models (Prisma)

#### 1. ExperimentProtocol - CENT/SPIRIT Compliance

```prisma
model ExperimentProtocol {
  id                String   @id @default(cuid())
  userId            String
  protocolName      String   // e.g., "Reward Probability 15% vs 20%"
  hypothesis        String   // Pre-registered hypothesis
  startDate         DateTime
  endDate           DateTime?

  // CENT compliance fields
  designType        ExperimentDesignType // ABAB, MULTIPLE_BASELINE, etc.
  primaryOutcome    String   // e.g., "engagement_score"
  sampleSizeTarget  Int      // Planned number of observations
  analysisPlan      String   // Pre-registered analysis method

  // Protocol deviations
  deviations        Json[]   // Log any changes from original plan

  // CONSORT flow diagram data
  screened          Int?
  eligible          Int?
  enrolled          Int?
  completed         Int?

  // Relationships
  user              User     @relation(fields: [userId], references: [id])
  phases            PhaseAssignment[]
  analysisRuns      AnalysisRun[]

  @@index([userId])
  @@index([startDate])
  @@map("experiment_protocols")
}

enum ExperimentDesignType {
  ABAB              // Reversal design
  MULTIPLE_BASELINE // Staggered interventions
  ALTERNATING       // Rapid alternation
  CHANGING_CRITERION // Progressive target changes
}
```

**Purpose:** Pre-register experiments per CENT/SPIRIT standards. Prevents p-hacking and enables publication.

#### 2. PhaseAssignment - SCED Experiment Tracking

```prisma
model PhaseAssignment {
  id                  String   @id @default(cuid())
  protocolId          String
  phaseLabel          String   // "baseline_1", "intervention_A_1", etc.
  phaseType           PhaseType
  startDate           DateTime
  endDate             DateTime?
  plannedDuration     Int      // Days (randomized for ABAB)
  randomizationSeed   Int      // For reproducibility

  // Intervention details
  interventionParams  Json     // e.g., { "reward_probability": 0.20 }

  // Relationships
  protocol            ExperimentProtocol @relation(fields: [protocolId], references: [id])

  @@index([protocolId])
  @@index([startDate])
  @@map("phase_assignments")
}

enum PhaseType {
  BASELINE
  INTERVENTION_A
  INTERVENTION_B
  WASHOUT         // Period between phases to eliminate carry-over
}
```

**Purpose:** Track ABAB phase assignments with randomized lengths. Critical for SCED rigor.

#### 3. ContextMetadata - Normalized Context Tables

```prisma
model ContextMetadata {
  id                String   @id @default(cuid())
  userId            String
  timestamp         DateTime @default(now())

  // Self-reported context
  mood              MoodLevel
  energyLevel       Int      @default(5) // 1-10 scale
  location          LocationType
  notes             String?  // Free-text reflections

  // Physiological context (from wearables)
  sleepHours        Float?   // From Oura/WHOOP
  sleepQuality      Int?     // 1-10 scale or % REM
  hrvScore          Int?     // Heart Rate Variability
  restingHeartRate  Int?
  activityStrain    Float?   // WHOOP strain score

  // Relationships
  user              User     @relation(fields: [userId], references: [id])

  @@index([userId, timestamp])
  @@map("context_metadata")
}

enum MoodLevel {
  LOW
  MEDIUM
  HIGH
}

enum LocationType {
  HOME
  LIBRARY
  CAFE
  CAMPUS
  OTHER
}
```

**Purpose:** Capture context for multi-modal analysis. Correlate study behavior with physiological state.

#### 4. AnalysisRun - Full Provenance Tracking

```prisma
model AnalysisRun {
  id                String   @id @default(cuid())
  protocolId        String
  runName           String   // e.g., "Bayesian ITS - Reward Change"
  analysisType      String   // "bayesian_its", "abab_randomization", etc.

  // Provenance
  codeCommitHash    String   // Git commit that ran this analysis
  dataVersionHash   String   // DVC hash of input data
  inputParams       Json     // Parameters passed to analysis

  // Outputs
  mlflowRunId       String?  // MLflow experiment tracking ID
  artifactPaths     String[] // Paths to figures, tables, reports

  // Results summary
  resultsSummary    Json     // Key findings (p-values, effect sizes, etc.)

  // Timestamps
  startedAt         DateTime @default(now())
  completedAt       DateTime?

  // Relationships
  protocol          ExperimentProtocol @relation(fields: [protocolId], references: [id])

  @@index([protocolId])
  @@index([startedAt])
  @@map("analysis_runs")
}
```

**Purpose:** Full reproducibility. Every analysis links to exact code + data version. Publication requirement.

### Enhanced BehavioralEvent Model

```prisma
model BehavioralEvent {
  id                      String             @id @default(cuid())
  userId                  String
  eventType               EventType
  eventData               Json
  timestamp               DateTime           @default(now())

  // Existing fields (keep as-is)
  completionQuality       CompletionQuality?
  contentType             String?
  dayOfWeek               Int?
  difficultyLevel         String?
  engagementLevel         EngagementLevel?
  sessionPerformanceScore Int?
  timeOfDay               Int?

  // NEW: Experiment tracking
  experimentPhase         String?  // References PhaseAssignment.phaseLabel
  randomizationSeed       Int?     // For SCED phase length randomization

  // NEW: Context linking
  contextMetadataId       String?
  contextMetadata         ContextMetadata? @relation(fields: [contextMetadataId], references: [id])

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@index([userId, eventType, timestamp])
  @@index([userId, dayOfWeek])
  @@index([userId, timeOfDay])
  @@index([experimentPhase]) // NEW: Filter by experiment phase
  @@map("behavioral_events")
}
```

**Changes:**
1. `experimentPhase` - Links events to ABAB phases ("baseline_1", "intervention_A_1")
2. `randomizationSeed` - Ensures SCED phase randomization is reproducible
3. `contextMetadataId` - Links to self-reported + physiological context

---

## Python Analytics Stack

### Core Dependencies

```bash
# Bayesian Inference
pymc==5.10.0              # MCMC sampling
arviz==0.17.0             # Posterior diagnostics
bambi==0.13.0             # Mixed-effects formula modeling

# Causal Inference
causalpy==0.2.0           # Bayesian ITS with PyMC
dowhy==0.11               # Graphical causal models
econml==0.15.0            # Heterogeneous treatment effects
orbit-ml==1.1.4           # Bayesian structural time-series

# Time-Series Analysis
statsmodels==0.14.1       # Classical TS methods
prophet==1.1.5            # Facebook forecasting
ruptures==1.1.9           # Change point detection
sktime==0.26.0            # Unified TS interface

# Data Quality
pandera==0.18.0           # DataFrame schema validation
evidently==0.4.13         # Drift detection dashboards

# Reproducibility
mlflow==2.10.0            # Experiment tracking
dvc==3.40.0               # Data versioning
dagster==1.6.0            # Pipeline orchestration
papermill==2.5.0          # Parameterized notebooks

# Utilities
pandas==2.2.0
polars==0.20.0            # Fast alternative to pandas
numpy==1.26.0
scipy==1.12.0
scikit-learn==1.4.0
```

### Package Justifications

**Why PyMC over Stan/JAGS?**
- Modern Python API (not separate language)
- Excellent documentation and community
- ArviZ integration for diagnostics
- Fast sampling (NUTS algorithm)

**Why CausalPy over CausalImpact?**
- Native PyMC integration (same ecosystem)
- Actively maintained (CausalImpact port is stale)
- Better documentation for ITS

**Why Dagster over Airflow?**
- Software-defined assets (not just tasks)
- Built-in lineage and data quality checks
- Modern Python API (type hints, Pydantic)
- Better local development experience

**Why DuckDB over ClickHouse/BigQuery?**
- Embedded database (no server to manage)
- Works offline (critical for research)
- Parquet-native (modern analytics format)
- Free and open-source

---

## Implementation Timeline

### Week 1: Foundation (Days 1-5)

**Day 1:** Schema Changes
- [ ] Write Prisma migrations for 4 new models
- [ ] Add fields to BehavioralEvent
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Generate TypeScript types: `npx prisma generate`

**Day 2:** Row-Level Security (RLS)
- [ ] Write PostgreSQL RLS policies
- [ ] Test RLS with multiple user contexts
- [ ] Document RLS configuration for future

**Day 3:** Data Versioning (DVC)
- [ ] Initialize DVC: `dvc init`
- [ ] Create export script: PostgreSQL → Parquet
- [ ] Track Parquet files: `dvc add data/events.parquet`
- [ ] Configure remote storage (S3 or local)

**Day 4:** Quality Gates (Pandera)
- [ ] Define Pandera schemas for all dataframes
- [ ] Add validation to Python API endpoints
- [ ] Create tests for schema validation

**Day 5:** Experiment Tracking (MLflow)
- [ ] Set up MLflow server: `mlflow server`
- [ ] Configure artifact storage
- [ ] Test logging: parameters, metrics, artifacts

### Week 2: Analytics (Days 6-10)

**Day 6:** Bayesian ITS - Core Implementation
- [ ] Install: `pip install causalpy pymc arviz`
- [ ] Create endpoint: `/analytics/research/bayesian-its`
- [ ] Test with synthetic data (known effect size)

**Day 7:** Bayesian ITS - Visualization
- [ ] Build React dashboard for ITS results
- [ ] Show posterior distributions (ArviZ plots)
- [ ] Display credible intervals + counterfactual

**Day 8:** SCED Randomization Tests
- [ ] Implement ABAB randomization function
- [ ] Run 10,000 permutation tests
- [ ] Report p-value + effect size (Cohen's d)

**Day 9:** Sequential Analysis
- [ ] Implement O'Brien-Fleming alpha-spending
- [ ] Calculate stopping boundaries
- [ ] Add UI warnings about peeking

**Day 10:** Wearables Integration
- [ ] OAuth flows for Oura + WHOOP
- [ ] Daily sync job (Dagster)
- [ ] Correlation analysis endpoint

---

## API Endpoints

### 1. Bayesian Interrupted Time Series

**Endpoint:** `POST /api/analytics/research/bayesian-its`

**Purpose:** Estimate causal effect of an intervention using Bayesian methods.

**Request Body:**
```typescript
interface BayesianITSRequest {
  userId: string
  metric: string           // "engagement_score", "streak_days", etc.
  interventionDate: string // ISO 8601 date when intervention started
  prePeriodDays: number    // Days before intervention to use as baseline
  postPeriodDays: number   // Days after intervention to analyze
  priorParams?: {          // Optional: specify prior beliefs
    effectMean: number
    effectSd: number
  }
}
```

**Response:**
```typescript
interface BayesianITSResponse {
  causalEffect: {
    mean: number           // Posterior mean of causal effect
    sd: number             // Posterior standard deviation
    hdi95: [number, number] // 95% Highest Density Interval (credible interval)
    probability_positive: number // P(effect > 0)
  }
  counterfactual: {
    dates: string[]
    predicted: number[]    // What would have happened without intervention
    observed: number[]     // What actually happened
    lower95: number[]      // Lower bound of 95% credible interval
    upper95: number[]      // Upper bound of 95% credible interval
  }
  diagnostics: {
    rhat: number           // < 1.01 is good (convergence check)
    ess_bulk: number       // > 400 is good (effective sample size)
    ess_tail: number       // > 400 is good
  }
  interpretation: string   // Plain English summary
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/analytics/research/bayesian-its \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "kevy@americano.dev",
    "metric": "engagement_score",
    "interventionDate": "2025-10-15",
    "prePeriodDays": 30,
    "postPeriodDays": 14
  }'
```

### 2. ABAB Randomization Test

**Endpoint:** `POST /api/analytics/research/abab-randomization-test`

**Purpose:** Test if difference between A and B phases is statistically significant using randomization tests.

**Request Body:**
```typescript
interface ABABRandomizationTestRequest {
  userId: string
  protocolId: string      // References ExperimentProtocol
  metric: string
  nPermutations: number   // Default: 10,000
}
```

**Response:**
```typescript
interface ABABRandomizationTestResponse {
  observedEffect: number          // Actual difference between A and B phases
  pValue: number                  // Probability of seeing this effect by chance
  effectSize: number              // Cohen's d (standardized effect size)
  interpretation: string          // "Significant effect (p < 0.05)" or not
  permutationDistribution: number[] // For visualization
  passesSCEDStandards: boolean    // What Works Clearinghouse criteria
}
```

### 3. Change Point Detection

**Endpoint:** `POST /api/analytics/research/change-points`

**Purpose:** Detect when behavior shifted (useful when intervention date is unclear).

**Request Body:**
```typescript
interface ChangePointRequest {
  userId: string
  metric: string
  startDate: string
  endDate: string
  minSegmentLength: number // Default: 7 days
}
```

**Response:**
```typescript
interface ChangePointResponse {
  changePoints: {
    date: string
    confidence: number    // 0-1 (higher = more confident)
    beforeMean: number
    afterMean: number
    percentChange: number
  }[]
  algorithm: string      // "PELT", "Binary Segmentation", etc.
}
```

### 4. Sequential Analysis Boundaries

**Endpoint:** `POST /api/analytics/research/sequential-boundaries`

**Purpose:** Calculate when to stop an A/B test with continuous monitoring.

**Request Body:**
```typescript
interface SequentialBoundariesRequest {
  alphaLevel: number         // 0.05 for 95% confidence
  spendingFunction: string   // "obrien_fleming", "pocock"
  maxN: number               // Maximum sample size
  nInterimAnalyses: number   // How many times you'll check
}
```

**Response:**
```typescript
interface SequentialBoundariesResponse {
  boundaries: {
    n: number              // Sample size at this check
    criticalValue: number  // Z-score threshold to reject null
    alphaSpent: number     // Cumulative alpha spent so far
  }[]
  warning: string          // "Don't peek without using these boundaries!"
}
```

---

## Frontend Integration

### 1. Experiment Protocol Creator

**Component:** `src/components/research/ExperimentProtocolForm.tsx`

**Purpose:** Pre-register experiments per CENT/SPIRIT standards.

```typescript
interface ExperimentProtocolFormData {
  protocolName: string
  hypothesis: string
  designType: 'ABAB' | 'MULTIPLE_BASELINE' | 'ALTERNATING'
  primaryOutcome: string
  sampleSizeTarget: number
  analysisPlan: string
}

export function ExperimentProtocolForm() {
  const form = useForm<ExperimentProtocolFormData>()

  const onSubmit = async (data: ExperimentProtocolFormData) => {
    // Create ExperimentProtocol record
    await fetch('/api/research/protocols', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  return (
    <Form {...form}>
      <FormField name="protocolName" label="Experiment Name" />
      <FormField name="hypothesis" label="Hypothesis"
        description="What do you expect to happen? (Pre-register before seeing data)" />
      <FormField name="designType" label="Design Type"
        options={['ABAB', 'MULTIPLE_BASELINE']} />
      {/* ... */}
    </Form>
  )
}
```

### 2. Bayesian ITS Dashboard

**Component:** `src/components/research/BayesianITSDashboard.tsx`

```typescript
export function BayesianITSDashboard({ protocolId }: { protocolId: string }) {
  const { data } = useQuery(['bayesian-its', protocolId], async () => {
    const res = await fetch(`/api/analytics/research/bayesian-its`, {
      method: 'POST',
      body: JSON.stringify({ protocolId }),
    })
    return res.json()
  })

  return (
    <div>
      <h2>Causal Effect Estimate</h2>
      <p>Mean: {data.causalEffect.mean.toFixed(2)}</p>
      <p>95% Credible Interval: [{data.causalEffect.hdi95[0]}, {data.causalEffect.hdi95[1]}]</p>

      <h3>Counterfactual Plot</h3>
      <LineChart>
        <Line data={data.counterfactual.observed} name="Observed" />
        <Line data={data.counterfactual.predicted} name="Counterfactual" dash />
        <Area data={data.counterfactual.lower95, data.counterfactual.upper95}
              name="95% Credible Interval" opacity={0.2} />
      </LineChart>

      <Alert>
        <p>{data.interpretation}</p>
      </Alert>
    </div>
  )
}
```

### 3. Context Capture Widget

**Component:** `src/components/research/ContextCaptureWidget.tsx`

**Purpose:** Quick self-report of mood, energy, location after study sessions.

```typescript
export function ContextCaptureWidget() {
  const [mood, setMood] = useState<MoodLevel>('MEDIUM')
  const [energy, setEnergy] = useState(5)
  const [location, setLocation] = useState<LocationType>('HOME')
  const [notes, setNotes] = useState('')

  const saveContext = async () => {
    await fetch('/api/context-metadata', {
      method: 'POST',
      body: JSON.stringify({ mood, energy, location, notes }),
    })
  }

  return (
    <Card>
      <h3>How are you feeling?</h3>
      <MoodSelector value={mood} onChange={setMood} />
      <EnergySlider value={energy} onChange={setEnergy} min={1} max={10} />
      <LocationDropdown value={location} onChange={setLocation} />
      <TextArea placeholder="Any notes about this session?"
                value={notes} onChange={setNotes} />
      <Button onClick={saveContext}>Save</Button>
    </Card>
  )
}
```

---

## Testing Strategy

### Unit Tests (Python)

**Test Bayesian ITS with Synthetic Data:**

```python
# tests/test_bayesian_its.py
import numpy as np
from analytics.bayesian_its import run_bayesian_its

def test_bayesian_its_detects_positive_effect():
    """Test that ITS detects a known positive effect."""
    # Generate synthetic data with known effect
    n_pre = 30
    n_post = 14
    pre_data = np.random.normal(50, 10, n_pre)  # Mean = 50
    post_data = np.random.normal(70, 10, n_post) # Mean = 70 (effect = +20)

    result = run_bayesian_its(
        pre_data=pre_data,
        post_data=post_data,
        intervention_date="2025-10-15"
    )

    # Assert we detect the positive effect
    assert result.causal_effect.mean > 15  # Should be close to +20
    assert result.causal_effect.hdi95[0] > 0  # Lower bound should be positive
    assert result.causal_effect.probability_positive > 0.95  # Very confident
```

**Test ABAB Randomization:**

```python
def test_abab_randomization_with_null_effect():
    """Test that randomization test has correct Type I error rate."""
    # Generate data with NO real difference between A and B
    a_phases = np.random.normal(50, 10, 40)
    b_phases = np.random.normal(50, 10, 40)

    result = abab_randomization_test(
        a_data=a_phases,
        b_data=b_phases,
        n_permutations=10000
    )

    # With no effect, p-value should be > 0.05 most of the time
    assert result.p_value > 0.05
```

### Integration Tests (TypeScript)

**Test API Endpoint:**

```typescript
// __tests__/integration/api/bayesian-its.test.ts
import { POST } from '@/app/api/analytics/research/bayesian-its/route'

describe('Bayesian ITS API', () => {
  it('should return causal effect estimate', async () => {
    const request = new Request('http://localhost:3000/api/analytics/research/bayesian-its', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-user',
        metric: 'engagement_score',
        interventionDate: '2025-10-15',
        prePeriodDays: 30,
        postPeriodDays: 14,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.causalEffect).toHaveProperty('mean')
    expect(data.causalEffect).toHaveProperty('hdi95')
    expect(data.counterfactual).toHaveProperty('observed')
  })
})
```

---

## Deployment

### Environment Variables

```bash
# .env.production

# PostgreSQL (OLTP)
DATABASE_URL=postgresql://user:pass@localhost:5432/americano

# DuckDB/MotherDuck (OLAP)
MOTHERDUCK_TOKEN=your_token_here
MOTHERDUCK_DATABASE=americano_analytics

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_S3_ENDPOINT_URL=https://s3.amazonaws.com

# DVC
DVC_REMOTE=s3://americano-data-versions

# Wearables APIs
OURA_CLIENT_ID=your_oura_client_id
OURA_CLIENT_SECRET=your_oura_secret
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_secret

# Feature Flags
ENABLE_RESEARCH_ANALYTICS=true
ENABLE_WEARABLES_SYNC=false  # Enable after testing
```

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: americano
      POSTGRES_USER: kyin
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.10.0
    ports:
      - "5000:5000"
    command: mlflow server --host 0.0.0.0 --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./artifacts
    volumes:
      - mlflow_data:/mlflow

volumes:
  postgres_data:
  mlflow_data:
```

---

## Next Steps

**Day 1-2: Start Here**
1. Review this guide and ADR-006
2. Create Prisma migrations for new models
3. Test migrations locally
4. Enable PostgreSQL RLS policies

**Questions? Refer to:**
- [ADR-006](./architecture/ADR-006-research-grade-analytics-system.md) - Architecture decisions
- [Codex Consultation](../sessions/transcripts/2025-10-26-codex-consultation.md) - Detailed feedback
- [CENT 2015 Guidelines](https://pubmed.ncbi.nlm.nih.gov/26272792/) - N-of-1 reporting standards

**Contributors:**
- Kevy - Product owner, developer
- Claude (Sonnet 4.5) - Implementation assistant
- Codex MCP - Architecture consultant

**Last Updated:** 2025-10-26
