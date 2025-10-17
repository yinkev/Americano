/**
 * Conflict Detection Type Definitions
 * Story 3.4: Content Conflict Detection and Resolution
 */

/**
 * Conflict severity levels with color coding
 * LOW: yellow, MEDIUM: orange, HIGH: red, CRITICAL: dark red pulsing
 */
export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Types of conflicts detected in medical content
 */
export enum ConflictType {
  DOSAGE = 'DOSAGE', // Medication dosage differences
  PROTOCOL = 'PROTOCOL', // Treatment protocol contradictions
  DIAGNOSIS = 'DIAGNOSIS', // Diagnostic criteria conflicts
  CONTRAINDICATION = 'CONTRAINDICATION', // Contraindication discrepancies
  TERMINOLOGY = 'TERMINOLOGY', // Medical terminology variations
  EVIDENCE = 'EVIDENCE', // Evidence-based conflicts
  GUIDELINE = 'GUIDELINE', // Clinical guideline differences
  OTHER = 'OTHER', // Other types of conflicts
}

/**
 * Conflict resolution status
 */
export enum ConflictStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  FLAGGED = 'FLAGGED',
}

/**
 * Evidence-based medicine hierarchy levels
 */
export enum EBMLevel {
  SYSTEMATIC_REVIEW = 'SYSTEMATIC_REVIEW', // Level 1: Systematic reviews and meta-analyses
  RCT = 'RCT', // Level 2: Randomized controlled trials
  COHORT_STUDY = 'COHORT_STUDY', // Level 3: Cohort studies
  CASE_CONTROL = 'CASE_CONTROL', // Level 4: Case-control studies
  CASE_SERIES = 'CASE_SERIES', // Level 5: Case series
  EXPERT_OPINION = 'EXPERT_OPINION', // Level 6: Expert opinion
  TEXTBOOK = 'TEXTBOOK', // Level 7: Textbook/educational material
  UNKNOWN = 'UNKNOWN', // Unknown level
}

/**
 * Source information with credibility scoring
 */
export interface Source {
  id: string
  name: string
  type: 'FIRST_AID' | 'LECTURE' | 'TEXTBOOK' | 'JOURNAL' | 'GUIDELINE' | 'USER_NOTE'
  credibility: number // 0-100 scale
  ebmLevel: EBMLevel
  publishedDate?: string
  author?: string
  url?: string
}

/**
 * Content chunk involved in conflict
 */
export interface ConflictContent {
  id: string
  text: string
  sourceId: string
  sourceName: string
  pageNumber?: number
  highlightedSegments?: Array<{
    start: number
    end: number
    text: string
  }>
}

/**
 * Conflict detection result
 */
export interface Conflict {
  id: string
  conceptId: string
  conceptName: string
  type: ConflictType
  severity: ConflictSeverity
  status: ConflictStatus
  sourceA: ConflictContent
  sourceB: ConflictContent
  similarityScore: number // Cosine similarity 0-1
  contradictionPattern: string
  explanation: string
  detectedAt: string
  resolvedAt?: string
  flaggedByUser?: string
  resolution?: ConflictResolution
}

/**
 * Conflict resolution information
 */
export interface ConflictResolution {
  id: string
  conflictId: string
  preferredSourceId: string
  reasoning: string
  evidence?: string
  confidence: number // 0-1 scale
  resolvedBy: 'AI' | 'USER' | 'EXPERT'
  resolvedAt: string
  userNotes?: string
}

/**
 * AI-powered conflict analysis
 */
export interface ConflictAnalysis {
  conflictId: string
  medicalContext: string
  keyDifferences: Array<{
    aspect: string
    sourceA: string
    sourceB: string
    significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }>
  resolutionSuggestion: {
    preferredSourceId: string
    reasoning: string
    confidence: number
    factors: string[]
  }
  clinicalImplications: string
  recommendedAction: string
}

/**
 * User source preferences
 */
export interface UserSourcePreference {
  userId: string
  sourceId: string
  trustLevel: number // 0-100 custom trust level
  priority: number // 1-10 priority ranking
  notes?: string
}

/**
 * Conflict statistics for dashboard
 */
export interface ConflictStats {
  total: number
  byStatus: Record<ConflictStatus, number>
  bySeverity: Record<ConflictSeverity, number>
  byType: Record<ConflictType, number>
  recentlyDetected: number
  recentlyResolved: number
}

/**
 * Conflict history change types
 */
export enum ChangeType {
  DETECTED = 'DETECTED',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
  DISMISSED = 'DISMISSED',
  EVIDENCE_UPDATED = 'EVIDENCE_UPDATED',
  SOURCE_UPDATED = 'SOURCE_UPDATED',
}

/**
 * Conflict history event
 */
export interface ConflictHistory {
  id: string
  conflictId: string
  changeType: ChangeType
  oldStatus?: ConflictStatus
  newStatus?: ConflictStatus
  changedBy: string // userId or "system"
  changedAt: string
  notes?: string
}
