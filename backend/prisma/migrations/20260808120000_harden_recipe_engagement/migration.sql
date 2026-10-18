ALTER TABLE "Review"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Review_userId_recipeId_key" ON "Review"("userId", "recipeId");
CREATE INDEX "Review_recipeId_createdAt_idx" ON "Review"("recipeId", "createdAt");
CREATE INDEX "ReviewVote_reviewId_type_idx" ON "ReviewVote"("reviewId", "type");
CREATE INDEX "Rating_recipeId_idx" ON "Rating"("recipeId");
CREATE INDEX "Like_recipeId_createdAt_idx" ON "Like"("recipeId", "createdAt");
CREATE INDEX "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId", "createdAt");
CREATE INDEX "Bookmark_recipeId_idx" ON "Bookmark"("recipeId");
