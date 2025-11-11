# 🔐 보안 개선 가이드

## 1. ✅ XSS 취약점 수정 완료

**수정 완료된 파일**:
- ✅ `components/mall/ProductDetail.tsx` - DOMPurify 적용 완료
- ✅ `app/community/posts/[id]/page.tsx` - DOMPurify 적용 완료
- ✅ `components/chat/messages.tsx` - safeHtml 함수를 DOMPurify로 교체 완료

**추가 확인 필요**:
- `app/admin/messages/page.tsx` - 관리자 메시지 페이지도 확인 필요

---

## 2. 환경 변수 검증 강화 방법

### 현재 상태
- `lib/env.ts`에서 `GEMINI_API_KEY`, `DATABASE_URL`만 필수로 검증
- PG 결제 관련 변수는 `optionalEnvVars`에만 있음

### 수정 방법

**옵션 1: 프로덕션에서만 필수로 만들기 (권장)**

```typescript
// lib/env.ts 수정
const isProduction = process.env.NODE_ENV === 'production';

const requiredEnvVars = [
  'GEMINI_API_KEY',
  'DATABASE_URL',
];

// 프로덕션에서만 결제 관련 변수 필수
if (isProduction) {
  requiredEnvVars.push(
    'PG_SIGNKEY',
    'PG_MID_AUTH',
    'NEXT_PUBLIC_BASE_URL'
  );
}
```

**옵션 2: 기능별로 그룹화하여 검증**

```typescript
// lib/env.ts 수정
const featureGroups = {
  core: ['GEMINI_API_KEY', 'DATABASE_URL'],
  payment: ['PG_SIGNKEY', 'PG_MID_AUTH'],
  public: ['NEXT_PUBLIC_BASE_URL'],
};

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];
  
  // 코어 기능은 항상 필수
  featureGroups.core.forEach(key => {
    if (!process.env[key]) missing.push(key);
  });
  
  // 프로덕션에서만 결제/공개 URL 필수
  if (isProduction) {
    [...featureGroups.payment, ...featureGroups.public].forEach(key => {
      if (!process.env[key]) missing.push(key);
    });
  }
  
  if (missing.length > 0) {
    console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
    if (isProduction) process.exit(1); // 프로덕션에서는 즉시 종료
  }
}
```

**권장 방법**: 옵션 1 (간단하고 명확함)

---

## 3. CSRF 보호 완전성 확인 - 왜 필요한가?

### CSRF 공격이란?
**예시 시나리오**:
1. 사용자가 관리자로 로그인한 상태
2. 악성 사이트 방문 (`evil.com`)
3. 악성 사이트에서 자동으로 요청 전송:
   ```html
   <img src="https://your-site.com/api/admin/users/123/delete" />
   ```
4. 사용자의 쿠키가 자동으로 전송되어 삭제 요청 실행됨

### 현재 상태
- ✅ CSRF 토큰 생성/검증 시스템 구현됨
- ✅ `csrfFetch`로 자동 토큰 주입
- ⚠️ 하지만 모든 API에서 사용하는지 확인 필요

### 확인 방법
```bash
# 모든 POST/PUT/DELETE API에서 CSRF 검증 확인
grep -r "POST\|PUT\|DELETE" app/api --include="*.ts" | grep -v "csrf"
```

### 필요성 판단
- **필요한 경우**: 관리자 기능, 사용자 데이터 수정, 결제 등
- **선택적인 경우**: 단순 조회 API (GET)

**결론**: 관리자 API와 사용자 데이터 수정 API는 필수, 조회 API는 선택

---

## 4. Rate Limiting 강화 - 왜 필요한가?

### 현재 상태
- ✅ AI 요청에 엄격한 제한 적용
- ✅ 일반 API 요청 제한 있음
- ⚠️ 로그인/회원가입에 별도 제한 없음

### 공격 시나리오

**시나리오 1: 무차별 대입 공격 (Brute Force)**
```
공격자가 자동화 스크립트로:
- 1초에 100번 로그인 시도
- 1시간에 360,000번 시도
- 모든 가능한 비밀번호 조합 시도
→ 계정 탈취 가능성 증가
```

