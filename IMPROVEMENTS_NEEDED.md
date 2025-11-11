# 기존 기능 보충 필요 사항

> 작성일: 2025-11-04  
> 목적: 50대 이상 사용자를 위한 기능 개선 및 안정성 향상

---

## 📋 목차

1. [긴급 개선 사항](#1-긴급-개선-사항)
2. [50대 이상 사용자 접근성 개선](#2-50대-이상-사용자-접근성-개선)
3. [에러 처리 및 안정성](#3-에러-처리-및-안정성)
4. [사용자 경험 개선](#4-사용자-경험-개선)

---

## 1. 긴급 개선 사항

### 🔴 1.1 오류 메시지 사용자 친화적으로 개선

**현재 문제점**:
- 기술적인 에러 메시지 사용 (`alert()`, `console.error`)
- 예: "Failed to load resource: the server responded with a status of 500"
- 예: "브라우저가 GPS를 지원하지 않습니다"

**개선 방안**:
```typescript
// ❌ 현재
alert('브라우저가 GPS를 지원하지 않습니다');
alert(`${locationName} 터미널 정보를 찾을 수 없습니다`);

// ✅ 개선
alert('위치 정보를 사용할 수 없습니다. 직접 지도 앱을 사용해 주세요.');
alert(`${locationName}의 크루즈 터미널 정보를 찾을 수 없습니다. 직접 지도 앱을 사용해 주세요.`);
```

**영향 범위**:
- `/components/ReturnToShipBanner.tsx` (GPS 관련)
- `/app/login/page.tsx` (로그인 실패)
- `/app/translator/page.tsx` (음성 인식 오류)
- 모든 `alert()` 사용 부분

**우선순위**: ⚠️⚠️⚠️ **매우 높음**

---

### 🔴 1.2 오늘의 브리핑 - 작은 글씨 크기 개선

**현재 문제점**:
- 일부 `text-xs` 사용 (50대 이상 가독성 저하)
- 날씨 정보의 위치명, 시간 등 작은 텍스트

**개선 필요 위치**:
```typescript
// ❌ 현재 (DailyBriefingCard.tsx)
<p className="text-gray-500 text-xs text-center">📍 {w.location}</p>
<p className="text-xs font-semibold text-gray-600">🕐 {w.time}</p>
<span className="text-xs text-gray-700 text-center">{schedule.title}</span>

// ✅ 개선
<p className="text-gray-500 text-sm text-center">📍 {w.location}</p>
<p className="text-sm font-semibold text-gray-600">🕐 {w.time}</p>
<span className="text-sm text-gray-700 text-center">{schedule.title}</span>
```

**우선순위**: ⚠️⚠️ **높음**

---

## 2. 50대 이상 사용자 접근성 개선

### 🟡 2.1 ARIA 레이블 추가

**현재 상태**:
- 일부 버튼에만 ARIA 레이블 존재
- 대부분의 버튼이 스크린 리더로 읽히지 않음

**개선 필요 위치**:
```typescript
// ❌ 현재
<button onClick={handleDelete}>삭제</button>

// ✅ 개선
<button 
  onClick={handleDelete}
  aria-label="일정 삭제"
  title="일정 삭제"
>
  삭제
</button>
```

**영향 범위**:
- 모든 버튼 (특히 아이콘만 있는 버튼)
- 입력 필드
- 체크박스
- 라디오 버튼

**우선순위**: ⚠️⚠️ **높음**

---

### 🟡 2.2 전역 글씨 크기 설정 기능

**현재 상태**:
- 체크리스트에만 글씨 크기 조절 기능 존재
- 다른 페이지는 고정 크기

**개선 방안**:
1. 프로필 페이지에 "글씨 크기 설정" 추가
2. localStorage에 저장 (`user-text-size: 'small' | 'medium' | 'large'`)
3. 모든 페이지에 적용:
   ```typescript
   const textSize = localStorage.getItem('user-text-size') || 'large';
   const sizeClass = {
     small: 'text-base',
     medium: 'text-lg',
     large: 'text-xl'
   }[textSize];
   ```

**우선순위**: ⚠️⚠️ **높음**

---

### 🟡 2.3 키보드 네비게이션 개선

**현재 상태**:
- 일부 기능은 키보드로만 접근 불가
- 포커스 순서가 논리적이지 않음

**개선 필요**:
- 모든 버튼이 키보드로 접근 가능한지 확인
- Tab 순서가 논리적인지 확인
- Enter/Space로 버튼 클릭 가능한지 확인

**우선순위**: ⚠️ **중간**

---

## 3. 에러 처리 및 안정성

### 🟡 3.1 localStorage 에러 처리 개선

**현재 문제점**:
- localStorage 저장 실패 시 에러 처리 없음
- 용량 초과 시 데이터 손실 가능

**개선 방안**:
```typescript
// ✅ 개선된 localStorage 저장 함수
function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      // QUOTA_EXCEEDED_ERR - 저장 공간 부족
      console.warn('[localStorage] 저장 공간 부족, 오래된 데이터 삭제 시도');
      // 오래된 데이터 삭제 로직
      return false;
    }
    console.error('[localStorage] 저장 실패:', error);
    return false;
  }
}
```

**영향 범위**:
- 체크리스트 (`/app/checklist/page.tsx`)
- 여행 가계부 (`/app/wallet/components/ExpenseTracker.tsx`)
- 지도 페이지 (`/app/map/page.tsx`)
- 모든 localStorage 사용 부분

**우선순위**: ⚠️⚠️ **높음**

---

### 🟡 3.2 API 호출 실패 시 친절한 메시지

**현재 문제점**:
- API 실패 시 기술적인 에러 메시지
- 사용자가 무엇을 해야 할지 모름

**개선 방안**:
```typescript
// ❌ 현재
catch (error) {
  console.error('Error loading checklist:', error);
  setError('Failed to load checklist');
}

// ✅ 개선
catch (error) {
  console.error('Error loading checklist:', error);
  setError('체크리스트를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  // 자동 재시도 로직 추가 가능
}
```

**영향 범위**:
- 모든 API 호출 부분
- 특히 체크리스트, 가계부, 지도 페이지

**우선순위**: ⚠️⚠️ **높음**

---

### 🟡 3.3 ErrorBoundary 적용 확대

**현재 상태**:
- `ErrorBoundary.tsx` 컴포넌트는 존재
- 일부 페이지에만 적용됨

**개선 방안**:
- 모든 주요 페이지에 ErrorBoundary 추가
- 레이아웃 레벨에서 적용

**우선순위**: ⚠️ **중간**

---

## 4. 사용자 경험 개선

### 🟡 4.1 도움말/튜토리얼 확대

**현재 상태**:
- `/guide` 페이지 존재
- `HelpModal` 컴포넌트 존재
- 하지만 대부분의 기능에 도움말 없음

**개선 방안**:
1. 주요 기능에 "?" 아이콘 추가
2. 클릭 시 간단한 설명 팝업
3. 첫 방문 시 튜토리얼 제공 (선택 가능)

**개선 필요 기능**:
- 오늘의 브리핑 (일정 추가 방법)
- 체크리스트 (리셋 기능 설명)
- 가계부 (통계 보는 방법)
- 지도 페이지 (여행 추가 방법)

**우선순위**: ⚠️ **중간**

---

### 🟡 4.2 로딩 상태 개선

**현재 상태**:
- 일부 페이지에 로딩 스켈레톤 있음
- 일부는 "불러오는 중..." 텍스트만

**개선 방안**:
- 모든 데이터 로딩에 스켈레톤 UI 추가
- 진행률 표시 (가능한 경우)

**우선순위**: ⚠️ **낮음**

---

### 🟡 4.3 빈 상태(Empty State) 개선

**현재 상태**:
- 일부 페이지에 빈 상태 메시지 있음
- 하지만 충분히 친절하지 않음

**개선 방안**:
```typescript
// ✅ 개선된 빈 상태
<div className="text-center py-8">
  <div className="text-4xl mb-4">📋</div>
  <h3 className="text-xl font-bold text-gray-900 mb-2">
    아직 일정이 없습니다
  </h3>
  <p className="text-gray-600 mb-4">
    오늘 일정을 추가하면 여기에 표시됩니다
  </p>
  <button 
    onClick={handleAddSchedule}
    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
  >
    일정 추가하기
  </button>
</div>
```

**우선순위**: ⚠️ **낮음**

---

### 🟡 4.4 성공 피드백 개선

**현재 상태**:
- 일부 작업 완료 시 피드백 없음
- 사용자가 작업이 완료되었는지 알기 어려움

**개선 방안**:
- 항목 추가/삭제 시 토스트 메시지
- 저장 완료 시 시각적 피드백

**우선순위**: ⚠️ **낮음**

---

## 5. 최종 우선순위 체크리스트

### 🔴 긴급 (즉시 수정)
- [ ] 오류 메시지 사용자 친화적으로 개선 (모든 `alert()` 부분)
- [ ] 오늘의 브리핑 `text-xs` → `text-sm` 이상으로 변경
- [ ] localStorage 에러 처리 추가 (용량 초과 대응)

### 🟡 중요 (1주일 내)
- [ ] ARIA 레이블 추가 (모든 버튼, 특히 아이콘만 있는 버튼)
- [ ] 전역 글씨 크기 설정 기능 추가 (프로필 페이지)
- [ ] API 호출 실패 시 친절한 메시지 표시
- [ ] 주요 기능에 도움말 추가 ("?" 아이콘)

### 🟢 개선 (1개월 내)
- [ ] 키보드 네비게이션 개선
- [ ] ErrorBoundary 적용 확대
- [ ] 로딩 상태 개선 (스켈레톤 UI)
- [ ] 빈 상태 메시지 개선
- [ ] 성공 피드백 추가

---

## 6. 예상 작업 시간

| 작업 | 예상 시간 | 우선순위 |
|------|----------|---------|
| 오류 메시지 개선 | 2-3시간 | 🔴 긴급 |
| 글씨 크기 개선 | 1시간 | 🔴 긴급 |
| localStorage 에러 처리 | 2시간 | 🔴 긴급 |
| ARIA 레이블 추가 | 3-4시간 | 🟡 중요 |
| 전역 글씨 크기 설정 | 3-4시간 | 🟡 중요 |
| 도움말 추가 | 4-5시간 | 🟡 중요 |
| 키보드 네비게이션 | 2-3시간 | 🟢 개선 |
| 로딩 상태 개선 | 2-3시간 | 🟢 개선 |

**총 예상 시간**: 19-24시간

---

## 7. 결론

### 현재 상태
- **기능 완성도**: 약 80%
- **사용자 경험**: 약 70%
- **접근성**: 약 60%
- **안정성**: 약 75%

### 가장 중요한 개선 사항
1. **오류 메시지 개선** - 사용자 혼란 방지
2. **글씨 크기 일관성** - 50대 이상 사용자 가독성
3. **localStorage 안정성** - 데이터 손실 방지

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-11-04














