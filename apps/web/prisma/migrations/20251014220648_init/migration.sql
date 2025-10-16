-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

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
CREATE TYPE "EventType" AS ENUM ('MISSION_STARTED', 'MISSION_COMPLETED', 'CARD_REVIEWED', 'VALIDATION_COMPLETED', 'SESSION_STARTED', 'SESSION_ENDED', 'LECTURE_UPLOADED', 'SEARCH_PERFORMED', 'GRAPH_VIEWED');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('OPTIMAL_STUDY_TIME', 'STRUGGLE_TOPIC', 'CONTENT_PREFERENCE', 'SESSION_LENGTH', 'DAY_OF_WEEK_PATTERN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_chunks" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(3072),
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

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedMinutes" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "objectives" TEXT[],
    "reviewCardCount" INTEGER NOT NULL,
    "newContentCount" INTEGER NOT NULL,

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

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "embedding" vector(3072),
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

    CONSTRAINT "behavioral_events_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "concept_relationships_fromConceptId_toConceptId_relationshi_key" ON "concept_relationships"("fromConceptId", "toConceptId", "relationship");

-- CreateIndex
CREATE INDEX "validation_responses_promptId_idx" ON "validation_responses"("promptId");

-- CreateIndex
CREATE INDEX "validation_responses_respondedAt_idx" ON "validation_responses"("respondedAt");

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
CREATE INDEX "learning_patterns_userId_idx" ON "learning_patterns"("userId");

-- CreateIndex
CREATE INDEX "learning_patterns_patternType_idx" ON "learning_patterns"("patternType");

-- CreateIndex
CREATE INDEX "performance_predictions_userId_idx" ON "performance_predictions"("userId");

-- CreateIndex
CREATE INDEX "performance_predictions_predictedFor_idx" ON "performance_predictions"("predictedFor");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_relationships" ADD CONSTRAINT "concept_relationships_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_relationships" ADD CONSTRAINT "concept_relationships_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_responses" ADD CONSTRAINT "validation_responses_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "validation_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_responses" ADD CONSTRAINT "validation_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
