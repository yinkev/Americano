/**
 * Analytics API Hooks (Story 4.6)
 *
 * React Query hooks for comprehensive understanding analytics:
 * - useDailyInsight: Daily priority recommendation
 * - useWeeklySummary: Top 3 weekly objectives
 * - useInterventions: Pattern-based intervention suggestions
 * - useTimeToMastery: Mastery time estimates
 * - useSuccessProbability: Success prediction for planned hours
 * - useRecommendations: Comprehensive recommendations
 * - usePredictions: ML-powered predictions (exam, forgetting, mastery)
 * - usePatterns: Comprehension patterns analysis
 * - useLongitudinal: Historical progress tracking
 * - useCorrelations: Cross-objective correlation analysis
 * - usePeerBenchmark: Anonymized peer comparison
 * - useUnderstandingDashboard: Dashboard summary
 * - useUnderstandingComparison: Peer dimension comparison
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type {
  ComparisonResult,
  ComprehensionPattern,
  CorrelationMatrix,
  CorrelationsRequest,
  DailyInsight,
  DashboardSummary,
  InterventionSuggestion,
  LongitudinalMetric,
  LongitudinalRequest,
  PatternsRequest,
  PeerBenchmark,
  PeerBenchmarkRequest,
  PredictionsRequest,
  RecommendationData,
  TimeToMasteryEstimate,
  UnderstandingPrediction,
  WeeklyTopObjective,
} from './types/generated'
import {
  attachSource,
  type AnalyticsDateRange,
  type SourceTagged,
  type SuccessProbabilityResponse,
} from './analytics.shared'
import {
  createMockComparison,
  createMockCorrelations,
  createMockDailyInsight,
  createMockDashboard,
  createMockInterventions,
  createMockLongitudinal,
  createMockPatterns,
  createMockPeerBenchmark,
  createMockPredictions,
  createMockRecommendations,
  createMockSuccessProbability,
  createMockTimeToMastery,
  createMockWeeklySummary,
} from './analytics.mock-data'
import {
  analyticsKeys,
  frequentQueryOptions,
  moderateQueryOptions,
  stableQueryOptions,
} from './utils'
import {
  ANALYTICS_MOCK_METADATA_SYMBOL,
  type AnalyticsMockMetadata,
} from '@/lib/mocks/analytics'

type MockableData = Record<string, unknown> | any[]
type LongitudinalDimension = 'comprehension' | 'reasoning' | 'calibration' | 'mastery'

export function resolveAnalyticsSource(data: MockableData | null | undefined): DataSource {
  if (!data || typeof data !== 'object') {
    return 'api'
  }

  const metadata = Reflect.get(data, ANALYTICS_MOCK_METADATA_SYMBOL) as
    | AnalyticsMockMetadata
    | undefined

  if (metadata?.source === 'mock') {
    return 'mock'
  }

  return 'api'
}

async function fetchWithMock<T extends MockableData>(
  request: () => Promise<T>,
  mock: () => SourceTagged<T>,
  label: string,
): Promise<SourceTagged<T>> {
  try {
    const data = await request()
    return attachSource(data, resolveAnalyticsSource(data))
  } catch (error) {
    console.warn(`[analytics] ${label} request failed – using mock data`, error)
    return mock()
  }
}

async function fetchNullableWithMock<T extends Record<string, unknown>>(
  request: () => Promise<T | null>,
  mock: () => SourceTagged<T>,
  label: string,
): Promise<SourceTagged<T> | null> {
  try {
    const data = await request()
    if (!data) {
      return null
    }
    return attachSource(data, resolveAnalyticsSource(data))
  } catch (error) {
    console.warn(`[analytics] ${label} request failed – using mock data`, error)
    return mock()
  }
}

// ============================================================================
// Daily Insight
// ============================================================================

/**
 * Get single highest-priority recommendation for today
 *
 * Priority scoring:
 * 1. Dangerous gaps (overconfidence + low score)
 * 2. Bottleneck objectives (blocking others)
 * 3. Weaknesses (bottom 10%)
 * 4. Optimization opportunities
 *
 * Returns actionable insight with 2-4 action items.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDailyInsight("user_123");
 *
 * if (data) {
 *   console.log(data.priority_objective_name);
 *   console.log(data.action_items); // ["Review lecture notes", "Complete 5 questions"]
 *   console.log(data.estimated_time_minutes); // 45
 *   console.log(data.reasoning); // Why this objective
 * }
 * ```
 */
