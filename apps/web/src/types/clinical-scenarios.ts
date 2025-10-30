// Story 4.2: Clinical Reasoning Scenarios Types

/**
 * Clinical scenario types matching database enums
 */
export type ScenarioType = 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS'

/**
 * Difficulty levels for clinical scenarios
 */
export type ScenarioDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

/**
 * Multi-stage case structure (stored in ClinicalScenario.caseText JSON)
 */
export interface CaseStructure {
  chiefComplaint: string
  demographics: {
    age: number
    sex: 'M' | 'F' | 'Other'
    occupation?: string
  }
  history: {
    presenting: string
    past?: string
    medications?: string[]
    socialHistory?: string
  }
  physicalExam: {
    vitals: {
      BP?: string
      HR?: number
      RR?: number
      T?: number
      O2?: number
    }
    general?: string
    cardiovascular?: string
    respiratory?: string
    abdominal?: string
    neurological?: string
    [key: string]: any // Allow other system exams
  }
  labs: {
    available: boolean
    options: string[]
    results?: Record<string, string>
  }
  imaging?: {
    available: boolean
    options: string[]
    results?: Record<string, string>
  }
  questions: CaseQuestion[]
}

/**
 * Individual question within a clinical case
 */
export interface CaseQuestion {
  id: string
  stage: 'history' | 'physical' | 'workup' | 'diagnosis' | 'management'
  prompt: string
  type: 'single' | 'multiple' | 'text'
  options?: string[]
  correctAnswer?: string | string[]
  reasoning?: string
  points: number
}

/**
 * User's choices at each stage of the scenario
 */
export interface UserChoices {
  [stageId: string]: {
    selectedAnswer?: string | string[]
    requestedInfo?: string[]
    timeSpent?: number // seconds
    notes?: string
  }
}

/**
 * Competency scores for clinical reasoning evaluation
 */
export interface CompetencyScores {
  dataGathering: number // 0-100 (20% weight)
  diagnosis: number // 0-100 (30% weight)
  management: number // 0-100 (30% weight)
  clinicalReasoning: number // 0-100 (20% weight)
  overall: number // Weighted composite score
}

/**
 * Clinical reasoning evaluation result from Python AI service
 */
export interface ClinicalReasoningEvaluation {
  competencyScores: CompetencyScores
  strengths: string[] // 2-3 bullet points
  weaknesses: string[] // 2-3 bullet points with hints
  missedFindings: string[] // Critical findings missed
  cognitiveBiases: CognitiveBias[] // Detected biases with explanations
  optimalPathway: string // Description of ideal approach
  teachingPoints: TeachingPoint[] // Educational resources
}

/**
 * Cognitive bias detected in reasoning
 */
export interface CognitiveBias {
  type:
    | 'ANCHORING'
    | 'PREMATURE_CLOSURE'
    | 'CONFIRMATION_BIAS'
    | 'AVAILABILITY_BIAS'
    | 'BASE_RATE_NEGLECT'
  description: string // How it manifested in this case
  impact: 'MILD' | 'MODERATE' | 'SEVERE'
  suggestion: string // How to avoid in future
}

/**
 * Teaching point with resource links
 */
export interface TeachingPoint {
  topic: string
  explanation: string
  resources?: {
    type: 'ARTICLE' | 'VIDEO' | 'GUIDELINE' | 'TEXTBOOK'
    title: string
    url?: string
  }[]
}

/**
 * Clinical scenario data from database
 */
export interface ClinicalScenario {
  id: string
  objectiveId: string
  scenarioType: ScenarioType
  difficulty: ScenarioDifficulty
  caseText: CaseStructure
  boardExamTopic?: string
  createdAt: Date
}

/**
 * User's response to a clinical scenario
 */
export interface ScenarioResponse {
  id: string
  scenarioId: string
  userId: string
  sessionId?: string
  userChoices: UserChoices
  userReasoning: string
  score: number // 0-100
  competencyScores: CompetencyScores
  timeSpent: number // seconds
  respondedAt: Date
}

/**
 * Clinical reasoning metrics for tracking
 */
export interface ClinicalReasoningMetric {
  id: string
  userId: string
  scenarioType: string
  competencyScores: CompetencyScores
  boardExamTopic?: string
  date: Date
}

/**
 * Request body for generating a new scenario
 */
export interface GenerateScenarioRequest {
  objectiveId: string
  difficulty?: ScenarioDifficulty
  scenarioType?: ScenarioType
}

/**
 * Response from scenario generation endpoint
 */
export interface ScenarioGenerationResponse {
  scenario: ClinicalScenario
}

/**
 * Request body for submitting scenario response
 */
