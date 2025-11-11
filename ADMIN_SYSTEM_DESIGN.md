# 관리자 시스템 설계서

> 작성일: 2025-11-04  
> 목적: 고객 데이터 통제, 데이터 축적, 마케팅/비즈니스 모델 확장

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [핵심 목표](#2-핵심-목표)
3. [데이터 수집 전략](#3-데이터-수집-전략)
4. [관리자 페이지 구조](#4-관리자-페이지-구조)
5. [고객 생애주기 관리](#5-고객-생애주기-관리)
6. [보안 및 접근 제어](#6-보안-및-접근-제어)
7. [마케팅 데이터 활용](#7-마케팅-데이터-활용)
8. [재구매 유도 시스템](#8-재구매-유도-시스템)

---

## 1. 시스템 개요

### 1.1 현재 상태

**✅ 이미 구현된 부분**:
- 관리자 로그인 페이지 (`/admin/login`)
- 관리자 대시보드 (`/admin/dashboard`)
- 기본 인증 시스템 (`role: 'admin'`)
- 일부 관리 기능 (고객 조회, 사용자 관리)

**❌ 미구현/보완 필요**:
- 고객 데이터 통제 기능 (비밀번호 변경, 계정 잠금 등)
- 종합 데이터 분석 대시보드
- 여행 종료 후 1일 사용 제한 시스템
- 재구매 유도 메시지 시스템

---

### 1.2 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    관리자 페이지                         │
├─────────────────────────────────────────────────────────┤
│ 1. 대시보드 (통계, 트렌드)                              │
│ 2. 고객 관리 (CRUD, 통제)                               │
│ 3. 여행 관리 (여행 데이터 조회/수정)                    │
│ 4. 데이터 분석 (마케팅 인사이트)                        │
│ 5. 시스템 설정 (알림 템플릿, 권한 관리)                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    데이터 레이어                        │
├─────────────────────────────────────────────────────────┤
│ User, Trip, Expense, ChecklistItem, ChatHistory,        │
│ TravelDiaryEntry, VisitedCountry, TripFeedback, etc.   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 핵심 목표

### 2.1 고객 통제 (Security & Control)

**필요 기능**:
1. **비밀번호 관리**
   - 관리자가 비밀번호 초기화/변경 가능
   - 비밀번호 변경 이력 추적 (`PasswordEvent`)
   - 강제 비밀번호 변경 요구

2. **계정 관리**
   - 계정 잠금/해제
   - 계정 활성화/비활성화
   - 로그인 제한 (특정 IP, 시간대 등)

3. **세션 관리**
   - 모든 활성 세션 조회
   - 특정 세션 강제 종료
   - 세션 이력 추적

---

### 2.2 데이터 축적 (Data Collection)

**수집 대상 데이터**:
1. **사용자 행동 데이터**
   - 로그인 패턴 (`LoginLog`)
   - 기능 사용 빈도 (채팅, 체크리스트, 가계부 등)
   - 페이지 방문 이력

2. **여행 데이터**
   - 여행 패턴 (목적지, 기간, 동반자 타입)
   - 지출 패턴 (`Expense` 분석)
   - 체크리스트 완성도 (`ChecklistItem`)
   - 다이어리 작성 여부 (`TravelDiaryEntry`)

3. **AI 상호작용 데이터**
   - 채팅 히스토리 (`ChatHistory`)
   - 질문 유형 분석
   - 만족도 피드백 (`TripFeedback`)

4. **마케팅 데이터**
   - 재구매 여부 추적
   - 여행 종료 후 재방문 여부
   - 추천 상품 반응률

---

### 2.3 재구매 유도 (Retention & Upsell)

**필요 기능**:
1. **여행 종료 후 1일 사용 제한**
   - `Trip.endDate + 1일`까지 접근 허용
   - 이후 자동 로그아웃 또는 제한 모드
   - "다음 여행 등록하기" 유도 메시지

2. **재구매 유도 메시지**
   - 여행 종료 D-1일 알림
   - 여행 종료 후 1일 경과 시 재구매 유도
   - 맞춤형 상품 추천

---

## 3. 데이터 수집 전략

### 3.1 사용자 행동 추적

**추가 필요 모델**:
```prisma
model UserActivity {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  action      String   // 'chat', 'checklist', 'wallet', 'map', 'translator'
  page        String   // 페이지 경로
  metadata    Json?    // 추가 정보 (JSON)
  
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([action, createdAt])
}

model FeatureUsage {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  feature     String   // 'ai_chat', 'checklist', 'wallet', 'map', 'translator'
  usageCount  Int      @default(1)
  lastUsedAt  DateTime @default(now())
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, feature])
  @@index([feature, usageCount])
}
```

---

### 3.2 마케팅 인사이트 수집

**추가 필요 모델**:
```prisma
model MarketingInsight {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  insightType String   // 'destination_preference', 'spending_pattern', 'feature_usage'
  data        Json     // 인사이트 데이터 (JSON)
  
  createdAt   DateTime @default(now())
  
  @@index([userId, insightType])
}

model RePurchaseTrigger {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  lastTripEndDate DateTime
  triggerType String   // 'grace_period_end', 'revisit_prompt', 'product_recommendation'
  messageSent Boolean  @default(false)
  converted   Boolean  @default(false) // 재구매로 전환되었는지
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId, lastTripEndDate])
  @@index([converted, createdAt])
}
```

---

## 4. 관리자 페이지 구조

### 4.1 페이지 구조도

```
/admin
├── /login                    # 관리자 로그인 (기존)
├── /dashboard               # 대시보드 (기존, 확장 필요)
│   ├── 통계 요약
│   ├── 트렌드 차트
│   ├── 실시간 모니터링
│   └── 알림/경고
│
├── /customers               # 고객 관리 (기존, 확장 필요)
│   ├── /list               # 고객 목록
│   ├── /[userId]           # 고객 상세
│   │   ├── 기본 정보
│   │   ├── 여행 이력
│   │   ├── 활동 로그
│   │   ├── 보안 관리 (비밀번호, 계정 잠금)
│   │   └── 세션 관리
│   └── /search             # 고객 검색/필터
│
├── /trips                  # 여행 관리
│   ├── /list               # 전체 여행 목록
│   ├── /[tripId]           # 여행 상세
│   │   ├── 여행 정보
│   │   ├── 일정 (Itinerary)
│   │   ├── 지출 내역
│   │   ├── 체크리스트
│   │   ├── 다이어리
│   │   └── 채팅 히스토리
│   └── /analytics          # 여행 데이터 분석
│
├── /data-analytics         # 데이터 분석 (신규)
│   ├── 사용자 행동 분석
│   ├── 기능 사용 통계
│   ├── 여행 패턴 분석
│   ├── 지출 패턴 분석
│   └── 재구매율 분석
│
├── /marketing              # 마케팅 관리 (신규)
│   ├── 재구매 유도 설정
│   ├── 추천 상품 관리
│   ├── 알림 메시지 관리
│   └── 캠페인 관리
│
├── /settings               # 시스템 설정 (신규)
│   ├── 알림 템플릿 관리
│   ├── 권한 관리
│   ├── 여행 종료 후 사용 제한 설정
│   └── 시스템 설정
│
└── /security               # 보안 관리 (신규)
    ├── 로그인 로그
    ├── 세션 관리
    ├── 비밀번호 정책
    └── 접근 제어
```

---

### 4.2 대시보드 개선

**현재 대시보드 확장**:
1. **실시간 통계**
   - 현재 활성 사용자 수
   - 오늘 접속자 수
   - 오늘 생성된 여행 수
   - 오늘 지출 총액

2. **트렌드 차트**
   - 사용자 증가 추이 (주간/월간)
   - 여행 생성 추이
   - 기능 사용 추이
   - 재구매율 추이

3. **알림/경고**
   - 여행 종료 예정 고객 (D-1일)
   - 비정상 활동 감지
   - 시스템 오류

---

## 5. 고객 생애주기 관리

### 5.1 고객 상태 관리

**고객 상태 정의**:
```typescript
type CustomerStatus = 
  | 'active'           // 활성 (여행 중 또는 여행 예정)
  | 'grace_period'     // 여행 종료 후 1일 유예 기간
  | 'expired'          // 유예 기간 종료 (재구매 유도 필요)
  | 'inactive'         // 비활성 (오랜 기간 미접속)
  | 'hibernated'       // 동면 상태 (자동 비활성화)
  | 'locked'           // 관리자에 의해 잠금
```

**상태 전환 로직**:
```
신규 가입 → active
여행 등록 → active
여행 종료 → grace_period (1일)
grace_period 종료 → expired (재구매 유도)
재구매/재등록 → active
30일 미접속 → inactive
90일 미접속 → hibernated
관리자 잠금 → locked
```

---

### 5.2 여행 종료 후 1일 사용 제한

**구현 방법**:
1. **서버 사이드 체크**:
   ```typescript
   // 모든 API 엔드포인트에서 체크
   async function checkUserAccess(userId: number) {
     const user = await prisma.user.findUnique({
       where: { id: userId },
       include: { trips: { orderBy: { endDate: 'desc' }, take: 1 } }
     });
     
     const latestTrip = user.trips[0];
     if (!latestTrip) return true; // 여행 없으면 허용
     
     const endDate = new Date(latestTrip.endDate);
     const gracePeriodEnd = new Date(endDate);
     gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // +1일
     
     const now = new Date();
     if (now > gracePeriodEnd) {
       // 유예 기간 종료
       return {
         allowed: false,
         message: '여행이 종료되었습니다. 새로운 여행을 등록해 주세요.',
         redirectTo: '/onboarding'
       };
     }
     
     return { allowed: true };
   }
   ```

2. **클라이언트 사이드 체크**:
   ```typescript
   // 페이지 로드 시 체크
   useEffect(() => {
     const checkAccess = async () => {
       const res = await fetch('/api/user/access-check');
       const data = await res.json();
       
       if (!data.allowed) {
         // 모달 표시 또는 리다이렉트
         setShowRePurchaseModal(true);
       }
     };
     
     checkAccess();
   }, []);
   ```

---

### 5.3 재구매 유도 시스템

**트리거 시점**:
1. **여행 종료 D-1일**: "내일 여행이 종료됩니다. 다음 여행을 계획해 보세요!"
2. **유예 기간 종료**: "여행이 종료되었습니다. 새로운 여행을 등록하시면 지니를 다시 만나실 수 있습니다!"
3. **재방문 시**: "오랜만이에요! 새로운 여행을 시작해 보세요!"

**유도 메시지**:
- 맞춤형 상품 추천 (이전 여행 패턴 기반)
- 할인 혜택 제공 (선택)
- "다음 여행 등록하기" 버튼 강조

---

## 6. 보안 및 접근 제어

### 6.1 관리자 권한 관리

**권한 레벨**:
```typescript
type AdminRole = 
  | 'super_admin'    // 최고 관리자 (모든 권한)
  | 'admin'          // 일반 관리자 (고객 관리, 데이터 조회)
  | 'analyst'        // 분석가 (데이터 조회만)
  | 'support'        // 고객 지원 (고객 정보 조회, 비밀번호 초기화)
```

**권한별 기능**:
- `super_admin`: 모든 기능 + 시스템 설정
- `admin`: 고객 관리, 여행 관리, 데이터 분석
- `analyst`: 데이터 조회만 (수정 불가)
- `support`: 고객 정보 조회, 비밀번호 초기화

---

### 6.2 고객 데이터 통제 기능

**필요 기능**:
1. **비밀번호 관리**
   - 비밀번호 초기화 (임시 비밀번호 생성)
   - 비밀번호 강제 변경 요구
   - 비밀번호 변경 이력 조회

2. **계정 관리**
   - 계정 잠금/해제
   - 계정 활성화/비활성화
   - 계정 삭제 (GDPR 준수)

3. **세션 관리**
   - 모든 활성 세션 조회
   - 특정 세션 강제 종료
   - 세션 이력 추적

4. **접근 제한**
   - 특정 기능 접근 제한
   - IP 화이트리스트/블랙리스트
   - 시간대별 접근 제한

---

## 7. 마케팅 데이터 활용

### 7.1 데이터 분석 대시보드

**분석 항목**:
1. **사용자 행동 분석**
   - 가장 많이 사용하는 기능
   - 기능별 사용 시간
   - 기능별 만족도

2. **여행 패턴 분석**
   - 인기 목적지 순위
   - 여행 기간 분포
   - 동반자 타입 분포
   - 계절별 여행 패턴

3. **지출 패턴 분석**
   - 카테고리별 지출 비율
   - 목적지별 평균 지출
   - 일별 지출 추이

4. **재구매 분석**
   - 재구매율
   - 재구매까지 걸리는 시간
   - 재구매 고객 특성

---

### 7.2 마케팅 인사이트 생성

**자동 생성 인사이트**:
1. **목적지 선호도**
   ```json
   {
     "userId": 123,
     "preferredDestinations": ["일본", "홍콩"],
     "avoidDestinations": ["중국"],
     "nextRecommendations": ["대만", "싱가포르"]
   }
   ```

2. **지출 패턴**
   ```json
   {
     "userId": 123,
     "spendingLevel": "high", // low, medium, high
     "preferredCategories": ["쇼핑", "식사"],
     "averageDailySpending": 150000
   }
   ```

3. **재구매 가능성 점수**
   ```json
   {
     "userId": 123,
     "rePurchaseScore": 0.85, // 0-1
     "factors": {
       "engagement": 0.9,
       "satisfaction": 0.8,
       "timeSinceLastTrip": 0.7
     }
   }
   ```

---

## 8. 재구매 유도 시스템

### 8.1 유도 메시지 시스템

**메시지 타입**:
1. **여행 종료 D-1일 알림**
   - 푸시 알림: "내일 여행이 종료됩니다. 다음 여행을 계획해 보세요!"
   - 채팅 화면 배너: "다음 여행 등록하기" 버튼

2. **유예 기간 종료 알림**
   - 로그인 시 모달: "여행이 종료되었습니다. 새로운 여행을 등록하시면 지니를 다시 만나실 수 있습니다!"
   - 기능 접근 제한: 모든 기능에 "다음 여행 등록하기" 버튼 표시

3. **재방문 시 유도**
   - 맞춤형 상품 추천
   - 이전 여행 패턴 기반 추천

---

### 8.2 재구매 전환 추적

**추적 항목**:
- 유도 메시지 노출 횟수
- "다음 여행 등록하기" 클릭 횟수
- 재구매 전환 여부
- 재구매까지 걸리는 시간

**분석 지표**:
- CTR (Click-Through Rate)
- 전환율 (Conversion Rate)
- 평균 전환 시간

---

## 9. 구현 우선순위

### 🔴 Phase 1: 긴급 (1주일)
1. 관리자 로그인 개선 (일반 로그인 페이지에 링크 추가)
2. 고객 관리 기능 확장 (비밀번호 관리, 계정 잠금)
3. 여행 종료 후 1일 사용 제한 시스템
4. 재구매 유도 메시지 기본 구현

### 🟡 Phase 2: 중요 (2주일)
5. 데이터 분석 대시보드
6. 마케팅 인사이트 생성 시스템
7. 사용자 행동 추적 (UserActivity 모델)
8. 재구매 전환 추적 시스템

### 🟢 Phase 3: 개선 (1개월)
9. 고급 분석 기능
10. 자동화된 마케팅 캠페인
11. A/B 테스트 시스템
12. 리포트 생성 및 내보내기

---

## 10. 데이터베이스 스키마 확장

### 10.1 필요한 모델 추가

```prisma
// 사용자 활동 추적
model UserActivity {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  action      String   // 'chat', 'checklist', 'wallet', 'map', 'translator'
  page        String   // 페이지 경로
  metadata    Json?    // 추가 정보
  
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([action, createdAt])
}

// 기능 사용 통계
model FeatureUsage {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  feature     String   // 'ai_chat', 'checklist', 'wallet', 'map', 'translator'
  usageCount  Int      @default(1)
  lastUsedAt  DateTime @default(now())
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, feature])
  @@index([feature, usageCount])
}

// 마케팅 인사이트
model MarketingInsight {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  insightType String   // 'destination_preference', 'spending_pattern', 'feature_usage'
  data        Json     // 인사이트 데이터
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId, insightType])
}

// 재구매 유도 트리거
model RePurchaseTrigger {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  
  lastTripEndDate DateTime
  triggerType String   // 'grace_period_end', 'revisit_prompt', 'product_recommendation'
  messageSent Boolean  @default(false)
  converted   Boolean  @default(false) // 재구매로 전환되었는지
  convertedAt DateTime?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId, lastTripEndDate])
  @@index([converted, createdAt])
}

// 관리자 액션 로그
model AdminActionLog {
  id          Int      @id @default(autoincrement())
  adminId     Int      // 관리자 User ID
  admin       User     @relation("AdminActions", fields: [adminId], references: [id])
  
  targetUserId Int?    // 대상 사용자 ID
  action      String   // 'password_reset', 'account_lock', 'trip_edit', etc.
  details     Json?    // 상세 정보
  
  createdAt   DateTime @default(now())
  
  @@index([adminId, createdAt])
  @@index([targetUserId, createdAt])
}
```

**User 모델 확장**:
```prisma
model User {
  // ... 기존 필드 ...
  
  // 관리자 액션 로그
  adminActions AdminActionLog[] @relation("AdminActions")
  
  // 새로 추가된 관계
  activities   UserActivity[]
  featureUsages FeatureUsage[]
  marketingInsights MarketingInsight[]
  rePurchaseTriggers RePurchaseTrigger[]
}
```

---

## 11. API 엔드포인트 설계

### 11.1 관리자 API

```
/admin
├── /auth
│   ├── POST /login              # 관리자 로그인
│   └── POST /logout             # 관리자 로그아웃
│
├── /users
│   ├── GET /                    # 사용자 목록 (필터, 검색, 페이지네이션)
│   ├── GET /[userId]            # 사용자 상세
│   ├── PUT /[userId]            # 사용자 정보 수정
│   ├── POST /[userId]/reset-password  # 비밀번호 초기화
│   ├── POST /[userId]/lock      # 계정 잠금
│   ├── POST /[userId]/unlock    # 계정 잠금 해제
│   ├── GET /[userId]/sessions   # 세션 목록
│   ├── DELETE /[userId]/sessions/[sessionId]  # 세션 강제 종료
│   └── GET /[userId]/activities # 활동 로그
│
├── /trips
│   ├── GET /                    # 여행 목록
│   ├── GET /[tripId]            # 여행 상세
│   ├── PUT /[tripId]            # 여행 정보 수정
│   └── GET /analytics            # 여행 데이터 분석
│
├── /analytics
│   ├── GET /users               # 사용자 행동 분석
│   ├── GET /features            # 기능 사용 통계
│   ├── GET /trips               # 여행 패턴 분석
│   ├── GET /spending            # 지출 패턴 분석
│   └── GET /rePurchase          # 재구매율 분석
│
├── /marketing
│   ├── GET /insights            # 마케팅 인사이트
│   ├── GET /triggers            # 재구매 유도 트리거 목록
│   ├── POST /triggers/send      # 재구매 유도 메시지 발송
│   └── GET /campaigns           # 캠페인 목록
│
└── /settings
    ├── GET /access-policy       # 접근 제한 정책 조회
    ├── PUT /access-policy        # 접근 제한 정책 수정
    └── GET /logs                # 관리자 액션 로그
```

### 11.2 고객 API (수정 필요)

```
/api/user
├── GET /access-check            # 접근 권한 체크 (신규)
│   └── 여행 종료 후 1일 경과 여부 확인
│
└── GET /status                  # 사용자 상태 조회 (신규)
    └── active, grace_period, expired 등
```

---

## 12. UI/UX 설계

### 12.1 관리자 로그인 페이지 개선

**일반 로그인 페이지에 링크 추가**:
```typescript
// app/login/page.tsx
<div className="mt-4 text-center">
  <Link href="/admin/login" className="text-sm text-gray-500 hover:text-gray-700">
    관리자 로그인
  </Link>
</div>
```

---

### 12.2 고객 관리 페이지

**필요 기능**:
1. **고객 목록**
   - 검색 (이름, 전화번호, 이메일)
   - 필터 (상태, 여행 횟수, 마지막 접속일)
   - 정렬 (가입일, 마지막 접속일, 여행 횟수)
   - 페이지네이션

2. **고객 상세 페이지**
   - 기본 정보 (이름, 전화번호, 이메일, 가입일)
   - 여행 이력 (목록, 상세)
   - 활동 로그 (최근 활동)
   - 보안 관리 (비밀번호, 계정 잠금, 세션)
   - 데이터 분석 (기능 사용 통계, 지출 패턴)

---

### 12.3 데이터 분석 페이지

**필요 차트**:
1. 사용자 증가 추이 (라인 차트)
2. 기능 사용 통계 (파이 차트)
3. 여행 패턴 분석 (막대 차트)
4. 지출 패턴 분석 (히트맵)
5. 재구매율 분석 (라인 차트)

---

## 13. 보안 고려사항

### 13.1 관리자 인증 강화

**필요 기능**:
1. **2단계 인증 (2FA)** (선택)
2. **IP 화이트리스트** (선택)
3. **세션 타임아웃** (30분 미활동 시 자동 로그아웃)
4. **관리자 액션 로그** (모든 관리자 행동 기록)

---

### 13.2 고객 데이터 보호

**GDPR 준수**:
1. **데이터 삭제 요청 대응**
2. **데이터 내보내기 기능**
3. **개인정보 마스킹** (화면 표시 시)

---

## 14. 구현 계획

### 14.1 Phase 1: 기본 기능 (1주일)

**작업 목록**:
1. [ ] 관리자 로그인 페이지 개선 (일반 로그인에 링크 추가)
2. [ ] 고객 관리 페이지 확장
   - 비밀번호 초기화 기능
   - 계정 잠금/해제 기능
   - 세션 관리 기능
3. [ ] 여행 종료 후 1일 사용 제한 시스템
   - API 엔드포인트 추가 (`/api/user/access-check`)
   - 클라이언트 사이드 체크
4. [ ] 재구매 유도 메시지 기본 구현
   - 모달 컴포넌트
   - 메시지 템플릿

---

### 14.2 Phase 2: 데이터 수집 (2주일)

**작업 목록**:
5. [ ] 데이터베이스 스키마 확장
   - `UserActivity` 모델 추가
   - `FeatureUsage` 모델 추가
   - `MarketingInsight` 모델 추가
   - `RePurchaseTrigger` 모델 추가
6. [ ] 사용자 행동 추적 시스템
   - 모든 주요 액션 로깅
   - 기능 사용 통계 수집
7. [ ] 데이터 분석 대시보드
   - 통계 API 엔드포인트
   - 차트 컴포넌트
8. [ ] 마케팅 인사이트 생성 시스템
   - 자동 인사이트 생성 로직
   - 추천 알고리즘

---

### 14.3 Phase 3: 고급 기능 (1개월)

**작업 목록**:
9. [ ] 재구매 전환 추적 시스템
10. [ ] 자동화된 마케팅 캠페인
11. [ ] 리포트 생성 및 내보내기 (CSV, PDF)
12. [ ] A/B 테스트 시스템

---

## 15. 예상 개발 시간

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| Phase 1 | 기본 기능 | 40-50시간 |
| Phase 2 | 데이터 수집 | 60-80시간 |
| Phase 3 | 고급 기능 | 80-100시간 |
| **총계** | | **180-230시간** |

---

## 16. 결론

### 핵심 설계 원칙

1. **데이터 중심**: 모든 사용자 행동을 데이터화
2. **고객 통제**: 완전한 관리자 통제 권한
3. **재구매 유도**: 여행 종료 후 자연스러운 재구매 유도
4. **확장성**: 마케팅/비즈니스 모델 확장을 위한 유연한 구조

### 다음 단계

1. **Phase 1 시작**: 기본 기능 구현부터 시작
2. **데이터 수집 인프라 구축**: 확장 가능한 구조로 설계
3. **점진적 개선**: 사용자 피드백을 반영하여 점진적으로 개선

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-11-04














