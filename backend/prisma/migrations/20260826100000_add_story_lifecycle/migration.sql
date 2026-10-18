-- Keep existing "Blog" records, but give the new NestJS Story model a full lifecycle.
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED');
CREATE TYPE "StoryMediaKind" AS ENUM ('COVER', 'IMAGE', 'VIDEO');

ALTER TABLE "Blog"
  ADD COLUMN "clientDraftId" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "status" "StoryStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "statusBeforeDelete" "StoryStatus",
  ADD COLUMN "coverImagePublicId" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "lastEditedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Blog"
SET "publishedAt" = COALESCE("createdAt", NOW()),
    "lastEditedAt" = COALESCE("updatedAt", "createdAt", NOW())
WHERE "status" = 'PUBLISHED';

ALTER TABLE "ContentBlock"
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "StoryMedia" (
  "id" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "resourceType" "CloudinaryResourceType" NOT NULL DEFAULT 'IMAGE',
  "kind" "StoryMediaKind" NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "width" INTEGER,
  "height" INTEGER,
  "bytes" INTEGER,
  "format" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryMedia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");
CREATE UNIQUE INDEX "Blog_authorId_clientDraftId_key" ON "Blog"("authorId", "clientDraftId");
CREATE INDEX "Blog_authorId_status_idx" ON "Blog"("authorId", "status");
CREATE INDEX "Blog_status_publishedAt_idx" ON "Blog"("status", "publishedAt");
CREATE INDEX "Blog_deletedAt_idx" ON "Blog"("deletedAt");
CREATE INDEX "Blog_popularityScore_idx" ON "Blog"("popularityScore");
CREATE INDEX "ContentBlock_blogId_position_idx" ON "ContentBlock"("blogId", "position");
CREATE UNIQUE INDEX "StoryMedia_publicId_key" ON "StoryMedia"("publicId");
CREATE INDEX "StoryMedia_storyId_kind_position_idx" ON "StoryMedia"("storyId", "kind", "position");
CREATE UNIQUE INDEX "Review_userId_blogId_key" ON "Review"("userId", "blogId");
CREATE INDEX "Review_blogId_createdAt_idx" ON "Review"("blogId", "createdAt");

ALTER TABLE "StoryMedia"
  ADD CONSTRAINT "StoryMedia_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