export function useDailyInsight(userId: string | null) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.dailyInsight(userId || ''),
    queryFn: () =>
      fetchWithMock(
        () => api.post<DailyInsight>('/analytics/daily-insight', { user_id: userId as string }),
        () => createMockDailyInsight(resolvedUserId),
        'daily insight',
      ),
    ...frequentQueryOptions,
    enabled: !!userId,
    refetchInterval: 60 * 60 * 1000, // Refresh every hour
  })
}

// ============================================================================
// Weekly Summary
// ============================================================================

/**
 * Get top 3 objectives to focus on this week
 *
 * Uses ChatMock (GPT-5) via instructor to generate AI rationale for each.
 * Returns exactly 3 objectives with estimated study hours.
 *
 * @example
 * ```tsx
 * const { data } = useWeeklySummary("user_123");
 *
 * if (data) {
 *   data.forEach(obj => {
 *     console.log(obj.objective_name);
 *     console.log(obj.rationale); // AI-generated, 50-200 chars
 *     console.log(obj.estimated_hours); // 8
 *   });
 * }
 * ```
 */
export function useWeeklySummary(userId: string | null) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.weeklySummary(userId || ''),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.post<WeeklyTopObjective[]>('/analytics/weekly-summary', { user_id: userId as string }),
        () => createMockWeeklySummary(resolvedUserId),
        'weekly summary',
      ),
    ...frequentQueryOptions,
    enabled: !!userId,
    refetchInterval: 60 * 60 * 1000, // Refresh every hour
  })
}

// ============================================================================
// Interventions
// ============================================================================

/**
 * Get pattern-based intervention suggestions
 *
 * Analyzes user patterns to detect:
 * - Overconfidence → More failure challenges
 * - Weak reasoning → Clinical scenarios
 * - Poor retention → Spaced repetition
 * - Bottleneck detected → Foundational review
 * - Regression detected → Immediate review
 *
 * @example
 * ```tsx
 * const { data } = useInterventions("user_123");
 *
 * if (data) {
 *   data.forEach(intervention => {
 *     console.log(intervention.pattern_detected); // "Overconfidence"
 *     console.log(intervention.intervention_type); // "Controlled Failure"
 *     console.log(intervention.description);
 *     console.log(intervention.estimated_time_minutes); // 30
 *   });
 * }
 * ```
 */
export function useInterventions(userId: string | null) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.interventions(userId || ''),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.post<InterventionSuggestion[]>('/analytics/interventions', { user_id: userId as string }),
        () => createMockInterventions(resolvedUserId),
        'interventions',
      ),
    ...frequentQueryOptions,
    enabled: !!userId,
  })
}

// ============================================================================
// Time to Mastery
// ============================================================================

/**
 * Estimate hours needed to reach mastery (80% threshold)
 *
 * Uses linear extrapolation from recent performance trends.
 * Returns null if already mastered or mastery unlikely.
 *
 * @param objectiveId - Learning objective ID
 * @param userId - User ID
 *
 * @example
 * ```tsx
 * const { data } = useTimeToMastery("obj_123", "user_456");
 *
 * if (data) {
 *   console.log(data.current_score); // 72
 *   console.log(data.hours_to_mastery); // 12.5
 *   console.log(data.weeks_to_mastery); // 1.8
 * } else {
 *   console.log("Already mastered or insufficient data");
 * }
 * ```
 */
export function useTimeToMastery(objectiveId: string | null, userId: string | null) {
  const resolvedObjectiveId = objectiveId ?? 'objective-demo'
  return useQuery({
    queryKey: analyticsKeys.timeToMastery(objectiveId || '', userId || ''),
    queryFn: () =>
      fetchNullableWithMock(
        () =>
          api.get<TimeToMasteryEstimate | null>(`/analytics/time-to-mastery/${objectiveId}`, {
            user_id: userId || undefined,
          }),
        () => createMockTimeToMastery(resolvedObjectiveId),
        'time to mastery',
      ),
    ...frequentQueryOptions,
    enabled: !!objectiveId && !!userId,
  })
}

