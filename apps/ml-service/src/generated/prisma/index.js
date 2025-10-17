
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/library.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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


  const path = require('path')

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/kyin/Projects/Americano-epic5/apps/ml-service/src/generated/prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      }
    ],
    "previewFeatures": [
      "postgresqlExtensions"
    ],
    "sourceFilePath": "/Users/kyin/Projects/Americano-epic5/apps/ml-service/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "5.17.0",
  "engineVersion": "393aa359c9ad4a4bb28630fb5613f9c281cde053",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// prisma/schema.prisma\n\ngenerator client {\n  provider        = \"prisma-client-js\"\n  output          = \"../src/generated/prisma\"\n  previewFeatures = [\"postgresqlExtensions\"]\n}\n\ndatasource db {\n  provider   = \"postgresql\"\n  url        = env(\"DATABASE_URL\")\n  extensions = [pgvector(map: \"vector\")]\n}\n\n// ============================================\n// SUBSYSTEM 1: Content Processing Pipeline\n// ============================================\n\nmodel User {\n  id        String   @id @default(cuid())\n  email     String?  @unique\n  name      String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Mission preferences (Story 2.4 Task 8)\n  defaultMissionMinutes Int     @default(50) // 30-90 minute range\n  missionDifficulty     String  @default(\"AUTO\") // AUTO, EASY, MODERATE, CHALLENGING\n  preferredStudyTime    String? // HH:MM format (e.g., \"07:00\", \"18:00\")\n  autoGenerateMissions  Boolean @default(true)\n\n  // Performance tracking preferences (Story 2.2 Task 8)\n  performanceTrackingEnabled Boolean @default(true)\n  includeInAnalytics         Boolean @default(true)\n\n  // Story 2.6: Mission adaptation tracking\n  lastMissionAdaptation DateTime? // Throttle adaptations to max 1/week\n\n  // Story 5.1: Behavioral analysis privacy controls\n  behavioralAnalysisEnabled     Boolean @default(true)\n  learningStyleProfilingEnabled Boolean @default(true)\n  shareAnonymizedPatterns       Boolean @default(false) // Future feature for research\n\n  // Relations\n  courses          Course[]\n  lectures         Lecture[]\n  studySessions    StudySession[]\n  missions         Mission[]\n  reviews          Review[]\n  exams            Exam[]\n  coursePriorities CoursePriority[]\n  streak           Streak?\n  achievements     Achievement[]\n  studyGoals       StudyGoal[]\n  missionStreak    MissionStreak?\n  missionReviews   MissionReview[]\n\n  @@map(\"users\")\n}\n\nmodel Course {\n  id        String   @id @default(cuid())\n  userId    String\n  name      String // \"Gross Anatomy (ANAT 505)\"\n  code      String? // \"ANAT 505\"\n  term      String? // \"Fall 2025\"\n  color     String? // OKLCH color for visual organization (e.g., \"oklch(0.7 0.15 230)\")\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)\n  lectures         Lecture[]\n  cards            Card[]\n  exams            Exam[]\n  coursePriorities CoursePriority[]\n\n  @@index([userId])\n  @@map(\"courses\")\n}\n\nmodel Lecture {\n  id               String           @id @default(cuid())\n  userId           String\n  courseId         String\n  title            String\n  fileName         String\n  fileUrl          String // Local path or Supabase URL\n  fileSize         Int\n  processingStatus ProcessingStatus @default(PENDING)\n  uploadedAt       DateTime         @default(now())\n  processedAt      DateTime?\n\n  // Processing progress tracking\n  processingProgress    Int       @default(0) // 0-100 percentage\n  totalPages            Int? // Total number of pages to process\n  processedPages        Int       @default(0) // Number of pages processed\n  processingStartedAt   DateTime? // When processing started\n  estimatedCompletionAt DateTime? // ETA for completion\n\n  // Metadata\n  weekNumber Int?\n  topicTags  String[]\n\n  // Relations\n  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)\n  course             Course              @relation(fields: [courseId], references: [id], onDelete: Cascade)\n  contentChunks      ContentChunk[]\n  learningObjectives LearningObjective[]\n  cards              Card[]\n\n  @@index([userId])\n  @@index([courseId])\n  @@index([processingStatus])\n  @@map(\"lectures\")\n}\n\nenum ProcessingStatus {\n  PENDING\n  PROCESSING\n  COMPLETED\n  FAILED\n}\n\nmodel ContentChunk {\n  id         String                       @id @default(cuid())\n  lectureId  String\n  content    String                       @db.Text\n  embedding  Unsupported(\"vector(1536)\")? // gemini-embedding-001 (output_dimensionality: 1536)\n  chunkIndex Int // Order within lecture\n  pageNumber Int?\n  createdAt  DateTime                     @default(now())\n\n  // Relations\n  lecture Lecture @relation(fields: [lectureId], references: [id], onDelete: Cascade)\n\n  @@index([lectureId])\n  @@map(\"content_chunks\")\n}\n\nmodel LearningObjective {\n  id            String              @id @default(cuid())\n  lectureId     String\n  objective     String              @db.Text\n  complexity    ObjectiveComplexity @default(INTERMEDIATE)\n  pageStart     Int?\n  pageEnd       Int?\n  isHighYield   Boolean             @default(false)\n  boardExamTags String[] // USMLE Step 1/2/3, COMLEX Level 1/2/3, subject tags\n  extractedBy   String              @default(\"gpt-5\")\n  createdAt     DateTime            @default(now())\n\n  // Performance tracking fields (Story 2.2)\n  masteryLevel     MasteryLevel @default(NOT_STARTED)\n  totalStudyTimeMs Int          @default(0)\n  lastStudiedAt    DateTime?\n  weaknessScore    Float        @default(0.5) // 0.0-1.0, higher = weaker\n\n  // Relations\n  lecture             Lecture                 @relation(fields: [lectureId], references: [id], onDelete: Cascade)\n  cards               Card[]\n  prerequisites       ObjectivePrerequisite[] @relation(\"Objective\")\n  dependents          ObjectivePrerequisite[] @relation(\"Prerequisite\")\n  performanceMetrics  PerformanceMetric[]\n  priorityFeedback    PriorityFeedback[]\n  strugglePredictions StrugglePrediction[]\n  struggleIndicators  StruggleIndicator[]\n\n  @@index([lectureId])\n  @@index([isHighYield])\n  @@index([complexity])\n  @@index([masteryLevel])\n  @@index([weaknessScore])\n  @@map(\"learning_objectives\")\n}\n\nenum ObjectiveComplexity {\n  BASIC\n  INTERMEDIATE\n  ADVANCED\n}\n\nenum MasteryLevel {\n  NOT_STARTED\n  BEGINNER\n  INTERMEDIATE\n  ADVANCED\n  MASTERED\n}\n\nmodel ObjectivePrerequisite {\n  id             String @id @default(cuid())\n  objectiveId    String\n  prerequisiteId String\n  strength       Float  @default(1.0)\n\n  // Relations\n  objective    LearningObjective @relation(\"Objective\", fields: [objectiveId], references: [id], onDelete: Cascade)\n  prerequisite LearningObjective @relation(\"Prerequisite\", fields: [prerequisiteId], references: [id], onDelete: Cascade)\n\n  @@unique([objectiveId, prerequisiteId])\n  @@index([objectiveId])\n  @@index([prerequisiteId])\n  @@map(\"objective_prerequisites\")\n}\n\n// ============================================\n// SUBSYSTEM 2: Learning Engine\n// ============================================\n\nmodel Mission {\n  id                       String        @id @default(cuid())\n  userId                   String\n  date                     DateTime      @default(now())\n  status                   MissionStatus @default(PENDING)\n  estimatedMinutes         Int\n  completedAt              DateTime?\n  actualMinutes            Int? // Tracked during study session\n  completedObjectivesCount Int           @default(0)\n\n  // Mission content\n  // objectives: JSON array of { objectiveId, estimatedMinutes, completed, completedAt?, notes? }\n  objectives      Json // Array of MissionObjective objects\n  reviewCardCount Int  @default(0) // Number of cards due for review\n  newContentCount Int  @default(0) // Number of new concepts to learn\n\n  // Story 2.6: Mission analytics fields\n  successScore     Float? // 0.0-1.0 composite success metric (Task 9)\n  difficultyRating Int? // User feedback 1-5 (Task 4)\n\n  // Relations\n  user          User                         @relation(fields: [userId], references: [id], onDelete: Cascade)\n  studySessions StudySession[]\n  feedback      MissionFeedback[]\n  interventions InterventionRecommendation[]\n\n  @@index([userId])\n  @@index([date])\n  @@index([status])\n  @@map(\"missions\")\n}\n\nenum MissionStatus {\n  PENDING\n  IN_PROGRESS\n  COMPLETED\n  SKIPPED\n}\n\nmodel Card {\n  id          String   @id @default(cuid())\n  courseId    String\n  lectureId   String?\n  objectiveId String?\n  front       String   @db.Text\n  back        String   @db.Text\n  cardType    CardType @default(BASIC)\n  createdAt   DateTime @default(now())\n\n  // FSRS state\n  difficulty     Float     @default(0)\n  stability      Float     @default(0)\n  retrievability Float     @default(0)\n  lastReviewedAt DateTime?\n  nextReviewAt   DateTime?\n  reviewCount    Int       @default(0)\n  lapseCount     Int       @default(0)\n\n  // Relations\n  course    Course             @relation(fields: [courseId], references: [id], onDelete: Cascade)\n  lecture   Lecture?           @relation(fields: [lectureId], references: [id], onDelete: SetNull)\n  objective LearningObjective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)\n  reviews   Review[]\n\n  @@index([courseId])\n  @@index([nextReviewAt])\n  @@map(\"cards\")\n}\n\nenum CardType {\n  BASIC\n  CLOZE\n  CLINICAL_REASONING\n}\n\nmodel Review {\n  id          String       @id @default(cuid())\n  userId      String\n  cardId      String\n  sessionId   String?\n  rating      ReviewRating\n  timeSpentMs Int\n  reviewedAt  DateTime     @default(now())\n\n  // FSRS data captured at review time\n  difficultyBefore Float\n  stabilityBefore  Float\n  difficultyAfter  Float\n  stabilityAfter   Float\n\n  // Relations\n  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)\n  card    Card          @relation(fields: [cardId], references: [id], onDelete: Cascade)\n  session StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)\n\n  @@index([userId])\n  @@index([cardId])\n  @@index([reviewedAt])\n  @@map(\"reviews\")\n}\n\nenum ReviewRating {\n  AGAIN // 1 - Complete lapse\n  HARD // 2 - Difficult recall\n  GOOD // 3 - Correct with effort\n  EASY // 4 - Perfect recall\n}\n\nmodel StudySession {\n  id          String    @id @default(cuid())\n  userId      String\n  missionId   String?\n  startedAt   DateTime  @default(now())\n  completedAt DateTime?\n  durationMs  Int?\n\n  // Session stats\n  reviewsCompleted Int @default(0)\n  newCardsStudied  Int @default(0)\n\n  // Session notes for reflection (AC #7)\n  sessionNotes String? @db.Text\n\n  // Mission integration fields (Story 2.5 Task 1)\n  currentObjectiveIndex Int   @default(0) // 0-based index of current objective in mission\n  missionObjectives     Json? // Snapshot of mission objectives at session start for state recovery\n  objectiveCompletions  Json? // Array of { objectiveId, completedAt, timeSpentMs, selfAssessment, confidenceRating, notes? }\n\n  // Relations\n  user                User                 @relation(fields: [userId], references: [id], onDelete: Cascade)\n  mission             Mission?             @relation(fields: [missionId], references: [id], onDelete: SetNull)\n  reviews             Review[]\n  validationResponses ValidationResponse[]\n\n  @@index([userId])\n  @@index([startedAt])\n  @@map(\"study_sessions\")\n}\n\n// ============================================\n// SUBSYSTEM 3: Knowledge Graph & Search\n// ============================================\n\nmodel Concept {\n  id          String                       @id @default(cuid())\n  name        String                       @unique\n  description String?                      @db.Text\n  category    String? // \"anatomy\", \"physiology\", \"pathology\"\n  embedding   Unsupported(\"vector(1536)\")? // gemini-embedding-001 (output_dimensionality: 1536)\n  createdAt   DateTime                     @default(now())\n\n  // Relations\n  relatedFrom ConceptRelationship[] @relation(\"ConceptFrom\")\n  relatedTo   ConceptRelationship[] @relation(\"ConceptTo\")\n\n  @@index([category])\n  @@map(\"concepts\")\n}\n\nmodel ConceptRelationship {\n  id            String           @id @default(cuid())\n  fromConceptId String\n  toConceptId   String\n  relationship  RelationshipType\n  strength      Float            @default(1.0) // 0.0 to 1.0\n  createdAt     DateTime         @default(now())\n\n  // Relations\n  fromConcept Concept @relation(\"ConceptFrom\", fields: [fromConceptId], references: [id], onDelete: Cascade)\n  toConcept   Concept @relation(\"ConceptTo\", fields: [toConceptId], references: [id], onDelete: Cascade)\n\n  @@unique([fromConceptId, toConceptId, relationship])\n  @@index([fromConceptId])\n  @@index([toConceptId])\n  @@map(\"concept_relationships\")\n}\n\nenum RelationshipType {\n  PREREQUISITE // fromConcept is prerequisite for toConcept\n  RELATED // General association\n  INTEGRATED // Cross-course integration\n  CLINICAL // Clinical application\n}\n\n// ============================================\n// SUBSYSTEM 4: Understanding Validation\n// ============================================\n\nmodel ValidationPrompt {\n  id               String     @id @default(cuid())\n  promptText       String     @db.Text\n  promptType       PromptType\n  conceptName      String\n  expectedCriteria String[] // Key points expected in answer\n  createdAt        DateTime   @default(now())\n\n  // Relations\n  responses ValidationResponse[]\n\n  @@map(\"validation_prompts\")\n}\n\nenum PromptType {\n  EXPLAIN_TO_PATIENT\n  CLINICAL_REASONING\n  CONTROLLED_FAILURE\n}\n\nmodel ValidationResponse {\n  id           String   @id @default(cuid())\n  promptId     String\n  sessionId    String?\n  userAnswer   String   @db.Text\n  aiEvaluation String   @db.Text\n  score        Float // 0.0 to 1.0\n  confidence   Float? // User's self-reported confidence\n  respondedAt  DateTime @default(now())\n\n  // Relations\n  prompt  ValidationPrompt @relation(fields: [promptId], references: [id], onDelete: Cascade)\n  session StudySession?    @relation(fields: [sessionId], references: [id], onDelete: SetNull)\n\n  @@index([promptId])\n  @@index([respondedAt])\n  @@map(\"validation_responses\")\n}\n\nmodel ComprehensionMetric {\n  id          String   @id @default(cuid())\n  conceptName String\n  date        DateTime @default(now())\n  avgScore    Float // Average validation score for this concept\n  sampleSize  Int // Number of validations\n  trend       String? // \"improving\", \"stable\", \"declining\"\n\n  @@unique([conceptName, date])\n  @@index([conceptName])\n  @@map(\"comprehension_metrics\")\n}\n\n// ============================================\n// SUBSYSTEM 5: Behavioral Analytics\n// ============================================\n\nmodel BehavioralEvent {\n  id        String    @id @default(cuid())\n  userId    String // Not FK to allow analytics without user cascade\n  eventType EventType\n  eventData Json // Flexible JSON for event-specific data\n  timestamp DateTime  @default(now())\n\n  // Story 5.1: Session-level metrics for pattern analysis\n  sessionPerformanceScore Int? // 0-100, calculated from reviews + validation\n  engagementLevel         EngagementLevel?\n  completionQuality       CompletionQuality?\n  timeOfDay               Int? // Hour 0-23\n  dayOfWeek               Int? // 0=Sunday, 6=Saturday\n  contentType             String? // \"lecture\", \"flashcard\", \"validation\", \"clinical_reasoning\"\n  difficultyLevel         String? // \"easy\", \"medium\", \"hard\"\n\n  @@index([userId])\n  @@index([eventType])\n  @@index([timestamp])\n  @@map(\"behavioral_events\")\n}\n\nenum EventType {\n  MISSION_STARTED\n  MISSION_COMPLETED\n  CARD_REVIEWED\n  VALIDATION_COMPLETED\n  SESSION_STARTED\n  SESSION_ENDED\n  LECTURE_UPLOADED\n  SEARCH_PERFORMED\n  GRAPH_VIEWED\n}\n\nenum EngagementLevel {\n  LOW // <60 score, frequent pauses\n  MEDIUM // 60-80 score, normal engagement\n  HIGH // >80 score, flow state indicators\n}\n\nenum CompletionQuality {\n  RUSHED // Completed too quickly, low performance\n  NORMAL // Expected pace and performance\n  THOROUGH // Slow and deliberate, high performance\n}\n\n// Story 5.1: Behavioral Pattern Recognition Models\n\nmodel BehavioralPattern {\n  id              String                @id @default(cuid())\n  userId          String\n  patternType     BehavioralPatternType\n  patternName     String // Human-readable: \"Morning peak performance\"\n  confidence      Float // 0.0-1.0, statistical confidence\n  evidence        Json // Supporting data: timestamps, metrics, session IDs\n  detectedAt      DateTime              @default(now())\n  lastSeenAt      DateTime              @default(now())\n  occurrenceCount Int                   @default(1)\n\n  // Relations\n  insights InsightPattern[]\n\n  @@index([userId])\n  @@index([patternType])\n  @@index([confidence])\n  @@map(\"behavioral_patterns\")\n}\n\nenum BehavioralPatternType {\n  OPTIMAL_STUDY_TIME // Best time-of-day for studying\n  SESSION_DURATION_PREFERENCE // Preferred session length\n  CONTENT_TYPE_PREFERENCE // Visual vs. text vs. clinical scenarios\n  PERFORMANCE_PEAK // Multi-hour high-performance windows\n  ATTENTION_CYCLE // Within-session fatigue patterns\n  FORGETTING_CURVE // Personal retention decay rate\n}\n\nmodel BehavioralInsight {\n  id                       String      @id @default(cuid())\n  userId                   String\n  insightType              InsightType\n  title                    String // \"Study during your peak hours\"\n  description              String      @db.Text // Detailed explanation\n  actionableRecommendation String      @db.Text // Specific action\n  confidence               Float // 0.0-1.0\n  createdAt                DateTime    @default(now())\n  acknowledgedAt           DateTime?\n  applied                  Boolean     @default(false)\n\n  // Relations\n  patterns InsightPattern[]\n\n  @@index([userId])\n  @@index([createdAt])\n  @@index([acknowledgedAt])\n  @@map(\"behavioral_insights\")\n}\n\n// Join table for many-to-many relationship between BehavioralInsight and BehavioralPattern\nmodel InsightPattern {\n  id        String @id @default(cuid())\n  insightId String\n  patternId String\n\n  insight BehavioralInsight @relation(fields: [insightId], references: [id], onDelete: Cascade)\n  pattern BehavioralPattern @relation(fields: [patternId], references: [id], onDelete: Cascade)\n\n  @@unique([insightId, patternId])\n  @@index([insightId])\n  @@index([patternId])\n  @@map(\"insight_patterns\")\n}\n\nenum InsightType {\n  STUDY_TIME_OPTIMIZATION // When to study\n  SESSION_LENGTH_ADJUSTMENT // How long to study\n  CONTENT_PREFERENCE // What content types to prioritize\n  RETENTION_STRATEGY // How to improve retention\n}\n\nmodel UserLearningProfile {\n  id                          String   @id @default(cuid())\n  userId                      String   @unique\n  preferredStudyTimes         Json // Array of { dayOfWeek, startHour, endHour }\n  averageSessionDuration      Int // Minutes\n  optimalSessionDuration      Int // Minutes (recommended)\n  contentPreferences          Json // { lectures: 0.4, flashcards: 0.3, validation: 0.2, clinicalReasoning: 0.1 }\n  learningStyleProfile        Json // VARK: { visual: 0.3, auditory: 0.2, kinesthetic: 0.4, reading: 0.1 }\n  personalizedForgettingCurve Json // { R0: 0.9, k: 0.15, halfLife: 4.6 }\n  lastAnalyzedAt              DateTime @default(now())\n  dataQualityScore            Float    @default(0.0) // 0.0-1.0, based on data sufficiency\n\n  @@index([userId])\n  @@map(\"user_learning_profiles\")\n}\n\n// Legacy LearningPattern model (kept for backwards compatibility)\nmodel LearningPattern {\n  id          String      @id @default(cuid())\n  userId      String\n  patternType PatternType\n  patternData Json // Flexible storage for pattern details\n  confidence  Float // 0.0 to 1.0 confidence in pattern\n  detectedAt  DateTime    @default(now())\n  lastSeenAt  DateTime    @default(now())\n\n  @@index([userId])\n  @@index([patternType])\n  @@map(\"learning_patterns\")\n}\n\nenum PatternType {\n  OPTIMAL_STUDY_TIME // \"Best performance at 7-9 AM\"\n  STRUGGLE_TOPIC // \"Low retention on physiology\"\n  CONTENT_PREFERENCE // \"Prefers visual diagrams\"\n  SESSION_LENGTH // \"Optimal 45-minute sessions\"\n  DAY_OF_WEEK_PATTERN // \"Struggles on Mondays\"\n}\n\nmodel PerformancePrediction {\n  id             String   @id @default(cuid())\n  userId         String\n  predictedFor   DateTime // Date/time this prediction is for\n  predictionType String // \"struggle_likelihood\", \"optimal_study_time\"\n  prediction     Json // Prediction details\n  confidence     Float // Model confidence\n  createdAt      DateTime @default(now())\n\n  @@index([userId])\n  @@index([predictedFor])\n  @@map(\"performance_predictions\")\n}\n\n// Story 5.2: Predictive Analytics for Learning Struggles\n\nmodel StrugglePrediction {\n  id                           String           @id @default(cuid())\n  userId                       String\n  learningObjectiveId          String?\n  topicId                      String? // Topic or subject area\n  predictionDate               DateTime         @default(now())\n  predictedStruggleProbability Float // 0.0-1.0\n  predictionConfidence         Float // 0.0-1.0, based on data quality\n  predictionStatus             PredictionStatus @default(PENDING)\n  actualOutcome                Boolean? // Did user actually struggle?\n  outcomeRecordedAt            DateTime?\n  featureVector                Json // Features used for prediction\n\n  // Relations\n  learningObjective LearningObjective?           @relation(fields: [learningObjectiveId], references: [id], onDelete: SetNull)\n  indicators        StruggleIndicator[]\n  interventions     InterventionRecommendation[]\n  feedbacks         PredictionFeedback[]\n\n  @@index([userId])\n  @@index([predictionDate])\n  @@index([predictionStatus])\n  @@index([predictedStruggleProbability])\n  @@map(\"struggle_predictions\")\n}\n\nenum PredictionStatus {\n  PENDING // Not yet studied\n  CONFIRMED // User did struggle (true positive)\n  FALSE_POSITIVE // User didn't struggle (false positive)\n  MISSED // User struggled but not predicted (false negative, recorded retroactively)\n}\n\nmodel StruggleIndicator {\n  id                  String        @id @default(cuid())\n  userId              String\n  predictionId        String?\n  learningObjectiveId String\n  indicatorType       IndicatorType\n  severity            Severity      @default(MEDIUM)\n  detectedAt          DateTime      @default(now())\n  context             Json // Additional metadata\n\n  // Relations\n  prediction        StrugglePrediction? @relation(fields: [predictionId], references: [id], onDelete: SetNull)\n  learningObjective LearningObjective   @relation(fields: [learningObjectiveId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([indicatorType])\n  @@index([severity])\n  @@map(\"struggle_indicators\")\n}\n\nenum IndicatorType {\n  LOW_RETENTION // Retention score below threshold\n  PREREQUISITE_GAP // Missing prerequisite knowledge\n  COMPLEXITY_MISMATCH // Content too difficult for current level\n  COGNITIVE_OVERLOAD // User showing fatigue/stress signals\n  HISTORICAL_STRUGGLE_PATTERN // Past struggles in similar topics\n  TOPIC_SIMILARITY_STRUGGLE // Struggled with semantically similar topics\n}\n\nenum Severity {\n  LOW\n  MEDIUM\n  HIGH\n}\n\nmodel InterventionRecommendation {\n  id                 String             @id @default(cuid())\n  predictionId       String\n  userId             String\n  interventionType   InterventionType\n  description        String             @db.Text\n  reasoning          String             @db.Text // Why this intervention\n  priority           Int                @default(5) // 1-10\n  status             InterventionStatus @default(PENDING)\n  appliedAt          DateTime?\n  appliedToMissionId String?\n  effectiveness      Float? // 0.0-1.0, measured post-intervention\n  createdAt          DateTime           @default(now())\n\n  // Relations\n  prediction StrugglePrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)\n  mission    Mission?           @relation(fields: [appliedToMissionId], references: [id], onDelete: SetNull)\n\n  @@index([userId])\n  @@index([status])\n  @@index([priority])\n  @@map(\"intervention_recommendations\")\n}\n\nenum InterventionType {\n  PREREQUISITE_REVIEW // Review prerequisite objectives\n  DIFFICULTY_PROGRESSION // Start with easier content\n  CONTENT_FORMAT_ADAPT // Alternative content format\n  COGNITIVE_LOAD_REDUCE // Reduce session complexity\n  SPACED_REPETITION_BOOST // Increase review frequency\n  BREAK_SCHEDULE_ADJUST // More frequent breaks\n}\n\nenum InterventionStatus {\n  PENDING // Not yet applied\n  APPLIED // Applied to mission\n  COMPLETED // User completed intervention\n  DISMISSED // User dismissed recommendation\n}\n\nmodel PredictionFeedback {\n  id             String       @id @default(cuid())\n  predictionId   String\n  userId         String\n  feedbackType   FeedbackType\n  actualStruggle Boolean // User's assessment\n  helpfulness    Int? // 1-5 stars (for intervention feedback)\n  comments       String?      @db.Text\n  submittedAt    DateTime     @default(now())\n\n  // Relations\n  prediction StrugglePrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([feedbackType])\n  @@map(\"prediction_feedbacks\")\n}\n\nenum FeedbackType {\n  HELPFUL // Prediction was helpful\n  NOT_HELPFUL // Prediction wasn't helpful\n  INACCURATE // Prediction was wrong\n  INTERVENTION_GOOD // Intervention worked well\n  INTERVENTION_BAD // Intervention didn't help\n}\n\n// Story 2.2: Performance tracking time-series data\nmodel PerformanceMetric {\n  id                  String   @id @default(cuid())\n  userId              String\n  learningObjectiveId String\n  date                DateTime @default(now())\n  retentionScore      Float // 0.0-1.0 from FSRS\n  studyTimeMs         Int // Time spent on this objective today\n  reviewCount         Int // Number of reviews today\n  correctReviews      Int\n  incorrectReviews    Int\n  createdAt           DateTime @default(now())\n\n  // Relations\n  learningObjective LearningObjective @relation(fields: [learningObjectiveId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, learningObjectiveId, date])\n  @@index([userId, date])\n  @@index([learningObjectiveId])\n  @@map(\"performance_metrics\")\n}\n\n// Story 2.3: Intelligent Content Prioritization Algorithm\nmodel Exam {\n  id             String   @id @default(cuid())\n  userId         String\n  name           String // \"Histology Midterm\"\n  date           DateTime\n  courseId       String\n  coverageTopics String[] // Tags/topics this exam covers\n  createdAt      DateTime @default(now())\n  updatedAt      DateTime @updatedAt\n\n  // Relations\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)\n\n  @@index([userId, date])\n  @@index([courseId])\n  @@map(\"exams\")\n}\n\nmodel CoursePriority {\n  id            String        @id @default(cuid())\n  userId        String\n  courseId      String\n  priorityLevel PriorityLevel @default(MEDIUM)\n  createdAt     DateTime      @default(now())\n  updatedAt     DateTime      @updatedAt\n\n  // Relations\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, courseId])\n  @@map(\"course_priorities\")\n}\n\nenum PriorityLevel {\n  LOW\n  MEDIUM\n  HIGH\n  CRITICAL\n}\n\nmodel PriorityFeedback {\n  id                String         @id @default(cuid())\n  userId            String\n  objectiveId       String\n  suggestedPriority Float // What algorithm suggested\n  userFeedback      FeedbackRating\n  notes             String?        @db.Text\n  createdAt         DateTime       @default(now())\n\n  // Relations\n  learningObjective LearningObjective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([objectiveId])\n  @@map(\"priority_feedback\")\n}\n\nenum FeedbackRating {\n  TOO_HIGH\n  JUST_RIGHT\n  TOO_LOW\n}\n\n// ============================================\n// SUBSYSTEM 6: Gamification\n// ============================================\n\nmodel Streak {\n  id               String    @id @default(cuid())\n  userId           String    @unique\n  currentStreak    Int       @default(0) // Consecutive days with study activity\n  longestStreak    Int       @default(0) // Personal best streak\n  lastStudyDate    DateTime?\n  freezesRemaining Int       @default(2) // Streak protection tokens\n  freezeUsedDates  String[] // ISO date strings of freeze usage\n  createdAt        DateTime  @default(now())\n  updatedAt        DateTime  @updatedAt\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map(\"streaks\")\n}\n\nmodel Achievement {\n  id          String          @id @default(cuid())\n  userId      String\n  type        AchievementType\n  name        String // \"7-Day Warrior\", \"First Objective\"\n  description String          @db.Text\n  tier        AchievementTier @default(BRONZE)\n  earnedAt    DateTime        @default(now())\n  metadata    Json? // Additional achievement data (e.g., { \"streakDays\": 7 })\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([type])\n  @@map(\"achievements\")\n}\n\nenum AchievementType {\n  STREAK_MILESTONE // 7, 30, 100 day streaks\n  OBJECTIVES_COMPLETED // 10, 50, 100 objectives\n  CARDS_MASTERED // Cards reaching MASTERED state\n  PERFECT_SESSION // Session with 100% accuracy\n  EARLY_BIRD // Study before 8 AM\n  NIGHT_OWL // Study after 10 PM\n}\n\nenum AchievementTier {\n  BRONZE\n  SILVER\n  GOLD\n  PLATINUM\n}\n\nmodel StudyGoal {\n  id              String     @id @default(cuid())\n  userId          String\n  goalType        GoalType\n  targetValue     Int // Minutes or objectives count\n  currentProgress Int        @default(0)\n  period          GoalPeriod\n  startDate       DateTime\n  endDate         DateTime\n  isCompleted     Boolean    @default(false)\n  completedAt     DateTime?\n  createdAt       DateTime   @default(now())\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([period, startDate])\n  @@map(\"study_goals\")\n}\n\nenum GoalType {\n  TIME_BASED // Minutes studied\n  OBJECTIVE_BASED // Objectives completed\n  REVIEW_BASED // Cards reviewed\n}\n\nenum GoalPeriod {\n  DAILY\n  WEEKLY\n  MONTHLY\n}\n\n// ============================================\n// Story 2.6: Mission Performance Analytics\n// ============================================\n\nmodel MissionAnalytics {\n  id     String          @id @default(cuid())\n  userId String\n  date   DateTime        @default(now())\n  period AnalyticsPeriod // DAILY, WEEKLY, MONTHLY\n\n  missionsGenerated   Int\n  missionsCompleted   Int\n  missionsSkipped     Int\n  avgCompletionRate   Float // 0.0-1.0\n  avgTimeAccuracy     Float // 1.0 - abs(actual-estimated)/estimated\n  avgDifficultyRating Float // User feedback 1-5\n  avgSuccessScore     Float // Composite mission success metric\n\n  createdAt DateTime @default(now())\n\n  @@unique([userId, date, period])\n  @@index([userId, date])\n  @@map(\"mission_analytics\")\n}\n\nenum AnalyticsPeriod {\n  DAILY\n  WEEKLY\n  MONTHLY\n}\n\nmodel MissionFeedback {\n  id        String @id @default(cuid())\n  userId    String\n  missionId String\n\n  helpfulnessRating      Int // 1-5: Did this mission help you learn?\n  relevanceScore         Int // 1-5: Were objectives relevant to your goals?\n  paceRating             PaceRating\n  improvementSuggestions String?    @db.Text\n\n  submittedAt DateTime @default(now())\n\n  // Relations\n  mission Mission @relation(fields: [missionId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([missionId])\n  @@map(\"mission_feedback\")\n}\n\nenum PaceRating {\n  TOO_SLOW\n  JUST_RIGHT\n  TOO_FAST\n}\n\nmodel MissionStreak {\n  id                String    @id @default(cuid())\n  userId            String    @unique\n  currentStreak     Int       @default(0)\n  longestStreak     Int       @default(0)\n  lastCompletedDate DateTime?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@map(\"mission_streaks\")\n}\n\nmodel MissionReview {\n  id        String       @id @default(cuid())\n  userId    String\n  period    ReviewPeriod // WEEK, MONTH\n  startDate DateTime\n  endDate   DateTime\n\n  summary         Json // { missionsCompleted, totalTime, avgSuccessScore }\n  highlights      Json // { longestStreak, bestPerformance, topObjectives[] }\n  insights        Json // { patterns[], correlations[], improvements[] }\n  recommendations Json // { actionItems[], adjustments[] }\n\n  generatedAt DateTime @default(now())\n\n  // Relations\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, period, startDate])\n  @@index([userId, generatedAt])\n  @@map(\"mission_reviews\")\n}\n\nenum ReviewPeriod {\n  WEEK\n  MONTH\n}\n",
  "inlineSchemaHash": "df73c2333e0c00c401e3ef8dcabc52525444ff8bd726a3f9616a9cc6f2a56a9b",
  "copyEngine": true
}