**시나리오 2: 서버 부하 공격**
```
공격자가:
- 동시에 수천 개의 회원가입 요청
- 서버 CPU/메모리 고갈
- 정상 사용자 접근 불가
→ 서비스 중단
```

### 현재 Rate Limiting 설정 확인
```typescript
// lib/rate-limiter.ts 확인 필요
// 로그인 API: 현재 제한이 얼마인지 확인
```

### 권장 설정
```typescript
// 로그인: 1분에 5번, 1시간에 20번
// 회원가입: 1분에 3번, 1시간에 10번
// 일반 API: 1분에 60번
```

### 필요성 판단
- **필요한 경우**: 
  - 로그인/회원가입 (무차별 대입 방지)
  - 결제 API (금전적 피해 방지)
  - 관리자 API (권한 탈취 방지)
- **선택적인 경우**: 
  - 단순 조회 API (이미 제한 있음)

**결론**: 로그인/회원가입은 필수, 나머지는 현재 설정으로도 충분할 수 있음

---

## 5. 세션 만료 시간 조정 - 왜 필요한가?

### 현재 상태
- 세션 만료 시간: **30일**
- 쿠키 설정: `httpOnly: true`, `sameSite: 'lax'` ✅

### 보안 위험

**시나리오 1: 공용 컴퓨터 사용**
```
사용자가:
- 인터넷 카페에서 로그인
- 로그아웃 안 하고 나감
- 30일 동안 다른 사람이 계정 사용 가능
→ 개인정보 유출, 부정 사용
```

**시나리오 2: 쿠키 탈취**
```
공격자가:
- XSS 공격으로 쿠키 탈취
- 30일 동안 계정 사용 가능
→ 장기간 피해 가능
```

### 권장 설정

**옵션 1: 프로덕션에서만 단축 (권장)**
```typescript
const maxAge = process.env.NODE_ENV === 'production' 
  ? 60 * 60 * 24 * 7  // 프로덕션: 7일
  : 60 * 60 * 24 * 30; // 개발: 30일 (편의성)
```

**옵션 2: 사용자 선택**
```typescript
// "로그인 상태 유지" 체크박스 추가
// 체크: 30일, 미체크: 1일
```

**옵션 3: 활동 기반 연장**
```typescript
// 사용자가 활동할 때마다 세션 연장
// 마지막 활동 후 7일 경과 시 만료
```

### 필요성 판단
- **필요한 경우**: 
  - 공용 컴퓨터 사용 가능성 높음
  - 높은 보안이 필요한 서비스
- **선택적인 경우**: 
  - 개인 기기만 사용
  - 사용자 편의성 우선

**결론**: 프로덕션에서는 7일 권장, 사용자 편의성과 보안의 균형 고려

---

## 📊 최종 권장 사항

### 🔴 필수 (배포 전)
1. ✅ XSS 방어 - **완료**
2. 환경 변수 검증 - **프로덕션에서만 결제 변수 필수로 설정**

### 🟡 권장 (배포 전 또는 배포 후)
3. CSRF 보호 확인 - **관리자 API만 확인하면 됨**
4. Rate Limiting 강화 - **로그인/회원가입만 강화해도 충분**
5. 세션 만료 시간 - **프로덕션에서 7일로 단축 권장**

---

## 💬 결정이 필요한 사항

각 항목에 대해 다음을 결정해주세요:

1. **환경 변수 검증**: 프로덕션에서만 결제 변수 필수로 할까요?
2. **CSRF 보호**: 관리자 API만 확인할까요, 아니면 전체 확인할까요?
3. **Rate Limiting**: 로그인/회원가입에 얼마나 엄격한 제한을 둘까요? (예: 1분에 5번)
4. **세션 만료**: 프로덕션에서 몇 일로 설정할까요? (권장: 7일)

각 항목에 대한 결정을 알려주시면 그에 맞게 수정하겠습니다!