// ============================================================================
// Success Probability
// ============================================================================

/**
 * Predict probability of mastery given planned study time
 *
 * Uses historical performance and planned hours to estimate success.
 *
 * Confidence levels:
 * - high: >= 75% probability
 * - medium: 50-74% probability
 * - low: < 50% probability
 *
 * @param objectiveId - Learning objective ID
 * @param userId - User ID
 * @param plannedHours - Planned study hours
 *
 * @example
 * ```tsx
 * const { data } = useSuccessProbability("obj_123", "user_456", 10);
 *
 * if (data) {
 *   console.log(data.success_probability); // 0.82
 *   console.log(data.confidence_level); // "high"
 *   console.log(data.planned_study_hours); // 10
 * }
 * ```
 */
export function useSuccessProbability(
  objectiveId: string | null,
  userId: string | null,
  plannedHours: number,
) {
  const resolvedObjectiveId = objectiveId ?? 'objective-demo'
  return useQuery({
    queryKey: analyticsKeys.successProbability(objectiveId || '', userId || '', plannedHours),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.get<SuccessProbabilityResponse>(`/analytics/success-probability/${objectiveId}`, {
            user_id: userId || undefined,
            planned_hours: plannedHours,
          }),
        () => createMockSuccessProbability(resolvedObjectiveId, plannedHours),
        'success probability',
      ),
    ...frequentQueryOptions,
    enabled: !!objectiveId && !!userId && plannedHours > 0,
  })
}

// ============================================================================
// Comprehensive Recommendations
// ============================================================================

/**
 * Get all recommendations in a single response
 *
 * Includes:
 * - Daily insight (highest priority)
 * - Weekly top 3 objectives
 * - Intervention suggestions
 * - Time-to-mastery estimates
 * - Exam success probability
 *
 * Uses ChatMock (GPT-5) via instructor for AI-generated insights.
 *
 * @example
 * ```tsx
 * const { data } = useRecommendations("user_123");
 *
 * if (data) {
 *   console.log(data.daily_insight);
 *   console.log(data.weekly_top3);
 *   console.log(data.interventions);
 *   console.log(data.time_estimates);
 *   console.log(data.exam_success_probability); // 0.87
 * }
 * ```
 */
export function useRecommendations(userId: string | null) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.recommendations(userId || ''),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.post<RecommendationData>('/analytics/recommendations', {
            user_id: userId as string,
          }),
        () => createMockRecommendations(resolvedUserId),
        'recommendations',
      ),
    ...frequentQueryOptions,
    enabled: !!userId,
  })
}

// ============================================================================
// ML Predictions
// ============================================================================

/**
 * Get comprehensive ML predictions
 *
 * Includes:
 * - Exam success prediction (logistic regression)
 * - Forgetting risk predictions (Ebbinghaus curve)
 * - Mastery date predictions (linear extrapolation)
 * - Model accuracy metrics (MAE, R² scores)
 *
 * WARNING: Expensive ML inference - cached for 15 minutes
 *
 * @param userId - User ID
 * @param dateRange - Optional date range filter
 * @param examType - Optional exam type filter
 *
 * @example
 * ```tsx
 * const { data } = usePredictions("user_123");
 *
 * if (data) {
 *   console.log(data.exam_success.probability); // 0.87
 *   console.log(data.exam_success.confidence_interval); // [0.82, 0.92]
 *
 *   data.forgetting_risks.forEach(risk => {
 *     console.log(risk.objective_name);
 *     console.log(risk.risk_level); // "high"
 *     console.log(risk.days_until_critical); // 5
 *   });
 *
 *   data.mastery_dates.forEach(pred => {
 *     console.log(pred.objective_name);
 *     console.log(pred.estimated_mastery_date); // ISO date
 *     console.log(pred.hours_needed); // 15.5
 *   });
 * }
 * ```
 */
