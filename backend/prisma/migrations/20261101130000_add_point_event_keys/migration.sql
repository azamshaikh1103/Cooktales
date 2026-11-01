ALTER TABLE "PointHistory" ADD COLUMN "eventKey" TEXT;
CREATE UNIQUE INDEX "PointHistory_eventKey_key" ON "PointHistory"("eventKey");
CREATE INDEX "PointHistory_userId_createdAt_idx" ON "PointHistory"("userId", "createdAt");
