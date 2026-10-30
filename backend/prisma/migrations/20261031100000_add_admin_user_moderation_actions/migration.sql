CREATE TYPE "AdminUserModerationActionType" AS ENUM ('WARNING', 'BANNED', 'UNBANNED');

CREATE TABLE "AdminUserModerationAction" (
  "id" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" "AdminUserModerationActionType" NOT NULL,
  "reason" TEXT NOT NULL,
  "emailQueuedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminUserModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminUserModerationAction_targetUserId_createdAt_idx"
  ON "AdminUserModerationAction"("targetUserId", "createdAt");
CREATE INDEX "AdminUserModerationAction_adminId_createdAt_idx"
  ON "AdminUserModerationAction"("adminId", "createdAt");

ALTER TABLE "AdminUserModerationAction"
  ADD CONSTRAINT "AdminUserModerationAction_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminUserModerationAction"
  ADD CONSTRAINT "AdminUserModerationAction_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
