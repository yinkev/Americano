# Story 5.2: Predictive Analytics for Learning Struggles

Status: Approved

## Story

As a medical student,
I want the platform to predict when I might struggle with topics,
So that I can receive proactive support before difficulties become problems.

## Acceptance Criteria

1. Predictive model identifies topics likely to cause difficulty for user
2. Early warning system alerts user to potential struggle areas
3. Proactive study recommendations before predicted struggles occur
4. Intervention strategies tailored to user's learning patterns
5. Prediction accuracy tracked and improved through machine learning
6. User feedback on prediction accuracy integrated into model improvement
7. Struggle prediction integrated with daily mission generation
8. Success rate measured through reduction in actual learning difficulties

## Tasks / Subtasks

### Task 1: Design Predictive Model Data Architecture (AC: #1, #5, #6)
- [ ] 1.1: Create `StrugglePrediction` model for storing predictions
  - Fields: `id`, `userId`, `learningObjectiveId`, `topicId`, `predictionDate`, `predictedStruggleProbability` (0.0-1.0), `predictionConfidence` (0.0-1.0), `predictionStatus` (PENDING/CONFIRMED/FALSE_POSITIVE), `actualOutcome`, `createdAt`
  - Prediction status: PENDING (not yet studied), CONFIRMED (user did struggle), FALSE_POSITIVE (no struggle occurred)
  - Actual outcome: captured after user studies the topic (struggle indicators: low performance, high time-to-complete, multiple reviews needed)
- [ ] 1.2: Create `StruggleIndicator` model for tracking struggle signals
  - Fields: `id`, `userId`, `learningObjectiveId`, `indicatorType` (ENUM), `severity` (LOW/MEDIUM/HIGH), `detectedAt`, `context` (JSON)
  - Indicator types: LOW_RETENTION, PREREQUISITE_GAP, COMPLEXITY_MISMATCH, COGNITIVE_OVERLOAD, HISTORICAL_STRUGGLE_PATTERN, TOPIC_SIMILARITY_STRUGGLE
  - Context JSON: stores additional metadata (e.g., retention score, prerequisite objectives, similar topics)
- [ ] 1.3: Create `PredictionFeedback` model for user input
  - Fields: `id`, `predictionId`, `userId`, `feedbackType` (HELPFUL/NOT_HELPFUL/INACCURATE), `actualStruggle` (Boolean), `comments` (Text), `submittedAt`
  - Supports model improvement through supervised learning feedback loop
- [ ] 1.4: Extend `PerformancePrediction` model (from solution architecture)
  - Add fields: `predictionType` = "struggle_likelihood", `topicId`, `predictionFeatures` (JSON - stores feature vector used for prediction)
  - Stores model predictions with feature engineering context
- [ ] 1.5: Run Prisma migration for predictive analytics models

### Task 2: Implement Feature Engineering Pipeline (AC: #1, #5)
- [ ] 2.1: Create `StruggleFeatureExtractor` class
  - Method: `extractFeaturesForObjective(userId, objectiveId): FeatureVector`
  - Method: `extractFeaturesForTopic(userId, topicId): FeatureVector`
  - Method: `calculateFeatureImportance(): FeatureImportanceScores`
- [ ] 2.2: Implement performance-based features
  - **Retention score features:**
    - Average retention rate for objective's topic area (last 30 days)
    - Retention decline rate (trend over time)
    - Retention volatility (standard deviation)
  - **Review history features:**
    - Review count per objective
    - Average review rating (AGAIN/HARD/GOOD/EASY)
    - Lapse count (number of AGAIN ratings)
    - Time between reviews (spacing)
  - **Performance metrics:**
    - Session performance score (from Story 2.2: PerformanceMetric)
    - Validation prompt scores (from Story 4.1: ValidationResponse)
    - Confidence calibration accuracy (from Story 4.4)
- [ ] 2.3: Implement prerequisite and dependency features
  - **Prerequisite gap detection:**
    - Identify prerequisite objectives with low mastery (<70% retention)
    - Count missing prerequisites
    - Calculate prerequisite mastery gap score
  - **Dependency strength:**
    - Measure strength of prerequisite relationships (from LearningObjective.prerequisites)
    - Calculate topic dependency graph centrality
- [ ] 2.4: Implement content complexity features
  - **Objective complexity:**
    - Content difficulty level (BASIC/INTERMEDIATE/ADVANCED)
    - Medical terminology density (technical terms per sentence)
    - Concept count (number of distinct concepts)
  - **User-relative complexity:**
    - Difficulty relative to user's current mastery level
    - Complexity mismatch score (content vs. user ability)
- [ ] 2.5: Implement behavioral pattern features
  - **Historical struggle patterns (from Story 5.1):**
    - Past struggles in similar topics
    - Content type preference mismatch (e.g., text-heavy vs. visual learner)
    - Time-of-day performance patterns
  - **Cognitive load indicators:**
    - Recent session fatigue levels
    - Study intensity (sessions per week)
    - Attention cycle position (within optimal window or not)
- [ ] 2.6: Implement contextual features
  - **Temporal features:**
    - Days until exam (urgency factor)
    - Time since last studied topic
    - Study session recency
  - **Workload features:**
    - Total pending objectives count
    - Mission completion rate (last 7 days)
    - Study time availability (from learning profile)
- [ ] 2.7: Create normalized feature vector
  - Normalize all features to 0-1 scale
  - Handle missing values (default to 0.5 for neutral assumption)
  - Create feature importance weights (initially equal, adjusted via learning)
  - Return `FeatureVector` object: `{ features: Record<string, number>, metadata: { extractedAt, dataQuality: 0-1 } }`

### Task 3: Build Struggle Prediction ML Model (AC: #1, #5)
- [ ] 3.1: Create `StrugglePredictionModel` class
  - Method: `train(trainingData: TrainingExample[]): ModelMetrics`
  - Method: `predict(featureVector: FeatureVector): PredictionResult`
  - Method: `updateModel(newData: TrainingExample[]): UpdateMetrics`
  - Method: `getModelPerformance(): PerformanceMetrics`
- [ ] 3.2: Implement initial rule-based model (MVP)
  - **High struggle probability (>0.7) if:**
    - Retention score <50% for topic area
    - 2+ prerequisite objectives with low mastery
    - Historical struggle in similar topics (from Story 5.1 patterns)
    - Complexity mismatch score >0.6
  - **Medium struggle probability (0.4-0.7) if:**
    - Retention score 50-70%
    - 1 prerequisite with low mastery
    - Content type preference mismatch
  - **Low struggle probability (<0.4) if:**
    - Retention score >70%
    - All prerequisites mastered
    - Content matches learning style
  - Confidence score based on data sufficiency (number of features with non-default values)
