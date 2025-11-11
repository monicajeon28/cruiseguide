/*
  Warnings:

  - You are about to alter the column `itineraryPattern` on the `CruiseProduct` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `keys` on the `PushSubscription` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `destination` on the `Trip` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `detailedFeedback` on the `TripFeedback` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- CreateTable
CREATE TABLE "TravelDiaryEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TravelDiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TravelDiaryEntry_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "question" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "metadata" JSONB,
    "language" TEXT NOT NULL DEFAULT 'ko',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChecklistItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChecklistItem" ("completed", "createdAt", "id", "order", "text", "tripId", "updatedAt", "userId") SELECT "completed", "createdAt", "id", "order", "text", "tripId", "updatedAt", "userId" FROM "ChecklistItem";
DROP TABLE "ChecklistItem";
ALTER TABLE "new_ChecklistItem" RENAME TO "ChecklistItem";
CREATE INDEX "ChecklistItem_userId_tripId_idx" ON "ChecklistItem"("userId", "tripId");
CREATE INDEX "ChecklistItem_order_idx" ON "ChecklistItem"("order");
CREATE TABLE "new_CruiseProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productCode" TEXT NOT NULL,
    "cruiseLine" TEXT NOT NULL,
    "shipName" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "itineraryPattern" JSONB NOT NULL,
    "basePrice" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CruiseProduct" ("basePrice", "createdAt", "cruiseLine", "days", "description", "id", "itineraryPattern", "nights", "packageName", "productCode", "shipName", "updatedAt") SELECT "basePrice", "createdAt", "cruiseLine", "days", "description", "id", "itineraryPattern", "nights", "packageName", "productCode", "shipName", "updatedAt" FROM "CruiseProduct";
DROP TABLE "CruiseProduct";
ALTER TABLE "new_CruiseProduct" RENAME TO "CruiseProduct";
CREATE UNIQUE INDEX "CruiseProduct_productCode_key" ON "CruiseProduct"("productCode");
CREATE INDEX "CruiseProduct_productCode_idx" ON "CruiseProduct"("productCode");
CREATE TABLE "new_Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "foreignAmount" REAL NOT NULL,
    "krwAmount" REAL NOT NULL,
    "usdAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("category", "createdAt", "currency", "description", "foreignAmount", "id", "krwAmount", "tripId", "updatedAt", "usdAmount", "userId") SELECT "category", "createdAt", "currency", "description", "foreignAmount", "id", "krwAmount", "tripId", "updatedAt", "usdAmount", "userId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_userId_tripId_idx" ON "Expense"("userId", "tripId");
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");
CREATE TABLE "new_PushSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PushSubscription" ("createdAt", "endpoint", "id", "keys", "updatedAt", "userAgent", "userId") SELECT "createdAt", "endpoint", "id", "keys", "updatedAt", "userAgent", "userId" FROM "PushSubscription";
DROP TABLE "PushSubscription";
ALTER TABLE "new_PushSubscription" RENAME TO "PushSubscription";
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE TABLE "new_Trip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER,
    "reservationCode" TEXT,
    "cruiseName" TEXT,
    "companionType" TEXT,
    "destination" JSONB,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "nights" INTEGER NOT NULL DEFAULT 0,
    "days" INTEGER NOT NULL DEFAULT 0,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trip_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CruiseProduct" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("companionType", "createdAt", "cruiseName", "days", "destination", "endDate", "id", "nights", "productId", "reservationCode", "startDate", "status", "updatedAt", "userId", "visitCount") SELECT "companionType", "createdAt", "cruiseName", "days", "destination", "endDate", "id", "nights", "productId", "reservationCode", "startDate", "status", "updatedAt", "userId", "visitCount" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE INDEX "Trip_userId_status_idx" ON "Trip"("userId", "status");
CREATE INDEX "Trip_startDate_idx" ON "Trip"("startDate");
CREATE TABLE "new_TripFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tripId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "satisfactionScore" INTEGER,
    "improvementComments" TEXT,
    "detailedFeedback" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripFeedback_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TripFeedback" ("createdAt", "detailedFeedback", "id", "improvementComments", "satisfactionScore", "tripId", "updatedAt", "userId") SELECT "createdAt", "detailedFeedback", "id", "improvementComments", "satisfactionScore", "tripId", "updatedAt", "userId" FROM "TripFeedback";
DROP TABLE "TripFeedback";
ALTER TABLE "new_TripFeedback" RENAME TO "TripFeedback";
CREATE UNIQUE INDEX "TripFeedback_tripId_key" ON "TripFeedback"("tripId");
CREATE INDEX "TripFeedback_userId_idx" ON "TripFeedback"("userId");
CREATE INDEX "TripFeedback_createdAt_idx" ON "TripFeedback"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TravelDiaryEntry_userId_tripId_idx" ON "TravelDiaryEntry"("userId", "tripId");

-- CreateIndex
CREATE INDEX "TravelDiaryEntry_userId_countryCode_idx" ON "TravelDiaryEntry"("userId", "countryCode");

-- CreateIndex
CREATE INDEX "TravelDiaryEntry_visitDate_idx" ON "TravelDiaryEntry"("visitDate");

-- CreateIndex
CREATE INDEX "KnowledgeBase_category_isActive_idx" ON "KnowledgeBase"("category", "isActive");

-- CreateIndex
CREATE INDEX "KnowledgeBase_keywords_idx" ON "KnowledgeBase"("keywords");
