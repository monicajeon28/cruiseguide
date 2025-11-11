# 🔄 재구매 전환 추적 시스템 테스트 가이드

## 📋 테스트 방법

### 방법 1: 관리자 페이지에서 직접 테스트 (권장)

#### 1단계: 관리자 페이지 접속
1. 브라우저에서 `http://localhost:3030/admin/rePurchase` 접속
2. 관리자로 로그인되어 있어야 합니다

#### 2단계: 테스트 데이터 생성
현재 데이터가 없을 경우, 테스트용 트리거를 수동으로 생성할 수 있습니다:

**옵션 A: API를 통해 직접 생성** (브라우저 콘솔 사용)
```javascript
// 브라우저 콘솔(F12)에서 실행
fetch('/api/admin/rePurchase/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    userId: 1, // 실제 사용자 ID로 변경
    triggerType: 'grace_period_end',
    tripEndDate: new Date().toISOString(),
  }),
})
.then(r => r.json())
.then(data => console.log('트리거 생성:', data));
```

**옵션 B: 실제 여행 데이터 활용**
1. `/admin/customers` 페이지에서 사용자 확인
2. 해당 사용자의 여행 종료일 확인
3. 여행 종료일이 지난 경우, 스케줄러가 자동으로 트리거를 생성할 것입니다

#### 3단계: 트리거 목록 확인
- `/admin/rePurchase` 페이지에서 생성된 트리거 목록 확인
- 각 트리거의 정보 확인:
  - 사용자 정보
  - 트리거 타입
  - 여행 종료일
  - 전환 상태

#### 4단계: 전환 처리 테스트
1. "전환 대기" 상태인 트리거 찾기
2. "전환 처리" 버튼 클릭
3. 확인 메시지에서 "확인" 클릭
4. 트리거가 "전환 완료" 상태로 변경되는지 확인

#### 5단계: 통계 확인
- 전환율 통계 카드 확인
- 타입별 전환율 차트 확인
- 전환율 추이 라인 차트 확인

---

### 방법 2: 스케줄러 수동 실행 테스트

#### 1단계: 서버 콘솔에서 스케줄러 함수 직접 호출

**테스트용 스크립트 생성**:
```typescript
// scripts/test-repurchase-trigger.ts
import { checkTripEnds, checkGracePeriodEnds } from '../lib/scheduler/rePurchaseTrigger';

async function test() {
  console.log('Testing trip end check...');
  await checkTripEnds();
  
  console.log('Testing grace period check...');
  await checkGracePeriodEnds();
}

test();
```

터미널에서 실행:
```bash
npx tsx scripts/test-repurchase-trigger.ts
```

---

### 방법 3: 전체 플로우 테스트

#### 시나리오: 여행 종료 → 트리거 생성 → 전환 처리

1. **여행 등록**
   - 일반 사용자로 로그인
   - `/onboarding` 또는 `/map`에서 여행 등록
   - 여행 종료일을 오늘 또는 어제로 설정

2. **여행 상태 업데이트**
   - 서버 콘솔에서 스케줄러 실행 또는 자동 실행 대기
   - `Trip Status Updater`가 여행 상태를 `Completed`로 변경

3. **트리거 자동 생성**
   - `RePurchase Trigger Scheduler`가 종료된 여행 확인
   - 자동으로 트리거 생성

4. **관리자 페이지 확인**
   - `/admin/rePurchase`에서 새로 생성된 트리거 확인

5. **전환 처리**
   - 해당 트리거의 "전환 처리" 버튼 클릭
   - 전환 완료 확인

6. **통계 업데이트 확인**
   - 전환율 통계가 업데이트되었는지 확인

---

## 🔍 확인 사항 체크리스트

- [ ] 관리자 페이지 접속 가능 (`/admin/rePurchase`)
- [ ] 트리거 목록이 표시됨 (데이터가 있는 경우)
- [ ] 통계 카드가 표시됨 (전체 트리거, 전환 완료, 전환 대기, 전환율)
- [ ] 시간 범위 필터 작동 (7일/30일/90일/전체)
- [ ] 상태 필터 작동 (전체/전환 대기/전환 완료)
- [ ] 타입별 전환율 차트 표시
- [ ] 전환율 추이 라인 차트 표시
- [ ] "전환 처리" 버튼 클릭 시 전환 처리됨
- [ ] 트리거 수동 생성 기능 작동 (API)
- [ ] 스케줄러가 정상 작동 (서버 로그 확인)

---

## 🐛 문제 해결

### 문제 1: 트리거가 표시되지 않음
**원인**: 데이터가 없거나 필터 설정 문제
**해결**:
- 필터를 "전체"로 설정
- 테스트용 트리거 수동 생성
- 실제 여행 데이터 확인

### 문제 2: 전환 처리 버튼이 작동하지 않음
**원인**: API 오류 또는 권한 문제
**해결**:
- 브라우저 콘솔(F12)에서 오류 확인
- 관리자 권한 확인
- 서버 로그 확인

### 문제 3: 통계가 0으로 표시됨
**원인**: 트리거 데이터가 없음
**해결**:
- 테스트용 트리거 생성
- 실제 여행 종료 데이터 확인

---

## 📊 예상 결과

정상 작동 시:
- **전체 트리거**: 생성된 트리거 총 개수
- **전환 완료**: 전환 처리된 트리거 개수
- **전환 대기**: 아직 전환되지 않은 트리거 개수
- **전환율**: (전환 완료 / 전체 트리거) × 100

---

**작성자**: AI Assistant  
**작성일**: 2025-11-04