export interface SubmitScenarioRequest {
  scenarioId: string
  sessionId?: string
  userChoices: UserChoices
  userReasoning: string
  timeSpent: number
}

/**
 * Response from scenario submission endpoint
 */
export interface SubmitScenarioResponse {
  evaluation: ClinicalReasoningEvaluation
  score: number
  competencyScores: CompetencyScores
  responseId: string
}

/**
 * Request for clinical reasoning metrics
 */
export interface ClinicalMetricsRequest {
  dateRange?: '7days' | '30days' | '90days'
  scenarioType?: ScenarioType
}

/**
 * Response with clinical reasoning metrics
 */
export interface ClinicalMetricsResponse {
  metrics: ClinicalReasoningMetric[]
  competencyAverages: CompetencyScores
  weakCompetencies: WeakCompetency[]
}

/**
 * Weak competency identification
 */
export interface WeakCompetency {
  competency: keyof CompetencyScores
  averageScore: number
  scenarioCount: number
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING'
}

/**
 * Props for ClinicalCaseDialog component
 */
export interface ClinicalCaseDialogProps {
  scenario: ClinicalScenario
  onSubmit: (choices: UserChoices, reasoning: string, timeSpent: number) => void
  onClose: () => void
  sessionId?: string
  isOpen: boolean
}

/**
 * Props for ClinicalFeedbackPanel component
 */
export interface ClinicalFeedbackPanelProps {
  evaluation: ClinicalReasoningEvaluation
  scenario: ClinicalScenario
  onReview: () => void
  onNext: () => void
  score: number
  timeSpent: number
}

/**
 * Store state for clinical scenario workflow
 */
export interface ClinicalScenarioStore {
  // State
  currentScenario: ClinicalScenario | null
  userChoices: UserChoices
  currentStage: number
  timeSpent: number
  stageStartTime: number
  isCompleted: boolean
  evaluation: ClinicalReasoningEvaluation | null
  isLoading: boolean
  error: string | null
  sessionId?: string

  // Actions
  setCurrentScenario: (scenario: ClinicalScenario) => void
  addChoice: (stageId: string, choice: any) => void
  nextStage: () => void
  previousStage: () => void
  requestInfo: (info: string) => void
  submitScenario: (reasoning: string) => Promise<void>
  reset: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateComputedState: () => void
}

/**
 * Stage progression info for UI
 */
export interface StageInfo {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isCurrent: boolean
  timeSpent: number
}

/**
 * Timer display info
 */
export interface TimerInfo {
  elapsed: number // seconds
  stageElapsed: number // seconds in current stage
  formattedTime: string // "MM:SS"
  formattedStageTime: string // "MM:SS"
}

/**
 * Progress indicator for scenario
 */
export interface ScenarioProgress {
  currentStage: number
  totalStages: number
  completedStages: number
  percentageComplete: number
  estimatedTimeRemaining: number // seconds
}

/**
 * Color scheme for competencies (OKLCH color space)
 */
export const COMPETENCY_COLORS = {
  dataGathering: 'oklch(0.65 0.18 200)', // Blue
  diagnosis: 'oklch(0.7 0.15 145)', // Green
  management: 'oklch(0.68 0.16 280)', // Purple
  clinicalReasoning: 'oklch(0.72 0.12 45)', // Orange
} as const

/**
 * Score threshold colors
 */
export const SCORE_THRESHOLDS = {
  POOR: { max: 59, color: 'oklch(0.65 0.20 25)' }, // Red
  DEVELOPING: { min: 60, max: 79, color: 'oklch(0.75 0.12 85)' }, // Yellow
  PROFICIENT: { min: 80, color: 'oklch(0.7 0.15 145)' }, // Green
} as const

/**
 * Stage titles and descriptions
 */
export const STAGE_INFO = {
  history: {
    title: 'History Taking',
    description: 'Gather relevant patient history',
  },
  physical: {
    title: 'Physical Examination',
    description: 'Perform focused physical exam',
  },
  workup: {
    title: 'Diagnostic Workup',
    description: 'Order appropriate tests and imaging',
  },
  diagnosis: {
    title: 'Diagnosis',
    description: 'Formulate differential and final diagnosis',
  },
  management: {
    title: 'Management',
    description: 'Plan treatment and follow-up',
  },
} as const

/**
 * Legacy compatibility - keep existing interface names
 */
export interface EvaluationResult {
  overallScore: number
  competencyScores: CompetencyScores
  strengths: string[]
  weaknesses: string[]
  missedFindings: string[]
  cognitiveBiases: string[]
  optimalPathway: string
  teachingPoints: string[]
}
