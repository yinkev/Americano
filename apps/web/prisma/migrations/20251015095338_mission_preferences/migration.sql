-- AlterTable
ALTER TABLE "users" ADD COLUMN     "autoGenerateMissions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultMissionMinutes" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "missionDifficulty" TEXT NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "preferredStudyTime" TEXT;
