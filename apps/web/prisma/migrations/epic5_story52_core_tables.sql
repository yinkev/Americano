-- Epic 5 Story 5.2-5.6 Core Tables Migration
-- Creates tables needed for ML service struggle prediction functionality

-- Story 5.2: Struggle Prediction & Interventions

CREATE TABLE IF NOT EXISTS "struggle_predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "topicId" TEXT,
    "predictedStruggleProbability" DOUBLE PRECISION NOT NULL,
    "predictionConfidence" DOUBLE PRECISION NOT NULL,
    "predictionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "featureVector" JSONB,
    "strugglingFactors" JSONB NOT NULL,
    "predictionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "actualOutcome" BOOLEAN,
    "actualOutcomeRecordedAt" TIMESTAMP(3),
    "interventionApplied" BOOLEAN NOT NULL DEFAULT false,
    "interventionId" TEXT,
    CONSTRAINT "struggle_predictions_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "learning_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "struggle_predictions_userId_idx" ON "struggle_predictions"("userId");
CREATE INDEX IF NOT EXISTS "struggle_predictions_learningObjectiveId_idx" ON "struggle_predictions"("learningObjectiveId");
CREATE INDEX IF NOT EXISTS "struggle_predictions_predictedStruggleProbability_idx" ON "struggle_predictions"("predictedStruggleProbability");
CREATE INDEX IF NOT EXISTS "struggle_predictions_predictionStatus_idx" ON "struggle_predictions"("predictionStatus");
CREATE INDEX IF NOT EXISTS "struggle_predictions_predictionDate_idx" ON "struggle_predictions"("predictionDate");
CREATE INDEX IF NOT EXISTS "struggle_predictions_topicId_idx" ON "struggle_predictions"("topicId");
CREATE INDEX IF NOT EXISTS "struggle_predictions_userId_predictionStatus_predictedStruggleProbability_idx" ON "struggle_predictions"("userId", "predictionStatus", "predictedStruggleProbability");
CREATE INDEX IF NOT EXISTS "struggle_predictions_userId_topicId_predictionDate_idx" ON "struggle_predictions"("userId", "topicId", "predictionDate");

CREATE TABLE IF NOT EXISTS "struggle_indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "predictionId" TEXT,
    "indicatorType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "context" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "struggle_indicators_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "struggle_predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "struggle_indicators_userId_idx" ON "struggle_indicators"("userId");
CREATE INDEX IF NOT EXISTS "struggle_indicators_learningObjectiveId_idx" ON "struggle_indicators"("learningObjectiveId");
CREATE INDEX IF NOT EXISTS "struggle_indicators_predictionId_idx" ON "struggle_indicators"("predictionId");
CREATE INDEX IF NOT EXISTS "struggle_indicators_indicatorType_idx" ON "struggle_indicators"("indicatorType");
CREATE INDEX IF NOT EXISTS "struggle_indicators_severity_idx" ON "struggle_indicators"("severity");

CREATE TABLE IF NOT EXISTS "intervention_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "predictionId" TEXT,
    "interventionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "relatedObjectiveId" TEXT,
    "appliedToMissionId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    CONSTRAINT "intervention_recommendations_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "struggle_predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "intervention_recommendations_userId_idx" ON "intervention_recommendations"("userId");
CREATE INDEX IF NOT EXISTS "intervention_recommendations_predictionId_idx" ON "intervention_recommendations"("predictionId");
CREATE INDEX IF NOT EXISTS "intervention_recommendations_status_idx" ON "intervention_recommendations"("status");
CREATE INDEX IF NOT EXISTS "intervention_recommendations_priority_idx" ON "intervention_recommendations"("priority");

-- Story 5.4: Burnout Prevention & Cognitive Load

CREATE TABLE IF NOT EXISTS "cognitive_load_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "loadScore" DOUBLE PRECISION NOT NULL,
    "stressIndicators" JSONB NOT NULL,
    "confidenceLevel" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "cognitive_load_metrics_userId_idx" ON "cognitive_load_metrics"("userId");
CREATE INDEX IF NOT EXISTS "cognitive_load_metrics_sessionId_idx" ON "cognitive_load_metrics"("sessionId");
CREATE INDEX IF NOT EXISTS "cognitive_load_metrics_timestamp_idx" ON "cognitive_load_metrics"("timestamp");
CREATE INDEX IF NOT EXISTS "cognitive_load_metrics_loadScore_idx" ON "cognitive_load_metrics"("loadScore");

CREATE TABLE IF NOT EXISTS "burnout_risk_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "contributingFactors" JSONB NOT NULL,
    "warningSignals" JSONB,
    "recommendations" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interventionApplied" BOOLEAN NOT NULL DEFAULT false,
    "interventionId" TEXT
);

CREATE INDEX IF NOT EXISTS "burnout_risk_assessments_userId_idx" ON "burnout_risk_assessments"("userId");
CREATE INDEX IF NOT EXISTS "burnout_risk_assessments_riskLevel_idx" ON "burnout_risk_assessments"("riskLevel");
CREATE INDEX IF NOT EXISTS "burnout_risk_assessments_assessmentDate_idx" ON "burnout_risk_assessments"("assessmentDate");

