/**
 * TypeScript Type Definitions for Cognitive Load Monitoring API
 * Story 5.4: Research-Grade Cognitive Load Calculation
 *
 * Based on Cognitive Load Theory (Sweller, 2011)
 */

// ============================================
// Core Types
// ============================================

export type LoadLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export type StressIndicatorType =
  | 'RESPONSE_LATENCY'
  | 'ERROR_RATE'
  | 'ENGAGEMENT_DROP'
  | 'PERFORMANCE_DECLINE'
  | 'DURATION_STRESS'

export type StressIndicatorSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export type LoadTrend = 'up' | 'down' | 'stable'

// ============================================
// Request Types
// ============================================

export interface EngagementMetrics {
  pauseCount: number
  pauseDurationMs: number
  cardInteractions: number
}

export interface BaselineData {
  avgResponseLatency: number
  baselinePerformance: number
}

export interface BehavioralData {
  responseLatencies: number[]
  errorRate: number
  engagementMetrics?: EngagementMetrics
  performanceScores: number[]
  sessionDuration: number
  baselineData?: BaselineData
}

export interface CalculateCognitiveLoadRequest {
  userId: string
  sessionId: string
  behavioralData: BehavioralData
}

// ============================================
// Response Types
// ============================================

export interface StressIndicator {
  type: StressIndicatorType
  severity: StressIndicatorSeverity
  value: number
  contribution: number
}

export interface CognitiveLoadScore {
  success: true
  loadScore: number
  loadLevel: LoadLevel
  stressIndicators: StressIndicator[]
  overloadDetected: boolean
  recommendations: string[]
  confidenceLevel: number
  timestamp: string
}

export interface CurrentCognitiveLoadResponse {
  success: true
  loadScore: number | null
  loadLevel: LoadLevel | null
  stressIndicators: StressIndicator[] | unknown[]
  timestamp: string | null
  trend: LoadTrend | null
  sessionActive: boolean
  confidenceLevel: number | null
}

export interface CognitiveLoadDataPoint {
  timestamp: string
  loadScore: number
  loadLevel: LoadLevel
  stressIndicators: StressIndicator[] | unknown
  sessionId: string | null
  confidenceLevel: number
}

export interface CognitiveLoadSummary {
  avgLoad: number
  maxLoad: number
  overloadEpisodes: number
  totalDataPoints: number
  dateRange: {
    start: string
    end: string
  }
}

export interface CognitiveLoadHistoryResponse {
  success: true
  dataPoints: CognitiveLoadDataPoint[]
  summary: CognitiveLoadSummary
}

// ============================================
// Error Types
// ============================================

export interface ValidationError {
  code: string
  expected: string
  received: string
  path: string[]
  message: string
}

export interface ErrorResponse {
  success: false
  error: string
  details?: ValidationError[]
}

// ============================================
// API Response Union Types
// ============================================

export type CalculateCognitiveLoadResponse = CognitiveLoadScore | ErrorResponse
export type GetCurrentCognitiveLoadResponse = CurrentCognitiveLoadResponse | ErrorResponse
export type GetCognitiveLoadHistoryResponse = CognitiveLoadHistoryResponse | ErrorResponse

// ============================================
// Load Level Utilities
// ============================================

/**
 * Determine load level from load score based on CLT thresholds
 */
export function determineLoadLevel(loadScore: number): LoadLevel {
  if (loadScore >= 80) return 'CRITICAL'
  if (loadScore >= 60) return 'HIGH'
  if (loadScore >= 40) return 'MODERATE'
  return 'LOW'
}

/**
 * Get color representation for load level (for UI)
 */
export function getLoadLevelColor(loadLevel: LoadLevel): string {
  switch (loadLevel) {
    case 'LOW':
      return 'oklch(0.7 0.15 140)' // Green
    case 'MODERATE':
      return 'oklch(0.7 0.15 90)' // Yellow
    case 'HIGH':
      return 'oklch(0.7 0.15 40)' // Orange
    case 'CRITICAL':
      return 'oklch(0.6 0.20 25)' // Red
  }
}

/**
 * Get semantic label for load level
 */
export function getLoadLevelLabel(loadLevel: LoadLevel): string {
  switch (loadLevel) {
    case 'LOW':
      return 'Optimal Learning Conditions'
    case 'MODERATE':
      return 'Normal Cognitive Load'
    case 'HIGH':
      return 'Approaching Overload'
    case 'CRITICAL':
      return 'Cognitive Overload Detected'
  }
}

/**
 * Get icon for load level (chakra-ui icon names or similar)
 */
export function getLoadLevelIcon(loadLevel: LoadLevel): string {
  switch (loadLevel) {
    case 'LOW':
      return 'CheckCircle'
    case 'MODERATE':
      return 'InfoCircle'
    case 'HIGH':
      return 'WarningTriangle'
    case 'CRITICAL':
      return 'AlertCircle'
  }
}

// ============================================
// Type Guards
// ============================================

export function isErrorResponse(
  response:
    | CalculateCognitiveLoadResponse
    | GetCurrentCognitiveLoadResponse
    | GetCognitiveLoadHistoryResponse,
): response is ErrorResponse {
  return response.success === false
}

export function isCognitiveLoadScore(
  response: CalculateCognitiveLoadResponse,
): response is CognitiveLoadScore {
  return response.success === true && 'loadScore' in response
}

export function isCurrentCognitiveLoadResponse(
  response: GetCurrentCognitiveLoadResponse,
): response is CurrentCognitiveLoadResponse {
  return response.success === true
}

export function isCognitiveLoadHistoryResponse(
  response: GetCognitiveLoadHistoryResponse,
): response is CognitiveLoadHistoryResponse {
  return response.success === true && 'dataPoints' in response
}
