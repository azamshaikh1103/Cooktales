/*
  Warnings:

  - You are about to drop the column `isLocked` on the `Discussion` table. All the data in the column will be lost.
  - You are about to drop the column `isPinned` on the `Discussion` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `Discussion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Discussion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Discussion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "isLocked",
DROP COLUMN "isPinned",
DROP COLUMN "viewCount",
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Discussion_slug_key" ON "Discussion"("slug");
