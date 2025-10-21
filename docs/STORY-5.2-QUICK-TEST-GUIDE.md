# Story 5.2: Quick Test Execution Guide

**Purpose**: Fast-track manual testing of Struggle Prediction system

---

## Quick Start (5 minutes)

### 1. Seed Test Data

```bash
cd /Users/kyin/Projects/Americano-epic5/apps/web
npx tsx scripts/seed-struggle-test-data.ts
```

**Save these IDs from output:**
- Test User ID: `______________________`
- Action Potential Objective ID: `______________________`
- Membrane Transport Prerequisite ID: `______________________`

---

### 2. Test Feature Extraction

```bash
# Start dev server
npm run dev

# In another terminal:
curl -X POST http://localhost:3000/api/test/feature-extraction \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "objectiveId": "YOUR_OBJECTIVE_ID"
  }'
```

**Expected Output:**
```json
{
  "testResult": "PASS",
  "featureVector": {
    "prerequisiteGapCount": 1.0,
    "retentionScore": 0.3,
    "historicalStruggleScore": 0.9,
    "dataQuality": 0.85
  },
  "recommendations": [
    "🚨 CRITICAL: 100% of prerequisites are unmastered..."
  ]
}
```

✅ **Pass Criteria**: All features in [0,1], dataQuality >0.8, 3+ recommendations

---

### 3. Generate Predictions

```bash
curl -X POST http://localhost:3000/api/analytics/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "daysAhead": 7
  }'
```

**Expected:**
- At least 1 prediction created
- Probability >0.7 for action potentials
- 3+ struggle indicators
- 3+ interventions generated

✅ **Pass Criteria**: Response includes predictions array with probability >0.7

---

### 4. View Predictions

```bash
curl -X GET "http://localhost:3000/api/analytics/predictions?minProbability=0.7"
```

**Expected:**
- Predictions sorted by date
- Each prediction includes interventions
- Status: PENDING

---

### 5. Query Interventions

```bash
curl -X GET http://localhost:3000/api/analytics/interventions
```

**Expected:**
- PREREQUISITE_REVIEW (priority: 9)
- DIFFICULTY_PROGRESSION (priority: 8)
- SPACED_REPETITION_BOOST (priority: 6)

✅ **Pass Criteria**: 3+ interventions with proper priorities

---

## Full Test Checklist (2 hours)

### Phase 1: Feature Extraction (15 min)
- [ ] Run feature extraction test
- [ ] Verify all features in [0, 1]
- [ ] Check `prerequisiteGapCount` = 1.0
- [ ] Check `retentionScore` ≈ 0.3
- [ ] Check `historicalStruggleScore` ≈ 0.9
- [ ] Verify extraction time <1 second
- [ ] Document results in `STORY-5.2-TEST-RESULTS.md`

### Phase 2: Prediction Generation (20 min)
- [ ] Generate predictions for user
- [ ] Verify probability >0.7 for action potentials
- [ ] Check confidence >0.75
- [ ] Verify top feature is `prerequisiteGapCount`
- [ ] Confirm 3+ struggle indicators created
- [ ] Confirm prediction stored in database
- [ ] Document results

### Phase 3: Intervention Testing (15 min)
- [ ] Query generated interventions
- [ ] Verify PREREQUISITE_REVIEW exists (priority 9)
- [ ] Verify reasoning field populated
- [ ] Check intervention actions array
- [ ] Test intervention tailoring with learning profile
- [ ] Document results

### Phase 4: Alert System (10 min)
- [ ] Generate alerts via StruggleDetectionEngine
- [ ] Verify alert prioritization formula
- [ ] Check top 3 alerts limit
- [ ] Verify urgent topics ranked higher
- [ ] Document results

### Phase 5: Mission Integration (30 min)
- [ ] Create/find pending mission with action potentials
- [ ] Apply PREREQUISITE_REVIEW intervention
- [ ] Verify prerequisite inserted BEFORE main objective
- [ ] Check mission estimated time adjusted
- [ ] Simulate mission completion (low performance)
- [ ] Verify outcome captured (actualOutcome: TRUE)
- [ ] Verify prediction status: CONFIRMED
- [ ] Document results

### Phase 6: Feedback Loop (15 min)
- [ ] Submit user feedback on prediction
- [ ] Verify PredictionFeedback record created
- [ ] Check prediction status updated
- [ ] Query model performance metrics
- [ ] Document results

### Phase 7: Edge Cases (20 min)
- [ ] Test insufficient data scenario
- [ ] Test user opt-out scenario
- [ ] Test false positive handling
- [ ] Test false negative detection
- [ ] Document results

---

## Expected Test Outcomes Summary