export function usePredictions(
  userId: string | null,
  dateRange?: AnalyticsDateRange,
  examType?: string,
) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.predictions(userId || '', dateRange, examType),
    queryFn: () =>
      fetchWithMock(
        () => {
          const payload: PredictionsRequest = { user_id: userId as string }
          if (dateRange) {
            payload.date_range = dateRange
          }
          if (examType) {
            payload.exam_type = examType
          }
          return api.post<UnderstandingPrediction>('/analytics/predictions', payload)
        },
        () => createMockPredictions(resolvedUserId),
        'predictions',
      ),
    ...moderateQueryOptions, // 15 min cache (expensive ML)
    enabled: !!userId,
  })
}

// ============================================================================
// Comprehension Patterns
// ============================================================================

/**
 * Analyze comprehension patterns
 *
 * Identifies:
 * - Strengths (top 10% percentile objectives)
 * - Weaknesses (bottom 10% percentile objectives)
 * - Calibration issues (overconfidence, underconfidence, dangerous gaps)
 * - AI-generated insights (3-5 insights from ChatMock)
 *
 * @param userId - User ID
 * @param dateRange - Optional date range filter
 *
 * @example
 * ```tsx
 * const { data } = usePatterns("user_123", "90d");
 *
 * if (data) {
 *   data.strengths.forEach(s => {
 *     console.log(s.objective_name, s.score, s.percentile);
 *   });
 *
 *   data.calibration_issues.forEach(issue => {
 *     console.log(issue.type); // "overconfident"
 *     console.log(issue.objective_name);
 *     console.log(issue.delta); // +18 (overconfident by 18%)
 *   });
 *
 *   data.ai_insights.forEach(insight => console.log(insight));
 * }
 * ```
 */
export function usePatterns(userId: string | null, dateRange?: AnalyticsDateRange) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.patterns(userId || '', dateRange),
    queryFn: () =>
      fetchWithMock(
        () => {
          const payload: PatternsRequest = { user_id: userId as string }
          if (dateRange) {
            payload.date_range = dateRange
          }
          return api.post<ComprehensionPattern>('/analytics/patterns', payload)
        },
        () => createMockPatterns(resolvedUserId, dateRange ?? '30d'),
        'patterns',
      ),
    ...moderateQueryOptions,
    enabled: !!userId,
  })
}

// ============================================================================
// Longitudinal Progress
// ============================================================================

/**
 * Track historical progress over time
 *
 * Includes:
 * - Time series metrics (timestamps, scores, confidence)
 * - Milestones (mastery verified, major improvements, streaks)
 * - Regressions (performance declines in mastered topics)
 * - Growth trajectories (linear regression predictions)
 * - Improvement rates (weekly/monthly trends)
 *
 * @param userId - User ID
 * @param dateRange - Optional date range filter
 * @param dimensions - Optional comma-separated dimensions filter
 *
 * @example
 * ```tsx
 * const { data } = useLongitudinal("user_123", "90d", "comprehension,reasoning");
 *
 * if (data) {
 *   Object.entries(data.time_series).forEach(([dimension, points]) => {
 *     console.log(`${dimension}:`, points.length, "data points");
 *   });
 *
 *   data.milestones.forEach(m => {
 *     console.log(m.date, m.type, m.description);
 *   });
 *
 *   console.log("Growth rate:", data.growth_trajectory.growth_rate, "% per week");
 *   console.log("Weekly improvement:", data.improvement_rate.weekly, "%");
 * }
 * ```
 */
export function useLongitudinal(
  userId: string | null,
  dateRange?: AnalyticsDateRange,
  dimensions?: LongitudinalDimension[],
) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.longitudinal(userId || '', dateRange, dimensions),
    queryFn: () =>
      fetchWithMock(
        () => {
          const payload: LongitudinalRequest = { user_id: userId as string }
          if (dateRange) {
            payload.date_range = dateRange
          }
          if (dimensions && dimensions.length) {
            payload.dimensions = dimensions
          }
          return api.post<LongitudinalMetric>('/analytics/longitudinal', payload)
        },
        () => createMockLongitudinal(resolvedUserId, dateRange ?? '90d'),
        'longitudinal',
      ),
    ...frequentQueryOptions,
    enabled: !!userId,
  })
}

// ============================================================================
// Cross-Objective Correlations
// ============================================================================

