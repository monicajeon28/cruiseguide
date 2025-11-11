-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    "lockedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "currentTripEndDate", "email", "externalId", "hibernatedAt", "id", "isHibernated", "lastActiveAt", "loginCount", "name", "onboarded", "password", "phone", "role", "totalTripCount", "tripCount", "updatedAt") SELECT "createdAt", "currentTripEndDate", "email", "externalId", "hibernatedAt", "id", "isHibernated", "lastActiveAt", "loginCount", "name", "onboarded", "password", "phone", "role", "totalTripCount", "tripCount", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_isHibernated_lastActiveAt_idx" ON "User"("isHibernated", "lastActiveAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
