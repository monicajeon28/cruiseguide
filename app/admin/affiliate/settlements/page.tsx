'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  FiCalendar,
  FiDownload,
  FiDollarSign,
  FiRefreshCw,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import dayjs from 'dayjs';
import { showError } from '@/components/ui/Toast';

type SettlementTotals = {
  saleCount: number;
  headcount: number;
  saleAmount: number;
  costAmount: number;
  netRevenue: number;
  hq: {
    ledgerNet: number;
    cardFees: number;
    corporateTax: number;
    netAfterFees: number;
  };
  branch: {
    branchGross: number;
    branchWithholding: number;
    overrideGross: number;
    overrideWithholding: number;
    net: number;
  };
  agent: {
    gross: number;
    withholding: number;
    net: number;
  };
};

type SettlementManagerSummary = {
  manager: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
    branchLabel: string | null;
    nickname: string | null;
  };
  sales: {
    count: number;
    headcount: number;
    saleAmount: number;
    netRevenue: number;
  };
  branchCommission: {
    gross: number;
    withholding: number;
    net: number;
  };
  overrideCommission: {
    gross: number;
    withholding: number;
    net: number;
  };
  totalCommission: {
    gross: number;
    withholding: number;
    net: number;
  };
};

type SettlementAgentSummary = {
  agent: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
    nickname: string | null;
  };
  manager: {
    id: number;
    displayName: string | null;
    affiliateCode: string | null;
  } | null;
  sales: {
    count: number;
    headcount: number;
    saleAmount: number;
    netRevenue: number;
  };
  commission: {
    gross: number;
    withholding: number;
    net: number;
  };
};

type SettlementSaleDetail = {
  saleId: number;
  saleDate: string | null;
  product: { code: string | null; title: string | null };
  headcount: number;
  amounts: {
    sale: number;
    netRevenue: number;
    hqNet: number;
  };
  manager: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
    branchLabel: string | null;
  } | null;
  agent: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
  } | null;
  commissions: {
    branch: { gross: number; withholding: number; net: number };
    override: { gross: number; withholding: number; net: number };
    agent: { gross: number; withholding: number; net: number };
  };
};

type SettlementComparisons = {
  totals: {
    saleAmount: number;
    netRevenue: number;
    branchCommission: number;
    overrideCommission: number;
    managerWithholding: number;
    managerNet: number;
    salesCommission: number;
    agentWithholding: number;
    agentNet: number;
  };
  metadata?: {
    generatedAt?: string;
    source?: string;
  };
};

type SettlementApiResponse = {
  ok: boolean;
  message?: string;
  period: {
    label: string;
    start: string;
    end: string;
  };
  totals: SettlementTotals;
  managers: SettlementManagerSummary[];
  agents: SettlementAgentSummary[];
  sales: SettlementSaleDetail[];
  availablePeriods: string[];
  comparisons?: SettlementComparisons;
};

type TeamMetricsTotals = {
  managerCount: number;
  agentCount: number;
  totalSalesCount: number;
  totalSalesAmount: number;
  totalNetRevenue: number;
  totalBranchCommission: number;
  totalOverrideCommission: number;
  totalSalesCommission: number;
  totalWithholding: number;
  totalNetCommission: number;
  totalLeads: number;
  hq?: {
    grossRevenue: number;
    cardFees: number;
    corporateTax: number;
    netAfterFees: number;
  } | null;
};

type TeamMetricsResponse = {
  ok: boolean;
  totals: TeamMetricsTotals | null;
  message?: string;
};

type AgentMetricsTotals = {
  agentCount: number;
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
  totalLeads: number;
};

type AgentMetricsResponse = {
  ok: boolean;
  totals: AgentMetricsTotals | null;
  message?: string;
};

const currency = (value: number | null | undefined) => {
  const safe = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return `₩${safe.toLocaleString('ko-KR')}`;
};

const formatCount = (value: number | null | undefined) => {
  const safe = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return safe.toLocaleString('ko-KR');
};

const labelForPeriod = (period: string) => {
  if (!period) return '선택 안됨';
  const parsed = dayjs(`${period}-01`);
  if (!parsed.isValid()) return period;
  return parsed.format('YYYY년 MM월');
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '-';
  return parsed.format('YYYY.MM.DD');
};

