# 환경 변수 검증 강화 방법

## 현재 상태

`lib/env.ts`에서 기본적인 환경 변수만 검증하고 있습니다:
- 필수: `GEMINI_API_KEY`, `DATABASE_URL`
- 선택: 나머지는 모두 optional

## 문제점

PG 결제 관련 환경 변수가 없으면 결제 기능이 작동하지 않지만, 앱 시작 시 에러가 발생하지 않아 배포 후에야 문제를 발견할 수 있습니다.

## 해결 방법

### 방법 1: 프로덕션 환경에서만 필수로 설정 (권장)

```typescript
// lib/env.ts
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'DATABASE_URL',
];

// 프로덕션 환경에서만 필수인 변수들
const productionRequiredEnvVars = [
  'NEXT_PUBLIC_BASE_URL', // 프로덕션에서는 필수
  'PG_SIGNKEY', // 결제 기능 사용 시 필수
  'PG_MID_AUTH', // 결제 기능 사용 시 필수
];

const optionalEnvVars = [
  // ... 기존 optional 변수들
];

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 기본 필수 변수 확인
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ ERROR: Missing required environment variables: ${missing.join(', ')}`);
    console.error('💡 Hint: Check .env.local file and make sure all keys are set.');
    process.exit(1);
  }
  
  // 프로덕션 환경에서만 추가 검증
  if (isProduction) {
    const missingProduction = productionRequiredEnvVars.filter(key => !process.env[key]);
    
    if (missingProduction.length > 0) {
      console.error(`❌ ERROR: Missing production-required environment variables: ${missingProduction.join(', ')}`);
      console.error('💡 Hint: These variables are required in production environment.');
      process.exit(1);
    }
  }
  
  // 선택적 변수 경고
  const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`⚠️  Warning: Missing optional environment variables: ${missingOptional.join(', ')}`);
    console.warn('💡 Some features may not work properly.');
  }
  
  console.log('✅ Environment variables validated.');
}
```

### 방법 2: 기능별 그룹 검증

```typescript
// lib/env.ts
const featureGroups = {
  core: ['GEMINI_API_KEY', 'DATABASE_URL'],
  payment: ['PG_SIGNKEY', 'PG_MID_AUTH', 'PG_FIELD_ENCRYPT_IV', 'PG_FIELD_ENCRYPT_KEY'],
  messaging: ['ALIGO_API_KEY', 'ALIGO_USER_ID', 'ALIGO_SENDER_PHONE'],
  kakao: ['KAKAO_REST_API_KEY', 'KAKAO_ADMIN_KEY'],
};

export function validateEnv() {
  // 핵심 기능은 항상 필수
  const missingCore = featureGroups.core.filter(key => !process.env[key]);
  if (missingCore.length > 0) {
    console.error(`❌ ERROR: Missing core environment variables: ${missingCore.join(', ')}`);
    process.exit(1);
  }
  
  // 프로덕션에서는 결제 관련도 필수
  if (process.env.NODE_ENV === 'production') {
    const missingPayment = featureGroups.payment.filter(key => !process.env[key]);
    if (missingPayment.length > 0) {
      console.error(`❌ ERROR: Missing payment environment variables: ${missingPayment.join(', ')}`);
      console.error('💡 Payment features will not work without these variables.');
      process.exit(1);
    }
  }
  
  // 선택적 기능 경고
  const missingMessaging = featureGroups.messaging.filter(key => !process.env[key]);
  if (missingMessaging.length > 0) {
    console.warn(`⚠️  Warning: Missing messaging variables: ${missingMessaging.join(', ')}`);
    console.warn('💡 SMS/KakaoTalk features may not work.');
  }
  
  console.log('✅ Environment variables validated.');
}
```

### 방법 3: 런타임 검증 (더 유연함)

```typescript
// lib/env.ts
export function validateEnvForFeature(feature: 'payment' | 'messaging' | 'kakao') {
  const featureVars = {
    payment: ['PG_SIGNKEY', 'PG_MID_AUTH'],
    messaging: ['ALIGO_API_KEY', 'ALIGO_USER_ID'],
    kakao: ['KAKAO_REST_API_KEY'],
  };
  
  const required = featureVars[feature] || [];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables for ${feature}: ${missing.join(', ')}`);
  }
}

// 사용 예시:
// app/api/payment/request/route.ts
export async function POST(req: NextRequest) {
  try {
    validateEnvForFeature('payment'); // 결제 기능 사용 전 검증
    // ... 결제 로직
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```

## 권장 방법

**방법 1 (프로덕션 환경에서만 필수)**을 권장합니다:
- ✅ 배포 전에 문제를 미리 발견
- ✅ 개발 환경에서는 유연하게 작동
- ✅ 구현이 간단함

## 적용 방법

1. `lib/env.ts` 파일 수정
2. 앱 시작 시 자동 검증 (이미 `app/layout.tsx`에서 호출됨)
3. 배포 전 테스트: 환경 변수 제거 후 앱 시작 시 에러 발생 확인