/**
 * Analyze Pearson correlation coefficients between objectives
 *
 * Uses scipy.stats.pearsonr for statistical correlation analysis.
 *
 * Identifies:
 * - Foundational objectives (high positive correlation > 0.5 with many others)
 * - Bottleneck objectives (low score + negative correlation pattern)
 * - Recommended study sequence (prioritizing foundational objectives)
 *
 * Returns NxN correlation matrix where N = number of objectives.
 *
 * @param userId - User ID
 *
 * @example
 * ```tsx
 * const { data } = useCorrelations("user_123");
 *
 * if (data) {
 *   console.log("Matrix size:", data.matrix.length, "x", data.matrix[0].length);
 *
 *   data.foundational.forEach(obj => {
 *     console.log(obj.objective_name);
 *     console.log("Avg correlation:", obj.avg_correlation.toFixed(2));
 *     console.log("Connected to", obj.connected_count, "objectives");
 *   });
 *
 *   console.log("Bottlenecks:", data.bottlenecks);
 *   console.log("Study sequence:", data.recommended_sequence);
 * }
 * ```
 */
export function useCorrelations(userId: string | null) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.correlations(userId || ''),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.post<CorrelationMatrix>('/analytics/correlations', {
            user_id: userId as string,
          } as CorrelationsRequest),
        () => createMockCorrelations(resolvedUserId),
        'correlations',
      ),
    ...moderateQueryOptions,
    enabled: !!userId,
  })
}

// ============================================================================
// Peer Benchmark
// ============================================================================

/**
 * Compare performance with anonymized peer data
 *
 * PRIVACY CONSTRAINT: Requires >= 50 users for validity.
 *
 * Includes:
 * - Peer distribution (mean, median, std_dev, quartiles, IQR, whiskers)
 * - User percentile ranking
 * - Relative strengths (top 25% performance)
 * - Relative weaknesses (bottom 25% performance)
 *
 * Box plot visualization data provided for frontend charting.
 *
 * @param userId - User ID
 * @param objectiveId - Optional objective filter
 *
 * @example
 * ```tsx
 * const { data, error } = usePeerBenchmark("user_123", "obj_456");
 *
 * if (error?.message.includes('Insufficient peer data')) {
 *   console.log("< 50 users in cohort");
 * }
 *
 * if (data) {
 *   console.log("User percentile:", data.user_percentile); // 78th
 *   console.log("Peer mean:", data.peer_distribution.mean);
 *   console.log("Peer median:", data.peer_distribution.median);
 *   console.log("Quartiles:", data.peer_distribution.quartiles); // [Q1, Q2, Q3]
 *
 *   data.relative_strengths.forEach(strength => {
 *     console.log(strength.objective_name);
 *     console.log("Your score:", strength.user_score);
 *     console.log("Peer avg:", strength.peer_avg);
 *     console.log("Percentile:", strength.percentile);
 *   });
 * }
 * ```
 */
export function usePeerBenchmark(userId: string | null, objectiveId?: string) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.peerBenchmark(userId || '', objectiveId),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.post<PeerBenchmark>('/analytics/peer-benchmark', {
            user_id: userId as string,
            objective_id: objectiveId,
          } as PeerBenchmarkRequest),
        () => createMockPeerBenchmark(resolvedUserId, objectiveId),
        'peer benchmark',
      ),
    ...stableQueryOptions, // 30 min cache (peer data changes slowly)
    enabled: !!userId,
    retry: 1, // Don't retry multiple times if < 50 users
  })
}

// ============================================================================
// Understanding Dashboard
// ============================================================================

