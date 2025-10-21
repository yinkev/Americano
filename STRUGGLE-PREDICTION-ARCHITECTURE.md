# Struggle Prediction API - Architecture Diagrams

## System Architecture

```mermaid
graph TB
    Client[Client Browser/Mobile]
    NextJS[Next.js App Router<br/>TypeScript API Gateway<br/>Port 3000]
    FastAPI[FastAPI ML Service<br/>Python Backend<br/>Port 8000]
    DB[(PostgreSQL<br/>Database)]

    Client -->|HTTPS| NextJS
    NextJS -->|HTTP Proxy<br/>localhost:8000| FastAPI
    FastAPI -->|Prisma ORM| DB

    subgraph "Next.js Layer"
        NextJS
        Auth[Authentication]
        Validation[Input Validation<br/>Zod]
        RateLimit[Rate Limiting]
        Cache[Caching Layer]
    end

    subgraph "FastAPI Layer"
        FastAPI
        MLModel[ML Models<br/>Rule-Based + Logistic Regression]
        FeatureExt[Feature Extraction<br/>15 Features]
        Intervention[Intervention Engine<br/>6 Types]
        Analytics[Analytics Engine<br/>Model Performance]
    end

    NextJS --> Auth
    NextJS --> Validation
    NextJS --> RateLimit
    NextJS --> Cache

    FastAPI --> MLModel
    FastAPI --> FeatureExt
    FastAPI --> Intervention
    FastAPI --> Analytics

    style NextJS fill:#61dafb,stroke:#333,color:#000
    style FastAPI fill:#009688,stroke:#333,color:#fff
    style DB fill:#336791,stroke:#333,color:#fff
```

## API Endpoint Flow

```mermaid
sequenceDiagram
    participant Client
    participant NextJS as Next.js Proxy
    participant FastAPI as FastAPI Service
    participant DB as PostgreSQL
    participant ML as ML Model

    Client->>NextJS: POST /api/analytics/predictions/generate
    NextJS->>NextJS: Validate input (Zod)
    NextJS->>FastAPI: POST /predictions/generate
    FastAPI->>FastAPI: Set 10s timeout
    FastAPI->>DB: Get upcoming objectives
    DB-->>FastAPI: Objectives[]

    loop For each objective
        FastAPI->>ML: Extract features
        ML-->>FastAPI: FeatureVector
        FastAPI->>ML: Predict struggle probability
        ML-->>FastAPI: PredictionResult
        FastAPI->>DB: Create StrugglePrediction
    end

    FastAPI->>DB: Generate interventions (high-risk)
    DB-->>FastAPI: Interventions[]
    FastAPI-->>NextJS: PredictionResponse
    NextJS-->>Client: 201 Created + predictions[]
```

## Feature Extraction Pipeline

```mermaid
graph LR
    A[User ID + Objective ID] --> B[FeatureExtractor]

    B --> C1[Performance Features<br/>retentionScore<br/>reviewLapseRate<br/>sessionPerformanceScore<br/>validationScore]
    B --> C2[Prerequisite Features<br/>prerequisiteGapCount<br/>prerequisiteMasteryGap]
    B --> C3[Complexity Features<br/>contentComplexity<br/>complexityMismatch]
    B --> C4[Behavioral Features<br/>historicalStruggleScore<br/>contentTypeMismatch<br/>cognitiveLoadIndicator]
    B --> C5[Contextual Features<br/>daysUntilExam<br/>daysSinceLastStudy<br/>workloadLevel]

    C1 --> D[Normalize 0-1]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D

    D --> E[FeatureVector<br/>15 features]
    E --> F[Prediction Model<br/>Rule-Based / Logistic Regression]
    F --> G[PredictionResult<br/>probability<br/>confidence<br/>reasoning]

    style A fill:#e1f5ff,stroke:#333
    style E fill:#fff3e0,stroke:#333
    style G fill:#e8f5e9,stroke:#333
```

## Intervention Application Flow

