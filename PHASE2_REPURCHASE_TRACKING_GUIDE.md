# 🔄 Phase 2-5: 재구매 전환 추적 시스템 구현 가이드

> **작업자 A (AI 전문가)**  
> **Phase**: Phase 2 - 5단계  
> **예상 소요 시간**: 2-3일

---

## 🎯 목표

여행 종료 후 고객의 재구매 전환을 추적하고, 전환율을 분석하여 마케팅 전략을 수립할 수 있는 시스템을 구축합니다.

---

## 📋 구현 단계

### 1단계: 재구매 트리거 생성 로직 구현

**파일**: `/lib/rePurchase/trigger.ts`

**트리거 생성 시점**:
1. **여행 종료 시**: 자동으로 `RePurchaseTrigger` 생성
2. **유예 기간 종료 시**: 재구매 유도 메시지 발송과 함께 트리거 생성
3. **관리자 수동 생성**: 관리자가 특정 사용자에 대해 트리거 생성

**트리거 타입**:
- `grace_period_end`: 유예 기간 종료 시점
- `revisit_prompt`: 재방문 유도 프롬프트
- `product_recommendation`: 상품 추천 기반

---

### 2단계: 재구매 전환 추적 API 구현

**파일**: `/app/api/admin/rePurchase/route.ts`

**엔드포인트**:
- `GET /api/admin/rePurchase` - 재구매 트리거 목록 조회
- `GET /api/admin/rePurchase/stats` - 재구매 전환 통계
- `POST /api/admin/rePurchase/trigger` - 트리거 수동 생성
- `PUT /api/admin/rePurchase/[triggerId]/convert` - 전환 처리

---

### 3단계: 재구매 전환율 분석 대시보드

**파일**: `/app/admin/rePurchase/page.tsx`

**기능**:
1. **전환율 통계**
   - 전체 전환율
   - 타입별 전환율
   - 기간별 전환율 추이

2. **트리거 목록**
   - 미전환 트리거 목록
   - 전환된 트리거 목록
   - 필터링 (기간, 타입, 상태)

3. **전환 처리**
   - 개별 전환 처리
   - 일괄 전환 처리

---

### 4단계: 자동 트리거 생성 스케줄러

**파일**: `/lib/scheduler/rePurchaseTrigger.ts`

**스케줄**:
- 매일 자정: 여행 종료된 사용자 확인 및 트리거 생성
- 매일 오전 9시: 유예 기간 종료된 사용자 확인 및 트리거 생성

---

## 🔧 구현 세부사항

### 트리거 생성 로직

```typescript
// 여행 종료 시 트리거 생성
async function createTripEndTrigger(userId: number, tripEndDate: Date) {
  // 이미 트리거가 있으면 생성하지 않음
  const existing = await prisma.rePurchaseTrigger.findFirst({
    where: {
      userId,
      lastTripEndDate: tripEndDate,
      triggerType: 'grace_period_end',
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.rePurchaseTrigger.create({
    data: {
      userId,
      lastTripEndDate: tripEndDate,
      triggerType: 'grace_period_end',
      messageSent: false,
      converted: false,
    },
  });
}

// 전환 처리
async function markAsConverted(triggerId: number) {
  return await prisma.rePurchaseTrigger.update({
    where: { id: triggerId },
    data: {
      converted: true,
      convertedAt: new Date(),
    },
  });
}
```

### 전환율 계산

```typescript
async function calculateConversionRate(timeRange: '7d' | '30d' | '90d' | 'all') {
  const startDate = calculateStartDate(timeRange);
  
  const where: any = {};
  if (timeRange !== 'all') {
    where.createdAt = { gte: startDate };
  }

  const total = await prisma.rePurchaseTrigger.count({ where });
  const converted = await prisma.rePurchaseTrigger.count({
    where: {
      ...where,
      converted: true,
    },
  });

  return {
    total,
    converted,
    conversionRate: total > 0 ? (converted / total) * 100 : 0,
  };
}
```

---

## ✅ 완료 체크리스트

- [ ] `/lib/rePurchase/trigger.ts` 구현
- [ ] 트리거 생성 로직 구현
- [ ] 전환 처리 로직 구현
- [ ] `/api/admin/rePurchase` API 엔드포인트 구현
- [ ] `/api/admin/rePurchase/stats` API 엔드포인트 구현
- [ ] `/api/admin/rePurchase/trigger` API 엔드포인트 구현
- [ ] `/admin/rePurchase` 페이지 생성
- [ ] 전환율 통계 컴포넌트 구현
- [ ] 트리거 목록 컴포넌트 구현
- [ ] 전환 처리 기능 구현
- [ ] 자동 트리거 생성 스케줄러 구현
- [ ] 관리자 메뉴에 "재구매 추적" 추가

---

## 🚀 다음 단계

Phase 2 완료 후:
- **Phase 3**: 고급 기능 (자동화된 마케팅 캠페인, 리포트 생성 등)

---

**작성자**: AI Assistant  
**작성일**: 2025-11-04














