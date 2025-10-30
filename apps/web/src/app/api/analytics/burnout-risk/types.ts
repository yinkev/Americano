/**
 * TypeScript Types for Burnout Risk Assessment API
 * Story 5.4 Task 6.4
 *
 * World-class type definitions following TypeScript best practices
 */

/**
 * Risk severity levels based on Maslach Burnout Inventory
 */
export type BurnoutRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * Factor severity for individual contributing factors
 */
export type FactorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * Warning signal severity
 */
export type SignalSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Warning signal types
 */
export type WarningSignalType =
  | 'CHRONIC_OVERLOAD' // Sustained high cognitive load
  | 'PERFORMANCE_DROP' // Significant performance decline
  | 'ENGAGEMENT_LOSS' // Skipped missions, incomplete sessions
  | 'IRREGULAR_PATTERN' // Missed study sessions
  | 'NO_RECOVERY' // Absence of low-intensity days

/**
 * Contributing factor to burnout risk
 *
 * Each factor represents a dimension of burnout risk with:
 * - Individual score (0-100)
 * - Weight percentage in total score
 * - Severity classification
 */
export interface ContributingFactor {
  /** Factor name (e.g., "Study Intensity", "Performance Decline") */
  factor: string

  /** Individual factor score (0-100) */
  score: number

  /** Weight percentage in total risk score */
  percentage: number

  /** Severity classification */
  severity: FactorSeverity
}

/**
 * Warning signal detected in behavioral patterns
 *
 * Represents specific concerning patterns that indicate
 * increased burnout risk requiring attention
 */
export interface WarningSignal {
  /** Type of warning signal */
  type: WarningSignalType

  /** Whether signal is currently detected */
  detected: boolean

  /** Severity of the signal */
  severity: SignalSeverity

  /** Human-readable description */
  description: string

  /** When signal was first detected */
  firstDetectedAt: string // ISO 8601 timestamp
}

/**
 * Algorithm metadata for transparency
 */
export interface AlgorithmMetadata {
  /** Analysis window duration */
  analysisWindow: string

  /** Algorithm description */
  algorithm: string

  /** Factor weights used in calculation */
  weights: {
    studyIntensity: number
    performanceDecline: number
    chronicCognitiveLoad: number
    scheduleIrregularity: number
    engagementDecay: number
    recoveryDeficit: number
  }

  /** Execution time in milliseconds */
  executionTimeMs: number
}

/**
 * Comprehensive burnout risk assessment response
 *
 * Research-grade assessment following MBI principles
 */
export interface BurnoutRiskAssessment {
  /** Composite risk score (0-100) */
  riskScore: number

  /** Overall risk level classification */
  riskLevel: BurnoutRiskLevel

  /** Contributing factors with individual scores and weights */
  contributingFactors: ContributingFactor[]

  /** Detected warning signals requiring attention */
  warningSignals: WarningSignal[]

  /** Actionable recommendations for risk mitigation */
  recommendations: string[]

  /** Assessment timestamp (ISO 8601) */
  assessmentDate: string

  /** Data quality confidence (0.0-1.0) */
  confidence: number

  /** Algorithm metadata for transparency */
  metadata: AlgorithmMetadata
}

/**
 * API success response wrapper
 */
export interface BurnoutRiskResponse {
  success: true
  data: BurnoutRiskAssessment
}

/**
 * API error response
 */
export interface BurnoutRiskErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * Union type for all possible API responses
 */
export type BurnoutRiskApiResponse = BurnoutRiskResponse | BurnoutRiskErrorResponse

/**
 * Type guard to check if response is successful
 */
export function isBurnoutRiskSuccess(
  response: BurnoutRiskApiResponse,
): response is BurnoutRiskResponse {
  return response.success === true
}

/**
 * Type guard to check if response is an error
 */
export function isBurnoutRiskError(
  response: BurnoutRiskApiResponse,
): response is BurnoutRiskErrorResponse {
  return response.success === false
}

/**
 * Helper function to get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: BurnoutRiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return 'oklch(0.7 0.15 145)' // Green
    case 'MEDIUM':
      return 'oklch(0.7 0.15 85)' // Yellow
    case 'HIGH':
      return 'oklch(0.7 0.15 45)' // Orange
    case 'CRITICAL':
      return 'oklch(0.6 0.20 25)' // Red
  }
}

/**
 * Helper function to get risk level icon
 */
export function getRiskLevelIcon(riskLevel: BurnoutRiskLevel): string {
  switch (riskLevel) {
    case 'LOW':
      return '✓'
    case 'MEDIUM':
      return '⚡'
    case 'HIGH':
      return '⚠️'
    case 'CRITICAL':
      return '🚨'
  }
}

/**
 * Helper function to format risk score as percentage
 */
export function formatRiskScore(score: number): string {
  return `${Math.round(score)}%`
}

/**
 * Helper function to get severity badge style
 */
export function getSeverityStyle(severity: FactorSeverity | SignalSeverity): {
  color: string
  label: string
} {
  switch (severity) {
    case 'LOW':
      return { color: 'oklch(0.7 0.15 145)', label: 'Low' }
    case 'MEDIUM':
      return { color: 'oklch(0.7 0.15 85)', label: 'Medium' }
    case 'HIGH':
      return { color: 'oklch(0.7 0.15 45)', label: 'High' }
    case 'CRITICAL':
      return { color: 'oklch(0.6 0.20 25)', label: 'Critical' }
  }
}
