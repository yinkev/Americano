-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('TOO_HIGH', 'JUST_RIGHT', 'TOO_LOW');

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "currentObjectiveIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "missionObjectives" JSONB,
ADD COLUMN     "objectiveCompletions" JSONB;

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

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_priorities" ADD CONSTRAINT "course_priorities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_priorities" ADD CONSTRAINT "course_priorities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_feedback" ADD CONSTRAINT "priority_feedback_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
