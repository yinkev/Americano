/**
 * React Query hook for mission summary data
 *
 * Supports dual-mode operation:
 * - Demo mode: Returns static demo mission data (userId === 'dumpling')
 * - Real mode: Fetches from /api/analytics/missions/summary
 *
 * @module hooks/use-mission-data
 */

import { type UseQueryResult, useQuery } from '@tanstack/react-query'

/**
 * Mission summary data structure
 */
export interface MissionSummary {
  title: string
  tasks: Array<{
    id: string
    description: string
    completed: boolean
  }>
  readiness: number
  duration: number
  completionRate: number
  streak: {
    current: number
    longest: number
  }
  successScore: number
}

/**
 * API response from /api/analytics/missions/summary
 */
interface MissionApiResponse {
  success: boolean
  data: {
    completionRate: number
    streak: {
      current: number
      longest: number
    }
    successScore: number
    missions: {
      completed: number
      skipped: number
      total: number
    }
    insights: string[]
    comparison: {
      missionGuided: {
        sessions: number
        masteryImprovement: number
        completionRate: number
        efficiency: number
      }
      freeStudy: {
        sessions: number
        masteryImprovement: number
        completionRate: number
        efficiency: number
      }
      improvementPercentage: number
      confidence: string
      pValue: number
      insight: string
    }
  }
}

/**
 * Demo mission data for "dumpling" user
 */
const DEMO_MISSION: MissionSummary = {
  title: "Today's Mission: Dumpling's Learning Journey",
  tasks: [
    {
      id: 'task-1',
      description: 'Review cardiovascular physiology flashcards',
      completed: true,
    },
    {
      id: 'task-2',
      description: 'Complete pharmacology practice questions',
      completed: true,
    },
    {
      id: 'task-3',
      description: 'Study respiratory system pathophysiology',
      completed: false,
    },
  ],
  readiness: 0.78,
  duration: 45,
  completionRate: 0.85,
  streak: {
    current: 5,
    longest: 12,
  },
  successScore: 0.82,
}

/**
 * Transform API response to MissionSummary format
 */
function transformApiResponse(response: MissionApiResponse): MissionSummary {
  const { completionRate, streak, successScore, insights } = response.data

  // Generate tasks from insights (top 3 insights become tasks)
  const tasks = insights.slice(0, 3).map((insight, index) => ({
    id: `task-${index + 1}`,
    description: insight,
    completed: false, // Would need actual task completion data
  }))

  return {
    title: "Today's Mission",
    tasks,
    readiness: successScore, // Use success score as readiness proxy
    duration: 45, // Default duration - would need from Mission model
    completionRate,
    streak,
    successScore,
  }
}

/**
 * Fetch mission summary data for a user
 * Returns demo mission immediately if userId === 'dumpling'
 *
 * @param userId - User ID to fetch mission data for
 * @param period - Time period for mission data (default: '7d')
 * @returns React Query result with mission summary
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMissionData('kevy@americano.dev', '30d')
 *
 * if (isLoading) return <Spinner />
 * if (error) return <Error message={error.message} />
 *
 * return <MissionCard mission={data} />
 * ```
 */
export function useMissionData(
  userId: string,
  period: '7d' | '30d' | '90d' | 'all' = '7d',
): UseQueryResult<MissionSummary, Error> {
  return useQuery<MissionSummary, Error>({
    queryKey: ['mission-summary', userId, period],

    queryFn: async () => {
      // Demo mode: Return immediately without API call
      if (userId === 'dumpling') {
        return DEMO_MISSION
      }

      // Real mode: Fetch from API
      const url = `/api/analytics/missions/summary?period=${period}`
      const res = await fetch(url, {
        headers: {
          'X-User-Email': userId, // API expects email in header
        },
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to load mission data: ${res.status} ${errorText}`)
      }

      const apiResponse: MissionApiResponse = await res.json()

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

    // Refetch on window focus for fresh mission status
    refetchOnWindowFocus: true,
  })
}
