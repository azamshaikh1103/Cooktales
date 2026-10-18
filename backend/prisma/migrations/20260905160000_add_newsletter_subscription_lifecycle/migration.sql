ALTER TABLE "NewsletterSubscriber"
ADD COLUMN "confirmationTokenHash" TEXT,
ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3),
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "unsubscribedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "NewsletterSubscriber"
SET "confirmedAt" = "createdAt"
WHERE "isActive" = true;

ALTER TABLE "NewsletterSubscriber"
ALTER COLUMN "isActive" SET DEFAULT false;

CREATE UNIQUE INDEX "NewsletterSubscriber_confirmationTokenHash_key"
ON "NewsletterSubscriber"("confirmationTokenHash");
