'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiSend,
  FiFileText,
  FiLoader,
  FiCheckCircle,
  FiArrowLeft,
  FiX,
} from 'react-icons/fi';

type InviteForm = {
  name: string;
  phone: string;
  message: string;
};

type ContractInvite = {
  id: number;
  name: string;
  phone: string;
  status: string;
  submittedAt: string;
};

type AffiliateType = 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ' | string;

export default function AffiliateTeamInvitePage() {
  const router = useRouter();
  const [form, setForm] = useState<InviteForm>({ name: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [invites, setInvites] = useState<ContractInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileType, setProfileType] = useState<AffiliateType | null>(null);
  const [mallUserId, setMallUserId] = useState<string | null>(null);

  useEffect(() => {
    setError('');
  }, [form.name, form.phone]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch('/api/affiliate/me/profile', { credentials: 'include' });
        if (res.status === 401) {
          router.replace('/login?next=/affiliate/team');
          return;
        }
        const json = await res.json();
        if (!res.ok || !json?.ok || !json.profile) {
          throw new Error(json?.message || '프로필 정보를 불러올 수 없습니다.');
        }
        const type: AffiliateType = json.profile.type;
        // mallUserId 가져오기
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meJson = await meRes.json();
        if (meJson?.ok && meJson?.user?.mallUserId) {
          setMallUserId(meJson.user.mallUserId);
        }
        if (type !== 'BRANCH_MANAGER') {
          setProfileError('판매원 초대 기능은 대리점장 계정에서만 사용할 수 있습니다.');
          setProfileType(type);
          return;
        }
        setProfileType(type);
      } catch (err: any) {
        console.error('[AffiliateTeamInvite] profile error', err);
        setProfileError(err.message || '프로필 정보를 확인할 수 없습니다.');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  useEffect(() => {
    if (profileLoading || profileType !== 'BRANCH_MANAGER') {
      return;
    }

    const loadInvites = async () => {
      try {
        setLoadingInvites(true);
        const res = await fetch('/api/affiliate/contracts/my-invites');
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || '초대한 판매원 목록을 불러오지 못했습니다.');
        }
        setInvites(json.contracts ?? []);
      } catch (err: any) {
        console.error('[AffiliateTeamInvite] list error', err);
        setError(err.message || '초대한 판매원 목록을 불러오지 못했습니다.');
      } finally {
        setLoadingInvites(false);
      }
    };

    loadInvites();
  }, [profileLoading, profileType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || profileType !== 'BRANCH_MANAGER') return;

    if (!form.name.trim() || !form.phone.trim()) {
      setError('이름과 연락처를 입력해주세요.');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/affiliate/contracts/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '초대 메시지를 생성하지 못했습니다.');
      }
      setForm((prev) => ({ ...prev, message: json.message }));
      try {
        await navigator.clipboard.writeText(json.message);
        alert('초대 메시지를 복사했습니다. 카카오톡/문자로 전송해주세요.');
      } catch (clipboardError) {
        alert('초대 메시지를 생성했습니다. 아래 내용을 복사해 전송해주세요.');
      }
    } catch (err: any) {
      console.error('[AffiliateTeamInvite] error', err);
      setError(err.message || '초대 메시지 생성에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm text-slate-600">대리점 정보를 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (profileError || profileType !== 'BRANCH_MANAGER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg text-center space-y-4">
          <h1 className="text-lg font-semibold text-red-600">접근 권한이 없습니다</h1>
          <p className="text-sm text-slate-600">{profileError || '판매원 초대 기능은 대리점장 전용입니다.'}</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/affiliate/products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              파트너 상품 페이지로 이동
            </Link>
            <Link
              href={mallUserId ? `/${mallUserId}/profile` : '/partner'}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              내 프로필 보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 space-y-8">
        <header className="rounded-3xl bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">판매원 계약 초대</h1>
              <p className="mt-2 text-sm text-slate-600">
                대리점장이 추천한 판매원에게 계약서 작성 링크를 보내고, 구글 드라이브에 신분증/통장 사본 업로드를 안내하세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/admin/affiliate/mall')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <FiArrowLeft className="text-base" /> 이전으로
              </button>
            </div>
          </div>
          <Link
            href="/affiliate/contract"
            target="_blank"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <FiFileText className="text-base" /> 계약서 접수 페이지 미리보기
          </Link>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">초대 메시지 생성</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[2fr,2fr,auto]">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="판매원 이름"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="연락처 (예: 010-0000-0000)"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
            >
              <FiSend className="text-base" />
              {sending ? '생성 중...' : '초대 메시지 복사'}
            </button>
          </form>
          {error && !sending && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {form.message && (
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 whitespace-pre-line">
              {form.message}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-sm text-sm text-slate-600 space-y-3">
          <h3 className="font-semibold text-slate-800">업로드 안내</h3>
          <p>판매원에게 다음 드라이브 링크로 파일을 업로드하도록 안내하세요.</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              신분증 사본:{' '}
              <a href="https://drive.google.com/drive/folders/1agheBgSez9g5_mtw2glqWa2rDpWJBUNRInAnWGOPtBgeto3N40BHZLD-TVwWPMNBtATGF_l2?usp=sharing" target="_blank" className="text-blue-600 hover:text-blue-800" rel="noopener noreferrer">신분증 전용 폴더</a>
            </li>
            <li>
              통장 사본:{' '}
              <a href="https://drive.google.com/drive/folders/1Wb7fx8K45ibdbK_HB165YCzunb4hNVj5X3tdEyt9XPmTBhc1w43Ylf_NJkxR_djybYT10gvW?usp=sharing" target="_blank" className="text-blue-600 hover:text-blue-800" rel="noopener noreferrer">통장 사본 전용 폴더</a>
            </li>
          </ul>
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">초대한 판매원 진행 상황</h2>
          {error && loadingInvites === false && invites.length === 0 ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : loadingInvites ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <FiLoader className="animate-spin" /> 불러오는 중...
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-slate-500">아직 초대한 판매원이 없습니다. 초대 메시지를 보내 계약서를 작성하도록 안내해주세요.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">판매원</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">연락처</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">상태</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">접수일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invites.map((contract) => (
                    <tr key={contract.id} className="text-slate-600">
                      <td className="px-4 py-3 font-semibold text-slate-700">{contract.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{contract.phone}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <FiCheckCircle className="text-green-500" /> {contract.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {contract.submittedAt ? new Date(contract.submittedAt).toLocaleDateString('ko-KR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


