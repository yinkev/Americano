# Cognitive Load Monitoring Database Schema Proposal
## Story 5.4: Research-Grade Cognitive Load Monitoring

### **Status:** Awaiting Database Architect Review
### **Date:** 2025-10-17
### **Theoretical Foundation:** Cognitive Load Theory (Sweller, 2011)

---

## Required Prisma Models

### 1. CognitiveLoadMetric Model

```prisma
model CognitiveLoadMetric {
  id                  String              @id @default(cuid())
  userId              String
  sessionId           String

  // Core metrics (0-100 scale)
  loadScore           Float               // Composite cognitive load score
  intrinsicLoad       Float?              // Content complexity component
  extraneousLoad      Float?              // Interface/presentation component
  germaneLoad         Float?              // Learning-related processing component

  // Stress indicators (JSON array of StressIndicator objects)
  stressIndicators    Json                // [{type, severity, value, contribution}]

  // Confidence and quality
  confidenceLevel     Float               // 0.0-1.0 based on data quality
  dataQuality         Float?              // 0.0-1.0 input data completeness

  // Risk assessment
  overloadDetected    Boolean             @default(false)
  overloadRiskLevel   String?             // LOW, MEDIUM, HIGH, CRITICAL

  // Recommendations generated
  recommendations     Json?               // Array of recommendation strings

  // Timestamps
  timestamp           DateTime            @default(now())
  calculatedAt        DateTime            @default(now())

  // Relations
  session             StudySession        @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sessionId])
  @@index([timestamp])
  @@index([userId, timestamp])
  @@index([overloadDetected])
  @@map("cognitive_load_metrics")
}
```

### 2. Update StudySession Model

Add relation to CognitiveLoadMetric:

```prisma
model StudySession {
  // ... existing fields ...

  cognitiveLoadMetrics CognitiveLoadMetric[]

  // ... existing relations ...
}
```

### 3. Update BehavioralEvent Model (Optional Enhancement)

Add cognitive load context fields:

```prisma
model BehavioralEvent {
  // ... existing fields ...

  // Cognitive load context (optional)
  cognitiveLoadScore    Float?             // Snapshot of load at event time
  stressIndicators      Json?              // Stress indicators at event time
  overloadDetected      Boolean?           // Was overload detected?

  // ... existing indexes ...
}
```

---

## Data Types & Enums

### StressIndicator Type (stored as JSON)

```typescript
interface StressIndicator {
  type: 'RESPONSE_LATENCY' | 'ERROR_RATE' | 'ENGAGEMENT_DROP' |
        'PERFORMANCE_DECLINE' | 'DURATION_STRESS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  value: number
  contribution: number  // Contribution to total load (0-100)
}
```

### Load Level Calculation

- **LOW**: loadScore < 40
- **MODERATE**: 40 ≤ loadScore < 60
- **HIGH**: 60 ≤ loadScore < 80
- **CRITICAL**: loadScore ≥ 80

---

## Cognitive Load Theory Foundation

### Three-Factor Model (Sweller, 2011)

1. **Intrinsic Load** (content complexity)
   - Inherent difficulty of learning material
   - Based on element interactivity and prior knowledge
   - NOT directly modifiable by instructional design

2. **Extraneous Load** (interface/presentation)
   - Load imposed by instructional presentation
   - Can be reduced through better design
   - Examples: unclear navigation, poor formatting

3. **Germane Load** (learning-related processing)
   - Cognitive effort devoted to schema construction
   - Desirable load that promotes learning
   - Should be maximized within working memory limits

### 5-Factor Behavioral Implementation

Our implementation uses 5 behavioral proxies:

1. **Response Latency** (30% weight) → Intrinsic + Extraneous load proxy
2. **Error Rate** (25% weight) → Intrinsic load proxy
3. **Engagement Drop** (20% weight) → Extraneous load proxy
4. **Performance Decline** (15% weight) → Germane load proxy
5. **Duration Stress** (10% weight) → Overall fatigue proxy

**Weighted Formula:**
```
loadScore = (responseLatency × 0.30) + (errorRate × 0.25) +
            (engagementDrop × 0.20) + (performanceDecline × 0.15) +
            (durationStress × 0.10)
```

---

## Performance Requirements

- **Calculation Time:** < 100ms (real-time monitoring)
- **Storage:** Time-series data for trend analysis
- **Retention:** 90 days for historical patterns
- **Indexing:** Optimized for userId + timestamp queries

---

## API Endpoints Dependent on Schema

1. `POST /api/analytics/cognitive-load/calculate`
   - Calculates and stores CognitiveLoadMetric
   - Returns real-time cognitive load assessment

2. `GET /api/analytics/cognitive-load/current`
   - Retrieves most recent CognitiveLoadMetric for user
   - Includes trend analysis (compare to previous)

3. `GET /api/analytics/cognitive-load/history`
   - Time-series data for visualization
   - Date range filtering
   - Summary statistics

---

## Migration Strategy

1. Add CognitiveLoadMetric model to schema.prisma
2. Add StudySession relation
3. Optionally update BehavioralEvent for context
4. Run Prisma migration: `npx prisma migrate dev --name add-cognitive-load-metrics`
5. Generate Prisma client: `npx prisma generate`
6. Update route implementations

---

## Research References

- Sweller, J. (2011). Cognitive load theory. *Psychology of Learning and Motivation*, 55, 37-76.
- Paas, F., & Van Merriënboer, J. J. (2020). Cognitive-load theory: Methods to manage working memory load in the learning of complex tasks. *Current Directions in Psychological Science*, 29(4), 394-398.
- Chandler, P., & Sweller, J. (1991). Cognitive load theory and the format of instruction. *Cognition and Instruction*, 8(4), 293-332.

---

## Next Steps

1. **Database Architect Review** - Validate schema design
2. **Performance Testing** - Ensure < 100ms calculation time
3. **Migration Execution** - Add models to production schema
4. **Route Implementation** - Complete API endpoints
5. **Frontend Integration** - Real-time cognitive load display

---

**Awaiting Approval:** This schema requires database-architect review before implementation.
