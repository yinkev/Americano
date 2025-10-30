// Zod validation schemas for API requests
// Provides type-safe request validation with detailed error messages

import { z } from 'zod'
import { ApiError } from './api-error'

/**
 * Validation helper to parse request body with Zod schema
 * Throws ApiError with validation details if parsing fails
 *
 * @example
 * const data = await validateRequest(request, createCourseSchema);
 */
export async function validateRequest<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiError.validation('Invalid request data', {
        errors: error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
    throw error
  }
}

/**
 * Validation helper for query parameters
 */
export function validateQuery<T>(searchParams: URLSearchParams, schema: z.ZodSchema<T>): T {
  try {
    // Convert searchParams to plain object
    const params: Record<string, string | string[]> = {}
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle multiple values for same key
        if (Array.isArray(params[key])) {
          ;(params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    })

    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiError.validation('Invalid query parameters', {
        errors: error.issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
    throw error
  }
}

// ============================================
// USER SCHEMAS
// ============================================

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  medicalSchool: z
    .string()
    .max(200, 'Medical school name must be 200 characters or less')
    .optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
})

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

// ============================================
// COURSE SCHEMAS
// ============================================

export const createCourseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less'),
  code: z.string().max(20, 'Course code must be 20 characters or less').optional(),
  term: z.string().max(50, 'Term must be 50 characters or less').optional(),
  color: z
    .string()
    .regex(/^oklch\([\d\s._]+\)$/, 'Color must be in OKLCH format')
    .optional(),
})

export const updateCourseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be 100 characters or less')
    .optional(),
  code: z.string().max(20, 'Course code must be 20 characters or less').optional(),
  term: z.string().max(50, 'Term must be 50 characters or less').optional(),
  color: z
    .string()
    .regex(/^oklch\([\d\s._]+\)$/, 'Color must be in OKLCH format')
    .optional(),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

// ============================================
// LECTURE SCHEMAS
// ============================================

export const updateLectureSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  courseId: z.string().cuid('Invalid course ID').optional(),
  weekNumber: z.number().int().min(1).max(52).optional(),
  topicTags: z
    .array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must be 30 characters or less'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

