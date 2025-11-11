// app/api/community/auth/login/route.ts
// 커뮤니티 전용 로그인 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies, headers } from 'next/headers';
import { randomBytes } from 'crypto';
import { generateCsrfToken } from '@/lib/csrf';
import { checkRateLimit, RateLimitPolicies } from '@/lib/rate-limiter';
import { getClientIpFromRequest } from '@/lib/ip-utils';
import { authLogger, securityLogger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'cg.sid.v2';

export async function POST(req: Request) {
  try {
    // Rate Limiting 체크
    const headersList = headers();
    const clientIp = getClientIpFromRequest(req, headersList);
    const rateLimitKey = `community-login:${clientIp}`;
    
    const { limited, resetTime } = checkRateLimit(rateLimitKey, RateLimitPolicies.LOGIN);
    
    if (limited) {
      securityLogger.rateLimitExceeded(clientIp, '/api/community/auth/login', RateLimitPolicies.LOGIN.limit);
      const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
      return NextResponse.json(
        { 
          ok: false, 
          error: '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          }
        }
      );
    }

    const { username, password } = await req.json();

    // 입력값 앞뒤 공백 제거
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUsername || !trimmedPassword) {
      return NextResponse.json({ 
        ok: false, 
        error: '아이디와 비밀번호를 입력해주세요.' 
      }, { status: 400 });
    }

    // 커뮤니티 사용자 찾기 (role이 'community'인 사용자만)
    const user = await prisma.user.findFirst({
      where: { 
        phone: trimmedUsername,  // 커뮤니티 회원가입 시 phone 필드에 username 저장
        role: 'community',  // 커뮤니티 전용 사용자만
      },
      select: { 
        id: true, 
        phone: true,
        password: true,
        name: true,
        email: true,
        role: true,
        loginCount: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        ok: false, 
        error: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      }, { status: 401 });
    }

    // 비밀번호 확인 (bcrypt 해시 비교)
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        ok: false, 
        error: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      }, { status: 401 });
    }

    const userId = user.id;

    // 로그인 횟수 증가
    await prisma.user.update({
      where: { id: userId },
      data: { loginCount: { increment: 1 } },
    });

    // 세션 ID 생성 (32바이트 랜덤 값을 hex 문자열로)
    const sessionId = randomBytes(32).toString('hex');
    
    // CSRF 토큰 생성
    const csrfToken = generateCsrfToken();

    // 세션 만료 시간 설정 (30일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 세션 생성
    const session = await prisma.session.create({
      data: { 
        id: sessionId,
        userId,
        csrfToken,
        expiresAt,
      },
      select: { id: true, csrfToken: true },
    });

    // 쿠키 심기
    cookies().set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    // 로그인 성공 로그
    authLogger.loginSuccess(userId, clientIp);

    // next 파라미터 확인
    const url = new URL(req.url);
    const nextParam = url.searchParams.get('next');
    const next = nextParam || '/community';

    return NextResponse.json({ 
      ok: true, 
      next,
      csrfToken: session.csrfToken,
    });
  } catch (e) {
    console.error('[Community Auth Login] Internal Error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        ok: false, 
        error: '로그인 실패',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

