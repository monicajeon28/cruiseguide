'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { showError } from '@/components/ui/Toast';

dayjs.extend(relativeTime);

type ManagerMetric = {
  manager: {
    id: number;
    affiliateCode: string;
    displayName: string | null;
    nickname: string | null;
    branchLabel: string | null;
    contactPhone: string | null;
    status: string;
  };
  agentCount: number;
  leads: {
    total: number;
    byStatus: Record<string, number>;
  };
  sales: {
    count: number;
    saleAmount: number;
    netRevenue: number | null;
    branchCommission: number | null;
    overrideCommission: number | null;
    salesCommission: number | null;
  };
  ledger: {
    branchSettled: number;
    branchPending: number;
    overrideSettled: number;
    overridePending: number;
    withholding: number;
    withholdingAdjustments: number;
    withholdingSettled: number;
    withholdingPending: number;
    branchWithholding: number;
    overrideWithholding: number;
    totalWithholding: number;
    grossCommission: number;
    netCommission: number;
  };
  agents: AgentMetric[];
  monthlyTrend: {
    month: string;
    saleCount: number;
    saleAmount: number;
    branchCommission: number;
    overrideCommission: number;
    salesCommission: number;
  }[];
};

type AgentMetric = {
  agent: {
    id: number;
    affiliateCode: string;
    displayName: string | null;
    nickname: string | null;
    contactPhone: string | null;
    status: string;
  } | null;
  relation: {
    status: string;
    connectedAt: string | null;
  };
  leads: {
    total: number;
    byStatus: Record<string, number>;
  };
  sales: {
    count: number;
    saleAmount: number;
    netRevenue: number | null;
    salesCommission: number | null;
    overrideCommission: number | null;
    branchContribution: number | null;
  };
  ledger: {
    settled: number;
    pending: number;
    withholding: number;
    withholdingAdjustments: number;
    withholdingSettled: number;
    withholdingPending: number;
    salesWithholding: number;
    overrideWithholding: number;
    totalWithholding: number;
    grossCommission: number;
    netCommission: number;
  };
};

type DashboardResponse = {
  ok: boolean;
  managers: ManagerMetric[];
  totals: {
    managerCount: number;
    agentCount: number;
    totalSalesCount: number;
    totalSalesAmount: number;
    totalNetRevenue: number;
    totalBranchCommission: number;
    totalOverrideCommission: number;
    totalSalesCommission: number;
    totalLeads: number;
    totalWithholding: number;
    totalNetCommission: number;
    hq?: {
      grossRevenue: number;
      cardFees: number;
      corporateTax: number;
      netAfterFees: number;
    };
  } | null;
  filters: {
    from?: string;
    to?: string;
    search?: string;
  };
};

type Filters = {
  search: string;
  from: string;
  to: string;
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: '신규',
  CONTACTED: '연락완료',
  IN_PROGRESS: '진행중',
  PURCHASED: '구매완료',
  REFUNDED: '환불',
  CLOSED: '종료',
  TEST_GUIDE: '테스트',
};

const affiliateStatusLabel: Record<string, string> = {
  DRAFT: '작성중',
  AWAITING_APPROVAL: '승인 대기',
  ACTIVE: '활성',
  SUSPENDED: '중지',
  TERMINATED: '종료',
};

const relationStatusLabel: Record<string, string> = {
  ACTIVE: '활성',
  PAUSED: '일시중지',
  TERMINATED: '종료',
};

function formatCurrency(value: number | null | undefined) {
  if (!value) return '₩0';
  return `₩${value.toLocaleString('ko-KR')}`;
}

