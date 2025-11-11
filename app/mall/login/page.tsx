// app/mall/login/page.tsx
// 크루즈몰 전용 로그인 페이지

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setCsrfToken, clearAllLocalStorage } from '@/lib/csrf-client';

function MallLoginPageContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 메시지 확인
    const message = sp.get('message');
    if (message) {
      alert(message);
    }
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 입력값 앞뒤 공백 제거
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    console.log('[MALL LOGIN] Submitting...', { username: trimmedUsername });

    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        phone: trimmedUsername, // 크루즈몰은 phone 필드에 username 저장
        password: trimmedPassword, 
        mode: 'community' // 크루즈몰 로그인 모드
      }),
    });
    
    console.log('[MALL LOGIN] Response status:', r.status);
    
    const data = await r.json().catch((err) => {
      console.error('[MALL LOGIN] JSON parse error:', err);
      return {};
    });
    
    console.log('[MALL LOGIN] Response data:', data);
    
    if (!r.ok || !data?.ok) {
      const errorMessage = data?.error ?? '로그인 실패';
      console.error('[MALL LOGIN] Login failed:', errorMessage);
      alert(errorMessage);
      return;
    }

    // 새 사용자 로그인 시 이전 사용자의 localStorage 데이터 정리
    clearAllLocalStorage();

    // CSRF 토큰 저장
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
      console.log('[MALL LOGIN] CSRF token saved');
    }

    // 서버가 알려준 next로 이동, 없으면 메인 페이지로
    const nextParam = sp.get('next');
    const decodedNext = nextParam ? decodeURIComponent(nextParam) : null;
    const next = data.next || decodedNext || '/';
    console.log('[MALL LOGIN] Redirecting to:', next);
    router.push(next);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 text-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 space-y-5">
          <Link href="/">
            <img src="/images/ai-cruise-logo.png" alt="크루즈닷" className="mx-auto h-12 cursor-pointer" />
          </Link>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900">크루즈몰 로그인</h1>
          <p className="text-base md:text-lg text-gray-700 flex items-center justify-center gap-2">
            <span>크루즈 상품을 둘러보고 구매하세요</span>
            <span role="img" aria-label="cruise">🛒</span>
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-blue-100 p-8 md:p-10 space-y-6"
          autoComplete="off"
        >
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">아이디</label>
            <input
              name="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">비밀번호</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 text-white font-bold text-lg py-3.5 shadow-md hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            로그인
          </button>
        </form>

        <div className="text-center text-base mt-8 text-gray-700 space-y-3">
          <div>
            <Link
              href="/mall/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow"
            >
              회원가입
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow"
            >
              크루즈몰 메인으로 돌아가기
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            비밀번호가 기억나지 않으신가요? <span className="font-semibold text-gray-900">관리자에게 문의하세요.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MallLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">로딩 중...</div>}>
      <MallLoginPageContent />
    </Suspense>
  );
}

