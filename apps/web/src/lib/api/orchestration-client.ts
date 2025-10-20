/**
 * Type-Safe Orchestration API Client
 *
 * Provides a fully type-safe client for all orchestration endpoints with:
 * - Runtime validation using Zod
 * - Comprehensive error handling
 * - Type inference for requests and responses
 * - Standardized error messages
 *
 * @module OrchestrationClient
 */

import { z } from 'zod'

// ============================================================================
// Core API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 * Used for consistent response handling across all endpoints
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean().optional(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    details: z.array(z.any()).optional(),
  })

export type ApiResponse<T> = {
  success?: boolean
  data?: T
  error?: string
  details?: any[]
}

// ============================================================================
// Recommendations Endpoint Types
// ============================================================================

/**
 * Individual time slot recommendation
 */
export const TimeSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  estimatedPerformance: z.number().min(0).max(100),
})

export type TimeSlot = z.infer<typeof TimeSlotSchema>

/**
 * Recommendations response with cognitive load
 */
export const RecommendationsResponseSchema = z.object({
  recommendations: z.array(TimeSlotSchema),
  cognitiveLoad: z.number().min(0).max(100),
  generatedAt: z.string().datetime(),
})

export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>

/**
 * Recommendations request body
 */
export const RecommendationsRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  date: z.string().datetime().optional(),
  missionId: z.string().optional(),
})

export type RecommendationsRequest = z.infer<typeof RecommendationsRequestSchema>

// ============================================================================
// Session Plan Endpoint Types
// ============================================================================

/**
 * Content sequence item
 */
export const ContentSequenceItemSchema = z.object({
  contentId: z.string(),
  type: z.enum(['lecture', 'flashcard', 'assessment', 'break']),
  estimatedDuration: z.number(),
  phase: z.enum(['warmup', 'focus', 'cooldown']),
})

export type ContentSequenceItem = z.infer<typeof ContentSequenceItemSchema>

/**
 * Content sequence with phases
 */
export const ContentSequenceSchema = z.object({
  sequence: z.array(ContentSequenceItemSchema),
  totalDuration: z.number(),
  phaseBreakdown: z.object({
    warmup: z.number(),
    focus: z.number(),
    cooldown: z.number(),
  }),
})

export type ContentSequence = z.infer<typeof ContentSequenceSchema>

/**
 * Break recommendation
 */
export const BreakRecommendationSchema = z.object({
  minute: z.number(),
  duration: z.number(),
  reason: z.string(),
})

export type BreakRecommendation = z.infer<typeof BreakRecommendationSchema>

/**
 * Session plan reasoning
 */
export const SessionPlanReasoningSchema = z.object({
  timeSelection: z.array(z.string()),
  durationLogic: z.array(z.string()),
  contentSequencing: z.array(z.string()),
  intensityFactors: z.array(z.string()),
})

export type SessionPlanReasoning = z.infer<typeof SessionPlanReasoningSchema>

/**
 * Complete session plan
 */
export const SessionPlanSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number(),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  contentSequence: ContentSequenceSchema,
  breaks: z.array(BreakRecommendationSchema),
  confidence: z.number().min(0).max(1),
  reasoning: SessionPlanReasoningSchema,
})

export type SessionPlan = z.infer<typeof SessionPlanSchema>

/**
 * Session plan response
 */
export const SessionPlanResponseSchema = z.object({
  plan: SessionPlanSchema,
  confidence: z.number().min(0).max(1),
})

export type SessionPlanResponse = z.infer<typeof SessionPlanResponseSchema>

/**
 * Session plan request body
 */
export const SessionPlanRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  missionId: z.string().min(1, 'Mission ID is required'),
  startTime: z.string().datetime(),
  duration: z.number().min(15).max(180).optional(),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
})

export type SessionPlanRequest = z.infer<typeof SessionPlanRequestSchema>

// ============================================================================
// Cognitive Load Endpoint Types
// ============================================================================

/**
 * Cognitive load response
 */
export const CognitiveLoadResponseSchema = z.object({
  load: z.number().min(0).max(100),
  level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  recommendation: z.string(),
  trend: z.array(z.number()).optional(),
})

export type CognitiveLoadResponse = z.infer<typeof CognitiveLoadResponseSchema>

// ============================================================================
// Adapt Schedule Endpoint Types
// ============================================================================

/**
 * Schedule adaptation type
 */
export const AdaptationTypeSchema = z.enum([
  'TIME_SHIFT',
  'DURATION_CHANGE',
  'INTENSITY_ADJUSTMENT',
  'FREQUENCY_CHANGE',
])

export type AdaptationType = z.infer<typeof AdaptationTypeSchema>

/**
 * Adapt schedule request
 */
export const AdaptScheduleRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  adaptationType: AdaptationTypeSchema,
  reason: z.string().min(1, 'Reason is required'),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
})

export type AdaptScheduleRequest = z.infer<typeof AdaptScheduleRequestSchema>

/**
 * Adapt schedule response
 */
