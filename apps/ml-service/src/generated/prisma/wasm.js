
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.17.0
 * Query Engine version: 393aa359c9ad4a4bb28630fb5613f9c281cde053
 */
Prisma.prismaVersion = {
  client: "5.17.0",
  engine: "393aa359c9ad4a4bb28630fb5613f9c281cde053"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  defaultMissionMinutes: 'defaultMissionMinutes',
  missionDifficulty: 'missionDifficulty',
  preferredStudyTime: 'preferredStudyTime',
  autoGenerateMissions: 'autoGenerateMissions',
  performanceTrackingEnabled: 'performanceTrackingEnabled',
  includeInAnalytics: 'includeInAnalytics',
  lastMissionAdaptation: 'lastMissionAdaptation',
  behavioralAnalysisEnabled: 'behavioralAnalysisEnabled',
  learningStyleProfilingEnabled: 'learningStyleProfilingEnabled',
  shareAnonymizedPatterns: 'shareAnonymizedPatterns'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  code: 'code',
  term: 'term',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LectureScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  courseId: 'courseId',
  title: 'title',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  fileSize: 'fileSize',
  processingStatus: 'processingStatus',
  uploadedAt: 'uploadedAt',
  processedAt: 'processedAt',
  processingProgress: 'processingProgress',
  totalPages: 'totalPages',
  processedPages: 'processedPages',
  processingStartedAt: 'processingStartedAt',
  estimatedCompletionAt: 'estimatedCompletionAt',
  weekNumber: 'weekNumber',
  topicTags: 'topicTags'
};

exports.Prisma.ContentChunkScalarFieldEnum = {
  id: 'id',
  lectureId: 'lectureId',
  content: 'content',
  chunkIndex: 'chunkIndex',
  pageNumber: 'pageNumber',
  createdAt: 'createdAt'
};

exports.Prisma.LearningObjectiveScalarFieldEnum = {
  id: 'id',
  lectureId: 'lectureId',
  objective: 'objective',
  complexity: 'complexity',
  pageStart: 'pageStart',
  pageEnd: 'pageEnd',
  isHighYield: 'isHighYield',
  boardExamTags: 'boardExamTags',
  extractedBy: 'extractedBy',
  createdAt: 'createdAt',
  masteryLevel: 'masteryLevel',
  totalStudyTimeMs: 'totalStudyTimeMs',
  lastStudiedAt: 'lastStudiedAt',
  weaknessScore: 'weaknessScore'
};

exports.Prisma.ObjectivePrerequisiteScalarFieldEnum = {
  id: 'id',
  objectiveId: 'objectiveId',
  prerequisiteId: 'prerequisiteId',
  strength: 'strength'
};

exports.Prisma.MissionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  date: 'date',
  status: 'status',
  estimatedMinutes: 'estimatedMinutes',
  completedAt: 'completedAt',
  actualMinutes: 'actualMinutes',
  completedObjectivesCount: 'completedObjectivesCount',
  objectives: 'objectives',
  reviewCardCount: 'reviewCardCount',
  newContentCount: 'newContentCount',
  successScore: 'successScore',
  difficultyRating: 'difficultyRating'
};

exports.Prisma.CardScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  lectureId: 'lectureId',
  objectiveId: 'objectiveId',
  front: 'front',
  back: 'back',
  cardType: 'cardType',
  createdAt: 'createdAt',
  difficulty: 'difficulty',
  stability: 'stability',
  retrievability: 'retrievability',
  lastReviewedAt: 'lastReviewedAt',
  nextReviewAt: 'nextReviewAt',
  reviewCount: 'reviewCount',
  lapseCount: 'lapseCount'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  cardId: 'cardId',
  sessionId: 'sessionId',
  rating: 'rating',
  timeSpentMs: 'timeSpentMs',
  reviewedAt: 'reviewedAt',
  difficultyBefore: 'difficultyBefore',
  stabilityBefore: 'stabilityBefore',
  difficultyAfter: 'difficultyAfter',
  stabilityAfter: 'stabilityAfter'
};

exports.Prisma.StudySessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  missionId: 'missionId',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  durationMs: 'durationMs',
  reviewsCompleted: 'reviewsCompleted',
  newCardsStudied: 'newCardsStudied',
  sessionNotes: 'sessionNotes',
  currentObjectiveIndex: 'currentObjectiveIndex',
  missionObjectives: 'missionObjectives',
  objectiveCompletions: 'objectiveCompletions'
};

