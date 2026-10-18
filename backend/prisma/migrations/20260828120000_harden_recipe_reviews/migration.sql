CREATE TYPE "ReviewStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED');

ALTER TABLE "Review"
ADD COLUMN "editedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'VISIBLE';

DROP INDEX IF EXISTS "Review_recipeId_createdAt_idx";
CREATE INDEX "Review_recipeId_status_deletedAt_createdAt_idx"
ON "Review"("recipeId", "status", "deletedAt", "createdAt");
