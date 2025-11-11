# 배로 돌아가기 시스템 상세 설명

> 작성일: 2025-11-04  
> 목적: 기항지 관광 중 안전한 귀선 보장

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [구현된 기능](#2-구현된-기능)
3. [필요한 API 엔드포인트](#3-필요한-api-엔드포인트)
4. [작동 방식](#4-작동-방식)
5. [현재 상태 및 문제점](#5-현재-상태-및-문제점)
6. [완성을 위해 필요한 작업](#6-완성을-위해-필요한-작업)

---

## 1. 시스템 개요

### 목적
기항지에서 관광 중인 크루즈 여행객이 **배를 놓치지 않도록** 안전하게 귀선할 수 있도록 돕는 시스템입니다.

### 핵심 기능
1. **실시간 카운트다운 타이머**: 출항 시간까지 남은 시간 표시
2. **긴급 상태 표시**: 출항 1시간 전 자동 경고 (빨간색 배너)
3. **GPS 기반 길찾기**: 현재 위치에서 크루즈 터미널까지 Google Maps 네비게이션
4. **자동 감지**: 기항지 일정(`PortVisit`) 자동 감지 및 표시

---

## 2. 구현된 기능

### ✅ 2.1 ReturnToShipBanner 컴포넌트

**위치**: `/components/ReturnToShipBanner.tsx`

**주요 기능**:
- ✅ 기항지 일정 자동 감지 (`PortVisit` 타입)
- ✅ 출항 시간까지 실시간 카운트다운 (1초마다 업데이트)
- ✅ 1시간 미만 시 긴급 상태 표시 (빨간색 배너, 깜빡임)
- ✅ GPS 위치 획득 및 Google Maps 연동
- ✅ 터미널 검색 API 연동
- ✅ 화면 최상단 고정 배너 (항상 보임)

**UI 상태**:
- **일반 상태**: 주황색 배너 + "🚢 [기항지명] 출항까지" + 남은 시간
- **긴급 상태**: 빨간색 배너 + "⚠️ 출항 1시간 전! 지금 바로 배로 돌아오세요!" + 깜빡이는 경고 아이콘
- **버튼**: "배로 돌아가기" (길찾기 실행)

### ✅ 2.2 ChatInteractiveUI 통합

**위치**: `/app/chat/components/ChatInteractiveUI.tsx`

**현재 상태**: 
```typescript
import { ReturnToShipBanner } from '@/components/ReturnToShipBanner';

// ...
<ReturnToShipBanner />
```

**✅ 이미 통합됨**: 컴포넌트가 채팅 화면에 렌더링되고 있음

### ✅ 2.3 프로액티브 푸시 알림 시스템

**위치**: `/lib/scheduler/proactiveEngine.ts`

**기능**: 출항 1시간 전 자동 푸시 알림 발송
- **트리거**: `checkBoardingWarning()` 함수
- **알림 메시지**: "⚠️ 출항 1시간 전! 지금 바로 배로 돌아오세요!"
- **중복 방지**: `NotificationLog`로 중복 발송 방지

---

## 3. 필요한 API 엔드포인트

### ✅ 3.1 활성 여행 조회 API

**현재 사용 중**: `/api/trips/active`

**ReturnToShipBanner에서 호출**:
```typescript
const activeTrip = await fetch('/api/trips/active').then(r => r.json());
```

**필요한 응답 형식**:
```json
{
  "data": {
    "id": 123,
    "cruiseName": "코스타세레나",
    "startDate": "2025-11-10",
    "endDate": "2025-11-15"
  }
}
```

**⚠️ 확인 필요**: 이 API가 실제로 존재하고 올바른 형식으로 응답하는지 확인 필요

---

### ✅ 3.2 일정(Itinerary) 조회 API

**현재 사용 중**: `/api/trips/${tripId}/itineraries?date=${date}`

**ReturnToShipBanner에서 호출**:
```typescript
const itinerariesRes = await fetch(
  `/api/trips/${activeTrip.data.id}/itineraries?date=${today.toISOString()}`
).then(r => r.json());
```

**필요한 응답 형식**:
```json
{
  "data": [
    {
      "id": 1,
      "type": "PortVisit",
      "location": "나하",
      "country": "JP",
      "arrival": "08:00",
      "departure": "18:00",
      "date": "2025-11-12"
    }
  ]
}
```

**확인 필요**:
- `PortVisit` 타입 필터링 로직
- `departure` 시간이 있는지 확인
- 오늘 날짜의 일정만 조회

---

### ❌ 3.3 터미널 검색 API

**현재 사용 중**: `/api/terminals/search?location=${locationName}`

**ReturnToShipBanner에서 호출**:
```typescript
const terminalRes = await fetch(
  `/api/terminals/search?location=${encodeURIComponent(locationName)}`
).then(r => r.json());
```

**필요한 응답 형식**:
```json
{
  "data": [
    {
      "name": "나하 크루즈 터미널",
      "latitude": 26.2124,
      "longitude": 127.6809,
      "location": "나하"
    }
  ]
}
```

**⚠️ 확인 필요**: 
- 이 API가 실제로 존재하는지 확인
- `data/terminals.json` 파일과 연동되는지 확인
- 위치명(예: "나하", "홍콩")으로 검색 가능한지 확인

---

## 4. 작동 방식

### 4.1 자동 감지 프로세스

```
1. 사용자가 채팅 화면에 접속
   ↓
2. ReturnToShipBanner 컴포넌트 마운트
   ↓
3. /api/trips/active 호출 → 활성 여행 조회
   ↓
4. 오늘 날짜의 Itinerary 조회
   ↓
5. type === 'PortVisit' && departure !== null 찾기
   ↓
6. 발견되면 배너 표시, 아니면 숨김
```

### 4.2 카운트다운 타이머

```
1. departure 시간 파싱 (예: "18:00")
   ↓
2. 현재 시간과 비교
   ↓
3. 남은 시간 계산 (시간, 분, 초)
   ↓
4. 1초마다 업데이트
   ↓
5. 1시간 미만이면 긴급 상태로 전환
```

### 4.3 길찾기 기능

```
1. 사용자가 "배로 돌아가기" 버튼 클릭
   ↓
2. GPS 권한 요청
   ↓
3. 현재 위치 획득 (latitude, longitude)
   ↓
4. /api/terminals/search?location=나하 호출
   ↓
5. 터미널 위치 획득
   ↓
6. Google Maps URL 생성:
   https://www.google.com/maps/dir/{현재위치}/{터미널위치}
   ↓
7. 새 창에서 Google Maps 열기
```

---

## 5. 현재 상태 및 문제점

### ✅ 완성된 부분

1. **컴포넌트 구현**: `ReturnToShipBanner.tsx` 완전 구현됨
2. **UI 통합**: `ChatInteractiveUI.tsx`에 이미 추가됨
3. **카운트다운 로직**: 실시간 타이머 작동
4. **긴급 상태 표시**: 1시간 전 자동 경고
5. **GPS 연동**: 브라우저 Geolocation API 사용
6. **Google Maps 연동**: 네비게이션 URL 생성

### ⚠️ 확인 필요 사항

1. **API 엔드포인트 존재 여부**:
   - `/api/trips/active` - 존재 여부 확인 필요
   - `/api/trips/[tripId]/itineraries` - 존재 여부 확인 필요
   - `/api/terminals/search` - 존재 여부 확인 필요

2. **데이터 구조**:
   - `Itinerary` 모델에 `departure` 필드가 올바르게 저장되는지
   - `PortVisit` 타입이 올바르게 설정되는지

3. **에러 처리**:
   - API 호출 실패 시 사용자에게 친절한 메시지 표시
   - GPS 권한 거부 시 대안 제시

---

## 6. 완성을 위해 필요한 작업

### 🔴 6.1 API 엔드포인트 확인 및 구현

#### 작업 1: `/api/trips/active` API 확인/생성

**확인 필요**:
```typescript
// app/api/trips/active/route.ts 존재 여부 확인
// 없으면 생성 필요
```

**필요한 기능**:
- 현재 사용자의 활성 여행 조회 (`status: 'InProgress'` 또는 `'Upcoming'`)
- 여행 정보 반환 (`id`, `cruiseName`, `startDate`, `endDate`)

#### 작업 2: `/api/trips/[tripId]/itineraries` API 확인/생성

**확인 필요**:
```typescript
// app/api/trips/[tripId]/itineraries/route.ts 존재 여부 확인
// 없으면 생성 필요
```

**필요한 기능**:
- 특정 날짜의 Itinerary 조회
- `PortVisit` 타입 필터링
- `departure` 시간 포함

#### 작업 3: `/api/terminals/search` API 확인/생성

**확인 필요**:
```typescript
// app/api/terminals/search/route.ts 존재 여부 확인
// 없으면 생성 필요
```

**필요한 기능**:
- 위치명으로 터미널 검색
- 위도/경도 좌표 반환
- `data/terminals.json` 파일과 연동

---

### 🟡 6.2 에러 처리 개선

#### 작업 4: 친절한 에러 메시지

**현재 문제**: 기술적인 에러 메시지 표시
```typescript
alert('브라우저가 GPS를 지원하지 않습니다');
alert(`${locationName} 터미널 정보를 찾을 수 없습니다`);
```

**개선 방안**: 50대 이상 사용자를 위한 친절한 메시지
```typescript
// 예시
alert('위치 정보를 사용할 수 없습니다. 인터넷 연결을 확인해 주세요.');
alert(`${locationName}의 크루즈 터미널 정보를 찾을 수 없습니다. 직접 지도 앱을 사용해 주세요.`);
```

---

### 🟡 6.3 테스트 및 검증

#### 작업 5: 실제 작동 테스트

**테스트 시나리오**:
1. 활성 여행이 있는 사용자로 로그인
2. 기항지 날짜에 채팅 화면 접속
3. 배너가 올바르게 표시되는지 확인
4. 카운트다운이 정확하게 작동하는지 확인
5. "배로 돌아가기" 버튼 클릭 시 Google Maps가 올바르게 열리는지 확인

---

### 🟢 6.4 50대 이상 사용자를 위한 개선

#### 작업 6: 글씨 크기 및 가독성

**현재 상태**: 배너의 글씨 크기가 적절하지만 추가 개선 가능

**개선 사항**:
- 카운트다운 숫자를 더 크게 (예: `text-2xl` 또는 `text-3xl`)
- 버튼 크기 확대 (최소 56px 높이)
- 터치 영역 확대

#### 작업 7: 시각적 피드백

**개선 사항**:
- 긴급 상태일 때 더 눈에 띄는 애니메이션 (예: 펄스 효과)
- 배너 색상을 더 명확하게 (예: 빨간색 → 진한 빨간색)

---

## 7. 예상 작업 시간

| 작업 | 예상 시간 | 우선순위 |
|------|----------|---------|
| API 엔드포인트 확인/생성 | 2-3시간 | 🔴 높음 |
| 에러 처리 개선 | 1시간 | 🟡 중간 |
| 테스트 및 검증 | 1-2시간 | 🟡 중간 |
| UI 개선 (50대+) | 1시간 | 🟢 낮음 |

**총 예상 시간**: 5-7시간

---

## 8. 결론

### 현재 상태 요약

✅ **완성도**: 약 80%
- 컴포넌트 구현: ✅ 완료
- UI 통합: ✅ 완료
- 로직 구현: ✅ 완료
- API 연동: ⚠️ 확인 필요
- 테스트: ❌ 미완료

### 다음 단계

1. **즉시 확인**: 3개 API 엔드포인트 존재 여부 확인
2. **API 구현**: 없으면 생성
3. **테스트**: 실제 작동 테스트
4. **개선**: 에러 처리 및 UI 개선

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-11-04














