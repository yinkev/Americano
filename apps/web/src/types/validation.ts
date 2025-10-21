// TypeScript interfaces matching Python Pydantic models for Story 4.1
// These types ensure type safety across the TypeScript/Python boundary

/**
 * Evaluation result from Python AI evaluation service
 * Matches Python's EvaluationResult Pydantic model
 */
export interface EvaluationResult {
  overall_score: number; // 0-100
  terminology_score: number; // 0-100
  relationships_score: number; // 0-100
  application_score: number; // 0-100
  clarity_score: number; // 0-100
  strengths: string[]; // 2-3 bullet points
  gaps: string[]; // 2-3 bullet points with hints
  calibration_delta: number; // confidenceNormalized - overall_score
  calibration_note: string; // User-friendly calibration message
}

/**
 * Request to generate a comprehension prompt
 */
export interface PromptGenerationRequest {
  objectiveId: string;
  sessionId?: string;
}

/**
 * Response from Python prompt generation service
 */
export interface PromptGenerationResponse {
  prompt_text: string;
  prompt_type: 'DIRECT_QUESTION' | 'CLINICAL_SCENARIO' | 'TEACHING_SIMULATION';
  expected_criteria: string[];
  concept_name: string;
}

/**
 * Request to evaluate a user's comprehension response
 */
export interface ResponseEvaluationRequest {
  promptId: string;
  sessionId?: string;
  userAnswer: string;
  confidenceLevel: number; // 1-5
  objectiveId: string;
}

/**
 * Complete evaluation response from API
 */
export interface ResponseEvaluationResponse {
  evaluation: EvaluationResult;
  score: number; // Overall score 0-100
  responseId: string; // ID of saved ValidationResponse
}

/**
 * Comprehension metrics for an objective
 */
