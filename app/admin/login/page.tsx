'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { setCsrfToken, clearAllLocalStorage } from '@/lib/csrf-client';

export default function AdminLogin() {
  const router = useRouter();
  const [name, setName] = useState(''); // 이름 추가
  const [phone, setPhone] = useState(''); // 초기값 공백
  const [password, setPassword] = useState(''); // 초기값 공백

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 앞뒤 공백 제거
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedName || !trimmedPhone || !trimmedPassword) {
      alert('이름, 전화번호, 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    console.log('[AdminLogin] 로그인 시도:', { name: trimmedName, phone: trimmedPhone, password: '***' });
    
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmedName, phone: trimmedPhone, password: trimmedPassword, mode: 'admin' }),
      });
      
      console.log('[AdminLogin] 응답 상태:', r.status);
      const data = await r.json().catch((err) => {
        console.error('[AdminLogin] JSON 파싱 오류:', err);
        return {};
      });
      
      console.log('[AdminLogin] 응답 데이터:', data);
      
      if (!r.ok || !data?.ok) {
        const errorMsg = data?.error ?? `HTTP ${r.status}`;
        console.error('[AdminLogin] 로그인 실패:', errorMsg);
        alert('관리자 로그인 실패: ' + errorMsg);
        return;
      }
      
      // 새 사용자 로그인 시 이전 사용자의 localStorage 데이터 정리
      clearAllLocalStorage();
      
      // CSRF 토큰 저장
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
        console.log('[AdminLogin] CSRF 토큰 저장됨');
      }
      
      console.log('[AdminLogin] 리다이렉트:', data.next || '/admin');
      window.location.replace(data.next || '/admin');
    } catch (error) {
      console.error('[AdminLogin] 요청 오류:', error);
      alert('로그인 요청 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">관리자 로그인</h1>
          <p className="text-sm text-gray-600">이름, 전화번호, 비밀번호를 모두 입력하세요</p>
        </div>
        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              placeholder="이름"
              name="name"
              autoComplete="name"
              value={name}
              onChange={e=>setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input
              placeholder="전화번호"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              placeholder="비밀번호"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white rounded-lg py-3 font-semibold transition-colors"
          >
            관리자 로그인
          </button>
        </form>
        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            일반 사용자 로그인
          </a>
        </div>
      </div>
    </div>
  );
}
