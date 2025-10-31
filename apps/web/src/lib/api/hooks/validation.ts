/**
 * Validation API Hooks (Story 4.1 & 4.2)
 *
 * React Query hooks for comprehension validation and clinical scenarios:
 * - useGeneratePrompt: Generate comprehension prompts
 * - useEvaluateResponse: Evaluate user explanations
 * - useGenerateScenario: Generate clinical scenarios
 * - useEvaluateScenario: Evaluate clinical reasoning
 * - useScenarioMetrics: Get scenario performance metrics
 * - useIdentifyChallenge: Identify if challenge needed
 * - useGenerateChallenge: Generate controlled failure challenges
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type {
  ChallengeGenerationRequest,
  ChallengeIdentificationRequest,
  ChallengeIdentificationResponse,
  ChallengeQuestionResponse,
  ClinicalEvaluationRequest,
  ClinicalEvaluationResult,
  EvaluationRequest,
  EvaluationResult,
  PromptGenerationRequest,
  PromptGenerationResponse,
  ScenarioGenerationRequest,
  ScenarioGenerationResponse,
  ScenarioMetricsResponse,
} from './types/generated'
import {
  createMutationOptions,
  frequentQueryOptions,
  handleApiError,
  invalidateValidationQueries,
  validationKeys,
} from './utils'

// ============================================================================
// Generate Comprehension Prompt
// ============================================================================

/**
 * Generate a comprehension validation prompt for a learning objective
 *
 * Creates varied "Explain to a patient" prompts using AI (ChatMock/GPT-4).
 * Returns prompt text, type, and expected criteria for evaluation.
 *
 * @example
 * ```tsx
 * const generatePrompt = useGeneratePrompt();
 *
 * const handleGenerate = async () => {
 *   const result = await generatePrompt.mutateAsync({
 *     objective_id: "obj_123",
 *     objective_text: "Cardiac conduction system"
 *   });
 *   console.log(result.prompt_text);
 *   console.log(result.prompt_type); // "Clinical Scenario"
 * };
 * ```
 */
export function useGeneratePrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: PromptGenerationRequest): Promise<PromptGenerationResponse> => {
      return api.post<PromptGenerationResponse>('/validation/generate-prompt', request)
    },
    ...createMutationOptions<PromptGenerationResponse, PromptGenerationRequest>(
      'Prompt generated successfully',
      'Failed to generate prompt',
    ),
    onSuccess: () => {
      invalidateValidationQueries(queryClient)
    },
  })
}

// ============================================================================
// Evaluate User Response
// ============================================================================

/**
 * Evaluate a user's explanation using AI-powered multi-dimensional scoring
 *
 * Scores 4 dimensions (terminology, relationships, application, clarity)
 * and provides calibration feedback. Returns strengths and gaps.
 *
 * @example
 * ```tsx
 * const evaluateResponse = useEvaluateResponse();
 *
 * const handleSubmit = async () => {
 *   const result = await evaluateResponse.mutateAsync({
 *     prompt_id: "prompt_123",
 *     user_answer: userText,
 *     confidence_level: 4,
 *     objective_text: "Cardiac conduction"
 *   });
 *
 *   console.log(result.overall_score); // 85
 *   console.log(result.calibration_delta); // -5 (underconfident)
 *   console.log(result.strengths); // ["Clear terminology", "Good examples"]
 * };
 * ```
 */
export function useEvaluateResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: EvaluationRequest): Promise<EvaluationResult> => {
      return api.post<EvaluationResult>('/validation/evaluate', request)
    },
    ...createMutationOptions<EvaluationResult, EvaluationRequest>(
      'Response evaluated successfully',
      'Failed to evaluate response',
    ),
    onSuccess: () => {
      // Invalidate validation and analytics queries
      invalidateValidationQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ============================================================================
// Generate Clinical Scenario
// ============================================================================

/**
 * Generate a clinical case scenario for reasoning practice
 *
 * Creates multi-stage clinical cases with decision points, labs, and
 * differential diagnosis. Difficulty adapts to user level.
 *
 * @example
 * ```tsx
 * const generateScenario = useGenerateScenario();
 *
 * const handleGenerate = async () => {
 *   const result = await generateScenario.mutateAsync({
 *     objective_id: "obj_456",
 *     objective_text: "Acute MI diagnosis",
 *     board_exam_tags: ["USMLE-Step2", "COMLEX-Level2"],
 *     difficulty: "INTERMEDIATE"
 *   });
 *
 *   console.log(result.case.chief_complaint);
 *   console.log(result.case.questions); // Decision points
 *   console.log(result.learning_points);
 * };
 * ```
 */
export function useGenerateScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ScenarioGenerationRequest): Promise<ScenarioGenerationResponse> => {
      return api.post<ScenarioGenerationResponse>('/validation/generate-scenario', request)
    },
    ...createMutationOptions<ScenarioGenerationResponse, ScenarioGenerationRequest>(
      'Clinical scenario generated',
      'Failed to generate scenario',
    ),
    onSuccess: () => {
      invalidateValidationQueries(queryClient)
    },
  })
}

// ============================================================================
// Evaluate Clinical Scenario
// ============================================================================

