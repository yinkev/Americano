# Task 8: User Feedback Loop Workflow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER FEEDBACK LOOP SYSTEM                         │
│                        (Story 5.2 Task 8)                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: PREDICTION GENERATION                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  StruggleDetectionEngine                                             │
│         │                                                            │
│         ├─→ Generate Prediction                                      │
│         │   • topicName: "Cardiac Electrophysiology"                 │
│         │   • probability: 0.78 (78%)                                │
│         │   • confidence: 0.85                                       │
│         │                                                            │
│         └─→ Store in Database                                        │
│             StrugglePrediction {                                     │
│               id: "pred_123"                                         │
│               userId: "kevy@americano.dev"                           │
│               predictedStruggleProbability: 0.78                     │
│               predictionStatus: PENDING                              │
│               actualOutcome: null  ← AWAITING FEEDBACK               │
│             }                                                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: USER STUDIES TOPIC                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Day 1, 10:00 AM                                                     │
│  ┌──────────────────┐                                                │
│  │  Study Session   │                                                │
│  │  Started         │                                                │
│  └──────────────────┘                                                │
│         │                                                            │
│         ├─→ User studies "Cardiac Electrophysiology"                 │
│         ├─→ Completes mission objectives                             │
│         └─→ Session ends                                             │
│                                                                       │
│  ⏰ TIMER STARTS: 24-hour feedback window                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 3: FEEDBACK TRIGGER (24 HOURS LATER OR NEXT SESSION)         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Trigger Conditions (OR logic):                                      │
│  ┌────────────────────────┐    ┌────────────────────────┐           │
│  │  Condition A:          │ OR │  Condition B:          │           │
│  │  24 hours passed       │    │  Next session started  │           │
│  │  (Day 2, 10:00 AM)     │    │  (anytime after study) │           │
│  └────────────────────────┘    └────────────────────────┘           │
│            │                              │                          │
│            └──────────────┬───────────────┘                          │
│                           ▼                                          │
│          ┌────────────────────────────┐                              │
│          │ useFeedbackCollection Hook │                              │
│          │ • fetchPendingFeedback()   │                              │
│          │ • Filter: 24hrs+ old       │                              │
│          │ • Filter: Not viewed yet   │                              │
│          └────────────────────────────┘                              │
│                           │                                          │
│                           ▼                                          │
│          ┌────────────────────────────┐                              │
│          │ Pending Feedback Detected! │                              │
│          │ • pendingCount: 1          │                              │
│          │ • hasPendingFeedback: true │                              │
│          └────────────────────────────┘                              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 4: DISPLAY FEEDBACK DIALOG                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Day 2, 9:02 AM (2 seconds after session start - non-intrusive)     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │  PredictionFeedbackDialog                                │        │
│  │  ─────────────────────────────────────────────────────   │        │
│  │                                                           │        │
│  │  How did it go with Cardiac Electrophysiology?          │        │
│  │  We predicted you might struggle with this topic.        │        │
│  │                                                           │        │
│  │  ○ Yes, I struggled                                       │        │
│  │  ◉ No, it was easier than expected                       │        │
│  │  ○ Prediction was helpful                                 │        │
│  │                                                           │        │
│  │  [Optional Comments]                                      │        │
│  │  Action potential concepts were confusing                │        │
│  │                                                           │        │
│  │  [Skip for Now]  [Submit Feedback]                       │        │
│  │                                                           │        │
│  └─────────────────────────────────────────────────────────┘        │
│                           │                                          │
│                           ▼                                          │
│              User selects "Yes, I struggled"                         │
│              User adds comment                                       │
│              User clicks "Submit Feedback"                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 5: API SUBMISSION & DATABASE UPDATE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST /api/analytics/predictions/pred_123/feedback                   │
│  ────────────────────────────────────────────────────               │
│  Request Body:                                                       │
│  {                                                                   │
│    actualStruggle: true,                                             │
│    feedbackType: "HELPFUL",                                          │
│    comments: "Action potential concepts were confusing"              │
│  }                                                                   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │  Database Updates (Transactional):                  │            │
│  │                                                      │            │
│  │  1. Update StrugglePrediction:                      │            │
│  │     • actualOutcome = true                          │            │
│  │     • outcomeRecordedAt = NOW()                     │            │
│  │     • predictionStatus = CONFIRMED (true positive)  │            │
│  │                                                      │            │
│  │  2. Create PredictionFeedback:                      │            │
│  │     • predictionId = "pred_123"                     │            │
│  │     • userId = "kevy@americano.dev"                 │            │
│  │     • feedbackType = HELPFUL                        │            │
│  │     • actualStruggle = true                         │            │
│  │     • comments = "Action potential..."              │            │
│  │     • submittedAt = NOW()                           │            │
│  │                                                      │            │
│  │  3. Recalculate Model Accuracy:                     │            │
│  │     • Query all predictions with outcomes           │            │
│  │     • Calculate metrics:                            │            │
│  │       - Accuracy: (TP + TN) / Total = 0.78 (78%)    │            │
│  │       - Precision: TP / (TP + FP) = 0.82            │            │
│  │       - Recall: TP / (TP + FN) = 0.75               │            │
│  │       - F1 Score: 0.78                              │            │
│  │       - Calibration: 0.92                           │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6: MODEL IMPROVEMENT NOTIFICATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  API Response:                                                       │
│  {                                                                   │
│    success: true,                                                    │
│    data: {                                                           │
│      feedbackRecorded: true,                                         │
│      modelAccuracyUpdate: 0.78,  ← NEW ACCURACY                      │
│      message: "Model accuracy is now 78%"                            │
│    }                                                                 │
│  }                                                                   │
│                           │                                          │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────┐            │
│  │  showModelImprovementToast()                        │            │
│  │                                                      │            │
│  │  ✨ Prediction accuracy improved!                   │            │
│  │     Thanks to your feedback, our predictions        │            │
│  │     are now 78% accurate (up 6 points)              │            │
│  │                                                      │            │
│  │     Previous: 72%  →  Current: 78%                  │            │
│  │                                                      │            │
│  │  [Duration: 6 seconds, dismissable]                 │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
│  User sees success notification                                      │
│  Feedback loop completes ✅                                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 7: INTERVENTION FEEDBACK (IF APPLICABLE)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  If mission had interventions applied:                               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │  InterventionFeedbackCard                           │            │
│  │  ─────────────────────────────────────────────────  │            │
│  │                                                      │            │
│  │  How helpful was this intervention?                 │            │
│  │                                                      │            │
│  │  ⭐ Prerequisite Review                              │            │
│  │  Review action potential basics before cardiac      │            │
│  │  electrophysiology                                  │            │
│  │                                                      │            │
│  │  Rate this intervention:                            │            │
│  │  ⭐⭐⭐⭐☆ (4 out of 5 stars)                        │            │
│  │                                                      │            │
│  │  Or choose an option:                               │            │
│  │  ◉ Very helpful                                      │            │
│  │  ○ Somewhat helpful                                  │            │
│  │  ○ Not helpful                                       │            │
│  │  ○ Made it worse                                     │            │
│  │                                                      │            │
│  │  [Optional Comments]                                 │            │
│  │                                                      │            │
│  │  [Submit Feedback]                                   │            │
│  │                                                      │            │
│  └─────────────────────────────────────────────────────┘            │
│                           │                                          │
│                           ▼                                          │
│              User rates intervention: 4 stars                        │
│              Selects "Very helpful"                                  │
│              Submits feedback                                        │
│                           │                                          │
│                           ▼                                          │
│  Intervention effectiveness recorded                                 │
│  Future interventions tailored based on feedback                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONTINUOUS IMPROVEMENT CYCLE                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Feedback Data Used For:                                             │
│                                                                       │
│  1. Model Accuracy Tracking                                          │
│     • Real-time metrics (precision, recall, F1)                      │
│     • Calibration monitoring                                         │
│     • Error pattern analysis                                         │
│                                                                       │
│  2. Model Retraining (Weekly Schedule)                               │
│     • Collect all new feedback                                       │
│     • Retrain prediction model                                       │
│     • Evaluate on test set                                           │
│     • Deploy if accuracy improves                                    │
│                                                                       │
│  3. Intervention Optimization                                        │
│     • Measure intervention effectiveness                             │
│     • Identify high-performing interventions                         │
│     • Adjust recommendation priorities                               │
│     • Tailor to user learning profile                                │
│                                                                       │
│  4. User Experience Enhancement                                      │
│     • Track feedback submission rates                                │
│     • Monitor dismissal patterns                                     │
│     • Optimize timing and presentation                               │
│     • A/B test different approaches                                  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │  Success Metrics:                                    │            │
│  │  • Feedback collection rate: >40%                    │            │
│  │  • Model accuracy target: >75%                       │            │
│  │  • User satisfaction: <5% dismiss rate               │            │
│  │  • Calibration: ±10% of actual struggle rate         │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────┐
│  Analytics Dashboard      │
│  or Study Session Page    │
└───────────────────────────┘
              │
              │ uses
              ▼
