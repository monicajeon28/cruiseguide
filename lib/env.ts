// lib/env.ts
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'DATABASE_URL',
];

const optionalEnvVars = [
  'SESSION_SECRET',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'NEXT_PUBLIC_KAKAO_JS_KEY', // 카카오톡 JavaScript 키
  'KAKAO_APP_NAME', // 카카오 앱 이름
  'KAKAO_APP_ID', // 카카오 앱 ID
  'KAKAO_REST_API_KEY', // 카카오 REST API 키
  'KAKAO_ADMIN_KEY', // 카카오 Admin 키 (서버 전용)
  'NEXT_PUBLIC_KAKAO_CHANNEL_ID', // 카카오 채널 공개 ID
  'KAKAO_CHANNEL_BOT_ID', // 카카오 채널 봇 ID
  'ALIGO_API_KEY', // 알리고 API 키
  'ALIGO_USER_ID', // 알리고 사용자 ID
  'ALIGO_SENDER_PHONE', // 알리고 발신번호
  'ALIGO_KAKAO_SENDER_KEY', // 알리고 카카오 채널 Senderkey
  'ALIGO_KAKAO_CHANNEL_ID', // 알리고 카카오 채널 ID
  'PG_SIGNKEY', // PG 결제 Signkey (인증)
  'PG_FIELD_ENCRYPT_IV', // PG 필드암호화 IV (인증)
  'PG_FIELD_ENCRYPT_KEY', // PG 필드암호화 KEY (인증)
  'PG_SIGNKEY_NON_AUTH', // PG 결제 Signkey (비인증)
  'PG_FIELD_ENCRYPT_IV_NON_AUTH', // PG 필드암호화 IV (비인증)
  'PG_FIELD_ENCRYPT_KEY_NON_AUTH', // PG 필드암호화 KEY (비인증)
  'PG_MID_AUTH', // 웰컴페이먼츠 MID (인증)
  'PG_MID_PASSWORD', // 웰컴페이먼츠 MID 비밀번호
  'PG_MID_NON_AUTH', // 웰컴페이먼츠 MID (비인증)
  'PG_ADMIN_URL', // 웰컴페이먼츠 관리자 페이지 URL
  'PG_MERCHANT_NAME', // 가맹점 상호명
  'YOUTUBE_API_KEY', // YouTube Data API v3 키
];

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 기본 필수 변수
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'DATABASE_URL',
  ];
  
  // 프로덕션에서만 필수인 변수 (결제 기능 사용 시)
  const productionRequiredEnvVars = isProduction ? [
    'PG_SIGNKEY',
    'PG_MID_AUTH',
    'NEXT_PUBLIC_BASE_URL',
  ] : [];
  
  const allRequired = [...requiredEnvVars, ...productionRequiredEnvVars];
  const missing = allRequired.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ ERROR: Missing required environment variables: ${missing.join(', ')}`);
    console.error('💡 Hint: Check .env.local file and make sure all keys are set.');
    if (isProduction) {
      console.error('🚨 Production mode: Exiting due to missing required variables.');
      process.exit(1); // 프로덕션에서는 즉시 종료
    } else {
      console.warn('⚠️  Development mode: Continuing with warnings (not recommended for production)');
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

