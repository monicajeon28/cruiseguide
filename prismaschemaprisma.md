// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./prisma/dev.db"
}

model User {
  id          String   @id @default(cuid())
  externalId  String?  @unique
  name        String?
  email       String?  @unique
  phone       String?
  password    String?
  onboarded   Boolean  @default(false) // 온보딩 완료 여부 추가
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Trip {
  id            String   @id @default(cuid())
  userId        String
  cruiseName    String
  companionType String
  destination   Json       // ← JSON 사용 권장
  startDate     String
  endDate       String
  nights        Int        @default(0)  // ← 없으면 추가
  days          Int        @default(0)  // ← 없으면 추가
  visitCount    Int        @default(1)  // ← 없으면 추가
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  @@index([userId, createdAt(sort: Desc)])
}

