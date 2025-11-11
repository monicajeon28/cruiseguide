import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// 미들웨어는 Edge Runtime에서 실행되므로, DB 직접 접근 로직을 제거합니다.
// export const runtime = 'nodejs'; // 이 설정은 미들웨어에 적용되지 않습니다.

const SECRET_KEY = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 로그인, 회원가입 페이지, API 라우트, 정적 파일 등은 미들웨어 검사에서 제외
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.startsWith('/onboarding') // 온보딩 페이지도 미들웨어 검사에서 제외
  ) {
    return NextResponse.next();
  }

  // 토큰이 없는 경우, 로그인 페이지로 리디렉션
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 토큰이 있는 경우, 유효성 검사
  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    await jose.jwtVerify(token, secret);
    // 토큰이 유효하면 요청 계속 진행
    return NextResponse.next();
  } catch (error) {
    // 토큰이 유효하지 않은 경우
    const response = NextResponse.redirect(new URL('/login', request.url));
    // 쿠키 삭제
    response.cookies.set('auth_token', '', { maxAge: -1 });
    return response;
  }
}

// 미들웨어가 실행될 경로를 지정합니다.
export const config = {
  matcher: [
    /*
     * 모든 요청 경로에 대해 미들웨어를 실행하되,
     * api, _next/static, _next/image, favicon.ico 로 시작하는 경로는 제외합니다.
     */
    '/((?!api|login|signup|onboarding|_next/static|_next/image|favicon.ico).*)',
  ],
}; 