- [ ] 3.3: Implement logistic regression model (Post-MVP)
  - Use historical data: features → actual struggle outcome (binary: struggled/didn't struggle)
  - Train logistic regression: P(struggle) = 1 / (1 + e^-(β₀ + β₁x₁ + ... + βₙxₙ))
  - Coefficients (β) learned from data
  - Regularization to prevent overfitting (L2 penalty)
  - Cross-validation for hyperparameter tuning
- [ ] 3.4: Implement model evaluation and validation
  - Split data: 80% training, 20% testing
  - Metrics: Accuracy, Precision, Recall, F1-score, AUC-ROC
  - Confusion matrix: True Positives, False Positives, True Negatives, False Negatives
  - Target performance: >75% accuracy, >70% recall (catch most struggles)
  - Calibration curve: predicted probability vs. actual struggle rate
- [ ] 3.5: Implement incremental learning
  - Update model weekly with new feedback data
  - Online learning: adjust weights based on prediction outcomes
  - Feature importance recalculation
  - Model drift detection (performance degradation over time)

### Task 4: Implement Struggle Detection Engine (AC: #1, #2, #3)
- [ ] 4.1: Create `StruggleDetectionEngine` orchestrator class
  - Method: `runPredictions(userId): StrugglePrediction[]`
  - Method: `detectUpcomingStruggles(userId, daysAhead = 7): StrugglePrediction[]`
  - Method: `analyzeCurrentStruggles(userId): StruggleIndicator[]`
  - Method: `identifyInterventionOpportunities(userId): InterventionRecommendation[]`
- [ ] 4.2: Implement prediction workflow
  - Identify upcoming learning objectives (from Mission queue, next 7-14 days)
  - For each objective:
    - Extract feature vector via StruggleFeatureExtractor
    - Run prediction via StrugglePredictionModel.predict()
    - Create StrugglePrediction record if probability >0.5
    - Store prediction with confidence score
  - Batch process predictions (run daily or on-demand)
- [ ] 4.3: Implement struggle indicator detection
  - Monitor real-time study performance
  - Detect early warning signals:
    - Session performance drop >20% from average
    - Multiple AGAIN ratings in short period
    - Validation prompt scores <60%
    - Increased time-to-complete vs. estimate
  - Create StruggleIndicator records with severity
  - Trigger immediate alerts for HIGH severity
- [ ] 4.4: Implement intervention opportunity identification
  - Match predicted struggles with intervention strategies:
    - **Prerequisite gap:** Recommend prerequisite review before tackling topic
    - **Complexity mismatch:** Suggest easier introductory content first
    - **Content type mismatch:** Recommend alternative content format (visual vs. text)
    - **Cognitive overload:** Suggest lighter mission, more breaks
    - **Historical pattern:** Reference past successful strategies
  - Generate `InterventionRecommendation` with specific actions

### Task 5: Build Early Warning System (AC: #2, #3)
- [ ] 5.1: Create `StruggleAlertSystem` class
  - Method: `generateAlerts(userId): StruggleAlert[]`
  - Method: `prioritizeAlerts(alerts: StruggleAlert[]): StruggleAlert[]`
  - Method: `notifyUser(alert: StruggleAlert): NotificationResult`
- [ ] 5.2: Implement alert generation logic
  - Alert triggered when:
    - New prediction with probability >0.7 (high confidence)
    - Struggle indicator detected with MEDIUM+ severity
    - Objective is due within 3 days (urgent)
  - Alert types:
    - PROACTIVE_WARNING: "You may struggle with [topic] based on your patterns"
    - PREREQUISITE_ALERT: "Review [prerequisite] before studying [topic]"
    - REAL_TIME_ALERT: "Difficulty detected in current session, consider a break"
    - INTERVENTION_SUGGESTION: "Try [strategy] to improve performance on [topic]"
- [ ] 5.3: Implement alert prioritization
  - Priority factors:
    - Urgency (days until topic is due): weight 0.4
    - Prediction confidence: weight 0.3
    - Severity of predicted struggle: weight 0.2
    - User's current stress level (from cognitive load): weight 0.1
  - Sort alerts by priority score (high to low)
  - Limit to top 3 alerts to avoid overwhelming user
- [ ] 5.4: Implement user notification delivery
  - In-app notification: Badge on dashboard, modal alert
  - Email notification (optional, user preference)
  - Alert display locations:
    - Dashboard: "Upcoming Challenges" card
    - Mission briefing: Warning banner if mission contains predicted struggle
    - Study session: Real-time alert overlay
  - Dismiss/snooze functionality
  - Alert history tracking

### Task 6: Build Proactive Intervention System (AC: #3, #4, #7)
- [ ] 6.1: Create `InterventionEngine` class
  - Method: `generateInterventions(prediction: StrugglePrediction): Intervention[]`
  - Method: `tailorToLearningPattern(intervention: Intervention, userId): TailoredIntervention`
  - Method: `applyIntervention(interventionId): ApplicationResult`
- [ ] 6.2: Implement intervention strategy library
  - **Prerequisite reinforcement:**
    - Action: Schedule prerequisite review mission before main topic
    - Timing: 1-2 days before main topic
    - Content: Targeted flashcards, validation prompts for prerequisites
  - **Difficulty progression:**
    - Action: Insert introductory content before complex objective
    - Timing: Start with BASIC complexity, progress to INTERMEDIATE
    - Content: Simplified explanations, foundational concepts
  - **Content format adaptation:**
    - Action: Provide alternative content types
    - Timing: Concurrent with main content
    - Content: Visual diagrams for text-heavy topics, text summaries for visual learners (based on learning style from Story 5.1)
  - **Cognitive load reduction:**
    - Action: Break topic into smaller chunks, reduce session duration
    - Timing: Adjust mission to 50% normal duration
    - Content: Smaller objective subsets, more frequent breaks
  - **Spaced repetition boost:**
    - Action: Increase review frequency for predicted struggle topics
    - Timing: Reviews at 1 day, 3 days, 7 days intervals (vs. normal FSRS)
    - Content: Same flashcards, more frequent exposure
  - **Peer learning suggestion (Future):**
    - Action: Recommend study group or tutor session
    - Timing: Before exam, for high-stakes topics
    - Content: External resources, peer discussion prompts
- [ ] 6.3: Implement learning pattern-based tailoring
  - Query UserLearningProfile (from Story 5.1)
  - Adapt interventions:
    - Visual learner → Prioritize diagram-based interventions
    - Morning optimal → Schedule intervention missions at optimal time
    - 45-min sessions → Adjust intervention session length to user preference
    - Kinesthetic learner → Suggest clinical reasoning scenarios
  - Store tailored intervention as `TailoredIntervention` record
- [ ] 6.4: Integrate with Mission Generator (Story 2.4)
  - Modify `MissionGenerator` to accept `InterventionRecommendation[]`
  - Inject intervention tasks into daily missions:
    - Add prerequisite review before predicted struggle topic
    - Adjust mission difficulty based on cognitive load predictions
    - Insert alternative content types
  - Flag missions containing interventions (display intervention reasoning to user)

### Task 7: Implement Prediction Accuracy Tracking (AC: #5, #6, #8)
- [ ] 7.1: Create `PredictionAccuracyTracker` class
  - Method: `recordActualOutcome(predictionId, actualStruggle: boolean): void`
  - Method: `calculateModelAccuracy(timeframe: "week" | "month" | "all"): AccuracyMetrics`
  - Method: `analyzeErrorPatterns(): ErrorAnalysis`
  - Method: `generateModelImprovementPlan(): ImprovementRecommendations`
- [ ] 7.2: Implement outcome capture workflow
  - After user completes studying a predicted topic:
    - Analyze performance: session score, review ratings, validation scores
    - Determine actual struggle: TRUE if performance <65% OR 3+ AGAIN ratings OR validation score <60%
    - Update StrugglePrediction.actualOutcome and predictionStatus (CONFIRMED/FALSE_POSITIVE)
  - Automatic outcome capture (no user action required)
  - Manual correction allowed (user can override if detection is wrong)
- [ ] 7.3: Calculate prediction accuracy metrics
  - **Overall accuracy:** (True Positives + True Negatives) / Total Predictions
  - **Precision:** True Positives / (True Positives + False Positives) - How many predicted struggles were real
  - **Recall:** True Positives / (True Positives + False Negatives) - How many real struggles were caught
  - **F1-score:** Harmonic mean of precision and recall
  - **Calibration:** Compare predicted probability to actual struggle rate per probability bin
  - Target: >75% overall accuracy, >70% recall (prioritize catching struggles)
- [ ] 7.4: Implement error pattern analysis
  - Identify common false positives:
    - Topics predicted to struggle but user performed well
    - Analyze which features were misleading
  - Identify common false negatives:
    - Topics user struggled with but not predicted
    - Analyze which features were missing or underweighted
  - Feature importance recalibration based on errors
  - Create error reports: "Model frequently over-predicts struggles in [topic area]"
- [ ] 7.5: Generate model improvement recommendations
  - Suggest feature engineering improvements (e.g., "Add exam proximity feature")
  - Recommend data collection enhancements (e.g., "Track self-reported difficulty")
  - Propose model architecture changes (e.g., "Switch to gradient boosting for non-linear patterns")
  - Schedule automatic model retraining when accuracy drops below threshold

### Task 8: Build User Feedback Loop (AC: #6)
- [ ] 8.1: Create feedback UI components
  - **Prediction feedback card:**
    - Display: "We predicted you might struggle with [topic]. Did you?"
    - Options: "Yes, I struggled" | "No, it was easier than expected" | "Prediction was helpful"
    - Text input: Optional comments
  - **Intervention effectiveness feedback:**
    - Display: "We recommended [intervention]. How helpful was it?"
    - Options: "Very helpful" | "Somewhat helpful" | "Not helpful" | "Made it worse"
    - Rating: 1-5 stars
- [ ] 8.2: Implement feedback collection workflow
  - Timing: Show feedback prompt after user completes topic
  - Trigger: 24 hours after predicted topic studied OR at next session start
  - Non-intrusive: Small notification, dismissable
  - Persistent: Feedback request available in analytics page
- [ ] 8.3: Integrate feedback into model improvement
  - Feedback as supervised learning signal:
    - "Yes, I struggled" → Confirm True Positive or False Negative
    - "No, it was easier" → Confirm False Positive or True Negative
  - Weight user feedback higher than automatic detection (user is ground truth)
  - Use comments for qualitative analysis (future: NLP to extract features)
  - Track feedback response rate, encourage participation
- [ ] 8.4: Implement feedback-driven model updates
  - Weekly model update cycle:
    - Collect all feedback from past week
    - Retrain model with new data
    - Evaluate performance on test set
    - Deploy updated model if performance improves
  - Feature importance adjustment based on feedback
  - Alert user when model improves: "Prediction accuracy increased to 78% thanks to your feedback!"

### Task 9: Measure Success and Reduction in Difficulties (AC: #8)
- [ ] 9.1: Create `StruggleReductionAnalyzer` class
  - Method: `calculateBaselineStruggleRate(userId, beforeDate): StruggleRate`
  - Method: `calculateCurrentStruggleRate(userId, afterDate): StruggleRate`
  - Method: `measureReduction(): ReductionMetrics`
  - Method: `identifySuccessfulInterventions(): InterventionEffectiveness[]`
- [ ] 9.2: Implement baseline calculation
  - Define struggle rate: (Number of topics with struggle indicators) / (Total topics studied)
  - Baseline period: First 4-6 weeks before predictive system activated
  - Calculate average: reviews with AGAIN ratings, low session scores, low validation scores
  - Store baseline metrics for comparison
- [ ] 9.3: Implement ongoing struggle tracking
  - Post-prediction period: Track struggles after predictive alerts active
  - Compare topics with intervention vs. without intervention
  - Measure: Struggle rate with predictions vs. baseline
  - Track intervention application rate (% of recommendations user followed)
- [ ] 9.4: Calculate reduction metrics
  - **Primary metric:** Percentage reduction in struggle rate
    - Formula: ((Baseline Rate - Current Rate) / Baseline Rate) × 100
    - Target: 25%+ reduction (e.g., 40% baseline → 30% current = 25% reduction)
  - **Secondary metrics:**
    - Average performance improvement on predicted topics
    - Time saved (reduced study time due to fewer struggles)
    - User confidence increase (from confidence calibration)
  - **Intervention effectiveness:**
    - % of predictions with intervention vs. without
    - Struggle rate: intervention applied vs. not applied
    - Most/least effective intervention types
- [ ] 9.5: Build success metrics dashboard
  - Display: "Your struggles reduced by [X%] with predictive support"
  - Chart: Struggle rate over time (baseline → current)
  - Comparison: Performance on predicted vs. unpredicted topics
  - Intervention impact: Show which interventions helped most
  - User testimonial prompt: "Share your success story"

### Task 10: Build Struggle Prediction Dashboard (AC: #2, #3, #4)
- [ ] 10.1: Create `/analytics/struggle-predictions` page
  - Header: "Upcoming Challenges & Interventions"
  - Section 1: Active Predictions (next 7 days)
  - Section 2: Intervention Recommendations
  - Section 3: Prediction Accuracy Trends
  - Section 4: Success Metrics (struggle reduction)
  - Section 5: Feedback Prompts
- [ ] 10.2: Design `StrugglePredictionCard` component
  - Display: Topic name, prediction probability (0-100%), confidence indicator
  - Visual: Progress bar (green <40%, yellow 40-70%, red >70%)
  - Expand: Show feature breakdown (why this prediction was made)
  - Actions: "View Intervention" button, "Not Concerned" dismiss button
  - Icon: Warning icon for high-probability predictions
- [ ] 10.3: Create `InterventionRecommendationPanel` component
  - Display: List of recommended interventions for predicted struggles
  - Each item: Intervention type, description, "Apply to Mission" button
  - Auto-apply option: Toggle to automatically apply high-confidence interventions
  - Effectiveness badge: "This intervention helped 85% of users with similar patterns"
- [ ] 10.4: Build `PredictionAccuracyChart` component
  - Line chart: Prediction accuracy over time (weekly)
  - Metrics display: Precision, Recall, F1-score
  - Comparison: User's model vs. platform average (if available)
  - Trend indicator: "Your model is improving!" or "Needs more data"
- [ ] 10.5: Design `StruggleReductionMetrics` component
  - Big number: "Struggles reduced by 32%" (headline metric)
  - Before/After comparison: Baseline rate vs. current rate
  - Visual: Bar chart comparing struggle rates
  - Timeline: Show reduction progress over weeks/months
  - Call to action: "Keep providing feedback to improve predictions"

### Task 11: Build Struggle Prediction APIs (AC: All)
- [ ] 11.1: Create POST `/api/analytics/predictions/generate` endpoint
  - Triggers struggle prediction analysis for user
  - Body: `{ userId, daysAhead?: number (default 7) }`
  - Runs StruggleDetectionEngine.runPredictions()
  - Returns: `{ predictions: StrugglePrediction[], alerts: StruggleAlert[] }`
- [ ] 11.2: Create GET `/api/analytics/predictions` endpoint
  - Query params: `status?: "pending" | "confirmed" | "false_positive"`, `minProbability?: number (default 0.5)`
  - Returns stored StrugglePrediction records for user
  - Includes associated interventions and alerts
  - Sorted by prediction date ASC (upcoming first)
- [ ] 11.3: Create GET `/api/analytics/interventions` endpoint
  - Returns active InterventionRecommendation records
  - Filtered by user's upcoming missions
  - Includes effectiveness scores (from past similar interventions)
  - Grouped by intervention type
- [ ] 11.4: Create POST `/api/analytics/interventions/:id/apply` endpoint
  - Applies recommended intervention to user's mission queue
  - Body: `{ applyToMissionId?: string }` - Specific mission or next available
  - Updates MissionGenerator to include intervention tasks
  - Returns updated mission with intervention details
- [ ] 11.5: Create POST `/api/analytics/predictions/:id/feedback` endpoint
  - Records user feedback on prediction accuracy
  - Body: `{ actualStruggle: boolean, feedbackType: string, comments?: string }`
  - Updates StrugglePrediction.actualOutcome and creates PredictionFeedback record
  - Triggers model improvement workflow
  - Returns: `{ feedbackRecorded: true, modelAccuracyUpdate?: number }`
- [ ] 11.6: Create GET `/api/analytics/model-performance` endpoint
  - Returns current model accuracy metrics
  - Response: `{ accuracy, precision, recall, f1Score, calibration, lastUpdated, dataPoints }`
  - Includes trend data (accuracy over time)
  - Shows feature importance scores
- [ ] 11.7: Create GET `/api/analytics/struggle-reduction` endpoint
  - Returns struggle reduction metrics
  - Query params: `period?: "week" | "month" | "all"` (default "all")
  - Response: `{ baselineRate, currentRate, reductionPercentage, timeline[], interventionEffectiveness[] }`
  - Calculates reduction since predictive system activated

### Task 12: Integrate with Daily Mission Generation (AC: #7)
- [ ] 12.1: Extend `MissionGenerator` to consume predictions
  - Query active StrugglePrediction records for upcoming objectives
  - Identify objectives with high struggle probability (>0.7) in next 7 days
  - Retrieve associated InterventionRecommendation records
- [ ] 12.2: Implement prediction-aware mission composition
  - **Proactive prerequisite insertion:**
    - If objective has PREREQUISITE_GAP indicator, insert prerequisite review into mission 1-2 days before
    - Example: Mission on Day 1 includes "Review membrane transport", Day 3 includes "Master action potentials" (which requires membrane transport)
  - **Difficulty modulation:**
    - If COMPLEXITY_MISMATCH indicator, reduce mission difficulty
    - Break complex objective into 2-3 smaller objectives
    - Extend estimated time by 25% to reduce pressure
  - **Content format adaptation:**
    - If CONTENT_TYPE_MISMATCH, include alternative content
    - Visual learner struggling with text → Add knowledge graph exploration task
    - Text learner struggling with diagrams → Add written summary review
- [ ] 12.3: Add prediction context to mission display
  - Mission card shows warning badge for predicted struggles
  - Tooltip: "We predict you may struggle with [objective]. We've added [intervention] to help."
  - Expandable section: "Why this prediction?" with feature breakdown
  - Option to dismiss prediction if user disagrees
- [ ] 12.4: Implement post-mission outcome capture
  - After mission completion, analyze performance vs. predictions
  - Record actual outcomes for all predicted objectives
  - Update StrugglePrediction.actualOutcome
  - Feed into PredictionAccuracyTracker for model improvement

### Task 13: Testing and Validation (AC: All)
- [ ] 13.1: Prepare test data with known struggle patterns
  - Create synthetic user with clear patterns:
    - Struggles with physiology topics (low retention, many lapses)
    - Strong in anatomy topics (high retention)
    - Missing prerequisite: cell membrane transport (not studied)
  - Upcoming objective: Action potentials (requires membrane transport prerequisite)
  - Expected prediction: HIGH struggle probability for action potentials due to prerequisite gap
- [ ] 13.2: Test feature extraction accuracy
  - Verify StruggleFeatureExtractor produces expected features:
    - Prerequisite gap feature = 1.0 (missing prerequisite)
    - Historical struggle feature = 0.8 (past physiology struggles)
    - Retention feature = 0.3 (low retention in topic area)
  - Validate feature normalization (all values 0-1)
  - Check data quality score reflects completeness
- [ ] 13.3: Test prediction model accuracy
  - Run predictions on test data
  - Verify high probability (>0.7) for action potentials
  - Check prediction reasoning (which features contributed most)
  - Validate confidence score reflects data quality
  - Compare rule-based vs. ML model predictions (post-MVP)
- [ ] 13.4: Test intervention generation
  - Verify InterventionEngine generates appropriate strategies:
    - Prerequisite review recommendation for membrane transport
    - Content format adaptation if learning style mismatch
    - Difficulty reduction if cognitive overload detected
  - Check intervention tailoring uses UserLearningProfile
  - Validate intervention timing (1-2 days before topic due)
- [ ] 13.5: Test alert system
  - Trigger alert generation for high-probability prediction
  - Verify alert prioritization (urgent topics first)
  - Test notification delivery (in-app, email if enabled)
  - Validate alert display in dashboard and mission briefing
  - Test dismiss/snooze functionality
- [ ] 13.6: Test mission integration
  - Generate mission with predicted struggle objective
  - Verify prerequisite review inserted before main objective
  - Check mission complexity reduced appropriately
  - Validate intervention context displayed in mission card
  - Test post-mission outcome capture
- [ ] 13.7: Test feedback loop and model improvement
  - Submit user feedback on prediction (correct/incorrect)
  - Verify feedback recorded in PredictionFeedback model
  - Check model retraining triggered (weekly cycle)
  - Validate accuracy metrics updated
  - Test improvement notification to user
- [ ] 13.8: Integration testing across stories
  - Story 5.1 (Learning Patterns) → Feature engineering uses behavioral data
  - Story 2.2 (Performance Tracking) → Struggle indicators from performance metrics
  - Story 2.4 (Mission Generation) → Predictions integrated into missions
  - Story 4.1 (Validation) → Validation scores used as struggle indicators
  - End-to-end: Upload lecture → Study → Predict struggle → Apply intervention → Measure reduction

## Dev Notes

### Architecture References

- **Solution Architecture:** `/Users/kyin/Projects/Americano-epic5/docs/solution-architecture.md`
  - Subsystem 5: Behavioral Analytics & Personalization (lines 604-648)
  - Database Schema: `PerformancePrediction` model (lines 1121-1134)
  - API Architecture: `/api/analytics/*` endpoints (lines 1399-1433)

- **PRD:** `/Users/kyin/Projects/Americano-epic5/docs/PRD-Americano-2025-10-14.md`
  - FR6: Behavioral Learning Pattern Analysis (lines 103-108)
  - Epic 5: Behavioral Learning Twin (lines 450-468)
  - Success Criteria: 80% accuracy in predicting struggles (lines 464-467)

- **Epic Breakdown:** `/Users/kyin/Projects/Americano-epic5/docs/epics-Americano-2025-10-14.md`
  - Story 5.2 Details: Lines 720-741
  - Epic 5 Goals and Success Criteria: Lines 674-695

- **Story 5.1 (Learning Patterns):** `/Users/kyin/Projects/Americano-epic5/docs/stories/story-5.1.md`
  - UserLearningProfile model used for intervention tailoring
  - BehavioralPattern model provides historical struggle features
  - Learning style profiling informs content adaptation interventions

### Database Schema Extensions

**Create `StrugglePrediction` model:**
```prisma
model StrugglePrediction {
  id                          String              @id @default(cuid())
  userId                      String
  learningObjectiveId         String?
  topicId                     String?             // Topic or subject area
  predictionDate              DateTime            @default(now())
  predictedStruggleProbability Float              // 0.0-1.0
  predictionConfidence        Float               // 0.0-1.0, based on data quality
  predictionStatus            PredictionStatus    @default(PENDING)
  actualOutcome               Boolean?            // Did user actually struggle?
  outcomeRecordedAt           DateTime?
  featureVector               Json                // Features used for prediction

  // Relations
  learningObjective           LearningObjective?  @relation(fields: [learningObjectiveId], references: [id], onDelete: SetNull)
  indicators                  StruggleIndicator[]
  interventions               InterventionRecommendation[]
  feedbacks                   PredictionFeedback[]

  @@index([userId])
  @@index([predictionDate])
  @@index([predictionStatus])
  @@index([predictedStruggleProbability])
  @@map("struggle_predictions")
}

enum PredictionStatus {
  PENDING         // Not yet studied
  CONFIRMED       // User did struggle (true positive)
  FALSE_POSITIVE  // User didn't struggle (false positive)
  MISSED          // User struggled but not predicted (false negative, recorded retroactively)
}
```

**Create `StruggleIndicator` model:**
```prisma
model StruggleIndicator {
  id                    String         @id @default(cuid())
  userId                String
  predictionId          String?
  learningObjectiveId   String
  indicatorType         IndicatorType
  severity              Severity       @default(MEDIUM)
  detectedAt            DateTime       @default(now())
  context               Json           // Additional metadata

  // Relations
  prediction            StrugglePrediction? @relation(fields: [predictionId], references: [id], onDelete: SetNull)
  learningObjective     LearningObjective   @relation(fields: [learningObjectiveId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([indicatorType])
  @@index([severity])
  @@map("struggle_indicators")
}

enum IndicatorType {
  LOW_RETENTION               // Retention score below threshold
  PREREQUISITE_GAP            // Missing prerequisite knowledge
  COMPLEXITY_MISMATCH         // Content too difficult for current level
  COGNITIVE_OVERLOAD          // User showing fatigue/stress signals
  HISTORICAL_STRUGGLE_PATTERN // Past struggles in similar topics
  TOPIC_SIMILARITY_STRUGGLE   // Struggled with semantically similar topics
}

enum Severity {
  LOW
  MEDIUM
  HIGH
}
```

**Create `InterventionRecommendation` model:**
```prisma
model InterventionRecommendation {
  id                  String             @id @default(cuid())
  predictionId        String
  userId              String
  interventionType    InterventionType
  description         String             @db.Text
  reasoning           String             @db.Text   // Why this intervention
  priority            Int                @default(5) // 1-10
  status              InterventionStatus @default(PENDING)
  appliedAt           DateTime?
  appliedToMissionId  String?
  effectiveness       Float?             // 0.0-1.0, measured post-intervention
  createdAt           DateTime           @default(now())

  // Relations
  prediction          StrugglePrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  mission             Mission?           @relation(fields: [appliedToMissionId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status])
  @@index([priority])
  @@map("intervention_recommendations")
}

enum InterventionType {
  PREREQUISITE_REVIEW     // Review prerequisite objectives
  DIFFICULTY_PROGRESSION  // Start with easier content
  CONTENT_FORMAT_ADAPT    // Alternative content format
  COGNITIVE_LOAD_REDUCE   // Reduce session complexity
  SPACED_REPETITION_BOOST // Increase review frequency
  BREAK_SCHEDULE_ADJUST   // More frequent breaks
}

enum InterventionStatus {
  PENDING     // Not yet applied
  APPLIED     // Applied to mission
  COMPLETED   // User completed intervention
  DISMISSED   // User dismissed recommendation
}
```

**Create `PredictionFeedback` model:**
```prisma
model PredictionFeedback {
  id              String       @id @default(cuid())
  predictionId    String
  userId          String
  feedbackType    FeedbackType
  actualStruggle  Boolean      // User's assessment
  helpfulness     Int?         // 1-5 stars (for intervention feedback)
  comments        String?      @db.Text
  submittedAt     DateTime     @default(now())

  // Relations
  prediction      StrugglePrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([feedbackType])
  @@map("prediction_feedbacks")
}

enum FeedbackType {
  HELPFUL           // Prediction was helpful
  NOT_HELPFUL       // Prediction wasn't helpful
  INACCURATE        // Prediction was wrong
  INTERVENTION_GOOD // Intervention worked well
  INTERVENTION_BAD  // Intervention didn't help
}
```

**Extend `Mission` model (add relation):**
```prisma
model Mission {
  // ... existing fields ...

  // Add relation
  interventions   InterventionRecommendation[]
}
```

**Extend `LearningObjective` model (add relation):**
```prisma
model LearningObjective {
  // ... existing fields ...

  // Add relations
  strugglePredictions  StrugglePrediction[]
  struggleIndicators   StruggleIndicator[]
}
```

### Key Algorithms

**Feature Engineering for Struggle Prediction:**
```typescript
interface FeatureVector {
  // Performance features (0-1 normalized)
  retentionScore: number;           // Average retention for topic area
  retentionDeclineRate: number;     // Rate of retention degradation
  reviewLapseRate: number;          // Frequency of AGAIN ratings
  sessionPerformanceScore: number;  // Recent session performance
  validationScore: number;          // Validation prompt scores

  // Prerequisite features
  prerequisiteGapCount: number;     // Number of unmastered prerequisites
  prerequisiteMasteryGap: number;   // Avg mastery gap for prerequisites

  // Complexity features
  contentComplexity: number;        // Objective difficulty level
  complexityMismatch: number;       // Difficulty vs. user ability gap

  // Behavioral features
  historicalStruggleScore: number;  // Past struggles in similar topics
  contentTypeMismatch: number;      // Content format vs. learning style
  cognitiveLoadIndicator: number;   // Current cognitive load level

  // Contextual features
  daysUntilExam: number;            // Urgency factor (normalized)
  daysSinceLastStudy: number;       // Recency (normalized)
  workloadLevel: number;            // Current workload (normalized)
}

function extractFeatures(userId: string, objectiveId: string): FeatureVector {
  // 1. Performance features
  const retentionData = getRetentionData(userId, objectiveTopicArea);
  const reviewHistory = getReviewHistory(userId, objectiveId);

  const retentionScore = calculateAverageRetention(retentionData, 30); // Last 30 days
  const retentionDeclineRate = calculateDeclineRate(retentionData);
  const reviewLapseRate = reviewHistory.filter(r => r.rating === "AGAIN").length / reviewHistory.length;
  const sessionPerformanceScore = getRecentSessionPerformance(userId, objectiveTopicArea);
  const validationScore = getValidationPromptAverage(userId, objectiveId);

  // 2. Prerequisite features
  const prerequisites = getPrerequisites(objectiveId);
  const prerequisiteMastery = prerequisites.map(p => getMasteryLevel(userId, p.id));
  const prerequisiteGapCount = prerequisiteMastery.filter(m => m < 0.7).length / prerequisites.length;
  const prerequisiteMasteryGap = 1 - mean(prerequisiteMastery);

  // 3. Complexity features
  const objective = getObjective(objectiveId);
  const userAbilityLevel = getUserAbilityLevel(userId, objectiveTopicArea);
  const contentComplexity = complexityToNumber(objective.complexity); // BASIC=0.3, INTERMEDIATE=0.6, ADVANCED=0.9
  const complexityMismatch = Math.max(0, contentComplexity - userAbilityLevel);

  // 4. Behavioral features
  const learningPatterns = getBehavioralPatterns(userId);
  const historicalStruggles = learningPatterns.filter(p => p.patternType === "STRUGGLE_TOPIC" && p.patternData.topicArea === objectiveTopicArea);
  const historicalStruggleScore = historicalStruggles.length > 0 ? mean(historicalStruggles.map(s => s.confidence)) : 0;

  const learningProfile = getUserLearningProfile(userId);
  const contentType = inferContentType(objective); // "text", "visual", "clinical"
  const preferredType = getPreferredContentType(learningProfile.learningStyleProfile);
  const contentTypeMismatch = contentType !== preferredType ? 0.6 : 0;

  const cognitiveLoadData = getCognitiveLoadIndicators(userId);
  const cognitiveLoadIndicator = cognitiveLoadData.fatigueLevel; // 0-1

  // 5. Contextual features
  const upcomingExam = getNextExamForTopic(userId, objectiveTopicArea);
  const daysUntilExam = upcomingExam ? Math.max(0, daysBetween(now, upcomingExam.date)) / 90 : 1; // Normalize to 0-1 (90 days max)

  const lastStudy = getLastStudySession(userId, objectiveTopicArea);
  const daysSinceLastStudy = lastStudy ? Math.min(1, daysBetween(lastStudy.date, now) / 30) : 0.5; // Normalize to 0-1 (30 days max)

  const pendingObjectives = getPendingObjectivesCount(userId);
  const workloadLevel = Math.min(1, pendingObjectives / 50); // Normalize (50 objectives = max workload)

  return {
    retentionScore,
    retentionDeclineRate,
    reviewLapseRate,
    sessionPerformanceScore,
    validationScore,
    prerequisiteGapCount,
    prerequisiteMasteryGap,
    contentComplexity,
    complexityMismatch,
    historicalStruggleScore,
    contentTypeMismatch,
    cognitiveLoadIndicator,
    daysUntilExam,
    daysSinceLastStudy,
    workloadLevel
  };
}
```

**Rule-Based Prediction Model (MVP):**
```typescript
function predictStruggle(featureVector: FeatureVector): PredictionResult {
  // High struggle probability (>0.7)
  if (
    featureVector.retentionScore < 0.5 ||
    featureVector.prerequisiteGapCount > 0.5 || // 50%+ prerequisites unmastered
    featureVector.complexityMismatch > 0.6 ||
    featureVector.historicalStruggleScore > 0.7
  ) {
    const probability = 0.7 + (0.3 * (
      (1 - featureVector.retentionScore) * 0.3 +
      featureVector.prerequisiteGapCount * 0.3 +
      featureVector.complexityMismatch * 0.2 +
      featureVector.historicalStruggleScore * 0.2
    ));

    return { probability: Math.min(1.0, probability), confidence: calculateConfidence(featureVector) };
  }

  // Medium struggle probability (0.4-0.7)
  if (
    featureVector.retentionScore < 0.7 ||
    featureVector.prerequisiteGapCount > 0.2 ||
    featureVector.contentTypeMismatch > 0.5 ||
    featureVector.cognitiveLoadIndicator > 0.7
  ) {
    const probability = 0.4 + (0.3 * (
      (1 - featureVector.retentionScore) * 0.4 +
      featureVector.prerequisiteGapCount * 0.3 +
      featureVector.contentTypeMismatch * 0.2 +
      featureVector.cognitiveLoadIndicator * 0.1
    ));

    return { probability, confidence: calculateConfidence(featureVector) };
  }

  // Low struggle probability (<0.4)
  const probability = 0.1 + (0.3 * (
    (1 - featureVector.retentionScore) * 0.3 +
    featureVector.daysSinceLastStudy * 0.3 +
    featureVector.workloadLevel * 0.2 +
    (1 - featureVector.sessionPerformanceScore) * 0.2
  ));

  return { probability: Math.max(0, probability), confidence: calculateConfidence(featureVector) };
}

function calculateConfidence(featureVector: FeatureVector): number {
  // Confidence based on data sufficiency
  const featureCount = Object.values(featureVector).filter(v => v !== 0.5).length; // Non-default values
  const totalFeatures = Object.keys(featureVector).length;

  const dataSufficiency = featureCount / totalFeatures;

  // Additional confidence factors
  const hasHistoricalData = featureVector.historicalStruggleScore > 0 ? 1.0 : 0.5;
  const hasPrerequisiteData = featureVector.prerequisiteGapCount >= 0 ? 1.0 : 0.5;

  return (dataSufficiency * 0.6 + hasHistoricalData * 0.2 + hasPrerequisiteData * 0.2);
}
```

**Logistic Regression Model (Post-MVP):**
```typescript
// Training data structure
interface TrainingExample {
  features: FeatureVector;
  label: number; // 1 = struggled, 0 = didn't struggle
}

// Train logistic regression model
function trainLogisticRegression(trainingData: TrainingExample[]): ModelWeights {
  // Initialize weights (one per feature + bias)
  let weights = initializeWeights(featureCount + 1);
  const learningRate = 0.01;
  const epochs = 1000;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const example of trainingData) {
      const x = [1, ...Object.values(example.features)]; // Add bias term
      const y = example.label;

      // Sigmoid: P(struggle) = 1 / (1 + e^-(w·x))
      const z = dotProduct(weights, x);
      const prediction = 1 / (1 + Math.exp(-z));

      // Gradient descent update
      const error = prediction - y;
      for (let i = 0; i < weights.length; i++) {
        weights[i] -= learningRate * error * x[i];
      }
    }
  }

  return weights;
}

// Predict using trained model
function predictWithLogisticRegression(weights: number[], featureVector: FeatureVector): number {
  const x = [1, ...Object.values(featureVector)]; // Add bias term
  const z = dotProduct(weights, x);
  const probability = 1 / (1 + Math.exp(-z));
  return probability;
}
```

**Intervention Strategy Selection:**
```typescript
function generateInterventions(prediction: StrugglePrediction, indicators: StruggleIndicator[]): Intervention[] {
  const interventions: Intervention[] = [];

  // 1. Prerequisite gap → Prerequisite review
  const prerequisiteGaps = indicators.filter(i => i.indicatorType === "PREREQUISITE_GAP");
  if (prerequisiteGaps.length > 0) {
    interventions.push({
      type: "PREREQUISITE_REVIEW",
      description: `Review prerequisite topics before studying ${prediction.topicName}`,
      reasoning: `You have ${prerequisiteGaps.length} unmastered prerequisites. Reviewing these first will improve understanding.`,
      priority: 9, // High priority
      actions: prerequisiteGaps.map(gap => ({
        action: "SCHEDULE_REVIEW",
        objectiveId: gap.context.prerequisiteId,
        timing: "1-2 days before main topic"
      }))
    });
  }

  // 2. Complexity mismatch → Difficulty progression
  const complexityMismatches = indicators.filter(i => i.indicatorType === "COMPLEXITY_MISMATCH");
  if (complexityMismatches.length > 0) {
    interventions.push({
      type: "DIFFICULTY_PROGRESSION",
      description: "Start with foundational content before tackling advanced concepts",
      reasoning: "This topic is more complex than your current level. Building up gradually will improve retention.",
      priority: 8,
      actions: [{
        action: "INSERT_INTRODUCTORY_CONTENT",
        contentLevel: "BASIC",
        timing: "Before main topic"
      }]
    });
  }

  // 3. Content type mismatch → Format adaptation
  const contentMismatches = indicators.filter(i => i.indicatorType === "CONTENT_TYPE_MISMATCH");
  if (contentMismatches.length > 0) {
    const learningStyle = contentMismatches[0].context.learningStyle; // e.g., "visual"
    const alternativeFormat = getAlternativeFormat(prediction.contentType, learningStyle);

    interventions.push({
      type: "CONTENT_FORMAT_ADAPT",
      description: `Use ${alternativeFormat} content to match your learning style`,
      reasoning: `You're a ${learningStyle} learner, but this topic is primarily ${prediction.contentType}. Alternative formats will help.`,
      priority: 7,
      actions: [{
        action: "ADD_ALTERNATIVE_CONTENT",
        format: alternativeFormat,
        timing: "Concurrent with main content"
      }]
    });
  }

  // 4. Cognitive overload → Load reduction
  const cognitiveOverload = indicators.filter(i => i.indicatorType === "COGNITIVE_OVERLOAD");
  if (cognitiveOverload.length > 0) {
    interventions.push({
      type: "COGNITIVE_LOAD_REDUCE",
      description: "Break this topic into smaller chunks with more breaks",
      reasoning: "You're showing signs of cognitive fatigue. Reducing workload will improve focus.",
      priority: 8,
      actions: [
        { action: "REDUCE_MISSION_DURATION", percentage: 50 },
        { action: "ADD_BREAK_REMINDERS", frequency: "Every 20 minutes" }
      ]
    });
  }

  // 5. Historical struggle pattern → Spaced repetition boost
  const historicalStruggles = indicators.filter(i => i.indicatorType === "HISTORICAL_STRUGGLE_PATTERN");
  if (historicalStruggles.length > 0) {
    interventions.push({
      type: "SPACED_REPETITION_BOOST",
      description: "Increase review frequency for this topic area",
      reasoning: "You've struggled with similar topics before. More frequent reviews will strengthen retention.",
      priority: 6,
      actions: [{
        action: "ADJUST_REVIEW_SCHEDULE",
        intervals: [1, 3, 7], // Days (vs. normal FSRS)
        duration: "2 weeks"
      }]
    });
  }

  return interventions.sort((a, b) => b.priority - a.priority);
}
```

### Integration Points

**With Story 5.1 (Learning Pattern Analysis):**
- Uses `UserLearningProfile` for feature engineering:
  - Learning style profile → Content type mismatch detection
  - Optimal study times → Cognitive load context
  - Forgetting curve → Retention decline prediction
  - Behavioral patterns → Historical struggle features

**With Story 2.2 (Performance Tracking):**
- Uses `PerformanceMetric` model for struggle detection:
  - Retention scores → Primary feature for prediction
  - Weakness identification → Struggle indicators
  - Performance trends → Decline rate calculation

**With Story 2.4 (Mission Generation):**
- `MissionGenerator` consumes predictions:
  - Proactive prerequisite insertion
  - Difficulty modulation based on predictions
  - Intervention tasks added to missions
  - Warning banners for predicted struggles

**With Story 4.1 (Understanding Validation):**
- Validation scores as struggle indicators:
  - Low validation scores (<60%) → Struggle indicator
  - Confidence calibration → Overconfidence detection
  - Comprehension metrics → True understanding vs. memorization

**With Story 1.6 (Study Sessions):**
- Real-time struggle detection during sessions:
  - Performance degradation → Create struggle indicator
  - Review lapse patterns → Update predictions
  - Session completion quality → Outcome capture

### Technical Constraints

1. **Minimum Data Requirements:**
   - Model training: 50+ examples (struggled vs. didn't struggle) for logistic regression
   - Feature engineering: 4+ weeks of study history for reliable patterns
   - Graceful degradation: Rule-based model until sufficient training data

2. **Prediction Frequency:**
   - Daily batch predictions for upcoming 7-14 days
   - On-demand predictions allowed (rate-limited: max 3/day)
   - Real-time struggle indicators during active sessions

3. **Model Performance Targets:**
   - Overall accuracy: >75%
   - Recall (catch struggles): >70% (prioritize over precision)
   - Precision (avoid false alarms): >65%
   - Calibration: Predicted probability ±10% of actual rate

4. **Privacy and Ethics:**
   - All predictions stored with userId (never shared)
   - User can disable predictive features (opt-out)
   - Clear explanations: "Why this prediction?" transparency
   - No punitive consequences for predicted struggles

5. **Performance Optimization:**
   - Feature extraction: Cache intermediate calculations (1 hour TTL)
   - Batch predictions: Process daily (not per-request)
   - Model inference: <100ms per prediction
   - Database queries: Use indexes on predictionDate, userId, probability

6. **Model Evolution:**
   - Weekly automatic retraining with new feedback data
   - Feature importance recalculation monthly
   - A/B testing for model changes (MVP: manual, Post-MVP: automated)
   - Model versioning: Track which model version made each prediction

### Testing Strategy

**Unit Tests (Deferred to Production):**
- Test feature extraction with mock user data
- Validate prediction model accuracy with known examples
- Test intervention generation logic
- Verify feedback loop updates model correctly

**Manual Testing (MVP Approach):**
1. **Setup test scenario:**
   - User with 6 weeks of study history
   - Clear pattern: Struggles with physiology (30% retention), strong in anatomy (85% retention)
   - Upcoming topic: Cardiac electrophysiology (physiology, complex)
   - Missing prerequisite: Action potential basics

2. **Test feature extraction:**
   - Verify low retention feature (0.3) for physiology
   - Confirm prerequisite gap detected (action potential unmastered)
   - Check complexity mismatch (advanced topic, intermediate user)
   - Validate historical struggle feature (past physiology struggles)

3. **Test prediction generation:**
   - Run prediction for cardiac electrophysiology
   - Expected: High probability (>0.7) due to multiple risk factors
   - Verify confidence score reflects data quality
   - Check feature breakdown shows top contributors

4. **Test intervention generation:**
   - Verify prerequisite review recommended (action potential)
   - Check difficulty progression suggested (start with basic EP concepts)
   - Validate spaced repetition boost for physiology topics
   - Confirm interventions prioritized correctly

5. **Test mission integration:**
   - Generate daily mission with cardiac EP objective
   - Verify prerequisite review inserted 1 day before
   - Check mission complexity reduced
   - Validate warning banner displayed

6. **Test feedback and model improvement:**
   - User completes topic (performs poorly, struggles confirmed)
   - Record feedback: "Yes, I struggled"
   - Verify prediction marked as CONFIRMED (true positive)
   - Check accuracy metrics updated
   - Trigger model retraining (manual for MVP)

**Edge Cases to Test:**
- User with insufficient data (<4 weeks) → Low confidence predictions
- User with no historical struggles → Baseline probability predictions
- User opts out of predictions → Feature disabled, data deleted
- Prediction for already mastered topic → Low probability despite other factors
- Multiple conflicting indicators → Model weights most important features

### UI/UX Considerations

**Design System Compliance:**
- All prediction UI uses glassmorphism (bg-white/80 backdrop-blur-md)
- OKLCH colors for probability visualization:
  - Low probability (<40%): oklch(0.7 0.12 145) - Green
  - Medium probability (40-70%): oklch(0.8 0.15 85) - Yellow
  - High probability (>70%): oklch(0.6 0.15 25) - Red
- NO gradients (per design system)
- Icons: Warning triangle for high probability, info circle for medium
- Responsive layouts: Desktop (detailed feature breakdown), mobile (summary cards)

**Accessibility:**
- Probability displayed as both number (75%) and visual indicator (color + icon)
- Screen reader descriptions: "High struggle probability, 75% confidence, review prerequisites recommended"
- Keyboard navigation for intervention cards
- Focus states on all interactive elements
- Alt text for prediction reasoning charts

**User Flow:**
1. User studies consistently for 6 weeks (building data)
2. Predictive system activates (sufficient data threshold reached)
3. Dashboard shows "New Feature: Struggle Predictions" announcement
4. User views upcoming predictions on analytics page
5. High-probability prediction shown for upcoming topic
6. User expands to see "Why this prediction?" feature breakdown
7. Intervention recommendations displayed with "Apply to Mission" buttons
8. User applies intervention (or dismisses if disagrees)
9. Next day: Mission includes prerequisite review (intervention applied)
10. User completes topic
11. Feedback prompt: "Did you struggle?" → User responds
12. Prediction accuracy updated, model improves
13. Over weeks: User sees struggle reduction metrics, improved predictions

**Notification Strategy:**
- **High-priority alerts (>0.8 probability, <3 days):** Push notification + email
- **Medium-priority alerts (0.5-0.8 probability):** In-app notification badge
- **Low-priority predictions (<0.5):** Dashboard display only (no active notification)
- **Frequency limits:** Max 1 push notification per day for predictions
- **Snooze option:** Dismiss alert for 24 hours
- **Opt-out:** Disable all prediction notifications in settings

### Performance Optimizations

1. **Feature Extraction Caching:**
   - Cache UserLearningProfile for 1 hour (reduce DB queries)
   - Cache BehavioralPatterns for 12 hours (patterns change slowly)
   - Cache performance metrics for 30 minutes (balance freshness vs. load)

2. **Batch Processing:**
   - Daily prediction batch (11 PM) for next 7-14 days
   - Incremental updates: Only re-predict if new data available
   - Background job queue for model retraining

3. **Database Optimization:**
   - Index on (userId, predictionDate, predictedStruggleProbability)
   - Paginate historical predictions (limit 50 per query)
   - Archive old predictions (>90 days) to separate table

4. **Model Inference:**
   - Feature vector calculation: <50ms
   - Rule-based prediction: <10ms
   - Logistic regression prediction: <20ms
   - Total per prediction: <100ms target

5. **API Response Times:**
   - GET /api/analytics/predictions: <200ms (cached)
   - POST /api/analytics/predictions/generate: <2s (background job)
   - POST /api/analytics/predictions/:id/feedback: <100ms

### References

- **Source:** Epic 5, Story 5.2 (epics-Americano-2025-10-14.md:720-741)
- **Source:** Solution Architecture, Subsystem 5 (solution-architecture.md:604-648)
- **Source:** Database Schema, Behavioral Analytics Models (solution-architecture.md:1073-1134)
- **Source:** PRD FR6, Epic 5 (PRD-Americano-2025-10-14.md:103-108, 450-468)
- **Source:** Story 5.1 - Learning Pattern Recognition (story-5.1.md)
- **Reference:** Logistic Regression for Binary Classification (external: scikit-learn documentation)
- **Reference:** Feature Engineering for ML (external: Google ML Crash Course)
- **Reference:** Predictive Modeling Best Practices (external: Elements of Statistical Learning)

## Dev Agent Record

### Context Reference

- Story Context: `/Users/kyin/Projects/Americano-epic5/docs/stories/story-context-5.2.xml`

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
