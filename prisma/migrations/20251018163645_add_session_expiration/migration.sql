-- AlterTable
ALTER TABLE "Session" ADD COLUMN "expiresAt" DATETIME;

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
