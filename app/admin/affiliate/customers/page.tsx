// app/admin/affiliate/customers/page.tsx
// 어필리에이트 고객 관리 페이지 (Lead 목록)

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiUser,
  FiPhone,
  FiCheckCircle,
} from 'react-icons/fi';
import { showError } from '@/components/ui/Toast';

type AffiliateLead = {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  passportRequestedAt: string | null;
  passportCompletedAt: string | null;
  lastContactedAt: string | null;
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
  _count: {
    interactions: number;
    sales: number;
  };
};

export default function AffiliateCustomersPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<AffiliateLead[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    managerId: '',
    agentId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLeads();
  }, [filters, page]);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.search.trim()) {
        params.set('customerName', filters.search.trim());
        params.set('customerPhone', filters.search.trim());
      }
      if (filters.status) params.set('status', filters.status);
      if (filters.managerId) params.set('managerId', filters.managerId);
      if (filters.agentId) params.set('agentId', filters.agentId);
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/admin/affiliate/leads?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '고객 목록을 불러오지 못했습니다.');
      }
      setLeads(json.leads ?? []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('[AffiliateCustomers] load error', error);
      showError(error.message || '고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700';
      case 'CONTACTED':
        return 'bg-yellow-50 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-purple-50 text-purple-700';
      case 'PURCHASED':
        return 'bg-emerald-50 text-emerald-700';
      case 'REFUNDED':
        return 'bg-red-50 text-red-700';
      case 'TEST_GUIDE':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW':
        return '신규';
      case 'CONTACTED':
        return '연락됨';
      case 'IN_PROGRESS':
        return '진행중';
      case 'PURCHASED':
        return '구매완료';
      case 'REFUNDED':
        return '환불';
      case 'TEST_GUIDE':
        return '지니가이드 체험중';
      default:
        return status;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">고객 관리</h1>
            <p className="text-sm text-gray-600 mt-1">
              어필리에이트를 통해 유입된 고객(Lead)을 관리하고 추적합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadLeads}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <FiRefreshCw className="text-base" />
              새로고침
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3 text-gray-400 text-lg" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="고객명, 전화번호 검색"
              className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">전체 상태</option>
              <option value="NEW">신규</option>
              <option value="CONTACTED">연락됨</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="PURCHASED">구매완료</option>
              <option value="REFUNDED">환불</option>
              <option value="TEST_GUIDE">지니가이드 체험중</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">고객 정보</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">담당자</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">상태</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">여권</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">활동</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">등록일</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    고객 목록을 불러오는 중입니다...
                  </td>
                </tr>
              )}
              {!isLoading && leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    조건에 해당하는 고객이 없습니다.
                  </td>
                </tr>
              )}
              {!isLoading &&
                leads.map((lead) => {
                  return (
                    <tr key={lead.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {lead.customerName || '이름 없음'}
                            </div>
                            {lead.customerPhone && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <FiPhone className="text-xs" />
                                {lead.customerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {lead.manager && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                대리점장
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {lead.manager.displayName || lead.manager.affiliateCode || '이름 없음'}
                              </span>
                            </div>
                          )}
                          {lead.agent && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                판매원
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {lead.agent.displayName || lead.agent.affiliateCode || '이름 없음'}
                              </span>
                            </div>
                          )}
                          {!lead.manager && !lead.agent && (
                            <span className="text-sm text-gray-400">담당자 없음</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(lead.status)}`}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {lead.passportCompletedAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <FiCheckCircle className="text-xs" />
                            완료
                          </span>
                        ) : lead.passportRequestedAt ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                            대기중
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        <div className="text-gray-900">{lead._count.interactions}</div>
                        <div className="text-xs text-gray-500">상호작용</div>
                        <div className="text-gray-900 mt-1">{lead._count.sales}</div>
                        <div className="text-xs text-gray-500">판매</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => router.push(`/admin/affiliate/customers/${lead.id}`)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <FiEye className="text-base" />
                          상세보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-600">
              페이지 {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
