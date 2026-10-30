-- Keep a permanent record of every admin hide or restore action.
CREATE TYPE "AdminRecipeModerationActionType" AS ENUM ('HIDDEN', 'RESTORED');

CREATE TABLE "AdminRecipeModerationAction" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminRecipeModerationActionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRecipeModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminRecipeModerationAction_recipeId_createdAt_idx"
ON "AdminRecipeModerationAction"("recipeId", "createdAt");

CREATE INDEX "AdminRecipeModerationAction_adminId_createdAt_idx"
ON "AdminRecipeModerationAction"("adminId", "createdAt");

ALTER TABLE "AdminRecipeModerationAction"
ADD CONSTRAINT "AdminRecipeModerationAction_recipeId_fkey"
FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminRecipeModerationAction"
ADD CONSTRAINT "AdminRecipeModerationAction_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
