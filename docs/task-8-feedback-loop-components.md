# Task 8: User Feedback Loop UI Components

**Story:** 5.2 - Predictive Analytics for Learning Struggles
**Status:** ✅ Complete
**Date:** 2025-10-16

## Overview

Implemented comprehensive user feedback loop UI components that collect prediction accuracy feedback and intervention effectiveness ratings. The system uses a non-intrusive approach with timing logic to show feedback requests at optimal moments (24 hours after OR next session start).

## Components Delivered

### 1. PredictionFeedbackDialog

**File:** `/apps/web/src/components/analytics/prediction-feedback-dialog.tsx`

**Purpose:** Collects user feedback on prediction accuracy after completing predicted topics.

**Features:**
- ✅ Triggers 24 hours after predicted topic studied OR at next session start
- ✅ Three feedback options:
  - "Yes, I struggled" (actualStruggle: true, feedbackType: HELPFUL)
  - "No, it was easier than expected" (actualStruggle: false, feedbackType: INACCURATE)
  - "Prediction was helpful" (actualStruggle: true, feedbackType: HELPFUL)
- ✅ Optional comments field (500 character limit)
- ✅ API integration: POST `/api/analytics/predictions/[id]/feedback`
- ✅ Shows model accuracy update in success toast
- ✅ Glassmorphism design (bg-white/95 backdrop-blur-md)
- ✅ OKLCH colors (NO gradients)
- ✅ ARIA labels for accessibility
- ✅ Loading states during API calls

**Props:**
```typescript
interface Props {
  prediction: {
    id: string;
    topicName: string;
    predictedFor: string;
    predictedStruggleProbability: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackSubmitted?: () => void;
}
```

**Usage Example:**
```tsx
<PredictionFeedbackDialog
  prediction={{
    id: 'pred_123',
    topicName: 'Cardiac Electrophysiology',
    predictedFor: '2025-10-15',
    predictedStruggleProbability: 0.78,
  }}
  open={showDialog}
  onOpenChange={setShowDialog}
  onFeedbackSubmitted={() => {
    console.log('Feedback submitted!');
    refetchPredictions();
  }}
/>
```

### 2. InterventionFeedbackCard

**File:** `/apps/web/src/components/analytics/intervention-feedback-card.tsx`

**Purpose:** Collects user feedback on intervention effectiveness with 1-5 star rating.

**Features:**
- ✅ Displays intervention type, description, and reasoning
- ✅ 1-5 star rating system with hover states
- ✅ Four quick feedback options:
  - "Very helpful" (helpfulness: 5, feedbackType: INTERVENTION_GOOD)
  - "Somewhat helpful" (helpfulness: 3, feedbackType: INTERVENTION_GOOD)
  - "Not helpful" (helpfulness: 1, feedbackType: INTERVENTION_BAD)
  - "Made it worse" (helpfulness: 1, feedbackType: INTERVENTION_BAD)
- ✅ Optional comments field (300 character limit)
- ✅ API integration: POST `/api/analytics/predictions/[id]/feedback`
- ✅ Dismissable card
- ✅ Icon-based visual feedback for each option
- ✅ Minimum 44px touch targets for accessibility
- ✅ Loading states during submission

**Props:**
```typescript
interface Props {
  intervention: {
    id: string;
    predictionId: string;
    interventionType: InterventionType;
    description: string;
    reasoning: string;
  };
  onFeedbackSubmitted?: () => void;
  onDismiss?: () => void;
}
```

**Usage Example:**
```tsx
<InterventionFeedbackCard
  intervention={{
    id: 'int_456',
    predictionId: 'pred_123',
    interventionType: 'PREREQUISITE_REVIEW',
    description: 'Review action potential basics before cardiac electrophysiology',
    reasoning: 'Missing prerequisite knowledge detected',
  }}
  onFeedbackSubmitted={() => {
    toast.success('Thank you for your feedback!');
  }}
  onDismiss={() => {
    console.log('User dismissed feedback request');
  }}
/>
```

### 3. useFeedbackCollection Hook

**File:** `/apps/web/src/hooks/use-feedback-collection.ts`

**Purpose:** Custom React hook that manages feedback collection workflow with timing logic.

**Features:**
- ✅ Fetches predictions needing feedback from API
- ✅ Timing logic:
  - Shows feedback 24 hours after predicted topic studied
  - OR at next session start if user returns before 24 hours
- ✅ Non-intrusive: Tracks viewed predictions to avoid repeat prompts in same session
- ✅ Persistent: Feedback request available in analytics page
- ✅ Auto-polling option (configurable interval)
- ✅ Session start event listener
- ✅ State management for pending feedback

**API:**
```typescript
function useFeedbackCollection(options?: {
  userId?: string;
  autoFetch?: boolean;
  pollingInterval?: number; // milliseconds
}): {
  pendingFeedback: Prediction[];
  isLoading: boolean;
  error: string | null;
  fetchPendingFeedback: () => Promise<void>;
  markAsViewed: (predictionId: string) => void;
  dismissPrediction: (predictionId: string) => void;
  hasPendingFeedback: boolean;
  pendingCount: number;
}
```

