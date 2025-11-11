// app/admin/affiliate/mall/invite/[profileId]/page.tsx
// 판매원 계약초대 페이지

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiFileText, FiCopy, FiCheckCircle } from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type AffiliateProfile = {
  id: number;
  affiliateCode: string;
  type: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ';
  displayName?: string | null;
  nickname?: string | null;
  user: {
    id: number;
    mallUserId: string | null;
  } | null;
};

export default function SalesAgentInvitePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.profileId as string;
  
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contractLink, setContractLink] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/affiliate/profiles/${profileId}`);
      const json = await res.json();
      
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '프로필을 불러오지 못했습니다.');
      }
      
      setProfile(json.profile);
      
      // 계약서 링크 생성
      if (json.profile?.user?.mallUserId) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const link = `${baseUrl}/partner/${json.profile.user.mallUserId}/contract`;
        setContractLink(link);
      }
    } catch (error: any) {
      console.error('[SalesAgentInvite] load error', error);
      showError(error.message || '프로필을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(contractLink);
      showSuccess('계약서 링크가 클립보드에 복사되었습니다.');
    } catch (error) {
      showError('링크 복사에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
        <div className="mx-auto w-full max-w-4xl px-4 pt-12">
          <div className="rounded-3xl bg-white p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">프로필을 찾을 수 없습니다</h2>
            <button
              onClick={() => router.push('/admin/affiliate/mall')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <FiArrowLeft /> 판매원 개인몰 관리로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="mx-auto w-full max-w-4xl px-4 pt-12">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
          <button
            onClick={() => router.push('/admin/affiliate/mall')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
          >
            <FiArrowLeft /> 판매원 개인몰 관리로 돌아가기
          </button>
          <div className="flex items-center gap-3 mb-4">
            <FiFileText className="text-3xl" />
            <h1 className="text-3xl font-extrabold">판매원 계약초대</h1>
          </div>
          <p className="text-white/90">
            {profile.nickname || profile.displayName || '판매원'}님에게 계약서 링크를 전달하세요.
          </p>
        </header>

        <div className="space-y-6">
          {/* 판매원 정보 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">판매원 정보</h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="font-semibold text-slate-500">이름</p>
                <p className="text-slate-900">{profile.nickname || profile.displayName || '-'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">어필리에이트 코드</p>
                <p className="text-slate-900 font-mono">{profile.affiliateCode}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">유형</p>
                <p className="text-slate-900">
                  {profile.type === 'BRANCH_MANAGER' ? '대리점장' : profile.type === 'SALES_AGENT' ? '판매원' : '본사'}
                </p>
              </div>
              {profile.user?.mallUserId && (
                <div>
                  <p className="font-semibold text-slate-500">판매몰 ID</p>
                  <p className="text-slate-900 font-mono">{profile.user.mallUserId}</p>
                </div>
              )}
            </div>
          </section>

          {/* 계약서 링크 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              계약서 링크
            </h2>
            {contractLink ? (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-2">계약서 링크</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={contractLink}
                      readOnly
                      className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-mono text-slate-900"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <FiCopy /> 복사
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-2">
                    <FiCheckCircle className="text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">계약서 링크 사용 방법</p>
                      <p className="text-xs">
                        위 링크를 판매원에게 전달하세요. 판매원이 링크를 클릭하면 어필리에이트 계약서 작성 페이지로 이동합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
                <p className="mb-2">판매몰이 생성되지 않았습니다.</p>
                <p className="text-xs">먼저 판매몰을 생성한 후 계약서 링크를 생성할 수 있습니다.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

