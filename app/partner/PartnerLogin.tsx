'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PartnerLoginProps {
  forceReauth?: boolean;
}

export default function PartnerLogin({ forceReauth = false }: PartnerLoginProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // next 파라미터 가져오기 (관리자 패널에서 대시보드 링크로 들어온 경우)
  const nextPath = searchParams?.get('next') || null;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const json = await response.json();
          if (json?.ok) {
            if (forceReauth) {
              setAlreadyLoggedIn(true);
            } else {
              // forceReauth가 아니면 자동으로 대시보드로 이동
              if (json?.user?.mallUserId) {
                // next 파라미터가 있으면 해당 경로로, 없으면 기본 대시보드로
                const redirectPath = nextPath || `/partner/${json.user.mallUserId}/dashboard`;
                router.replace(redirectPath);
              }
            }
          }
        }
      } catch (error) {
        console.error('[PartnerLogin] session check failed', error);
      }
    };
    checkSession();
  }, [forceReauth, router, nextPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError(null);
    
    try {
      setLoading(true);
      const phoneValue = phone.trim();
      const passwordValue = password.trim();
      
      if (!phoneValue || !passwordValue) {
        const errorMsg = '아이디와 비밀번호를 모두 입력해주세요.';
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone: phoneValue, password: passwordValue }),
      });
      
      let json;
      try {
        const text = await response.text();
        json = JSON.parse(text);
      } catch (parseError) {
        const errorMsg = `서버 응답을 파싱할 수 없습니다: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`;
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      if (!response.ok || !json?.ok) {
        const errorMsg = json?.error || `로그인에 실패했습니다. (상태 코드: ${response.status})`;
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // 로그인 후 사용자 정보를 가져와서 대시보드로 리다이렉트
      const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
      
      let meJson;
      try {
        const meText = await meResponse.text();
        meJson = JSON.parse(meText);
      } catch (parseError) {
        const errorMsg = `사용자 정보를 가져올 수 없습니다: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`;
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // 리다이렉트 경로 결정: API 응답의 next > URL의 next 파라미터 > 기본 대시보드
      let redirectPath = '/partner';
      if (meJson?.ok && meJson?.user?.mallUserId) {
        // 우선순위: API 응답의 next > URL의 next 파라미터 > 기본 대시보드
        redirectPath = json.next || nextPath || `/partner/${meJson.user.mallUserId}/dashboard`;
        
        // 즉시 리다이렉트
        window.location.href = redirectPath;
      } else {
        const errorMsg = '사용자 정보를 가져올 수 없습니다. mallUserId가 없습니다.';
        setError(errorMsg);
        router.replace('/partner');
      }
    } catch (error) {
      const errorMsg = `로그인 중 문제가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
      setError(errorMsg);
      console.error('[PartnerLogin] error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-rose-100 to-red-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow">
            <img src="/images/ai-cruise-logo.png" alt="크루즈닷" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">파트너 모드 로그인</h1>
          <p className="text-sm text-slate-600">
            대리점장 · 판매원 전용 크루즈몰 관리 메뉴에 접속하려면 로그인하세요.
          </p>
          {alreadyLoggedIn && (
            <p className="text-xs font-semibold text-blue-600">
              이미 로그인되어 있습니다. 보안을 위해 다시 한번 로그인해 주세요.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white/95 p-8 shadow-xl space-y-6 border border-slate-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <strong>오류:</strong> {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">아이디 / 전화번호</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: user1 또는 010-0000-0000"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 text-white font-semibold py-3 shadow hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">계정 정보는 본사에서 발급한 파트너 전용 자격을 사용합니다.</div>

        {!forceReauth && (
          <div className="text-center">
            <button
              onClick={async () => {
                try {
                  const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
                  const meJson = await meResponse.json();
                  if (meJson?.ok && meJson?.user?.mallUserId) {
                    // next 파라미터가 있으면 해당 경로로, 없으면 기본 대시보드로
                    const redirectPath = nextPath || `/partner/${meJson.user.mallUserId}/dashboard`;
                    router.replace(redirectPath);
                  } else {
                    alert('로그인이 필요합니다.');
                  }
                } catch (error) {
                  console.error('[PartnerLogin] navigation error', error);
                  alert('대시보드로 이동할 수 없습니다. 다시 로그인해주세요.');
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              이미 로그인하셨다면 바로 파트너 대시보드로 이동하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
