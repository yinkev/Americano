/**
 * Type-safe definitions for Prisma JSON fields
 *
 * This file provides proper TypeScript types for all JSON columns in the database schema,
 * eliminating the need for `as any` assertions throughout the codebase.
 *
 * @see apps/web/prisma/schema.prisma
 */

// ============================================
// Mission & Session JSON Types
// ============================================

export interface MissionObjective {
  id: string;
  objective: {
    id: string;
    objective: string;
    complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    isHighYield: boolean;
    masteryLevel?: 'NOT_STARTED' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTERED';
    lectureId?: string;
  };
  cardCount: number;
  estimatedMinutes: number;
  completed?: boolean;
  completedAt?: string;
  confidence?: number;
  timeSpentMs?: number;
}

export interface ObjectiveCompletion {
  objectiveId: string;
  completed: boolean;
  completedAt?: string;
  confidence?: number;
  timeSpentMs?: number;
  cardsReviewed?: number;
  averageRating?: number;
}

// ============================================
// Learning Profile JSON Types
// ============================================

export interface PreferredStudyTime {
  dayOfWeek: number; // 0-6 (Sunday=0)
  startHour: number; // 0-23
  endHour: number; // 0-23
  effectiveness: number; // 0.0-1.0
}

export interface LearningStyleProfile {
  // VARK learning style scores
  visual: number; // 0.0-1.0
  auditory: number; // 0.0-1.0
  reading: number; // 0.0-1.0
  kinesthetic: number; // 0.0-1.0

  // Additional cognitive preferences
  loadTolerance?: number; // 0-100
  preferredSessionLength?: number; // minutes
  optimalDifficulty?: number; // 0.0-1.0
}

export interface ContentPreferences {
  preferredTypes?: string[];
  avoidedTypes?: string[];
  difficultyPreference?: 'easier' | 'balanced' | 'challenging';
  interactivityLevel?: 'low' | 'medium' | 'high';
}

export interface PersonalizedForgettingCurve {
  initialRetention: number; // 0.0-1.0
  decayRate: number; // 0.0-1.0
  stabilityFactor: number; // 0.0-1.0
  optimalSpacing?: number[]; // days between reviews
}

// ============================================
// Behavioral Analytics JSON Types
// ============================================

export interface BehavioralPatternData {
  patternName?: string;
  description?: string;
  strength?: number;
  frequency?: number;
  lastOccurrence?: string;
  metadata?: Record<string, unknown>;
}

export interface StressIndicator {
  type: 'PERFORMANCE_DECLINE' | 'SESSION_SKIPPING' | 'REDUCED_ENGAGEMENT' | 'DIFFICULTY_AVOIDANCE' | 'IRREGULAR_SCHEDULE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  value?: number;
  trend?: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface ContributingFactor {
  factor: string;
  weight: number; // 0.0-1.0
  description: string;
  recommendation?: string;
}

export interface WarningSignal {
  signal: string;
  detected: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  since?: string; // ISO date
}

// ============================================
// Personalization JSON Types
// ============================================

export interface MissionPersonalization {
  timing?: {
    preferredStartTime?: number; // Hour of day
    flexibility?: number; // 0.0-1.0
  };
  duration?: {
    targetMinutes?: number;
    minMinutes?: number;
    maxMinutes?: number;
  };
  objectives?: {
    prioritizationStrategy?: 'DEADLINE' | 'DIFFICULTY' | 'MASTERY' | 'BALANCED';
    maxObjectives?: number;
  };
  difficulty?: {
    targetDifficulty?: number; // 0.0-1.0
    adaptationRate?: number; // 0.0-1.0
  };
}

export interface ContentPersonalization {
  contentTypes?: string[];
  learningStyle?: Partial<LearningStyleProfile>;
  topicSelection?: {
    diversityLevel?: number; // 0.0-1.0
    repeatFrequency?: number; // days
  };
}

export interface AssessmentPersonalization {
  frequency?: {
    validationsPerSession?: number;
    selfAssessmentInterval?: number; // minutes
  };
  difficulty?: {
    targetDifficulty?: number; // 0.0-1.0
    adaptOnPerformance?: boolean;
  };
  questionTypes?: string[];
}

export interface SessionPersonalization {
  breakTiming?: {
    breakFrequency?: number; // minutes
    breakDuration?: number; // minutes
    adaptToLoad?: boolean;
  };
  contentSequence?: {
    easingStrategy?: 'GRADUAL' | 'MIXED' | 'DIVE_DEEP';
    interleaving?: boolean;
  };
  intensityModulation?: {
    peakIntensityDuration?: number; // minutes
    recoveryDuration?: number; // minutes
  };
}

export interface ExperimentVariant {
  variantId: string;
  name: string;
  config: MissionPersonalization | ContentPersonalization | AssessmentPersonalization | SessionPersonalization;
  weight: number; // 0.0-1.0
}

export interface ExperimentVariants {
  variants: ExperimentVariant[];
}

export interface ExperimentMetrics {
  [variantId: string]: {
    sampleSize: number;
    retentionRate: number;
    performanceScore: number;
    completionRate: number;
    engagementScore: number;
  };
}

export interface ExperimentAssignmentMetrics {
  retentionScore?: number;
  performanceScore?: number;
  completionRate?: number;
  engagementScore?: number;
  sessionCount?: number;
  timestamp?: string;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g., 0.95 for 95% CI
}

// ============================================
// Struggle Prediction JSON Types
// ============================================

export interface FeatureVector {
  // Performance features
  retentionScore?: number;
  avgReviewTime?: number;
  lapseRate?: number;

