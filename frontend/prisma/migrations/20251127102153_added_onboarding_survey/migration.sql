/*
  Warnings:

  - You are about to drop the column `verified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "verified",
ADD COLUMN     "bringsYouHere" TEXT,
ADD COLUMN     "cookingLevel" TEXT,
ADD COLUMN     "dietaryPreferences" TEXT,
ADD COLUMN     "notifications" JSONB DEFAULT '{}',
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB DEFAULT '{}',
ADD COLUMN     "surveyCompleted" BOOLEAN NOT NULL DEFAULT false;
