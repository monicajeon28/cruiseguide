-- Migration: migrate_tools_to_server
-- 가계부와 체크리스트 데이터를 서버 DB로 마이그레이션

-- ChecklistItem과 Expense 테이블이 없으면 생성
-- (이미 존재하면 에러 방지)

-- Expense 테이블이 이미 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS "Expense" (
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
    "updatedAt" DATETIME NOT NULL
);

-- ChecklistItem 테이블이 이미 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS "ChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "text" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 인덱스 생성 (이미 존재하면 무시)
CREATE INDEX IF NOT EXISTS "Expense_userId_tripId_idx" ON "Expense"("userId", "tripId");
CREATE INDEX IF NOT EXISTS "Expense_createdAt_idx" ON "Expense"("createdAt");

CREATE INDEX IF NOT EXISTS "ChecklistItem_userId_tripId_idx" ON "ChecklistItem"("userId", "tripId");
CREATE INDEX IF NOT EXISTS "ChecklistItem_order_idx" ON "ChecklistItem"("order");

