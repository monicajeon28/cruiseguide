/*
  Warnings:

  - You are about to drop the column `companion` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `impressions` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `isMemoTrip` on the `Trip` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_phone_key";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "destination" TEXT NOT NULL,
    "cruiseName" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("createdAt", "cruiseName", "destination", "endDate", "id", "startDate", "updatedAt", "userId") SELECT "createdAt", "cruiseName", "destination", "endDate", "id", "startDate", "updatedAt", "userId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
