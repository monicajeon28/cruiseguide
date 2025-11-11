'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiRefreshCw, FiSearch, FiClock, FiCheckCircle, FiSend, FiX, FiInfo } from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type PassportRequest = {
  id: number;
  customerName: string;
  customerPhone: string;
  status: string;
  passportRequestedAt: string | null;
  passportCompletedAt: string | null;
  createdAt: string;
};

export default function PartnerPassportRequestsClient({ partnerId }: { partnerId: string }) {
  const [requests, setRequests] = useState<PassportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PassportRequest | null>(null);
  const [sending, setSending] = useState(false);
  
  // 알리고 API 설정 (로컬 스토리지에 저장)
  const [aligoConfig, setAligoConfig] = useState({
    apiKey: '',
    userId: '',
    senderPhone: '',
  });

  const partnerBase = `/partner/${partnerId}`;
  const dashboardUrl = `/partner/${partnerId}/dashboard`;

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aligo_config');
      if (saved) {
        try {
          setAligoConfig(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load aligo config:', e);
        }
      }
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('mallUserId', partnerId);
      if (searchQuery) {
        params.set('q', searchQuery);
      }

      const res = await fetch(`/api/partner/passport-requests?${params.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || '여권 요청 목록을 불러오지 못했습니다.');
      }

      setRequests(json.customers || []);
    } catch (error: any) {
      console.error('[PartnerPassportRequests] load error', error);
      showError(error.message || '여권 요청 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [partnerId, searchQuery]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSendClick = (request: PassportRequest) => {
    if (request.passportRequestedAt) {
      showError('이미 여권 요청이 발송되었습니다.');
      return;
    }
    setSelectedRequest(request);
    setShowSendModal(true);
  };

  const handleSaveConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aligo_config', JSON.stringify(aligoConfig));
      showSuccess('설정이 저장되었습니다.');
    }
  };

  const handleSendPassport = async () => {
    if (!selectedRequest) return;

    if (!aligoConfig.apiKey || !aligoConfig.userId || !aligoConfig.senderPhone) {
      showError('알리고 API 설정을 모두 입력해주세요.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/partner/passport-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leadId: selectedRequest.id,
          aligoApiKey: aligoConfig.apiKey,
          aligoUserId: aligoConfig.userId,
          aligoSenderPhone: aligoConfig.senderPhone,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || '여권 요청 발송에 실패했습니다.');
      }

      showSuccess('여권 요청이 성공적으로 발송되었습니다!');
      setShowSendModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('[PartnerPassportRequests] send error', error);
      showError(error.message || '여권 요청 발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link
            href={dashboardUrl}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <FiArrowLeft className="text-base" />
            돌아가기
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">여권 요청 관리</h1>
        </div>

        {/* 검색 및 새로고침 */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">여권 요청 목록</h2>
              <p className="text-sm text-gray-600 mt-1">개인몰을 통해 유입된 고객의 여권 요청을 관리합니다.</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="고객명 또는 전화번호 검색..."
                  className="pl-10 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={loadRequests}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <FiRefreshCw className="text-base" />
                새로고침
              </button>
            </div>
          </div>
        </section>

        {/* 여권 요청 목록 */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">고객명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">전화번호</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">요청일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">완료일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      여권 요청 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!loading && requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      여권 요청 내역이 없습니다.
                    </td>
                  </tr>
                )}
                {!loading &&
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">{request.customerName}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{request.customerPhone}</td>
                      <td className="px-4 py-4 text-sm">
                        {request.passportCompletedAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            <FiCheckCircle /> 완료
                          </span>
                        ) : request.passportRequestedAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                            <FiClock /> 처리중
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                            대기중
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {request.passportRequestedAt
                          ? new Date(request.passportRequestedAt).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {request.passportCompletedAt
                          ? new Date(request.passportCompletedAt).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {!request.passportRequestedAt && (
                          <button
                            onClick={() => handleSendClick(request)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                          >
                            <FiSend className="text-xs" />
                            여권 요청 보내기
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 여권 보내기 모달 */}
        {showSendModal && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              {/* 헤더 */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">여권 요청 보내기</h2>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* 내용 */}
              <div className="px-6 py-6 space-y-6">
                {/* 안내 메시지 */}
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-start gap-3">
                    <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2 text-sm text-blue-900">
                      <p className="font-semibold">📱 알리고 SMS 연동이 필요합니다</p>
                      <p className="text-blue-800">
                        고객에게 여권 요청 문자를 보내려면 알리고 API 설정이 필요합니다.
                        <br />
                        아래에 알리고에서 받은 정보를 입력해주세요.
                      </p>
                      <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded-lg p-3">
                        <p className="font-semibold mb-1">💡 알리고에서 받아야 할 정보:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>API 키 (알리고 관리자 페이지에서 확인)</li>
                          <li>사용자 ID (알리고 로그인 아이디)</li>
                          <li>발신번호 (알리고에서 등록한 전화번호)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 고객 정보 */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📋 보낼 고객 정보</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-semibold">고객명:</span> {selectedRequest.customerName}</p>
                    <p><span className="font-semibold">전화번호:</span> {selectedRequest.customerPhone}</p>
                  </div>
                </div>

                {/* 알리고 설정 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">⚙️ 알리고 API 설정</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        1️⃣ API 키 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aligoConfig.apiKey}
                        onChange={(e) => setAligoConfig({ ...aligoConfig, apiKey: e.target.value })}
                        placeholder="알리고에서 받은 API 키를 입력하세요"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">알리고 관리자 페이지 → API 관리에서 확인할 수 있습니다</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        2️⃣ 사용자 ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aligoConfig.userId}
                        onChange={(e) => setAligoConfig({ ...aligoConfig, userId: e.target.value })}
                        placeholder="알리고 로그인 아이디를 입력하세요"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">알리고에 로그인할 때 사용하는 아이디입니다</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        3️⃣ 발신번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={aligoConfig.senderPhone}
                        onChange={(e) => setAligoConfig({ ...aligoConfig, senderPhone: e.target.value })}
                        placeholder="01012345678 (하이픈 없이 입력)"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">알리고에서 등록한 발신번호입니다 (하이픈 없이 숫자만 입력)</p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveConfig}
                    className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    💾 설정 저장하기 (다음에도 사용)
                  </button>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedRequest(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={sending}
                >
                  취소
                </button>
                <button
                  onClick={handleSendPassport}
                  disabled={sending || !aligoConfig.apiKey || !aligoConfig.userId || !aligoConfig.senderPhone}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      여권 요청 보내기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