export type UpdateLectureInput = z.infer<typeof updateLectureSchema>

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const lectureListQuerySchema = z.object({
  courseId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  tags: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .optional(),
  sortBy: z.enum(['uploadedAt', 'title', 'processedAt', 'processingStatus']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().default('50').transform(Number).pipe(z.number().int().min(1).max(100)),
})

export const courseListQuerySchema = z.object({
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type LectureListQuery = z.infer<typeof lectureListQuerySchema>
export type CourseListQuery = z.infer<typeof courseListQuerySchema>

// ============================================
// CLINICAL SCENARIO SCHEMAS (Story 4.2)
// ============================================

export const generateScenarioSchema = z.object({
  objectiveId: z.string().cuid('Invalid objective ID'),
  difficulty: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
})

export const submitScenarioSchema = z.object({
  scenarioId: z.string().cuid('Invalid scenario ID'),
  sessionId: z.string().cuid('Invalid session ID').optional(),
  userChoices: z.object({
    // Multi-stage user selections
    historyChoices: z.array(z.string()).optional(),
    examChoices: z.array(z.string()).optional(),
    labChoices: z.array(z.string()).optional(),
    diagnosis: z.string().optional(),
    managementPlan: z.string().optional(),
    // Additional info requested (costs time/points)
    additionalInfo: z.array(z.string()).optional(),
  }),
  userReasoning: z
    .string()
    .min(10, 'Please provide detailed reasoning')
    .max(2000, 'Reasoning must be 2000 characters or less'),
})

export const scenarioMetricsQuerySchema = z.object({
  dateRange: z.enum(['7days', '30days', '90days']).default('30days'),
  scenarioType: z.enum(['DIAGNOSIS', 'MANAGEMENT', 'DIFFERENTIAL', 'COMPLICATIONS']).optional(),
})

// Case structure validation for generated scenarios
export const caseTextSchema = z.object({
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  demographics: z.object({
    age: z.number().int().min(1).max(120),
    sex: z.enum(['M', 'F', 'Other']),
    occupation: z.string().optional(),
  }),
  history: z.object({
    presenting: z.string().min(1, 'Presenting history is required'),
    past: z.string().optional(),
    medications: z.array(z.string()).optional(),
    socialHistory: z.string().optional(),
  }),
  physicalExam: z.object({
    vitals: z.record(z.string(), z.string()).optional(),
    general: z.string().optional(),
    cardiovascular: z.string().optional(),
    respiratory: z.string().optional(),
    other: z.string().optional(),
  }),
  labs: z.object({
    available: z.boolean(),
    options: z.array(z.string()),
    ordered: z.array(z.string()).optional(),
  }),
  questions: z.array(
    z.object({
      stage: z.string(),
      prompt: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
      reasoning: z.string(),
    }),
  ),
})

// Competency scores validation
export const competencyScoresSchema = z.object({
  dataGathering: z.number().int().min(0).max(100),
  diagnosis: z.number().int().min(0).max(100),
  management: z.number().int().min(0).max(100),
  clinicalReasoning: z.number().int().min(0).max(100),
})

export type GenerateScenarioInput = z.infer<typeof generateScenarioSchema>
export type SubmitScenarioInput = z.infer<typeof submitScenarioSchema>
export type ScenarioMetricsQuery = z.infer<typeof scenarioMetricsQuerySchema>
export type CaseText = z.infer<typeof caseTextSchema>
export type CompetencyScores = z.infer<typeof competencyScoresSchema>

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const uploadMetadataSchema = z.object({
  courseId: z.string().cuid('Invalid course ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  weekNumber: z.number().int().min(1).max(52).optional(),
  topicTags: z
    .array(z.string().min(1, 'Tag cannot be empty').max(30, 'Tag must be 30 characters or less'))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
})

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>

// ============================================
// CONTROLLED FAILURE SCHEMAS (Story 4.3)
// ============================================

export const getNextChallengeQuerySchema = z.object({
  sessionId: z.string().cuid('Invalid session ID').optional(),
})

export const submitChallengeSchema = z.object({
  challengeId: z.string().cuid('Invalid challenge ID'),
  userAnswer: z
    .string()
    .min(1, 'Answer is required')
    .max(5000, 'Answer must be 5000 characters or less'),
  confidence: z.number().int().min(1).max(5, 'Confidence must be between 1 and 5'),
  emotionTag: z.enum(['SURPRISE', 'CONFUSION', 'FRUSTRATION', 'AHA_MOMENT']).optional(),
  personalNotes: z.string().max(500, 'Personal notes must be 500 characters or less').optional(),
})

export const patternsQuerySchema = z.object({
  limit: z.string().default('5').transform(Number).pipe(z.number().int().min(1).max(20)),
})

export const calibrationQuerySchema = z.object({
  dateRange: z.enum(['7days', '30days', '90days']).default('30days'),
})

export type GetNextChallengeQuery = z.infer<typeof getNextChallengeQuerySchema>
export type SubmitChallengeInput = z.infer<typeof submitChallengeSchema>
export type PatternsQuery = z.infer<typeof patternsQuerySchema>
export type CalibrationQuery = z.infer<typeof calibrationQuerySchema>

// ============================================
// ADAPTIVE QUESTIONING SCHEMAS (Story 4.5)
// ============================================

export const nextQuestionSchema = z.object({
  sessionId: z.string().cuid('Invalid session ID').optional(),
  objectiveId: z.string().cuid('Invalid objective ID'),
  lastResponseId: z.string().cuid('Invalid response ID').optional(),
  lastScore: z.number().min(0).max(100).optional(),
  lastConfidence: z.number().int().min(1).max(5).optional(),
})

export const submitResponseSchema = z.object({
  promptId: z.string().cuid('Invalid prompt ID'),
  sessionId: z.string().cuid('Invalid session ID').optional(),
  objectiveId: z.string().cuid('Invalid objective ID'),
  userAnswer: z
    .string()
    .min(1, 'Answer is required')
    .max(5000, 'Answer must be 5000 characters or less'),
  confidence: z.number().int().min(1).max(5, 'Confidence must be between 1 and 5'),
  timeToRespond: z.number().int().min(0).optional(), // milliseconds
  currentDifficulty: z.number().int().min(0).max(100),
})

export const masteryStatusQuerySchema = z.object({
  objectiveId: z.string().cuid('Invalid objective ID'),
})

export const followUpQuestionsSchema = z.object({
  objectiveId: z.string().cuid('Invalid objective ID'),
  responseId: z.string().cuid('Invalid response ID'),
  score: z.number().min(0).max(100),
  currentDifficulty: z.number().int().min(0).max(100),
})

export type NextQuestionInput = z.infer<typeof nextQuestionSchema>
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
export type MasteryStatusQuery = z.infer<typeof masteryStatusQuerySchema>
export type FollowUpQuestionsInput = z.infer<typeof followUpQuestionsSchema>

// ============================================
// HELPER UTILITIES
// ============================================

/**
 * Helper to validate pagination parameters
 */
export function validatePagination(page: number, limit: number): void {
  if (page < 1 || limit < 1 || limit > 100) {
    throw ApiError.validation('Invalid pagination parameters', {
      page,
      limit,
      constraints: {
        page: 'Must be >= 1',
        limit: 'Must be between 1 and 100',
      },
    })
  }
}

/**
 * Helper to validate sort parameters
 */
export function validateSort(sortBy: string, sortOrder: string, validFields: string[]): void {
  if (!validFields.includes(sortBy)) {
    throw ApiError.validation(`Invalid sort field: ${sortBy}`, {
      validFields,
    })
  }

  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw ApiError.validation('Sort order must be asc or desc')
  }
}

// ============================================
// STORY 4.6: UNDERSTANDING ANALYTICS SCHEMAS
// ============================================

// Query parameter schemas for dashboard
export const analyticsQuerySchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d']).default('30d'),
  courseId: z.string().cuid('Invalid course ID').optional(),
  topic: z.string().optional(),
})

// Dashboard overview metrics response
export const metricSchema = z.object({
  currentScore: z.number().min(0).max(100),
  trend: z.enum(['up', 'down', 'stable']),
  sparkline: z.array(z.number()).optional(),
  change: z.number().optional(), // % change
})

export const dashboardResponseSchema = z.object({
  comprehension: metricSchema,
  reasoning: metricSchema,
  failure: metricSchema,
  calibration: metricSchema,
  adaptive: metricSchema,
  mastery: z.object({
    count: z.number().int().min(0),
    total: z.number().int().min(0),
    percentage: z.number().min(0).max(100),
  }),
})

// Comparison tab response schema
export const comparisonDataSchema = z.object({
  memorization: z.array(
    z.object({
      date: z.string(), // ISO date
      score: z.number().min(0).max(100),
    }),
  ),
  understanding: z.array(
    z.object({
      date: z.string(),
      score: z.number().min(0).max(100),
    }),
  ),
  gaps: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      memorizationScore: z.number(),
      understandingScore: z.number(),
      gap: z.number(),
    }),
  ),
  correlation: z.number().min(-1).max(1),
})

