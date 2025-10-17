# Task 8 Implementation Complete: Metacognitive Intervention Engine

**Story:** 4.4 - Confidence Calibration and Metacognitive Assessment
**Task:** Task 8 - Metacognitive Intervention Engine
**Status:**  COMPLETE
**Date:** 2025-10-17

---

## Overview

Successfully implemented a complete **Metacognitive Intervention Engine** that helps medical students develop accurate self-assessment skills by detecting poor confidence calibration patterns and providing personalized interventions.

### What Was Built

1. **MetacognitiveInterventionEngine** - Core intervention logic
2. **InterventionDialog** - UI component for displaying interventions
3. **API Endpoints** - REST endpoints for checking and tracking interventions
4. **Comprehensive Tests** - Vitest test suite with 10+ test cases

---

## Core Features

### 1. Calibration Health Monitoring

**File:** `/apps/web/src/lib/metacognitive-interventions.ts`

```typescript
const healthCheck = await MetacognitiveInterventionEngine.checkCalibrationHealth(userId);
```

**What it does:**
- Analyzes last 10+ validation assessments with confidence data
- Calculates Pearson correlation coefficient (r) between confidence and performance
- Triggers intervention when r < 0.5 (poor calibration)
- Enforces 7-day cooldown period between interventions
- Detects pattern type: OVERCONFIDENCE, UNDERCONFIDENCE, or GENERAL

### 2. Pattern Detection

**Overconfidence Pattern (Dunning-Kruger Effect):**
- Consistently high confidence (4-5 / 5)
- Low actual scores (40-60%)
- Average delta > 10 points

**Underconfidence Pattern (Imposter Syndrome):**
- Consistently low confidence (1-2 / 5)
- High actual scores (70-90%)
- Average delta < -10 points

**General Calibration Issues:**
- Mixed patterns with no consistent trend
- Correlation too low but no clear direction

### 3. Personalized Recommendations

**File:** `/apps/web/src/lib/metacognitive-interventions.ts`

```typescript
const recommendation = await MetacognitiveInterventionEngine.generateInterventionRecommendations(
  userId,
  interventionType
);
```

**Each recommendation includes:**
- Main intervention message (tailored to pattern)
- 5+ specific actionable recommendations
- Educational content about metacognition (150+ words)
- Example assessments showing the pattern (up to 3 recent)
- Dismissal tracking for effectiveness measurement

### 4. Intervention Dialog UI

**File:** `/apps/web/src/components/study/InterventionDialog.tsx`

**Features:**
- Glassmorphism design (bg-white/95 backdrop-blur-xl)
- OKLCH color-coded by intervention type
- Recent example assessments with deltas
- Expandable educational content
- Dismiss and Learn More buttons (44px touch targets)
- Full ARIA support and keyboard navigation

**Usage:**
```typescript
import { useInterventionDialog } from '@/components/study/InterventionDialog';

const intervention = useInterventionDialog();

// Check and show intervention
const healthCheck = await fetch('/api/calibration/intervention-check', {
  method: 'POST',
  body: JSON.stringify({ userId })
});

if (healthCheck.needsIntervention) {
  intervention.show(healthCheck.recommendation);
}
```

---

## API Endpoints

### POST /api/calibration/intervention-check

**Request:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "healthCheck": {
      "needsIntervention": true,
      "interventionType": "OVERCONFIDENCE",
      "correlationCoeff": 0.35,
      "assessmentCount": 15,
      "reason": "Poor calibration detected (r = 0.35, avg delta = 25.3)"
    },
    "recommendation": {
      "type": "OVERCONFIDENCE",
      "message": "We've noticed a pattern: You often feel more confident than your actual performance shows...",
      "recommendations": [
        "Review concepts where you felt certain but performed weaker",
        "Before marking objectives complete, quiz yourself without notes",
        ...
      ],
      "educationalContent": "**Understanding Overconfidence (Dunning-Kruger Effect)**...",
      "exampleAssessments": [
        {
          "conceptName": "Cardiac Physiology",
          "confidence": 5,
          "score": 65,
          "delta": 35
        }
      ]
    }
  }
}
```

### POST /api/calibration/intervention-dismiss

**Request:**
```json
{
  "userId": "user-123",
  "interventionType": "OVERCONFIDENCE",
  "correlationAtDismissal": 0.35,
  "assessmentCount": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Intervention dismissal recorded successfully"
  }
}
```

---

## Testing

### Run Tests

```bash
npm run test apps/web/src/__tests__/lib/metacognitive-interventions.test.ts
```

### Test Coverage

**10+ test cases covering:**
-  Insufficient data (< 10 assessments)
-  Acceptable calibration (r >= 0.5)
-  Poor calibration triggers intervention (r < 0.5)
-  7-day cooldown enforcement
-  Cooldown expiry (8+ days)
-  Overconfidence pattern detection
-  Underconfidence pattern detection
-  General pattern for mixed issues
-  Recommendation generation
-  Dismissal tracking

---

## Database Integration

**No new migrations required!**

Uses existing models:
- **ValidationResponse** - Already has `preAssessmentConfidence` and `calibrationCategory` fields
- **BehavioralEvent** - Reused for storing intervention dismissals

**Dismissal storage:**
```typescript
{
  userId: "user-123",
  eventType: "VALIDATION_COMPLETED",
  eventData: {
    type: "intervention_dismissal",
    interventionType: "OVERCONFIDENCE",
    correlationAtDismissal: 0.35,
    assessmentCount: 15
  },
  timestamp: "2025-10-17T12:00:00Z"
}
```

---

## Integration Workflow

### Study Session Integration (Recommended)

```typescript
// 1. After user completes validation assessment
await saveValidationResponse(response);

