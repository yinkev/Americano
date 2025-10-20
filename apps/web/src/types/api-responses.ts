/**
 * API Response Types for Epic 5 Endpoints
 * Centralized type definitions for all API endpoints
 *
 * Location: apps/web/src/types/api-responses.ts
 */

// ============================================
// Personalization API Types
// ============================================

/**
 * GET /api/personalization/history
 * Personalization history timeline events
 */
export type PersonalizationEventType = 'APPLIED' | 'REMOVED' | 'EFFECTIVENESS_CHANGED'

export interface PersonalizationHistoryEvent {
  id: string
  timestamp: string // ISO timestamp
  eventType: PersonalizationEventType
  personalizationType: string // Context (MISSION, CONTENT, ASSESSMENT, SESSION)
  context: string // Same as personalizationType
  previousValue: number | null // Previous effectiveness score
  newValue: number | null // New effectiveness score
  reason: string // Human-readable explanation
  effectivenessScore: number | null // Current effectiveness (0-100)
  configId: string // Reference to PersonalizationConfig
  strategyVariant: string // Pattern-heavy, Prediction-heavy, etc.
}

export interface PersonalizationHistoryResponse {
  events: PersonalizationHistoryEvent[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * GET /api/personalization/effectiveness
 * Personalization effectiveness metrics
 */
export interface PersonalizationEffectivenessResponse {
  effectiveness: {
    hasPersonalization: boolean
    message?: string
    metrics?: {
      retentionImprovement?: number
      performanceImprovement?: number
      completionRateChange?: number
      engagementChange?: number
    }
    baseline?: {
      retentionImprovement: number
      performanceImprovement: number
      completionRateChange: number
      engagementChange: number
    }
    statistical?: {
      sampleSize: number
      correlation: number
      pValue: number
      isStatisticallySignificant: boolean
    }
    activeConfigs?: Array<{
      context: string
      strategy: string
      confidence: number
    }>
  }
  period: {
    startDate: Date
    endDate: Date
    days: number
  }
  timeline?: Array<{
    startDate: Date
    endDate: Date
    retentionImprovement: number | null
    performanceImprovement: number | null
    completionRateChange: number | null
    compositeScore: number
    isStatisticallySignificant: boolean
  }>
}

/**
 * GET /api/personalization/config
 * Personalization configuration
 */
export interface PersonalizationConfigResponse {
  config: {
    id: string
    userId: string
    context: string
    strategyVariant: string
    effectivenessScore: number | null
    confidenceScore: number
    isActive: boolean
    missionPersonalization: Record<string, any> | null
    contentPersonalization: Record<string, any> | null
    assessmentPersonalization: Record<string, any> | null
    sessionPersonalization: Record<string, any> | null
  } | null
}

// ============================================
// Behavioral Insights API Types
// ============================================

/**
 * GET /api/analytics/behavioral-insights/correlation
 * Performance correlation analysis
 */
export interface TimeSeriesDataPoint {
  date: string
  behavioralScore: number
  academicScore: number
}

export interface CorrelationResponse {
  coefficient: number // Pearson r (-1.0 to 1.0)
  pValue: number // Statistical significance (0.0-1.0)
  interpretation: string // Human-readable interpretation
  confidenceInterval: [number, number] // 95% CI
  timeSeriesData: TimeSeriesDataPoint[]
  insights: string[] // Actionable insights with causation warnings
  dataQuality: {
    sampleSize: number
    weeksOfData: number
    missingDataPoints: number
  }
}

/**
 * GET /api/analytics/behavioral-insights/dashboard
 * Comprehensive dashboard data
 */
export interface BehavioralPattern {
  id: string
  userId: string
  patternType: string
  patternName: string
  confidence: number
  evidence: Record<string, any>
  detectedAt: Date
  lastSeenAt: Date
  occurrenceCount: number
}

export interface Recommendation {
  id: string
  userId: string
  recommendationType: string
  title: string
  description: string
  actionableText: string
  confidence: number
  estimatedImpact: number
  easeOfImplementation: number
  userReadiness: number
  priorityScore: number
  status: string
  sourcePatternIds: string[]
  sourceInsightIds: string[]
  createdAt: Date
  appliedAt: Date | null
  dismissedAt: Date | null
}

export interface BehavioralGoal {
  id: string
  userId: string
  goalType: string
  title: string
  description: string
  targetMetric: string
  currentValue: number
  targetValue: number
  deadline: Date
  status: string
  progressHistory: Record<string, any>
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface BehavioralMetrics {
  consistency: number // 0-100
  focus: number // 0-100
  retention: number // 0-100
  efficiency: number // 0-100
}

export interface DashboardResponse {
  patterns: BehavioralPattern[]
  recommendations: Recommendation[]
  goals: BehavioralGoal[]
  metrics: BehavioralMetrics
  correlationData: CorrelationResponse | null
  meta: {
    patternsCount: number
    recommendationsCount: number
    activeGoalsCount: number
    recentInsightsCount: number
    lastUpdated: string // ISO timestamp
  }
}

// ============================================
// Struggle Prediction API Types
// ============================================

/**
 * GET /api/analytics/predictions
 * Struggle predictions list
 */
export interface StrugglePrediction {
  id: string
  userId: string
  learningObjectiveId: string
  topicId: string | null
  predictedStruggleProbability: number // 0.0-1.0
  predictionConfidence: number // 0.0-1.0
  predictionStatus: string
  featureVector: Record<string, any> | null
  strugglingFactors: Record<string, any>
  predictionDate: Date
  predictedAt: Date
  acknowledgedAt: Date | null
  actualOutcome: boolean | null
  actualOutcomeRecordedAt: Date | null
  interventionApplied: boolean
  interventionId: string | null
}

export interface PredictionsResponse {
  predictions: StrugglePrediction[]
  meta: {
    total: number
    highRisk: number // Count of high-risk predictions
    pending: number // Count of pending predictions
  }
}

/**
 * POST /api/analytics/predictions/generate
 * Generate struggle predictions
 */
export interface GeneratePredictionsRequest {
  userId: string
  force?: boolean // Force regeneration even if recent predictions exist
}

export interface GeneratePredictionsResponse {
  generated: number // Count of new predictions generated
  predictions: StrugglePrediction[]
}

/**
 * POST /api/analytics/predictions/[id]/feedback
 * Prediction feedback
 */
export interface PredictionFeedbackRequest {
  actualOutcome: boolean // Did struggle actually occur?
  feedback?: string // Optional text feedback
}

export interface PredictionFeedbackResponse {
  prediction: StrugglePrediction
  modelUpdated: boolean // Was model retrained with this feedback?
}

// ============================================
// Intervention API Types
// ============================================

/**
 * GET /api/analytics/interventions
 * Intervention recommendations list
 */
export interface InterventionRecommendation {
  id: string
  userId: string
  predictionId: string | null
  interventionType: string
  description: string
  reasoning: string
  priority: number // 1-10
  status: string
  relatedObjectiveId: string | null
  appliedToMissionId: string | null
  appliedAt: Date | null
  createdAt: Date
  acknowledgedAt: Date | null
}

export interface InterventionsResponse {
  interventions: InterventionRecommendation[]
  meta: {
    total: number
    pending: number
    applied: number
  }
}

/**
 * POST /api/analytics/interventions/[id]/apply
 * Apply intervention to mission
 */
export interface ApplyInterventionRequest {
  missionId: string // Mission to apply intervention to
  force?: boolean // Force application even if already applied
}

export interface ApplyInterventionResponse {
  intervention: InterventionRecommendation
  applied: boolean
  message: string
}

// ============================================
// Analytics API Types
// ============================================

/**
 * GET /api/analytics/model-performance
 * ML model performance metrics
 */
export interface ModelPerformanceMetrics {
  accuracy: number // Overall prediction accuracy
  precision: number // Precision (true positives / predicted positives)
  recall: number // Recall (true positives / actual positives)
  f1Score: number // F1 score (harmonic mean of precision and recall)
  sampleSize: number // Number of predictions with feedback
  lastUpdated: Date
}

export interface ModelPerformanceResponse {
  metrics: ModelPerformanceMetrics
  recentPredictions: Array<{
    date: string
    accuracy: number
    sampleSize: number
  }>
}

/**
 * GET /api/analytics/struggle-reduction
 * Struggle reduction metrics
 */
export interface StruggleReductionMetrics {
  totalPredictions: number
  interventionsApplied: number
  strugglesAvoided: number // Predictions where struggle was avoided
  reductionRate: number // Percentage reduction in struggles
  avgConfidence: number // Average prediction confidence
}

export interface StruggleReductionResponse {
  metrics: StruggleReductionMetrics
  timeline: Array<{
    date: string
    predictions: number
    interventions: number
    strugglesAvoided: number
  }>
}

// ============================================
// Standard API Response Wrapper
// ============================================

/**
 * Standard success response wrapper
 */
export interface SuccessResponse<T> {
  success: true
  data: T
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Generic API response type
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse
