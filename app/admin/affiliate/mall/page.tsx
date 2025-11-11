// app/admin/affiliate/mall/page.tsx
// 관리자 판매몰 관리 페이지

'use client';

import { useEffect, useState } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiRefreshCw,
  FiSearch,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiFileText,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type AffiliateProfile = {
  id: number;
  affiliateCode: string;
  type: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ';
  status: string;
  displayName?: string | null;
  nickname?: string | null;
  branchLabel?: string | null;
  landingSlug?: string | null;
  published: boolean;
  user: {
    id: number;
    mallUserId: string | null;
    mallNickname: string | null;
  } | null;
};

type MallFormState = {
  userId: string;
  name: string;
  phone: string;
  email: string;
  type: 'BRANCH_MANAGER' | 'SALES_AGENT';
  branchLabel: string;
  managerProfileId: string;
};

const EMPTY_FORM: MallFormState = {
  userId: '',
  name: '',
  phone: '',
  email: '',
  type: 'BRANCH_MANAGER',
  branchLabel: '',
  managerProfileId: '',
};

export default function AffiliateMallManagementPage() {
  const [profiles, setProfiles] = useState<AffiliateProfile[]>([]);
  const [filters, setFilters] = useState({ search: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AffiliateProfile | null>(null);
  const [formState, setFormState] = useState<MallFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editFormState, setEditFormState] = useState({
    mallUserId: '',
    landingSlug: '',
    published: true,
  });

  useEffect(() => {
    loadProfiles();
  }, [filters]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set('search', filters.search.trim());
      params.set('status', 'ACTIVE');

      const res = await fetch(`/api/admin/affiliate/profiles?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '프로필을 불러오지 못했습니다.');
      }
      setProfiles(json.profiles ?? []);
    } catch (error: any) {
      console.error('[AffiliateMall] load error', error);
      showError(error.message || '프로필 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      if (!formState.userId || !formState.name || !formState.phone) {
        showError('사용자 ID, 이름, 연락처는 필수입니다.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/affiliate/mall/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(formState.userId),
          name: formState.name,
          phone: formState.phone,
          email: formState.email || null,
          type: formState.type,
          branchLabel: formState.branchLabel || null,
          managerProfileId: formState.managerProfileId ? Number(formState.managerProfileId) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '판매몰 생성에 실패했습니다.');
      }

      showSuccess(`판매몰이 생성되었습니다. 링크: ${json.mallUrl}`);
      setFormState(EMPTY_FORM);
      setIsCreateModalOpen(false);
      loadProfiles();
    } catch (error: any) {
      console.error('[AffiliateMall] create error', error);
      showError(error.message || '판매몰 생성 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProfile) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/affiliate/mall/${selectedProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mallUserId: editFormState.mallUserId || null,
          landingSlug: editFormState.landingSlug || null,
          published: editFormState.published,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '판매몰 수정에 실패했습니다.');
      }

      showSuccess('판매몰 정보가 업데이트되었습니다.');
      setIsEditModalOpen(false);
      setSelectedProfile(null);
      loadProfiles();
    } catch (error: any) {
      console.error('[AffiliateMall] edit error', error);
      showError(error.message || '판매몰 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (profile: AffiliateProfile) => {
    setSelectedProfile(profile);
    setEditFormState({
      mallUserId: profile.user?.mallUserId || '',
      landingSlug: profile.landingSlug || '',
      published: profile.published,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">판매원 개인몰 관리</h1>
            <p className="text-sm text-gray-600 mt-1">
              판매원/대리점장의 개인몰 생성 상태 확인, 개인 대시보드 접근, 모든 설정 수정 및 관할이 가능합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadProfiles}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <FiRefreshCw className="text-base" />
              새로고침
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
            >
              <FiPlus className="text-base" />
              새 판매몰 생성
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3 text-gray-400 text-lg" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="이름, 연락처, 판매몰 ID 검색"
              className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">판매원/대리점장</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">개인몰 링크</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">상태</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">노출</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    판매몰 목록을 불러오는 중입니다...
                  </td>
                </tr>
              )}
              {!isLoading && profiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    조건에 해당하는 판매몰이 없습니다.
                  </td>
                </tr>
              )}
              {!isLoading &&
                profiles.map((profile) => {
                  const mallUrl = profile.user?.mallUserId ? `/products/${profile.user.mallUserId}` : null;
                  return (
                    <tr key={profile.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {profile.nickname || profile.displayName || '이름 없음'}
                        </div>
                        <div className="text-xs text-gray-500">{profile.affiliateCode}</div>
                        {profile.branchLabel && (
                          <div className="text-xs text-gray-500">{profile.branchLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {profile.user?.mallUserId ? (
                          <div className="space-y-1">
                            <div>
                              <span className="text-xs text-gray-500">대시보드:</span>{' '}
                              <a
                                href={`/${profile.user.mallUserId}/dashboard`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                /{profile.user.mallUserId}/dashboard
                                <FiExternalLink className="text-xs" />
                              </a>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">판매몰:</span>{' '}
                              <a
                                href={`/${profile.user.mallUserId}/shop`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                /{profile.user.mallUserId}/shop
                                <FiExternalLink className="text-xs" />
                              </a>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">결제:</span>{' '}
                              <a
                                href={`/${profile.user.mallUserId}/payment`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                /{profile.user.mallUserId}/payment
                                <FiExternalLink className="text-xs" />
                              </a>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">고객관리:</span>{' '}
                              <a
                                href={`/${profile.user.mallUserId}/customers`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                /{profile.user.mallUserId}/customers
                                <FiExternalLink className="text-xs" />
                              </a>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">프로필:</span>{' '}
                              <a
                                href={`/${profile.user.mallUserId}/profile`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                /{profile.user.mallUserId}/profile
                                <FiExternalLink className="text-xs" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">미생성</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            profile.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {profile.status === 'ACTIVE' ? '활성' : profile.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {profile.published ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            <FiCheckCircle /> 노출 중
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            <FiXCircle /> 중지
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {profile.user?.mallUserId && (
                            <>
                              <a
                                href={`/${profile.user.mallUserId}/dashboard`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                title="개인 대시보드 열기"
                              >
                                대시보드
                              </a>
                              <a
                                href={`/${profile.user.mallUserId}/shop`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                                title="판매몰 열기"
                              >
                                판매몰
                              </a>
                              <a
                                href={`/${profile.user.mallUserId}/customers`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                                title="고객관리 열기"
                              >
                                고객관리
                              </a>
                            </>
                          )}
                          {profile.user?.mallUserId && (
                            <a
                              href={`/admin/affiliate/mall/invite/${profile.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                              title="계약초대 링크 생성"
                            >
                              <FiFileText />
                              계약초대
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(profile)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            title="판매몰 설정 편집"
                          >
                            <FiEdit2 />
                            편집
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-extrabold text-gray-900">새 판매몰 생성</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormState(EMPTY_FORM);
                }}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">사용자 ID *</span>
                  <input
                    type="number"
                    value={formState.userId}
                    onChange={(e) => setFormState((prev) => ({ ...prev, userId: e.target.value }))}
                    placeholder="예: 1024"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">이름 *</span>
                  <input
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 홍길동"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">연락처 *</span>
                  <input
                    value={formState.phone}
                    onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">이메일</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="example@cruisedot.com"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">유형</span>
                  <select
                    value={formState.type}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, type: e.target.value as 'BRANCH_MANAGER' | 'SALES_AGENT' }))
                    }
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="BRANCH_MANAGER">대리점장</option>
                    <option value="SALES_AGENT">판매원</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">지점명</span>
                  <input
                    value={formState.branchLabel}
                    onChange={(e) => setFormState((prev) => ({ ...prev, branchLabel: e.target.value }))}
                    placeholder="예: 부산 서면 대리점"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                판매몰 생성 시 자동으로:
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>고유 판매몰 ID 생성 (예: user123)</li>
                  <li>어필리에이트 코드 생성</li>
                  <li>판매몰 링크: /products/user123</li>
                  <li>랜딩 슬러그 자동 설정</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormState(EMPTY_FORM);
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? '생성 중...' : '판매몰 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {isEditModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-extrabold text-gray-900">
                판매몰 편집: {selectedProfile.nickname || selectedProfile.displayName}
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProfile(null);
                }}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid gap-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <div className="font-semibold mb-2">현재 판매몰 정보</div>
                  {selectedProfile.user?.mallUserId ? (
                    <div className="space-y-2">
                      <div className="font-semibold">판매몰 ID: <span className="font-mono font-bold">{selectedProfile.user.mallUserId}</span></div>
                      <div className="grid gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">대시보드:</span>{' '}
                          <a href={`/${selectedProfile.user.mallUserId}/dashboard`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">/{selectedProfile.user.mallUserId}/dashboard</a>
                        </div>
                        <div>
                          <span className="text-gray-600">판매몰:</span>{' '}
                          <a href={`/${selectedProfile.user.mallUserId}/shop`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">/{selectedProfile.user.mallUserId}/shop</a>
                        </div>
                        <div>
                          <span className="text-gray-600">결제페이지:</span>{' '}
                          <a href={`/${selectedProfile.user.mallUserId}/payment`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">/{selectedProfile.user.mallUserId}/payment</a>
                        </div>
                        <div>
                          <span className="text-gray-600">고객관리:</span>{' '}
                          <a href={`/${selectedProfile.user.mallUserId}/customers`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">/{selectedProfile.user.mallUserId}/customers</a>
                        </div>
                        <div>
                          <span className="text-gray-600">프로필:</span>{' '}
                          <a href={`/${selectedProfile.user.mallUserId}/profile`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">/{selectedProfile.user.mallUserId}/profile</a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600">판매몰이 생성되지 않았습니다. 판매몰 생성 API를 통해 생성해주세요.</div>
                  )}
                </div>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">판매몰 ID 변경</span>
                  <input
                    value={editFormState.mallUserId}
                    onChange={(e) => setEditFormState((prev) => ({ ...prev, mallUserId: e.target.value }))}
                    placeholder="예: user123"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-xs text-gray-500">
                    {editFormState.mallUserId
                      ? `변경 후 판매몰 링크: /products/${editFormState.mallUserId}`
                      : '판매몰 ID를 변경하면 링크가 자동으로 업데이트됩니다.'}
                  </span>
                </label>
                <label className="flex flex-col gap-1 text-sm text-gray-700">
                  <span className="font-semibold">랜딩 슬러그</span>
                  <input
                    value={editFormState.landingSlug}
                    onChange={(e) => setEditFormState((prev) => ({ ...prev, landingSlug: e.target.value }))}
                    placeholder="예: monica-cruise"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={editFormState.published}
                    onChange={(e) => setEditFormState((prev) => ({ ...prev, published: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm font-semibold text-blue-900">판매몰 노출 활성화</label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedProfile(null);
                }}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

