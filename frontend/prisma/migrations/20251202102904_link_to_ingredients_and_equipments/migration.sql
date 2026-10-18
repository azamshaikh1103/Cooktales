/*
  Warnings:

  - You are about to drop the column `entityId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `profilePic` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `contactDetails` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `moreImages` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,recipeId]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,blogId]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,followerId]` on the table `Follower` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,followingId]` on the table `Following` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,recipeId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MeasurementSystem" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'SOUS_CHEF', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID');

-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "Follower" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Following" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "name",
DROP COLUMN "profilePic",
ADD COLUMN     "blogId" TEXT,
ADD COLUMN     "recipeId" TEXT,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "stars" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "contactDetails",
DROP COLUMN "moreImages",
ADD COLUMN     "appSettings" JSONB DEFAULT '{}',
ADD COLUMN     "badges" TEXT[],
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "isPro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "measurementSystem" "MeasurementSystem" NOT NULL DEFAULT 'METRIC',
ADD COLUMN     "mission" TEXT,
ADD COLUMN     "notificationPreferences" JSONB DEFAULT '{}',
ADD COLUMN     "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planEndsAt" TIMESTAMP(3),
ADD COLUMN     "planStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "signature" TEXT,
ADD COLUMN     "socialLinks" JSONB DEFAULT '{}',
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "website" TEXT;

-- DropEnum
DROP TYPE "entityType";

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "invoicePdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "discussionId" TEXT,
    "recipeId" TEXT,
    "blogId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT,
    "prize" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeEntry" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discussionId" TEXT,
    "commentId" TEXT,
    "recipeId" TEXT,
    "blogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecipeCollections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecipeCollections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeEntry_challengeId_recipeId_key" ON "ChallengeEntry"("challengeId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeEntry_challengeId_userId_key" ON "ChallengeEntry"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_recipeId_key" ON "Like"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_blogId_key" ON "Like"("userId", "blogId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_discussionId_key" ON "Like"("userId", "discussionId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_commentId_key" ON "Like"("userId", "commentId");

-- CreateIndex
CREATE INDEX "_RecipeCollections_B_index" ON "_RecipeCollections"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_recipeId_key" ON "Bookmark"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_blogId_key" ON "Bookmark"("userId", "blogId");

-- CreateIndex
CREATE UNIQUE INDEX "Follower_userId_followerId_key" ON "Follower"("userId", "followerId");

-- CreateIndex
CREATE UNIQUE INDEX "Following_userId_followingId_key" ON "Following"("userId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_recipeId_key" ON "Rating"("userId", "recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "User"("subscriptionId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeEntry" ADD CONSTRAINT "ChallengeEntry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeEntry" ADD CONSTRAINT "ChallengeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeEntry" ADD CONSTRAINT "ChallengeEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecipeCollections" ADD CONSTRAINT "_RecipeCollections_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecipeCollections" ADD CONSTRAINT "_RecipeCollections_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
