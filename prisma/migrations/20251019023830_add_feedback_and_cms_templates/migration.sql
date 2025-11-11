-- CreateTable: TripFeedback
CREATE TABLE "TripFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tripId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "satisfactionScore" INTEGER,
    "improvementComments" TEXT,
    "detailedFeedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripFeedback_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: CmsNotificationTemplate
CREATE TABLE "CmsNotificationTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "triggerCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TripFeedback_tripId_key" ON "TripFeedback"("tripId");

-- CreateIndex
CREATE INDEX "TripFeedback_userId_idx" ON "TripFeedback"("userId");

-- CreateIndex
CREATE INDEX "TripFeedback_createdAt_idx" ON "TripFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsNotificationTemplate_triggerCode_key" ON "CmsNotificationTemplate"("triggerCode");

-- CreateIndex
CREATE INDEX "CmsNotificationTemplate_triggerCode_isActive_idx" ON "CmsNotificationTemplate"("triggerCode", "isActive");

