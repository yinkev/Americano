/**
 * React Query hook for dashboard summary data
 *
 * Supports dual-mode operation:
 * - Demo mode: Returns static demo data immediately (userId === 'dumpling')
 * - Real mode: Fetches from /api/analytics/behavioral-insights/dashboard
 *
 * @module hooks/use-dashboard-data
 */

import { type UseQueryResult, useQuery } from '@tanstack/react-query'

/**
 * Dashboard summary data structure
 * Matches the shape returned by /api/analytics/behavioral-insights/dashboard
 */
export interface DashboardSummary {
  user_id: string
  streak_days: number
  xp_this_week: number
  xp_today: number
  cards_mastered: number
  study_time_hours: number
  exam_readiness: number
  last_study_date: string
}

/**
 * API response structure from behavioral insights dashboard
 */
interface DashboardApiResponse {
  success: boolean
  data: {
    patterns: Array<{
      id: string
      patternType: string
      confidence: number
    }>
    recommendations: Array<{
      id: string
      title: string
      priorityScore: number
    }>
    goals: Array<{
      id: string
      goalType: string
      status: string
    }>
    metrics: {
      consistency: number
      focus: number
      retention: number
      efficiency: number
    }
    correlationData: null | Record<string, unknown>
    meta: {
      patternsCount: number
      recommendationsCount: number
      activeGoalsCount: number
      recentInsightsCount: number
      lastUpdated: string
    }
  }
}

/**
 * Demo data for "dumpling" user
 * Realistic but obviously demo values
 */
const DEMO_DATA: DashboardSummary = {
  user_id: 'dumpling',
  streak_days: 5,
  xp_this_week: 1240,
  xp_today: 120,
  cards_mastered: 87,
  study_time_hours: 4.2,
  exam_readiness: 0.78,
  last_study_date: new Date().toISOString(),
}

/**
 * Transform API response to DashboardSummary format
 * Extracts relevant metrics from the comprehensive dashboard response
 */
function transformApiResponse(response: DashboardApiResponse): DashboardSummary {
  const { metrics, meta } = response.data

  return {
    user_id: 'kevy@americano.dev', // Real user
    streak_days: 0, // Would need to fetch from Streak model separately
    xp_this_week: 0, // Would need XP system implementation
    xp_today: 0, // Would need XP system implementation
    cards_mastered: 0, // Would need to count cards with mastery threshold
    study_time_hours: 0, // Would calculate from study sessions
    exam_readiness: metrics.retention / 100, // Use retention as proxy
    last_study_date: meta.lastUpdated,
  }
}

/**
 * Fetch dashboard summary data for a user
 * Returns demo data immediately if userId === 'dumpling'
 *
 * @param userId - User ID to fetch data for
 * @returns React Query result with dashboard summary
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDashboardData('kevy@americano.dev')
 *
 * if (isLoading) return <Spinner />
 * if (error) return <Error message={error.message} />
 *
 * return <Dashboard data={data} />
 * ```
 */
export function useDashboardData(userId: string): UseQueryResult<DashboardSummary, Error> {
  return useQuery<DashboardSummary, Error>({
    queryKey: ['dashboard', userId],

    queryFn: async () => {
      // Demo mode: Return immediately without API call
      if (userId === 'dumpling') {
        return DEMO_DATA
      }

      // Real mode: Fetch from API
      const url = `/api/analytics/behavioral-insights/dashboard?userId=${encodeURIComponent(userId)}`
      const res = await fetch(url)

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to load dashboard: ${res.status} ${errorText}`)
      }

      const apiResponse: DashboardApiResponse = await res.json()

      if (!apiResponse.success) {
        throw new Error('API returned unsuccessful response')
      }

      return transformApiResponse(apiResponse)
    },

    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Keep data in cache for 10 minutes after becoming stale
    gcTime: 10 * 60 * 1000,

    // Retry failed requests twice with exponential backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Enable query only if userId is provided
    enabled: !!userId,

    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,
  })
}
