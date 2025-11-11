'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronRight,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { showError } from '@/components/ui/Toast';

dayjs.extend(relativeTime);

type ManagerOption = {
  id: number;
  name: string | null;
  affiliateCode: string | null;
};

type AgentMetric = {
  agent: {
    id: number;
    affiliateCode: string;
    displayName: string | null;
    nickname: string | null;
    contactPhone: string | null;
    status: string;
  };
  managerRelations: Array<{
    managerId: number;
    status: string;
    connectedAt: string | null;
    manager: {
      id: number | null;
      name: string | null;
      affiliateCode: string | null;
    };
  }>;
  leads: {
    total: number;
    byStatus: Record<string, number>;
  };
  sales: {
    count: number;
    saleAmount: number | null;
    netRevenue: number | null;
    salesCommission: number | null;
    overrideCommission: number | null;
    branchContribution: number | null;
  };
  ledger: {
    settled: number;
    pending: number;
    salesSettled: number;
    salesPending: number;
    overrideSettled: number;
    overridePending: number;
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
  monthlyTrend: Array<{
    month: string;
    saleCount: number;
    saleAmount: number;
    salesCommission: number;
    overrideCommission: number;
    branchContribution: number;
  }>;
  recentLeads: Array<{
    id: number;
    customerName: string | null;
    customerPhone: string | null;
    status: string;
    createdAt: string;
  }>;
};

type DashboardResponse = {
  ok: boolean;
  agents: AgentMetric[];
  totals: {
    agentCount: number;
    totalLeads: number;
    totalSalesCount: number;
    totalSalesAmount: number;
    totalNetRevenue: number;
    totalSalesCommission: number;
    totalOverrideCommission: number;
    totalBranchContribution: number;
    totalWithholding: number;
    totalSettled: number;
    totalPending: number;
    totalNetCommission: number;
  } | null;
  managers: ManagerOption[];
  filters: {
    from?: string;
    to?: string;
    search?: string;
    managerId?: number;
  };
  months?: string[];
};

type Filters = {
  search: string;
  from: string;
  to: string;
  managerId: string;
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

function formatNumber(value: number | null | undefined) {
  if (!value) return '0';
  return value.toLocaleString('ko-KR');
}

export default function AffiliateAgentDashboardPage() {
  const [filters, setFilters] = useState<Filters>({ search: '', from: '', to: '', managerId: '' });
  const [metrics, setMetrics] = useState<AgentMetric[]>([]);
  const [totals, setTotals] = useState<DashboardResponse['totals']>(null);
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);
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
      const effective = { ...filters, ...(overrideFilters || {}) };
      if (effective.search.trim()) params.set('search', effective.search.trim());
      if (effective.from) params.set('from', effective.from);
      if (effective.to) params.set('to', effective.to);
      if (effective.managerId) params.set('managerId', effective.managerId);

      const res = await fetch(`/api/admin/affiliate/agents/metrics?${params.toString()}`);
      const json: DashboardResponse = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '판매원 데이터를 불러오지 못했습니다.');
      }
      setMetrics(json.agents || []);
      setTotals(json.totals || null);
      setManagerOptions(json.managers || []);
      setFilters((prev) => ({
        ...prev,
        search: json.filters.search ?? '',
        from: json.filters.from ?? '',
        to: json.filters.to ?? '',
        managerId: json.filters.managerId ? String(json.filters.managerId) : '',
      }));
    } catch (error: any) {
      console.error('[AffiliateAgentDashboard] load error', error);
      showError(error.message || '판매원 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadMetrics();
  };

  const handleReset = async () => {
    setFilters({ search: '', from: '', to: '', managerId: '' });
    await loadMetrics({ search: '', from: '', to: '', managerId: '' });
  };

  const toggleAgent = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const overviewCards = useMemo(() => {
    if (!totals) return [];
    const cards = [
      {
        title: '활성 판매원',
        value: `${formatNumber(totals.agentCount)}명`,
        icon: <FiUser className="text-2xl" />,
        description: '판매원 어필리에이트 프로필 수 (필터 반영)',
      },
      {
        title: '총 리드',
        value: `${formatNumber(totals.totalLeads)}건`,
        icon: <FiTrendingUp className="text-2xl" />,
        description: '선택 기간 동안 판매원이 담당한 리드 수',
      },
      {
        title: '총 판매 금액',
        value: formatCurrency(totals.totalSalesAmount),
        icon: <FiDollarSign className="text-2xl" />,
        description: '확정/정산 진행 중인 판매 금액 합계',
      },
      {
        title: '지급완료 / 대기',
        value: `${formatCurrency(totals.totalSettled)} / ${formatCurrency(totals.totalPending)}`,
        icon: <FiDollarSign className="text-2xl" />,
        description: '판매원 수당·오버라이드 정산 현황',
      },
    ];

    cards.push({
      title: '원천징수 합계',
      value: `- ${formatCurrency(totals.totalWithholding)}`,
      icon: <FiDollarSign className="text-2xl" />,
      description: '판매원 수당 및 오버라이드 원천징수 총액',
    });

    cards.push({
      title: '세후 지급 예상',
      value: formatCurrency(totals.totalNetCommission),
      icon: <FiTrendingUp className="text-2xl" />,
      description: '판매원 예상 입금액 (원천징수 차감)',
    });

    return cards;
  }, [totals]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">어필리에이트 판매원 활동·정산 대시보드</h1>
          <p className="mt-1 text-sm text-slate-600">판매원별 리드 진행, 판매 실적, 수당 및 오버라이드 정산 현황을 확인하세요.</p>
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
        <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr_1fr_1fr_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">검색</span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-500">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="판매원 이름, 닉네임, 연락처, 코드"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">대리점장</span>
            <select
              value={filters.managerId}
              onChange={(event) => setFilters((prev) => ({ ...prev, managerId: event.target.value }))}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">전체</option>
              {managerOptions.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name ? `${manager.name}` : `대리점장 #${manager.id}`} {manager.affiliateCode ? `(${manager.affiliateCode})` : ''}
                </option>
              ))}
            </select>
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
              className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-sky-500/90 to-blue-600/80 p-6 text-white shadow-lg"
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
            조건에 맞는 판매원 데이터가 없습니다. 필터를 조정해 주세요.
          </div>
        ) : (
          metrics.map((item) => {
            const agentName = item.agent.displayName || item.agent.nickname || `판매원 #${item.agent.id}`;
            const agentStatus = affiliateStatusLabel[item.agent.status] || item.agent.status;
            const managerBadges = item.managerRelations.length
              ? item.managerRelations.map((relation) => {
                  const managerName =
                    relation.manager?.name ||
                    (relation.managerId ? `대리점장 #${relation.managerId}` : '대리점장 미지정');
                  const managerCode = relation.manager?.affiliateCode ? ` (${relation.manager.affiliateCode})` : '';
                  const relationLabel = relationStatusLabel[relation.status] || relation.status;
                  return (
                    <span
                      key={`${relation.managerId}-${relation.status}`}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-600"
                    >
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        대리점장
                      </span>
                      {managerName}
                      {managerCode} · {relationLabel}
                    </span>
                  );
                })
              : [
                  <span key="hq-affiliation" className="rounded-full bg-red-50 px-3 py-1 text-red-600">
                    본사 직속
                  </span>,
                ];
            return (
              <article key={item.agent.id} className="rounded-3xl bg-white/90 p-6 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">{agentName}</h2>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        판매원
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">코드 {item.agent.affiliateCode}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">{agentStatus}</span>
                      {item.agent.contactPhone && <span>{item.agent.contactPhone}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {managerBadges}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAgent(item.agent.id)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {expanded[item.agent.id] ? <FiChevronDown /> : <FiChevronRight />} 상세 보기
                  </button>
                </header>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">리드 진행</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatNumber(item.leads.total)}건</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      {Object.entries(item.leads.byStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between">
                          <span>{LEAD_STATUS_LABELS[status] || status}</span>
                          <span className="font-semibold">{formatNumber(count)}건</span>
                        </div>
                      ))}
                      {Object.keys(item.leads.byStatus).length === 0 && <p className="text-slate-400">집계된 리드가 없습니다.</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">판매 실적</p>
                    <div className="mt-2 text-xl font-bold text-slate-900">{formatNumber(item.sales.count)}건</div>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between"><span>판매 금액</span><span className="font-semibold">{formatCurrency(item.sales.saleAmount)}</span></div>
                      <div className="flex justify-between"><span>순이익</span><span className="font-semibold">{formatCurrency(item.sales.netRevenue)}</span></div>
                      <div className="flex justify-between"><span>브랜치 기여</span><span className="font-semibold">{formatCurrency(item.sales.branchContribution)}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">수당·오버라이드 예정</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between"><span>판매원 수당</span><span className="font-semibold">{formatCurrency(item.sales.salesCommission)}</span></div>
                      <div className="flex justify-between"><span>오버라이드 (지급 예정)</span><span className="font-semibold">{formatCurrency(item.sales.overrideCommission)}</span></div>
                      <div className="flex justify-between text-red-500"><span>원천징수</span><span className="font-semibold">- {formatCurrency(item.ledger.totalWithholding)}</span></div>
                      <div className="mt-2 border-t border-slate-200 pt-2 text-emerald-600">
                        <div className="flex justify-between font-semibold">
                          <span>세후 예상지급</span>
                          <span>{formatCurrency(item.ledger.netCommission)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {expanded[item.agent.id] && (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-900">정산 진행 상황</h3>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                          <div className="flex justify-between"><span>지급완료 합계</span><span className="font-semibold text-emerald-600">{formatCurrency(item.ledger.settled)}</span></div>
                          <div className="flex justify-between"><span>지급대기 합계</span><span className="font-semibold text-amber-600">{formatCurrency(item.ledger.pending)}</span></div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>판매원 수당 (완료 / 대기)</span>
                            <span className="font-semibold">{formatCurrency(item.ledger.salesSettled)} / {formatCurrency(item.ledger.salesPending)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>오버라이드 (완료 / 대기)</span>
                            <span className="font-semibold">{formatCurrency(item.ledger.overrideSettled)} / {formatCurrency(item.ledger.overridePending)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                        <span>원천징수 합계</span>
                        <span className="font-semibold">- {formatCurrency(item.ledger.totalWithholding)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>원천징수 조정</span>
                            <span className="font-semibold">{formatCurrency(item.ledger.withholdingAdjustments)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>원천징수 (완료 / 대기)</span>
                            <span className="font-semibold">{formatCurrency(item.ledger.withholdingSettled)} / {formatCurrency(item.ledger.withholdingPending)}</span>
                          </div>
                      <div className="flex justify-between text-xs font-semibold text-emerald-600">
                        <span>세후 예상지급</span>
                        <span>{formatCurrency(item.ledger.netCommission)}</span>
                      </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-900">팀 기여도</h3>
                        {item.managerRelations.length === 0 ? (
                          <p className="mt-3 text-sm text-slate-500">연결된 대리점장이 없습니다.</p>
                        ) : (
                          <ul className="mt-3 space-y-3 text-sm text-slate-600">
                            {item.managerRelations.map((relation) => (
                              <li key={`${relation.managerId}-${relation.status}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2 font-semibold text-slate-900">
                                  {relation.manager?.name || `대리점장 #${relation.managerId}`}
                                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                                    대리점장
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">코드 {relation.manager?.affiliateCode ?? '-'}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  상태: {relationStatusLabel[relation.status] || relation.status} · 연결 {relation.connectedAt ? dayjs(relation.connectedAt).fromNow() : '정보 없음'}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
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
                              <th className="px-4 py-2 text-right font-semibold">브랜치 기여</th>
                              <th className="px-4 py-2 text-right font-semibold">판매원 수당</th>
                              <th className="px-4 py-2 text-right font-semibold">오버라이드</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.monthlyTrend.map((trend) => (
                              <tr key={`${item.agent.id}-${trend.month}`} className="odd:bg-white even:bg-slate-50">
                                <td className="px-4 py-2 font-semibold text-slate-700">{trend.month}</td>
                                <td className="px-4 py-2 text-right">{trend.saleCount.toLocaleString('ko-KR')}건</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.saleAmount)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.branchContribution)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.salesCommission)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(trend.overrideCommission)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <h3 className="text-lg font-semibold text-slate-900">최근 리드</h3>
                      {item.recentLeads.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">최근 등록된 리드가 없습니다.</p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-sm text-slate-600">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-2 text-left font-semibold">고객</th>
                                <th className="px-4 py-2 text-left font-semibold">연락처</th>
                                <th className="px-4 py-2 text-left font-semibold">상태</th>
                                <th className="px-4 py-2 text-left font-semibold">등록일</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.recentLeads.map((lead) => (
                                <tr key={lead.id} className="odd:bg-white even:bg-slate-50">
                                  <td className="px-4 py-2 font-semibold text-slate-700">{lead.customerName || '이름 미상'}</td>
                                  <td className="px-4 py-2 text-slate-600">{lead.customerPhone || '-'}</td>
                                  <td className="px-4 py-2 text-slate-600">{LEAD_STATUS_LABELS[lead.status] || lead.status}</td>
                                  <td className="px-4 py-2 text-slate-500">{dayjs(lead.createdAt).fromNow()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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

