'use client';

import { useEffect, useState } from 'react';
import {
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiDollarSign,
  FiFileText,
  FiX,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type Settlement = {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  paymentDate: string | null;
  approvedAt: string | null;
  approvedBy: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
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

export default function AdminStatementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [profileFilter, setProfileFilter] = useState('');

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
      } else {
        throw new Error(json.message || '정산 목록을 불러오지 못했습니다.');
      }
    } catch (error: any) {
      console.error('[AdminStatements] load error', error);
      showError(error.message || '정산 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatement = async (settlementId: number, profileId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/affiliate/settlements/${settlementId}/statement?profileId=${profileId}`);
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
      console.error('[AdminStatements] load statement error', error);
      showError(error.message || '지급명세서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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
      a.download = `settlement_statement_${settlementId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('엑셀 파일 다운로드가 시작되었습니다.');
    } catch (error: any) {
      console.error('[AdminStatements] download excel error', error);
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
      case 'LOCKED':
        return 'bg-yellow-50 text-yellow-700';
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
      case 'LOCKED':
        return '잠금';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold">지급명세서 관리</h1>
              <p className="text-sm text-white/80">
                어필리에이트 파트너들의 월별 지급명세서를 확인하고 관리합니다.
              </p>
            </div>
            <button
              onClick={loadSettlements}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
            >
              <FiRefreshCw className="text-base" />
              새로고침
            </button>
          </div>
        </header>

        {/* 정산 목록 */}
        <section className="rounded-3xl bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">정산 기간</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">승인일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">지급일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">승인자</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      정산 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!isLoading && settlements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      정산 내역이 없습니다.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {new Date(settlement.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                        {new Date(settlement.periodEnd).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(settlement.status)}`}
                        >
                          {settlement.status === 'DRAFT' && <FiClock className="mr-1" />}
                          {settlement.status === 'APPROVED' && <FiCheckCircle className="mr-1" />}
                          {settlement.status === 'PAID' && <FiDollarSign className="mr-1" />}
                          {getStatusLabel(settlement.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {settlement.approvedAt ? new Date(settlement.approvedAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {settlement.paymentDate
                          ? new Date(settlement.paymentDate).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {settlement.approvedBy?.name || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const profileId = prompt('파트너 프로필 ID를 입력하세요:');
                              if (profileId) {
                                const id = parseInt(profileId, 10);
                                if (!isNaN(id)) {
                                  loadStatement(settlement.id, id);
                                } else {
                                  showError('올바른 프로필 ID를 입력해주세요.');
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <FiEye /> 보기
                          </button>
                          <button
                            onClick={() => handleDownloadExcel(settlement.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <FiDownload /> 엑셀
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 명세서 상세 모달 */}
        {isDetailModalOpen && statement && selectedSettlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-extrabold text-gray-900">지급명세서 상세</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-700">정산 기간</p>
                    <p className="text-lg font-bold text-blue-900">
                      {new Date(statement.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(statement.periodEnd).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-700">총 지급액</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {statement.netAmount.toLocaleString()}원
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-2 text-base font-semibold text-gray-800">기본 정보</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div>
                      <dt className="font-semibold text-gray-500">파트너명</dt>
                      <dd>{statement.displayName}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">파트너 코드</dt>
                      <dd>{statement.affiliateCode}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">파트너 유형</dt>
                      <dd>{statement.type}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">총 수당</dt>
                      <dd>{statement.grossAmount.toLocaleString()}원</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">원천징수액 ({statement.withholdingRate}%)</dt>
                      <dd>{statement.withholdingAmount.toLocaleString()}원</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">정산 항목 수</dt>
                      <dd>{statement.entryCount.toLocaleString()}개</dd>
                    </div>
                  </dl>
                </div>

                {statement.details && statement.details.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="mb-3 text-base font-semibold text-gray-800">상세 내역</h3>
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-100">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">상품코드</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">판매일</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">유형</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">금액</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {statement.details.map((detail) => (
                            <tr key={detail.entryId}>
                              <td className="px-4 py-2 text-xs text-gray-800">
                                {detail.productCode || 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">
                                {detail.saleDate ? new Date(detail.saleDate).toLocaleDateString('ko-KR') : '-'}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600">{detail.entryType}</td>
                              <td className="px-4 py-2 text-right text-xs font-semibold text-gray-800">
                                {detail.amount.toLocaleString()}원
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