const categories = [
  { key: 'overview', label: '요약', icon: '📊', description: '정산 요약과 비교 결과를 확인하세요.' },
  { key: 'managers', label: '대리점장', icon: '🏢', description: '대리점장별 매출과 커미션 내역' },
  { key: 'agents', label: '판매원', icon: '🧑‍💼', description: '판매원별 실적과 세후 커미션' },
  { key: 'sales', label: '판매 상세', icon: '🧾', description: '정산 기간 내 판매 상세 기록' },
] as const;

type CategoryKey = (typeof categories)[number]['key'];

type ComparisonFormat = 'currency' | 'count';

type ComparisonRowData = {
  key: string;
  label: string;
  settlement: number;
  dashboard: number | null;
  format: ComparisonFormat;
  tolerance?: number;
};

type ComparisonTableProps = {
  title: string;
  rows: ComparisonRowData[];
  loading: boolean;
};

export default function AffiliateSettlementDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [data, setData] = useState<SettlementApiResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('overview');
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [teamTotals, setTeamTotals] = useState<TeamMetricsTotals | null>(null);
  const [agentTotals, setAgentTotals] = useState<AgentMetricsTotals | null>(null);

  const loadComparisons = useCallback(
    async (start: string, end: string) => {
      if (!start || !end) return;
      const startDate = dayjs(start);
      const endDate = dayjs(end);
      if (!startDate.isValid() || !endDate.isValid()) {
        setComparisonError('정산 기간을 파싱할 수 없습니다.');
        setTeamTotals(null);
        setAgentTotals(null);
        return;
      }

      try {
        setComparisonLoading(true);
        setComparisonError(null);

        const params = new URLSearchParams();
        params.set('from', startDate.format('YYYY-MM-DD'));
        params.set('to', endDate.format('YYYY-MM-DD'));

        const [teamRes, agentRes] = await Promise.all([
          fetch(`/api/admin/affiliate/teams/metrics?${params.toString()}`, {
            cache: 'no-store',
          }),
          fetch(`/api/admin/affiliate/agents/metrics?${params.toString()}`, {
            cache: 'no-store',
          }),
        ]);

        const [teamJson, agentJson]: [TeamMetricsResponse, AgentMetricsResponse] = await Promise.all([
          teamRes.json(),
          agentRes.json(),
        ]);

        if (!teamRes.ok || !teamJson?.ok) {
          throw new Error(teamJson?.message || '팀 대시보드 데이터를 불러오지 못했습니다.');
        }

        if (!agentRes.ok || !agentJson?.ok) {
          throw new Error(agentJson?.message || '판매원 대시보드 데이터를 불러오지 못했습니다.');
        }

        setTeamTotals(teamJson.totals ?? null);
        setAgentTotals(agentJson.totals ?? null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '대시보드 비교 데이터를 불러오지 못했습니다.';
        setComparisonError(message);
        setTeamTotals(null);
        setAgentTotals(null);
      } finally {
        setComparisonLoading(false);
      }
    },
    [],
  );

  const loadData = useCallback(
    async (period?: string) => {
      try {
        setLoading(true);
        setComparisonError(null);

        const params = new URLSearchParams();
        if (period) params.set('period', period);
        const query = params.toString();

        const res = await fetch(`/api/admin/affiliate/settlements${query ? `?${query}` : ''}`, {
          cache: 'no-store',
        });
        const json: SettlementApiResponse = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || '정산 데이터를 불러오지 못했습니다.');
        }

        setData(json);
        setAvailablePeriods(json.availablePeriods || []);
        setSelectedPeriod(json.period?.label || period || '');

        if (json.period?.start && json.period?.end) {
          void loadComparisons(json.period.start, json.period.end);
        } else {
          setTeamTotals(null);
          setAgentTotals(null);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '정산 데이터를 불러오지 못했습니다.';
        setData(null);
        setTeamTotals(null);
        setAgentTotals(null);
        setComparisonError(message);
        showError(message);
      } finally {
        setLoading(false);
      }
    },
    [loadComparisons],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const periodOptions = useMemo(() => {
    const options = availablePeriods.slice();
    if (selectedPeriod && !options.includes(selectedPeriod)) {
      options.unshift(selectedPeriod);
    }
    return options;
  }, [availablePeriods, selectedPeriod]);

  const totals = data?.totals;

  const managerWithholdingTotal = useMemo(() => {
    if (!totals) return 0;
    return (totals.branch.branchWithholding ?? 0) + (totals.branch.overrideWithholding ?? 0);
  }, [totals]);

  const settlementComparisonTotals = useMemo(() => {
    if (!data?.totals) return null;
    if (data.comparisons?.totals) return data.comparisons.totals;
    const base = data.totals;
    return {
      saleAmount: base.saleAmount ?? 0,
      netRevenue: base.netRevenue ?? 0,
      branchCommission: base.branch.branchGross ?? 0,
      overrideCommission: base.branch.overrideGross ?? 0,
      managerWithholding: (base.branch.branchWithholding ?? 0) + (base.branch.overrideWithholding ?? 0),
      managerNet: base.branch.net ?? 0,
      salesCommission: base.agent.gross ?? 0,
      agentWithholding: base.agent.withholding ?? 0,
      agentNet: base.agent.net ?? 0,
    };
  }, [data]);

  const activeCategoryConfig = useMemo(
    () => categories.find((category) => category.key === activeCategory) ?? categories[0],
    [activeCategory],
  );

  const teamComparisonRows: ComparisonRowData[] = totals
    ? [
        {
          key: 'saleCount',
          label: '판매 건수',
          settlement: totals.saleCount ?? 0,
          dashboard: teamTotals?.totalSalesCount ?? null,
          format: 'count',
          tolerance: 0,
        },
        {
          key: 'saleAmount',
          label: '총 매출',
          settlement: settlementComparisonTotals?.saleAmount ?? totals.saleAmount ?? 0,
          dashboard: teamTotals?.totalSalesAmount ?? null,
          format: 'currency',
        },
        {
          key: 'netRevenue',
          label: '총 순이익',
          settlement: settlementComparisonTotals?.netRevenue ?? totals.netRevenue ?? 0,
          dashboard: teamTotals?.totalNetRevenue ?? null,
          format: 'currency',
        },
        {
          key: 'branchCommission',
          label: '브랜치 커미션',
          settlement: settlementComparisonTotals?.branchCommission ?? totals.branch.branchGross ?? 0,
          dashboard: teamTotals?.totalBranchCommission ?? null,
          format: 'currency',
        },
        {
          key: 'overrideCommission',
          label: '오버라이드',
          settlement: settlementComparisonTotals?.overrideCommission ?? totals.branch.overrideGross ?? 0,
          dashboard: teamTotals?.totalOverrideCommission ?? null,
          format: 'currency',
        },
        {
          key: 'managerWithholding',
          label: '대리점장 원천징수',
          settlement: settlementComparisonTotals?.managerWithholding ?? managerWithholdingTotal,
          dashboard: teamTotals?.totalWithholding ?? null,
          format: 'currency',
        },
        {
          key: 'managerNet',
          label: '대리점장 세후 커미션',
          settlement: settlementComparisonTotals?.managerNet ?? totals.branch.net ?? 0,
          dashboard: teamTotals?.totalNetCommission ?? null,
          format: 'currency',
        },
      ]
    : [];

  const agentComparisonRows: ComparisonRowData[] = totals
    ? [
        {
          key: 'agentSaleCount',
          label: '판매원 매출 건수',
          settlement: totals.saleCount ?? 0,
          dashboard: agentTotals?.totalSalesCount ?? null,
          format: 'count',
          tolerance: 0,
        },
        {
          key: 'agentSalesCommission',
          label: '판매원 매출 커미션',
          settlement: settlementComparisonTotals?.salesCommission ?? totals.agent.gross ?? 0,
          dashboard: agentTotals?.totalSalesCommission ?? null,
          format: 'currency',
        },
        {
          key: 'agentWithholding',
          label: '판매원 원천징수',
          settlement: settlementComparisonTotals?.agentWithholding ?? totals.agent.withholding ?? 0,
          dashboard: agentTotals?.totalWithholding ?? null,
          format: 'currency',
        },
        {
          key: 'agentNet',
          label: '판매원 세후 커미션',
          settlement: settlementComparisonTotals?.agentNet ?? totals.agent.net ?? 0,
          dashboard: agentTotals?.totalNetCommission ?? null,
          format: 'currency',
        },
      ]
    : [];

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedPeriod(value);
    setActiveCategory('overview');
    loadData(value || undefined);
  };

  const handleRefresh = () => {
    loadData(selectedPeriod || undefined);
  };

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (selectedPeriod) params.set('period', selectedPeriod);
    params.set('format', 'csv');
    const url = `/api/admin/affiliate/settlements?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결산 대시보드</h1>
          <p className="text-sm text-gray-500">HQ · 대리점장 · 판매원 월별 정산 현황을 한눈에 확인하세요.</p>
          {data?.period ? (
            <p className="mt-1 text-xs text-gray-400">
              정산 기간: {formatDate(data.period.start)} ~ {formatDate(data.period.end)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
            <FiCalendar className="h-4 w-4 text-gray-500" />
            <select
              className="min-w-[140px] border-none bg-transparent text-sm focus:outline-none"
              value={selectedPeriod}
              onChange={handlePeriodChange}
              disabled={loading}
            >
              <option value="">현재 월</option>
              {periodOptions.map((period) => (
                <option key={period} value={period}>
                  {labelForPeriod(period)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
          >
            <FiDownload className="h-4 w-4" />
            CSV 다운로드
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => {
            const isActive = category.key === activeCategory;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveCategory(category.key)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-base">{category.icon}</span>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500">{activeCategoryConfig.description}</p>
      </div>

      {totals ? (
        <>
          {activeCategory === 'overview' ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon={<FiTrendingUp className="h-8 w-8 text-indigo-500" />}
                  title="총 매출"
                  value={currency(totals.saleAmount)}
                  subtitle={`${formatCount(totals.saleCount)}건 · ${formatCount(totals.headcount)}명`}
                />
                <SummaryCard
                  icon={<FiDollarSign className="h-8 w-8 text-emerald-500" />}
                  title="HQ 세후 순익"
                  value={currency(totals.hq.netAfterFees)}
                  subtitle={`법인세 ${currency(totals.hq.corporateTax)} · 카드수수료 ${currency(totals.hq.cardFees)}`}
                />
                <SummaryCard
                  icon={<FiUsers className="h-8 w-8 text-purple-500" />}
                  title="대리점장 순커미션"
                  value={currency(totals.branch.net)}
                  subtitle={`원천징수 ${currency(managerWithholdingTotal)}`}
                />
                <SummaryCard
                  icon={<FiUserCheck className="h-8 w-8 text-orange-500" />}
                  title="판매원 순커미션"
                  value={currency(totals.agent.net)}
                  subtitle={`원천징수 ${currency(totals.agent.withholding)}`}
                />
              </div>

              <section className="space-y-4">
                <header className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">대시보드 수치 비교</h2>
                  {comparisonLoading ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                      <FiRefreshCw className="h-3 w-3 animate-spin" />
                      대시보드 데이터 동기화 중
                    </span>
                  ) : null}
                </header>
                {comparisonError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {comparisonError}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ComparisonTable title="팀 퍼포먼스 대시보드" rows={teamComparisonRows} loading={comparisonLoading} />
                    <ComparisonTable title="판매원 대시보드" rows={agentComparisonRows} loading={comparisonLoading} />
                  </div>
                )}
                {data?.comparisons?.metadata?.generatedAt ? (
                  <p className="text-xs text-gray-400">
                    비교 기준 시각: {dayjs(data.comparisons.metadata.generatedAt).format('YYYY.MM.DD HH:mm:ss')}
                  </p>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeCategory === 'managers' ? (
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">대리점장 결산</h2>
                <p className="text-sm text-gray-500">
                  총 {formatCount(data?.managers?.length || 0)}명 · 커미션 {currency((totals.branch.branchGross ?? 0) + (totals.branch.overrideGross ?? 0))}
                </p>
              </header>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                {data?.managers?.length ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">대리점장</th>
                        <th className="px-4 py-3">판매 현황</th>
                        <th className="px-4 py-3">브랜치 커미션</th>
                        <th className="px-4 py-3">오버라이드</th>
                        <th className="px-4 py-3">총 커미션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.managers.map((item) => (
                        <tr key={item.manager.id}>
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-900">
                              {item.manager.displayName || item.manager.nickname || '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.manager.affiliateCode || '-'}
                              {item.manager.branchLabel ? ` · ${item.manager.branchLabel}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            <div>매출 {currency(item.sales.saleAmount)}</div>
                            <div>순이익 {currency(item.sales.netRevenue)}</div>
                            <div className="text-xs text-gray-400">
                              {formatCount(item.sales.count)}건 · {formatCount(item.sales.headcount)}명
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            <div>총액 {currency(item.branchCommission.gross)}</div>
                            <div>원천징수 {currency(item.branchCommission.withholding)}</div>
                            <div className="text-xs text-gray-500">세후 {currency(item.branchCommission.net)}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            <div>총액 {currency(item.overrideCommission.gross)}</div>
                            <div>원천징수 {currency(item.overrideCommission.withholding)}</div>
                            <div className="text-xs text-gray-500">세후 {currency(item.overrideCommission.net)}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-900">
                            <div className="font-semibold">{currency(item.totalCommission.net)}</div>
                            <div className="text-xs text-gray-500">
                              총액 {currency(item.totalCommission.gross)} · 원천징수 {currency(item.totalCommission.withholding)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="집계된 대리점장 데이터가 없습니다." />
                )}
              </div>
            </section>
          ) : null}

          {activeCategory === 'agents' ? (
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">판매원 결산</h2>
                <p className="text-sm text-gray-500">
                  총 {formatCount(data?.agents?.length || 0)}명 · 커미션 {currency(totals.agent.gross)}
                </p>
              </header>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                {data?.agents?.length ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">판매원</th>
                        <th className="px-4 py-3">소속</th>
                        <th className="px-4 py-3">판매 현황</th>
                        <th className="px-4 py-3">커미션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.agents.map((item) => (
                        <tr key={item.agent.id}>
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-900">
                              {item.agent.displayName || item.agent.nickname || '-'}
                            </div>
                            <div className="text-xs text-gray-500">{item.agent.affiliateCode || '-'}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            {item.manager ? (
                              <>
                                <div>{item.manager.displayName || '-'}</div>
                                <div className="text-xs text-gray-500">{item.manager.affiliateCode || '-'}</div>
                              </>
                            ) : (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                                본사 직속
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            <div>매출 {currency(item.sales.saleAmount)}</div>
                            <div>순이익 {currency(item.sales.netRevenue)}</div>
                            <div className="text-xs text-gray-400">
                              {formatCount(item.sales.count)}건 · {formatCount(item.sales.headcount)}명
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-900">
                            <div className="font-semibold">{currency(item.commission.net)}</div>
                            <div className="text-xs text-gray-500">
                              총액 {currency(item.commission.gross)} · 원천징수 {currency(item.commission.withholding)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="집계된 판매원 데이터가 없습니다." />
                )}
              </div>
            </section>
          ) : null}

          {activeCategory === 'sales' ? (
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">판매 상세 내역</h2>
                <p className="text-sm text-gray-500">정산 기간 내 확정된 판매 건수 {formatCount(totals.saleCount)}건</p>
              </header>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                {data?.sales?.length ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">판매일</th>
                        <th className="px-4 py-3">상품</th>
                        <th className="px-4 py-3">대리점장</th>
                        <th className="px-4 py-3">판매원</th>
                        <th className="px-4 py-3">매출</th>
                        <th className="px-4 py-3">HQ 순익</th>
                        <th className="px-4 py-3">대리점장</th>
                        <th className="px-4 py-3">판매원</th>
                        <th className="px-4 py-3">인원</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {data.sales.map((sale) => (
                        <tr key={sale.saleId}>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">{formatDate(sale.saleDate)}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-900">{sale.product.title || '-'}</div>
                            <div className="text-xs text-gray-500">{sale.product.code || '-'}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            <div>{sale.manager?.displayName || '-'}</div>
                            <div className="text-xs text-gray-500">{sale.manager?.affiliateCode || '-'}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">
                            <div>{sale.agent?.displayName || '-'}</div>
                            <div className="text-xs text-gray-500">{sale.agent?.affiliateCode || '-'}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-900">
                            <div className="font-semibold">{currency(sale.amounts.sale)}</div>
                            <div className="text-xs text-gray-500">순이익 {currency(sale.amounts.netRevenue)}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-900">
                            <div className="font-semibold">{currency(sale.amounts.hqNet)}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-900">
                            <div>브랜치 {currency(sale.commissions.branch.net)}</div>
                            <div className="text-xs text-gray-500">오버 {currency(sale.commissions.override.net)}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-900">
                            <div className="font-semibold">{currency(sale.commissions.agent.net)}</div>
                            <div className="text-xs text-gray-500">원천징수 {currency(sale.commissions.agent.withholding)}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-gray-600">{formatCount(sale.headcount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="정산 기간 내 판매 데이터가 없습니다." />
                )}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          {loading ? '정산 데이터를 불러오는 중입니다...' : '표시할 정산 데이터가 없습니다.'}
        </div>
      )}
    </div>
  );
}

const formatValueByType = (value: number, format: ComparisonFormat) => {
  const safe = Number.isFinite(value) ? value : 0;
  return format === 'currency' ? currency(safe) : formatCount(safe);
};

const formatDiffByType = (value: number, format: ComparisonFormat) => {
  if (!Number.isFinite(value) || value === 0) {
    return formatValueByType(0, format);
  }
  const sign = value > 0 ? '+' : '-';
  const absFormatted = formatValueByType(Math.abs(value), format);
  return `${sign}${absFormatted}`;
};

function ComparisonTable({ title, rows, loading }: ComparisonTableProps) {
  if (!rows.length) {
    return (
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {loading ? <FiRefreshCw className="h-4 w-4 animate-spin text-indigo-500" /> : null}
        </header>
        <p className="text-sm text-gray-500">비교할 데이터가 없습니다.</p>
      </div>
    );
  }

  const hasDashboardData = rows.some((row) => row.dashboard != null);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {loading ? <FiRefreshCw className="h-4 w-4 animate-spin text-indigo-500" /> : null}
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-2 pr-4">항목</th>
              <th className="py-2 pr-4">정산 대시보드</th>
              <th className="py-2 pr-4">비교 대시보드</th>
              <th className="py-2">차이</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const tolerance = row.tolerance ?? (row.format === 'currency' ? 1 : 0);
              const diff = row.dashboard != null ? row.settlement - row.dashboard : null;
              const withinTolerance = diff !== null ? Math.abs(diff) <= tolerance : false;
              const diffDisplay =
                diff === null
                  ? '-'
                  : withinTolerance
                  ? formatValueByType(0, row.format)
                  : formatDiffByType(diff, row.format);
              const diffClass = diff === null ? 'text-gray-400' : withinTolerance ? 'text-emerald-600' : 'text-red-600';

              return (
                <tr key={row.key}>
                  <td className="py-2 pr-4 text-sm font-medium text-gray-700">{row.label}</td>
                  <td className="py-2 pr-4 text-sm text-gray-900">{formatValueByType(row.settlement, row.format)}</td>
                  <td className="py-2 pr-4 text-sm text-gray-900">
                    {row.dashboard != null ? formatValueByType(row.dashboard, row.format) : '-'}
                  </td>
                  <td className={`py-2 text-sm font-semibold ${diffClass}`}>{diffDisplay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!hasDashboardData && !loading ? (
        <p className="pt-2 text-xs text-gray-400">비교할 대시보드 데이터가 없습니다.</p>
      ) : null}
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
};

function SummaryCard({ title, value, subtitle, icon }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

type EmptyStateProps = {
  message: string;
};

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-gray-500">
      {message}
    </div>
  );
}
