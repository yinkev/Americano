/**
 * Consolidated TypeScript interfaces for FastAPI models (hand-curated subset).
 * Source of truth: apps/api/src/** (Pydantic BaseModel classes).
 * Mapping rules: str->string; int/float->number; bool->boolean;
 * datetime/date/time -> string (ISO 8601);
 * List[T] -> T[]; Dict[str,T] -> Record<string,T>; Optional[T] -> T | null.
 * NOTE: This file is safe to import in apps/web; a package mirror is also
 * provided at packages/api-client/src/types.ts.
 */

// ---------- Validation ----------
export interface PromptGenerationRequest {
  objective_id: string
  objective_text: string
}

export type PromptType = 'Direct Question' | 'Clinical Scenario' | 'Teaching Simulation'

export interface PromptGenerationResponse {
  prompt_text: string
  prompt_type: PromptType
  expected_criteria: string[]
}

// ---------- Challenge ----------
export interface RetryScheduleRequest {
  failure_id: string
  failed_at?: string // ISO datetime
}

export interface RetryScheduleResponse {
  failure_id: string
  retry_dates: string[] // ISO dates
  retry_intervals_days: number[]
  reasoning: string
  variation_strategy: string
}

// ---------- Adaptive ----------
export interface NextQuestionRequest {
  session_id: string
  objective_id: string
  question_id?: string | null
  user_answer?: string | null
  current_difficulty: number // 0-100
}

export interface IRTMetrics {
  theta: number
  standard_error: number
  confidence_interval: number
  iterations: number
  converged: boolean
}

export interface EfficiencyMetrics {
  questions_asked: number
  baseline_questions: number
  time_saved_percent: number
  efficiency_score: number
}

export interface QuestionData {
  question_id: string
  question_text: string
  difficulty: number
  discrimination: number
  is_follow_up: boolean
  parent_question_id?: string | null
}

export interface NextQuestionResponse {
  question: QuestionData
  irt_metrics: IRTMetrics
  efficiency_metrics: EfficiencyMetrics
  should_end: boolean
  adjustment_reason?: string | null
}

// ---------- Analytics ----------
export interface AnalyticsHealth {
  status: string
  service: string
  version: string
  timestamp: string // ISO datetime
}

export type { } // keep file a module

