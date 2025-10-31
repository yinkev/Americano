/**
 * React Query Hook Utilities
 *
 * Provides shared utilities for API hooks including:
 * - Retry logic with exponential backoff
 * - Error handling and toast notifications
 * - Cache configuration strategies
 * - Query key factories
 */

'use client'

import type { QueryClient, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../client'
import type { ApiError } from '../errors'

// ============================================================================
// Cache Configuration Constants
// ============================================================================

/**
 * Stale time configurations for different data types
 */
export const STALE_TIME = {
  /**
   * Real-time data that should be fresh (1 minute)
   * Use for: Dashboard metrics, session data
   */
  REALTIME: 1 * 60 * 1000,

  /**
   * Frequently updated data (5 minutes)
   * Use for: User progress, recent activity
   */
  FREQUENT: 5 * 60 * 1000,

  /**
   * Moderately stable data (15 minutes)
   * Use for: ML predictions, patterns analysis
   */
  MODERATE: 15 * 60 * 1000,

  /**
   * Stable data that changes slowly (30 minutes)
   * Use for: Peer benchmarks, correlations
   */
  STABLE: 30 * 60 * 1000,

  /**
   * Static data that rarely changes (1 hour)
   * Use for: Learning objectives, question banks
   */
  STATIC: 60 * 60 * 1000,
} as const

/**
 * Garbage collection time (how long to keep unused data in cache)
 */
export const GC_TIME = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 10 * 60 * 1000,
  LONG: 30 * 60 * 1000,
  EXTENDED: 60 * 60 * 1000,
} as const

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * Calculate exponential backoff delay
 */
export function getRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000)
}

/**
 * Determine if an error should be retried
 *
 * @param failureCount - Number of failed attempts
 * @param error - The error that occurred
 * @returns Whether to retry the request
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry if we've already tried 3 times
  if (failureCount >= 3) {
    return false
  }

  // If it's an ApiError, check the status code
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ApiError

    // Don't retry client errors (4xx) except for specific cases
    if (apiError.status >= 400 && apiError.status < 500) {
      // Retry rate limits (429) and timeouts (408)
      return apiError.status === 429 || apiError.status === 408
    }

    // Retry server errors (5xx) and network errors (0)
    return apiError.status >= 500 || apiError.status === 0
  }

  // Retry network errors and timeouts
  return true
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle API errors with toast notifications
 *
 * @param error - The error to handle
 * @param customMessage - Optional custom error message
 */
export function handleApiError(error: unknown, customMessage?: string): void {
  console.error('API Error:', error)

  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError

    // Show appropriate error message
    const message = customMessage || apiError.message || 'An error occurred'

    toast.error(message, {
      description: apiError.status ? `Status: ${apiError.status}` : undefined,
      duration: 5000,
    })
  } else {
    toast.error(customMessage || 'An unexpected error occurred', {
      duration: 5000,
    })
  }
}

/**
 * Handle API success with toast notification
 *
 * @param message - Success message to display
 */
export function handleApiSuccess(message: string): void {
  toast.success(message, {
    duration: 3000,
  })
}

// ============================================================================
// Query Key Factories
// ============================================================================

/**
 * Query key factory for validation endpoints
 */
export const validationKeys = {
  all: ['validation'] as const,
  prompts: () => [...validationKeys.all, 'prompts'] as const,
  prompt: (id: string) => [...validationKeys.prompts(), id] as const,
  evaluations: () => [...validationKeys.all, 'evaluations'] as const,
  evaluation: (id: string) => [...validationKeys.evaluations(), id] as const,
  scenarios: () => [...validationKeys.all, 'scenarios'] as const,
  scenario: (id: string) => [...validationKeys.scenarios(), id] as const,
  scenarioMetrics: () => [...validationKeys.scenarios(), 'metrics'] as const,
  challenges: () => [...validationKeys.all, 'challenges'] as const,
  challenge: (id: string) => [...validationKeys.challenges(), id] as const,
} as const

/**
 * Query key factory for challenge endpoints
 */
export const challengeKeys = {
  all: ['challenge'] as const,
  feedback: (challengeId: string) => [...challengeKeys.all, 'feedback', challengeId] as const,
  patterns: (userId: string, objectiveId?: string) =>
    [...challengeKeys.all, 'patterns', userId, objectiveId] as const,
  retries: (failureId: string) => [...challengeKeys.all, 'retries', failureId] as const,
} as const

/**
 * Query key factory for adaptive endpoints
 */
export const adaptiveKeys = {
  all: ['adaptive'] as const,
  questions: () => [...adaptiveKeys.all, 'questions'] as const,
  nextQuestion: (sessionId: string, objectiveId: string) =>
    [...adaptiveKeys.questions(), sessionId, objectiveId] as const,
  sessions: () => [...adaptiveKeys.all, 'sessions'] as const,
  sessionMetrics: (sessionId: string, objectiveId: string) =>
    [...adaptiveKeys.sessions(), sessionId, objectiveId] as const,
} as const

