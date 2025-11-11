-- CreateTable
CREATE TABLE "CruiseReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "productCode" TEXT,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "cruiseLine" TEXT,
    "shipName" TEXT,
    "travelDate" DATETIME,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CruiseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CruiseReview_rating_isApproved_isDeleted_idx" ON "CruiseReview"("rating", "isApproved", "isDeleted");

-- CreateIndex
CREATE INDEX "CruiseReview_productCode_isApproved_isDeleted_idx" ON "CruiseReview"("productCode", "isApproved", "isDeleted");

-- CreateIndex
CREATE INDEX "CruiseReview_createdAt_idx" ON "CruiseReview"("createdAt");

-- CreateIndex
CREATE INDEX "CruiseReview_userId_idx" ON "CruiseReview"("userId");

























