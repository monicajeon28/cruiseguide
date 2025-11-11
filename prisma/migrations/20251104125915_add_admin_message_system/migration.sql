/*
  Warnings:

  - You are about to drop the column `amount` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `amountInKRW` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `day` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `foreignAmount` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `krwAmount` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usdAmount` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN "allAboardAt" DATETIME;
ALTER TABLE "Itinerary" ADD COLUMN "arrivalAt" DATETIME;
ALTER TABLE "Itinerary" ADD COLUMN "portLat" REAL;
ALTER TABLE "Itinerary" ADD COLUMN "portLng" REAL;

-- CreateTable
CREATE TABLE "AdminMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adminId" INTEGER NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'info',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sendAt" DATETIME,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminMessage_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserMessageRead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AdminMessage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_Expense" ("category", "createdAt", "currency", "description", "id", "tripId", "updatedAt") SELECT "category", "createdAt", "currency", "description", "id", "tripId", "updatedAt" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_userId_tripId_idx" ON "Expense"("userId", "tripId");
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AdminMessage_userId_isActive_createdAt_idx" ON "AdminMessage"("userId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "AdminMessage_adminId_createdAt_idx" ON "AdminMessage"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "UserMessageRead_userId_readAt_idx" ON "UserMessageRead"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserMessageRead_userId_messageId_key" ON "UserMessageRead"("userId", "messageId");
