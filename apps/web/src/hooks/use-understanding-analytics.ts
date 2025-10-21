/**
 * Story 4.6: Understanding Analytics React Query Hooks
 *
 * Custom hooks for fetching analytics data from the Understanding Analytics API.
 * Implements proper caching, error handling, and TypeScript types with React Query v5.
 *
 * Architecture: TypeScript → Next.js API Routes → Python FastAPI Service
 *
 * @see /api/analytics/understanding/* - Next.js API routes
 * @see CLAUDE.md - Hybrid architecture documentation
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUnderstandingAnalyticsStore } from '@/store/understanding-analytics-store'
import type {
  DashboardResponse,
  ComparisonData,
  PatternsResponse,
  LongitudinalResponse,
  PredictionsResponse,
  CorrelationsResponse,
  PeerBenchmarkResponse,
  RecommendationsResponse,
} from '@/lib/validation'

/**
 * MVP Authentication Header
 * TODO: Replace with proper auth system in production
 */
const AUTH_HEADER = { 'X-User-Email': 'kevy@americano.dev' }

/**
 * Base fetch function with error handling
 */
async function fetchAnalytics<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
  const url = params
    ? `/api/analytics/understanding/${endpoint}?${params.toString()}`
    : `/api/analytics/understanding/${endpoint}`

  const response = await fetch(url, {
    headers: AUTH_HEADER,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Analytics fetch failed: ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

/**
 * Hook 1: Dashboard Overview Metrics
 *
 * Fetches 6-card overview with comprehension, reasoning, failure, calibration,
 * adaptive, and mastery metrics. Uses global filters from Zustand store.
 *
 * @returns Query result with dashboard metrics
 *
 * @example
 * const { data, isLoading, error } = useUnderstandingDashboard()
 * if (data) {
 *   console.log(data.comprehension.currentScore) // 85
 * }
 */
export function useUnderstandingDashboard() {
  const { dateRange, courseId, topic } = useUnderstandingAnalyticsStore()

  return useQuery({
    queryKey: ['understanding', 'dashboard', { dateRange, courseId, topic }],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange })
      if (courseId) params.set('courseId', courseId)
      if (topic) params.set('topic', topic)

      return fetchAnalytics<DashboardResponse>('dashboard', params)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5 - was cacheTime in v4)
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook 2: Understanding vs Memorization Comparison
 *
 * Fetches time-series data comparing understanding scores vs memorization scores,
 * along with gap analysis and correlation coefficient.
 *
 * @returns Query result with comparison data
 *
 * @example
 * const { data } = useComparisonData()
 * if (data) {
 *   console.log(data.correlation) // 0.73
 *   console.log(data.gaps) // [{ objectiveId: '...', gap: 15 }]
 * }
 */
export function useComparisonData() {
  const { dateRange } = useUnderstandingAnalyticsStore()

  return useQuery({
    queryKey: ['understanding', 'comparison', { dateRange }],
    queryFn: async () => {
      const params = new URLSearchParams({ dateRange })
      return fetchAnalytics<ComparisonData>('comparison', params)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: true, // Always enabled
  })
}

/**
 * Hook 3: Patterns Analysis (Strengths, Weaknesses, AI Insights)
 *
 * Fetches ML-powered insights about learning patterns, including:
 * - Top strengths (highest performing topics)
 * - Key weaknesses (recommended focus areas)
 * - Inconsistencies (topics with variable performance)
 * - AI-generated insights from Python service
 *
 * @returns Query result with patterns analysis
 *
 * @example
 * const { data } = usePatternsAnalysis()
 * if (data) {
 *   data.strengths.forEach(s => console.log(s.topic, s.score))
 *   data.insights.forEach(i => console.log(i.message))
 * }
 */
export function usePatternsAnalysis() {
  return useQuery({
    queryKey: ['understanding', 'patterns'],
    queryFn: async () => {
      return fetchAnalytics<PatternsResponse>('patterns')
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (AI insights don't change frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook 4: Longitudinal Progress Over Time
 *
 * Fetches time-series data for comprehension, reasoning, calibration, and mastery
 * metrics, along with milestones (breakthroughs, mastery events) and regressions.
 *
 * @returns Query result with longitudinal progress data
 *
 * @example
 * const { data } = useLongitudinalProgress()
 * if (data) {
 *   console.log(data.growthRate) // 12.5% per month
 *   data.milestones.forEach(m => console.log(m.description))
 * }
 */
export function useLongitudinalProgress() {
  const { dateRange } = useUnderstandingAnalyticsStore()

  return useQuery({
    queryKey: ['understanding', 'longitudinal', { dateRange }],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateRange,
        dimensions: 'comprehension,reasoning,calibration,mastery',
      })

      return fetchAnalytics<LongitudinalResponse>('longitudinal', params)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook 5: ML Predictions (Exam Success, Forgetting Risks, Mastery Dates)
 *
 * Fetches ML-powered predictions from Python FastAPI service:
 * - Exam success probability with confidence intervals
 * - Forgetting risk analysis for each objective
 * - Estimated mastery dates with hours needed
 * - Model accuracy metrics (MAE, sample size)
 *
 * WARNING: Expensive ML inference - cached for 15 minutes
 *
 * @returns Query result with predictions data
 *
 * @example
 * const { data } = usePredictions()
 * if (data) {
 *   console.log(data.examSuccess.probability) // 0.87
 *   data.forgettingRisks.forEach(r => console.log(r.objectiveName, r.riskLevel))
 * }
 */
export function usePredictions() {
  return useQuery({
    queryKey: ['understanding', 'predictions'],
    queryFn: async () => {
      return fetchAnalytics<PredictionsResponse>('predictions')
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (ML predictions are expensive)
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook 6: Correlation Matrix (Objective Relationships)
 *
 * Fetches correlation matrix showing relationships between learning objectives,
 * with analysis of foundational concepts, bottlenecks, and recommended learning sequence.
 *
 * Uses scipy.stats.pearsonr on Python backend for correlation calculations.
 *
 * @returns Query result with correlation data
 *
 * @example
 * const { data } = useCorrelations()
 * if (data) {
 *   console.log(data.correlationMatrix) // 2D array of coefficients
 *   data.foundational.forEach(f => console.log(f.objectiveName))
 * }
 */
export function useCorrelations() {
  return useQuery({
    queryKey: ['understanding', 'correlations'],
    queryFn: async () => {
      return fetchAnalytics<CorrelationsResponse>('correlations')
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  })
}

/**
 * Hook 7: Peer Benchmark Comparison
 *
 * Fetches anonymized peer comparison data showing percentile rankings
 * across metrics (comprehension, reasoning, calibration).
 *
 * PRIVACY CONSTRAINT: Requires >= 50 users for cohort. Returns error if insufficient data.
 *
 * @param objectiveId - Optional objective filter
 * @returns Query result with peer benchmark data
 *
 * @example
 * const { data, error } = usePeerBenchmark()
 * if (error?.message.includes('Insufficient peer data')) {
 *   // Handle < 50 users case
 * }
 * if (data) {
 *   console.log(data.userPercentile.comprehension) // 78th percentile
 * }
 */
export function usePeerBenchmark(objectiveId?: string) {
  return useQuery({
    queryKey: ['understanding', 'peer-benchmark', { objectiveId }],
    queryFn: async () => {
      const params = objectiveId ? new URLSearchParams({ objectiveId }) : undefined

      return fetchAnalytics<PeerBenchmarkResponse>('peer-benchmark', params)
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (peer data changes slowly)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1, // Don't retry multiple times if < 50 users
  })
}

/**
 * Hook 8: AI-Generated Recommendations
 *
 * Fetches personalized recommendations from Python AI service:
 * - Daily insight with actionable steps
 * - Weekly top 3 objectives to focus on
 * - Metacognitive interventions (overconfidence, underconfidence, etc.)
 * - Time estimates for recommended study sessions
 * - Success probabilities for next week/month
 *
 * Refreshes every hour to provide fresh daily insights.
 *
 * @returns Query result with recommendations
 *
 * @example
 * const { data } = useRecommendations()
 * if (data) {
 *   console.log(data.dailyInsight.message)
 *   data.weeklyTop3.forEach(obj => console.log(obj.objectiveName, obj.reason))
 * }
 */
export function useRecommendations() {
  return useQuery({
    queryKey: ['understanding', 'recommendations'],
    queryFn: async () => {
      return fetchAnalytics<RecommendationsResponse>('recommendations')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000, // Refetch every hour for fresh daily insights
  })
}

/**
 * Hook 9: Refresh All Analytics Data
 *
 * Utility hook that invalidates all understanding analytics queries,
 * triggering refetch for all active hooks. Updates Zustand store timestamp
 * to coordinate UI refresh indicators.
 *
 * @returns Refresh function
 *
 * @example
 * const refreshAll = useRefreshAll()
 *
 * // In a button onClick handler:
 * <button onClick={refreshAll}>Refresh Dashboard</button>
 */
export function useRefreshAll() {
  const queryClient = useQueryClient()
  const { refreshData } = useUnderstandingAnalyticsStore()

  return () => {
    // Invalidate all queries with 'understanding' key prefix
    queryClient.invalidateQueries({ queryKey: ['understanding'] })

    // Update timestamp in Zustand store for UI coordination
    refreshData()
  }
}

/**
 * Hook 10: Invalidate Specific Metric
 *
 * Utility hook for invalidating a specific analytics metric when data changes
 * (e.g., after completing a validation response, update dashboard metrics).
 *
 * @param metric - Metric to invalidate ('dashboard' | 'patterns' | 'predictions' etc.)
 *
 * @example
 * const invalidate = useInvalidateMetric('dashboard')
 * // After submitting a response:
 * invalidate()
 */
export function useInvalidateMetric(
  metric:
    | 'dashboard'
    | 'comparison'
    | 'patterns'
    | 'longitudinal'
    | 'predictions'
    | 'correlations'
    | 'peer-benchmark'
    | 'recommendations'
) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['understanding', metric] })
  }
}
