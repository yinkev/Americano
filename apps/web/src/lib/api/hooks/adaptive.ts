/**
 * Adaptive API Hooks (Story 4.5)
 *
 * React Query hooks for adaptive questioning with IRT:
 * - useNextQuestion: Get next adaptive question
 * - useSessionMetrics: Get session IRT metrics
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type {
  NextQuestionRequest,
  NextQuestionResponse,
  SessionMetricsResponse,
} from './types/generated'
import {
  adaptiveKeys,
  createMutationOptions,
  frequentQueryOptions,
  invalidateAdaptiveQueries,
} from './utils'

// ============================================================================
// Get Next Adaptive Question
// ============================================================================

/**
 * Get next question using IRT (Item Response Theory) algorithm
 *
 * Algorithm:
 * 1. Calculate initial difficulty from history (if first question)
 * 2. Adjust difficulty based on last score
 * 3. Update IRT theta estimate from response pattern
 * 4. Select question using maximum information principle
 * 5. Check early stopping criteria (CI < 0.3)
 *
 * Returns next question with IRT metrics and efficiency data.
 *
 * @example
 * ```tsx
 * const getNextQuestion = useNextQuestion();
 *
 * const handleNext = async () => {
 *   const result = await getNextQuestion.mutateAsync({
 *     session_id: "session_123",
 *     user_id: "user_456",
 *     objective_id: "obj_789",
 *     response_history: [
 *       { question_id: "q1", score: 85, time_spent: 45, confidence: 4 },
 *       { question_id: "q2", score: 72, time_spent: 60, confidence: 3 }
 *     ],
 *     last_score: 72,
 *     last_confidence: 3
 *   });
 *
 *   console.log(result.question.question_text);
 *   console.log(result.irt_metrics.theta); // Ability estimate: 0.5
 *   console.log(result.irt_metrics.theta_ci_lower); // CI: 0.3 - 0.7
 *   console.log(result.should_continue); // false if early stop
 *   console.log(result.efficiency_metrics.questions_answered); // 3
 * };
 * ```
 */
export function useNextQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: NextQuestionRequest): Promise<NextQuestionResponse> => {
      return api.post<NextQuestionResponse>('/adaptive/question/next', request)
    },
    ...createMutationOptions<NextQuestionResponse, NextQuestionRequest>(
      undefined, // No success toast for seamless UX
      'Failed to get next question',
    ),
    onSuccess: (data, variables) => {
      // Update session metrics cache optimistically
      queryClient.setQueryData(
        adaptiveKeys.sessionMetrics(variables.session_id, variables.objective_id),
        (old: SessionMetricsResponse | undefined) => {
          if (!old) return undefined
          return {
            ...old,
            irt_metrics: data.irt_metrics,
            efficiency_metrics: data.efficiency_metrics,
            response_count: variables.response_history.length,
          }
        },
      )

      invalidateAdaptiveQueries(queryClient)
    },
  })
}

// ============================================================================
// Get Session Metrics
// ============================================================================

/**
 * Get IRT metrics and efficiency data for an adaptive session
 *
 * Retrieves:
 * - IRT theta (ability) estimate with confidence intervals
 * - Efficiency metrics (questions answered vs target)
 * - Session statistics (duration, average score)
 *
 * Use this to display progress and stopping criteria to users.
 *
 * @param sessionId - Learning session ID
 * @param objectiveId - Learning objective ID
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSessionMetrics("session_123", "obj_789");
 *
 * if (data) {
 *   console.log(`Ability: ${data.irt_metrics.theta.toFixed(2)}`);
 *   console.log(`CI: ${data.irt_metrics.theta_ci_lower} - ${data.irt_metrics.theta_ci_upper}`);
 *   console.log(`Questions: ${data.efficiency_metrics.questions_answered}/${data.efficiency_metrics.target_questions}`);
 *   console.log(`Average Score: ${data.average_score}%`);
 *   console.log(`Duration: ${Math.floor(data.session_duration / 60)} minutes`);
 * }
 * ```
 */
export function useSessionMetrics(sessionId: string | null, objectiveId: string | null) {
  return useQuery({
    queryKey: adaptiveKeys.sessionMetrics(sessionId || '', objectiveId || ''),
    queryFn: async (): Promise<SessionMetricsResponse> => {
      return api.get<SessionMetricsResponse>(`/adaptive/session/${sessionId}/metrics`, {
        objective_id: objectiveId || undefined,
      })
    },
    ...frequentQueryOptions,
    enabled: !!sessionId && !!objectiveId,
    refetchInterval: 30000, // Refresh every 30s during active session
  })
}
