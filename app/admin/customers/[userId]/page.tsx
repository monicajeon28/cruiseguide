'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiLock, FiUnlock, FiKey, FiLogOut, FiArrowLeft, FiRefreshCw, FiTrash2, FiBarChart2 } from 'react-icons/fi';

type AffiliateOwnershipSource = 'self-profile' | 'lead-agent' | 'lead-manager' | 'fallback';

type AffiliateOwnership = {
  ownerType: 'HQ' | 'BRANCH_MANAGER' | 'SALES_AGENT';
  ownerProfileId: number | null;
  ownerName: string | null;
  ownerNickname: string | null;
  ownerAffiliateCode: string | null;
  ownerBranchLabel: string | null;
  ownerStatus: string | null;
  source: AffiliateOwnershipSource;
  managerProfile: {
    id: number;
    displayName: string | null;
    nickname: string | null;
    affiliateCode: string | null;
    branchLabel: string | null;
    status: string | null;
  } | null;
  leadStatus?: string | null;
  leadCreatedAt?: string | null;
  normalizedPhone?: string | null;
};

type User = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isLocked: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  loginCount: number;
  tripCount: number;
  trips: any[];
  passwordEvents: {
    id: number;
    from: string;
    to: string;
    reason: string;
    createdAt: string;
  }[];
  affiliateOwnership?: AffiliateOwnership | null;
};