export const AdaptScheduleResponseSchema = z.object({
  updatedRecommendations: z.array(TimeSlotSchema),
  adaptationId: z.string(),
  message: z.string(),
})

export type AdaptScheduleResponse = z.infer<typeof AdaptScheduleResponseSchema>

// ============================================================================
// Effectiveness Endpoint Types
// ============================================================================

/**
 * Effectiveness statistics
 */
export const EffectivenessStatsSchema = z.object({
  totalSessions: z.number(),
  orchestratedSessions: z.number(),
  selfScheduledSessions: z.number(),
  orchestratedAvgPerformance: z.number(),
  selfScheduledAvgPerformance: z.number(),
})

export type EffectivenessStats = z.infer<typeof EffectivenessStatsSchema>

/**
 * Effectiveness response
 */
export const EffectivenessResponseSchema = z.object({
  adherenceRate: z.number(),
  performanceImprovement: z.number(),
  avgConfidence: z.number(),
  insights: z.array(z.string()),
  stats: EffectivenessStatsSchema,
})

export type EffectivenessResponse = z.infer<typeof EffectivenessResponseSchema>

// ============================================================================
// Error Types
// ============================================================================

/**
 * Orchestration API error with detailed information
 */
export class OrchestrationApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly details?: any[],
  ) {
    super(message)
    this.name = 'OrchestrationApiError'
  }
}

/**
 * Validation error for request/response validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError: z.ZodError,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// API Client Configuration
// ============================================================================

export interface OrchestrationClientConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
}

// ============================================================================
// Main API Client
// ============================================================================

/**
 * Type-safe client for orchestration API endpoints
 *
 * Features:
 * - Runtime validation with Zod
 * - Type inference from schemas
 * - Comprehensive error handling
 * - Configurable timeout and headers
 *
 * @example
 * ```typescript
 * const client = new OrchestrationClient({ timeout: 10000 })
 *
 * try {
 *   const recommendations = await client.getRecommendations({
 *     userId: 'user-123',
 *     date: new Date().toISOString()
 *   })
 *   console.log('Cognitive load:', recommendations.cognitiveLoad)
 * } catch (error) {
 *   if (error instanceof OrchestrationApiError) {
 *     console.error(`API error (${error.statusCode}):`, error.message)
 *   }
 * }
 * ```
 */
export class OrchestrationClient {
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly headers: Record<string, string>

  constructor(config: OrchestrationClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/orchestration'
    this.timeout = config.timeout || 30000 // 30 seconds default
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  /**
   * Internal fetch wrapper with timeout and error handling
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      })
      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OrchestrationApiError(`Request timeout after ${this.timeout}ms`, 408, url)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Parse and validate response data
   */
  private async parseResponse<T>(
    response: Response,
    schema: z.ZodType<T>,
    endpoint: string,
  ): Promise<T> {
    // Handle non-2xx status codes
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let details: any[] | undefined

      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage = errorData.error
        }
        if (errorData.details) {
          details = errorData.details
        }
      } catch {
        // If error response is not JSON, use default message
      }