-- Story 5.5: Adaptive Personalization Engine

CREATE TABLE IF NOT EXISTS "personalization_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "personalizationLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "autoAdaptEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missionPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contentPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assessmentPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sessionPersonalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "disabledFeatures" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastResetAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "personalization_preferences_userId_idx" ON "personalization_preferences"("userId");

CREATE TABLE IF NOT EXISTS "personalization_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferencesId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
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
    CONSTRAINT "personalization_configs_preferencesId_fkey" FOREIGN KEY ("preferencesId") REFERENCES "personalization_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "personalization_configs_userId_idx" ON "personalization_configs"("userId");
CREATE INDEX IF NOT EXISTS "personalization_configs_context_idx" ON "personalization_configs"("context");
CREATE INDEX IF NOT EXISTS "personalization_configs_strategyVariant_idx" ON "personalization_configs"("strategyVariant");
CREATE INDEX IF NOT EXISTS "personalization_configs_isActive_idx" ON "personalization_configs"("isActive");
CREATE INDEX IF NOT EXISTS "personalization_configs_userId_context_isActive_idx" ON "personalization_configs"("userId", "context", "isActive");
CREATE INDEX IF NOT EXISTS "personalization_configs_userId_avgReward_idx" ON "personalization_configs"("userId", "avgReward");

CREATE TABLE IF NOT EXISTS "personalization_effectiveness" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "personalization_effectiveness_configId_fkey" FOREIGN KEY ("configId") REFERENCES "personalization_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "personalization_effectiveness_userId_idx" ON "personalization_effectiveness"("userId");
CREATE INDEX IF NOT EXISTS "personalization_effectiveness_configId_idx" ON "personalization_effectiveness"("configId");
CREATE INDEX IF NOT EXISTS "personalization_effectiveness_startDate_endDate_idx" ON "personalization_effectiveness"("startDate", "endDate");

-- Story 5.6: Learning Science Education

CREATE TABLE IF NOT EXISTS "learning_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "personalizedSections" JSONB,
    "externalLinks" JSONB,
    "readingTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "learning_articles_category_idx" ON "learning_articles"("category");
CREATE INDEX IF NOT EXISTS "learning_articles_slug_idx" ON "learning_articles"("slug");

CREATE TABLE IF NOT EXISTS "article_reads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readDurationSeconds" INTEGER,
    "completedRead" BOOLEAN NOT NULL DEFAULT false,
    "helpful" BOOLEAN,
    "rating" INTEGER,
    "feedback" TEXT,
    CONSTRAINT "article_reads_userId_articleId_key" UNIQUE("userId", "articleId"),
    CONSTRAINT "article_reads_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "learning_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "article_reads_userId_idx" ON "article_reads"("userId");
CREATE INDEX IF NOT EXISTS "article_reads_articleId_idx" ON "article_reads"("articleId");
CREATE INDEX IF NOT EXISTS "article_reads_readAt_idx" ON "article_reads"("readAt");

-- Additional supporting tables

CREATE TABLE IF NOT EXISTS "recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionableText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "estimatedImpact" DOUBLE PRECISION NOT NULL,
    "easeOfImplementation" DOUBLE PRECISION NOT NULL,
    "userReadiness" DOUBLE PRECISION NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourcePatternIds" TEXT[],
    "sourceInsightIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "recommendations_userId_idx" ON "recommendations"("userId");
CREATE INDEX IF NOT EXISTS "recommendations_status_idx" ON "recommendations"("status");
CREATE INDEX IF NOT EXISTS "recommendations_recommendationType_idx" ON "recommendations"("recommendationType");
CREATE INDEX IF NOT EXISTS "recommendations_priorityScore_idx" ON "recommendations"("priorityScore");
CREATE INDEX IF NOT EXISTS "recommendations_userId_status_priorityScore_idx" ON "recommendations"("userId", "status", "priorityScore");
CREATE INDEX IF NOT EXISTS "recommendations_userId_createdAt_idx" ON "recommendations"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "applied_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationType" TEXT NOT NULL,
    "baselineMetrics" JSONB NOT NULL,
    "currentMetrics" JSONB,
    "effectiveness" DOUBLE PRECISION,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),
    CONSTRAINT "applied_recommendations_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "applied_recommendations_userId_idx" ON "applied_recommendations"("userId");
CREATE INDEX IF NOT EXISTS "applied_recommendations_recommendationId_idx" ON "applied_recommendations"("recommendationId");
CREATE INDEX IF NOT EXISTS "applied_recommendations_applicationType_idx" ON "applied_recommendations"("applicationType");

COMMENT ON TABLE "struggle_predictions" IS 'Story 5.2: ML-driven predictions of learning struggles';
COMMENT ON TABLE "cognitive_load_metrics" IS 'Story 5.4: Real-time cognitive load tracking';
COMMENT ON TABLE "burnout_risk_assessments" IS 'Story 5.4: Burnout risk detection and prevention';
COMMENT ON TABLE "personalization_configs" IS 'Story 5.5: Adaptive personalization configurations';
COMMENT ON TABLE "learning_articles" IS 'Story 5.6: Learning science education content';