exports.Prisma.ConceptScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  createdAt: 'createdAt'
};

exports.Prisma.ConceptRelationshipScalarFieldEnum = {
  id: 'id',
  fromConceptId: 'fromConceptId',
  toConceptId: 'toConceptId',
  relationship: 'relationship',
  strength: 'strength',
  createdAt: 'createdAt'
};

exports.Prisma.ValidationPromptScalarFieldEnum = {
  id: 'id',
  promptText: 'promptText',
  promptType: 'promptType',
  conceptName: 'conceptName',
  expectedCriteria: 'expectedCriteria',
  createdAt: 'createdAt'
};

exports.Prisma.ValidationResponseScalarFieldEnum = {
  id: 'id',
  promptId: 'promptId',
  sessionId: 'sessionId',
  userAnswer: 'userAnswer',
  aiEvaluation: 'aiEvaluation',
  score: 'score',
  confidence: 'confidence',
  respondedAt: 'respondedAt'
};

exports.Prisma.ComprehensionMetricScalarFieldEnum = {
  id: 'id',
  conceptName: 'conceptName',
  date: 'date',
  avgScore: 'avgScore',
  sampleSize: 'sampleSize',
  trend: 'trend'
};

exports.Prisma.BehavioralEventScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  eventType: 'eventType',
  eventData: 'eventData',
  timestamp: 'timestamp',
  sessionPerformanceScore: 'sessionPerformanceScore',
  engagementLevel: 'engagementLevel',
  completionQuality: 'completionQuality',
  timeOfDay: 'timeOfDay',
  dayOfWeek: 'dayOfWeek',
  contentType: 'contentType',
  difficultyLevel: 'difficultyLevel'
};

exports.Prisma.BehavioralPatternScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  patternType: 'patternType',
  patternName: 'patternName',
  confidence: 'confidence',
  evidence: 'evidence',
  detectedAt: 'detectedAt',
  lastSeenAt: 'lastSeenAt',
  occurrenceCount: 'occurrenceCount'
};

exports.Prisma.BehavioralInsightScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  insightType: 'insightType',
  title: 'title',
  description: 'description',
  actionableRecommendation: 'actionableRecommendation',
  confidence: 'confidence',
  createdAt: 'createdAt',
  acknowledgedAt: 'acknowledgedAt',
  applied: 'applied'
};

exports.Prisma.InsightPatternScalarFieldEnum = {
  id: 'id',
  insightId: 'insightId',
  patternId: 'patternId'
};

exports.Prisma.UserLearningProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  preferredStudyTimes: 'preferredStudyTimes',
  averageSessionDuration: 'averageSessionDuration',
  optimalSessionDuration: 'optimalSessionDuration',
  contentPreferences: 'contentPreferences',
  learningStyleProfile: 'learningStyleProfile',
  personalizedForgettingCurve: 'personalizedForgettingCurve',
  lastAnalyzedAt: 'lastAnalyzedAt',
  dataQualityScore: 'dataQualityScore'
};

exports.Prisma.LearningPatternScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  patternType: 'patternType',
  patternData: 'patternData',
  confidence: 'confidence',
  detectedAt: 'detectedAt',
  lastSeenAt: 'lastSeenAt'
};

exports.Prisma.PerformancePredictionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  predictedFor: 'predictedFor',
  predictionType: 'predictionType',
  prediction: 'prediction',
  confidence: 'confidence',
  createdAt: 'createdAt'
};

exports.Prisma.StrugglePredictionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  learningObjectiveId: 'learningObjectiveId',
  topicId: 'topicId',
  predictionDate: 'predictionDate',
  predictedStruggleProbability: 'predictedStruggleProbability',
  predictionConfidence: 'predictionConfidence',
  predictionStatus: 'predictionStatus',
  actualOutcome: 'actualOutcome',
  outcomeRecordedAt: 'outcomeRecordedAt',
  featureVector: 'featureVector'
};

exports.Prisma.StruggleIndicatorScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  predictionId: 'predictionId',
  learningObjectiveId: 'learningObjectiveId',
  indicatorType: 'indicatorType',
  severity: 'severity',
  detectedAt: 'detectedAt',
  context: 'context'
};

