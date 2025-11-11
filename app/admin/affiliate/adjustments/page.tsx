// app/admin/affiliate/adjustments/page.tsx
// 관리자 수당 조정 승인/거부 페이지 + 구매 완료 승인

'use client';

import { useEffect, useState } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiDollarSign,
  FiFileText,
  FiMic,
  FiEye,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type CommissionAdjustment = {
  id: number;
  ledgerId: number;
  amount: number;
  reason: string;
  status: string;
  requestedAt: string;
  decidedAt: string | null;
  ledger: {
    id: number;
    amount: number;
    entryType: string;
    sale: {
      id: number;
      productCode: string;
      saleAmount: number | null;
      saleDate: string | null;
    } | null;
    profile: {
      id: number;
      affiliateCode: string | null;
      displayName: string | null;
      type: string;
    } | null;
  };
  requestedBy: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  approvedBy: {
    id: number;
    name: string | null;
  } | null;
};

type PendingApproval = {
  leadId: number;
  customerName: string | null;
  customerPhone: string | null;
  purchasedAt: string;
  manager: {
    id: number;
    name: string;
    type: string;
  } | null;
  agent: {
    id: number;
    name: string;
    type: string;
  } | null;
  sales: Array<{
    id: number;
    productCode: string | null;
    saleAmount: number;
    saleDate: string | null;
    createdAt: string;
  }>;
  interactions: {
    count: number;
    hasRecordings: boolean;
    hasNotes: boolean;
    latest: {
      type: string;
      note: string | null;
      occurredAt: string;
      mediaCount: number;
    } | null;
  };
  canApprove: boolean;
};

