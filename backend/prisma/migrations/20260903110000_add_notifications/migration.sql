CREATE TYPE "NotificationType" AS ENUM (
  'FOLLOW',
  'RECIPE_LIKE',
  'STORY_LIKE',
  'RECIPE_COMMENT',
  'STORY_COMMENT',
  'RECIPE_COMMENT_REPLY',
  'STORY_COMMENT_REPLY',
  'RECIPE_REVIEW',
  'RECIPE_REVIEW_REPLY',
  'SYSTEM'
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "NotificationType" NOT NULL,
  "targetPath" VARCHAR(500),
  "payload" JSONB NOT NULL DEFAULT '{}',
  "dedupeKey" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_recipientId_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Notification_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Notification_recipientId_dedupeKey_key"
ON "Notification"("recipientId", "dedupeKey");

CREATE INDEX "Notification_recipientId_readAt_createdAt_idx"
ON "Notification"("recipientId", "readAt", "createdAt" DESC);

CREATE INDEX "Notification_recipientId_createdAt_idx"
ON "Notification"("recipientId", "createdAt" DESC);