| Test | Expected Result |
|------|----------------|
| Feature Extraction | prerequisiteGapCount: 1.0, retentionScore: 0.3, historicalStruggleScore: 0.9 |
| Prediction Probability | 0.75-0.85 (HIGH) |
| Prediction Confidence | 0.75-0.85 |
| Top Contributing Feature | prerequisiteGapCount (0.35 contribution) |
| Interventions Generated | 3-4 (PREREQUISITE_REVIEW priority 9) |
| Alert Priority | >75/100 for action potentials |
| Mission Modification | Prerequisite inserted before main objective |
| Outcome Capture | actualOutcome: TRUE, status: CONFIRMED |

---

## Troubleshooting

### Feature Extraction Fails
- **Issue**: "Learning objective not found"
- **Fix**: Verify objective ID from seed script output
- **Fix**: Re-run seed script if test data deleted

### Low Prediction Probability
- **Issue**: Probability <0.7 when expected >0.7
- **Fix**: Check feature values in test API output
- **Fix**: Verify test data seeded correctly (6 weeks, 30% retention)

### No Interventions Generated
- **Issue**: Interventions array empty
- **Fix**: Check prediction probability (must be >0.6)
- **Fix**: Verify struggle indicators created

### Database Connection Errors
- **Issue**: "Can't reach database server"
- **Fix**: Ensure PostgreSQL running
- **Fix**: Check DATABASE_URL in `.env`

---

## Quick Database Queries

### View Test User
```sql
SELECT id, email, name FROM users WHERE email = 'kevy@americano.dev';
```

### View Predictions
```sql
SELECT
  id,
  predicted_struggle_probability,
  prediction_confidence,
  prediction_status,
  actual_outcome
FROM struggle_predictions
WHERE user_id = 'YOUR_USER_ID'
ORDER BY prediction_date DESC;
```

### View Struggle Indicators
```sql
SELECT
  indicator_type,
  severity,
  context
FROM struggle_indicators
WHERE user_id = 'YOUR_USER_ID'
ORDER BY detected_at DESC;
```

### View Interventions
```sql
SELECT
  intervention_type,
  priority,
  status,
  description
FROM intervention_recommendations
WHERE user_id = 'YOUR_USER_ID'
ORDER BY priority DESC;
```

### View Performance Metrics
```sql
SELECT
  date,
  retention_score,
  study_time_ms,
  review_count,
  correct_reviews
FROM performance_metrics
WHERE user_id = 'YOUR_USER_ID'
AND learning_objective_id = 'YOUR_OBJECTIVE_ID'
ORDER BY date DESC
LIMIT 10;
```

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test/feature-extraction` | POST | Test feature extraction |
| `/api/analytics/predictions/generate` | POST | Generate predictions |
| `/api/analytics/predictions` | GET | List predictions |
| `/api/analytics/interventions` | GET | List interventions |
| `/api/analytics/interventions/:id/apply` | POST | Apply intervention |
| `/api/analytics/predictions/:id/feedback` | POST | Submit feedback |
| `/api/analytics/model-performance` | GET | Model metrics |
| `/api/analytics/struggle-reduction` | GET | Success metrics |

---

## Test Data Profile

**User**: kevy@americano.dev
- **Study History**: 6 weeks (42 days)
- **Strong Area**: Anatomy (85% retention, MASTERED)
- **Weak Area**: Physiology (30% retention, BEGINNER)
- **Missing Prerequisite**: Cell membrane transport
- **Target Objective**: Action potentials (requires membrane transport)
- **Expected Prediction**: 83% struggle probability

**Feature Values**:
- `prerequisiteGapCount`: 1.0 (100% missing)
- `retentionScore`: 0.3 (30% retention)
- `historicalStruggleScore`: 0.9 (high confidence pattern)
- `complexityMismatch`: 0.65 (ADVANCED vs BEGINNER)
- `reviewLapseRate`: 0.70 (70% failures)
- `dataQuality`: 0.85 (high quality)

---

## Success Criteria Summary

**Story 5.2 is complete when:**

1. ✅ Test data seeded with known patterns
2. ✅ Feature extraction produces expected values (all normalized 0-1)
3. ✅ Prediction model generates high probability (>0.7) for target
4. ✅ 3+ interventions created with proper priorities
5. ✅ Alert system prioritizes urgent topics correctly
6. ✅ Mission integration inserts prerequisites before main objective
7. ✅ Outcome capture updates predictions correctly
8. ✅ Feedback loop records user input

**MVP Completion**: All API functionality working, test results documented

**Post-MVP**: UI components, automated retraining, logistic regression model

---

**Document Version**: 1.0
**Created**: 2025-10-16
**Purpose**: Rapid manual testing guide for Story 5.2
