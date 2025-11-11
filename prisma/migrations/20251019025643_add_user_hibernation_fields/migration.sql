-- RedefineTables
PRAGMA foreign_keys=OFF;

-- Create new User table with hibernation fields
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
    "lastActiveAt" DATETIME,
    "hibernatedAt" DATETIME,
    "isHibernated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy data from old User table
INSERT INTO "new_User" (
    "id", "externalId", "name", "email", "phone", "password", 
    "onboarded", "loginCount", "tripCount", "totalTripCount", 
    "currentTripEndDate", "role", "createdAt", "updatedAt"
)
SELECT 
    "id", "externalId", "name", "email", "phone", "password",
    "onboarded", "loginCount", "tripCount", "totalTripCount",
    "currentTripEndDate", "role", "createdAt", "updatedAt"
FROM "User";

-- Drop old User table
DROP TABLE "User";

-- Rename new User table
ALTER TABLE "new_User" RENAME TO "User";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isHibernated_lastActiveAt_idx" ON "User"("isHibernated", "lastActiveAt");

