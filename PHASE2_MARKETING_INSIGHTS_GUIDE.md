# 📊 Phase 2-4: 마케팅 인사이트 생성 시스템 구현 가이드

> **작업자 A (AI 전문가)**  
> **Phase**: Phase 2 - 4단계  
> **예상 소요 시간**: 2-3일

---

## 🎯 목표

사용자 데이터를 분석하여 자동으로 마케팅 인사이트를 생성하고, 관리자가 이를 확인할 수 있는 시스템을 구축합니다.

---

## 📋 구현 단계

### 1단계: 인사이트 생성 API 엔드포인트 구현

**파일**: `/app/api/admin/insights/generate/route.ts`

**인사이트 타입**:
1. **목적지 선호도** (`destination_preference`)
   - 사용자가 가장 많이 방문하는 목적지
   - 선호하는 목적지 패턴 (예: 아시아, 유럽, 지중해)
   - 다음 여행 목적지 예측

2. **지출 패턴** (`spending_pattern`)
   - 평균 일일 지출
   - 카테고리별 지출 비율
   - 지출 패턴 분석 (절약형 vs 소비형)

3. **기능 사용 패턴** (`feature_usage`)
   - 가장 많이 사용하는 기능
   - 기능 사용 빈도
   - 기능별 만족도 추정

4. **재구매 점수** (`re_purchase_score`)
   - 재구매 가능성 점수 (0-100)
   - 재구매 트리거 시점 예측
   - 재구매 유도 전략 제안

**인사이트 데이터 구조**:
```typescript
{
  insightType: 'destination_preference',
  data: {
    topDestinations: [
      { name: '일본', count: 5, percentage: 45 },
      { name: '홍콩', count: 3, percentage: 27 },
    ],
    preferredPattern: '아시아',
    predictedNext: '대만',
    confidence: 0.85,
  },
}
```

---

### 2단계: 인사이트 생성 로직 구현

**파일**: `/lib/insights/generator.ts`

**생성 로직**:
```typescript
// 1. 목적지 선호도 분석
async function generateDestinationPreference(userId: number) {
  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { destination: true },
  });

  // 목적지 파싱 및 카운팅
  const destinationCounts = {};
  trips.forEach(trip => {
    const countries = trip.destination.split(',').map(s => s.trim());
    countries.forEach(country => {
      destinationCounts[country] = (destinationCounts[country] || 0) + 1;
    });
  });

  // Top 5 목적지
  const topDestinations = Object.entries(destinationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / trips.length) * 100,
    }));

  // 패턴 분석 (대륙별)
  const pattern = analyzeContinentPattern(topDestinations);

  // 다음 목적지 예측
  const predictedNext = predictNextDestination(topDestinations, pattern);

  return {
    topDestinations,
    preferredPattern: pattern,
    predictedNext,
    confidence: calculateConfidence(trips.length),
  };
}

// 2. 지출 패턴 분석
async function generateSpendingPattern(userId: number) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    select: { krwAmount: true, category: true },
  });

  const total = expenses.reduce((sum, e) => sum + (e.krwAmount || 0), 0);
  const avgDaily = total / (expenses.length || 1);

  // 카테고리별 비율
  const byCategory = {};
  expenses.forEach(e => {
    const cat = e.category || '기타';
    byCategory[cat] = (byCategory[cat] || 0) + (e.krwAmount || 0);
  });

  const categoryRatios = Object.entries(byCategory).map(([name, amount]) => ({
    name,
    amount,
    percentage: (amount / total) * 100,
  }));

  // 지출 패턴 분류
  const patternType = classifySpendingPattern(avgDaily, categoryRatios);

  return {
    avgDaily,
    total,
    categoryRatios,
    patternType, // '절약형', '균형형', '소비형'
    recommendations: generateSpendingRecommendations(patternType),
  };
}

// 3. 기능 사용 패턴 분석
async function generateFeatureUsage(userId: number) {
  const usages = await prisma.featureUsage.findMany({
    where: { userId },
    orderBy: { usageCount: 'desc' },
  });

  const totalUsage = usages.reduce((sum, u) => sum + u.usageCount, 0);

  const features = usages.map(u => ({
    feature: u.feature,
    usageCount: u.usageCount,
    percentage: (u.usageCount / totalUsage) * 100,
    lastUsed: u.lastUsedAt,
  }));

  // 가장 인기 있는 기능
  const topFeature = features[0];

  // 사용 빈도 분석
  const frequency = analyzeFrequency(features);

  return {
    features,
    topFeature,
    frequency, // '높음', '보통', '낮음'
    recommendations: generateFeatureRecommendations(features),
  };
}

// 4. 재구매 점수 계산
async function generateRePurchaseScore(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      trips: { orderBy: { endDate: 'desc' }, take: 1 },
      rePurchaseTriggers: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!user || !user.trips[0]) {
    return { score: 0, reason: '여행 기록 없음' };
  }

  const lastTrip = user.trips[0];
  const lastTripEnd = new Date(lastTrip.endDate);
  const daysSinceTrip = Math.floor((Date.now() - lastTripEnd.getTime()) / (1000 * 60 * 60 * 24));

  // 점수 계산 요소
  const factors = {
    tripCount: user.tripCount || 0, // 여행 횟수
    daysSinceTrip, // 여행 종료 후 경과 일수
    featureUsage: await calculateFeatureEngagement(userId), // 기능 사용 참여도
    spendingLevel: await calculateSpendingLevel(userId), // 지출 수준
    hasTrigger: user.rePurchaseTriggers.length > 0, // 재구매 트리거 존재 여부
  };

  // 점수 계산 (0-100)
  let score = 0;
  score += Math.min(factors.tripCount * 10, 30); // 여행 횟수 (최대 30점)
  score += Math.min(Math.max(0, 30 - factors.daysSinceTrip), 30); // 경과 일수 (최대 30점)
  score += factors.featureUsage * 20; // 기능 사용 (최대 20점)
  score += factors.spendingLevel * 10; // 지출 수준 (최대 10점)
  score += factors.hasTrigger ? 10 : 0; // 트리거 존재 (10점)

  // 재구매 시기 예측
  const predictedTiming = predictRePurchaseTiming(factors);

  // 유도 전략
  const strategies = generateRePurchaseStrategies(score, factors);

  return {
    score: Math.round(score),
    factors,
    predictedTiming,
    strategies,
    urgency: score >= 70 ? '높음' : score >= 40 ? '보통' : '낮음',
  };
}
```

