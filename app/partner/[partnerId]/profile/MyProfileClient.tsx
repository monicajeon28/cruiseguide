'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiUser, FiMail, FiPhone, FiEdit2 } from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type MyProfileClientProps = {
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

export default function MyProfileClient({ user, profile }: MyProfileClientProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || user.name || '',
    contactPhone: profile?.contactPhone || user.phone || '',
    contactEmail: profile?.contactEmail || user.email || '',
    profileTitle: profile?.profileTitle || '',
    landingAnnouncement: profile?.landingAnnouncement || '',
    welcomeMessage: profile?.welcomeMessage || '',
  });

  const partnerId = user.mallUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || '프로필 업데이트에 실패했습니다.');
      }

      showSuccess('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error: any) {
      console.error('[MyProfileClient] Update error:', error);
      showError(error.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pt-10 md:px-6">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <Link
            href={`/partner/${partnerId}/dashboard`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
          >
            <FiArrowLeft /> 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-black leading-snug md:text-4xl">
            프로필 수정
          </h1>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            파트너 프로필 정보를 수정할 수 있습니다.
          </p>
        </header>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 shadow-lg">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <FiUser className="text-blue-600" />
                기본 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    파트너 ID
                  </label>
                  <input
                    type="text"
                    value={user.mallUserId}
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600"
                  />
                  <p className="mt-1 text-xs text-gray-500">파트너 ID는 변경할 수 없습니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    표시 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="고객에게 표시될 이름"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <FiPhone className="inline mr-1" />
                    연락처
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    <FiMail className="inline mr-1" />
                    이메일
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="example@email.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </section>

            {/* 파트너몰 설정 */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <FiEdit2 className="text-purple-600" />
                파트너몰 설정
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    프로필 제목
                  </label>
                  <input
                    type="text"
                    value={formData.profileTitle}
                    onChange={(e) => setFormData({ ...formData, profileTitle: e.target.value })}
                    placeholder="파트너몰에 표시될 제목"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    랜딩 안내 문구
                  </label>
                  <textarea
                    value={formData.landingAnnouncement}
                    onChange={(e) => setFormData({ ...formData, landingAnnouncement: e.target.value })}
                    placeholder="파트너몰 상단에 표시될 안내 문구"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    환영 메시지
                  </label>
                  <textarea
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                    placeholder="고객에게 보여질 환영 메시지"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex items-center justify-end gap-4">
            <Link
              href={`/partner/${partnerId}/dashboard`}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  저장 중...
                </>
              ) : (
                <>
                  <FiSave />
                  저장하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