// Patterns tab response schema
export const patternsResponseSchema = z.object({
  strengths: z.array(
    z.object({
      topic: z.string(),
      score: z.number().min(0).max(100),
      objectiveIds: z.array(z.string()),
    }),
  ),
  weaknesses: z.array(
    z.object({
      topic: z.string(),
      score: z.number().min(0).max(100),
      objectiveIds: z.array(z.string()),
      recommendedActions: z.array(z.string()),
    }),
  ),
  inconsistencies: z.array(
    z.object({
      description: z.string(),
      affectedObjectives: z.array(z.string()),
      patternType: z.string(),
    }),
  ),
  insights: z.array(
    z.object({
      message: z.string(),
      confidence: z.number().min(0).max(1),
      actionable: z.boolean(),
    }),
  ),
})

// Longitudinal progress response schema
export const longitudinalResponseSchema = z.object({
  metrics: z.array(
    z.object({
      date: z.string(),
      comprehension: z.number(),
      reasoning: z.number(),
      calibration: z.number(),
    }),
  ),
  milestones: z.array(
    z.object({
      date: z.string(),
      type: z.enum(['mastery', 'improvement', 'breakthrough']),
      description: z.string(),
      objectiveId: z.string().optional(),
    }),
  ),
  regressions: z.array(
    z.object({
      date: z.string(),
      metric: z.string(),
      dropPercentage: z.number(),
      objectiveId: z.string().optional(),
    }),
  ),
  growthRate: z.number(), // % per month
})

