/**
 * Composite React Query hook for complete dashboard data
 *
 * Combines multiple data sources:
 * - Dashboard summary (streak, XP, cards, study time, readiness)
 * - Mission data (today's mission, tasks, completion)
 * - Learning profile (VARK preferences, forgetting curves)
 * - Stress profile (load tolerance, coping strategies)
 *
 * Provides unified loading/error states and combined data object.
 *
 * @module hooks/use-dashboard
 */

import { useMemo } from 'react'
import { type DashboardSummary, useDashboardData } from './use-dashboard-data'
import { type MissionSummary, useMissionData } from './use-mission-data'

/**
 * Combined dashboard data structure
 * Merges all dashboard components into a single object
 */
export interface DashboardData {
  // Core dashboard metrics
  user_id: string
  streak_days: number
  xp_this_week: number
  xp_today: number
  cards_mastered: number
  study_time_hours: number
  exam_readiness: number
  last_study_date: string

  // Mission information
  mission: MissionSummary | null
}

/**
 * Hook return type with unified loading/error states
 */
export interface UseDashboardResult {
  /** Combined loading state - true if any query is loading */
  isLoading: boolean

  /** True if this is the first time loading (no cached data) */
  isInitialLoading: boolean

  /** Combined error state - first error encountered */
  error: Error | null

  /** Combined dashboard data - null if loading or error */
  data: DashboardData | null

  /** Individual loading states for granular control */
  loadingStates: {
    dashboard: boolean
    mission: boolean
  }

  /** Individual error states for granular error handling */
  errors: {
    dashboard: Error | null
    mission: Error | null
  }

  /** Refetch all data */
  refetch: () => Promise<void>
}

/**
 * Fetch complete dashboard data with unified states
 *
 * Combines dashboard summary, mission data, and other sources into
 * a single hook with merged loading/error states.
 *
 * @param userId - User ID to fetch data for (use 'dumpling' for demo)
 * @param missionPeriod - Time period for mission data (default: '7d')
 * @returns Combined dashboard data with unified states
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { data, isLoading, error } = useDashboard('kevy@americano.dev')
 *
 *   if (isLoading) return <SkeletonLoader />
 *   if (error) return <ErrorState error={error} />
 *
 *   return (
 *     <div>
 *       <StatsCards stats={data} />
 *       <MissionCard mission={data.mission} />
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Demo mode with instant loading
 * const { data, isLoading } = useDashboard('dumpling')
 * // isLoading is immediately false, data is demo data
 * ```
 *
 * @example
 * ```tsx
 * // Granular error handling
 * const { data, errors, loadingStates } = useDashboard('kevy@americano.dev')
 *
 * if (errors.dashboard) {
 *   // Handle dashboard error specifically
 * }
 *
 * if (errors.mission) {
 *   // Handle mission error specifically
 * }
 *
 * // Can still show partial data if some queries succeed
 * if (data) {
 *   return <Dashboard data={data} />
 * }
 * ```
 */
export function useDashboard(
  userId: string,
  missionPeriod: '7d' | '30d' | '90d' | 'all' = '7d',
): UseDashboardResult {
  // Fetch individual data sources
  const dashboardQuery = useDashboardData(userId)
  const missionQuery = useMissionData(userId, missionPeriod)

  // Merge loading states
  const isLoading = dashboardQuery.isLoading || missionQuery.isLoading
  const isInitialLoading =
    (dashboardQuery.isLoading && !dashboardQuery.data) ||
    (missionQuery.isLoading && !missionQuery.data)

  // Merge error states (return first error encountered)
  const error = dashboardQuery.error || missionQuery.error || null

  // Combine data into single object
  const data = useMemo((): DashboardData | null => {
    // If critical data is missing, return null
    if (!dashboardQuery.data) {
      return null
    }

    return {
      // Dashboard summary
      ...dashboardQuery.data,

      // Mission data (can be null if mission query failed)
      mission: missionQuery.data || null,
    }
  }, [dashboardQuery.data, missionQuery.data])

  // Refetch all queries
  const refetch = async () => {
    await Promise.all([dashboardQuery.refetch(), missionQuery.refetch()])
  }

  return {
    isLoading,
    isInitialLoading,
    error,
    data,
    loadingStates: {
      dashboard: dashboardQuery.isLoading,
      mission: missionQuery.isLoading,
    },
    errors: {
      dashboard: dashboardQuery.error,
      mission: missionQuery.error,
    },
    refetch,
  }
}

/**
 * Type guard to check if data is complete (includes mission)
 *
 * @example
 * ```tsx
 * const { data } = useDashboard('kevy@americano.dev')
 *
 * if (data && hasCompleteMissionData(data)) {
 *   // TypeScript knows data.mission is non-null
 *   return <MissionCard mission={data.mission} />
 * }
 * ```
 */
export function hasCompleteMissionData(
  data: DashboardData,
): data is DashboardData & { mission: MissionSummary } {
  return data.mission !== null
}
