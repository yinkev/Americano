/**
 * React Query Hooks for Americano API
 *
 * Type-safe API hooks for all 34 backend endpoints across Epic 4 stories.
 *
 * @module hooks
 */

// Export adaptive hooks (Story 4.5)
export { useNextQuestion, useSessionMetrics } from './adaptive'
// Export analytics hooks (Story 4.6)
export {
  useCorrelations,
  useDailyInsight,
  useInterventions,
  useLongitudinal,
  usePatterns,
  usePeerBenchmark,
  usePredictions,
  useRecommendations,
  useSuccessProbability,
  useTimeToMastery,
  useUnderstandingComparison,
  useUnderstandingDashboard,
  useWeeklySummary,
} from './analytics'

// Export challenge hooks (Story 4.3)
export {
  useChallengeFeedback,
  useDetectPatterns,
  useFailureRecords,
  useScheduleRetries,
} from './challenge'
// Export types
export type * from './types/generated'
// Export all utilities
export * from './utils'
// Export validation hooks (Story 4.1 & 4.2)
export {
  useEvaluateResponse,
  useEvaluateScenario,
  useGenerateChallenge,
  useGeneratePrompt,
  useGenerateScenario,
  useGetScenario,
  useIdentifyChallenge,
  useScenarioMetrics,
} from './validation'
