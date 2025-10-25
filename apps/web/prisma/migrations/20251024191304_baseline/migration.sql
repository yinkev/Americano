-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EMBEDDING', 'EMBEDDING_FAILED');

-- CreateEnum
CREATE TYPE "ObjectiveComplexity" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NOT_STARTED', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERED');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('BASIC', 'CLOZE', 'CLINICAL_REASONING');

-- CreateEnum
CREATE TYPE "ReviewRating" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PREREQUISITE', 'RELATED', 'INTEGRATED', 'CLINICAL');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('EXPLAIN_TO_PATIENT', 'CLINICAL_REASONING', 'CONTROLLED_FAILURE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MISSION_STARTED', 'MISSION_COMPLETED', 'CARD_REVIEWED', 'VALIDATION_COMPLETED', 'SESSION_STARTED', 'SESSION_ENDED', 'LECTURE_UPLOADED', 'SEARCH_PERFORMED', 'GRAPH_VIEWED', 'RECOMMENDATION_VIEWED', 'RECOMMENDATION_CLICKED', 'RECOMMENDATION_DISMISSED', 'RECOMMENDATION_RATED');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('OPTIMAL_STUDY_TIME', 'STRUGGLE_TOPIC', 'CONTENT_PREFERENCE', 'SESSION_LENGTH', 'DAY_OF_WEEK_PATTERN');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('TOO_HIGH', 'JUST_RIGHT', 'TOO_LOW');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('STREAK_MILESTONE', 'OBJECTIVES_COMPLETED', 'CARDS_MASTERED', 'PERFECT_SESSION', 'EARLY_BIRD', 'NIGHT_OWL');

-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('TIME_BASED', 'OBJECTIVE_BASED', 'REVIEW_BASED');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AnalyticsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaceRating" AS ENUM ('TOO_SLOW', 'JUST_RIGHT', 'TOO_FAST');