/**
 * Evaluate user's clinical reasoning on a scenario
 *
 * Scores clinical reasoning, differential diagnosis accuracy, and
 * management appropriateness. Identifies specific errors at each stage.
 *
 * @example
 * ```tsx
 * const evaluateScenario = useEvaluateScenario();
 *
 * const handleSubmit = async () => {
 *   const result = await evaluateScenario.mutateAsync({
 *     scenario_id: "scenario_789",
 *     user_choices: { stage1: 0, stage2: 2 },
 *     user_reasoning: "Patient presents with...",
 *     time_spent: 180,
 *     case_summary: "45yo male, chest pain..."
 *   });
 *
 *   console.log(result.overall_score); // 78
 *   console.log(result.decision_points_correct); // 4/6
 *   console.log(result.errors); // Specific mistakes
 * };
 * ```
 */
export function useEvaluateScenario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ClinicalEvaluationRequest): Promise<ClinicalEvaluationResult> => {
      return api.post<ClinicalEvaluationResult>('/validation/evaluate-scenario', request)
    },
    ...createMutationOptions<ClinicalEvaluationResult, ClinicalEvaluationRequest>(
      'Scenario evaluated successfully',
      'Failed to evaluate scenario',
    ),
    onSuccess: () => {
      invalidateValidationQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

// ============================================================================
// Get Scenario Metrics
// ============================================================================

/**
 * Get aggregated metrics for clinical scenarios
 *
 * Retrieves total scenarios completed, average scores, and breakdown
 * by difficulty level. Useful for progress tracking.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useScenarioMetrics();
 *
 * if (data) {
 *   console.log(data.total_scenarios_completed); // 23
 *   console.log(data.average_score); // 82
 *   console.log(data.by_difficulty.ADVANCED.avg_score); // 75
 * }
 * ```
 */
export function useScenarioMetrics() {
  return useQuery({
    queryKey: validationKeys.scenarioMetrics(),
    queryFn: async (): Promise<ScenarioMetricsResponse> => {
      return api.get<ScenarioMetricsResponse>('/validation/scenarios/metrics')
    },
    ...frequentQueryOptions,
  })
}

// ============================================================================
// Identify Challenge Need
// ============================================================================

/**
 * Identify if a controlled failure challenge should be generated
 *
 * Analyzes recent performance to detect false confidence patterns.
 * Returns challenge recommendation and difficulty target.
 *
 * @param request - User ID, objective ID, and recent scores
 *
 * @example
 * ```tsx
 * const { data } = useIdentifyChallenge({
 *   user_id: "user_123",
 *   objective_id: "obj_456",
 *   recent_scores: [85, 88, 90, 87]
 * });
 *
 * if (data?.should_generate_challenge) {
 *   console.log(data.challenge_type); // "reasoning"
 *   console.log(data.difficulty_target); // 0.4 (40% success)
 * }
 * ```
 */
export function useIdentifyChallenge(request: ChallengeIdentificationRequest) {
  return useQuery({
    // Use user_id for a stable cache key; request shape comes from generated types
    queryKey: validationKeys.challenge(request.user_id),
    queryFn: async (): Promise<ChallengeIdentificationResponse> => {
      return api.post<ChallengeIdentificationResponse>('/validation/identify-challenge', request)
    },
    ...frequentQueryOptions,
    // Guard against unknown performance_data shape and require at least 3 records
    enabled: Array.isArray(request.performance_data) && request.performance_data.length >= 3,
  })
}

// ============================================================================
// Generate Challenge Question
// ============================================================================

/**
 * Generate a controlled failure challenge question
 *
 * Creates deliberately difficult questions targeting 30-50% success rate
 * to calibrate overconfidence. Returns question with difficulty metrics.
 *
 * @example
 * ```tsx
 * const generateChallenge = useGenerateChallenge();
 *
 * const handleGenerate = async () => {
 *   const result = await generateChallenge.mutateAsync({
 *     objective_id: "obj_789",
 *     objective_text: "Heart failure management",
 *     challenge_type: "reasoning",
 *     target_difficulty: 0.4
 *   });
 *
 *   console.log(result.question_text);
 *   console.log(result.options);
 *   console.log(result.difficulty); // 0.42
 * };
 * ```
 */
export function useGenerateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ChallengeGenerationRequest): Promise<ChallengeQuestionResponse> => {
      return api.post<ChallengeQuestionResponse>('/validation/generate-challenge', request)
    },
    ...createMutationOptions<ChallengeQuestionResponse, ChallengeGenerationRequest>(
      'Challenge question generated',
      'Failed to generate challenge',
    ),
    onSuccess: () => {
      invalidateValidationQueries(queryClient)
    },
  })
}

// ============================================================================
// Get Single Scenario (Query)
// ============================================================================

/**
 * Fetch a single scenario by ID
 *
 * Retrieves a previously generated scenario for review or retry.
 * Useful for spaced repetition of clinical cases.
 *
 * @param scenarioId - Scenario ID to fetch
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useGetScenario("scenario_123");
 *
 * if (data) {
 *   console.log(data.case.chief_complaint);
 *   console.log(data.learning_points);
 * }
 * ```
 */
export function useGetScenario(scenarioId: string | null) {
  return useQuery({
    queryKey: validationKeys.scenario(scenarioId || ''),
    queryFn: async (): Promise<ScenarioGenerationResponse> => {
      return api.get<ScenarioGenerationResponse>(`/validation/scenarios/${scenarioId}`)
    },
    ...frequentQueryOptions,
    enabled: !!scenarioId,
  })
}
