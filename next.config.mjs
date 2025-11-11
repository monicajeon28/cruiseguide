/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const devCsp = [
  "default-src 'self'",
  // ✅ dev에서는 inline/eval 허용 + blob: (HMR/Next runtime용)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://developers.kakao.com https://t1.kakaocdn.net",
  // 외부 CSS를 쓰면 CDN 도메인 추가
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  // HMR/서버 호출 허용 (포트 바뀌는 경우 모두 허용)
  "connect-src 'self' http://localhost:* ws://localhost:* https: https://developers.kakao.com https://t1.kakaocdn.net",
  "media-src 'self' blob: data:",
  // YouTube iframe 허용
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

const prodCsp = [
  "default-src 'self'",
  // ❗prod에서는 inline/eval 금지 (보안)
  "script-src 'self' https://developers.kakao.com https://t1.kakaocdn.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: https://developers.kakao.com https://t1.kakaocdn.net",
  "media-src 'self' data:",
  // YouTube iframe 허용
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

const nextConfig = {
  // ESLint 빌드 시 무시 (임시)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript 타입 체크 무시 (임시)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Instrumentation 활성화 (스케줄러 자동 시작)
  experimental: {
    instrumentationHook: true,
  },
  
  // React Flow를 외부 패키지로 처리하여 SSR 문제 방지
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  
  // 이미지 최적화 설정 (작업자 C - 성능 개선)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  async headers() {
    // 개발 환경에서는 보안 헤더를 완전히 비활성화하여 디버깅 가능하도록 함
    if (isDev) {
      return []; // 개발 환경에서는 보안 헤더 없음
    }
    
    // 프로덕션 환경에서는 보안 헤더 유지
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy (XSS 방지)
          { key: 'Content-Security-Policy', value: prodCsp },
          
          // X-Frame-Options (Clickjacking 방지)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          
          // X-Content-Type-Options (MIME 타입 스니핑 방지)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // X-XSS-Protection (레거시 브라우저 XSS 필터 활성화)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          
          // Referrer-Policy (리퍼러 정보 제어 - YouTube embed를 위해 조정)
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          
          // Permissions-Policy (브라우저 기능 제어)
          { 
            key: 'Permissions-Policy', 
            value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()' 
          },
          
          // Strict-Transport-Security (HTTPS 강제)
          { 
            key: 'Strict-Transport-Security', 
            value: 'max-age=31536000; includeSubDomains; preload' 
          },
        ],
      },
    ];
  },
};

export default nextConfig;
