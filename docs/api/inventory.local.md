# Backend API Inventory (local scan)

## /adaptive — /Users/kyin/Projects/Americano/apps/api/src/adaptive/routes.py
- Tags: adaptive
- Endpoints: 2

method path — function [status] → response_model
- Params | Dependencies | Summary
- POST  /adaptive/question/next                  — get_next_question → NextQuestionResponse
  - Params: request: NextQuestionRequest
  - Deps: (none)
  - Summary: Get next adaptive question
- GET   /adaptive/session/{session_id}/metrics   — get_session_metrics → SessionMetricsResponse
  - Params: session_id: str, objective_id: str
  - Deps: (none)
  - Summary: Get session IRT metrics

## /analytics — /Users/kyin/Projects/Americano/apps/api/src/analytics/routes.py
- Tags: analytics
- Endpoints: 14

method path — function [status] → response_model
- Params | Dependencies | Summary
- POST  /analytics/daily-insight                 — get_daily_insight [status.HTTP_200_OK] → DailyInsight
  - Params: request: RecommendationsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Get daily insight
- POST  /analytics/weekly-summary                — get_weekly_summary [status.HTTP_200_OK]
  - Params: request: RecommendationsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Get weekly summary
- POST  /analytics/interventions                 — get_interventions [status.HTTP_200_OK]
  - Params: request: RecommendationsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Get intervention suggestions
- GET   /analytics/time-to-mastery/{objective_id} — get_time_to_mastery [status.HTTP_200_OK]
  - Params: objective_id: str, user_id: str, session: AsyncSession
  - Deps: get_db_session
  - Summary: Estimate time to mastery
- GET   /analytics/success-probability/{objective_id} — get_success_probability [status.HTTP_200_OK] → dict
  - Params: objective_id: str, user_id: str, planned_hours: int, session: AsyncSession
  - Deps: get_db_session
  - Summary: Predict success probability
- POST  /analytics/recommendations               — get_comprehensive_recommendations [status.HTTP_200_OK] → RecommendationData
  - Params: request: RecommendationsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Get comprehensive recommendations
- POST  /analytics/predictions                   — get_predictions [status.HTTP_200_OK] → UnderstandingPrediction
  - Params: request: PredictionsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Get predictive analytics
- POST  /analytics/patterns                      — get_comprehension_patterns [status.HTTP_200_OK] → ComprehensionPattern
  - Params: request: PatternsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Analyze comprehension patterns
- POST  /analytics/longitudinal                  — get_longitudinal_metrics [status.HTTP_200_OK] → LongitudinalMetric
  - Params: request: LongitudinalRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Track longitudinal progress
- POST  /analytics/correlations                  — get_correlations [status.HTTP_200_OK] → CorrelationMatrix
  - Params: request: CorrelationsRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Analyze cross-objective correlations
- POST  /analytics/peer-benchmark                — get_peer_benchmark [status.HTTP_200_OK] → PeerBenchmark
  - Params: request: PeerBenchmarkRequest, session: AsyncSession
  - Deps: get_db_session
  - Summary: Compare performance with peers
- GET   /analytics/understanding/dashboard       — get_dashboard_summary [status.HTTP_200_OK] → DashboardSummary
  - Params: user_id: str, time_range: Any, session: AsyncSession
  - Deps: get_db_session
  - Summary: Get comprehensive dashboard summary
- GET   /analytics/understanding/comparison      — get_comparison_analytics [status.HTTP_200_OK] → ComparisonResult
  - Params: user_id: str, peer_group: Any, session: AsyncSession
  - Deps: get_db_session
  - Summary: Compare user performance with peers
- GET   /analytics/health                        — health_check [status.HTTP_200_OK] → dict
  - Params: (none)
  - Deps: (none)
  - Summary: Analytics service health check

## /challenge — /Users/kyin/Projects/Americano/apps/api/src/challenge/routes.py
- Tags: challenge
- Endpoints: 4

method path — function [status] → response_model
- Params | Dependencies | Summary
- POST  /challenge/feedback                      — generate_feedback → FeedbackResponse
  - Params: request: FeedbackRequest
  - Deps: (none)
  - Summary: Generate corrective feedback for failed challenge
- POST  /challenge/schedule-retries              — schedule_retries → RetryScheduleResponse
  - Params: request: RetryScheduleRequest
  - Deps: (none)
  - Summary: Schedule spaced repetition retries for failed challenge
- POST  /challenge/detect-patterns               — detect_patterns → PatternDetectionResponse
  - Params: request: PatternDetectionRequest
  - Deps: (none)
  - Summary: Detect failure patterns for a user
- POST  /challenge/detect-patterns-with-data     — detect_patterns_with_data → PatternDetectionResponse
  - Params: user_id: str, failures: Any, min_frequency: int, lookback_days: int
  - Deps: (none)
  - Summary: Detect patterns with provided failure data

## /validation — /Users/kyin/Projects/Americano/apps/api/src/validation/routes.py
- Tags: validation
- Endpoints: 8

method path — function [status] → response_model
- Params | Dependencies | Summary
- POST  /validation/generate-prompt              — generate_prompt [status.HTTP_200_OK] → PromptGenerationResponse
  - Params: request: PromptGenerationRequest
  - Deps: (none)
  - Summary: Generate comprehension prompt
- POST  /validation/evaluate                     — evaluate_comprehension [status.HTTP_200_OK] → EvaluationResult
  - Params: request: EvaluationRequest
  - Deps: (none)
  - Summary: Evaluate user comprehension
- POST  /validation/scenarios/generate           — generate_clinical_scenario [status.HTTP_200_OK] → ScenarioGenerationResponse
  - Params: request: ScenarioGenerationRequest
  - Deps: (none)
  - Summary: Generate clinical case scenario
- POST  /validation/scenarios/evaluate           — evaluate_clinical_reasoning [status.HTTP_200_OK] → ClinicalEvaluationResult
  - Params: request: ClinicalEvaluationRequest
  - Deps: (none)
  - Summary: Evaluate clinical reasoning
- GET   /validation/scenarios/metrics            — get_clinical_metrics [status.HTTP_200_OK] → dict
  - Params: dateRange: str, scenarioType: str
  - Deps: (none)
  - Summary: Get clinical reasoning performance metrics
- GET   /validation/scenarios/{scenario_id}      — get_scenario [status.HTTP_200_OK] → ScenarioGenerationResponse
  - Params: scenario_id: str
  - Deps: (none)
  - Summary: Get clinical scenario by ID
- POST  /validation/challenge/identify           — identify_vulnerable_concepts [status.HTTP_200_OK] → ChallengeIdentificationResult
  - Params: request: ChallengeIdentificationRequest
  - Deps: (none)
  - Summary: Identify vulnerable concepts
- POST  /validation/challenge/generate           — generate_challenge_question [status.HTTP_200_OK] → ChallengeQuestionResponse
  - Params: request: ChallengeGenerationRequest
  - Deps: (none)
  - Summary: Generate challenge question