// 2. Periodically check calibration health (e.g., after every 5th assessment)
const assessmentCount = await getAssessmentCount(userId);
if (assessmentCount % 5 === 0) {
  const healthCheck = await fetch('/api/calibration/intervention-check', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }).then(r => r.json());

  // 3. Show intervention if needed
  if (healthCheck.data.healthCheck.needsIntervention) {
    setInterventionToShow(healthCheck.data.recommendation);
    setShowInterventionDialog(true);
  }
}
```

### Dismissal Tracking

```typescript
const handleDismiss = async () => {
  await fetch('/api/calibration/intervention-dismiss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      interventionType: intervention.type,
      correlationAtDismissal: healthCheck.correlationCoeff,
      assessmentCount: healthCheck.assessmentCount
    })
  });

  closeDialog();
};
```

---

## Design System Compliance

### Colors (OKLCH)

- **Overconfident:** `oklch(0.65 0.20 25)` - Red
- **Underconfident:** `oklch(0.60 0.18 230)` - Blue
- **Calibrated:** `oklch(0.7 0.15 145)` - Green
- **Neutral:** `oklch(0.6 0.05 240)` - Gray

### Glassmorphism

```css
background: bg-white/95
backdrop-filter: backdrop-blur-xl
box-shadow: shadow-[0_8px_32px_rgba(31,38,135,0.1)]
border: border-[oklch(0.6_0.05_240)]/20
```

### Accessibility

-  ARIA labels on all interactive elements
-  Keyboard navigation (Tab, Enter, Esc)
-  Screen reader support
-  44px minimum touch targets
-  Color + text indicators (never color alone)

---

## Next Steps

### Immediate Integration Tasks

1. **Add intervention check to study session flow**
   - Trigger after every 5 assessments
   - Display badge on study page when intervention available

2. **Create calibration dashboard link**
   - Link "Learn More" button to `/progress/calibration`
   - Display intervention history and effectiveness

3. **Add notification system**
   - Email/push notification for persistent poor calibration
   - Weekly calibration summary

### Future Enhancements

1. **Effectiveness Analytics**
   - Dashboard showing correlation improvement after interventions
   - A/B testing different recommendation styles
   - Correlate with board exam scores

2. **Adaptive Interventions**
   - Personalize based on learning style
   - Adjust frequency based on effectiveness
   - Multi-language support for recommendations

3. **Gamification**
   - Achievement for improving calibration accuracy
   - "Well Calibrated" badge when r > 0.7 for 30+ days
   - Peer comparison (opt-in, anonymized)

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/lib/metacognitive-interventions.ts` | 506 | Core intervention engine |
| `apps/web/src/components/study/InterventionDialog.tsx` | 322 | UI component |
| `apps/web/src/app/api/calibration/intervention-check/route.ts` | 155 | Check API |
| `apps/web/src/app/api/calibration/intervention-dismiss/route.ts` | 96 | Dismiss API |
| `apps/web/src/__tests__/lib/metacognitive-interventions.test.ts` | 639 | Test suite |

**Total:** ~1,718 lines of production code + tests

---

## Acceptance Criteria Met

 **AC #7: Metacognitive Intervention System**

- [x] Overconfidence intervention with Dunning-Kruger explanation
- [x] Underconfidence intervention with Imposter Syndrome explanation
- [x] Calibration improvement resources and exercises
- [x] Triggers when correlation < 0.5 over 10+ assessments
- [x] User can dismiss interventions
- [x] Dismissals tracked for effectiveness analysis
- [x] 7-day cooldown enforced
- [x] Re-check after cooldown period

---

## Technical Highlights

### Statistics Implementation

**Pearson's r formula:**
```
r = [n*£(xy) - £x*£y] / sqrt([n*£x² - (£x)²] * [n*£y² - (£y)²])
```

**Edge cases handled:**
- Divide by zero (no variance)
- Insufficient data (< 5 samples)
- Perfect correlation (r = 1.0)
- No correlation (r = 0.0)

### Pattern Detection Thresholds

```typescript
// Trigger intervention
INTERVENTION_THRESHOLD = 0.5  // Correlation coefficient

// Pattern detection
OVERCONFIDENCE_THRESHOLD = 10   // avgDelta > 10
UNDERCONFIDENCE_THRESHOLD = -10 // avgDelta < -10

// Cooldown
COOLDOWN_DAYS = 7
```

---

## Documentation References

- **Story Specification:** `docs/stories/story-4.4.md`
- **Implementation Context:** `docs/stories/story-context-4.4.xml`
- **Product Requirements:** `docs/PRD-Americano-2025-10-14.md`
- **Architecture:** `docs/solution-architecture.md`
- **Technology Decisions:** `CLAUDE.md`

---

## Questions or Issues?

For implementation questions or bug reports, refer to:
- Test file for usage examples
- API endpoint files for request/response schemas
- MetacognitiveInterventionEngine class documentation
- InterventionDialog component JSDoc comments

---

**Implementation by:** Claude (TypeScript AI Agent)
**Review by:** [Pending]
**Approved by:** [Pending]
**Deployed:** [Pending]