      throw new OrchestrationApiError(errorMessage, response.status, endpoint, details)
    }

    // Parse response body
    let data: unknown
    try {
      data = await response.json()
    } catch (error) {
      throw new OrchestrationApiError('Invalid JSON response from server', 500, endpoint)
    }

    // Validate response against schema
    const result = schema.safeParse(data)
    if (!result.success) {
      throw new ValidationError(`Response validation failed for ${endpoint}`, result.error)
    }

    return result.data
  }

  /**
   * Validate request body before sending
   */
  private validateRequest<T>(data: unknown, schema: z.ZodType<T>, endpoint: string): T {
    const result = schema.safeParse(data)
    if (!result.success) {
      throw new ValidationError(`Request validation failed for ${endpoint}`, result.error)
    }
    return result.data
  }

  // ==========================================================================
  // API Methods
  // ==========================================================================

  /**
   * Get study time recommendations
   *
   * POST /api/orchestration/recommendations
   *
   * @param request - Recommendations request parameters
   * @returns Time slot recommendations with cognitive load
   * @throws {ValidationError} If request validation fails
   * @throws {OrchestrationApiError} If API request fails
   *
   * @example
   * ```typescript
   * const recommendations = await client.getRecommendations({
   *   userId: 'user-123',
   *   date: '2025-10-17T10:00:00Z',
   *   missionId: 'mission-456'
   * })
   *
   * recommendations.recommendations.forEach(slot => {
   *   console.log(`${slot.startTime}: ${slot.reason} (${slot.confidence})`)
   * })
   * ```
   */
  async getRecommendations(request: RecommendationsRequest): Promise<RecommendationsResponse> {
    const endpoint = `${this.baseUrl}/recommendations`

    // Validate request
    const validatedRequest = this.validateRequest(request, RecommendationsRequestSchema, endpoint)

    // Make request
    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      body: JSON.stringify(validatedRequest),
    })

    // Parse and validate response
    return this.parseResponse(response, RecommendationsResponseSchema, endpoint)
  }

  /**
   * Generate complete session orchestration plan
   *
   * POST /api/orchestration/session-plan
   *
   * @param request - Session plan request parameters
   * @returns Complete orchestration plan with content sequence
   * @throws {ValidationError} If request validation fails
   * @throws {OrchestrationApiError} If API request fails
   *
   * @example
   * ```typescript
   * const { plan, confidence } = await client.generateSessionPlan({
   *   userId: 'user-123',
   *   missionId: 'mission-456',
   *   startTime: '2025-10-17T14:00:00Z',
   *   duration: 60,
   *   intensity: 'MEDIUM'
   * })
   *
   * console.log(`Plan confidence: ${confidence}`)
   * console.log(`Content items: ${plan.contentSequence.sequence.length}`)
   * ```
   */
  async generateSessionPlan(request: SessionPlanRequest): Promise<SessionPlanResponse> {
    const endpoint = `${this.baseUrl}/session-plan`

    // Validate request
    const validatedRequest = this.validateRequest(request, SessionPlanRequestSchema, endpoint)

    // Make request
    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      body: JSON.stringify(validatedRequest),
    })

    // Parse and validate response
    return this.parseResponse(response, SessionPlanResponseSchema, endpoint)
  }

  /**
   * Get current cognitive load assessment
   *
   * GET /api/orchestration/cognitive-load
   *
   * @param userId - User ID to assess
   * @param includeTrend - Include 7-day trend data
   * @returns Cognitive load with recommendation
   * @throws {OrchestrationApiError} If API request fails
   *
   * @example
   * ```typescript
   * const cognitiveLoad = await client.getCognitiveLoad('user-123', true)
   * console.log(`Current load: ${cognitiveLoad.load}% (${cognitiveLoad.level})`)
   * console.log(`Recommendation: ${cognitiveLoad.recommendation}`)
   * if (cognitiveLoad.trend) {
   *   console.log('7-day trend:', cognitiveLoad.trend)
   * }
   * ```
   */
  async getCognitiveLoad(userId: string, includeTrend = false): Promise<CognitiveLoadResponse> {
    const endpoint = `${this.baseUrl}/cognitive-load`
    const url = `${endpoint}?userId=${encodeURIComponent(userId)}&includeTrend=${includeTrend}`

    // Make request
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
    })

    // Parse and validate response
    return this.parseResponse(response, CognitiveLoadResponseSchema, endpoint)
  }

  /**
   * Record schedule adaptation and get updated recommendations
   *
   * POST /api/orchestration/adapt-schedule
   *
   * @param request - Schedule adaptation parameters
   * @returns Updated recommendations after adaptation
   * @throws {ValidationError} If request validation fails
   * @throws {OrchestrationApiError} If API request fails
   *
   * @example
   * ```typescript
   * const result = await client.adaptSchedule({
   *   userId: 'user-123',
   *   adaptationType: 'TIME_SHIFT',
   *   reason: 'User prefers evening sessions',
   *   oldValue: '09:00',
   *   newValue: '18:00'
   * })
   *
   * console.log(result.message)
   * console.log('Updated recommendations:', result.updatedRecommendations)
   * ```
   */
  async adaptSchedule(request: AdaptScheduleRequest): Promise<AdaptScheduleResponse> {
    const endpoint = `${this.baseUrl}/adapt-schedule`

    // Validate request
    const validatedRequest = this.validateRequest(request, AdaptScheduleRequestSchema, endpoint)

    // Make request
    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      body: JSON.stringify(validatedRequest),
    })

    // Parse and validate response
    return this.parseResponse(response, AdaptScheduleResponseSchema, endpoint)
  }

  /**
   * Get orchestration effectiveness metrics
   *
   * GET /api/orchestration/effectiveness
   *
   * @param userId - User ID to analyze
   * @param dateRange - Number of days to analyze (default: 30)
   * @returns Effectiveness metrics and insights
   * @throws {OrchestrationApiError} If API request fails
   *
   * @example
   * ```typescript
   * const effectiveness = await client.getEffectiveness('user-123', 30)
   * console.log(`Adherence rate: ${effectiveness.adherenceRate}%`)
   * console.log(`Performance improvement: ${effectiveness.performanceImprovement}%`)
   * effectiveness.insights.forEach(insight => console.log(`- ${insight}`))
   * ```
   */
  async getEffectiveness(userId: string, dateRange = 30): Promise<EffectivenessResponse> {
    const endpoint = `${this.baseUrl}/effectiveness`
    const url = `${endpoint}?userId=${encodeURIComponent(userId)}&dateRange=${dateRange}`

    // Make request
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
    })

    // Parse and validate response
    return this.parseResponse(response, EffectivenessResponseSchema, endpoint)
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

/**
 * Default orchestration client instance
 * Use this for most cases unless you need custom configuration
 *
 * @example
 * ```typescript
 * import { orchestrationClient } from '@/lib/api/orchestration-client'
 *
 * const recommendations = await orchestrationClient.getRecommendations({
 *   userId: 'user-123'
 * })
 * ```
 */
export const orchestrationClient = new OrchestrationClient()