// Predictions response schema
export const predictionsResponseSchema = z.object({
  examSuccess: z.object({
    probability: z.number().min(0).max(1),
    confidenceInterval: z.object({
      lower: z.number(),
      upper: z.number(),
    }),
    factors: z.array(z.string()),
  }),
  forgettingRisks: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
      daysUntilForgetting: z.number().int(),
      lastStudied: z.string(), // ISO date
    }),
  ),
  masteryDates: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      estimatedDate: z.string(), // ISO date
      currentProgress: z.number().min(0).max(100),
      hoursNeeded: z.number(),
    }),
  ),
  modelAccuracy: z.object({
    mae: z.number(), // Mean absolute error
    sampleSize: z.number().int(),
  }),
})

// Correlations response schema
export const correlationsResponseSchema = z.object({
  correlationMatrix: z.array(z.array(z.number())), // 2D matrix
  objectiveNames: z.array(z.string()), // Labels for matrix axes
  foundational: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      outgoingCorrelations: z.number().int(),
    }),
  ),
  bottlenecks: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      blockingCount: z.number().int(),
    }),
  ),
  sequence: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      position: z.number().int(),
      reasoning: z.string(),
    }),
  ),
})

// Peer benchmark response schema
export const peerBenchmarkResponseSchema = z.object({
  peerDistribution: z.array(
    z.object({
      metric: z.string(),
      percentile25: z.number(),
      percentile50: z.number(),
      percentile75: z.number(),
      mean: z.number(),
      userValue: z.number(),
    }),
  ),
  userPercentile: z.record(z.string(), z.number()), // metric -> percentile
  relativeStrengths: z.array(
    z.object({
      metric: z.string(),
      userPercentile: z.number(),
      gap: z.number(), // How much above average
    }),
  ),
  relativeWeaknesses: z.array(
    z.object({
      metric: z.string(),
      userPercentile: z.number(),
      gap: z.number(), // How much below average
    }),
  ),
  sampleSize: z.number().int(),
})

// Recommendations response schema
export const recommendationsResponseSchema = z.object({
  dailyInsight: z.object({
    message: z.string(),
    priority: z.number().int().min(1).max(10),
    actions: z.array(z.string()),
  }),
  weeklyTop3: z.array(
    z.object({
      objectiveId: z.string(),
      objectiveName: z.string(),
      reason: z.string(),
      estimatedTime: z.number().int(), // minutes
      priority: z.number().int().min(1).max(10),
    }),
  ),
  interventions: z.array(
    z.object({
      type: z.enum(['overconfidence', 'underconfidence', 'failure_pattern', 'knowledge_gap']),
      description: z.string(),
      recommendedAction: z.string(),
      affectedObjectives: z.array(z.string()),
    }),
  ),
  timeEstimates: z.object({
    dailyRecommended: z.number().int(), // minutes
    weeklyRecommended: z.number().int(),
  }),
  successProbs: z.object({
    nextWeek: z.number().min(0).max(1),
    nextMonth: z.number().min(0).max(1),
  }),
})

// Export request schema
export const exportReportSchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d']).default('30d'),
  includeCharts: z.boolean().default(true),
})

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>
export type ComparisonData = z.infer<typeof comparisonDataSchema>
export type PatternsResponse = z.infer<typeof patternsResponseSchema>
export type LongitudinalResponse = z.infer<typeof longitudinalResponseSchema>
export type PredictionsResponse = z.infer<typeof predictionsResponseSchema>
export type CorrelationsResponse = z.infer<typeof correlationsResponseSchema>
export type PeerBenchmarkResponse = z.infer<typeof peerBenchmarkResponseSchema>
export type RecommendationsResponse = z.infer<typeof recommendationsResponseSchema>
export type ExportReportInput = z.infer<typeof exportReportSchema>
