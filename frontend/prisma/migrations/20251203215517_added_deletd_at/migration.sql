/*
  Warnings:

  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVerified",
DROP COLUMN "verified",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
