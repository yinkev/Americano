/**
 * Challenge API Hooks (Story 4.3)
 *
 * React Query hooks for controlled failure challenges:
 * - useChallengeFeedback: Generate corrective feedback
 * - useDetectPatterns: Detect failure patterns
 * - useScheduleRetries: Schedule spaced repetition retries
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type {
  FeedbackRequest,
  FeedbackResponse,
  PatternDetectionRequest,
  PatternDetectionResponse,
  RetryScheduleRequest,
  RetryScheduleResponse,
} from './types/generated'
import {
  challengeKeys,
  createMutationOptions,
  frequentQueryOptions,
  invalidateChallengeQueries,
} from './utils'

// ============================================================================
// Generate Challenge Feedback
// ============================================================================

/**
 * Generate corrective feedback for a failed challenge
 *
 * Uses AI (ChatMock/GPT-5) via instructor to create structured feedback:
 * - Explains misconception
 * - Clarifies correct concept
 * - Provides clinical context
 * - Creates memory anchor (mnemonic/analogy/story)
 *
 * @example
 * ```tsx
 * const generateFeedback = useChallengeFeedback();
 *
 * const handleFailure = async () => {
 *   const result = await generateFeedback.mutateAsync({
 *     challenge_id: "challenge_123",
 *     objective_id: "obj_456",
 *     question_text: "Which drug...",
 *     correct_answer: "Lisinopril",
 *     user_answer: "Metoprolol",
 *     misconception_category: "drug_mechanism"
 *   });
 *
 *   console.log(result.feedback.misconception_explained);
 *   console.log(result.feedback.correct_concept);
 *   console.log(result.feedback.memory_anchor);
 *   console.log(result.feedback.memory_anchor_type); // "mnemonic"
 * };
 * ```
 */
export function useChallengeFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: FeedbackRequest): Promise<FeedbackResponse> => {
      return api.post<FeedbackResponse>('/challenge/feedback', request)
    },
    ...createMutationOptions<FeedbackResponse, FeedbackRequest>(
      'Feedback generated successfully',
      'Failed to generate feedback',
    ),
    onSuccess: () => {
      invalidateChallengeQueries(queryClient)
      // Also invalidate analytics since feedback affects learning patterns
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ============================================================================
// Schedule Spaced Repetition Retries
// ============================================================================

/**
 * Schedule retry attempts using spaced repetition intervals
 *
 * Generates 5 retry dates: +1, +3, +7, +14, +30 days from failure.
 * Uses variation strategy to test understanding, not memorization.
 *
 * @example
 * ```tsx
 * const scheduleRetries = useScheduleRetries();
 *
 * const handleSchedule = async () => {
 *   const result = await scheduleRetries.mutateAsync({
 *     failure_id: "failure_789",
 *     challenge_id: "challenge_123",
 *     objective_id: "obj_456",
 *     failed_at: new Date().toISOString()
 *   });
 *
 *   console.log(result.retry_dates); // 5 ISO timestamps
 *   console.log(result.variation_strategy); // "Rephrase with different clinical context"
 *   console.log(result.reasoning); // Why this schedule
 * };
 * ```
 */
export function useScheduleRetries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: RetryScheduleRequest): Promise<RetryScheduleResponse> => {
      return api.post<RetryScheduleResponse>('/challenge/schedule-retries', request)
    },
    ...createMutationOptions<RetryScheduleResponse, RetryScheduleRequest>(
      'Retries scheduled successfully',
      'Failed to schedule retries',
    ),
    onSuccess: () => {
      invalidateChallengeQueries(queryClient)
    },
  })
}

// ============================================================================
// Detect Failure Patterns
// ============================================================================

/**
 * Detect chronic failure patterns and mastery status
 *
 * Analyzes controlled failures to identify:
 * - Chronic struggles (3+ failures on same objective)
 * - Partial mastery (some retries passed)
 * - Mastered objectives (all retries passed)
 *
 * Returns recommendations for intervention strategies.
 *
 * @param userId - User ID to analyze
 * @param objectiveId - Optional objective filter
 * @param timeframeDays - Optional days to look back (default 90)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDetectPatterns({
 *   user_id: "user_123",
 *   objective_id: "obj_456", // Optional
 *   timeframe_days: 90
 * });
 *
 * if (data) {
 *   console.log(data.patterns.chronic_struggles); // ["obj_789", "obj_012"]
 *   console.log(data.patterns.partial_mastery); // ["obj_345"]
 *   console.log(data.patterns.mastered); // ["obj_678"]
 *   console.log(data.recommendations); // AI suggestions
 * }
 * ```
 */
export function useDetectPatterns(request: PatternDetectionRequest) {
  return useQuery({
    queryKey: challengeKeys.patterns(request.user_id, request.objective_id),
    queryFn: async (): Promise<PatternDetectionResponse> => {
      return api.post<PatternDetectionResponse>('/challenge/detect-patterns', request)
    },
    ...frequentQueryOptions,
    enabled: !!request.user_id,
  })
}

// ============================================================================
// Get Specific Failure Records (Query)
// ============================================================================

/**
 * Fetch detailed failure records for review
 *
 * Retrieves specific controlled failure attempts with retry history.
 * Useful for reviewing past challenges and tracking progress.
 *
 * @param userId - User ID
 * @param objectiveId - Optional objective filter
 *
 * @example
 * ```tsx
 * const { data } = useFailureRecords("user_123", "obj_456");
 *
 * if (data) {
 *   data.failure_records.forEach(record => {
 *     console.log(record.objective_name);
 *     console.log(record.retry_count);
 *     console.log(record.mastery_status); // "not_mastered" | "partial" | "mastered"
 *   });
 * }
 * ```
 */
export function useFailureRecords(userId: string, objectiveId?: string) {
  return useQuery({
    queryKey: challengeKeys.patterns(userId, objectiveId),
    queryFn: async (): Promise<PatternDetectionResponse> => {
      return api.post<PatternDetectionResponse>('/challenge/detect-patterns', {
        user_id: userId,
        objective_id: objectiveId,
        timeframe_days: 90,
      })
    },
    ...frequentQueryOptions,
    enabled: !!userId,
  })
}
