-- CreateEnum
CREATE TYPE "PendingMediaStatus" AS ENUM ('PENDING', 'UPLOADED', 'ATTACHED', 'DELETED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "usernameChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UsernameRedirect" (
    "id" TEXT NOT NULL,
    "oldUsername" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsernameRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingMediaUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "entityId" TEXT,
    "resourceType" "CloudinaryResourceType" NOT NULL DEFAULT 'IMAGE',
    "status" "PendingMediaStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "format" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "attachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingMediaUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsernameRedirect_oldUsername_key" ON "UsernameRedirect"("oldUsername");
CREATE INDEX "UsernameRedirect_userId_idx" ON "UsernameRedirect"("userId");
CREATE UNIQUE INDEX "PendingMediaUpload_publicId_key" ON "PendingMediaUpload"("publicId");
CREATE INDEX "PendingMediaUpload_userId_status_idx" ON "PendingMediaUpload"("userId", "status");
CREATE INDEX "PendingMediaUpload_status_expiresAt_idx" ON "PendingMediaUpload"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "UsernameRedirect" ADD CONSTRAINT "UsernameRedirect_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PendingMediaUpload" ADD CONSTRAINT "PendingMediaUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