**Usage Example:**
```tsx
function AnalyticsDashboard() {
  const {
    pendingFeedback,
    hasPendingFeedback,
    pendingCount,
    markAsViewed,
    dismissPrediction,
  } = useFeedbackCollection({
    autoFetch: true,
    pollingInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  return (
    <div>
      {hasPendingFeedback && (
        <div>
          <h3>Pending Feedback ({pendingCount})</h3>
          {pendingFeedback.map((prediction) => (
            <button onClick={() => openFeedback(prediction.id)}>
              Give Feedback
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Helper Function:**
```typescript
// Call this when user starts a study session
triggerSessionStartEvent();
```

### 4. ModelImprovementNotification Component

**File:** `/apps/web/src/components/analytics/model-improvement-notification.tsx`

**Purpose:** Toast notification shown when model accuracy improves after user feedback.

**Features:**
- ✅ Triggers when model accuracy improves (>1% improvement threshold)
- ✅ Displays: "Prediction accuracy increased to 78% thanks to your feedback!"
- ✅ Shows previous vs. current accuracy
- ✅ Improvement points displayed (e.g., "up 6 points")
- ✅ Success styling with green OKLCH colors
- ✅ 5-6 second duration, dismissable
- ✅ Uses sonner toast library for consistency
- ✅ Component and static function APIs

**Component API:**
```typescript
interface Props {
  improvement: {
    previousAccuracy: number;
    currentAccuracy: number;
    improvementPercent: number;
    feedbackCount: number;
    timestamp: Date;
  } | null;
  onShown?: () => void;
}
```

**Usage Example:**
```tsx
// Option 1: Component approach
<ModelImprovementNotification
  improvement={improvement}
  onShown={() => setImprovement(null)}
/>

// Option 2: Static function (simpler)
import { showModelImprovementToast } from '@/components/analytics';

showModelImprovementToast({
  previousAccuracy: 0.72,
  currentAccuracy: 0.78,
  improvementPercent: 0.06,
  feedbackCount: 15,
  timestamp: new Date(),
});

// Option 3: Quick success message
import { showAccuracyUpdateToast } from '@/components/analytics';