exports.Prisma.InterventionRecommendationScalarFieldEnum = {
  id: 'id',
  predictionId: 'predictionId',
  userId: 'userId',
  interventionType: 'interventionType',
  description: 'description',
  reasoning: 'reasoning',
  priority: 'priority',
  status: 'status',
  appliedAt: 'appliedAt',
  appliedToMissionId: 'appliedToMissionId',
  effectiveness: 'effectiveness',
  createdAt: 'createdAt'
};

exports.Prisma.PredictionFeedbackScalarFieldEnum = {
  id: 'id',
  predictionId: 'predictionId',
  userId: 'userId',
  feedbackType: 'feedbackType',
  actualStruggle: 'actualStruggle',
  helpfulness: 'helpfulness',
  comments: 'comments',
  submittedAt: 'submittedAt'
};

exports.Prisma.PerformanceMetricScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  learningObjectiveId: 'learningObjectiveId',
  date: 'date',
  retentionScore: 'retentionScore',
  studyTimeMs: 'studyTimeMs',
  reviewCount: 'reviewCount',
  correctReviews: 'correctReviews',
  incorrectReviews: 'incorrectReviews',
  createdAt: 'createdAt'
};

exports.Prisma.ExamScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  date: 'date',
  courseId: 'courseId',
  coverageTopics: 'coverageTopics',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CoursePriorityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  courseId: 'courseId',
  priorityLevel: 'priorityLevel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PriorityFeedbackScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  objectiveId: 'objectiveId',
  suggestedPriority: 'suggestedPriority',
  userFeedback: 'userFeedback',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.StreakScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  currentStreak: 'currentStreak',
  longestStreak: 'longestStreak',
  lastStudyDate: 'lastStudyDate',
  freezesRemaining: 'freezesRemaining',
  freezeUsedDates: 'freezeUsedDates',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AchievementScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  name: 'name',
  description: 'description',
  tier: 'tier',
  earnedAt: 'earnedAt',
  metadata: 'metadata'
};

exports.Prisma.StudyGoalScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  goalType: 'goalType',
  targetValue: 'targetValue',
  currentProgress: 'currentProgress',
  period: 'period',
  startDate: 'startDate',
  endDate: 'endDate',
  isCompleted: 'isCompleted',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.MissionAnalyticsScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  date: 'date',
  period: 'period',
  missionsGenerated: 'missionsGenerated',
  missionsCompleted: 'missionsCompleted',
  missionsSkipped: 'missionsSkipped',
  avgCompletionRate: 'avgCompletionRate',
  avgTimeAccuracy: 'avgTimeAccuracy',
  avgDifficultyRating: 'avgDifficultyRating',
  avgSuccessScore: 'avgSuccessScore',
  createdAt: 'createdAt'
};

exports.Prisma.MissionFeedbackScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  missionId: 'missionId',
  helpfulnessRating: 'helpfulnessRating',
  relevanceScore: 'relevanceScore',
  paceRating: 'paceRating',
  improvementSuggestions: 'improvementSuggestions',
  submittedAt: 'submittedAt'
};

exports.Prisma.MissionStreakScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  currentStreak: 'currentStreak',
  longestStreak: 'longestStreak',
  lastCompletedDate: 'lastCompletedDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MissionReviewScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  period: 'period',
  startDate: 'startDate',
  endDate: 'endDate',
  summary: 'summary',
  highlights: 'highlights',
  insights: 'insights',
  recommendations: 'recommendations',
  generatedAt: 'generatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ProcessingStatus = exports.$Enums.ProcessingStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.ObjectiveComplexity = exports.$Enums.ObjectiveComplexity = {
  BASIC: 'BASIC',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
};

exports.MasteryLevel = exports.$Enums.MasteryLevel = {
  NOT_STARTED: 'NOT_STARTED',
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  MASTERED: 'MASTERED'
};

exports.MissionStatus = exports.$Enums.MissionStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED'
};

exports.CardType = exports.$Enums.CardType = {
  BASIC: 'BASIC',
  CLOZE: 'CLOZE',
  CLINICAL_REASONING: 'CLINICAL_REASONING'
};