type Session = {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.userId as string);

  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState('3800');
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // 사용자 정보 로드
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setUser(data.user);
      } else {
        alert('사용자 정보를 불러올 수 없습니다: ' + (data.error || 'Unknown error'));
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/admin/customers');
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 목록 로드
  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/sessions`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // 사용자 분석 데이터 로드
  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/analytics`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async () => {
    if (!confirm(`정말로 사용자 "${user?.name || userId}"를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('[Delete User] ===== FRONTEND START =====');
      console.log('[Delete User] UserId:', userId);
      console.log('[Delete User] URL:', `/api/admin/users/${userId}/delete`);
      
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[Delete User] Response status:', response.status);
      console.log('[Delete User] Response ok:', response.ok);
      console.log('[Delete User] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('[Delete User] Response text (raw):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[Delete User] Parsed data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('[Delete User] JSON parse error:', parseError);
        alert(`❌ 서버 응답 파싱 실패\n\n상태: ${response.status}\n응답:\n${responseText.substring(0, 1000)}`);
        setIsProcessing(false);
        return;
      }
      
      if (data.ok) {
        console.log('[Delete User] SUCCESS');
        alert(`✅ 성공!\n\n${data.message || '사용자가 삭제되었습니다.'}`);
        router.push('/admin/customers');
      } else {
        console.error('[Delete User] FAILED:', data);
        const errorInfo = [
          `❌ 사용자 삭제 실패`,
          ``,
          `에러: ${data.error || data.errorMessage || 'Unknown error'}`,
          data.errorCode ? `에러 코드: ${data.errorCode}` : '',
          data.errorName ? `에러 이름: ${data.errorName}` : '',
          data.userId ? `사용자 ID: ${data.userId}` : '',
          data.timestamp ? `시간: ${data.timestamp}` : '',
          ``,
          `=== 서버 응답 전체 ===`,
          JSON.stringify(data, null, 2),
        ].filter(Boolean).join('\n');
        
        alert(errorInfo);
      }
    } catch (error) {
      console.error('[Delete User] ===== FRONTEND ERROR =====');
      console.error('[Delete User] Error:', error);
      const errorInfo = [
        `❌ 네트워크 오류 발생`,
        ``,
        `에러: ${error instanceof Error ? error.message : String(error)}`,
        `타입: ${error instanceof Error ? error.name : typeof error}`,
        ``,
        `스택:`,
        error instanceof Error ? error.stack : String(error),
      ].join('\n');
      
      alert(errorInfo);
    } finally {
      console.log('[Delete User] ===== FRONTEND END =====');
      setIsProcessing(false);
    }
  };

  const ownershipSourceLabels: Record<AffiliateOwnershipSource, string> = {
    'self-profile': '자체 소속',
    'lead-agent': '리드 배정 (판매원)',
    'lead-manager': '리드 배정 (대리점장)',
    fallback: '본사 기본 배정',
  };

  const renderAffiliateOwnershipSection = (ownership?: AffiliateOwnership | null) => {
    const data: AffiliateOwnership = ownership ?? {
      ownerType: 'HQ',
      ownerProfileId: null,
      ownerName: '본사 직속',
      ownerNickname: null,
      ownerAffiliateCode: null,
      ownerBranchLabel: null,
      ownerStatus: null,
      source: 'fallback',
      managerProfile: null,
      leadStatus: null,
      leadCreatedAt: null,
      normalizedPhone: null,
    };

    let badgeClass = 'bg-red-50 text-red-600 border border-red-200';
    let label = '본사 직속';
    if (data.ownerType === 'BRANCH_MANAGER') {
      badgeClass = 'bg-purple-50 text-purple-600 border border-purple-200';
      label = '대리점장';
    } else if (data.ownerType === 'SALES_AGENT') {
      badgeClass = 'bg-blue-50 text-blue-600 border border-blue-200';
      label = '판매원';
    }

    return (
      <div className="mt-1 flex flex-col gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${badgeClass}`}>
          {label}
          {data.ownerName && (
            <span className="font-normal">
              {data.ownerName}
              {data.ownerAffiliateCode ? ` (${data.ownerAffiliateCode})` : ''}
            </span>
          )}
        </span>
        {data.ownerBranchLabel && (
          <span className="text-sm text-gray-600">
            소속 지점: {data.ownerBranchLabel}
          </span>
        )}
        {data.ownerType === 'SALES_AGENT' && data.managerProfile && (
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-600">
            담당 대리점장
            <span className="font-normal">
              {data.managerProfile.nickname || data.managerProfile.displayName || '미지정'}
              {data.managerProfile.affiliateCode ? ` (${data.managerProfile.affiliateCode})` : ''}
            </span>
          </span>
        )}
        <span className="text-xs text-gray-400">
          {ownershipSourceLabels[data.source]}
          {data.leadStatus ? ` · 최근 리드 상태: ${data.leadStatus}` : ''}
        </span>
      </div>
    );
  };

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadSessions();
    }
  }, [userId]);

  // 비밀번호 초기화
  const handleResetPassword = async () => {
    if (!confirm(`비밀번호를 "${newPassword}"로 초기화하시겠습니까?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();
      if (data.ok) {
        alert(data.message || '비밀번호가 초기화되었습니다.');
        loadUserData(); // 비밀번호 이벤트 목록 새로고침
      } else {
        alert('비밀번호 초기화 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('비밀번호 초기화 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 계정 잠금
  const handleLockAccount = async () => {
    const reason = prompt('잠금 사유를 입력하세요:');
    if (reason === null) return; // 취소

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason || '관리자에 의해 잠금' }),
      });

      const data = await response.json();
      if (data.ok) {
        alert('계정이 잠금되었습니다.');
        loadUserData();
      } else {
        alert('계정 잠금 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to lock account:', error);
      alert('계정 잠금 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 계정 잠금 해제
  const handleUnlockAccount = async () => {
    if (!confirm('계정 잠금을 해제하시겠습니까?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        alert('계정 잠금이 해제되었습니다.');
        loadUserData();
      } else {
        alert('계정 잠금 해제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to unlock account:', error);
      alert('계정 잠금 해제 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 온보딩 추가하기 (최근 여행에)
  const handleAddOnboarding = async () => {
    if (!user.trips || user.trips.length === 0) {
      alert('여행이 없어서 온보딩을 추가할 수 없습니다. 먼저 여행을 등록해주세요.');
      return;
    }

    const latestTrip = user.trips[0];
    await handleAddOnboardingToTrip(latestTrip.id);
  };

  // 특정 여행에 온보딩 추가하기
  const handleAddOnboardingToTrip = async (tripId: number) => {
    if (!confirm('이 여행에 온보딩을 추가하시겠습니까? (크루즈 가이드 지니 활성화)')) {
      return;
    }

    setIsProcessing(true);
    try {
      // 기존 여행 정보 가져오기
      const trip = user.trips?.find((t: any) => t.id === tripId);
      if (!trip) {
        alert('여행 정보를 찾을 수 없습니다.');
        setIsProcessing(false);
        return;
      }

      // API 요청 본문 구성 (기존 여행 정보 사용)
      const requestBody: any = {
        cruiseName: trip.cruiseName || '',
        startDate: trip.startDate || new Date().toISOString(),
        endDate: trip.endDate || new Date().toISOString(),
        companionType: trip.companionType || null,
        destination: Array.isArray(trip.destination) ? trip.destination : trip.destination ? [trip.destination] : [],
      };

      // productId가 있으면 추가 (없으면 null)
      if (trip.productId) {
        requestBody.productId = trip.productId;
      }

      const response = await fetch(`/api/admin/users/${userId}/trips/${tripId}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.ok) {
        alert('온보딩이 추가되었습니다.');
        loadUserData(); // 사용자 정보 새로고침
      } else {
        alert('온보딩 추가 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add onboarding:', error);
      alert('온보딩 추가 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 세션 강제 종료
  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('이 세션을 강제 종료하시겠습니까?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        alert('세션이 강제 종료되었습니다.');
        loadSessions();
      } else {
        alert('세션 종료 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
      alert('세션 종료 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/customers')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">고객 상세 정보</h1>
              <p className="text-gray-600 mt-1">ID: {user.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                if (!showAnalytics && !analytics) {
                  loadAnalytics();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <FiBarChart2 size={18} />
              {showAnalytics ? '분석 숨기기' : '사용자 분석'}
            </button>
            <button
              onClick={() => {
                loadUserData();
                loadSessions();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2"
            >
              <FiRefreshCw size={18} />
              새로고침
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FiTrash2 size={18} />
              삭제
            </button>
          </div>
        </div>

        {/* 사용자 분석 섹션 */}
        {showAnalytics && analytics && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 사용자 상세 분석</h2>
            <div className="space-y-4">
              {/* AI 채팅 사용 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">💬 AI 채팅 사용</h3>
                <p>총 대화 횟수: {analytics.AI_채팅_사용?.총_대화_횟수 || 0}회</p>
                <p>총 메시지 수: {analytics.AI_채팅_사용?.총_메시지_수 || 0}개</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">• 지니야 가자: {analytics.AI_채팅_사용?.지니야_가자_검색?.총_횟수 || 0}회</p>
                  <p className="text-sm">• 지니야 보여줘: {analytics.AI_채팅_사용?.지니야_보여줘_검색?.총_횟수 || 0}회</p>
                  <p className="text-sm">• 일반 검색: {analytics.AI_채팅_사용?.일반_검색?.총_횟수 || 0}회</p>
                </div>
              </div>

              {/* 가계부 사용 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">💰 가계부 사용</h3>
                <p>총 지출 항목: {analytics.가계부_사용?.총_지출_항목 || 0}개</p>
                <p>총 지출 금액: {analytics.가계부_사용?.총_지출_금액_원화?.toLocaleString() || 0}원</p>
                <p>추정 예산: {analytics.가계부_사용?.추정_예산_원화?.toLocaleString() || 0}원</p>
              </div>

              {/* 체크리스트 사용 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">✅ 체크리스트 사용</h3>
                <p>총 항목 수: {analytics.체크리스트_사용?.총_항목_수 || 0}개</p>
                <p>완료 항목 수: {analytics.체크리스트_사용?.완료_항목_수 || 0}개</p>
                <p>완료율: {analytics.체크리스트_사용?.완료율_퍼센트 || 0}%</p>
                <p>사용자 추가 항목: {analytics.체크리스트_사용?.사용자_추가_항목_수 || 0}개</p>
              </div>

              {/* 번역기 사용 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">🌐 번역기 사용</h3>
                <p>총 사용 횟수: {analytics.번역기_사용?.총_사용_횟수 || 0}회</p>
                {analytics.번역기_사용?.언어별_사용 && analytics.번역기_사용.언어별_사용.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">언어별 사용:</p>
                    {analytics.번역기_사용.언어별_사용.map((lang: any, idx: number) => (
                      <p key={idx} className="text-sm">• {lang.언어_쌍}: {lang.사용_횟수}회</p>
                    ))}
                  </div>
                )}
              </div>

              {/* 여행 지도 사용 */}
              {analytics.여행_지도_사용 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">🗺️ 여행 지도 사용</h3>
                  <p>저장된 여행 수: {analytics.여행_지도_사용.저장된_여행_수 || 0}개</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 카드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">기본 정보</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">이름</label>
                  <p className="text-lg text-gray-900">{user.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">전화번호</label>
                  <p className="text-lg text-gray-900">{user.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">소속</label>
                  {renderAffiliateOwnershipSection(user.affiliateOwnership)}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">이메일</label>
                  <p className="text-lg text-gray-900">{user.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">가입일</label>
                  <p className="text-lg text-gray-900">
                    {new Date(user.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">마지막 활동</label>
                  <p className="text-lg text-gray-900">
                    {user.lastActiveAt
                      ? new Date(user.lastActiveAt).toLocaleString('ko-KR')
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">로그인 횟수</label>
                  <p className="text-lg text-gray-900">{user.loginCount}회</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">여행 횟수</label>
                  <p className="text-lg text-gray-900">{user.tripCount}회</p>
                </div>
              </div>
            </div>

            {/* 비밀번호 이력 카드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">비밀번호 변경 이력</h2>
              {user.passwordEvents && user.passwordEvents.length > 0 ? (
                <div className="space-y-2">
                  {user.passwordEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {event.from} → {event.to}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">비밀번호 변경 이력이 없습니다.</p>
              )}
            </div>

            {/* 여행 목록 카드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">여행 목록</h2>
                {user.trips && user.trips.length > 0 && (
                  <button
                    onClick={handleAddOnboarding}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>+</span>
                    온보딩 추가하기
                  </button>
                )}
              </div>
              {user.trips && user.trips.length > 0 ? (
                <div className="space-y-3">
                  {user.trips.map((trip: any) => (
                    <div
                      key={trip.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              {trip.cruiseName || '크루즈명 없음'}
                            </span>
                            {trip.id === user.trips[0]?.id && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                최근 여행
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">목적지:</span>{' '}
                              {Array.isArray(trip.destination)
                                ? trip.destination.join(', ')
                                : trip.destination || '-'}
                            </p>
                            {trip.startDate && trip.endDate && (
                              <p>
                                <span className="font-medium">기간:</span>{' '}
                                {new Date(trip.startDate).toLocaleDateString('ko-KR')} ~{' '}
                                {new Date(trip.endDate).toLocaleDateString('ko-KR')}
                              </p>
                            )}
                            {trip.companionType && (
                              <p>
                                <span className="font-medium">동반자:</span> {trip.companionType}
                              </p>
                            )}
                          </div>
                        </div>
                        {trip.id === user.trips[0]?.id && (
                          <button
                            onClick={() => handleAddOnboardingToTrip(trip.id)}
                            disabled={isProcessing}
                            className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            <span>+</span>
                            온보딩 추가
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">등록된 여행이 없습니다.</p>
                  <button
                    onClick={handleAddOnboarding}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    온보딩 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 보안 관리 */}
          <div className="space-y-6">
            {/* 보안 관리 카드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">보안 관리</h2>

              {/* 계정 상태 */}
              <div className="mb-6 p-4 rounded-lg border-2">
                {user.isLocked ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiLock className="text-red-600" size={20} />
                      <span className="font-bold text-red-600">계정 잠금됨</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      잠금 시각: {user.lockedAt ? new Date(user.lockedAt).toLocaleString('ko-KR') : '-'}
                    </p>
                    {user.lockedReason && (
                      <p className="text-sm text-gray-600 mt-1">사유: {user.lockedReason}</p>
                    )}
                    <button
                      onClick={handleUnlockAccount}
                      disabled={isProcessing}
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FiUnlock size={18} />
                      잠금 해제
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiUnlock className="text-green-600" size={20} />
                      <span className="font-bold text-green-600">계정 정상</span>
                    </div>
                    <button
                      onClick={handleLockAccount}
                      disabled={isProcessing}
                      className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FiLock size={18} />
                      계정 잠금
                    </button>
                  </div>
                )}
              </div>

              {/* 비밀번호 초기화 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호 초기화
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="3800"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleResetPassword}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FiKey size={18} />
                    초기화
                  </button>
                </div>
              </div>
            </div>

            {/* 세션 관리 카드 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">활성 세션</h2>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-600">
                          {session.id.substring(0, 12)}...
                        </span>
                        <button
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={isProcessing}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold hover:bg-red-200 flex items-center gap-1 disabled:opacity-50"
                        >
                          <FiLogOut size={14} />
                          종료
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        생성: {new Date(session.createdAt).toLocaleString('ko-KR')}
                      </p>
                      {session.expiresAt && (
                        <p className="text-xs text-gray-500">
                          만료: {new Date(session.expiresAt).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">활성 세션이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