```mermaid
graph TB
    A[User submits feedback<br/>actual_struggle: true] --> B[Update StrugglePrediction<br/>status: CONFIRMED]
    B --> C{probability >= 0.7?}
    C -->|Yes| D[Generate Interventions]
    C -->|No| E[No intervention needed]

    D --> F[InterventionEngine<br/>analyzes feature_vector]

    F --> G1[PREREQUISITE_REVIEW<br/>Insert prereq objectives]
    F --> G2[DIFFICULTY_PROGRESSION<br/>Start with BASIC content]
    F --> G3[COGNITIVE_LOAD_REDUCE<br/>Reduce mission duration 50%]
    F --> G4[SPACED_REPETITION_BOOST<br/>Increase review frequency]
    F --> G5[CONTENT_FORMAT_ADAPT<br/>Add diagrams/scenarios]
    F --> G6[BREAK_SCHEDULE_ADJUST<br/>Pomodoro breaks]

    G1 --> H[Apply to Mission]
    G2 --> H
    G3 --> H
    G4 --> H
    G5 --> H
    G6 --> H

    H --> I[Update Mission JSON<br/>objectives modified]
    I --> J[Mark intervention<br/>status: APPLIED]

    style A fill:#ffebee,stroke:#333
    style D fill:#e3f2fd,stroke:#333
    style H fill:#e8f5e9,stroke:#333
```

## Database Schema Relationships

```mermaid
erDiagram
    USER ||--o{ STRUGGLE_PREDICTION : has
    USER ||--o{ INTERVENTION_RECOMMENDATION : receives
    USER ||--o{ LEARNING_OBJECTIVE : studies
    USER ||--o{ MISSION : has

    LEARNING_OBJECTIVE ||--o{ STRUGGLE_PREDICTION : targets
    LEARNING_OBJECTIVE ||--o{ OBJECTIVE_PREREQUISITE : has

    STRUGGLE_PREDICTION ||--o{ STRUGGLE_INDICATOR : generates
    STRUGGLE_PREDICTION ||--o{ INTERVENTION_RECOMMENDATION : triggers
    STRUGGLE_PREDICTION ||--o{ PREDICTION_FEEDBACK : receives

    INTERVENTION_RECOMMENDATION }o--|| MISSION : "applied to"

    STRUGGLE_PREDICTION {
        string id PK
        string userId FK
        string learningObjectiveId FK
        float predictedStruggleProbability
        float predictionConfidence
        enum predictionStatus
        json featureVector
        boolean actualOutcome
    }

    INTERVENTION_RECOMMENDATION {
        string id PK
        string userId FK
        string predictionId FK
        enum interventionType
        string description
        int priority
        enum status
        string appliedToMissionId FK
    }

    STRUGGLE_INDICATOR {
        string id PK
        string userId FK
        string predictionId FK
        enum indicatorType
        enum severity
        json context
    }
```

## Prediction Model Decision Tree (Rule-Based)

```mermaid
graph TD
    A[Extract Features] --> B{retentionScore < 0.5?}
    B -->|Yes| C[High Risk<br/>+0.2 probability]
    B -->|No| D{prerequisiteGapCount > 0.5?}

    C --> E{complexityMismatch > 0.6?}
    D -->|Yes| F[High Risk<br/>+0.35 probability]
    D -->|No| G{historicalStruggleScore > 0.7?}

    E -->|Yes| H[High Risk<br/>+0.2 probability]
    E -->|No| I[Calculate baseline]
    F --> H
    G -->|Yes| H
    G -->|No| I

    H --> J{Total probability >= 0.7?}
    I --> J

    J -->|Yes| K[HIGH RISK<br/>Generate interventions]
    J -->|No| L{Total probability >= 0.4?}

    L -->|Yes| M[MEDIUM RISK<br/>Monitor closely]
    L -->|No| N[LOW RISK<br/>Normal study plan]

    K --> O[Priority: 9-10<br/>Immediate action]
    M --> P[Priority: 5-8<br/>Proactive support]
    N --> Q[Priority: 1-4<br/>Optional enhancement]

    style K fill:#ffcdd2,stroke:#c62828,color:#000
    style M fill:#fff9c4,stroke:#f57f17,color:#000
    style N fill:#c8e6c9,stroke:#388e3c,color:#000
```

## Error Handling Flow

