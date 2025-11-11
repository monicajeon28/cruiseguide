'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiClock,
  FiBarChart2,
  FiFilter,
  FiRefreshCcw,
  FiCreditCard,
} from 'react-icons/fi';

interface ChatBotFlow {
  id: number;
  name: string;
}

interface ChatBotSessionSummary {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  ongoingSessions: number;
  conversionRate: number;
  avgDurationMs: number | null;
}

interface QuestionStat {
  questionId: number;
  questionOrder: number | null;
  questionText: string;
  totalResponses: number;
  abandonedResponses: number;
  dropOffRate: number;
  avgResponseTime: number | null;
}

interface OptionStat {
  questionId: number;
  optionLabel: string | null;
  count: number;
  percentage: number;
}

interface HourlySessionStat {
  hour: number;
  total: number;
  completed: number;
  abandoned: number;
  ongoing: number;
}

interface SessionPathStep {
  questionId: number;
  questionOrder: number | null;
  questionText: string;
}

interface SessionPathStat {
  path: SessionPathStep[];
  sessions: number;
  completedSessions: number;
  conversionRate: number;
}

interface ChatBotStats {
  sessionSummary: ChatBotSessionSummary;
  questionStats: QuestionStat[];
  optionStats: OptionStat[];
  hourlyStats: HourlySessionStat[];
  topSessionPaths: SessionPathStat[];
  paymentStats?: {
    attemptedSessions: number;
    successSessions: number;
    failedSessions: number;
    successRate: number;
  };
}

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'COMPLETED', label: '완료(결제)' },
  { value: 'ABANDONED', label: '이탈' },
  { value: 'ONGOING', label: '진행 중' },
];

const formatDuration = (ms: number | null) => {
  if (!ms || ms <= 0) return '-';
  const minutes = ms / 1000 / 60;
  if (minutes < 1) return `${Math.round(ms / 1000)}초`;
  if (minutes < 60) return `${minutes.toFixed(1)}분`;
  const hours = minutes / 60;
  return `${hours.toFixed(1)}시간`;
};

const formatResponseTime = (ms: number | null) => {
  if (!ms || ms <= 0) return '-';
  return `${(ms / 1000).toFixed(1)}초`;
};