---

### 3단계: 인사이트 조회 및 관리 API

**파일**: `/app/api/admin/insights/route.ts`

**엔드포인트**:
- `GET /api/admin/insights` - 모든 사용자의 인사이트 조회 (필터링 가능)
- `GET /api/admin/insights/[userId]` - 특정 사용자의 인사이트 조회
- `POST /api/admin/insights/generate/[userId]` - 특정 사용자의 인사이트 생성/재생성
- `POST /api/admin/insights/generate/all` - 모든 사용자의 인사이트 일괄 생성

---

### 4단계: 관리자 UI 구현

**파일**: `/app/admin/insights/page.tsx`

**기능**:
1. **인사이트 목록**
   - 사용자별 인사이트 카드
   - 인사이트 타입별 필터
   - 검색 기능

2. **인사이트 상세**
   - 각 인사이트 타입별 상세 정보
   - 시각화 (차트, 그래프)
   - 추천 사항 표시

3. **인사이트 생성**
   - 개별 사용자 인사이트 생성 버튼
   - 일괄 생성 버튼
   - 생성 진행 상황 표시

---

### 5단계: 자동 인사이트 생성 스케줄러

**파일**: `/lib/scheduler/insightGenerator.ts`

**스케줄**:
- 매일 새벽 2시: 모든 활성 사용자의 인사이트 자동 생성/업데이트
- 여행 종료 후: 해당 사용자의 재구매 점수 자동 계산

---

## 🔧 구현 세부사항

### 인사이트 생성 전략

1. **데이터 최소 요구사항**:
   - 목적지 선호도: 최소 1개 여행
   - 지출 패턴: 최소 5개 지출 기록
   - 기능 사용: 최소 3개 기능 사용
   - 재구매 점수: 항상 계산 가능

2. **인사이트 업데이트 주기**:
   - 신규 데이터가 추가될 때마다 자동 업데이트
   - 최대 1일 1회 업데이트

3. **인사이트 저장**:
   - `MarketingInsight` 모델에 저장
   - `insightType`과 `data` (JSON) 필드 사용

---

## ✅ 완료 체크리스트

- [ ] `/lib/insights/generator.ts` 구현
- [ ] 목적지 선호도 분석 로직 구현
- [ ] 지출 패턴 분석 로직 구현
- [ ] 기능 사용 패턴 분석 로직 구현
- [ ] 재구매 점수 계산 로직 구현
- [ ] `/api/admin/insights` API 엔드포인트 구현
- [ ] `/api/admin/insights/generate` API 엔드포인트 구현
- [ ] `/admin/insights` 페이지 생성
- [ ] 인사이트 목록 컴포넌트 구현
- [ ] 인사이트 상세 컴포넌트 구현
- [ ] 인사이트 생성 버튼 구현
- [ ] 자동 생성 스케줄러 구현
- [ ] 관리자 메뉴에 "마케팅 인사이트" 추가

---

## 🚀 다음 단계

완료 후:
- **Phase 2-5**: 재구매 전환 추적 시스템

---

**작성자**: AI Assistant  
**작성일**: 2025-11-04














