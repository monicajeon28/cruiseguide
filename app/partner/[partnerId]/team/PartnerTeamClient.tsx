'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiNavigation,
  FiRefreshCw,
  FiChevronRight,
  FiUsers,
  FiTrendingUp,
  FiCreditCard,
  FiArrowLeft,
} from 'react-icons/fi';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { showError } from '@/components/ui/Toast';

type AgentMetrics = {
  leadsTotal: number;
  leadsActive: number;
  salesCount: number;
  totalSalesAmount: number;
  confirmedSalesAmount: number;
  netRevenue: number;
  pendingCommission: number;
  settledCommission: number;
  overrideCommission: number;
  withholding: number;
  lastSaleAt: string | null;
};

type AgentRecord = {
  profileId: number;
  affiliateCode: string;
  type: string;
  status: string;
  displayName: string | null;
  branchLabel: string | null;
  joinedAt: string | null;
  user: {
    id: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    mallUserId: string | null;
    mallNickname: string | null;
    password: string | null; // 비밀번호 추가
  };
  metrics: AgentMetrics;
};

type AgentsResponse = {
  ok: boolean;
  role: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ';
  managerProfileId: number | null;
  agents: AgentRecord[];
  summary: {
    agentCount: number;
    leadsTotal: number;
    salesCount: number;
    salesAmount: number;
    confirmedSalesAmount: number;
    pendingCommission: number;
    settledCommission: number;
    overrideCommission: number;
  };
};

function formatCurrency(value: number) {
  return value.toLocaleString('ko-KR');
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export default function PartnerTeamClient() {
  const params = useParams();
  const partnerId = params?.partnerId as string;
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner/agents', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '판매원 정보를 불러오지 못했습니다.');
      }
      setData(json as AgentsResponse);
      setError(null);
    } catch (err) {
      console.error('[PartnerTeamClient] load error', err);
      const message = err instanceof Error ? err.message : '판매원 정보를 불러오지 못했습니다.';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    const cards = [
      {
        title: '팀 판매원 수',
        value: `${data.summary.agentCount.toLocaleString()}명`,
        icon: <FiUsers />,
        description: '관리 중인 파트너 인원',
      },
      {
        title: '총 판매 금액',
        value: `${formatCurrency(data.summary.salesAmount)}원`,
        icon: <FiTrendingUp />,
        description: '전체 판매 집계',
      },
      {
        title: '확정 수당',
        value: `${formatCurrency(data.summary.settledCommission)}원`,
        icon: <FiCreditCard />,
        description: '정산 완료된 금액',
      },
      {
        title: '미정산 수당',
        value: `${formatCurrency(data.summary.pendingCommission)}원`,
        icon: <FiNavigation />,
        description: '정산 예정 금액',
      },
    ];
    return cards;
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 mx-auto border-2 border-blue-500 border-b-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">판매원 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl space-y-4 text-center">
          <h1 className="text-lg font-bold text-rose-600">판매원 정보를 불러오지 못했습니다.</h1>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <FiRefreshCw /> 다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isBranchManager = data.role === 'BRANCH_MANAGER';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 md:px-6">
        <header className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl">
          <Link
            href={`/partner/${partnerId}/dashboard`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
          >
            <FiArrowLeft /> 대시보드로 돌아가기
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/80">Partner Team</p>
              <h1 className="text-3xl font-black leading-snug md:text-4xl">
                {isBranchManager ? '판매원 팀 관리' : '나의 판매 실적'}
              </h1>
              <p className="max-w-2xl text-sm text-white/80 md:text-base">
                팀 판매원들의 활동 현황과 정산 수당을 한눈에 확인하세요. 판매 실적과 수당 정보가 실시간으로 반영됩니다.
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
                요약 지표
              </p>
              <div className="mt-4 grid gap-3 text-sm text-white">
                <div className="flex items-center gap-3">
                  <FiUsers /> <span>판매원 {data.summary.agentCount.toLocaleString()}명</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiTrendingUp /> 총 판매 {formatCurrency(data.summary.salesAmount)}원
                </div>
                <div className="flex items-center gap-3">
                  <FiCreditCard /> 확정 수당 {formatCurrency(data.summary.settledCommission)}원
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-slate-500 text-sm">{card.title}</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-2xl text-blue-600">{card.icon}</div>
                <div className="text-xl font-bold text-slate-900">{card.value}</div>
              </div>
              <p className="mt-2 text-xs text-slate-500">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isBranchManager ? '판매원 목록' : '판매 성과'}
              </h2>
              <p className="text-sm text-slate-500">
                {isBranchManager
                  ? '각 판매원의 판매 실적과 수당 현황을 확인하세요.'
                  : '본인의 판매 현황과 수당 요약입니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <FiRefreshCw /> 새로고침
            </button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    판매원
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    연락처 / 파트너몰
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    판매 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    수당 요약
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    최근 판매
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.agents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FiUsers className="text-4xl text-slate-300" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700">표시할 판매원이 없습니다</p>
                          <p className="text-xs text-slate-500">
                            {isBranchManager 
                              ? '판매원을 초대하면 여기에 표시됩니다. 판매원 초대는 기존 "어필리에이트 > 팀 관리" 페이지에서 진행할 수 있습니다.'
                              : '판매 실적이 없습니다. 고객을 유치하고 판매를 진행하면 실적이 표시됩니다.'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.agents.map((agent) => (
                    <tr key={agent.profileId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900">
                            {agent.displayName ?? agent.user.mallNickname ?? agent.user.mallUserId ?? '판매원'}
                          </span>
                          <span className="text-xs text-slate-500">
                            코드: {agent.affiliateCode}
                          </span>
                          <span className="text-xs text-slate-400">
                            가입일 {formatDate(agent.joinedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-1">
                          <span>{agent.user.phone ?? '연락처 미등록'}</span>
                          {agent.user.password && (
                            <span className="text-xs font-mono font-semibold text-purple-700">
                              비밀번호: {agent.user.password}
                            </span>
                          )}
                          {agent.user.mallUserId ? (
                            <Link
                              href={`/products/${agent.user.mallUserId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              파트너몰: /products/{agent.user.mallUserId}
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">파트너몰 미발급</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-1">
                          <span>총 {agent.metrics.salesCount.toLocaleString()}건 / {formatCurrency(agent.metrics.totalSalesAmount)}원</span>
                          <span className="text-xs text-slate-500">
                            활성 리드 {agent.metrics.leadsActive.toLocaleString()}건
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-1">
                          <span>확정 {formatCurrency(agent.metrics.settledCommission)}원</span>
                          <span className="text-xs text-slate-500">
                            미정산 {formatCurrency(agent.metrics.pendingCommission)}원 · 오버라이드 {formatCurrency(agent.metrics.overrideCommission)}원
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {agent.metrics.lastSaleAt ? (
                          <div className="flex items-center justify-between gap-2">
                            <span>{formatDate(agent.metrics.lastSaleAt)}</span>
                            <FiChevronRight className="text-slate-400" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">최근 판매 없음</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {isBranchManager ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              판매원 초대는 기존 &quot;어필리에이트 &gt; 팀 관리&quot; 페이지에서 진행할 수 있으며, 초대한 판매원이 승인되면 목록에 자동으로 반영됩니다.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
