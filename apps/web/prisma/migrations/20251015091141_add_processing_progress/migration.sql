-- AlterTable
ALTER TABLE "lectures" ADD COLUMN     "estimatedCompletionAt" TIMESTAMP(3),
ADD COLUMN     "processedPages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processingProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "totalPages" INTEGER;