-- CreateEnum
CREATE TYPE "ReviewPeriod" AS ENUM ('WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "BehavioralPatternType" AS ENUM ('OPTIMAL_STUDY_TIME', 'SESSION_DURATION_PREFERENCE', 'CONTENT_TYPE_PREFERENCE', 'PERFORMANCE_PEAK', 'ATTENTION_CYCLE', 'FORGETTING_CURVE');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('STUDY_TIME_OPTIMIZATION', 'SESSION_LENGTH_ADJUSTMENT', 'CONTENT_PREFERENCE', 'RETENTION_STRATEGY');

-- CreateEnum
CREATE TYPE "EngagementLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CompletionQuality" AS ENUM ('RUSHED', 'NORMAL', 'THOROUGH');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('DETECTED', 'RESOLVED', 'REOPENED', 'DISMISSED', 'EVIDENCE_UPDATED', 'SOURCE_UPDATED');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ConflictStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DISMISSED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "ConflictType" AS ENUM ('DOSAGE', 'CONTRAINDICATION', 'MECHANISM', 'TREATMENT', 'DIAGNOSIS', 'PROGNOSIS', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentSourceType" AS ENUM ('LECTURE', 'FIRST_AID', 'EXTERNAL_ARTICLE', 'CONCEPT_NOTE', 'USER_NOTE');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'VIEWED', 'DISMISSED', 'RATED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('FIRST_AID', 'LECTURE', 'TEXTBOOK', 'JOURNAL', 'GUIDELINE', 'USER_NOTES');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PersonalizationLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PersonalizationContext" AS ENUM ('MISSION', 'CONTENT', 'ASSESSMENT', 'SESSION');

-- CreateEnum
CREATE TYPE "ExperimentType" AS ENUM ('AB_TEST', 'MULTIVARIATE', 'MULTI_ARMED_BANDIT');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('MISSION_COMPLETED', 'SESSION_COMPLETED', 'ASSESSMENT_COMPLETED', 'CONTENT_ENGAGED');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('SPACED_REPETITION', 'ACTIVE_RECALL', 'LEARNING_STYLES', 'COGNITIVE_LOAD', 'CIRCADIAN_RHYTHMS');

-- CreateEnum
CREATE TYPE "BurnoutRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('STUDY_TIME_OPTIMIZATION', 'SESSION_DURATION_ADJUSTMENT', 'CONTENT_TYPE_BALANCE', 'RETENTION_STRATEGY', 'CONSISTENCY_BUILDING', 'EXPERIMENTAL_SUGGESTION');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('AUTO', 'MANUAL', 'REMINDER', 'GOAL');

-- CreateEnum
CREATE TYPE "BehavioralGoalType" AS ENUM ('STUDY_TIME_CONSISTENCY', 'SESSION_DURATION', 'CONTENT_DIVERSIFICATION', 'RETENTION_IMPROVEMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'PAUSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_PATTERN', 'NEW_INSIGHT', 'GOAL_CREATED', 'GOAL_PROGRESS_25', 'GOAL_PROGRESS_50', 'GOAL_PROGRESS_75', 'GOAL_ACHIEVED', 'RECOMMENDATION_AVAILABLE', 'INTERVENTION_SUGGESTED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('PREREQUISITE_REVIEW', 'DIFFICULTY_PROGRESSION', 'SPACING_ADJUSTMENT', 'CONTENT_VARIATION', 'BREAK_RECOMMENDATION', 'FOCUS_SESSION', 'CONTENT_FORMAT_ADAPT', 'COGNITIVE_LOAD_REDUCE', 'SPACED_REPETITION_BOOST', 'BREAK_SCHEDULE_ADJUST');

-- CreateEnum
CREATE TYPE "AdaptationType" AS ENUM ('TIMING', 'DURATION', 'DIFFICULTY', 'CONTENT_SELECTION', 'SESSION_STRUCTURE', 'BREAK_SCHEDULING', 'TIME_SHIFT', 'DURATION_CHANGE', 'INTENSITY_ADJUSTMENT', 'FREQUENCY_CHANGE');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FALSE_POSITIVE', 'MISSED', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'IMPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('BEHAVIORAL', 'PERFORMANCE', 'ENGAGEMENT', 'COGNITIVE', 'LOW_RETENTION', 'PREREQUISITE_GAP', 'COMPLEXITY_MISMATCH', 'COGNITIVE_OVERLOAD', 'HISTORICAL_STRUGGLE_PATTERN');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "CalibrationCategory" AS ENUM ('OVERCONFIDENT', 'UNDERCONFIDENT', 'CALIBRATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EmotionTag" AS ENUM ('SURPRISE', 'CONFUSION', 'FRUSTRATION', 'AHA_MOMENT');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('DIAGNOSIS', 'MANAGEMENT', 'DIFFERENTIAL', 'COMPLICATIONS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "autoGenerateMissions" BOOLEAN NOT NULL DEFAULT true,
    "defaultMissionMinutes" INTEGER NOT NULL DEFAULT 50,
    "missionDifficulty" TEXT NOT NULL DEFAULT 'AUTO',
    "preferredStudyTime" TEXT,
    "includeInAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "performanceTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastMissionAdaptation" TIMESTAMP(3),
    "behavioralAnalysisEnabled" BOOLEAN NOT NULL DEFAULT true,
    "learningStyleProfilingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "shareAnonymizedPatterns" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "term" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "color" TEXT,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "weekNumber" INTEGER,
    "topicTags" TEXT[],
    "estimatedCompletionAt" TIMESTAMP(3),
    "processedPages" INTEGER NOT NULL DEFAULT 0,
    "processingProgress" INTEGER NOT NULL DEFAULT 0,
    "processingStartedAt" TIMESTAMP(3),
    "totalPages" INTEGER,
    "embeddingProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_chunks" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector,
    "chunkIndex" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "isHighYield" BOOLEAN NOT NULL DEFAULT false,
    "extractedBy" TEXT NOT NULL DEFAULT 'gpt-5',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complexity" "ObjectiveComplexity" NOT NULL DEFAULT 'INTERMEDIATE',
    "boardExamTags" TEXT[],
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "lastStudiedAt" TIMESTAMP(3),
    "masteryLevel" "MasteryLevel" NOT NULL DEFAULT 'NOT_STARTED',
    "totalStudyTimeMs" INTEGER NOT NULL DEFAULT 0,
    "weaknessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective_prerequisites" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "objective_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedMinutes" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "reviewCardCount" INTEGER NOT NULL DEFAULT 0,
    "newContentCount" INTEGER NOT NULL DEFAULT 0,
    "actualMinutes" INTEGER,
    "completedObjectivesCount" INTEGER NOT NULL DEFAULT 0,
    "objectives" JSONB NOT NULL,
    "difficultyRating" INTEGER,
    "successScore" DOUBLE PRECISION,
    "recommendedStartTime" TIMESTAMP(3),
    "actualStartTime" TIMESTAMP(3),
    "sessionPerformanceScore" DOUBLE PRECISION,
    "recommendedDuration" INTEGER,
    "actualDuration" INTEGER,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lectureId" TEXT,
    "objectiveId" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL DEFAULT 'BASIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retrievability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" "ReviewRating" NOT NULL,
    "timeSpentMs" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficultyBefore" DOUBLE PRECISION NOT NULL,
    "stabilityBefore" DOUBLE PRECISION NOT NULL,
    "difficultyAfter" DOUBLE PRECISION NOT NULL,
    "stabilityAfter" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "reviewsCompleted" INTEGER NOT NULL DEFAULT 0,
    "newCardsStudied" INTEGER NOT NULL DEFAULT 0,
    "sessionNotes" TEXT,
    "currentObjectiveIndex" INTEGER NOT NULL DEFAULT 0,
    "missionObjectives" JSONB,
    "objectiveCompletions" JSONB,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_relationships" (
    "id" TEXT NOT NULL,
    "fromConceptId" TEXT NOT NULL,
    "toConceptId" TEXT NOT NULL,
    "relationship" "RelationshipType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "isUserDefined" BOOLEAN NOT NULL DEFAULT false,
    "userNote" TEXT,

    CONSTRAINT "concept_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_prompts" (
    "id" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "promptType" "PromptType" NOT NULL,
    "conceptName" TEXT NOT NULL,
    "expectedCriteria" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objectiveId" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "validation_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_responses" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userAnswer" TEXT NOT NULL,
    "aiEvaluation" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "confidenceLevel" INTEGER,
    "calibrationDelta" DOUBLE PRECISION,
    "detailedFeedback" JSONB,
    "skipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "validation_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprehension_metrics" (
    "id" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avgScore" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "trend" TEXT,

    CONSTRAINT "comprehension_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionQuality" "CompletionQuality",
    "contentType" TEXT,
    "dayOfWeek" INTEGER,
    "difficultyLevel" TEXT,
    "engagementLevel" "EngagementLevel",
    "sessionPerformanceScore" INTEGER,
    "timeOfDay" INTEGER,

    CONSTRAINT "behavioral_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" "BehavioralPatternType" NOT NULL,
    "patternData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patternName" TEXT,
    "evidence" TEXT[],
    "occurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightType" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionableRecommendation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "applied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "behavioral_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_patterns" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "insight_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredStudyTimes" JSONB NOT NULL,
    "averageSessionDuration" INTEGER NOT NULL,
    "optimalSessionDuration" INTEGER NOT NULL,
    "contentPreferences" JSONB NOT NULL,
    "learningStyleProfile" JSONB NOT NULL,
    "personalizedForgettingCurve" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "user_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" "PatternType" NOT NULL,
    "patternData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictedFor" TIMESTAMP(3) NOT NULL,
    "predictionType" TEXT NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionScore" DOUBLE PRECISION NOT NULL,
    "studyTimeMs" INTEGER NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "correctReviews" INTEGER NOT NULL,
    "incorrectReviews" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT NOT NULL,
    "coverageTopics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_priorities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "priorityLevel" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priority_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "suggestedPriority" DOUBLE PRECISION NOT NULL,
    "userFeedback" "FeedbackRating" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "priority_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "freezesRemaining" INTEGER NOT NULL DEFAULT 2,
    "freezeUsedDates" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "AchievementTier" NOT NULL DEFAULT 'BRONZE',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "period" "GoalPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" "AnalyticsPeriod" NOT NULL,
    "missionsGenerated" INTEGER NOT NULL,
    "missionsCompleted" INTEGER NOT NULL,
    "missionsSkipped" INTEGER NOT NULL,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL,
    "avgTimeAccuracy" DOUBLE PRECISION NOT NULL,
    "avgDifficultyRating" DOUBLE PRECISION NOT NULL,
    "avgSuccessScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "helpfulnessRating" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "paceRating" "PaceRating" NOT NULL,
    "improvementSuggestions" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "ReviewPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "highlights" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_flags" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT,
    "userId" TEXT NOT NULL,
    "sourceAChunkId" TEXT NOT NULL,
    "sourceBChunkId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userNotes" TEXT,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "conflict_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_history" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "oldStatus" "ConflictStatus",
    "newStatus" "ConflictStatus",
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "conflict_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_resolutions" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "resolvedBy" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "preferredSourceId" TEXT,
    "evidence" TEXT,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "conflict_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflicts" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT,
    "sourceAChunkId" TEXT NOT NULL,
    "sourceBChunkId" TEXT NOT NULL,
    "conflictType" "ConflictType" NOT NULL,
    "severity" "ConflictSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConflictStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendedContentId" TEXT NOT NULL,
    "sourceContentId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "content_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRecommendations" INTEGER NOT NULL,
    "viewedCount" INTEGER NOT NULL,
    "clickedCount" INTEGER NOT NULL,
    "dismissedCount" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION,
    "avgEngagementTimeMs" INTEGER,
    "topSourceTypes" JSONB NOT NULL,

    CONSTRAINT "recommendation_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_feedback" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedbackText" TEXT,
    "helpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_clicks" (
    "id" TEXT NOT NULL,
    "searchQueryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "similarity" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "topResultId" TEXT,
    "responseTimeMs" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "anonymizedAt" TIMESTAMP(3),

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "credibilityScore" INTEGER NOT NULL,
    "medicalSpecialty" TEXT,
    "lastUpdated" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_source_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "trustLevel" "TrustLevel" NOT NULL,
    "priority" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_source_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "first_aid_editions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "year" INTEGER NOT NULL,
    "editionNumber" INTEGER,
    "versionNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releaseDate" TIMESTAMP(3),
    "mappingStatus" TEXT,
    "processingProgress" INTEGER NOT NULL DEFAULT 0,
    "sectionCount" INTEGER NOT NULL DEFAULT 0,
    "highYieldCount" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "first_aid_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adaptive_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "initialDifficulty" INTEGER NOT NULL,
    "currentDifficulty" INTEGER NOT NULL,
    "irtEstimate" DOUBLE PRECISION,
    "confidenceInterval" DOUBLE PRECISION,
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "trajectory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adaptive_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectiveId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avgDelta" DOUBLE PRECISION NOT NULL,
    "correlationCoeff" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "trend" TEXT,
    "overconfidentCount" INTEGER NOT NULL DEFAULT 0,
    "underconfidentCount" INTEGER NOT NULL DEFAULT 0,
    "calibratedCount" INTEGER NOT NULL DEFAULT 0,
    "meanAbsoluteError" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_reasoning_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "competencyScores" JSONB NOT NULL,
    "boardExamTopic" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_reasoning_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_scenarios" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "scenarioType" "ScenarioType" NOT NULL,
    "difficulty" TEXT NOT NULL,
    "caseText" JSONB NOT NULL,
    "boardExamTopic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_failures" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "responseId" TEXT,
    "attemptNumber" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "emotionTag" "EmotionTag",
    "personalNotes" TEXT,
    "retestSchedule" JSONB NOT NULL,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controlled_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "insightType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommendedActions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failure_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "affectedObjectives" JSONB NOT NULL,
    "patternDescription" TEXT NOT NULL,
    "remediation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failure_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mastery_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "status" "MasteryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "verifiedAt" TIMESTAMP(3),
    "criteria" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mastery_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_benchmarks" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "percentile25" DOUBLE PRECISION NOT NULL,
    "percentile50" DOUBLE PRECISION NOT NULL,
    "percentile75" DOUBLE PRECISION NOT NULL,
    "mean" DOUBLE PRECISION NOT NULL,
    "stdDev" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_responses" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userChoices" JSONB NOT NULL,
    "userReasoning" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "competencyScores" JSONB NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "understanding_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "confidenceInterval" JSONB NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualValue" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,

    CONSTRAINT "understanding_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalization_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personalizationLevel" "PersonalizationLevel" NOT NULL DEFAULT 'MEDIUM',
    "autoAdaptEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missionPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contentPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assessmentPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sessionPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "disabledFeatures" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastResetAt" TIMESTAMP(3),

    CONSTRAINT "personalization_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalization_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferencesId" TEXT NOT NULL,
    "context" "PersonalizationContext" NOT NULL,
    "strategyVariant" TEXT NOT NULL,
    "missionPersonalization" JSONB,
    "contentPersonalization" JSONB,
    "assessmentPersonalization" JSONB,
    "sessionPersonalization" JSONB,
    "effectivenessScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "timesSelected" INTEGER NOT NULL DEFAULT 0,
    "totalReward" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgReward" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalization_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalization_effectiveness" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "retentionImprovement" DOUBLE PRECISION,
    "performanceImprovement" DOUBLE PRECISION,
    "completionRateChange" DOUBLE PRECISION,
    "engagementChange" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL,
    "correlation" DOUBLE PRECISION,
    "pValue" DOUBLE PRECISION,
    "confidenceInterval" JSONB,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "isStatisticallySignificant" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalization_effectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalization_experiments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferencesId" TEXT NOT NULL,
    "experimentName" TEXT NOT NULL,
    "experimentType" "ExperimentType" NOT NULL DEFAULT 'AB_TEST',
    "context" "PersonalizationContext" NOT NULL,
    "variants" JSONB NOT NULL,
    "assignedVariant" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "minParticipants" INTEGER NOT NULL DEFAULT 20,
    "minDuration" INTEGER NOT NULL DEFAULT 14,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "variantMetrics" JSONB,
    "winningVariant" TEXT,
    "statisticalSignificance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "personalization_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalization_outcomes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "configId" TEXT,
    "outcomeType" "OutcomeType" NOT NULL,
    "context" "PersonalizationContext" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionScore" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "sessionDuration" INTEGER,
    "contentType" TEXT,
    "difficultyLevel" TEXT,
    "personalizationApplied" BOOLEAN NOT NULL DEFAULT false,
    "strategyVariant" TEXT,

    CONSTRAINT "personalization_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "personalizedSections" JSONB,
    "externalLinks" JSONB,
    "readingTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readDurationSeconds" INTEGER,
    "completedRead" BOOLEAN NOT NULL DEFAULT false,
    "helpful" BOOLEAN,
    "rating" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "article_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cognitive_load_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "loadScore" DOUBLE PRECISION NOT NULL,
    "stressIndicators" JSONB NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cognitive_load_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "burnout_risk_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" "BurnoutRiskLevel" NOT NULL,
    "contributingFactors" JSONB NOT NULL,
    "warningSignals" JSONB,
    "recommendations" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interventionApplied" BOOLEAN NOT NULL DEFAULT false,
    "interventionId" TEXT,

    CONSTRAINT "burnout_risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationType" "RecommendationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionableText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "estimatedImpact" DOUBLE PRECISION NOT NULL,
    "easeOfImplementation" DOUBLE PRECISION NOT NULL,
    "userReadiness" DOUBLE PRECISION NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "sourcePatternIds" TEXT[],
    "sourceInsightIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_recommendations" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationType" "ApplicationType" NOT NULL,
    "baselineMetrics" JSONB NOT NULL,
    "currentMetrics" JSONB,
    "effectiveness" DOUBLE PRECISION,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "applied_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" "BehavioralGoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "progressHistory" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavioral_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" TEXT,
    "interventionType" "InterventionType" NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'PENDING',
    "relatedObjectiveId" TEXT,
    "appliedToMissionId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "intervention_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "struggle_indicators" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "predictionId" TEXT,
    "indicatorType" "IndicatorType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "context" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "struggle_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "struggle_predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "topicId" TEXT,
    "predictedStruggleProbability" DOUBLE PRECISION NOT NULL,
    "predictionConfidence" DOUBLE PRECISION NOT NULL,
    "predictionStatus" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "featureVector" JSONB,
    "strugglingFactors" JSONB NOT NULL,
    "predictionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "actualOutcome" BOOLEAN,
    "actualOutcomeRecordedAt" TIMESTAMP(3),
    "interventionApplied" BOOLEAN NOT NULL DEFAULT false,
    "interventionId" TEXT,

    CONSTRAINT "struggle_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_assignments" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB,

    CONSTRAINT "experiment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_schedule_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendedSchedule" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "study_schedule_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_adaptations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adaptationType" "AdaptationType" NOT NULL,
    "adaptationDetails" JSONB NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_adaptations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarProvider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_orchestration_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT,
    "planData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "session_orchestration_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stress_response_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stress_response_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "courses_userId_idx" ON "courses"("userId");

-- CreateIndex
CREATE INDEX "lectures_userId_idx" ON "lectures"("userId");

-- CreateIndex
CREATE INDEX "lectures_courseId_idx" ON "lectures"("courseId");

-- CreateIndex
CREATE INDEX "lectures_processingStatus_idx" ON "lectures"("processingStatus");

-- CreateIndex
CREATE INDEX "content_chunks_lectureId_idx" ON "content_chunks"("lectureId");

-- CreateIndex
CREATE INDEX "learning_objectives_lectureId_idx" ON "learning_objectives"("lectureId");

-- CreateIndex
CREATE INDEX "learning_objectives_isHighYield_idx" ON "learning_objectives"("isHighYield");

-- CreateIndex
CREATE INDEX "learning_objectives_complexity_idx" ON "learning_objectives"("complexity");

-- CreateIndex
CREATE INDEX "learning_objectives_masteryLevel_idx" ON "learning_objectives"("masteryLevel");

-- CreateIndex
CREATE INDEX "learning_objectives_weaknessScore_idx" ON "learning_objectives"("weaknessScore");

-- CreateIndex
CREATE INDEX "objective_prerequisites_objectiveId_idx" ON "objective_prerequisites"("objectiveId");

-- CreateIndex
CREATE INDEX "objective_prerequisites_prerequisiteId_idx" ON "objective_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "objective_prerequisites_objectiveId_prerequisiteId_key" ON "objective_prerequisites"("objectiveId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "missions_userId_idx" ON "missions"("userId");

-- CreateIndex
CREATE INDEX "missions_date_idx" ON "missions"("date");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "cards_courseId_idx" ON "cards"("courseId");

-- CreateIndex
CREATE INDEX "cards_nextReviewAt_idx" ON "cards"("nextReviewAt");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_cardId_idx" ON "reviews"("cardId");

-- CreateIndex
CREATE INDEX "reviews_reviewedAt_idx" ON "reviews"("reviewedAt");

-- CreateIndex
CREATE INDEX "study_sessions_userId_idx" ON "study_sessions"("userId");

-- CreateIndex
CREATE INDEX "study_sessions_startedAt_idx" ON "study_sessions"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_name_key" ON "concepts"("name");

-- CreateIndex
CREATE INDEX "concepts_category_idx" ON "concepts"("category");

-- CreateIndex
CREATE INDEX "concept_relationships_fromConceptId_idx" ON "concept_relationships"("fromConceptId");

-- CreateIndex
CREATE INDEX "concept_relationships_toConceptId_idx" ON "concept_relationships"("toConceptId");

-- CreateIndex
CREATE INDEX "concept_relationships_isUserDefined_idx" ON "concept_relationships"("isUserDefined");

-- CreateIndex
CREATE UNIQUE INDEX "concept_relationships_fromConceptId_toConceptId_relationshi_key" ON "concept_relationships"("fromConceptId", "toConceptId", "relationship");

-- CreateIndex
CREATE INDEX "validation_prompts_objectiveId_idx" ON "validation_prompts"("objectiveId");

-- CreateIndex
CREATE INDEX "validation_prompts_difficultyLevel_idx" ON "validation_prompts"("difficultyLevel");

-- CreateIndex
CREATE INDEX "validation_responses_promptId_idx" ON "validation_responses"("promptId");

-- CreateIndex
CREATE INDEX "validation_responses_respondedAt_idx" ON "validation_responses"("respondedAt");

-- CreateIndex
CREATE INDEX "validation_responses_sessionId_idx" ON "validation_responses"("sessionId");

-- CreateIndex
CREATE INDEX "validation_responses_userId_idx" ON "validation_responses"("userId");

-- CreateIndex
CREATE INDEX "validation_responses_userId_respondedAt_idx" ON "validation_responses"("userId", "respondedAt");

-- CreateIndex
CREATE INDEX "comprehension_metrics_conceptName_idx" ON "comprehension_metrics"("conceptName");

-- CreateIndex
CREATE UNIQUE INDEX "comprehension_metrics_conceptName_date_key" ON "comprehension_metrics"("conceptName", "date");

-- CreateIndex
CREATE INDEX "behavioral_events_userId_idx" ON "behavioral_events"("userId");

-- CreateIndex
CREATE INDEX "behavioral_events_eventType_idx" ON "behavioral_events"("eventType");

-- CreateIndex
CREATE INDEX "behavioral_events_timestamp_idx" ON "behavioral_events"("timestamp");

-- CreateIndex
CREATE INDEX "behavioral_events_userId_eventType_timestamp_idx" ON "behavioral_events"("userId", "eventType", "timestamp");

-- CreateIndex
CREATE INDEX "behavioral_events_userId_dayOfWeek_idx" ON "behavioral_events"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "behavioral_events_userId_timeOfDay_idx" ON "behavioral_events"("userId", "timeOfDay");

-- CreateIndex
CREATE INDEX "behavioral_patterns_userId_idx" ON "behavioral_patterns"("userId");

-- CreateIndex
CREATE INDEX "behavioral_patterns_patternType_idx" ON "behavioral_patterns"("patternType");

-- CreateIndex
CREATE INDEX "behavioral_patterns_confidence_idx" ON "behavioral_patterns"("confidence");

-- CreateIndex
CREATE INDEX "behavioral_patterns_occurrenceCount_idx" ON "behavioral_patterns"("occurrenceCount");

-- CreateIndex
CREATE INDEX "behavioral_patterns_detectedAt_idx" ON "behavioral_patterns"("detectedAt");

-- CreateIndex
CREATE INDEX "behavioral_patterns_userId_patternType_confidence_idx" ON "behavioral_patterns"("userId", "patternType", "confidence");

-- CreateIndex
CREATE INDEX "behavioral_patterns_userId_lastSeenAt_idx" ON "behavioral_patterns"("userId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "behavioral_insights_userId_idx" ON "behavioral_insights"("userId");

-- CreateIndex
CREATE INDEX "behavioral_insights_createdAt_idx" ON "behavioral_insights"("createdAt");

-- CreateIndex
CREATE INDEX "behavioral_insights_acknowledgedAt_idx" ON "behavioral_insights"("acknowledgedAt");

-- CreateIndex
CREATE INDEX "insight_patterns_insightId_idx" ON "insight_patterns"("insightId");

-- CreateIndex
CREATE INDEX "insight_patterns_patternId_idx" ON "insight_patterns"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "insight_patterns_insightId_patternId_key" ON "insight_patterns"("insightId", "patternId");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_profiles_userId_key" ON "user_learning_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_learning_profiles_userId_idx" ON "user_learning_profiles"("userId");

-- CreateIndex
CREATE INDEX "learning_patterns_userId_idx" ON "learning_patterns"("userId");

-- CreateIndex
CREATE INDEX "learning_patterns_patternType_idx" ON "learning_patterns"("patternType");

-- CreateIndex
CREATE INDEX "performance_predictions_userId_idx" ON "performance_predictions"("userId");

-- CreateIndex
CREATE INDEX "performance_predictions_predictedFor_idx" ON "performance_predictions"("predictedFor");

-- CreateIndex
CREATE INDEX "performance_metrics_userId_date_idx" ON "performance_metrics"("userId", "date");

-- CreateIndex
CREATE INDEX "performance_metrics_learningObjectiveId_idx" ON "performance_metrics"("learningObjectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_metrics_userId_learningObjectiveId_date_key" ON "performance_metrics"("userId", "learningObjectiveId", "date");

-- CreateIndex
CREATE INDEX "exams_userId_date_idx" ON "exams"("userId", "date");

-- CreateIndex
CREATE INDEX "exams_courseId_idx" ON "exams"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_priorities_userId_courseId_key" ON "course_priorities"("userId", "courseId");

-- CreateIndex
CREATE INDEX "priority_feedback_userId_idx" ON "priority_feedback"("userId");

-- CreateIndex
CREATE INDEX "priority_feedback_objectiveId_idx" ON "priority_feedback"("objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_userId_key" ON "streaks"("userId");

-- CreateIndex
CREATE INDEX "streaks_userId_idx" ON "streaks"("userId");

-- CreateIndex
CREATE INDEX "achievements_userId_idx" ON "achievements"("userId");

-- CreateIndex
CREATE INDEX "achievements_type_idx" ON "achievements"("type");

-- CreateIndex
CREATE INDEX "study_goals_userId_idx" ON "study_goals"("userId");

-- CreateIndex
CREATE INDEX "study_goals_period_startDate_idx" ON "study_goals"("period", "startDate");

-- CreateIndex
CREATE INDEX "mission_analytics_userId_date_idx" ON "mission_analytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "mission_analytics_userId_date_period_key" ON "mission_analytics"("userId", "date", "period");

-- CreateIndex
CREATE INDEX "mission_feedback_userId_idx" ON "mission_feedback"("userId");

-- CreateIndex
CREATE INDEX "mission_feedback_missionId_idx" ON "mission_feedback"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_streaks_userId_key" ON "mission_streaks"("userId");

-- CreateIndex
CREATE INDEX "mission_streaks_userId_idx" ON "mission_streaks"("userId");

-- CreateIndex
CREATE INDEX "mission_reviews_userId_generatedAt_idx" ON "mission_reviews"("userId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mission_reviews_userId_period_startDate_key" ON "mission_reviews"("userId", "period", "startDate");

-- CreateIndex
CREATE INDEX "conflict_flags_flaggedAt_idx" ON "conflict_flags"("flaggedAt");

-- CreateIndex
CREATE INDEX "conflict_flags_status_idx" ON "conflict_flags"("status");

-- CreateIndex
CREATE INDEX "conflict_flags_userId_idx" ON "conflict_flags"("userId");

-- CreateIndex
CREATE INDEX "conflict_history_changedAt_idx" ON "conflict_history"("changedAt");

-- CreateIndex
CREATE INDEX "conflict_history_conflictId_idx" ON "conflict_history"("conflictId");

-- CreateIndex
CREATE INDEX "conflict_resolutions_conflictId_idx" ON "conflict_resolutions"("conflictId");

-- CreateIndex
CREATE INDEX "conflict_resolutions_resolvedAt_idx" ON "conflict_resolutions"("resolvedAt");

-- CreateIndex
CREATE INDEX "conflicts_conceptId_status_idx" ON "conflicts"("conceptId", "status");

-- CreateIndex
CREATE INDEX "conflicts_createdAt_idx" ON "conflicts"("createdAt");

-- CreateIndex
CREATE INDEX "conflicts_severity_idx" ON "conflicts"("severity");

-- CreateIndex
CREATE INDEX "conflicts_status_idx" ON "conflicts"("status");

-- CreateIndex
CREATE INDEX "content_recommendations_contextType_contextId_idx" ON "content_recommendations"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "content_recommendations_createdAt_idx" ON "content_recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "content_recommendations_status_idx" ON "content_recommendations"("status");

-- CreateIndex
CREATE INDEX "content_recommendations_userId_contextType_contextId_idx" ON "content_recommendations"("userId", "contextType", "contextId");

-- CreateIndex
CREATE INDEX "content_recommendations_userId_idx" ON "content_recommendations"("userId");

-- CreateIndex
CREATE INDEX "recommendation_analytics_date_idx" ON "recommendation_analytics"("date");

-- CreateIndex
CREATE INDEX "recommendation_analytics_userId_idx" ON "recommendation_analytics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_analytics_userId_date_key" ON "recommendation_analytics"("userId", "date");

-- CreateIndex
CREATE INDEX "recommendation_feedback_createdAt_idx" ON "recommendation_feedback"("createdAt");

-- CreateIndex
CREATE INDEX "recommendation_feedback_recommendationId_idx" ON "recommendation_feedback"("recommendationId");

-- CreateIndex
CREATE INDEX "recommendation_feedback_userId_idx" ON "recommendation_feedback"("userId");

-- CreateIndex
CREATE INDEX "search_clicks_resultId_resultType_idx" ON "search_clicks"("resultId", "resultType");

-- CreateIndex
CREATE INDEX "search_clicks_searchQueryId_idx" ON "search_clicks"("searchQueryId");

-- CreateIndex
CREATE INDEX "search_clicks_userId_timestamp_idx" ON "search_clicks"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "search_queries_isAnonymized_idx" ON "search_queries"("isAnonymized");

-- CreateIndex
CREATE INDEX "search_queries_timestamp_idx" ON "search_queries"("timestamp");

-- CreateIndex
CREATE INDEX "search_queries_userId_timestamp_idx" ON "search_queries"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "sources_name_key" ON "sources"("name");

-- CreateIndex
CREATE INDEX "sources_credibilityScore_idx" ON "sources"("credibilityScore");

-- CreateIndex
CREATE INDEX "sources_type_idx" ON "sources"("type");

-- CreateIndex
CREATE INDEX "user_source_preferences_priority_idx" ON "user_source_preferences"("priority");

-- CreateIndex
CREATE INDEX "user_source_preferences_userId_idx" ON "user_source_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_source_preferences_userId_sourceId_key" ON "user_source_preferences"("userId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "first_aid_editions_editionNumber_key" ON "first_aid_editions"("editionNumber");

-- CreateIndex
CREATE INDEX "first_aid_editions_userId_idx" ON "first_aid_editions"("userId");

-- CreateIndex
CREATE INDEX "first_aid_editions_year_idx" ON "first_aid_editions"("year");

-- CreateIndex
CREATE INDEX "adaptive_sessions_userId_idx" ON "adaptive_sessions"("userId");

-- CreateIndex
CREATE INDEX "adaptive_sessions_sessionId_idx" ON "adaptive_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "adaptive_sessions_userId_createdAt_idx" ON "adaptive_sessions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "calibration_metrics_userId_date_idx" ON "calibration_metrics"("userId", "date");

-- CreateIndex
CREATE INDEX "calibration_metrics_objectiveId_idx" ON "calibration_metrics"("objectiveId");

-- CreateIndex
CREATE INDEX "calibration_metrics_correlationCoeff_idx" ON "calibration_metrics"("correlationCoeff");

-- CreateIndex
CREATE UNIQUE INDEX "calibration_metrics_userId_date_objectiveId_key" ON "calibration_metrics"("userId", "date", "objectiveId");

-- CreateIndex
CREATE INDEX "clinical_reasoning_metrics_userId_date_idx" ON "clinical_reasoning_metrics"("userId", "date");

-- CreateIndex
CREATE INDEX "clinical_reasoning_metrics_scenarioType_idx" ON "clinical_reasoning_metrics"("scenarioType");

-- CreateIndex
CREATE INDEX "clinical_reasoning_metrics_boardExamTopic_idx" ON "clinical_reasoning_metrics"("boardExamTopic");

-- CreateIndex
CREATE INDEX "clinical_scenarios_objectiveId_idx" ON "clinical_scenarios"("objectiveId");

-- CreateIndex
CREATE INDEX "clinical_scenarios_boardExamTopic_idx" ON "clinical_scenarios"("boardExamTopic");

-- CreateIndex
CREATE INDEX "clinical_scenarios_createdAt_idx" ON "clinical_scenarios"("createdAt");

-- CreateIndex
CREATE INDEX "controlled_failures_userId_objectiveId_idx" ON "controlled_failures"("userId", "objectiveId");

-- CreateIndex
CREATE INDEX "controlled_failures_nextRetryAt_idx" ON "controlled_failures"("nextRetryAt");

-- CreateIndex
CREATE INDEX "controlled_failures_userId_nextRetryAt_idx" ON "controlled_failures"("userId", "nextRetryAt");

-- CreateIndex
CREATE INDEX "daily_insights_userId_idx" ON "daily_insights"("userId");

-- CreateIndex
CREATE INDEX "daily_insights_date_idx" ON "daily_insights"("date");

-- CreateIndex
CREATE INDEX "failure_patterns_userId_idx" ON "failure_patterns"("userId");

-- CreateIndex
CREATE INDEX "failure_patterns_patternType_idx" ON "failure_patterns"("patternType");

-- CreateIndex
CREATE INDEX "failure_patterns_userId_lastSeenAt_idx" ON "failure_patterns"("userId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "mastery_verifications_userId_idx" ON "mastery_verifications"("userId");

-- CreateIndex
CREATE INDEX "mastery_verifications_objectiveId_idx" ON "mastery_verifications"("objectiveId");

-- CreateIndex
CREATE INDEX "mastery_verifications_status_idx" ON "mastery_verifications"("status");

-- CreateIndex
CREATE INDEX "mastery_verifications_userId_status_idx" ON "mastery_verifications"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mastery_verifications_userId_objectiveId_key" ON "mastery_verifications"("userId", "objectiveId");

-- CreateIndex
CREATE INDEX "peer_benchmarks_objectiveId_idx" ON "peer_benchmarks"("objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "peer_benchmarks_objectiveId_metric_key" ON "peer_benchmarks"("objectiveId", "metric");

-- CreateIndex
CREATE INDEX "scenario_responses_scenarioId_idx" ON "scenario_responses"("scenarioId");

-- CreateIndex
CREATE INDEX "scenario_responses_userId_idx" ON "scenario_responses"("userId");

-- CreateIndex
CREATE INDEX "scenario_responses_respondedAt_idx" ON "scenario_responses"("respondedAt");

-- CreateIndex
CREATE INDEX "understanding_predictions_userId_idx" ON "understanding_predictions"("userId");

-- CreateIndex
CREATE INDEX "understanding_predictions_objectiveId_idx" ON "understanding_predictions"("objectiveId");

-- CreateIndex
CREATE INDEX "understanding_predictions_predictedAt_idx" ON "understanding_predictions"("predictedAt");

-- CreateIndex
CREATE UNIQUE INDEX "personalization_preferences_userId_key" ON "personalization_preferences"("userId");

-- CreateIndex
CREATE INDEX "personalization_preferences_userId_idx" ON "personalization_preferences"("userId");

-- CreateIndex
CREATE INDEX "personalization_configs_userId_idx" ON "personalization_configs"("userId");

-- CreateIndex
CREATE INDEX "personalization_configs_context_idx" ON "personalization_configs"("context");

-- CreateIndex
CREATE INDEX "personalization_configs_strategyVariant_idx" ON "personalization_configs"("strategyVariant");

-- CreateIndex
CREATE INDEX "personalization_configs_isActive_idx" ON "personalization_configs"("isActive");

-- CreateIndex
CREATE INDEX "personalization_configs_userId_context_isActive_idx" ON "personalization_configs"("userId", "context", "isActive");

-- CreateIndex
CREATE INDEX "personalization_configs_userId_avgReward_idx" ON "personalization_configs"("userId", "avgReward");

-- CreateIndex
CREATE INDEX "personalization_effectiveness_userId_idx" ON "personalization_effectiveness"("userId");

-- CreateIndex
CREATE INDEX "personalization_effectiveness_configId_idx" ON "personalization_effectiveness"("configId");

-- CreateIndex
CREATE INDEX "personalization_effectiveness_startDate_endDate_idx" ON "personalization_effectiveness"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "personalization_experiments_userId_idx" ON "personalization_experiments"("userId");

-- CreateIndex
CREATE INDEX "personalization_experiments_status_idx" ON "personalization_experiments"("status");

-- CreateIndex
CREATE INDEX "personalization_experiments_context_idx" ON "personalization_experiments"("context");

-- CreateIndex
CREATE INDEX "personalization_experiments_startDate_endDate_idx" ON "personalization_experiments"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "personalization_outcomes_userId_idx" ON "personalization_outcomes"("userId");

-- CreateIndex
CREATE INDEX "personalization_outcomes_outcomeType_idx" ON "personalization_outcomes"("outcomeType");

-- CreateIndex
CREATE INDEX "personalization_outcomes_timestamp_idx" ON "personalization_outcomes"("timestamp");

-- CreateIndex
CREATE INDEX "personalization_outcomes_configId_idx" ON "personalization_outcomes"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_articles_slug_key" ON "learning_articles"("slug");

-- CreateIndex
CREATE INDEX "learning_articles_category_idx" ON "learning_articles"("category");

-- CreateIndex
CREATE INDEX "learning_articles_slug_idx" ON "learning_articles"("slug");

-- CreateIndex
CREATE INDEX "article_reads_userId_idx" ON "article_reads"("userId");

-- CreateIndex
CREATE INDEX "article_reads_articleId_idx" ON "article_reads"("articleId");

-- CreateIndex
CREATE INDEX "article_reads_readAt_idx" ON "article_reads"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "article_reads_userId_articleId_key" ON "article_reads"("userId", "articleId");

-- CreateIndex
CREATE INDEX "cognitive_load_metrics_userId_idx" ON "cognitive_load_metrics"("userId");

-- CreateIndex
CREATE INDEX "cognitive_load_metrics_sessionId_idx" ON "cognitive_load_metrics"("sessionId");

-- CreateIndex
CREATE INDEX "cognitive_load_metrics_timestamp_idx" ON "cognitive_load_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "cognitive_load_metrics_loadScore_idx" ON "cognitive_load_metrics"("loadScore");

-- CreateIndex
CREATE INDEX "burnout_risk_assessments_userId_idx" ON "burnout_risk_assessments"("userId");

-- CreateIndex
CREATE INDEX "burnout_risk_assessments_riskLevel_idx" ON "burnout_risk_assessments"("riskLevel");

-- CreateIndex
CREATE INDEX "burnout_risk_assessments_assessmentDate_idx" ON "burnout_risk_assessments"("assessmentDate");

-- CreateIndex
CREATE INDEX "recommendations_userId_idx" ON "recommendations"("userId");

-- CreateIndex
CREATE INDEX "recommendations_status_idx" ON "recommendations"("status");

-- CreateIndex
CREATE INDEX "recommendations_recommendationType_idx" ON "recommendations"("recommendationType");

-- CreateIndex
CREATE INDEX "recommendations_priorityScore_idx" ON "recommendations"("priorityScore");

-- CreateIndex
CREATE INDEX "recommendations_userId_status_priorityScore_idx" ON "recommendations"("userId", "status", "priorityScore");

-- CreateIndex
CREATE INDEX "recommendations_userId_createdAt_idx" ON "recommendations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "applied_recommendations_userId_idx" ON "applied_recommendations"("userId");

-- CreateIndex
CREATE INDEX "applied_recommendations_recommendationId_idx" ON "applied_recommendations"("recommendationId");

-- CreateIndex
CREATE INDEX "applied_recommendations_applicationType_idx" ON "applied_recommendations"("applicationType");

-- CreateIndex
CREATE INDEX "behavioral_goals_userId_idx" ON "behavioral_goals"("userId");

-- CreateIndex
CREATE INDEX "behavioral_goals_status_idx" ON "behavioral_goals"("status");

-- CreateIndex
CREATE INDEX "behavioral_goals_deadline_idx" ON "behavioral_goals"("deadline");

-- CreateIndex
CREATE INDEX "intervention_recommendations_userId_idx" ON "intervention_recommendations"("userId");

-- CreateIndex
CREATE INDEX "intervention_recommendations_predictionId_idx" ON "intervention_recommendations"("predictionId");

-- CreateIndex
CREATE INDEX "intervention_recommendations_status_idx" ON "intervention_recommendations"("status");

-- CreateIndex
CREATE INDEX "intervention_recommendations_priority_idx" ON "intervention_recommendations"("priority");

-- CreateIndex
CREATE INDEX "insight_notifications_userId_idx" ON "insight_notifications"("userId");

-- CreateIndex
CREATE INDEX "insight_notifications_notificationType_idx" ON "insight_notifications"("notificationType");

-- CreateIndex
CREATE INDEX "insight_notifications_readAt_idx" ON "insight_notifications"("readAt");

-- CreateIndex
CREATE INDEX "struggle_indicators_userId_idx" ON "struggle_indicators"("userId");

-- CreateIndex
CREATE INDEX "struggle_indicators_learningObjectiveId_idx" ON "struggle_indicators"("learningObjectiveId");

-- CreateIndex
CREATE INDEX "struggle_indicators_predictionId_idx" ON "struggle_indicators"("predictionId");

-- CreateIndex
CREATE INDEX "struggle_indicators_indicatorType_idx" ON "struggle_indicators"("indicatorType");

-- CreateIndex
CREATE INDEX "struggle_indicators_severity_idx" ON "struggle_indicators"("severity");

-- CreateIndex
CREATE INDEX "struggle_predictions_userId_idx" ON "struggle_predictions"("userId");

-- CreateIndex
CREATE INDEX "struggle_predictions_learningObjectiveId_idx" ON "struggle_predictions"("learningObjectiveId");

-- CreateIndex
CREATE INDEX "struggle_predictions_predictedStruggleProbability_idx" ON "struggle_predictions"("predictedStruggleProbability");

-- CreateIndex
CREATE INDEX "struggle_predictions_predictionStatus_idx" ON "struggle_predictions"("predictionStatus");

-- CreateIndex
CREATE INDEX "struggle_predictions_predictionDate_idx" ON "struggle_predictions"("predictionDate");

-- CreateIndex
CREATE INDEX "struggle_predictions_topicId_idx" ON "struggle_predictions"("topicId");

-- CreateIndex
CREATE INDEX "struggle_predictions_userId_predictionStatus_predictedStrug_idx" ON "struggle_predictions"("userId", "predictionStatus", "predictedStruggleProbability");

-- CreateIndex
CREATE INDEX "struggle_predictions_userId_topicId_predictionDate_idx" ON "struggle_predictions"("userId", "topicId", "predictionDate");

-- CreateIndex
CREATE INDEX "experiment_assignments_experimentId_idx" ON "experiment_assignments"("experimentId");

-- CreateIndex
CREATE INDEX "experiment_assignments_userId_idx" ON "experiment_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_assignments_experimentId_userId_key" ON "experiment_assignments"("experimentId", "userId");

-- CreateIndex
CREATE INDEX "study_schedule_recommendations_userId_idx" ON "study_schedule_recommendations"("userId");

-- CreateIndex
CREATE INDEX "study_schedule_recommendations_appliedAt_idx" ON "study_schedule_recommendations"("appliedAt");

-- CreateIndex
CREATE INDEX "schedule_adaptations_userId_idx" ON "schedule_adaptations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_integrations_userId_key" ON "calendar_integrations"("userId");

-- CreateIndex
CREATE INDEX "calendar_integrations_userId_idx" ON "calendar_integrations"("userId");

-- CreateIndex
CREATE INDEX "session_orchestration_plans_userId_idx" ON "session_orchestration_plans"("userId");

-- CreateIndex
CREATE INDEX "session_orchestration_plans_missionId_idx" ON "session_orchestration_plans"("missionId");

-- CreateIndex
CREATE INDEX "stress_response_patterns_userId_idx" ON "stress_response_patterns"("userId");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_prerequisites" ADD CONSTRAINT "objective_prerequisites_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_prerequisites" ADD CONSTRAINT "objective_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_relationships" ADD CONSTRAINT "concept_relationships_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_relationships" ADD CONSTRAINT "concept_relationships_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_prompts" ADD CONSTRAINT "validation_prompts_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_responses" ADD CONSTRAINT "validation_responses_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "validation_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_responses" ADD CONSTRAINT "validation_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_patterns" ADD CONSTRAINT "insight_patterns_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "behavioral_insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_patterns" ADD CONSTRAINT "insight_patterns_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "behavioral_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_priorities" ADD CONSTRAINT "course_priorities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_priorities" ADD CONSTRAINT "course_priorities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_feedback" ADD CONSTRAINT "priority_feedback_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_feedback" ADD CONSTRAINT "mission_feedback_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_streaks" ADD CONSTRAINT "mission_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_reviews" ADD CONSTRAINT "mission_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_flags" ADD CONSTRAINT "conflict_flags_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "conflicts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_history" ADD CONSTRAINT "conflict_history_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "conflicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_resolutions" ADD CONSTRAINT "conflict_resolutions_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "conflicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceAChunkId_fkey" FOREIGN KEY ("sourceAChunkId") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceBChunkId_fkey" FOREIGN KEY ("sourceBChunkId") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_recommendedContentId_fkey" FOREIGN KEY ("recommendedContentId") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_sourceContentId_fkey" FOREIGN KEY ("sourceContentId") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "content_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "search_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_source_preferences" ADD CONSTRAINT "user_source_preferences_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_reasoning_metrics" ADD CONSTRAINT "clinical_reasoning_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_scenarios" ADD CONSTRAINT "clinical_scenarios_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_failures" ADD CONSTRAINT "controlled_failures_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mastery_verifications" ADD CONSTRAINT "mastery_verifications_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_responses" ADD CONSTRAINT "scenario_responses_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "clinical_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_responses" ADD CONSTRAINT "scenario_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_responses" ADD CONSTRAINT "scenario_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalization_configs" ADD CONSTRAINT "personalization_configs_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "personalization_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalization_effectiveness" ADD CONSTRAINT "personalization_effectiveness_configId_fkey" FOREIGN KEY ("configId") REFERENCES "personalization_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalization_experiments" ADD CONSTRAINT "personalization_experiments_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "personalization_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_reads" ADD CONSTRAINT "article_reads_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "learning_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_recommendations" ADD CONSTRAINT "applied_recommendations_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_recommendations" ADD CONSTRAINT "intervention_recommendations_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "struggle_predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "struggle_indicators" ADD CONSTRAINT "struggle_indicators_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "struggle_predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "struggle_predictions" ADD CONSTRAINT "struggle_predictions_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "personalization_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