/**
 * Get comprehensive dashboard summary
 *
 * Aggregates data from:
 * - Story 4.1: Comprehension validation (terminology, relationships, application, clarity)
 * - Story 4.2: Clinical reasoning scenarios
 * - Story 4.3: Controlled failure challenges
 * - Story 4.4: Confidence calibration tracking
 * - Story 4.5: Adaptive difficulty matching (IRT)
 *
 * Returns:
 * - Overall score (weighted average across all dimensions)
 * - Total sessions and questions completed
 * - Mastery breakdown (beginner < 60, proficient 60-85, expert > 85)
 * - Recent trends (last 7 days)
 * - Calibration status (well-calibrated, overconfident, underconfident)
 * - Top 3 strengths and improvement areas
 *
 * @param userId - User ID
 * @param timeRange - Time range filter (7d, 30d, 90d, 1y, all)
 *
 * @example
 * ```tsx
 * const { data } = useUnderstandingDashboard("user_123", "30d");
 *
 * if (data) {
 *   console.log("Overall score:", data.overall_score); // 82.5
 *   console.log("Sessions:", data.total_sessions);
 *   console.log("Questions:", data.total_questions);
 *
 *   console.log("Mastery:", data.mastery_breakdown);
 *   // { beginner: 3, proficient: 12, expert: 8 }
 *
 *   console.log("Calibration:", data.calibration_status); // "well-calibrated"
 *   console.log("Strengths:", data.top_strengths);
 *   console.log("Improve:", data.improvement_areas);
 *
 *   data.recent_trends.forEach(point => {
 *     console.log(point.date, point.score);
 *   });
 * }
 * ```
 */
export function useUnderstandingDashboard(userId: string | null, timeRange?: AnalyticsDateRange) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.dashboard(userId || '', timeRange),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.get<DashboardSummary>('/analytics/understanding/dashboard', {
            user_id: userId || undefined,
            time_range: timeRange,
          }),
        () => createMockDashboard(resolvedUserId, timeRange ?? '30d'),
        'understanding dashboard',
      ),
    ...frequentQueryOptions,
    enabled: !!userId,
  })
}

// ============================================================================
// Understanding Comparison
// ============================================================================

/**
 * Compare user performance with peer group across 4 dimensions
 *
 * Uses scipy.stats.percentileofscore for percentile calculations.
 *
 * Dimensions analyzed:
 * - Terminology: Correct medical terms usage
 * - Relationships: Concept connections
 * - Application: Clinical scenario application
 * - Clarity: Patient-friendly explanations
 *
 * Returns:
 * - Overall percentile rank
 * - Per-dimension comparisons
 * - Strengths (user > peer_avg)
 * - Gaps (user < peer_avg - 0.5*std_dev)
 *
 * Requires minimum 50 users in peer group for validity.
 *
 * @param userId - User ID
 * @param peerGroup - Peer group filter ("all", "cohort", "course", etc.)
 *
 * @example
 * ```tsx
 * const { data, error } = useUnderstandingComparison("user_123", "all");
 *
 * if (error?.message.includes('Insufficient peer data')) {
 *   console.log("< 50 users in peer group");
 * }
 *
 * if (data) {
 *   console.log("Overall percentile:", data.user_percentile); // 72nd
 *   console.log("Your score:", data.user_score);
 *   console.log("Peer average:", data.peer_average);
 *   console.log("Peer std dev:", data.peer_std_dev);
 *
 *   data.dimension_comparisons.forEach(dim => {
 *     console.log(dim.dimension); // "terminology"
 *     console.log("Your score:", dim.user_score);
 *     console.log("Peer avg:", dim.peer_average);
 *     console.log("Percentile:", dim.percentile);
 *   });
 *
 *   console.log("Strengths:", data.strengths_vs_peers); // ["application", "clarity"]
 *   console.log("Gaps:", data.gaps_vs_peers); // ["terminology"]
 *   console.log("Cohort size:", data.peer_group_size);
 * }
 * ```
 */
export function useUnderstandingComparison(userId: string | null, peerGroup?: string) {
  const resolvedUserId = userId ?? 'demo-user'
  return useQuery({
    queryKey: analyticsKeys.comparison(userId || '', peerGroup),
    queryFn: () =>
      fetchWithMock(
        () =>
          api.get<ComparisonResult>('/analytics/understanding/comparison', {
            user_id: userId || undefined,
            peer_group: peerGroup,
          }),
        () => createMockComparison(resolvedUserId, peerGroup ?? 'all'),
        'understanding comparison',
      ),
    ...stableQueryOptions, // 30 min cache (peer comparisons change slowly)
    enabled: !!userId,
    retry: 1, // Don't retry multiple times if < 50 users
  })
}
