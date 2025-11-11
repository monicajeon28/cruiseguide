'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle, FiFileText, FiUser, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import dayjs from 'dayjs';
import { showError } from '@/components/ui/Toast';

type AffiliateContract = {
  id: number;
  userId: number | null;
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  bankName?: string | null;
  bankAccount?: string | null;
  bankAccountHolder?: string | null;
  status: string;
  submittedAt: string;
  reviewedAt?: string | null;
  consentPrivacy: boolean;
  consentNonCompete: boolean;
  consentDbUse: boolean;
  consentPenalty: boolean;
  metadata?: {
    signature?: {
      url?: string;
      originalName?: string;
      fileId?: string;
    };
    [key: string]: any;
  } | null;
};

export default function MyContractClient({ partnerId }: { partnerId: string }) {
  const [contract, setContract] = useState<AffiliateContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    const loadContract = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/affiliate/my-contract');
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || '계약 정보를 불러올 수 없습니다.');
        }

        setContract(json.contract);
      } catch (error: any) {
        console.error('[MyContract] load error', error);
        showError(error.message || '계약 정보를 불러오는 중 문제가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, []);

  const signatureUrl = contract?.metadata?.signature?.url;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">계약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
        <div className="mx-auto w-full max-w-4xl px-4 pt-12">
          <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
            <Link
              href={`/partner/${partnerId}/dashboard`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
            >
              <FiArrowLeft /> 대시보드로 돌아가기
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <FiFileText className="text-3xl" />
              <h1 className="text-3xl font-extrabold">나의 어필리에이트 계약서</h1>
            </div>
          </header>
          <div className="rounded-3xl bg-white p-8 shadow-lg text-center">
            <FiFileText className="mx-auto text-6xl text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">계약 정보 없음</h2>
            <p className="text-slate-600 mb-6">
              승인된 어필리에이트 계약이 없습니다.
              <br />
              계약서를 작성하신 경우 관리자 승인을 기다려주세요.
            </p>
            <Link
              href={`/partner/${partnerId}/dashboard`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="mx-auto w-full max-w-4xl px-4 pt-12">
        <header className="mb-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl">
          <Link
            href={`/partner/${partnerId}/dashboard`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
          >
            <FiArrowLeft /> 대시보드로 돌아가기
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <FiCheckCircle className="text-3xl" />
            <h1 className="text-3xl font-extrabold">나의 어필리에이트 계약서</h1>
          </div>
          <p className="text-white/90">
            승인된 계약 정보와 서명을 확인할 수 있습니다.
          </p>
        </header>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiUser className="text-blue-600" />
              계약자 정보
            </h2>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div>
                <p className="font-semibold text-slate-500">성명</p>
                <p className="text-slate-900">{contract.name}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">연락처</p>
                <p className="text-slate-900">{contract.phone}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">이메일</p>
                <p className="text-slate-900">{contract.email || '-'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">주소</p>
                <p className="text-slate-900">{contract.address || '정보 없음'}</p>
              </div>
            </div>
          </section>

          {/* 정산 계좌 정보 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">정산 계좌 정보</h2>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="font-semibold text-slate-500">은행명</p>
                <p className="text-slate-900">{contract.bankName || '-'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">계좌번호</p>
                <p className="text-slate-900">{contract.bankAccount || '-'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">예금주</p>
                <p className="text-slate-900">{contract.bankAccountHolder || '-'}</p>
              </div>
            </div>
          </section>

          {/* 계약서 서명 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">계약서 서명</h2>
            {signatureUrl ? (
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center justify-center">
                    <img
                      src={signatureUrl}
                      alt="나의 서명"
                      className="max-h-40 w-auto"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
                  >
                    서명 크게 보기
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
                서명 정보가 없습니다.
              </div>
            )}
          </section>

          {/* 필수 동의 확인 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">필수 동의 항목</h2>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${contract.consentPrivacy ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <FiCheckCircle className="text-lg" />
                <span>개인정보 처리 동의</span>
              </div>
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${contract.consentNonCompete ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <FiCheckCircle className="text-lg" />
                <span>경업금지 조항 동의</span>
              </div>
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${contract.consentDbUse ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <FiCheckCircle className="text-lg" />
                <span>DB 활용 동의</span>
              </div>
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${contract.consentPenalty ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                <FiCheckCircle className="text-lg" />
                <span>위약금 조항 동의</span>
              </div>
            </div>
          </section>

          {/* 계약 상태 */}
          <section className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 mb-4">계약 상태</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 border border-green-200">
                <span className="font-semibold text-green-800">계약 상태</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold text-white ${
                  contract.status === 'approved' 
                    ? 'bg-green-600' 
                    : 'bg-yellow-600'
                }`}>
                  <FiCheckCircle />
                  {contract.status === 'approved' ? '승인 완료' : '승인 대기 중'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-700">계약 접수일</span>
                <span className="text-slate-600">{dayjs(contract.submittedAt).format('YYYY년 MM월 DD일')}</span>
              </div>
              {contract.reviewedAt && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-700">승인일</span>
                  <span className="text-slate-600">{dayjs(contract.reviewedAt).format('YYYY년 MM월 DD일')}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 서명 확대 모달 */}
      {showSignatureModal && signatureUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setShowSignatureModal(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">나의 서명</h3>
                <p className="text-xs text-slate-500">{contract.name}</p>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 flex items-center justify-center">
                <img
                  src={signatureUrl}
                  alt="나의 서명"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <a
                href={signatureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                새 창에서 열기
              </a>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
