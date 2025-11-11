// app/partner/[partnerId]/statements/PartnerStatementsClient.tsx
// 파트너 지급명세서 확인 클라이언트 컴포넌트

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiX,
  FiDollarSign,
  FiFileText,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type Settlement = {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  paymentDate: string | null;
};

type Statement = {
  profileId: number;
  affiliateCode: string | null;
  displayName: string | null;
  type: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  withholdingAmount: number;
  withholdingRate: number;
  netAmount: number;
  entryCount: number;
  confirmed: boolean;
  confirmedAt: string | null;
  details?: Array<{
    entryId: number;
    saleId: number | null;
    productCode: string | null;
    saleAmount: number | null;
    saleDate: string | null;
    entryType: string;
    amount: number;
    withholdingAmount: number;
    netAmount: number;
  }>;
};

type PartnerStatementsClientProps = {
  currentUser: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    mallUserId: string;
    mallNickname: string | null;
  };
  profile: {
    id: number;
    type: string;
    affiliateCode: string | null;
    displayName: string | null;
  };
};

export default function PartnerStatementsClient({ currentUser, profile }: PartnerStatementsClientProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const partnerBase = `/partner/${currentUser.mallUserId}`;
  const dashboardUrl = `/${currentUser.mallUserId}/dashboard`;

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/affiliate/settlements-list?limit=100');
      const json = await res.json();
      if (res.ok && json.ok) {
        setSettlements(json.settlements || []);
      }
    } catch (error: any) {
      console.error('[PartnerStatements] load error', error);
      showError(error.message || '정산 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatement = async (settlementId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/affiliate/settlements/${settlementId}/statement?profileId=${profile.id}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '지급명세서를 불러오지 못했습니다.');
      }
      
      if (json.statements && json.statements.length > 0) {
        setStatement(json.statements[0]);
        setSelectedSettlement(json.settlement);
        setIsDetailModalOpen(true);
      } else {
        showError('지급명세서가 아직 생성되지 않았습니다.');
      }
    } catch (error: any) {
      console.error('[PartnerStatements] load statement error', error);
      showError(error.message || '지급명세서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSettlement || !statement) return;

    if (!confirm('지급명세서를 확인하시겠습니까? 3.3% 원천징수 금액을 확인해주세요.')) {
      return;
    }

    try {
      setConfirming(true);
      const res = await fetch(`/api/admin/affiliate/settlements/${selectedSettlement.id}/statement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '지급명세서 확인에 실패했습니다.');
      }

      showSuccess('지급명세서를 확인했습니다.');
      if (statement) {
        setStatement({ ...statement, confirmed: true, confirmedAt: new Date().toISOString() });
      }
    } catch (error: any) {
      console.error('[PartnerStatements] confirm error', error);
      showError(error.message || '지급명세서 확인 중 오류가 발생했습니다.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDownloadExcel = async (settlementId: number) => {
    try {
      const res = await fetch(`/api/admin/affiliate/settlements/${settlementId}/export-excel`);
      if (!res.ok) {
        throw new Error('엑셀 다운로드에 실패했습니다.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `수당집계표_${settlementId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('엑셀 파일이 다운로드되었습니다.');
    } catch (error: any) {
      console.error('[PartnerStatements] download error', error);
      showError(error.message || '엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700';
      case 'PAID':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '초안';
      case 'APPROVED':
        return '승인됨';
      case 'PAID':
        return '지급완료';
      default:
        return status;
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
          <h1 className="text-2xl font-extrabold text-gray-900">지급명세서</h1>
        </div>

        {/* 필터 및 액션 */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">월별 정산 내역</h2>
              <p className="text-sm text-gray-600 mt-1">
                지급명세서를 확인하고 3.3% 원천징수 금액을 검증하세요.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadSettlements}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <FiRefreshCw className="text-base" />
                새로고침
              </button>
            </div>
          </div>
        </section>

        {/* 정산 목록 */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">정산 기간</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">상태</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">지급일</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      정산 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!isLoading && settlements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                      정산 내역이 없습니다.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(settlement.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                          {new Date(settlement.periodEnd).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(settlement.status)}`}
                        >
                          {getStatusLabel(settlement.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {settlement.paymentDate
                          ? new Date(settlement.paymentDate).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => loadStatement(settlement.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <FiEye />
                            명세서 보기
                          </button>
                          {(settlement.status === 'APPROVED' || settlement.status === 'PAID') && (
                            <button
                              onClick={() => handleDownloadExcel(settlement.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <FiDownload />
                              엑셀 다운로드
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 지급명세서 상세 모달 */}
        {isDetailModalOpen && selectedSettlement && statement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
                <h2 className="text-xl font-extrabold text-gray-900">지급명세서</h2>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSettlement(null);
                    setStatement(null);
                  }}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-6">
                {/* 기본 정보 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">정산 기간</label>
                    <div className="text-sm text-gray-900">
                      {new Date(statement.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(statement.periodEnd).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">수령인</label>
                    <div className="text-sm text-gray-900">
                      {statement.displayName || statement.affiliateCode || '-'}
                    </div>
                  </div>
                </div>

                {/* 수당 요약 */}
                <div className="rounded-xl border border-gray-200 p-6 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">수당 요약</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">총 수당</label>
                      <div className="text-2xl font-bold text-gray-900">
                        {statement.grossAmount.toLocaleString()}원
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-red-300 bg-red-50">
                      <label className="block text-xs font-semibold text-red-600 mb-1">
                        원천징수 ({statement.withholdingRate}%)
                      </label>
                      <div className="text-2xl font-bold text-red-700">
                        -{statement.withholdingAmount.toLocaleString()}원
                      </div>
                      <p className="text-xs text-red-600 mt-2">
                        총 수당의 {statement.withholdingRate}%가 원천징수됩니다.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-emerald-300 bg-emerald-50">
                      <label className="block text-xs font-semibold text-emerald-600 mb-1">실지급액</label>
                      <div className="text-2xl font-bold text-emerald-700">
                        {statement.netAmount.toLocaleString()}원
                      </div>
                      <p className="text-xs text-emerald-600 mt-2">
                        실제로 지급되는 금액입니다.
                      </p>
                    </div>
                  </div>
                  
                  {/* 원천징수 계산 안내 */}
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">원천징수 계산 안내</p>
                        <p>
                          총 수당 <strong>{statement.grossAmount.toLocaleString('ko-KR')}원</strong>에서{' '}
                          <strong>{statement.withholdingRate}% 원천징수 {statement.withholdingAmount.toLocaleString('ko-KR')}원</strong>을 제외한{' '}
                          <strong className="text-emerald-700">{statement.netAmount.toLocaleString('ko-KR')}원</strong>이 지급됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상세 내역 */}
                {statement.details && statement.details.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">상세 내역</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">상품코드</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">판매일</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">수당</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">원천징수</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">실지급액</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {statement.details.map((detail, index) => (
                            <tr key={detail.entryId || index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {detail.productCode || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {detail.saleDate
                                  ? new Date(detail.saleDate).toLocaleDateString('ko-KR')
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right text-gray-900">
                                {detail.amount.toLocaleString()}원
                              </td>
                              <td className="px-4 py-2 text-sm text-right text-red-600">
                                -{detail.withholdingAmount.toLocaleString()}원
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-semibold text-emerald-600">
                                {detail.netAmount.toLocaleString()}원
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                              합계
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                              {statement.grossAmount.toLocaleString()}원
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                              -{statement.withholdingAmount.toLocaleString()}원
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">
                              {statement.netAmount.toLocaleString()}원
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* 확인 상태 */}
                {statement.confirmed ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <FiCheckCircle className="text-xl" />
                      <span className="font-semibold">지급명세서를 확인했습니다.</span>
                    </div>
                    {statement.confirmedAt && (
                      <div className="text-sm text-emerald-600 mt-2">
                        확인일: {new Date(statement.confirmedAt).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                      <FiClock className="text-xl" />
                      <span className="font-semibold">지급명세서 확인 대기중</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      3.3% 원천징수 금액을 확인하신 후 아래 버튼을 클릭하여 확인 처리해주세요.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSettlement(null);
                    setStatement(null);
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  닫기
                </button>
                {selectedSettlement && (
                  <button
                    onClick={() => handleDownloadExcel(selectedSettlement.id)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <FiDownload className="inline mr-2" />
                    엑셀 다운로드
                  </button>
                )}
                {!statement.confirmed && (
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {confirming ? '확인 중...' : '지급명세서 확인'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