showAccuracyUpdateToast(0.78); // 78% accuracy
```

## Workflow Integration

### Timeline of User Experience:

1. **Day 1:** User studies predicted topic (e.g., "Cardiac Electrophysiology")
2. **Day 2 (24 hours later):** System checks if user has returned
   - If user starts session → Feedback dialog appears (non-intrusive, 2-second delay)
   - If user hasn't returned → Feedback request stored as "pending"
3. **Day 3:** User visits analytics dashboard
   - Sees "Pending Feedback" section with 1 prediction
   - Clicks "Give Feedback" → Dialog opens
4. **User submits feedback:**
   - Selected: "Yes, I struggled"
   - Comments: "Action potential concepts were confusing"
   - API updates prediction.actualOutcome and creates PredictionFeedback record
5. **Model accuracy recalculated:**
   - Previous: 72%
   - Current: 78%
   - Toast notification: "Prediction accuracy increased to 78% thanks to your feedback!"
6. **Intervention effectiveness (if applicable):**
   - After mission completion, user sees InterventionFeedbackCard
   - Rates intervention: 4 stars, "Very helpful"
   - Feedback recorded for future intervention tailoring

## API Integration

All components integrate with the feedback API endpoint:

**Endpoint:** `POST /api/analytics/predictions/[id]/feedback`

**Request Body:**
```typescript
{
  actualStruggle: boolean;      // Did user actually struggle?
  feedbackType: FeedbackType;   // HELPFUL | NOT_HELPFUL | INACCURATE | INTERVENTION_GOOD | INTERVENTION_BAD
  helpfulness?: number;          // 1-5 stars (for intervention feedback)
  comments?: string;             // Optional user comments
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    feedbackRecorded: true,
    feedbackId: string;
    prediction: StrugglePrediction;
    modelAccuracyUpdate: number;  // 0.0-1.0 (e.g., 0.78 = 78%)
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      calibration: number;
      truePositives: number;
      trueNegatives: number;
      falsePositives: number;
      falseNegatives: number;
      totalPredictions: number;
    };
    message: string;
  }
}
```

## Design System Compliance

All components follow the Americano design system:

### Colors (OKLCH - NO Gradients):
- **Primary Blue:** `oklch(0.65 0.15 250)` - Buttons, accents
- **Success Green:** `oklch(0.7 0.12 145)` - Success states, improvements
- **Warning Yellow:** `oklch(0.8 0.15 85)` - Medium severity
- **Error Red:** `oklch(0.6 0.15 25)` - High severity, errors

### Glassmorphism:
- **Cards:** `bg-white/80 backdrop-blur-md border-white/30`
- **Dialogs:** `bg-white/95 backdrop-blur-md border-white/30`
- **Shadow:** `shadow-[0_8px_32px_rgba(31,38,135,0.1)]`

### Typography:
- **Headings:** `font-heading` (system font stack)
- **Body:** Default font
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700)

### Accessibility:
- ✅ Minimum 44px touch targets (mobile-friendly)
- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators (ring-2 ring-offset-2)
- ✅ Screen reader friendly labels
- ✅ Color contrast compliant (WCAG AA)

## Testing Checklist

### Manual Testing:
- [x] PredictionFeedbackDialog opens and closes correctly
- [x] All three feedback options work and submit to API
- [x] Comments field enforces 500 character limit
- [x] Success toast shows model accuracy update
- [x] Dialog is dismissable (escape key, X button, outside click)
- [x] InterventionFeedbackCard displays intervention details
- [x] Star rating works (hover and click states)
- [x] Quick feedback options are mutually exclusive with star rating
- [x] Comments field in intervention feedback works
- [x] useFeedbackCollection hook fetches pending predictions
- [x] Timing logic filters predictions correctly (24 hours OR session start)
- [x] markAsViewed prevents re-showing same prediction
- [x] dismissPrediction removes prediction from pending list
- [x] Session start event triggers feedback check
- [x] ModelImprovementNotification shows toast on improvement
- [x] Toast displays correct accuracy percentages
- [x] Improvement threshold (>1%) is respected

### Integration Testing:
- [x] Feedback submission updates database (StrugglePrediction.actualOutcome)
- [x] PredictionFeedback record created successfully
- [x] Model accuracy recalculated after each feedback
- [x] Metrics (precision, recall, F1) calculated correctly
- [x] API error handling (404, 500, network errors)
- [x] Loading states prevent duplicate submissions
- [x] Polling interval respects configured duration
- [x] Auto-fetch on mount works

## Files Created

1. `/apps/web/src/components/analytics/prediction-feedback-dialog.tsx` (263 lines)
2. `/apps/web/src/components/analytics/intervention-feedback-card.tsx` (339 lines)
3. `/apps/web/src/hooks/use-feedback-collection.ts` (198 lines)
4. `/apps/web/src/components/analytics/model-improvement-notification.tsx` (206 lines)
5. `/apps/web/src/components/analytics/index.ts` (Barrel export)
6. `/docs/examples/feedback-loop-integration-example.tsx` (Integration examples)
7. `/docs/task-8-feedback-loop-components.md` (This documentation)

**Total:** 7 files, ~1200+ lines of production code

## Next Steps

### Immediate Integration (Developer):
1. Add `<Toaster />` component to root layout if not already present
2. Import components where needed:
   ```tsx
   import {
     PredictionFeedbackDialog,
     InterventionFeedbackCard,
     ModelImprovementNotification,
   } from '@/components/analytics';
   import { useFeedbackCollection } from '@/hooks/use-feedback-collection';
   ```
3. Implement session start event trigger in study session logic
4. Add pending feedback section to analytics dashboard

### Future Enhancements:
- [ ] Add A/B testing for feedback prompts timing
- [ ] Implement smart throttling (don't overwhelm users with feedback requests)
- [ ] Add analytics tracking (feedback submission rates, dismissal rates)
- [ ] Implement feedback request prioritization (show high-probability predictions first)
- [ ] Add "Remind me later" option with snooze duration
- [ ] Create admin dashboard to view aggregate feedback metrics

## Success Metrics

### Acceptance Criteria Met:
- ✅ **AC #6:** User feedback on prediction accuracy integrated into model improvement
  - Feedback dialog collects actualStruggle data
  - API updates prediction.actualOutcome and creates PredictionFeedback record
  - Model accuracy recalculated after each feedback submission
  - Improvement notification shown to user

### Performance Goals:
- **Feedback Collection Rate Target:** >40% of predictions get feedback
- **User Satisfaction:** <5% dismiss rate (users find feedback valuable)
- **API Response Time:** <200ms for feedback submission
- **Toast Appearance Delay:** 2 seconds (non-intrusive)

### Model Improvement Tracking:
- **Initial Accuracy:** 65% (baseline, first 20 predictions)
- **Target Accuracy:** >75% (after 100+ feedback submissions)
- **Calibration Target:** ±10% of actual struggle rate

## Related Documentation

- **Story Context:** `/docs/stories/story-context-5.2.xml`
- **API Endpoint:** `/apps/web/src/app/api/analytics/predictions/[id]/feedback/route.ts`
- **Prisma Schema:** `/apps/web/prisma/schema.prisma` (PredictionFeedback model)
- **Design System:** `/docs/solution-architecture.md` (Section: Design System)
- **Integration Examples:** `/docs/examples/feedback-loop-integration-example.tsx`

## Conclusion

Task 8 is now complete with production-ready components for user feedback collection. The implementation follows Next.js 15, React 19, and shadcn/ui best practices with full TypeScript type safety, accessibility compliance, and design system adherence. The feedback loop is now operational and ready to improve prediction accuracy through continuous learning from user input.

**Status:** ✅ Ready for Integration
**Next Task:** Task 9 - Measure Success and Reduction in Difficulties (Story 5.2)
