'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductList from '@/components/mall/ProductList';
import ContractInviteModal from '@/components/admin/ContractInviteModal';
import { FiSend, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type PartnerDashboardProps = {
  user: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    mallUserId: string;
    mallNickname: string | null;
  };
  profile: any;
};

export default function PartnerDashboard({ user, profile }: PartnerDashboardProps) {
  const [showContractInviteModal, setShowContractInviteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 완전히 직렬화 가능한 객체로 변환
  const partnerContext = {
    mallUserId: String(user.mallUserId || ''),
    profileTitle: profile?.profileTitle 
      ? String(profile.profileTitle) 
      : user.mallNickname 
      ? String(user.mallNickname) 
      : profile?.displayName 
      ? String(profile.displayName) 
      : `파트너 ${user.mallUserId}`,
    landingAnnouncement: profile?.landingAnnouncement 
      ? String(profile.landingAnnouncement) 
      : null,
    welcomeMessage: profile?.welcomeMessage 
      ? String(profile.welcomeMessage) 
      : null,
    profileImage: profile?.profileImage 
      ? String(profile.profileImage) 
      : null,
    coverImage: profile?.coverImage 
      ? String(profile.coverImage) 
      : null,
  };

  const partnerBase = `/partner/${user.mallUserId}`;

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.trim().length === 0) {
      showError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      showError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/partner/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword || null,
          newPassword: newPassword.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || '비밀번호 변경에 실패했습니다.');
      }

      showSuccess('비밀번호가 변경되었습니다.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('[Partner Dashboard] Password change error:', error);
      showError(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-10 md:px-6">
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl shadow-xl">
          <div className="relative z-10 flex flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/80">Partner Dashboard</p>
              <h1 className="text-3xl font-black leading-snug md:text-4xl">
                나의 파트너 대시보드
              </h1>
              <p className="max-w-2xl text-sm text-white/80 md:text-base">
                파트너몰 링크, 고객 관리, 팀 관리 등 주요 작업을 한 곳에서 관리하세요. 모든 메뉴는 파트너 아이디에 맞춰 개인화되어 있습니다.
              </p>
              <div className="flex flex-wrap gap-3 text-xs md:text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white/90">
                  파트너 ID {user.mallUserId}
                </span>
                {profile.branchLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white/90">
                    {profile.branchLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/70">빠른 메뉴</p>
              <div className="mt-4 grid gap-3 text-sm text-white">
                {user.mallUserId && (
                  <Link href={`/products/${user.mallUserId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                    🛍️ 나의 판매몰 열기
                  </Link>
                )}
                {user.mallUserId && (
                  <Link href={`${partnerBase}/mall-edit`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                    개인몰 편집
                  </Link>
                )}
                <Link href={`${partnerBase}/profile`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  프로필 수정
                </Link>
                <Link href={`${partnerBase}/contract`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  나의 계약서
                </Link>
                {profile.type === 'BRANCH_MANAGER' ? (
                  <>
                    <Link href={`${partnerBase}/team`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                      팀 관리
                    </Link>
                    <button
                      onClick={() => setShowContractInviteModal(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors"
                    >
                      <FiSend /> 판매원 계약서 보내기
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/50 px-4 py-2 text-blue-200 shadow-inner cursor-not-allowed">
                    팀 관리 (대리점장 전용)
                  </span>
                )}
                <Link href={`${partnerBase}/customers`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  고객 관리 툴
                </Link>
                <Link href={`${partnerBase}/passport-requests`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  여권 요청 관리
                </Link>
                <Link href={`${partnerBase}/links`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  링크 관리
                </Link>
                <Link href={`${partnerBase}/payment`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  결제 및 정산
                </Link>
                <Link href={`${partnerBase}/statements`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  지급명세서
                </Link>
                <Link href={`${partnerBase}/adjustments`} className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors">
                  수당 조정 신청
                </Link>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-white transition-colors"
                >
                  <FiLock />
                  비밀번호 변경
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">나의 파트너 정보</h2>
            <dl className="space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-slate-500">파트너 아이디</dt>
                <dd className="font-mono">
                  {user.mallUserId}
                  <span className="ml-2 text-xs text-slate-400">(초기 비밀번호: qwe1)</span>
                </dd>
              </div>
              {profile.landingSlug ? (
                <div>
                  <dt className="font-semibold text-slate-500">랜딩 슬러그</dt>
                  <dd>{profile.landingSlug}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-semibold text-slate-500">담당자</dt>
                <dd>{profile.displayName ?? user.name ?? '정보 없음'}</dd>
              </div>
              {profile.branchLabel ? (
                <div>
                  <dt className="font-semibold text-slate-500">지점 / 팀</dt>
                  <dd>{profile.branchLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-semibold text-slate-500">연락처</dt>
                <dd>{profile.contactPhone ?? user.phone ?? '정보 없음'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">이메일</dt>
                <dd>{profile.contactEmail ?? user.email ?? '정보 없음'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">파트너 지원 안내</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-700">파트너몰</span>
                <p className="text-xs text-slate-500">상단 [파트너몰 열기] 버튼으로 고객에게 보여지는 화면을 직접 확인하세요.</p>
              </li>
              <li className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-700">고객 관리</span>
                <p className="text-xs text-slate-500">[고객 관리] 메뉴에서 상담 기록과 다음 액션을 추적할 수 있습니다.</p>
              </li>
              <li className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-700">팀 관리</span>
                <p className="text-xs text-slate-500">[팀 관리] 메뉴에서 판매원 실적과 수당 요약을 확인하고, 초대는 기존 어필리에이트 페이지에서 진행하세요.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">고객에게 보여지는 파트너몰</h2>
              <p className="text-sm text-slate-500">실시간으로 연동되는 상품 목록입니다. 파트너 ID가 자동 추적되어 구매 고객을 식별할 수 있습니다.</p>
            </div>
            <Link
              href={`/products/${user.mallUserId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              고객용 파트너몰 바로가기
            </Link>
          </div>
          <ProductList partnerContext={partnerContext} />
        </section>
      </div>

      {/* 계약서 보내기 모달 */}
      {profile.type === 'BRANCH_MANAGER' && (
        <ContractInviteModal
          isOpen={showContractInviteModal}
          onClose={() => setShowContractInviteModal(false)}
          currentProfileId={profile.id}
          onSuccess={() => {
            setShowContractInviteModal(false);
          }}
        />
      )}

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">비밀번호 변경</h2>
              <p className="text-sm text-gray-600 mt-1">
                새로운 비밀번호를 입력해주세요. 변경된 비밀번호는 관리자 패널에서 확인할 수 있습니다.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  현재 비밀번호 (선택)
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요 (선택사항)"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">현재 비밀번호를 모르는 경우 비워두셔도 됩니다.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  새 비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호를 입력하세요"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">최소 4자 이상 입력해주세요.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  새 비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={isChangingPassword}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