┌───────────────────────────────────────┐
│  useFeedbackCollection Hook           │
│  ────────────────────────────────────│
│  • Fetches pending predictions        │
│  • Manages timing logic                │
│  • Tracks viewed predictions           │
│  • Handles session start events        │
│  • Polling (optional)                  │
└───────────────────────────────────────┘
              │
              │ returns
              ▼
┌───────────────────────────────────────┐
│  Pending Feedback State                │
│  ────────────────────────────────────│
│  • pendingFeedback: Prediction[]      │
│  • hasPendingFeedback: boolean         │
│  • pendingCount: number                │
│  • markAsViewed()                      │
│  • dismissPrediction()                 │
└───────────────────────────────────────┘
              │
              │ triggers
              ▼
┌─────────────────────────────────────────────────────────────┐
│  PredictionFeedbackDialog                                    │
│  ───────────────────────────────────────────────────────    │
│  Props:                                                      │
│    • prediction: { id, topicName, predictedFor, ... }       │
│    • open: boolean                                           │
│    • onOpenChange: (open) => void                            │
│    • onFeedbackSubmitted?: () => void                        │
│                                                              │
│  Internal State:                                             │
│    • selectedOption: string                                  │
│    • comments: string                                        │
│    • isSubmitting: boolean                                   │
│                                                              │
│  Actions:                                                    │
│    • handleSubmit() → POST /api/.../feedback                │
│    • handleSkip() → close dialog                             │
└─────────────────────────────────────────────────────────────┘
              │
              │ calls API
              ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/analytics/predictions/[id]/feedback               │