export interface ComprehensionMetric {
  id: string;
  objectiveId: string;
  date: Date;
  avgScore: number; // 0-100 scale (converted from 0-1 stored value)
  sampleSize: number;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

/**
 * Metrics history response
 */
export interface ComprehensionMetricsResponse {
  metrics: ComprehensionMetric[];
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  avgScore: number;
  totalAttempts: number;
}

/**
 * ValidationPrompt from database (matches Prisma model)
 */
export interface ValidationPromptData {
  id: string;
  promptText: string;
  promptType: 'EXPLAIN_TO_PATIENT' | 'CLINICAL_REASONING' | 'CONTROLLED_FAILURE';
  conceptName: string;
  expectedCriteria: string[];
  objectiveId: string | null;
  createdAt: Date;
}

/**
 * Detailed feedback structure stored in ValidationResponse.detailedFeedback JSON
 */
export interface DetailedFeedback {
  subscores: {
    terminology: number;
    relationships: number;
    application: number;
    clarity: number;
  };
  strengths: string[];
  gaps: string[];
  calibrationNote: string;
}

/**
 * Calibration analysis result
 */
export interface CalibrationAnalysis {
  delta: number; // confidenceNormalized - score
  classification: 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'CALIBRATED';
  note: string; // User-friendly message
}

/**
 * Calibration feedback data for CalibrationFeedbackPanel (Story 4.4)
 */
export interface CalibrationFeedbackData {
  delta: number; // Calibration delta (confidence - score)
  category: 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'CALIBRATED';
  preConfidence: number; // Pre-assessment confidence (1-5)
  postConfidence?: number; // Post-assessment confidence (1-5), optional
  confidenceNormalized: number; // Normalized confidence (0-100)
  score: number; // Actual score (0-100)
  feedbackMessage: string; // Specific feedback message
  trend?: 'improving' | 'stable' | 'declining'; // Calibration trend
  trendMessage?: string; // Trend feedback message
}

// ============================================
// Story 4.2: Clinical Reasoning Scenario Types
// ============================================

/**
 * Clinical scenario types matching database enums
 */
export type ScenarioType = 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS';

/**
 * Difficulty levels for clinical scenarios
 */
export type ScenarioDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * Multi-stage case structure (stored in ClinicalScenario.caseText JSON)
 */
export interface CaseStructure {
  chiefComplaint: string;
  demographics: {
    age: number;
    sex: 'M' | 'F' | 'Other';
    occupation?: string;
  };
  history: {
    presenting: string;
    past?: string;
    medications?: string[];
    socialHistory?: string;
  };
  physicalExam: {
    vitals: {
      BP?: string;
      HR?: number;
      RR?: number;
      T?: number;
      O2?: number;
    };
    general?: string;
    cardiovascular?: string;
    respiratory?: string;
    abdominal?: string;
    neurological?: string;
    [key: string]: any; // Allow other system exams
  };
  labs: {
    available: boolean;
    options: string[];
    results?: Record<string, string>;
  };
  imaging?: {
    available: boolean;
    options: string[];
    results?: Record<string, string>;
  };
  questions: CaseQuestion[];
}

/**
 * Individual question within a clinical case
 */
export interface CaseQuestion {
  id: string;
  stage: 'history' | 'physical' | 'workup' | 'diagnosis' | 'management';
  prompt: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  correctAnswer?: string | string[];
  reasoning?: string;
  points: number;
}

/**
 * User's choices at each stage of the scenario
 */
export interface UserChoices {
  [stageId: string]: {
    selectedAnswer?: string | string[];
    requestedInfo?: string[];
    timeSpent?: number; // seconds
    notes?: string;
  };
}

/**
 * Competency scores for clinical reasoning evaluation
 */
export interface CompetencyScores {
  dataGathering: number; // 0-100 (20% weight)
  diagnosis: number; // 0-100 (30% weight)
  management: number; // 0-100 (30% weight)
  clinicalReasoning: number; // 0-100 (20% weight)
  overall: number; // Weighted composite score
}

/**
 * Clinical reasoning evaluation result from Python AI service
 */
export interface ClinicalReasoningEvaluation {
  competencyScores: CompetencyScores;
  strengths: string[]; // 2-3 bullet points
  weaknesses: string[]; // 2-3 bullet points with hints
  missedFindings: string[]; // Critical findings missed
  cognitiveBiases: CognitiveBias[]; // Detected biases with explanations
  optimalPathway: string; // Description of ideal approach
  teachingPoints: TeachingPoint[]; // Educational resources
}

/**
 * Cognitive bias detected in reasoning
 */
export interface CognitiveBias {
  type: 'ANCHORING' | 'PREMATURE_CLOSURE' | 'CONFIRMATION_BIAS' | 'AVAILABILITY_BIAS' | 'BASE_RATE_NEGLECT';
  description: string; // How it manifested in this case
  impact: 'MILD' | 'MODERATE' | 'SEVERE';
  suggestion: string; // How to avoid in future
}

/**
 * Teaching point with resource links
 */
export interface TeachingPoint {
  topic: string;
  explanation: string;
  resources?: {
    type: 'ARTICLE' | 'VIDEO' | 'GUIDELINE' | 'TEXTBOOK';
    title: string;
    url?: string;
  }[];
}

/**
 * Request to generate a clinical scenario
 */
export interface ScenarioGenerationRequest {
  objectiveId: string;
  difficulty?: ScenarioDifficulty;
  scenarioType?: ScenarioType;
  sessionId?: string;
}

/**
 * Response from scenario generation service
 */
export interface ScenarioGenerationResponse {
  scenario: ClinicalScenarioData;
}

/**
 * Clinical scenario data (matches Prisma model + caseText)
 */
export interface ClinicalScenarioData {
  id: string;
  objectiveId: string;
  scenarioType: ScenarioType;
  difficulty: ScenarioDifficulty;
  caseText: CaseStructure;
  boardExamTopic?: string;
  createdAt: Date;
}

/**
 * Request to submit clinical scenario response
 */
export interface ScenarioSubmissionRequest {
  scenarioId: string;
  sessionId?: string;
  userChoices: UserChoices;
  userReasoning: string; // Free-text explanation of reasoning
  timeSpent: number; // Total time in seconds
}

/**
 * Response from scenario submission
 */
export interface ScenarioSubmissionResponse {
  evaluation: ClinicalReasoningEvaluation;
  score: number; // Overall score 0-100
  competencyScores: CompetencyScores;
  feedback: ClinicalFeedbackData;
  responseId: string; // ID of saved ScenarioResponse
}

/**
 * Clinical feedback data for display
 */
export interface ClinicalFeedbackData {
  overallScore: number;
  competencyScores: CompetencyScores;
  strengths: string[];
  weaknesses: string[];
  missedFindings: string[];
  cognitiveBiases: CognitiveBias[];
  optimalPathway: string;
  teachingPoints: TeachingPoint[];
  timeSpent: number; // seconds
}

/**
 * Clinical reasoning metrics history
 */
export interface ClinicalReasoningMetric {
  id: string;
  userId: string;
  scenarioType: ScenarioType;
  competencyScores: CompetencyScores;
  boardExamTopic?: string;
  date: Date;
}

/**
 * Clinical reasoning analytics response
 */
export interface ClinicalReasoningAnalytics {
  metrics: ClinicalReasoningMetric[];
  competencyAverages: CompetencyScores;
  weakCompetencies: WeakCompetency[];
  scenarioTypeBreakdown: ScenarioTypeStats[];
  boardExamCoverage: BoardExamCoverageStats[];
  recentScenarios: RecentScenarioSummary[];
  trends: CompetencyTrend[];
}

/**
 * Weak competency identification
 */
export interface WeakCompetency {
  competency: keyof CompetencyScores;
  averageScore: number;
  scenarioCount: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

/**
 * Performance breakdown by scenario type
 */
export interface ScenarioTypeStats {
  type: ScenarioType;
  count: number;
  averageScore: number;
  strongestCompetency: keyof CompetencyScores;
  weakestCompetency: keyof CompetencyScores;
}

/**
 * Coverage by board exam topic
 */
export interface BoardExamCoverageStats {
  topic: string;
  scenarioCount: number;
  averageScore: number;
  lastAttempted: Date;
}

/**
 * Summary of recent scenarios
 */
export interface RecentScenarioSummary {
  id: string;
  scenarioType: ScenarioType;
  boardExamTopic?: string;
  score: number;
  competencyScores: CompetencyScores;
  date: Date;
  timeSpent: number; // seconds
}

/**
 * Competency performance trend over time
 */
export interface CompetencyTrend {
  competency: keyof CompetencyScores;
  dataPoints: {
    date: Date;
    score: number;
  }[];
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  slope: number; // Rate of change per week
}

/**
 * Scenario stage progression state
 */
export interface ScenarioProgressState {
  currentStage: number; // 0-based index in questions array
  completedStages: string[]; // Stage IDs completed
  timeSpent: number; // Total time in seconds
  stageStartTime: number; // Timestamp when current stage started
  choices: UserChoices; // Accumulated choices
  isCompleted: boolean;
}