exports.ReviewRating = exports.$Enums.ReviewRating = {
  AGAIN: 'AGAIN',
  HARD: 'HARD',
  GOOD: 'GOOD',
  EASY: 'EASY'
};

exports.RelationshipType = exports.$Enums.RelationshipType = {
  PREREQUISITE: 'PREREQUISITE',
  RELATED: 'RELATED',
  INTEGRATED: 'INTEGRATED',
  CLINICAL: 'CLINICAL'
};

exports.PromptType = exports.$Enums.PromptType = {
  EXPLAIN_TO_PATIENT: 'EXPLAIN_TO_PATIENT',
  CLINICAL_REASONING: 'CLINICAL_REASONING',
  CONTROLLED_FAILURE: 'CONTROLLED_FAILURE'
};

exports.EventType = exports.$Enums.EventType = {
  MISSION_STARTED: 'MISSION_STARTED',
  MISSION_COMPLETED: 'MISSION_COMPLETED',
  CARD_REVIEWED: 'CARD_REVIEWED',
  VALIDATION_COMPLETED: 'VALIDATION_COMPLETED',
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',
  LECTURE_UPLOADED: 'LECTURE_UPLOADED',
  SEARCH_PERFORMED: 'SEARCH_PERFORMED',
  GRAPH_VIEWED: 'GRAPH_VIEWED'
};

exports.EngagementLevel = exports.$Enums.EngagementLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

exports.CompletionQuality = exports.$Enums.CompletionQuality = {
  RUSHED: 'RUSHED',
  NORMAL: 'NORMAL',
  THOROUGH: 'THOROUGH'
};

exports.BehavioralPatternType = exports.$Enums.BehavioralPatternType = {
  OPTIMAL_STUDY_TIME: 'OPTIMAL_STUDY_TIME',
  SESSION_DURATION_PREFERENCE: 'SESSION_DURATION_PREFERENCE',
  CONTENT_TYPE_PREFERENCE: 'CONTENT_TYPE_PREFERENCE',
  PERFORMANCE_PEAK: 'PERFORMANCE_PEAK',
  ATTENTION_CYCLE: 'ATTENTION_CYCLE',
  FORGETTING_CURVE: 'FORGETTING_CURVE'
};

exports.InsightType = exports.$Enums.InsightType = {
  STUDY_TIME_OPTIMIZATION: 'STUDY_TIME_OPTIMIZATION',
  SESSION_LENGTH_ADJUSTMENT: 'SESSION_LENGTH_ADJUSTMENT',
  CONTENT_PREFERENCE: 'CONTENT_PREFERENCE',
  RETENTION_STRATEGY: 'RETENTION_STRATEGY'
};

exports.PatternType = exports.$Enums.PatternType = {
  OPTIMAL_STUDY_TIME: 'OPTIMAL_STUDY_TIME',
  STRUGGLE_TOPIC: 'STRUGGLE_TOPIC',
  CONTENT_PREFERENCE: 'CONTENT_PREFERENCE',
  SESSION_LENGTH: 'SESSION_LENGTH',
  DAY_OF_WEEK_PATTERN: 'DAY_OF_WEEK_PATTERN'
};

exports.PredictionStatus = exports.$Enums.PredictionStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  MISSED: 'MISSED'
};

exports.IndicatorType = exports.$Enums.IndicatorType = {
  LOW_RETENTION: 'LOW_RETENTION',
  PREREQUISITE_GAP: 'PREREQUISITE_GAP',
  COMPLEXITY_MISMATCH: 'COMPLEXITY_MISMATCH',
  COGNITIVE_OVERLOAD: 'COGNITIVE_OVERLOAD',
  HISTORICAL_STRUGGLE_PATTERN: 'HISTORICAL_STRUGGLE_PATTERN',
  TOPIC_SIMILARITY_STRUGGLE: 'TOPIC_SIMILARITY_STRUGGLE'
};

exports.Severity = exports.$Enums.Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

exports.InterventionType = exports.$Enums.InterventionType = {
  PREREQUISITE_REVIEW: 'PREREQUISITE_REVIEW',
  DIFFICULTY_PROGRESSION: 'DIFFICULTY_PROGRESSION',
  CONTENT_FORMAT_ADAPT: 'CONTENT_FORMAT_ADAPT',
  COGNITIVE_LOAD_REDUCE: 'COGNITIVE_LOAD_REDUCE',
  SPACED_REPETITION_BOOST: 'SPACED_REPETITION_BOOST',
  BREAK_SCHEDULE_ADJUST: 'BREAK_SCHEDULE_ADJUST'
};

