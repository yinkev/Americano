-- AlterTable
ALTER TABLE "users" ADD COLUMN     "includeInAnalytics" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "performanceTrackingEnabled" BOOLEAN NOT NULL DEFAULT true;