const fs = require('fs')

config.dirname = __dirname
if (!fs.existsSync(path.join(__dirname, 'schema.prisma'))) {
  const alternativePaths = [
    "src/generated/prisma",
    "generated/prisma",
  ]
  
  const alternativePath = alternativePaths.find((altPath) => {
    return fs.existsSync(path.join(process.cwd(), altPath, 'schema.prisma'))
  }) ?? alternativePaths[0]

  config.dirname = path.join(process.cwd(), alternativePath)
  config.isBundled = true
}

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"dbName\":\"users\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"email\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"defaultMissionMinutes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":50,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionDifficulty\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":\"AUTO\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"preferredStudyTime\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"autoGenerateMissions\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"performanceTrackingEnabled\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"includeInAnalytics\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastMissionAdaptation\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"behavioralAnalysisEnabled\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningStyleProfilingEnabled\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"shareAnonymizedPatterns\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"courses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Course\",\"relationName\":\"CourseToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lectures\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Lecture\",\"relationName\":\"LectureToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"studySessions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StudySession\",\"relationName\":\"StudySessionToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Mission\",\"relationName\":\"MissionToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviews\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Review\",\"relationName\":\"ReviewToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exams\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Exam\",\"relationName\":\"ExamToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"coursePriorities\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CoursePriority\",\"relationName\":\"CoursePriorityToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"streak\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Streak\",\"relationName\":\"StreakToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"achievements\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Achievement\",\"relationName\":\"AchievementToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"studyGoals\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StudyGoal\",\"relationName\":\"StudyGoalToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionStreak\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"MissionStreak\",\"relationName\":\"MissionStreakToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionReviews\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"MissionReview\",\"relationName\":\"MissionReviewToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Course\":{\"dbName\":\"courses\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"term\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"color\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"CourseToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lectures\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Lecture\",\"relationName\":\"CourseToLecture\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cards\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Card\",\"relationName\":\"CardToCourse\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exams\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Exam\",\"relationName\":\"CourseToExam\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"coursePriorities\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CoursePriority\",\"relationName\":\"CourseToCoursePriority\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Lecture\":{\"dbName\":\"lectures\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"courseId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"title\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fileName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fileUrl\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fileSize\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"processingStatus\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ProcessingStatus\",\"default\":\"PENDING\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"uploadedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"processedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"processingProgress\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalPages\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"processedPages\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"processingStartedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"estimatedCompletionAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"weekNumber\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"topicTags\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"LectureToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Course\",\"relationName\":\"CourseToLecture\",\"relationFromFields\":[\"courseId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contentChunks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContentChunk\",\"relationName\":\"ContentChunkToLecture\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjectives\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"LearningObjectiveToLecture\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cards\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Card\",\"relationName\":\"CardToLecture\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ContentChunk\":{\"dbName\":\"content_chunks\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lectureId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"content\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"chunkIndex\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pageNumber\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lecture\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Lecture\",\"relationName\":\"ContentChunkToLecture\",\"relationFromFields\":[\"lectureId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"LearningObjective\":{\"dbName\":\"learning_objectives\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lectureId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objective\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"complexity\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ObjectiveComplexity\",\"default\":\"INTERMEDIATE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pageStart\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pageEnd\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isHighYield\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"boardExamTags\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"extractedBy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":\"gpt-5\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"masteryLevel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"MasteryLevel\",\"default\":\"NOT_STARTED\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalStudyTimeMs\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastStudiedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"weaknessScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":0.5,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lecture\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Lecture\",\"relationName\":\"LearningObjectiveToLecture\",\"relationFromFields\":[\"lectureId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cards\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Card\",\"relationName\":\"CardToLearningObjective\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prerequisites\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ObjectivePrerequisite\",\"relationName\":\"Objective\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dependents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ObjectivePrerequisite\",\"relationName\":\"Prerequisite\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"performanceMetrics\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PerformanceMetric\",\"relationName\":\"LearningObjectiveToPerformanceMetric\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"priorityFeedback\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PriorityFeedback\",\"relationName\":\"LearningObjectiveToPriorityFeedback\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"strugglePredictions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StrugglePrediction\",\"relationName\":\"LearningObjectiveToStrugglePrediction\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"struggleIndicators\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StruggleIndicator\",\"relationName\":\"LearningObjectiveToStruggleIndicator\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ObjectivePrerequisite\":{\"dbName\":\"objective_prerequisites\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objectiveId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prerequisiteId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"strength\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objective\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"Objective\",\"relationFromFields\":[\"objectiveId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prerequisite\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"Prerequisite\",\"relationFromFields\":[\"prerequisiteId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"objectiveId\",\"prerequisiteId\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"objectiveId\",\"prerequisiteId\"]}],\"isGenerated\":false},\"Mission\":{\"dbName\":\"missions\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"MissionStatus\",\"default\":\"PENDING\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"estimatedMinutes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actualMinutes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedObjectivesCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objectives\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviewCardCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newContentCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"successScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"difficultyRating\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"MissionToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"studySessions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StudySession\",\"relationName\":\"MissionToStudySession\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"feedback\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"MissionFeedback\",\"relationName\":\"MissionToMissionFeedback\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"interventions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InterventionRecommendation\",\"relationName\":\"InterventionRecommendationToMission\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Card\":{\"dbName\":\"cards\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"courseId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lectureId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objectiveId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"front\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"back\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cardType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"CardType\",\"default\":\"BASIC\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"difficulty\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"stability\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"retrievability\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastReviewedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextReviewAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviewCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lapseCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Course\",\"relationName\":\"CardToCourse\",\"relationFromFields\":[\"courseId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lecture\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Lecture\",\"relationName\":\"CardToLecture\",\"relationFromFields\":[\"lectureId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objective\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"CardToLearningObjective\",\"relationFromFields\":[\"objectiveId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviews\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Review\",\"relationName\":\"CardToReview\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Review\":{\"dbName\":\"reviews\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cardId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sessionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"rating\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReviewRating\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timeSpentMs\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviewedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"difficultyBefore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"stabilityBefore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"difficultyAfter\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"stabilityAfter\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"ReviewToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"card\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Card\",\"relationName\":\"CardToReview\",\"relationFromFields\":[\"cardId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"session\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StudySession\",\"relationName\":\"ReviewToStudySession\",\"relationFromFields\":[\"sessionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"StudySession\":{\"dbName\":\"study_sessions\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"durationMs\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviewsCompleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newCardsStudied\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sessionNotes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currentObjectiveIndex\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionObjectives\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objectiveCompletions\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"StudySessionToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"mission\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Mission\",\"relationName\":\"MissionToStudySession\",\"relationFromFields\":[\"missionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviews\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Review\",\"relationName\":\"ReviewToStudySession\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"validationResponses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ValidationResponse\",\"relationName\":\"StudySessionToValidationResponse\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Concept\":{\"dbName\":\"concepts\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"category\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"relatedFrom\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ConceptRelationship\",\"relationName\":\"ConceptFrom\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"relatedTo\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ConceptRelationship\",\"relationName\":\"ConceptTo\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ConceptRelationship\":{\"dbName\":\"concept_relationships\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fromConceptId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"toConceptId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"relationship\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"RelationshipType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"strength\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fromConcept\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Concept\",\"relationName\":\"ConceptFrom\",\"relationFromFields\":[\"fromConceptId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"toConcept\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Concept\",\"relationName\":\"ConceptTo\",\"relationFromFields\":[\"toConceptId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"fromConceptId\",\"toConceptId\",\"relationship\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"fromConceptId\",\"toConceptId\",\"relationship\"]}],\"isGenerated\":false},\"ValidationPrompt\":{\"dbName\":\"validation_prompts\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"promptText\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"promptType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PromptType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"conceptName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"expectedCriteria\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"responses\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ValidationResponse\",\"relationName\":\"ValidationPromptToValidationResponse\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ValidationResponse\":{\"dbName\":\"validation_responses\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"promptId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sessionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userAnswer\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"aiEvaluation\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"score\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"confidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"respondedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prompt\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ValidationPrompt\",\"relationName\":\"ValidationPromptToValidationResponse\",\"relationFromFields\":[\"promptId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"session\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StudySession\",\"relationName\":\"StudySessionToValidationResponse\",\"relationFromFields\":[\"sessionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ComprehensionMetric\":{\"dbName\":\"comprehension_metrics\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"conceptName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avgScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sampleSize\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"trend\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"conceptName\",\"date\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"conceptName\",\"date\"]}],\"isGenerated\":false},\"BehavioralEvent\":{\"dbName\":\"behavioral_events\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"EventType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventData\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sessionPerformanceScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"engagementLevel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"EngagementLevel\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completionQuality\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CompletionQuality\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timeOfDay\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dayOfWeek\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contentType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"difficultyLevel\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"BehavioralPattern\":{\"dbName\":\"behavioral_patterns\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"patternType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"BehavioralPatternType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"patternName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"confidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"evidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"detectedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastSeenAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"occurrenceCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"insights\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InsightPattern\",\"relationName\":\"BehavioralPatternToInsightPattern\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"BehavioralInsight\":{\"dbName\":\"behavioral_insights\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"insightType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InsightType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"title\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actionableRecommendation\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"confidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acknowledgedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"applied\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"patterns\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InsightPattern\",\"relationName\":\"BehavioralInsightToInsightPattern\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"InsightPattern\":{\"dbName\":\"insight_patterns\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"insightId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"patternId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"insight\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"BehavioralInsight\",\"relationName\":\"BehavioralInsightToInsightPattern\",\"relationFromFields\":[\"insightId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pattern\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"BehavioralPattern\",\"relationName\":\"BehavioralPatternToInsightPattern\",\"relationFromFields\":[\"patternId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"insightId\",\"patternId\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"insightId\",\"patternId\"]}],\"isGenerated\":false},\"UserLearningProfile\":{\"dbName\":\"user_learning_profiles\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"preferredStudyTimes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"averageSessionDuration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"optimalSessionDuration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contentPreferences\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningStyleProfile\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"personalizedForgettingCurve\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastAnalyzedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dataQualityScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"LearningPattern\":{\"dbName\":\"learning_patterns\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"patternType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PatternType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"patternData\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"confidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"detectedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastSeenAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PerformancePrediction\":{\"dbName\":\"performance_predictions\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictedFor\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prediction\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"confidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"StrugglePrediction\":{\"dbName\":\"struggle_predictions\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjectiveId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"topicId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictedStruggleProbability\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionConfidence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionStatus\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"PredictionStatus\",\"default\":\"PENDING\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actualOutcome\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"outcomeRecordedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"featureVector\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjective\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"LearningObjectiveToStrugglePrediction\",\"relationFromFields\":[\"learningObjectiveId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"indicators\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StruggleIndicator\",\"relationName\":\"StruggleIndicatorToStrugglePrediction\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"interventions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InterventionRecommendation\",\"relationName\":\"InterventionRecommendationToStrugglePrediction\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"feedbacks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PredictionFeedback\",\"relationName\":\"PredictionFeedbackToStrugglePrediction\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"StruggleIndicator\":{\"dbName\":\"struggle_indicators\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjectiveId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"indicatorType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"IndicatorType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"severity\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Severity\",\"default\":\"MEDIUM\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"detectedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"context\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prediction\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StrugglePrediction\",\"relationName\":\"StruggleIndicatorToStrugglePrediction\",\"relationFromFields\":[\"predictionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjective\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"LearningObjectiveToStruggleIndicator\",\"relationFromFields\":[\"learningObjectiveId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"InterventionRecommendation\":{\"dbName\":\"intervention_recommendations\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"interventionType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InterventionType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reasoning\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"priority\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":5,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"InterventionStatus\",\"default\":\"PENDING\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"appliedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"appliedToMissionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"effectiveness\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prediction\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StrugglePrediction\",\"relationName\":\"InterventionRecommendationToStrugglePrediction\",\"relationFromFields\":[\"predictionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"mission\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Mission\",\"relationName\":\"InterventionRecommendationToMission\",\"relationFromFields\":[\"appliedToMissionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PredictionFeedback\":{\"dbName\":\"prediction_feedbacks\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"predictionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"feedbackType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FeedbackType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actualStruggle\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"helpfulness\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"comments\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"submittedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"prediction\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"StrugglePrediction\",\"relationName\":\"PredictionFeedbackToStrugglePrediction\",\"relationFromFields\":[\"predictionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PerformanceMetric\":{\"dbName\":\"performance_metrics\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjectiveId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"retentionScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"studyTimeMs\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reviewCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"correctReviews\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"incorrectReviews\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjective\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"LearningObjectiveToPerformanceMetric\",\"relationFromFields\":[\"learningObjectiveId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"userId\",\"learningObjectiveId\",\"date\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"userId\",\"learningObjectiveId\",\"date\"]}],\"isGenerated\":false},\"Exam\":{\"dbName\":\"exams\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"courseId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"coverageTopics\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"ExamToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Course\",\"relationName\":\"CourseToExam\",\"relationFromFields\":[\"courseId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"CoursePriority\":{\"dbName\":\"course_priorities\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"courseId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"priorityLevel\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"PriorityLevel\",\"default\":\"MEDIUM\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"CoursePriorityToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"course\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Course\",\"relationName\":\"CourseToCoursePriority\",\"relationFromFields\":[\"courseId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"userId\",\"courseId\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"userId\",\"courseId\"]}],\"isGenerated\":false},\"PriorityFeedback\":{\"dbName\":\"priority_feedback\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"objectiveId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"suggestedPriority\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userFeedback\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FeedbackRating\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"notes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"learningObjective\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LearningObjective\",\"relationName\":\"LearningObjectiveToPriorityFeedback\",\"relationFromFields\":[\"objectiveId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Streak\":{\"dbName\":\"streaks\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currentStreak\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"longestStreak\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastStudyDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"freezesRemaining\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":2,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"freezeUsedDates\",\"kind\":\"scalar\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"StreakToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Achievement\":{\"dbName\":\"achievements\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AchievementType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tier\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"AchievementTier\",\"default\":\"BRONZE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"earnedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"metadata\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"AchievementToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"StudyGoal\":{\"dbName\":\"study_goals\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"goalType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"GoalType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"targetValue\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currentProgress\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"period\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"GoalPeriod\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"endDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isCompleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"StudyGoalToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"MissionAnalytics\":{\"dbName\":\"mission_analytics\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"period\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AnalyticsPeriod\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionsGenerated\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionsCompleted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionsSkipped\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avgCompletionRate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avgTimeAccuracy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avgDifficultyRating\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avgSuccessScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"userId\",\"date\",\"period\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"userId\",\"date\",\"period\"]}],\"isGenerated\":false},\"MissionFeedback\":{\"dbName\":\"mission_feedback\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"missionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"helpfulnessRating\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"relevanceScore\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paceRating\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaceRating\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"improvementSuggestions\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"submittedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"mission\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Mission\",\"relationName\":\"MissionToMissionFeedback\",\"relationFromFields\":[\"missionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"MissionStreak\":{\"dbName\":\"mission_streaks\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currentStreak\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"longestStreak\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastCompletedDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"MissionStreakToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"MissionReview\":{\"dbName\":\"mission_reviews\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"cuid\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"period\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReviewPeriod\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"endDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"summary\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"highlights\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"insights\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"recommendations\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"generatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"MissionReviewToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"userId\",\"period\",\"startDate\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"userId\",\"period\",\"startDate\"]}],\"isGenerated\":false}},\"enums\":{\"ProcessingStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"PROCESSING\",\"dbName\":null},{\"name\":\"COMPLETED\",\"dbName\":null},{\"name\":\"FAILED\",\"dbName\":null}],\"dbName\":null},\"ObjectiveComplexity\":{\"values\":[{\"name\":\"BASIC\",\"dbName\":null},{\"name\":\"INTERMEDIATE\",\"dbName\":null},{\"name\":\"ADVANCED\",\"dbName\":null}],\"dbName\":null},\"MasteryLevel\":{\"values\":[{\"name\":\"NOT_STARTED\",\"dbName\":null},{\"name\":\"BEGINNER\",\"dbName\":null},{\"name\":\"INTERMEDIATE\",\"dbName\":null},{\"name\":\"ADVANCED\",\"dbName\":null},{\"name\":\"MASTERED\",\"dbName\":null}],\"dbName\":null},\"MissionStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"IN_PROGRESS\",\"dbName\":null},{\"name\":\"COMPLETED\",\"dbName\":null},{\"name\":\"SKIPPED\",\"dbName\":null}],\"dbName\":null},\"CardType\":{\"values\":[{\"name\":\"BASIC\",\"dbName\":null},{\"name\":\"CLOZE\",\"dbName\":null},{\"name\":\"CLINICAL_REASONING\",\"dbName\":null}],\"dbName\":null},\"ReviewRating\":{\"values\":[{\"name\":\"AGAIN\",\"dbName\":null},{\"name\":\"HARD\",\"dbName\":null},{\"name\":\"GOOD\",\"dbName\":null},{\"name\":\"EASY\",\"dbName\":null}],\"dbName\":null},\"RelationshipType\":{\"values\":[{\"name\":\"PREREQUISITE\",\"dbName\":null},{\"name\":\"RELATED\",\"dbName\":null},{\"name\":\"INTEGRATED\",\"dbName\":null},{\"name\":\"CLINICAL\",\"dbName\":null}],\"dbName\":null},\"PromptType\":{\"values\":[{\"name\":\"EXPLAIN_TO_PATIENT\",\"dbName\":null},{\"name\":\"CLINICAL_REASONING\",\"dbName\":null},{\"name\":\"CONTROLLED_FAILURE\",\"dbName\":null}],\"dbName\":null},\"EventType\":{\"values\":[{\"name\":\"MISSION_STARTED\",\"dbName\":null},{\"name\":\"MISSION_COMPLETED\",\"dbName\":null},{\"name\":\"CARD_REVIEWED\",\"dbName\":null},{\"name\":\"VALIDATION_COMPLETED\",\"dbName\":null},{\"name\":\"SESSION_STARTED\",\"dbName\":null},{\"name\":\"SESSION_ENDED\",\"dbName\":null},{\"name\":\"LECTURE_UPLOADED\",\"dbName\":null},{\"name\":\"SEARCH_PERFORMED\",\"dbName\":null},{\"name\":\"GRAPH_VIEWED\",\"dbName\":null}],\"dbName\":null},\"EngagementLevel\":{\"values\":[{\"name\":\"LOW\",\"dbName\":null},{\"name\":\"MEDIUM\",\"dbName\":null},{\"name\":\"HIGH\",\"dbName\":null}],\"dbName\":null},\"CompletionQuality\":{\"values\":[{\"name\":\"RUSHED\",\"dbName\":null},{\"name\":\"NORMAL\",\"dbName\":null},{\"name\":\"THOROUGH\",\"dbName\":null}],\"dbName\":null},\"BehavioralPatternType\":{\"values\":[{\"name\":\"OPTIMAL_STUDY_TIME\",\"dbName\":null},{\"name\":\"SESSION_DURATION_PREFERENCE\",\"dbName\":null},{\"name\":\"CONTENT_TYPE_PREFERENCE\",\"dbName\":null},{\"name\":\"PERFORMANCE_PEAK\",\"dbName\":null},{\"name\":\"ATTENTION_CYCLE\",\"dbName\":null},{\"name\":\"FORGETTING_CURVE\",\"dbName\":null}],\"dbName\":null},\"InsightType\":{\"values\":[{\"name\":\"STUDY_TIME_OPTIMIZATION\",\"dbName\":null},{\"name\":\"SESSION_LENGTH_ADJUSTMENT\",\"dbName\":null},{\"name\":\"CONTENT_PREFERENCE\",\"dbName\":null},{\"name\":\"RETENTION_STRATEGY\",\"dbName\":null}],\"dbName\":null},\"PatternType\":{\"values\":[{\"name\":\"OPTIMAL_STUDY_TIME\",\"dbName\":null},{\"name\":\"STRUGGLE_TOPIC\",\"dbName\":null},{\"name\":\"CONTENT_PREFERENCE\",\"dbName\":null},{\"name\":\"SESSION_LENGTH\",\"dbName\":null},{\"name\":\"DAY_OF_WEEK_PATTERN\",\"dbName\":null}],\"dbName\":null},\"PredictionStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"CONFIRMED\",\"dbName\":null},{\"name\":\"FALSE_POSITIVE\",\"dbName\":null},{\"name\":\"MISSED\",\"dbName\":null}],\"dbName\":null},\"IndicatorType\":{\"values\":[{\"name\":\"LOW_RETENTION\",\"dbName\":null},{\"name\":\"PREREQUISITE_GAP\",\"dbName\":null},{\"name\":\"COMPLEXITY_MISMATCH\",\"dbName\":null},{\"name\":\"COGNITIVE_OVERLOAD\",\"dbName\":null},{\"name\":\"HISTORICAL_STRUGGLE_PATTERN\",\"dbName\":null},{\"name\":\"TOPIC_SIMILARITY_STRUGGLE\",\"dbName\":null}],\"dbName\":null},\"Severity\":{\"values\":[{\"name\":\"LOW\",\"dbName\":null},{\"name\":\"MEDIUM\",\"dbName\":null},{\"name\":\"HIGH\",\"dbName\":null}],\"dbName\":null},\"InterventionType\":{\"values\":[{\"name\":\"PREREQUISITE_REVIEW\",\"dbName\":null},{\"name\":\"DIFFICULTY_PROGRESSION\",\"dbName\":null},{\"name\":\"CONTENT_FORMAT_ADAPT\",\"dbName\":null},{\"name\":\"COGNITIVE_LOAD_REDUCE\",\"dbName\":null},{\"name\":\"SPACED_REPETITION_BOOST\",\"dbName\":null},{\"name\":\"BREAK_SCHEDULE_ADJUST\",\"dbName\":null}],\"dbName\":null},\"InterventionStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"APPLIED\",\"dbName\":null},{\"name\":\"COMPLETED\",\"dbName\":null},{\"name\":\"DISMISSED\",\"dbName\":null}],\"dbName\":null},\"FeedbackType\":{\"values\":[{\"name\":\"HELPFUL\",\"dbName\":null},{\"name\":\"NOT_HELPFUL\",\"dbName\":null},{\"name\":\"INACCURATE\",\"dbName\":null},{\"name\":\"INTERVENTION_GOOD\",\"dbName\":null},{\"name\":\"INTERVENTION_BAD\",\"dbName\":null}],\"dbName\":null},\"PriorityLevel\":{\"values\":[{\"name\":\"LOW\",\"dbName\":null},{\"name\":\"MEDIUM\",\"dbName\":null},{\"name\":\"HIGH\",\"dbName\":null},{\"name\":\"CRITICAL\",\"dbName\":null}],\"dbName\":null},\"FeedbackRating\":{\"values\":[{\"name\":\"TOO_HIGH\",\"dbName\":null},{\"name\":\"JUST_RIGHT\",\"dbName\":null},{\"name\":\"TOO_LOW\",\"dbName\":null}],\"dbName\":null},\"AchievementType\":{\"values\":[{\"name\":\"STREAK_MILESTONE\",\"dbName\":null},{\"name\":\"OBJECTIVES_COMPLETED\",\"dbName\":null},{\"name\":\"CARDS_MASTERED\",\"dbName\":null},{\"name\":\"PERFECT_SESSION\",\"dbName\":null},{\"name\":\"EARLY_BIRD\",\"dbName\":null},{\"name\":\"NIGHT_OWL\",\"dbName\":null}],\"dbName\":null},\"AchievementTier\":{\"values\":[{\"name\":\"BRONZE\",\"dbName\":null},{\"name\":\"SILVER\",\"dbName\":null},{\"name\":\"GOLD\",\"dbName\":null},{\"name\":\"PLATINUM\",\"dbName\":null}],\"dbName\":null},\"GoalType\":{\"values\":[{\"name\":\"TIME_BASED\",\"dbName\":null},{\"name\":\"OBJECTIVE_BASED\",\"dbName\":null},{\"name\":\"REVIEW_BASED\",\"dbName\":null}],\"dbName\":null},\"GoalPeriod\":{\"values\":[{\"name\":\"DAILY\",\"dbName\":null},{\"name\":\"WEEKLY\",\"dbName\":null},{\"name\":\"MONTHLY\",\"dbName\":null}],\"dbName\":null},\"AnalyticsPeriod\":{\"values\":[{\"name\":\"DAILY\",\"dbName\":null},{\"name\":\"WEEKLY\",\"dbName\":null},{\"name\":\"MONTHLY\",\"dbName\":null}],\"dbName\":null},\"PaceRating\":{\"values\":[{\"name\":\"TOO_SLOW\",\"dbName\":null},{\"name\":\"JUST_RIGHT\",\"dbName\":null},{\"name\":\"TOO_FAST\",\"dbName\":null}],\"dbName\":null},\"ReviewPeriod\":{\"values\":[{\"name\":\"WEEK\",\"dbName\":null},{\"name\":\"MONTH\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined


const { warnEnvConflicts } = require('./runtime/library.js')

warnEnvConflicts({
    rootEnvPath: config.relativeEnvPaths.rootEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.rootEnvPath),
    schemaEnvPath: config.relativeEnvPaths.schemaEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.schemaEnvPath)
})

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

// file annotations for bundling tools to include these files
path.join(__dirname, "libquery_engine-darwin-arm64.dylib.node");
path.join(process.cwd(), "src/generated/prisma/libquery_engine-darwin-arm64.dylib.node")
// file annotations for bundling tools to include these files
path.join(__dirname, "schema.prisma");
path.join(process.cwd(), "src/generated/prisma/schema.prisma")