exports.InterventionStatus = exports.$Enums.InterventionStatus = {
  PENDING: 'PENDING',
  APPLIED: 'APPLIED',
  COMPLETED: 'COMPLETED',
  DISMISSED: 'DISMISSED'
};

exports.FeedbackType = exports.$Enums.FeedbackType = {
  HELPFUL: 'HELPFUL',
  NOT_HELPFUL: 'NOT_HELPFUL',
  INACCURATE: 'INACCURATE',
  INTERVENTION_GOOD: 'INTERVENTION_GOOD',
  INTERVENTION_BAD: 'INTERVENTION_BAD'
};

exports.PriorityLevel = exports.$Enums.PriorityLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.FeedbackRating = exports.$Enums.FeedbackRating = {
  TOO_HIGH: 'TOO_HIGH',
  JUST_RIGHT: 'JUST_RIGHT',
  TOO_LOW: 'TOO_LOW'
};

exports.AchievementType = exports.$Enums.AchievementType = {
  STREAK_MILESTONE: 'STREAK_MILESTONE',
  OBJECTIVES_COMPLETED: 'OBJECTIVES_COMPLETED',
  CARDS_MASTERED: 'CARDS_MASTERED',
  PERFECT_SESSION: 'PERFECT_SESSION',
  EARLY_BIRD: 'EARLY_BIRD',
  NIGHT_OWL: 'NIGHT_OWL'
};

exports.AchievementTier = exports.$Enums.AchievementTier = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM'
};

exports.GoalType = exports.$Enums.GoalType = {
  TIME_BASED: 'TIME_BASED',
  OBJECTIVE_BASED: 'OBJECTIVE_BASED',
  REVIEW_BASED: 'REVIEW_BASED'
};

exports.GoalPeriod = exports.$Enums.GoalPeriod = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

exports.AnalyticsPeriod = exports.$Enums.AnalyticsPeriod = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

exports.PaceRating = exports.$Enums.PaceRating = {
  TOO_SLOW: 'TOO_SLOW',
  JUST_RIGHT: 'JUST_RIGHT',
  TOO_FAST: 'TOO_FAST'
};

exports.ReviewPeriod = exports.$Enums.ReviewPeriod = {
  WEEK: 'WEEK',
  MONTH: 'MONTH'
};

exports.Prisma.ModelName = {
  User: 'User',
  Course: 'Course',
  Lecture: 'Lecture',
  ContentChunk: 'ContentChunk',
  LearningObjective: 'LearningObjective',
  ObjectivePrerequisite: 'ObjectivePrerequisite',
  Mission: 'Mission',
  Card: 'Card',
  Review: 'Review',
  StudySession: 'StudySession',
  Concept: 'Concept',
  ConceptRelationship: 'ConceptRelationship',
  ValidationPrompt: 'ValidationPrompt',
  ValidationResponse: 'ValidationResponse',
  ComprehensionMetric: 'ComprehensionMetric',
  BehavioralEvent: 'BehavioralEvent',
  BehavioralPattern: 'BehavioralPattern',
  BehavioralInsight: 'BehavioralInsight',
  InsightPattern: 'InsightPattern',
  UserLearningProfile: 'UserLearningProfile',
  LearningPattern: 'LearningPattern',
  PerformancePrediction: 'PerformancePrediction',
  StrugglePrediction: 'StrugglePrediction',
  StruggleIndicator: 'StruggleIndicator',
  InterventionRecommendation: 'InterventionRecommendation',
  PredictionFeedback: 'PredictionFeedback',
  PerformanceMetric: 'PerformanceMetric',
  Exam: 'Exam',
  CoursePriority: 'CoursePriority',
  PriorityFeedback: 'PriorityFeedback',
  Streak: 'Streak',
  Achievement: 'Achievement',
  StudyGoal: 'StudyGoal',
  MissionAnalytics: 'MissionAnalytics',
  MissionFeedback: 'MissionFeedback',
  MissionStreak: 'MissionStreak',
  MissionReview: 'MissionReview'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