export default function AdminAdjustmentsPage() {
  const [activeTab, setActiveTab] = useState<'adjustments' | 'purchases'>('purchases');
  const [adjustments, setAdjustments] = useState<CommissionAdjustment[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'adjustments') {
      loadAdjustments();
    } else {
      loadPendingApprovals();
    }
  }, [filters, activeTab]);

  const loadAdjustments = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/admin/affiliate/adjustments?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '수당 조정 목록을 불러오지 못했습니다.');
      }
      setAdjustments(json.adjustments ?? []);
    } catch (error: any) {
      console.error('[AdminAdjustments] load error', error);
      showError(error.message || '수당 조정 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (adjustmentId: number) => {
    if (!confirm('이 수당 조정을 승인하시겠습니까?')) {
      return;
    }

    try {
      setProcessingId(adjustmentId);
      const res = await fetch(`/api/admin/affiliate/adjustments/${adjustmentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '수당 조정 승인에 실패했습니다.');
      }

      showSuccess('수당 조정이 승인되었습니다.');
      loadAdjustments();
    } catch (error: any) {
      console.error('[AdminAdjustments] approve error', error);
      showError(error.message || '수당 조정 승인 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (adjustmentId: number) => {
    const reason = prompt('거부 사유를 입력해주세요:');
    if (!reason) {
      return;
    }

    try {
      setProcessingId(adjustmentId);
      const res = await fetch(`/api/admin/affiliate/adjustments/${adjustmentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', notes: reason }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '수당 조정 거부에 실패했습니다.');
      }

      showSuccess('수당 조정이 거부되었습니다.');
      loadAdjustments();
    } catch (error: any) {
      console.error('[AdminAdjustments] reject error', error);
      showError(error.message || '수당 조정 거부 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/affiliate/sales/pending-approval');
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '구매 완료 승인 목록을 불러오지 못했습니다.');
      }
      setPendingApprovals(json.pendingApprovals ?? []);
    } catch (error: any) {
      console.error('[AdminAdjustments] load pending approvals error', error);
      showError(error.message || '구매 완료 승인 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePurchase = async (saleId: number) => {
    if (!confirm('이 구매 완료를 승인하고 수당을 확정하시겠습니까?')) {
      return;
    }

    try {
      setProcessingId(saleId);
      const res = await fetch(`/api/admin/affiliate/sales/${saleId}/approve-commission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '구매 완료 승인에 실패했습니다.');
      }

      showSuccess('구매 완료가 승인되고 수당이 확정되었습니다.');
      loadPendingApprovals();
    } catch (error: any) {
      console.error('[AdminAdjustments] approve purchase error', error);
      showError(error.message || '구매 완료 승인 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'bg-yellow-50 text-yellow-700';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700';
      case 'REJECTED':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return '대기중';
      case 'APPROVED':
        return '승인됨';
      case 'REJECTED':
        return '거부됨';
      default:
        return status;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">수당 조정 승인</h1>
            <p className="text-sm text-gray-600 mt-1">
              구매 완료 승인 및 수당 조정 신청을 검토하고 승인/거부합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (activeTab === 'adjustments') {
                  loadAdjustments();
                } else {
                  loadPendingApprovals();
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <FiRefreshCw className="text-base" />
              새로고침
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mt-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'purchases'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            구매 완료 승인 ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'adjustments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            수당 조정 신청 ({adjustments.filter((a) => a.status === 'REQUESTED').length})
          </button>
        </div>

        {activeTab === 'adjustments' && (
          <div className="mt-6">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">전체 상태</option>
              <option value="REQUESTED">대기중</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거부됨</option>
            </select>
          </div>
        )}
      </section>

      {/* 구매 완료 승인 섹션 */}
      {activeTab === 'purchases' && (
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">고객 정보</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">판매 정보</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">고객 기록</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">구매일</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      승인 대기 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!isLoading && pendingApprovals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      승인 대기 중인 구매 완료가 없습니다.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  pendingApprovals.map((approval) => (
                    <tr key={approval.leadId} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {approval.customerName || '이름 없음'}
                            </div>
                            {approval.customerPhone && (
                              <div className="text-xs text-gray-500">{approval.customerPhone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {approval.manager && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                대리점장
                              </span>
                              <span className="text-sm text-gray-900">{approval.manager.name}</span>
                            </div>
                          )}
                          {approval.agent && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                판매원
                              </span>
                              <span className="text-sm text-gray-900">{approval.agent.name}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {approval.sales.length > 0 ? (
                          <div className="space-y-1">
                            {approval.sales.map((sale) => (
                              <div key={sale.id} className="text-sm">
                                <div className="font-semibold text-gray-900">
                                  {sale.productCode || '상품 코드 없음'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {sale.saleAmount.toLocaleString()}원
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">판매 기록 없음</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FiFileText className="text-gray-400" />
                            <span className="text-sm text-gray-700">
                              기록 {approval.interactions.count}개
                            </span>
                            {approval.interactions.hasNotes && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                메모 있음
                              </span>
                            )}
                          </div>
                          {approval.interactions.hasRecordings && (
                            <div className="flex items-center gap-2">
                              <FiMic className="text-blue-500" />
                              <span className="text-sm text-blue-700 font-semibold">녹음 있음</span>
                            </div>
                          )}
                          {!approval.canApprove && (
                            <span className="text-xs text-red-600 font-semibold">
                              기록 또는 녹음 필요
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(approval.purchasedAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/admin/affiliate/customers/${approval.leadId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <FiEye />
                            상세보기
                          </a>
                          {approval.canApprove && approval.sales.length > 0 && (
                            <button
                              onClick={() => handleApprovePurchase(approval.sales[0].id)}
                              disabled={processingId === approval.sales[0].id}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <FiCheckCircle />
                              승인
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
      )}

      {/* 수당 조정 신청 섹션 */}
      {activeTab === 'adjustments' && (
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">신청자</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">수당 정보</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">조정 금액</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">사유</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">상태</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">신청일</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    조정 신청 목록을 불러오는 중입니다...
                  </td>
                </tr>
              )}
              {!isLoading && adjustments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    조건에 해당하는 조정 신청이 없습니다.
                  </td>
                </tr>
              )}
              {!isLoading &&
                adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FiUser className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {adjustment.requestedBy.name || '이름 없음'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {adjustment.ledger.profile?.displayName || adjustment.ledger.profile?.affiliateCode}
                          </div>
                          <div className="text-xs text-gray-500">
                            {adjustment.ledger.profile?.type === 'BRANCH_MANAGER' ? '대리점장' : '판매원'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {adjustment.ledger.sale?.productCode || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        원래 수당: {adjustment.ledger.amount.toLocaleString()}원
                      </div>
                      {adjustment.ledger.sale?.saleDate && (
                        <div className="text-xs text-gray-500">
                          판매일: {new Date(adjustment.ledger.sale.saleDate).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {adjustment.amount > 0 ? '+' : ''}
                        {adjustment.amount.toLocaleString()}원
                      </div>
                      <div className="text-xs text-gray-500">
                        조정 후: {(adjustment.ledger.amount + adjustment.amount).toLocaleString()}원
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700 max-w-md">{adjustment.reason}</div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(adjustment.status)}`}
                      >
                        {adjustment.status === 'REQUESTED' && <FiClock className="mr-1" />}
                        {adjustment.status === 'APPROVED' && <FiCheckCircle className="mr-1" />}
                        {adjustment.status === 'REJECTED' && <FiXCircle className="mr-1" />}
                        {getStatusLabel(adjustment.status)}
                      </span>
                      {adjustment.approvedBy && (
                        <div className="text-xs text-gray-500 mt-1">
                          처리자: {adjustment.approvedBy.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(adjustment.requestedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {adjustment.status === 'REQUESTED' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(adjustment.id)}
                            disabled={processingId === adjustment.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <FiCheckCircle />
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(adjustment.id)}
                            disabled={processingId === adjustment.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            <FiXCircle />
                            거부
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">처리 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </section>
      )}
    </div>
  );
}
