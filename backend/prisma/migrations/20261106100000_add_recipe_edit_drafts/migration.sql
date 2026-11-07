CREATE TABLE "RecipeEditDraft" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "baseVersion" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeEditDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecipeEditDraft_recipeId_key" ON "RecipeEditDraft"("recipeId");
CREATE INDEX "RecipeEditDraft_authorId_updatedAt_idx" ON "RecipeEditDraft"("authorId", "updatedAt");

ALTER TABLE "RecipeEditDraft" ADD CONSTRAINT "RecipeEditDraft_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeEditDraft" ADD CONSTRAINT "RecipeEditDraft_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
