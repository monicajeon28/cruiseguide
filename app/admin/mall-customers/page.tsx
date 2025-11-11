// app/admin/mall-customers/page.tsx
// 크루즈몰 고객 관리 페이지

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiX, FiCheck, FiInfo } from 'react-icons/fi';

interface MallCustomer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isLocked: boolean;
  isHibernated: boolean;
  genieStatus: string | null;
  genieLinkedAt: string | null;
  reviewCount: number;
  postCount: number;
  commentCount: number;
  inquiryCount: number;
  viewCount: number;
  currentPassword?: string | null;
  isLinked?: boolean; // 연동 여부
  genieUser: {
    id: number;
    name: string | null;
    phone: string | null;
    genieStatus: string | null;
    genieLinkedAt: string | null;
    linkedBy: string | null;
    daysRemaining: number | null;
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MallCustomersPage() {
  const [customers, setCustomers] = useState<MallCustomer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    email: '',
    emailDomain: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showStatusGuide, setShowStatusGuide] = useState(true);
  const [validation, setValidation] = useState({
    username: { checking: false, available: null as boolean | null, message: '' },
    password: { match: null as boolean | null, message: '' },
    nickname: { checking: false, available: null as boolean | null, message: '' },
    email: { valid: null as boolean | null, message: '' },
  });

  const emailDomains = ['naver.com', 'hanmail.net', 'gmail.com', 'kakao.com', 'daum.net'];

  // 필터 및 검색 상태
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'hibernated' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'reviewCount' | 'lastActiveAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 검색어 debounce
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadCustomers();
  }, [search, status, sortBy, sortOrder, pagination.page]);

  const handleResetPassword = async (customerId: number, currentPassword: string | null) => {
    const newPassword = prompt(
      `비밀번호를 변경하세요:\n\n현재 비밀번호: ${currentPassword || '(없음)'}`,
      currentPassword || '3800'
    );
    
    if (!newPassword) return;
    
    if (newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    if (!confirm(`비밀번호를 "${newPassword}"로 변경하시겠습니까?`)) return;
    
    setResettingPassword(customerId);
    
    try {
      const response = await fetch(`/api/admin/users/${customerId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
      }
      
      alert(`✅ 비밀번호가 "${newPassword}"로 변경되었습니다.`);
      await loadCustomers();
    } catch (error) {
      console.error('[MallCustomers] Failed to reset password:', error);
      alert(`❌ 비밀번호 변경 실패\n\n${error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.'}`);
    } finally {
      setResettingPassword(null);
    }
  };

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search,
        status,
        sortBy,
        sortOrder,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/mall-customers?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('인증이 필요합니다. 다시 로그인해 주세요.');
        }
        throw new Error('고객 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '고객 목록을 불러오는 중 오류가 발생했습니다.');
      }

      setCustomers(data.customers || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError(error instanceof Error ? error.message : '고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 아이디 중복 확인
  const checkUsername = useCallback(async (username: string) => {
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
  }, []);

  // 닉네임 중복 확인
  const checkNickname = useCallback(async (nickname: string) => {
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
  }, []);

  // 아이디 입력 시 중복 확인
  useEffect(() => {
    const timer = setTimeout(() => {
      if (createFormData.username && isCreateModalOpen) {
        checkUsername(createFormData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [createFormData.username, isCreateModalOpen, checkUsername]);

  // 닉네임 입력 시 중복 확인
  useEffect(() => {
    const timer = setTimeout(() => {
      if (createFormData.nickname && isCreateModalOpen) {
        checkNickname(createFormData.nickname);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [createFormData.nickname, isCreateModalOpen, checkNickname]);

  // 비밀번호 일치 확인
  useEffect(() => {
    if (createFormData.passwordConfirm) {
      if (createFormData.password === createFormData.passwordConfirm) {
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
  }, [createFormData.password, createFormData.passwordConfirm]);

  // 이메일 형식 확인
  useEffect(() => {
    const fullEmail = createFormData.emailDomain 
      ? `${createFormData.email.split('@')[0]}@${createFormData.emailDomain}`
      : createFormData.email;
    
    if (fullEmail && isCreateModalOpen) {
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
  }, [createFormData.email, createFormData.emailDomain, isCreateModalOpen]);

  const handleCreateMallCustomer = async () => {
    if (!createFormData.username || !createFormData.password || !createFormData.nickname || !createFormData.email) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (validation.username.available === false) {
      alert('사용할 수 없는 아이디입니다.');
      return;
    }

    if (createFormData.password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (createFormData.password !== createFormData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (validation.nickname.available === false) {
      alert('사용할 수 없는 닉네임입니다.');
      return;
    }

    const fullEmail = createFormData.emailDomain 
      ? `${createFormData.email.split('@')[0]}@${createFormData.emailDomain}`
      : createFormData.email;

    if (!fullEmail || validation.email.valid === false) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/customers/create-mall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: createFormData.username.trim(),
          password: createFormData.password,
          nickname: createFormData.nickname.trim(),
          email: fullEmail.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '크루즈몰 회원 추가에 실패했습니다.');
      }

      alert('크루즈몰 회원이 추가되었습니다.');
      setIsCreateModalOpen(false);
      setCreateFormData({
        username: '',
        password: '',
        passwordConfirm: '',
        nickname: '',
        email: '',
        emailDomain: '',
      });
      setValidation({
        username: { checking: false, available: null, message: '' },
        password: { match: null, message: '' },
        nickname: { checking: false, available: null, message: '' },
        email: { valid: null, message: '' },
      });
      await loadCustomers();
    } catch (error) {
      console.error('Failed to create mall customer:', error);
      alert(error instanceof Error ? error.message : '크루즈몰 회원 추가 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEmailDomainSelect = (domain: string) => {
    const emailPrefix = createFormData.email.split('@')[0] || '';
    setCreateFormData({
      ...createFormData,
      email: emailPrefix,
      emailDomain: domain
    });
  };

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes('@')) {
      const [prefix, domain] = value.split('@');
      setCreateFormData({
        ...createFormData,
        email: prefix,
        emailDomain: domain || ''
      });
    } else {
      setCreateFormData({
        ...createFormData,
        email: value
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">크루즈몰 고객 관리</h1>
          <p className="text-gray-600">크루즈몰(커뮤니티, 리뷰, 상품 문의) 활동 고객을 조회하고 관리하세요</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          고객 추가
        </button>
      </div>

      {/* 크루즈몰 고객 상태 확인 가이드 */}
      {showStatusGuide && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6 mb-6 relative">
          <button
            onClick={() => setShowStatusGuide(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FiInfo className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-3">크루즈몰 고객 상태 확인 가이드</h3>
              <div className="space-y-3 text-sm text-green-800">
                <div>
                  <p className="font-semibold mb-2">크루즈몰 고객 상태:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 border border-purple-300 rounded text-xs font-semibold">통합</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">크루즈몰</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈몰 가입 + 크루즈 가이드 지니 연동 완료</p>
                      <p className="text-xs text-gray-500 mt-1">• 두 가지 서비스를 모두 사용하는 통합 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">크루즈몰</span>
                        <span className="text-xs text-gray-600">초록색</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈몰에 가입한 고객 (커뮤니티, 리뷰, 상품 문의 사용 가능)</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">크루즈몰</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded text-xs font-semibold">활성</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈몰 가입 + 크루즈 가이드 지니 사용 중인 고객</p>
                      <p className="text-xs text-gray-500 mt-1">• 두 가지 서비스를 모두 사용하는 통합 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">크루즈몰</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded text-xs font-semibold">잠금</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈몰 가입 + 지니 계정이 잠금 처리된 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">크루즈몰</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-xs font-semibold">동면</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈몰 가입 + 지니 계정이 동면 상태인 고객</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="font-semibold mb-2">크루즈몰 고객 관리 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><strong>고객 추가</strong>: "고객 추가" 버튼으로 크루즈몰 회원가입 (아이디, 비밀번호, 닉네임, 이메일)</li>
                    <li><strong>비밀번호 수정</strong>: 비밀번호 옆 편집 아이콘(✏️)을 클릭하여 변경</li>
                    <li><strong>상세 정보</strong>: 고객 이름 클릭 또는 "상세보기" 버튼으로 상세 정보 확인</li>
                    <li><strong>지니 연동</strong>: 상세 페이지에서 크루즈 가이드 지니와 연동 가능</li>
                    <li><strong>활동 내역</strong>: 후기, 게시글, 댓글, 문의, 조회 수 등 확인 가능</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="이름, 전화번호, 이메일로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="hibernated">동면</option>
              <option value="locked">잠금</option>
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(field);
                setSortOrder(order);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">최신 가입순</option>
              <option value="createdAt-asc">오래된 가입순</option>
              <option value="name-asc">이름순 (가나다)</option>
              <option value="name-desc">이름순 (역순)</option>
              <option value="reviewCount-desc">후기 많은순</option>
              <option value="lastActiveAt-desc">최근 접속순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 고객 테이블 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">크루즈몰 고객</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">비밀번호</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">크루즈 가이드 지니</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">남은 일수</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">후기</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">게시글</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">댓글</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">문의</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">조회</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                      고객이 없습니다.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    // 상태 딱지 렌더링 (전체 고객 관리와 동일한 로직)
                    const renderStatusBadges = () => {
                      const badges: Array<{ label: string; color: string }> = [];
                      
                      // 크루즈가이드 지니와 연동된 경우 "통합" 딱지 추가 (최우선)
                      if (customer.isLinked && customer.genieUser) {
                        badges.push({ 
                          label: '통합', 
                          color: 'bg-purple-100 text-purple-800 border border-purple-300' 
                        });
                      }
                      
                      // 크루즈몰 고객 딱지 (초록색)
                      badges.push({ 
                        label: '크루즈몰', 
                        color: 'bg-green-100 text-green-800 border border-green-300' 
                      });
                      
                      // 지니 상태 딱지 (전체 고객관리와 동일한 로직)
                      // genieStatus는 API에서 계산된 값 사용
                      if (customer.genieStatus === 'active' || customer.genieStatus === 'package') {
                        badges.push({ 
                          label: '활성', 
                          color: 'bg-blue-100 text-blue-800 border border-blue-300' 
                        });
                      } else if (customer.genieStatus === 'locked' || customer.isLocked) {
                        badges.push({ 
                          label: '잠금', 
                          color: 'bg-red-100 text-red-800 border border-red-300' 
                        });
                      } else if (customer.genieStatus === 'dormant' || customer.isHibernated) {
                        badges.push({ 
                          label: '동면', 
                          color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                        });
                      }
                      
                      return badges;
                    };
                    
                    const statusBadges = renderStatusBadges();
                    
                    // 연동 방식 표시 텍스트
                    const getLinkedByText = (linkedBy: string | null) => {
                      switch (linkedBy) {
                        case 'mallUserId':
                          return '크루즈몰 사용자 ID로 연동';
                        case 'same_user':
                          return '같은 사용자 (자동 연동)';
                        case 'name_phone':
                          return '이름·전화번호로 연동';
                        default:
                          return '';
                      }
                    };

                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        {/* 크루즈몰 고객 정보 */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">{customer.name || '이름 없음'}</div>
                            <div className="text-sm text-gray-600">{customer.phone || '-'}</div>
                            <div className="text-sm text-gray-600">{customer.email || '-'}</div>
                            <div className="text-xs text-gray-400">ID: {customer.id}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {customer.currentPassword || '-'}
                            </span>
                            <button
                              onClick={() => handleResetPassword(customer.id, customer.currentPassword || null)}
                              disabled={resettingPassword === customer.id}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="비밀번호 수정"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          </div>
                        </td>
                        {/* 크루즈 가이드 지니 정보 */}
                        <td className="px-4 py-3">
                          {customer.genieUser ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-900">{customer.genieUser.name || '-'}</div>
                              <div className="text-sm text-gray-600">{customer.genieUser.phone || '-'}</div>
                              <div className="text-xs">
                                {customer.genieUser.genieStatus === 'active' ? (
                                  <span className="text-green-600 font-medium">연동됨</span>
                                ) : customer.genieUser.genieStatus === 'expired' ? (
                                  <span className="text-gray-600">만료됨</span>
                                ) : (
                                  <span className="text-gray-400">미연동</span>
                                )}
                              </div>
                              {customer.genieUser.linkedBy && (
                                <div className="text-xs text-blue-600 mt-1">
                                  {getLinkedByText(customer.genieUser.linkedBy)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        
                        {/* 남은 일수 */}
                        <td className="px-4 py-3 text-center">
                          {customer.genieUser?.daysRemaining !== null && customer.genieUser?.daysRemaining !== undefined ? (
                            <div className="space-y-1">
                              <div className={`text-lg font-bold ${
                                customer.genieUser.daysRemaining <= 7 
                                  ? 'text-red-600' 
                                  : customer.genieUser.daysRemaining <= 30 
                                  ? 'text-orange-600' 
                                  : 'text-green-600'
                              }`}>
                                {customer.genieUser.daysRemaining}일
                              </div>
                              <div className="text-xs text-gray-500">남음</div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        
                        {/* 활동 정보 */}
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{customer.reviewCount || 0}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{customer.postCount || 0}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{customer.commentCount || 0}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{customer.inquiryCount || 0}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">{customer.viewCount || 0}</td>
                        
                        {/* 상태 */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {statusBadges.map((badge, index) => (
                              <span
                                key={index}
                                className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  총 {pagination.total}명 중 {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-brand-red text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 크루즈몰 회원가입 추가 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">크루즈몰 회원 추가</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateFormData({
                    username: '',
                    password: '',
                    passwordConfirm: '',
                    nickname: '',
                    email: '',
                    emailDomain: '',
                  });
                  setValidation({
                    username: { checking: false, available: null, message: '' },
                    password: { match: null, message: '' },
                    nickname: { checking: false, available: null, message: '' },
                    email: { valid: null, message: '' },
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* 아이디 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이디 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                    placeholder="4자 이상 입력해주세요"
                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:ring-2 focus:outline-none ${
                      validation.username.available === false
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : validation.username.available === true
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {createFormData.username && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.username.checking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : validation.username.available === true ? (
                        <FiCheck className="text-green-600" size={18} />
                      ) : validation.username.available === false ? (
                        <FiX className="text-red-600" size={18} />
                      ) : null}
                    </div>
                  )}
                </div>
                {validation.username.message && (
                  <p className={`text-xs mt-1 ${
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  placeholder="6자 이상 입력해주세요"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={createFormData.passwordConfirm}
                    onChange={(e) => setCreateFormData({ ...createFormData, passwordConfirm: e.target.value })}
                    placeholder="비밀번호를 다시 입력해주세요"
                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:ring-2 focus:outline-none ${
                      createFormData.passwordConfirm && (
                        createFormData.password === createFormData.passwordConfirm
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      )
                    }`}
                  />
                  {createFormData.passwordConfirm && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {createFormData.password === createFormData.passwordConfirm ? (
                        <FiCheck className="text-green-600" size={18} />
                      ) : (
                        <FiX className="text-red-600" size={18} />
                      )}
                    </div>
                  )}
                </div>
                {validation.password.message && (
                  <p className={`text-xs mt-1 ${
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={createFormData.nickname}
                    onChange={(e) => setCreateFormData({ ...createFormData, nickname: e.target.value })}
                    placeholder="커뮤니티에 표시될 이름"
                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:ring-2 focus:outline-none ${
                      validation.nickname.available === false
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : validation.nickname.available === true
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {createFormData.nickname && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validation.nickname.checking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : validation.nickname.available === true ? (
                        <FiCheck className="text-green-600" size={18} />
                      ) : validation.nickname.available === false ? (
                        <FiX className="text-red-600" size={18} />
                      ) : null}
                    </div>
                  )}
                </div>
                {validation.nickname.message && (
                  <p className={`text-xs mt-1 ${
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="mb-2">
                  <input
                    type="text"
                    value={createFormData.email}
                    onChange={handleEmailInput}
                    placeholder="이메일 아이디"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="mb-2">
                  {createFormData.emailDomain ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-gray-500 font-medium">@</span>
                        <input
                          type="text"
                          value={createFormData.emailDomain}
                          readOnly
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 bg-gray-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreateFormData({ ...createFormData, emailDomain: '' })}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        변경
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">@</span>
                      <input
                        type="text"
                        value={createFormData.emailDomain}
                        onChange={(e) => setCreateFormData({ ...createFormData, emailDomain: e.target.value })}
                        placeholder="직접 입력 또는 아래 버튼 선택"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {emailDomains.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => handleEmailDomainSelect(domain)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
                {validation.email.message && (
                  <p className={`text-xs mt-1 ${
                    validation.email.valid === true ? 'text-green-600' : 
                    validation.email.valid === false ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {validation.email.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateMallCustomer}
                  disabled={isCreating || validation.username.available === false || validation.nickname.available === false || validation.password.match === false || !createFormData.username || !createFormData.password || !createFormData.nickname || !createFormData.email}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '추가 중...' : '추가'}
                </button>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateFormData({
                      username: '',
                      password: '',
                      passwordConfirm: '',
                      nickname: '',
                      email: '',
                      emailDomain: '',
                    });
                    setValidation({
                      username: { checking: false, available: null, message: '' },
                      password: { match: null, message: '' },
                      nickname: { checking: false, available: null, message: '' },
                      email: { valid: null, message: '' },
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