export default function AffiliateTeamDashboardPage() {
  const [filters, setFilters] = useState<Filters>({ search: '', from: '', to: '' });
  const [metrics, setMetrics] = useState<ManagerMetric[]>([]);
  const [totals, setTotals] = useState<DashboardResponse['totals']>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMetrics = async (overrideFilters?: Partial<Filters>) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const effectiveFilters = { ...filters, ...(overrideFilters || {}) };
      if (effectiveFilters.search.trim()) params.set('search', effectiveFilters.search.trim());
      if (effectiveFilters.from) params.set('from', effectiveFilters.from);
      if (effectiveFilters.to) params.set('to', effectiveFilters.to);

      const res = await fetch(`/api/admin/affiliate/teams/metrics?${params.toString()}`);
      const json: DashboardResponse = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '팀 성과 데이터를 불러오지 못했습니다.');
      }
      setMetrics(json.managers || []);
      setTotals(json.totals || null);
      setFilters((prev) => ({
        ...prev,
        search: json.filters.search ?? '',
        from: json.filters.from ?? '',
        to: json.filters.to ?? '',
      }));
    } catch (error: any) {
      console.error('[AffiliateTeamDashboard] load error', error);
      showError(error.message || '팀 성과 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadMetrics();
  };

  const handleReset = async () => {
    setFilters({ search: '', from: '', to: '' });
    await loadMetrics({ search: '', from: '', to: '' });
  };

  const toggleManager = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const overviewCards = useMemo(() => {
    if (!totals) return [];
    const cards = [
      {
        title: '활성 대리점장',
        value: `${totals.managerCount.toLocaleString('ko-KR')}명`,
        icon: <FiUsers className="text-2xl" />,
        description: '대리점장 어필리에이트 프로필 수',
      },
      {
        title: '팀 판매 건수',
        value: `${totals.totalSalesCount.toLocaleString('ko-KR')}건`,
        icon: <FiTrendingUp className="text-2xl" />,
        description: '승인/지급 대기 중인 판매 건수',
      },
      {
        title: '판매 총액',
        value: formatCurrency(totals.totalSalesAmount),
        icon: <FiDollarSign className="text-2xl" />,
        description: '해당 기간 내 팀 전체 판매 금액 합계',
      },
      {
        title: '세전 커미션 합계',
        value: formatCurrency((totals.totalBranchCommission ?? 0) + (totals.totalOverrideCommission ?? 0)),
        icon: <FiDollarSign className="text-2xl" />,
        description: '브랜치 + 오버라이드 커미션 총액',
      },
    ];

    cards.push({
      title: '원천징수 예정',
      value: `- ${formatCurrency(totals.totalWithholding)}`,
      icon: <FiDollarSign className="text-2xl" />,
      description: '브랜치/오버라이드 원천징수 합계',
    });

    cards.push({
      title: '세후 지급 예상',
      value: formatCurrency(totals.totalNetCommission),
      icon: <FiTrendingUp className="text-2xl" />,
      description: '대리점장 예상 입금액 (세후)',
    });

    if (totals.hq) {
      cards.push({
        title: '본사 순이익 (세후)',
        value: formatCurrency(totals.hq.netAfterFees),
        icon: <FiDollarSign className="text-2xl" />,
        description: `법인세 ${formatCurrency(totals.hq.corporateTax)}·카드 수수료 ${formatCurrency(totals.hq.cardFees)} 반영`,
      });
    }

    return cards;
  }, [totals]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">어필리에이트 팀 성과 대시보드</h1>
          <p className="mt-1 text-sm text-slate-600">대리점장별 판매/리드/커미션 현황과 판매원 실적을 한눈에 확인할 수 있습니다.</p>
        </div>
        <button
          type="button"
          onClick={() => loadMetrics()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> 새로고침
        </button>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">검색</span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-500">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="지점명, 코드, 연락처 검색"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">시작일</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">종료일</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              적용
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              disabled={loading}
            >
              초기화
            </button>
          </div>
        </div>
      </form>

      {totals && overviewCards.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <article
              key={card.title}
              className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-indigo-500/90 to-blue-500/80 p-6 text-white shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">{card.title}</h3>
                  <p className="mt-2 text-2xl font-bold">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3 text-white">{card.icon}</div>
              </div>
              <p className="mt-4 text-xs text-white/70">{card.description}</p>
            </article>
          ))}
        </section>
      )}

      <section className="space-y-6">
        {loading && metrics.length === 0 ? (
          <div className="rounded-3xl bg-white/80 p-10 text-center text-slate-500 shadow-sm">데이터를 불러오는 중입니다...</div>
        ) : metrics.length === 0 ? (
          <div className="rounded-3xl bg-white/80 p-10 text-center text-slate-500 shadow-sm">
            조건에 맞는 대리점장 데이터가 없습니다. 필터를 조정해 주세요.
          </div>
        ) : (
          metrics.map((item) => {
            const managerName = item.manager.displayName || item.manager.nickname || `대리점장 #${item.manager.id}`;
            const branchLabel = item.manager.branchLabel ? `(${item.manager.branchLabel})` : '';
            const managerStatus = affiliateStatusLabel[item.manager.status] || item.manager.status;
            return (
              <article key={item.manager.id} className="rounded-3xl bg-white/90 p-6 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {managerName} {branchLabel && <span className="text-sm text-slate-500">{branchLabel}</span>}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">코드 {item.manager.affiliateCode}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">{managerStatus}</span>
                      <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-600">본사 직속</span>
                      {item.manager.contactPhone && <span>{item.manager.contactPhone}</span>}
                      <span className="text-slate-400">판매원 {item.agentCount.toLocaleString('ko-KR')}명</span>
                      <span className="text-slate-400">리드 {item.leads.total.toLocaleString('ko-KR')}건</span>
                      <span className="text-slate-400">판매 {item.sales.count.toLocaleString('ko-KR')}건</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleManager(item.manager.id)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {expanded[item.manager.id] ? <FiChevronDown /> : <FiChevronRight />} 팀 상세 보기
                  </button>
                </header>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">리드 현황</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{item.leads.total.toLocaleString('ko-KR')}건</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      {Object.entries(item.leads.byStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between">
                          <span>{LEAD_STATUS_LABELS[status] || status}</span>
                          <span className="font-semibold">{count.toLocaleString('ko-KR')}건</span>
                        </div>
                      ))}
                      {Object.keys(item.leads.byStatus).length === 0 && <p className="text-slate-400">집계된 리드가 없습니다.</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">판매 요약</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{item.sales.count.toLocaleString('ko-KR')}건</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between"><span>판매 금액</span><span className="font-semibold">{formatCurrency(item.sales.saleAmount)}</span></div>
                      <div className="flex justify-between"><span>순이익</span><span className="font-semibold">{formatCurrency(item.sales.netRevenue)}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">커미션 예정</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between"><span>브랜치</span><span className="font-semibold">{formatCurrency(item.sales.branchCommission)}</span></div>
                      <div className="flex justify-between"><span>오버라이드</span><span className="font-semibold">{formatCurrency(item.sales.overrideCommission)}</span></div>
                      <div className="flex justify-between"><span>판매원 수당</span><span className="font-semibold">{formatCurrency(item.sales.salesCommission)}</span></div>
                      <div className="flex justify-between text-red-500"><span>원천징수</span><span className="font-semibold">- {formatCurrency(item.ledger.totalWithholding)}</span></div>
                      <div className="mt-2 border-t border-slate-200 pt-2 text-emerald-600">
                        <div className="flex justify-between font-semibold">
                          <span>세후 예상지급</span>
                          <span>{formatCurrency(item.ledger.netCommission)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">정산 현황</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between"><span>브랜치 (지급완료)</span><span className="font-semibold">{formatCurrency(item.ledger.branchSettled)}</span></div>
                      <div className="flex justify-between"><span>브랜치 (지급대기)</span><span className="font-semibold">{formatCurrency(item.ledger.branchPending)}</span></div>
                      <div className="flex justify-between"><span>오버라이드 (지급완료)</span><span className="font-semibold">{formatCurrency(item.ledger.overrideSettled)}</span></div>
                      <div className="flex justify-between"><span>오버라이드 (지급대기)</span><span className="font-semibold">{formatCurrency(item.ledger.overridePending)}</span></div>
                      <div className="flex justify-between"><span>원천징수 조정</span><span className="font-semibold">{formatCurrency(item.ledger.withholdingAdjustments)}</span></div>
                      <div className="flex justify-between"><span>원천징수 (지급완료)</span><span className="font-semibold">{formatCurrency(item.ledger.withholdingSettled)}</span></div>
                      <div className="flex justify-between"><span>원천징수 (지급대기)</span><span className="font-semibold">{formatCurrency(item.ledger.withholdingPending)}</span></div>
                    </div>
                  </div>
                </div>

                {expanded[item.manager.id] && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <h3 className="text-lg font-semibold text-slate-900">팀 판매원 현황</h3>
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">판매원</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">연결 상태</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">리드</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">판매</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">판매금액</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">판매원 수당</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">오버라이드</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-600">정산(지급완료/대기)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {item.agents.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                                  연결된 판매원이 없습니다.
                                </td>
                              </tr>
                            ) : (
                              item.agents.map((agentItem) => {
                                const agentName = agentItem.agent?.displayName || agentItem.agent?.nickname || `판매원 #${agentItem.agent?.id ?? 'N/A'}`;
                                const relationLabel = relationStatusLabel[agentItem.relation.status] || agentItem.relation.status;
                                const managerLabel = item.manager.displayName || item.manager.nickname || `대리점장 #${item.manager.id}`;
                                return (
                                  <tr key={`${agentItem.agent?.id ?? 'none'}-${agentItem.relation.connectedAt ?? 'rel'}`} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-900">{agentName}</div>
                                      <div className="text-xs text-slate-500">코드 {agentItem.agent?.affiliateCode ?? '-'}</div>
                                      {agentItem.agent?.contactPhone && <div className="text-xs text-slate-500">{agentItem.agent.contactPhone}</div>}
                                      <div className="text-[11px] text-slate-400">소속 대리점장: {managerLabel}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600">
                                      <div className="font-semibold text-slate-700">{relationLabel}</div>
                                      <div>{agentItem.relation.connectedAt ? dayjs(agentItem.relation.connectedAt).fromNow() : '-'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">
                                      <div className="font-semibold">{agentItem.leads.total.toLocaleString('ko-KR')}건</div>
                                      <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-500">
                                        {Object.entries(agentItem.leads.byStatus).map(([status, count]) => (
                                          <span key={status} className="rounded-full bg-slate-100 px-2 py-0.5">
                                            {LEAD_STATUS_LABELS[status] || status} {count}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">{agentItem.sales.count.toLocaleString('ko-KR')}건</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">{formatCurrency(agentItem.sales.saleAmount)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatCurrency(agentItem.sales.salesCommission)}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatCurrency(agentItem.sales.overrideCommission)}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600">
                                      <div>완료 {formatCurrency(agentItem.ledger.settled)}</div>
                                      <div>대기 {formatCurrency(agentItem.ledger.pending)}</div>
                                      <div className="pt-1 text-[11px] text-slate-500">원천징수 {formatCurrency(agentItem.ledger.totalWithholding)}</div>
                                      <div className="text-[11px] text-slate-500">조정 {formatCurrency(agentItem.ledger.withholdingAdjustments)}</div>
                                      <div className="pt-1 text-[11px] font-semibold text-emerald-600">
                                        세후 {formatCurrency(agentItem.ledger.netCommission)}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <h3 className="text-lg font-semibold text-slate-900">최근 6개월 추세</h3>
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-sm text-slate-600">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold">월</th>
                              <th className="px-4 py-2 text-right font-semibold">판매 건수</th>
                              <th className="px-4 py-2 text-right font-semibold">판매 금액</th>
                              <th className="px-4 py-2 text-right font-semibold">지점 수당</th>
                              <th className="px-4 py-2 text-right font-semibold">오버라이드</th>
                              <th className="px-4 py-2 text-right font-semibold">판매원 수당</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.monthlyTrend.map((trend) => (
                              <tr key={`${item.manager.id}-${trend.month}`} className="odd:bg-white even:bg-slate-50">
                                <td className="px-4 py-2 font-semibold text-slate-700">{trend.month}</td>
                                <td className="px-4 py-2 text-right">{trend.saleCount.toLocaleString('ko-KR')}건</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.saleAmount)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.branchCommission)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.overrideCommission)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.salesCommission)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}