│  ───────────────────────────────────────────────────────    │
│  • Validates request (Zod)                                   │
│  • Updates StrugglePrediction                                │
│  • Creates PredictionFeedback                                │
│  • Recalculates model accuracy                               │
│  • Returns metrics and accuracy                              │
└─────────────────────────────────────────────────────────────┘
              │
              │ response
              ▼
┌─────────────────────────────────────────────────────────────┐
│  ModelImprovementNotification                                │
│  ───────────────────────────────────────────────────────    │
│  Props:                                                      │
│    • improvement: { previousAccuracy, currentAccuracy, ... } │
│    • onShown?: () => void                                    │
│                                                              │
│  Alternative:                                                │
│    • showModelImprovementToast(improvement)                  │
│    • showAccuracyUpdateToast(accuracy)                       │
│                                                              │
│  Displays:                                                   │
│    • Success toast with accuracy update                      │
│    • Previous vs. current comparison                         │
│    • Improvement points                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  InterventionFeedbackCard (Parallel Flow)                    │
│  ───────────────────────────────────────────────────────    │
│  Shown after mission completion if interventions applied     │
│                                                              │
│  Props:                                                      │
│    • intervention: { id, type, description, reasoning }      │
│    • onFeedbackSubmitted?: () => void                        │
│    • onDismiss?: () => void                                  │
│                                                              │
│  Features:                                                   │
│    • 1-5 star rating                                         │
│    • Quick feedback options                                  │
│    • Optional comments                                       │
│    • Dismissable                                             │
│                                                              │
│  Calls same API:                                             │
│    POST /api/analytics/predictions/[predictionId]/feedback   │
│    with helpfulness rating                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │      │  API Layer   │      │  Database   │
│  Components │      │  (Next.js)   │      │  (Prisma)   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                    │                      │
       │ GET /predictions   │                      │
       │  (pending)         │                      │
       ├───────────────────>│                      │
       │                    │ findMany({           │
       │                    │   status: PENDING,   │
       │                    │   minProbability: 0.5│
       │                    │ })                   │
       │                    ├─────────────────────>│
       │                    │                      │
       │                    │   Predictions[]      │
       │                    │<─────────────────────┤
       │   Predictions[]    │                      │
       │<───────────────────┤                      │
       │                    │                      │
       │                    │                      │
       │ POST /predictions/ │                      │
       │   [id]/feedback    │                      │
       │ {actualStruggle,   │                      │
       │  feedbackType,     │                      │
       │  comments}         │                      │
       ├───────────────────>│                      │
       │                    │ update(Prediction)   │
       │                    ├─────────────────────>│
       │                    │                      │
       │                    │ create(Feedback)     │
       │                    ├─────────────────────>│
       │                    │                      │
       │                    │ findMany(outcomes)   │
       │                    ├─────────────────────>│
       │                    │                      │
       │                    │ Calculate Accuracy   │
       │                    │ • TP, TN, FP, FN     │
       │                    │ • Precision, Recall  │
       │                    │ • F1 Score           │
       │                    │                      │
       │   {success: true,  │                      │
       │    modelAccuracy:  │                      │
       │    0.78,           │                      │
       │    metrics: {...}} │                      │
       │<───────────────────┤                      │
       │                    │                      │
       │ Show Toast:        │                      │
       │ "Accuracy: 78%"    │                      │
       │                    │                      │
```

---

**Created:** 2025-10-16
**Story:** 5.2 - Predictive Analytics for Learning Struggles
**Task:** Task 8 - Build User Feedback Loop

This diagram illustrates the complete workflow from prediction generation through feedback collection to model improvement notification.
