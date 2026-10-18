CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED');

ALTER TABLE "Comment"
ADD COLUMN "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "editedAt" TIMESTAMP(3);

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_exactly_one_content_target"
CHECK (
  (CASE WHEN "discussionId" IS NULL THEN 0 ELSE 1 END) +
  (CASE WHEN "recipeId" IS NULL THEN 0 ELSE 1 END) +
  (CASE WHEN "blogId" IS NULL THEN 0 ELSE 1 END) = 1
);

CREATE INDEX "Comment_recipeId_status_deletedAt_parentId_createdAt_idx"
ON "Comment"("recipeId", "status", "deletedAt", "parentId", "createdAt");

CREATE INDEX "Comment_parentId_status_deletedAt_createdAt_idx"
ON "Comment"("parentId", "status", "deletedAt", "createdAt");
