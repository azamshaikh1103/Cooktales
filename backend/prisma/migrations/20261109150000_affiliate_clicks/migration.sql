-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "recipeSlug" TEXT NOT NULL,
    "recipeName" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "itemKind" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "userId" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt");

-- CreateIndex
CREATE INDEX "AffiliateClick_recipeId_createdAt_idx" ON "AffiliateClick"("recipeId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateClick_creatorId_createdAt_idx" ON "AffiliateClick"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateClick_domain_createdAt_idx" ON "AffiliateClick"("domain", "createdAt");

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
