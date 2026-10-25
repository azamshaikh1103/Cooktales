ALTER TABLE "Recipe" ADD COLUMN "recipeCategory" TEXT NOT NULL DEFAULT 'UNCATEGORIZED';

CREATE INDEX "Recipe_status_recipeCategory_publishedAt_idx"
  ON "Recipe"("status", "recipeCategory", "publishedAt");
