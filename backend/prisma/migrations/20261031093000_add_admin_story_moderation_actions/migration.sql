-- Keep a permanent record of every admin hide or restore action.
CREATE TYPE "AdminStoryModerationActionType" AS ENUM ('HIDDEN', 'RESTORED');

CREATE TABLE "AdminStoryModerationAction" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminStoryModerationActionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminStoryModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminStoryModerationAction_storyId_createdAt_idx"
ON "AdminStoryModerationAction"("storyId", "createdAt");

CREATE INDEX "AdminStoryModerationAction_adminId_createdAt_idx"
ON "AdminStoryModerationAction"("adminId", "createdAt");

ALTER TABLE "AdminStoryModerationAction"
ADD CONSTRAINT "AdminStoryModerationAction_storyId_fkey"
FOREIGN KEY ("storyId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminStoryModerationAction"
ADD CONSTRAINT "AdminStoryModerationAction_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
