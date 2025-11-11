'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setCsrfToken, clearAllLocalStorage } from '@/lib/csrf-client';

export default function LoginPage() {
  const [phone, setPhone] = useState('');        // ← 공백
  const [password, setPassword] = useState('');  // ← 공백
  const [name, setName] = useState('');          // ← 공백
  const [error, setError] = useState<string | null>(null);
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
    setError(null); // 에러 초기화

    // 입력값 앞뒤 공백 제거
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    // 필수 필드 검증 (3800 일반 모드)
    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!trimmedPhone) {
      setError('전화번호를 입력해주세요.');
      return;
    }
    if (!trimmedPassword) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    // 크루즈 가이드 지니 비밀번호 검증 (3800만 허용)
    if (trimmedPassword !== '3800') {
      setError('비밀번호가 올바르지 않습니다. 비밀번호를 확인해주세요.');
      return;
    }

    console.log('[LOGIN] Submitting...', { phone: trimmedPhone, password: '***', name: trimmedName });

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: trimmedPhone, password: trimmedPassword, name: trimmedName, mode: 'user' }),
      });
      
      console.log('[LOGIN] Response status:', r.status);
      
      const data = await r.json().catch((err) => {
        console.error('[LOGIN] JSON parse error:', err);
        return { ok: false, error: '서버 응답을 처리할 수 없습니다.' };
      });
      
      console.log('[LOGIN] Response data:', data);
      
      if (!r.ok || !data?.ok) {
        const errorMessage = data?.error ?? '로그인 실패';
        const errorDetails = data?.details ?? '';
        const errorStack = data?.stack ?? '';
        
        console.error('[LOGIN] Login failed:', errorMessage, { 
          status: r.status, 
          statusText: r.statusText,
          data,
          details: errorDetails,
          stack: errorStack,
        });
        
        // 개발 환경에서는 상세 오류 정보도 콘솔에 출력
        if (errorDetails) {
          console.error('[LOGIN] Error details:', errorDetails);
        }
        if (errorStack) {
          console.error('[LOGIN] Error stack:', errorStack);
        }
        
        // 비밀번호 오류인 경우 명확한 메시지 표시
        if (r.status === 401 || errorMessage.includes('비밀번호') || errorMessage.includes('올바르지 않습니다')) {
          setError('비밀번호가 올바르지 않습니다. 비밀번호를 확인해주세요.');
        } else {
          // 테스트 모드 오류인 경우 상세 정보 포함
          const fullErrorMessage = errorDetails 
            ? `${errorMessage}\n\n상세 정보: ${errorDetails}` 
            : errorMessage;
          setError(fullErrorMessage);
        }
        return; // 절대 리다이렉트하지 않음
      }

      // 새 사용자 로그인 시 이전 사용자의 localStorage 데이터 정리
      clearAllLocalStorage();

      // CSRF 토큰 저장
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
        console.log('[LOGIN] CSRF token saved');
      }

      // 서버가 알려준 next로 이동
      const nextParam = sp.get('next');
      const decodedNext = nextParam ? decodeURIComponent(nextParam) : null;
      const next = data.next || decodedNext || '/chat';
      console.log('[LOGIN] Redirecting to:', next);
      router.push(next);
    } catch (error) {
      console.error('[LOGIN] Network error:', error);
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900 relative overflow-hidden">
      {/* 크루즈 배경 이미지 */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: `url('/크루즈정보사진/크루즈배경이미지/크루즈배경이미지 (1).png')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 md:py-12">
        <div className="w-full max-w-lg">
          {/* 헤더 섹션 */}
          <div className="text-center mb-6 space-y-4">
            <div className="flex justify-center mb-3">
              <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-gray-200">
                <img src="/images/ai-cruise-logo.png" alt="크루즈닷" className="h-14 mx-auto" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                크루즈 가이드 지니 AI
              </h1>
              <p className="text-lg md:text-xl text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
                프리미엄 크루즈 여행을 위한 AI 파트너
              </p>
            </div>

            {/* 신뢰 배지 */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="bg-white px-4 py-2 rounded-full border-2 border-gray-200 text-sm md:text-base font-semibold text-gray-700 shadow-sm">
                🔒 안전한 로그인
              </div>
              <div className="bg-white px-4 py-2 rounded-full border-2 border-gray-200 text-sm md:text-base font-semibold text-gray-700 shadow-sm">
                ⚡ 즉시 시작
              </div>
            </div>
          </div>

          {/* YouTube 영상 */}
          <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200 bg-white">
            <div className="aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/-p_6G69MgyQ?si=Z4ILad3Exz9aU0PW&autoplay=1&mute=0&loop=1&playlist=-p_6G69MgyQ&controls=1&modestbranding=1"
                title="크루즈 가이드 지니 AI 소개 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>

          {/* 메인 콘텐츠 카드 */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-200 p-6 md:p-8 space-y-6">
            {/* 로그인 폼 */}
            <form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
              {/* 에러 메시지 표시 */}
              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
                    <p className="text-base md:text-lg font-semibold text-red-800 leading-relaxed break-words">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <label className="block text-base md:text-lg font-semibold text-gray-700 mb-3">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-5 py-4 text-lg md:text-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="이름을 입력하세요"
                    style={{ fontSize: '18px', minHeight: '56px' }}
                  />
                </div>
                
                <div>
                  <label className="block text-base md:text-lg font-semibold text-gray-700 mb-3">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-5 py-4 text-lg md:text-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="전화번호를 입력하세요"
                    style={{ fontSize: '18px', minHeight: '56px' }}
                  />
                </div>
                
                <div>
                  <label className="block text-base md:text-lg font-semibold text-gray-700 mb-3">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-5 py-4 text-lg md:text-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="비밀번호를 입력하세요"
                    style={{ fontSize: '18px', minHeight: '56px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold text-xl md:text-2xl py-6 md:py-7 rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-2xl md:text-3xl">🚀</span>
                  <span>로그인</span>
                  <span className="text-2xl md:text-3xl">✨</span>
                </span>
              </button>
            </form>
          </div>

          <div className="text-center text-base md:text-lg mt-8 text-gray-700 space-y-4">
            <div>
              <a
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                크루즈닷 크루즈몰 보러가기
              </a>
            </div>
            <div className="leading-relaxed">
              비밀번호가 기억나지 않으신가요? <span className="font-semibold text-gray-900">관리자에게 문의하세요.</span>
            </div>
          </div>
          
          <div className="text-center text-sm md:text-base mt-4 text-gray-500">
            <a href="/admin/login" className="hover:text-blue-600 underline">
              관리자 로그인
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
