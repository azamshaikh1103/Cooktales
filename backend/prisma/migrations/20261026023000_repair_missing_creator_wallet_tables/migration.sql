DO $$
BEGIN
  CREATE TYPE "CreatorPayoutMethodType" AS ENUM ('UPI', 'PAYPAL', 'WISE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "CreatorPayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "CreatorWallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "availableUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "lifetimeEarnedUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorWallet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorWallet_userId_key" ON "CreatorWallet"("userId");

CREATE TABLE IF NOT EXISTS "CreatorPayoutMethod" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "method" "CreatorPayoutMethodType" NOT NULL,
  "legalName" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "encryptedDestination" TEXT NOT NULL,
  "maskedDestination" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorPayoutMethod_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorPayoutMethod_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CreatorWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorPayoutMethod_walletId_method_key" ON "CreatorPayoutMethod"("walletId", "method");
CREATE INDEX IF NOT EXISTS "CreatorPayoutMethod_walletId_isPrimary_idx" ON "CreatorPayoutMethod"("walletId", "isPrimary");

CREATE TABLE IF NOT EXISTS "CreatorEarning" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "amountUsd" DECIMAL(12,2) NOT NULL,
  "recipeViews" INTEGER NOT NULL DEFAULT 0,
  "storyViews" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorEarning_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CreatorWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreatorEarning_walletId_period_key" ON "CreatorEarning"("walletId", "period");
CREATE INDEX IF NOT EXISTS "CreatorEarning_period_idx" ON "CreatorEarning"("period");

CREATE TABLE IF NOT EXISTS "CreatorPayout" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "payoutMethodId" TEXT NOT NULL,
  "grossUsd" DECIMAL(12,2) NOT NULL,
  "feeUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "netUsd" DECIMAL(12,2) NOT NULL,
  "status" "CreatorPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CreatorPayout_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CreatorWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CreatorPayout_payoutMethodId_fkey" FOREIGN KEY ("payoutMethodId") REFERENCES "CreatorPayoutMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CreatorPayout_walletId_createdAt_idx" ON "CreatorPayout"("walletId", "createdAt");