```mermaid
graph TD
    A[API Request] --> B{Input valid?}
    B -->|No| C[400 Bad Request<br/>Zod validation error]
    B -->|Yes| D{Service available?}

    D -->|No| E[503 Service Unavailable<br/>ML service down]
    D -->|Yes| F{Timeout < 10s?}

    F -->|No| G[504 Gateway Timeout<br/>Operation too slow]
    F -->|Yes| H{Data valid?}

    H -->|No| I[422 Unprocessable Entity<br/>ML service validation]
    H -->|Yes| J{Processing successful?}

    J -->|No| K{Critical error?}
    J -->|Yes| L[200 OK / 201 Created<br/>Return data]

    K -->|Yes| M[500 Internal Server Error<br/>Unexpected exception]
    K -->|No| N{Graceful degradation?}

    N -->|Yes| O[200 OK<br/>Cached/partial data<br/>+ warning]
    N -->|No| M

    style C fill:#ffebee,stroke:#333
    style E fill:#fff3e0,stroke:#333
    style G fill:#fff3e0,stroke:#333
    style I fill:#ffebee,stroke:#333
    style M fill:#ffcdd2,stroke:#333
    style L fill:#e8f5e9,stroke:#333
    style O fill:#fff9c4,stroke:#333
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer<br/>HTTPS]

        subgraph "Vercel"
            NextJS[Next.js App<br/>Edge Functions<br/>ISR]
        end

        subgraph "AWS VPC"
            ALB[Application Load Balancer]

            subgraph "ECS Cluster"
                ML1[FastAPI Instance 1<br/>Fargate Task]
                ML2[FastAPI Instance 2<br/>Fargate Task]
                ML3[FastAPI Instance 3<br/>Fargate Task]
            end

            subgraph "RDS"
                DB[(PostgreSQL<br/>Multi-AZ)]
            end
        end

        subgraph "Monitoring"
            Prometheus[Prometheus]
            Grafana[Grafana<br/>Dashboards]
        end
    end

    LB --> NextJS
    NextJS -->|Private VPC| ALB
    ALB --> ML1
    ALB --> ML2
    ALB --> ML3

    ML1 --> DB
    ML2 --> DB
    ML3 --> DB

    ML1 --> Prometheus
    ML2 --> Prometheus
    ML3 --> Prometheus
    NextJS --> Prometheus

    Prometheus --> Grafana

    style LB fill:#1976d2,stroke:#333,color:#fff
    style NextJS fill:#61dafb,stroke:#333,color:#000
    style ML1 fill:#009688,stroke:#333,color:#fff
    style ML2 fill:#009688,stroke:#333,color:#fff
    style ML3 fill:#009688,stroke:#333,color:#fff
    style DB fill:#336791,stroke:#333,color:#fff
```

## Model Training & Feedback Loop

```mermaid
graph TB
    A[User Studies Topic] --> B{Actual Struggle?}
    B -->|Yes| C[Submit Feedback<br/>actual_struggle: true]
    B -->|No| D[Submit Feedback<br/>actual_struggle: false]

    C --> E[Update Prediction<br/>status: CONFIRMED or MISSED]
    D --> F[Update Prediction<br/>status: FALSE_POSITIVE or TN]

    E --> G[PredictionAccuracyTracker<br/>Calculate metrics]
    F --> G

    G --> H{Enough data?<br/>>50 examples}
    H -->|No| I[Continue collecting]
    H -->|Yes| J[Train Logistic Regression]

    J --> K{Accuracy >= 75%?}
    K -->|Yes| L[Deploy New Model<br/>version++]
    K -->|No| M{Accuracy < baseline?}

    M -->|Yes| N[Model Drift Alert<br/>Keep old model]
    M -->|No| O[Continue training<br/>Need more data]

    L --> P[Update ModelPerformance<br/>Track metrics]
    N --> Q[Analyze error patterns<br/>Adjust features]
    O --> I

    P --> R[User sees improved predictions]
    Q --> J

    style A fill:#e1f5ff,stroke:#333
    style G fill:#fff3e0,stroke:#333
    style L fill:#e8f5e9,stroke:#333
    style N fill:#ffcdd2,stroke:#333
    style R fill:#c8e6c9,stroke:#333
```

---

## Legend

### Node Colors
- **Blue** - Next.js / Client Layer
- **Teal** - FastAPI / ML Service Layer
- **Dark Blue** - Database Layer
- **Red/Pink** - Errors / Alerts
- **Yellow** - Warnings / Medium Priority
- **Green** - Success / Low Risk
- **Orange** - Processing / Validation

### Relationship Types
- **Solid Line** - Synchronous API call
- **Dashed Line** - Asynchronous operation
- **Arrow** - Data flow direction

---

**Report Generated:** 2025-10-17
**Epic:** 5 - Behavioral Twin Engine
**Story:** 5.2 - Predictive Analytics for Learning Struggles