const truncate = (text: string, maxLength = 40) => {
  if (!text) return '(질문 텍스트 없음)';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

export default function ChatBotInsightsPage() {
  const [flows, setFlows] = useState<ChatBotFlow[]>([]);
  const [stats, setStats] = useState<ChatBotStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowsLoading, setIsFlowsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [flowId, setFlowId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [productCode, setProductCode] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    loadFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFlows = async () => {
    try {
      setIsFlowsLoading(true);
      const response = await fetch('/api/admin/chat-bot/flows', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load flows');
      const data = await response.json();
      setFlows(
        (data.data || []).map((flow: any) => ({
          id: flow.id,
          name: flow.name,
        })),
      );
    } catch (error) {
      console.error('Error loading flows:', error);
      setError('플로우 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsFlowsLoading(false);
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (flowId) params.set('flowId', flowId);
    if (status) params.set('status', status);
    if (productCode) params.set('productCode', productCode.trim());
    if (fromDate) params.set('from', new Date(fromDate).toISOString());
    if (toDate) params.set('to', new Date(toDate).toISOString());
    return params.toString();
  };

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const query = buildQuery();
      const response = await fetch(
        `/api/admin/chat-bot/stats${query ? `?${query}` : ''}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data.data as ChatBotStats);
    } catch (error) {
      console.error('Error loading chatbot stats:', error);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFlowId('');
    setStatus('');
    setProductCode('');
    setFromDate('');
    setToDate('');
    setTimeout(() => loadStats(), 0);
  };

  const summary = stats?.sessionSummary;
  const questionStats = stats?.questionStats ?? [];
  const optionStats = stats?.optionStats ?? [];
  const hourlyStats = stats?.hourlyStats ?? [];
  const topSessionPaths = stats?.topSessionPaths ?? [];
  const paymentStats = stats?.paymentStats;

  const flowNameMap = useMemo(() => {
    const map = new Map<number, string>();
    flows.forEach((flow) => map.set(flow.id, flow.name));
    return map;
  }, [flows]);

  const maxHourlyTotal = useMemo(() => {
    if (!hourlyStats.length) return 0;
    return hourlyStats.reduce((max, item) => Math.max(max, item.total), 0);
  }, [hourlyStats]);

  const activeHourlyStats = useMemo(() => {
    return hourlyStats.filter((item) => item.total > 0);
  }, [hourlyStats]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 AI 지니 채팅봇(구매) 대시보드
              </h1>
              <p className="text-gray-600">
                전환율, 질문별 이탈률, 선택 비율을 한눈에 확인하세요.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiFilter className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">필터</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">플로우</label>
              <select
                disabled={isFlowsLoading}
                value={flowId}
                onChange={(e) => setFlowId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 플로우</option>
                {flows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상품 코드</label>
              <input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="예: COSTA-XXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={loadStats}
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <FiBarChart2 />
              통계 조회
            </button>
            <button
              onClick={handleResetFilters}
              disabled={isLoading}
              className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <FiRefreshCcw />
              필터 초기화
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">통계를 불러오는 중입니다...</p>
          </div>
        ) : !stats ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-600">
            조회된 데이터가 없습니다. 조건을 바꿔 다시 시도해 주세요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiUsers className="text-blue-600" size={24} />
                  <span className="text-sm font-medium text-gray-600">총 세션</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {summary!.totalSessions.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiTrendingUp className="text-green-600" size={24} />
                  <span className="text-sm font-medium text-gray-600">완료(결제) 세션</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {summary!.completedSessions.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiTrendingDown className="text-orange-600" size={24} />
                  <span className="text-sm font-medium text-gray-600">이탈 세션</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {summary!.abandonedSessions.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiBarChart2 className="text-purple-600" size={24} />
                  <span className="text-sm font-medium text-gray-600">전환율</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {summary!.conversionRate.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiClock className="text-blue-600" size={24} />
                  <span className="text-sm font-medium text-gray-600">평균 상담 소요 시간</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {formatDuration(summary!.avgDurationMs)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiUsers className="text-gray-500" size={24} />
                  <span className="text-sm font-medium text-gray-600">진행 중 세션</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {summary!.ongoingSessions.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiCreditCard className="text-purple-600" size={24} />
                  <span className="text-sm font-medium text-gray-600">결제 전환</span>
                </div>
                {paymentStats ? (
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>결제 시도</span>
                      <span className="font-semibold">{paymentStats.attemptedSessions.toLocaleString()}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span>성공</span>
                      <span className="font-semibold text-green-600">{paymentStats.successSessions.toLocaleString()}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span>실패</span>
                      <span className="font-semibold text-red-500">{paymentStats.failedSessions.toLocaleString()}건</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-gray-800">
                      <span className="font-semibold">성공률</span>
                      <span className="text-lg font-bold">
                        {paymentStats.successRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">결제 데이터가 없습니다.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">시간대별 상담량</h2>
              {activeHourlyStats.length === 0 ? (
                <p className="text-gray-600">선택한 조건에 해당하는 상담 데이터가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {activeHourlyStats.map((item) => {
                    const barWidth = maxHourlyTotal > 0 ? (item.total / maxHourlyTotal) * 100 : 0;
                    const hourLabel = `${item.hour.toString().padStart(2, '0')}시`;
                    return (
                      <div key={item.hour} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-semibold text-gray-700">{hourLabel}</div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span>총 {item.total.toLocaleString()}건</span>
                            <span className="text-green-600">완료 {item.completed.toLocaleString()}건</span>
                            <span className="text-orange-600">이탈 {item.abandoned.toLocaleString()}건</span>
                            <span className="text-blue-600">진행 {item.ongoing.toLocaleString()}건</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">주요 상담 경로 TOP 5</h2>
              {topSessionPaths.length === 0 ? (
                <p className="text-gray-600">표시할 상담 경로가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-700">
                        <th className="text-left py-3 px-4 font-semibold">순위</th>
                        <th className="text-left py-3 px-4 font-semibold">상담 경로</th>
                        <th className="text-center py-3 px-4 font-semibold">세션 수</th>
                        <th className="text-center py-3 px-4 font-semibold">완료율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSessionPaths.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-semibold text-gray-700">#{index + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                              {item.path.map((step, stepIndex) => (
                                <div key={`${step.questionId}-${stepIndex}`} className="flex items-center gap-1">
                                  <span className="text-gray-500 font-semibold">
                                    {step.questionOrder !== null ? step.questionOrder : stepIndex + 1}.
                                  </span>
                                  <span>{truncate(step.questionText)}</span>
                                  {stepIndex < item.path.length - 1 && (
                                    <span className="text-gray-400">→</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-gray-700">
                            {item.sessions.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-semibold text-gray-700">
                            {item.conversionRate.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">질문별 이탈 분석</h2>
              {questionStats.length === 0 ? (
                <p className="text-gray-600">표시할 데이터가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-700">
                        <th className="text-left py-3 px-4 font-semibold">질문</th>
                        <th className="text-center py-3 px-4 font-semibold">응답 수</th>
                        <th className="text-center py-3 px-4 font-semibold">이탈 수</th>
                        <th className="text-center py-3 px-4 font-semibold">이탈률</th>
                        <th className="text-center py-3 px-4 font-semibold">평균 응답시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionStats.map((item) => (
                        <tr
                          key={`${item.questionId}-${item.questionOrder ?? 'unknown'}`}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="text-sm font-semibold text-gray-800 mb-1">
                              {item.questionOrder !== null ? `Q${item.questionOrder}` : '미지정'}.
                              <span className="ml-2 text-gray-700">
                                {item.questionText || '(질문 텍스트 없음)'}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">
                            {item.totalResponses.toLocaleString()}
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">
                            {item.abandonedResponses.toLocaleString()}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span
                              className={`font-semibold ${
                                item.dropOffRate <= 10
                                  ? 'text-green-600'
                                  : item.dropOffRate <= 30
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {item.dropOffRate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">
                            {formatResponseTime(item.avgResponseTime)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">상위 선택 옵션</h2>
              {optionStats.length === 0 ? (
                <p className="text-gray-600">표시할 데이터가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 text-sm text-gray-700">
                        <th className="text-left py-3 px-4 font-semibold">질문</th>
                        <th className="text-left py-3 px-4 font-semibold">옵션</th>
                        <th className="text-center py-3 px-4 font-semibold">선택 수</th>
                        <th className="text-center py-3 px-4 font-semibold">비율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optionStats.slice(0, 20).map((item, index) => (
                        <tr
                          key={`${item.questionId}-${index}`}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-gray-700">
                            <div className="font-semibold text-gray-800 mb-1">
                              Q{item.questionId}
                            </div>
                            {flowId && (
                              <div className="text-xs text-gray-500">
                                {flowNameMap.get(Number(flowId)) || '플로우'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {item.optionLabel || '(텍스트 없음)'}
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">
                            {item.count.toLocaleString()}
                          </td>
                          <td className="text-center py-3 px-4 text-gray-700">
                            {item.percentage.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}









