-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_userId_reviewId_key" ON "ReviewVote"("userId", "reviewId");

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
