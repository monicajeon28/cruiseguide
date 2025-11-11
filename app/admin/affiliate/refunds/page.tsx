'use client';

import { useEffect, useState } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiUser,
  FiPackage,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type AffiliateSale = {
  id: number;
  externalOrderCode: string | null;
  productCode: string | null;
  saleAmount: number;
  netRevenue: number | null;
  status: string;
  saleDate: string | null;
  refundedAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  manager: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
  } | null;
  agent: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
  } | null;
  lead: {
    id: number;
    customerName: string | null;
    customerPhone: string | null;
  } | null;
};

export default function AdminRefundsPage() {
  const [sales, setSales] = useState<AffiliateSale[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<AffiliateSale | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSales();
  }, [filters]);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.search.trim()) {
        params.set('search', filters.search.trim());
      }

      const res = await fetch(`/api/admin/affiliate/sales?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '판매 목록을 불러오지 못했습니다.');
      }
      
      // 환불 관련 상태만 필터링 (REFUNDED 또는 환불 가능한 상태)
      const refundRelatedSales = (json.sales || []).filter(
        (sale: AffiliateSale) =>
          sale.status === 'REFUNDED' ||
          sale.status === 'CONFIRMED' ||
          sale.status === 'PAID' ||
          sale.status === 'PAYOUT_SCHEDULED'
      );
      
      setSales(refundRelatedSales);
    } catch (error: any) {
      console.error('[AdminRefunds] load error', error);
      showError(error.message || '판매 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedSale || !refundReason.trim()) {
      showError('환불 사유를 입력해주세요.');
      return;
    }

    if (!confirm('정말 환불 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/affiliate/sales/${selectedSale.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: refundReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '환불 처리에 실패했습니다.');
      }

      showSuccess('환불 처리가 완료되었습니다.');
      setIsRefundModalOpen(false);
      setRefundReason('');
      setSelectedSale(null);
      loadSales();
    } catch (error: any) {
      console.error('[AdminRefunds] refund error', error);
      showError(error.message || '환불 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REFUNDED':
        return 'bg-red-50 text-red-700';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700';
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700';
      case 'PAYOUT_SCHEDULED':
        return 'bg-purple-50 text-purple-700';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'REFUNDED':
        return '환불됨';
      case 'CONFIRMED':
        return '확정됨';
      case 'PAID':
        return '지급완료';
      case 'PAYOUT_SCHEDULED':
        return '지급예정';
      case 'PENDING':
        return '대기중';
      case 'CANCELLED':
        return '취소됨';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <header className="rounded-3xl bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold">환불 처리</h1>
              <p className="text-sm text-white/80">
                어필리에이트 판매 건에 대한 환불을 처리하고 관리합니다.
              </p>
            </div>
            <button
              onClick={loadSales}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
            >
              <FiRefreshCw className="text-base" />
              새로고침
            </button>
          </div>
        </header>

        {/* 필터 */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="주문번호, 상품코드, 고객명 검색..."
                  className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">전체 상태</option>
                <option value="REFUNDED">환불됨</option>
                <option value="CONFIRMED">확정됨</option>
                <option value="PAID">지급완료</option>
                <option value="PAYOUT_SCHEDULED">지급예정</option>
              </select>
            </div>
          </div>
        </section>

        {/* 판매 목록 */}
        <section className="rounded-3xl bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">주문 정보</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">고객 정보</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">담당자</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">판매 금액</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">판매일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">환불일</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                      판매 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!isLoading && sales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                      조건에 해당하는 판매 내역이 없습니다.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {sale.externalOrderCode || `#${sale.id}`}
                        </div>
                        {sale.productCode && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <FiPackage className="text-xs" />
                            {sale.productCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {sale.lead ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.lead.customerName || '이름 없음'}
                            </div>
                            {sale.lead.customerPhone && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <FiUser className="text-xs" />
                                {sale.lead.customerPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">고객 정보 없음</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {sale.manager && (
                            <div className="text-xs">
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                대리점장
                              </span>
                              <span className="ml-1 text-gray-700">
                                {sale.manager.displayName || sale.manager.affiliateCode || '-'}
                              </span>
                            </div>
                          )}
                          {sale.agent && (
                            <div className="text-xs">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                판매원
                              </span>
                              <span className="ml-1 text-gray-700">
                                {sale.agent.displayName || sale.agent.affiliateCode || '-'}
                              </span>
                            </div>
                          )}
                          {!sale.manager && !sale.agent && (
                            <span className="text-xs text-gray-400">담당자 없음</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {sale.saleAmount.toLocaleString()}원
                        </div>
                        {sale.netRevenue && (
                          <div className="text-xs text-gray-500">
                            순이익: {sale.netRevenue.toLocaleString()}원
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(sale.status)}`}
                        >
                          {sale.status === 'REFUNDED' && <FiXCircle className="mr-1" />}
                          {sale.status === 'CONFIRMED' && <FiCheckCircle className="mr-1" />}
                          {sale.status === 'PAID' && <FiDollarSign className="mr-1" />}
                          {sale.status === 'PAYOUT_SCHEDULED' && <FiClock className="mr-1" />}
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {sale.refundedAt ? new Date(sale.refundedAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {sale.status !== 'REFUNDED' && sale.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsRefundModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <FiXCircle className="text-xs" />
                            환불 처리
                          </button>
                        )}
                        {sale.status === 'REFUNDED' && sale.cancellationReason && (
                          <div className="text-xs text-gray-500">
                            사유: {sale.cancellationReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 환불 처리 모달 */}
        {isRefundModalOpen && selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-extrabold text-gray-900">환불 처리</h2>
                <button
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setRefundReason('');
                    setSelectedSale(null);
                  }}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <FiXCircle className="text-xl" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-2 text-base font-semibold text-gray-800">판매 정보</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div>
                      <dt className="font-semibold text-gray-500">주문번호</dt>
                      <dd>{selectedSale.externalOrderCode || `#${selectedSale.id}`}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">상품코드</dt>
                      <dd>{selectedSale.productCode || '-'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">판매 금액</dt>
                      <dd className="font-semibold text-gray-900">
                        {selectedSale.saleAmount.toLocaleString()}원
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-500">순이익</dt>
                      <dd>{selectedSale.netRevenue?.toLocaleString() || '-'}원</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    환불 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="환불 사유를 상세히 입력해주세요..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> 환불 처리는 되돌릴 수 없습니다. 환불 사유를 정확히 확인한 후 처리해주세요.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setRefundReason('');
                    setSelectedSale(null);
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  disabled={processing}
                >
                  취소
                </button>
                <button
                  onClick={handleRefund}
                  disabled={processing || !refundReason.trim()}
                  className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-red-700 disabled:bg-red-300"
                >
                  {processing ? '처리 중...' : '환불 처리'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

