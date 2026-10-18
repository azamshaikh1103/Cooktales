-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "RecipeMediaKind" AS ENUM ('MAIN', 'GALLERY', 'STEP', 'VIDEO');

-- CreateEnum
CREATE TYPE "CloudinaryResourceType" AS ENUM ('IMAGE', 'VIDEO', 'RAW');

-- AlterTable
ALTER TABLE "Recipe"
ADD COLUMN "slug" TEXT,
ADD COLUMN "status" "RecipeStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "mainImagePublicId" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "lastEditedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Make draft creation possible. Publish validation enforces real content.
ALTER TABLE "Recipe"
ALTER COLUMN "mainImage" SET DEFAULT '',
ALTER COLUMN "totalTimeReq" SET DEFAULT 0;

-- Preserve existing content visibility after adding lifecycle status.
UPDATE "Recipe"
SET "status" = 'PUBLISHED',
    "publishedAt" = COALESCE("createdAt", NOW())
WHERE "deletedAt" IS NULL;

-- CreateTable
CREATE TABLE "RecipeMedia" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "resourceType" "CloudinaryResourceType" NOT NULL DEFAULT 'IMAGE',
  "kind" "RecipeMediaKind" NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "width" INTEGER,
  "height" INTEGER,
  "bytes" INTEGER,
  "format" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RecipeMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE INDEX "Recipe_authorId_status_idx" ON "Recipe"("authorId", "status");

-- CreateIndex
CREATE INDEX "Recipe_status_publishedAt_idx" ON "Recipe"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Recipe_deletedAt_idx" ON "Recipe"("deletedAt");

-- CreateIndex
CREATE INDEX "Recipe_popularityScore_idx" ON "Recipe"("popularityScore");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeMedia_publicId_key" ON "RecipeMedia"("publicId");

-- CreateIndex
CREATE INDEX "RecipeMedia_recipeId_kind_position_idx" ON "RecipeMedia"("recipeId", "kind", "position");

-- AddForeignKey
ALTER TABLE "RecipeMedia" ADD CONSTRAINT "RecipeMedia_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
