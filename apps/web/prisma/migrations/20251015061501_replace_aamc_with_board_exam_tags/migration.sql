/*
  Warnings:

  - You are about to drop the column `aamcCompetencies` on the `learning_objectives` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "learning_objectives" DROP COLUMN "aamcCompetencies",
ADD COLUMN     "boardExamTags" TEXT[];
