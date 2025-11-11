// app/mall/signup/page.tsx
// 크루즈몰 전용 회원가입 페이지

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiCheck, FiX } from 'react-icons/fi';

export default function MallSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    email: '',
    emailDomain: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  
  // 실시간 검증 상태
  const [validation, setValidation] = useState({
    username: { checking: false, available: null as boolean | null, message: '' },
    password: { match: null as boolean | null, message: '' },
    nickname: { checking: false, available: null as boolean | null, message: '' },
    email: { valid: null as boolean | null, message: '' }
  });

  const emailDomains = ['naver.com', 'hanmail.net', 'gmail.com', 'kakao.com', 'daum.net'];

  useEffect(() => {
    const next = searchParams.get('next');
    if (next) {
      setNextUrl(next);
    }
  }, [searchParams]);

  // 아이디 중복 확인 (디바운싱)
  const checkUsername = useCallback(
    async (username: string) => {
      if (!username || username.length < 4) {
        setValidation(prev => ({
          ...prev,
          username: { checking: false, available: null, message: username.length > 0 ? '아이디는 4자 이상이어야 합니다.' : '' }
        }));
        return;
      }

      setValidation(prev => ({
        ...prev,
        username: { checking: true, available: null, message: '확인 중...' }
      }));

      try {
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        setValidation(prev => ({
          ...prev,
          username: {
            checking: false,
            available: data.available,
            message: data.message || ''
          }
        }));
      } catch (err) {
        setValidation(prev => ({
          ...prev,
          username: { checking: false, available: null, message: '확인 중 오류가 발생했습니다.' }
        }));
      }
    },
    []
  );

  // 닉네임 중복 확인 (디바운싱)
  const checkNickname = useCallback(
    async (nickname: string) => {
      if (!nickname || nickname.length < 2) {
        setValidation(prev => ({
          ...prev,
          nickname: { checking: false, available: null, message: nickname.length > 0 ? '닉네임은 2자 이상이어야 합니다.' : '' }
        }));
        return;
      }

      setValidation(prev => ({
        ...prev,
        nickname: { checking: true, available: null, message: '확인 중...' }
      }));

      try {
        const response = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
        const data = await response.json();
        
        setValidation(prev => ({
          ...prev,
          nickname: {
            checking: false,
            available: data.available,
            message: data.message || ''
          }
        }));
      } catch (err) {
        setValidation(prev => ({
          ...prev,
          nickname: { checking: false, available: null, message: '확인 중 오류가 발생했습니다.' }
        }));
      }
    },
    []
  );

  // 아이디 입력 시 중복 확인 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsername(formData.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, checkUsername]);

  // 닉네임 입력 시 중복 확인 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.nickname) {
        checkNickname(formData.nickname);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.nickname, checkNickname]);

  // 비밀번호 일치 확인
  useEffect(() => {
    if (formData.passwordConfirm) {
      if (formData.password === formData.passwordConfirm) {
        setValidation(prev => ({
          ...prev,
          password: { match: true, message: '비밀번호가 일치합니다.' }
        }));
      } else {
        setValidation(prev => ({
          ...prev,
          password: { match: false, message: '비밀번호가 일치하지 않습니다.' }
        }));
      }
    } else {
      setValidation(prev => ({
        ...prev,
        password: { match: null, message: '' }
      }));
    }
  }, [formData.password, formData.passwordConfirm]);

  // 이메일 형식 확인
  useEffect(() => {
    const fullEmail = formData.emailDomain 
      ? `${formData.email.split('@')[0]}@${formData.emailDomain}`
      : formData.email;
    
    if (fullEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(fullEmail)) {
        setValidation(prev => ({
          ...prev,
          email: { valid: true, message: '올바른 이메일 형식입니다.' }
        }));
      } else {
        setValidation(prev => ({
          ...prev,
          email: { valid: false, message: '올바른 이메일 형식이 아닙니다.' }
        }));
      }
    } else {
      setValidation(prev => ({
        ...prev,
        email: { valid: null, message: '' }
      }));
    }
  }, [formData.email, formData.emailDomain]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleEmailDomainSelect = (domain: string) => {
    const emailPrefix = formData.email.split('@')[0] || '';
    setFormData({
      ...formData,
      email: emailPrefix,
      emailDomain: domain
    });
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes('@')) {
      const [prefix, domain] = value.split('@');
      setFormData({
        ...formData,
        email: prefix,
        emailDomain: domain || ''
      });
    } else {
      setFormData({
        ...formData,
        email: value
      });
    }
  };

  const validate = () => {
    if (!formData.username.trim()) {
      setError('아이디를 입력해주세요.');
      return false;
    }
    if (validation.username.available === false) {
      setError('사용할 수 없는 아이디입니다.');
      return false;
    }
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (!formData.nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return false;
    }
    if (validation.nickname.available === false) {
      setError('사용할 수 없는 닉네임입니다.');
      return false;
    }
    
    const fullEmail = formData.emailDomain 
      ? `${formData.email}@${formData.emailDomain}`
      : formData.email;
    
    if (!fullEmail) {
      setError('이메일을 입력해주세요.');
      return false;
    }
    if (validation.email.valid === false) {
      setError('올바른 이메일 형식이 아닙니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullEmail = formData.emailDomain 
        ? `${formData.email}@${formData.emailDomain}`
        : formData.email;

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          nickname: formData.nickname.trim(),
          email: fullEmail.trim(),
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[MALL SIGNUP] JSON 파싱 오류:', parseError);
        setError('서버 응답을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      if (!response.ok || !data.ok) {
        const errorMessage = data.error || '회원가입에 실패했습니다.';
        console.error('[MALL SIGNUP] API 오류:', {
          status: response.status,
          error: errorMessage,
          data
        });
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // 회원가입 성공 후 크루즈몰 로그인 페이지로 이동
      const loginUrl = nextUrl 
        ? `/mall/login?message=회원가입이 완료되었습니다. 로그인해주세요.&next=${encodeURIComponent(nextUrl)}`
        : '/mall/login?message=회원가입이 완료되었습니다. 로그인해주세요.';
      router.push(loginUrl);
    } catch (err) {
      console.error('[MALL SIGNUP] 예상치 못한 오류:', err);
      const errorMessage = err instanceof Error 
        ? `회원가입 중 오류가 발생했습니다: ${err.message}`
        : '회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인하고 잠시 후 다시 시도해주세요.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 text-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 space-y-5">
          <Link href="/">
            <img src="/images/ai-cruise-logo.png" alt="크루즈닷" className="mx-auto h-12 cursor-pointer" />
          </Link>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900">크루즈몰 회원가입</h1>
          <p className="text-base md:text-lg text-gray-700 flex items-center justify-center gap-2">
            <span>크루즈 상품을 둘러보고 구매하세요</span>
            <span role="img" aria-label="cruise">🛒</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-blue-100 p-8 md:p-10 space-y-6" autoComplete="off">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 아이디 */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              아이디 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="4자 이상 입력해주세요"
                autoComplete="off"
                className={`w-full rounded-xl border px-4 py-3 pr-10 text-lg focus:ring-2 focus:outline-none ${
                  validation.username.available === false
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : validation.username.available === true
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
              {formData.username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validation.username.checking ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : validation.username.available === true ? (
                    <FiCheck className="text-green-600" size={20} />
                  ) : validation.username.available === false ? (
                    <FiX className="text-red-600" size={20} />
                  ) : null}
                </div>
              )}
            </div>
            {validation.username.message && (
              <p className={`text-sm mt-1 ${
                validation.username.available === true ? 'text-green-600' : 
                validation.username.available === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {validation.username.message}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="6자 이상 입력해주세요"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력해주세요"
                autoComplete="new-password"
                className={`w-full rounded-xl border px-4 py-3 pr-10 text-lg focus:ring-2 focus:outline-none ${
                  validation.password.match === false
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : validation.password.match === true
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
              {formData.passwordConfirm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validation.password.match === true ? (
                    <FiCheck className="text-green-600" size={20} />
                  ) : validation.password.match === false ? (
                    <FiX className="text-red-600" size={20} />
                  ) : null}
                </div>
              )}
            </div>
            {validation.password.message && (
              <p className={`text-sm mt-1 ${
                validation.password.match === true ? 'text-green-600' : 
                validation.password.match === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {validation.password.message}
              </p>
            )}
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="2자 이상 입력해주세요"
                autoComplete="off"
                className={`w-full rounded-xl border px-4 py-3 pr-10 text-lg focus:ring-2 focus:outline-none ${
                  validation.nickname.available === false
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : validation.nickname.available === true
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
              {formData.nickname && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validation.nickname.checking ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : validation.nickname.available === true ? (
                    <FiCheck className="text-green-600" size={20} />
                  ) : validation.nickname.available === false ? (
                    <FiX className="text-red-600" size={20} />
                  ) : null}
                </div>
              )}
            </div>
            {validation.nickname.message && (
              <p className={`text-sm mt-1 ${
                validation.nickname.available === true ? 'text-green-600' : 
                validation.nickname.available === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {validation.nickname.message}
              </p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleEmailInput}
                placeholder="이메일"
                autoComplete="email"
                className={`flex-1 rounded-xl border px-4 py-3 text-lg focus:ring-2 focus:outline-none ${
                  validation.email.valid === false
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : validation.email.valid === true
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
              <span className="flex items-center px-2 text-gray-600">@</span>
              <select
                name="emailDomain"
                value={formData.emailDomain}
                onChange={e => handleEmailDomainSelect(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                <option value="">직접 입력</option>
                {emailDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            {validation.email.message && (
              <p className={`text-sm mt-1 ${
                validation.email.valid === true ? 'text-green-600' : 
                validation.email.valid === false ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {validation.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 text-white font-bold text-lg py-3.5 shadow-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="text-center text-base mt-8 text-gray-700 space-y-3">
          <div>
            <Link
              href="/mall/login"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors shadow"
            >
              크루즈몰 메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

