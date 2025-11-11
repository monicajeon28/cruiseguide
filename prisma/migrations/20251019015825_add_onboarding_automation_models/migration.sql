-- CreateTable
CREATE TABLE "CruiseProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productCode" TEXT NOT NULL,
    "cruiseLine" TEXT NOT NULL,
    "shipName" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "itineraryPattern" TEXT NOT NULL,
    "basePrice" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tripId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "country" TEXT,
    "currency" TEXT,
    "language" TEXT,
    "arrival" TEXT,
    "departure" TEXT,
    "time" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Itinerary_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisitedCountry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 1,
    "lastVisited" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitedCountry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;

-- Create new Trip table with updated schema
CREATE TABLE "new_Trip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER,
    "reservationCode" TEXT,
    "cruiseName" TEXT,
    "companionType" TEXT,
    "destination" TEXT,
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

-- Copy data from old Trip table to new Trip table
INSERT INTO "new_Trip" ("id", "userId", "cruiseName", "companionType", "destination", "startDate", "endDate", "nights", "days", "visitCount", "createdAt", "updatedAt")
SELECT "id", "userId", "cruiseName", "companionType", "destination", 
       CASE WHEN "startDate" IS NOT NULL AND "startDate" != '' THEN datetime("startDate") ELSE NULL END,
       CASE WHEN "endDate" IS NOT NULL AND "endDate" != '' THEN datetime("endDate") ELSE NULL END,
       "nights", "days", "visitCount", "createdAt", "updatedAt"
FROM "Trip";

-- Drop old Trip table
DROP TABLE "Trip";

-- Rename new Trip table
ALTER TABLE "new_Trip" RENAME TO "Trip";

-- Create new User table with totalTripCount
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "tripCount" INTEGER NOT NULL DEFAULT 0,
    "totalTripCount" INTEGER NOT NULL DEFAULT 0,
    "currentTripEndDate" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy data from old User table
INSERT INTO "new_User" ("id", "externalId", "name", "email", "phone", "password", "onboarded", "loginCount", "tripCount", "currentTripEndDate", "role", "createdAt", "updatedAt")
SELECT "id", "externalId", "name", "email", "phone", "password", "onboarded", "loginCount", "tripCount", "currentTripEndDate", "role", "createdAt", "updatedAt"
FROM "User";

-- Drop old User table
DROP TABLE "User";

-- Rename new User table
ALTER TABLE "new_User" RENAME TO "User";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "CruiseProduct_productCode_key" ON "CruiseProduct"("productCode");

-- CreateIndex
CREATE INDEX "CruiseProduct_productCode_idx" ON "CruiseProduct"("productCode");

-- CreateIndex
CREATE INDEX "Itinerary_tripId_day_idx" ON "Itinerary"("tripId", "day");

-- CreateIndex
CREATE INDEX "Itinerary_date_idx" ON "Itinerary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "VisitedCountry_userId_countryCode_key" ON "VisitedCountry"("userId", "countryCode");

-- CreateIndex
CREATE INDEX "VisitedCountry_userId_idx" ON "VisitedCountry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trip_userId_status_idx" ON "Trip"("userId", "status");

-- CreateIndex
CREATE INDEX "Trip_startDate_idx" ON "Trip"("startDate");

