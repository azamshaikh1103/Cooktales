-- AlterEnum
ALTER TYPE "PendingMediaStatus" ADD VALUE 'DELETE_PENDING';

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "clientDraftId" TEXT,
ADD COLUMN "statusBeforeDelete" "RecipeStatus",
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Equipment" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Ingredient" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Step" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FAQ" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_authorId_clientDraftId_key" ON "Recipe"("authorId", "clientDraftId");
