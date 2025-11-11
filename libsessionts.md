// 서버 전용 유틸 (App Router)
// named export 로 반드시 내보냅니다!
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_KEY = 'cg.sid';          // 세션 쿠키 키
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export type SessionPayload = {
  userId: string;
  name: string;
  phone: string;
  onboarded: boolean; // 온보딩 완료 여부 추가
};

export function getSessionCookie() {
  return cookies().get(COOKIE_KEY)?.value || '';
}

export function getSession(): SessionPayload | null {
  const raw = getSessionCookie();
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionUserId(): string | null {
  return getSession()?.userId ?? null;
}

export function setSession(res: NextResponse, payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  res.cookies.set(COOKIE_KEY, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE_KEY, '', { path: '/', maxAge: 0 });
  return res;
}
