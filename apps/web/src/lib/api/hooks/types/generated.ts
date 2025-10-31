// Adaptive module types (not present in api-generated yet)
export interface NextQuestionRequest {
  session_id: string
  user_id: string
  objective_id: string
  response_history: Array<{
    question_id: string
    score: number
    time_spent: number
    confidence: number
  }>
  last_score?: number
  last_confidence?: number
}

export interface NextQuestionResponse {
  question: {
    question_id?: string
    question_text: string
    options?: Array<{ label: string; text: string }>
  }
  irt_metrics: {
    theta: number
    theta_ci_lower: number
    theta_ci_upper: number
  }
  efficiency_metrics: {
    questions_answered: number
    target_questions: number
  }
  should_continue: boolean
  average_score?: number
}

export interface SessionMetricsResponse {
  irt_metrics: {
    theta: number
    theta_ci_lower: number
    theta_ci_upper: number
  }
  efficiency_metrics: {
    questions_answered: number
    target_questions: number
  }
  response_count?: number
  average_score: number
  session_duration: number // seconds
}

// Explicit exports for Analytics module
export type {
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
  RecommendationsRequest,
  TimeToMasteryEstimate,
  UnderstandingPrediction,
  WeeklyTopObjective,
} from '../../../../types/api-generated'
// Re-export from generated API types using corrected path
// Note: file resides at src/lib/api/hooks/types; actual types live in src/types
// so we need four ".." segments to reach src then go into types/
// ../../../../types/api-generated
// Keeping explicit named re-exports to avoid circular deps in hook modules
// and to allow tree-shaking of unused types.
//
// If this path changes again, prefer importing via an alias in tsconfig paths.
// For now we stay relative to keep build tooling simple.
//
// See src/types/api-generated.ts for the full set of available types.

// Explicit exports for Challenge module
export type {
  FeedbackRequest,
  FeedbackResponse,
  PatternDetectionRequest,
  PatternDetectionResponse,
  RetryScheduleRequest,
  RetryScheduleResponse,
} from '../../../../types/api-generated'

// Explicit exports for Validation module
export type {
  ChallengeGenerationRequest,
  ChallengeIdentificationRequest,
  ClinicalEvaluationRequest,
  ClinicalEvaluationResult,
  EvaluationRequest,
  EvaluationResult,
  PromptGenerationRequest,
  PromptGenerationResponse,
  ScenarioGenerationRequest,
  ScenarioGenerationResponse,
} from '../../../../types/api-generated'

// Locally defined or proxied Validation types not present in api-generated
// - ChallengeQuestionResponse comes from the challenge question generator client
// - ScenarioMetricsResponse is a lightweight shape used by useScenarioMetrics()
// - ChallengeIdentificationResponse is returned by identify-challenge endpoint
export type { ChallengeQuestionResponse } from '../../../challenge-question-generator'

export interface ScenarioMetricsResponse {
  total_scenarios_completed: number
  average_score: number
  by_difficulty?: Record<string, { avg_score: number; count: number }>
}

export interface ChallengeIdentificationResponse {
  should_generate_challenge: boolean
  challenge_type: 'reasoning' | 'retry' | 'recall' | string
  difficulty_target?: number
  [k: string]: unknown
}
