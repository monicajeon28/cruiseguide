# 보안 개선 항목 상세 설명

## 1. CSRF 보호 완전성 확인

### 왜 필요한가?

**CSRF (Cross-Site Request Forgery)** 공격은:
- 사용자가 로그인한 상태에서 악성 사이트를 방문하면
- 그 사이트에서 자동으로 우리 서버에 요청을 보낼 수 있음
- 예: 사용자가 모르는 사이에 계정 삭제, 비밀번호 변경 등

**현재 상태**:
- ✅ CSRF 토큰 시스템 구현됨
- ✅ Middleware에서 일부 검증
- ⚠️ 하지만 모든 API route에서 검증하는지 확인 필요

**확인해야 할 것**:
1. 모든 POST/PUT/DELETE API에서 CSRF 토큰 검증하는지
2. 특히 중요한 작업 (계정 삭제, 비밀번호 변경, 결제 등)에서 검증하는지
3. Middleware에서 검증하지 못하는 경우 각 API에서 직접 검증하는지

**영향**:
- 공격자가 사용자 모르게 계정 삭제 가능
- 비밀번호 변경 가능
- 결제 요청 가능
- 데이터 삭제/수정 가능

**수정 방법**:
```typescript
// 각 API route에서
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const sessionId = cookies().get('cg.sid.v2')?.value;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { csrfToken: true }
  });
  
  const requestToken = req.headers.get('X-CSRF-Token');
  if (!validateCsrfToken(session?.csrfToken, requestToken)) {
    return NextResponse.json({ ok: false, error: 'CSRF token invalid' }, { status: 403 });
  }
  
  // ... 실제 로직
}
```

**우선순위**: 🟡 높음 (이미 구현되어 있지만 완전성 확인 필요)

---

## 2. Rate Limiting 강화 (로그인/회원가입)

### 왜 필요한가?

**무차별 대입 공격 (Brute Force Attack)**:
- 공격자가 수천 번 로그인 시도
- 올바른 비밀번호를 찾을 때까지 반복
- 서버 부하 증가

**현재 상태**:
- ✅ AI 요청에 Rate Limiting 적용됨
- ✅ 일반 API 요청에도 제한 있음
- ⚠️ 하지만 로그인/회원가입에 특별한 제한 없음

**영향**:
- 공격자가 무제한으로 로그인 시도 가능
- 올바른 비밀번호 찾을 수 있음
- 서버 부하로 정상 사용자도 느려질 수 있음

**수정 방법**:
```typescript
// middleware.ts 또는 각 API route에서
const LOGIN_RATE_LIMIT = {
  limit: 5, // 5번 시도
  window: 60 * 1000, // 1분 동안
  blockDuration: 15 * 60 * 1000, // 15분 차단
};

// 로그인 실패 시 IP 차단
if (loginFailed) {
  await prisma.rateLimit.create({
    data: {
      key: `login:${clientIp}`,
      count: 1,
      expiresAt: new Date(Date.now() + LOGIN_RATE_LIMIT.blockDuration),
    }
  });
}
```

**추가 기능**:
- 로그인 실패 5회 시 15분 차단
- 계정 잠금 (특정 사용자 ID로 시도 시)
- 의심스러운 활동 알림

**우선순위**: 🟡 높음 (보안 강화)

---

## 3. 세션 만료 시간 조정 (프로덕션에서 7일로 단축)

### 왜 필요한가?

**현재 상태**:
- 세션 만료 시간: 30일
- 쿠키 만료 시간: 30일

**문제점**:
1. **장기간 세션 유지**: 사용자가 한 번 로그인하면 30일 동안 자동 로그인
2. **쿠키 탈취 위험**: 쿠키가 탈취되면 30일 동안 악용 가능
3. **보안 취약**: 장기간 유지되는 세션은 공격자에게 유리

**영향**:
- 쿠키 탈취 시 장기간 악용 가능
- 사용자가 로그아웃을 잊어버려 보안 위험 증가
- 공용 컴퓨터에서 사용 시 위험

**수정 방법**:
```typescript
// app/api/auth/login/route.ts
const SESSION_MAX_AGE = process.env.NODE_ENV === 'production' 
  ? 60 * 60 * 24 * 7  // 프로덕션: 7일
  : 60 * 60 * 24 * 30; // 개발: 30일

const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + (process.env.NODE_ENV === 'production' ? 7 : 30));

cookies().set(SESSION_COOKIE, session.id, {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE,
});
```

**추가 개선 사항**:
- 비활성 시간 기반 만료: 7일 동안 활동 없으면 자동 만료
- 중요한 작업 전 재인증 요구 (비밀번호 변경, 결제 등)

**우선순위**: 🟡 중간 (사용자 편의성 vs 보안 트레이드오프)

---

## 비교표

| 항목 | 현재 상태 | 개선 후 | 우선순위 |
|------|----------|---------|----------|
| **CSRF 보호** | 부분 구현 | 모든 API 검증 | 🟡 높음 |
| **Rate Limiting** | 일반 제한만 | 로그인/회원가입 강화 | 🟡 높음 |
| **세션 만료** | 30일 | 프로덕션 7일 | 🟡 중간 |

---

## 결정이 필요한 사항

### 1. CSRF 보호 완전성 확인
**질문**: 모든 API route를 수동으로 확인할까요, 아니면 자동화된 테스트를 만들까요?

**추천**: 자동화된 테스트 생성
- 모든 POST/PUT/DELETE API를 자동으로 스캔
- CSRF 토큰 없이 요청 시 403 에러 반환하는지 확인

### 2. Rate Limiting 강화
**질문**: 로그인 실패 시 얼마나 차단할까요?
- 옵션 A: 5회 실패 시 15분 차단
- 옵션 B: 10회 실패 시 1시간 차단
- 옵션 C: IP 기반 + 계정 기반 이중 차단

**추천**: 옵션 C (이중 차단)
- IP 차단: 공격자 차단
- 계정 차단: 특정 계정 보호

### 3. 세션 만료 시간
**질문**: 프로덕션에서 몇 일로 설정할까요?
- 옵션 A: 7일 (보안 우선)
- 옵션 B: 14일 (균형)
- 옵션 C: 30일 유지 (편의성 우선)

**추천**: 옵션 B (14일)
- 보안과 편의성의 균형
- 중요한 작업 전 재인증 요구

---

## 다음 단계

1. **환경 변수 검증 강화** - 방법 1 적용 (프로덕션에서만 필수)
2. **CSRF 보호 확인** - 자동화된 테스트 생성 또는 수동 확인
3. **Rate Limiting 강화** - 로그인/회원가입에 더 엄격한 제한 적용
4. **세션 만료 시간** - 프로덕션에서 14일로 조정 (또는 원하는 기간)

각 항목에 대해 결정해주시면 바로 적용하겠습니다!