/**
 * Query key factory for analytics endpoints
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  dailyInsight: (userId: string) => [...analyticsKeys.all, 'daily-insight', userId] as const,
  weeklySummary: (userId: string) => [...analyticsKeys.all, 'weekly-summary', userId] as const,
  interventions: (userId: string) => [...analyticsKeys.all, 'interventions', userId] as const,
  timeToMastery: (objectiveId: string, userId: string) =>
    [...analyticsKeys.all, 'time-to-mastery', objectiveId, userId] as const,
  successProbability: (objectiveId: string, userId: string, plannedHours: number) =>
    [...analyticsKeys.all, 'success-probability', objectiveId, userId, plannedHours] as const,
  recommendations: (userId: string) => [...analyticsKeys.all, 'recommendations', userId] as const,
  predictions: (userId: string, dateRange?: string, examType?: string) =>
    [
      ...analyticsKeys.all,
      'predictions',
      userId,
      dateRange ?? '__default-range',
      examType ?? '__all-exams',
    ] as const,
  patterns: (userId: string, dateRange?: string) =>
    [...analyticsKeys.all, 'patterns', userId, dateRange ?? '__default-range'] as const,
  longitudinal: (userId: string, dateRange?: string, dimensions?: string[] | null) =>
    [
      ...analyticsKeys.all,
      'longitudinal',
      userId,
      dateRange ?? '__default-range',
      Array.isArray(dimensions) && dimensions.length > 0
        ? dimensions.join(',')
        : '__all-dimensions',
    ] as const,
  correlations: (userId: string) => [...analyticsKeys.all, 'correlations', userId] as const,
  peerBenchmark: (userId: string, objectiveId?: string) =>
    [...analyticsKeys.all, 'peer-benchmark', userId, objectiveId] as const,
  dashboard: (userId: string, timeRange?: string) =>
    [...analyticsKeys.all, 'dashboard', userId, timeRange] as const,
  comparison: (userId: string, peerGroup?: string) =>
    [...analyticsKeys.all, 'comparison', userId, peerGroup] as const,
} as const

// ============================================================================
// Default Query Options
// ============================================================================

/**
 * Default options for queries with frequent updates
 */
export const frequentQueryOptions: Partial<UseQueryOptions> = {
  staleTime: STALE_TIME.FREQUENT,
  gcTime: GC_TIME.MEDIUM,
  retry: (failureCount, error) => shouldRetry(failureCount, error),
  retryDelay: getRetryDelay,
  refetchOnWindowFocus: false,
}

/**
 * Default options for queries with moderate stability
 */
export const moderateQueryOptions: Partial<UseQueryOptions> = {
  staleTime: STALE_TIME.MODERATE,
  gcTime: GC_TIME.LONG,
  retry: (failureCount, error) => shouldRetry(failureCount, error),
  retryDelay: getRetryDelay,
  refetchOnWindowFocus: false,
}

/**
 * Default options for stable data queries
 */
export const stableQueryOptions: Partial<UseQueryOptions> = {
  staleTime: STALE_TIME.STABLE,
  gcTime: GC_TIME.EXTENDED,
  retry: (failureCount, error) => shouldRetry(failureCount, error),
  retryDelay: getRetryDelay,
  refetchOnWindowFocus: false,
}

// ============================================================================
// Mutation Options
// ============================================================================

/**
 * Create mutation options with error handling
 */
export function createMutationOptions<TData, TVariables>(
  successMessage?: string,
  errorMessage?: string,
): Partial<UseMutationOptions<TData, ApiError, TVariables>> {
  return {
    onSuccess: () => {
      if (successMessage) {
        handleApiSuccess(successMessage)
      }
    },
    onError: (error) => {
      handleApiError(error, errorMessage)
    },
    retry: (failureCount, error) => shouldRetry(failureCount, error),
    retryDelay: getRetryDelay,
  }
}

// ============================================================================
// Cache Invalidation Utilities
// ============================================================================

/**
 * Invalidate all validation-related queries
 */
export function invalidateValidationQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: validationKeys.all })
}

/**
 * Invalidate all challenge-related queries
 */
export function invalidateChallengeQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: challengeKeys.all })
}

/**
 * Invalidate all adaptive-related queries
 */
export function invalidateAdaptiveQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: adaptiveKeys.all })
}

/**
 * Invalidate all analytics-related queries
 */
export function invalidateAnalyticsQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
}

/**
 * Invalidate all queries (full cache refresh)
 */
export function invalidateAllQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries()
}