  // Behavioral features
  studyConsistency?: number;
  sessionGapDays?: number;
  engagementLevel?: number;

  // Cognitive features
  cognitiveLoad?: number;
  prerequisiteGap?: number;
  complexityMismatch?: number;

  // Historical features
  historicalPerformance?: number;
  similarTopicPerformance?: number;

  // Additional dynamic features
  [key: string]: number | undefined;
}

export interface StrugglingFactor {
  factor: 'LOW_RETENTION' | 'PREREQUISITE_GAP' | 'COMPLEXITY_MISMATCH' | 'COGNITIVE_OVERLOAD' | 'HISTORICAL_STRUGGLE_PATTERN';
  weight: number; // 0.0-1.0
  description: string;
  recommendation?: string;
}

// ============================================
// Recommendation JSON Types
// ============================================

export interface RecommendationBaselineMetrics {
  avgConfidence?: number;
  behavioralScore?: number;
  sessionCount?: number;
  retentionRate?: number;
  completionRate?: number;
  engagementLevel?: number;
  timestamp: string;
}

export interface RecommendationCurrentMetrics extends RecommendationBaselineMetrics {
  improvement?: number; // 0.0-1.0
  evaluatedAt: string;
}

export interface GoalProgressEntry {
  date: string; // ISO date
  value: number;
  note?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
}

// ============================================
// Mission Review JSON Types
// ============================================

export interface MissionReviewSummary {
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  avgDuration: number;
  avgSuccessScore: number;
}

export interface MissionReviewHighlight {
  type: 'ACHIEVEMENT' | 'IMPROVEMENT' | 'STREAK' | 'MILESTONE';
  title: string;
  description: string;
  date?: string;
}

export interface MissionReviewInsight {
  category: 'PATTERN' | 'CHALLENGE' | 'OPPORTUNITY';
  title: string;
  description: string;
  confidence: number;
}

export interface MissionReviewRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionable: string;
}

// ============================================
// Calendar & Orchestration JSON Types
// ============================================

export interface ScheduleRecommendation {
  scheduledTime: string; // ISO datetime
  duration: number; // minutes
  objectives: string[];
  reasoning: string;
  conflictFree: boolean;
  optimalityScore: number; // 0.0-1.0
}

export interface AdaptationDetails {
  from: {
    time?: string;
    duration?: number;
    difficulty?: number;
  };
  to: {
    time?: string;
    duration?: number;
    difficulty?: number;
  };
  reason: string;
  expectedImpact?: number; // 0.0-1.0
}

export interface SessionOrchestrationPlan {
  plannedObjectives: string[];
  estimatedDuration: number; // minutes
  breakSchedule: Array<{
    afterMinutes: number;
    duration: number;
    type: 'SHORT' | 'MEDIUM' | 'LONG';
  }>;
  cognitiveLoadTarget: number; // 0-100
  adaptations?: AdaptationDetails[];
}

export interface StressPattern {
  triggers: string[];
  symptoms: string[];
  coping: string[];
  effectiveness: number; // 0.0-1.0
  lastObserved: string; // ISO date
}

// ============================================
// Learning Article JSON Types
// ============================================

export interface PersonalizedSection {
  type: 'FORGETTING_CURVE' | 'LEARNING_STYLE' | 'STUDY_PATTERNS' | 'PERFORMANCE_TRENDS';
  position: number; // Section position in article
  dataSource?: string; // Which data to personalize with
}

export interface ExternalLink {
  title: string;
  url: string;
  description?: string;
  credibilityScore?: number;
}

// ============================================
// Event Data JSON Types
// ============================================

export interface EventData {
  // Common fields
  timestamp?: string;
  source?: string;

  // Mission events
  missionId?: string;
  objectivesCompleted?: number;
  duration?: number;

  // Card review events
  cardId?: string;
  rating?: string;
  timeSpent?: number;

  // Session events
  sessionId?: string;
  cardsReviewed?: number;

  // Additional dynamic fields
  [key: string]: unknown;
}

// ============================================
// Type Guards
// ============================================

export function isMissionObjective(obj: unknown): obj is MissionObjective {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'objective' in obj &&
    'cardCount' in obj &&
    'estimatedMinutes' in obj
  );
}

export function isFeatureVector(obj: unknown): obj is FeatureVector {
  if (typeof obj !== 'object' || obj === null) return false;

  // At least some numeric features should exist
  const values = Object.values(obj);
  return values.some(v => typeof v === 'number');
}

export function isLearningStyleProfile(obj: unknown): obj is LearningStyleProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'visual' in obj &&
    'auditory' in obj &&
    'reading' in obj &&
    'kinesthetic' in obj
  );
}

// ============================================
// Utility Types
// ============================================

/**
 * Type-safe JSON parse for Prisma JSON fields
 */
export function parseJsonField<T>(json: unknown, defaultValue: T): T {
  if (json === null || json === undefined) {
    return defaultValue;
  }

  // Prisma returns JSON fields as objects, not strings
  if (typeof json === 'object') {
    return json as T;
  }

  // Fallback for string JSON (shouldn't happen with Prisma)
  if (typeof json === 'string') {
    try {
      return JSON.parse(json) as T;
    } catch {
      return defaultValue;
    }
  }

  return defaultValue;
}

/**
 * Type-safe JSON stringify for Prisma JSON fields
 */
export function stringifyJsonField<T>(value: T): T {
  // Prisma accepts objects directly for JSON fields
  return value;
}
