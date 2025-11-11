'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    hibernated: number;
  };
  features: Array<{
    feature: string;
    usageCount: number;
    activeUsers: number;
  }>;
  trips: {
    total: number;
    thisWeek: number;
    avgDuration: number;
    topDestinations: Array<{ name: string; count: number }>;
    source?: string;
  };
  expenses: {
    totalKRW: number;
    avgDaily: number;
    byCategory: Record<string, number>;
  };
  rePurchase: {
    conversionRate: number;
    pending: number;
    converted: number;
    total: number;
    byTripCount?: {
      first: number;
      second: number;
      third: number;
      fourth: number;
      fifthPlus: number;
    };
    conversionRates?: {
      firstToSecond: number;
      secondToThird: number;
      thirdToFourth: number;
      fourthToFifth: number;
    };
  };
  averages?: {
    avgTripCountPerUser: number;
    avgChatMessagesPerUser: number;
    avgChecklistItemsPerUser: number;
    avgChecklistCompletionRate: number;
    avgExpensesPerUser: number;
    avgExpenseAmountPerUser: number;
    avgTranslationUsageRate: number;
    avgFeatureUsagePerUser: number;
  };
}

interface TrendData {
  date: string;
  newUsers: number;
  activeUsers: number;
  newTrips: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  icon: string;
  trend?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-extrabold text-gray-900 mb-2">{value}</p>
          {trend && (
            <p className="text-sm font-medium text-green-600 mt-1">{trend}</p>
          )}
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 shadow-md">
          <span className="text-3xl text-white">{icon}</span>
        </div>
      </div>
    </div>
  );
});

const TimeRangeSelector = memo(function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const timeRangeOptions = useMemo(
    () => [
      { label: '7일', value: '7d' },
      { label: '30일', value: '30d' },
      { label: '90일', value: '90d' },
    ],
    []
  );

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-semibold text-gray-700">기간 선택:</span>
      {timeRangeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-md ${
            value === option.value
              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/analytics?range=${timeRange}`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '데이터를 불러올 수 없습니다.';
        let retryable = true;

        if (response.status === 401) {
          errorMessage = '인증이 필요합니다. 다시 로그인해 주세요.';
          retryable = false;
        } else if (response.status === 403) {
          errorMessage = '접근 권한이 없습니다.';
          retryable = false;
        } else if (response.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
          retryable = true;
        } else if (response.status === 404) {
          errorMessage = '요청한 리소스를 찾을 수 없습니다.';
          retryable = false;
        }

        console.error('[Analytics Page] API Error:', response.status, errorText);
        setError({ message: errorMessage, retryable });
        setStats(null);
        setTrends([]);
        return;
      }
      
      const data = await response.json();

      if (data.ok) {
        setStats(data.stats);
        setTrends(data.trends || []);
        setError(null);
      } else {
        console.error('[Analytics Page] API returned error:', data.error);
        setError({ 
          message: data.error || '데이터를 불러오는 중 오류가 발생했습니다.', 
          retryable: true 
        });
        setStats(null);
        setTrends([]);
      }
    } catch (error) {
      console.error('[Analytics Page] Error loading analytics:', error);
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      setError({ 
        message: isNetworkError 
          ? '네트워크 연결을 확인하고 다시 시도해 주세요.' 
          : '데이터를 불러오는 중 오류가 발생했습니다.',
        retryable: true 
      });
      setStats(null);
      setTrends([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as '7d' | '30d' | '90d');
  }, []);

  // 기능 사용 분포 차트 데이터 (메모이제이션) - Hook은 early return 이전에 호출
  const featureData = useMemo(() => {
    if (!stats) return [];
    return stats.features.map((f) => ({
      name: f.feature === 'ai_chat' ? 'AI 채팅' : 
            f.feature === 'checklist' ? '체크리스트' :
            f.feature === 'wallet' ? '가계부' :
            f.feature === 'map' ? '지도' :
            f.feature === 'translator' ? '번역기' : f.feature,
      value: f.usageCount,
      activeUsers: f.activeUsers,
    }));
  }, [stats?.features]);

  // 카테고리별 지출 차트 데이터 (메모이제이션)
  const expenseCategoryData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.expenses.byCategory).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [stats?.expenses.byCategory]);

  // 인기 여행지 차트 데이터 (메모이제이션)
  const topDestinationsData = useMemo(() => {
    if (!stats) return [];
    return stats.trips.topDestinations
      .slice(0, 10) // 최대 10개만 표시
      .map((d, index) => ({
        name: d.name,
        count: d.count,
        fill: COLORS[index % COLORS.length], // 각 바에 다른 색상 적용
      }));
  }, [stats?.trips.topDestinations]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">데이터 분석</h1>
          <p className="text-gray-600">사용자 행동 및 기능 사용 통계를 확인하세요</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-red border-t-transparent mb-4"></div>
          <p className="text-lg font-medium text-gray-700">데이터를 불러오는 중...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  if (!stats && error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">데이터 분석</h1>
          <p className="text-gray-600">사용자 행동 및 기능 사용 통계를 확인하세요</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</p>
          <p className="text-gray-600 mb-4">{error.message}</p>
          {error.retryable && (
            <button
              onClick={loadStats}
              className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              다시 시도
            </button>
          )}
          {!error.retryable && (
            <a
              href="/admin/login"
              className="inline-block bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              로그인 페이지로 이동
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
          <span className="text-5xl">📈</span>
          데이터 분석
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-lg text-gray-600 font-medium">사용자 행동 및 기능 사용 통계를 확인하세요</p>
          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
      </div>

      {/* 시간 범위 선택 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative">
          <StatCard
            title="총 사용자"
            value={stats.users.total}
            icon="👥"
          />
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        <div className="relative">
          <StatCard
            title="활성 사용자"
            value={stats.users.active}
            icon="✅"
          />
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        <div className="relative">
          <StatCard
            title="이번 주 신규"
            value={stats.users.newThisWeek}
            icon="🆕"
          />
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        <div className="relative">
          <StatCard
            title="재구매 전환율"
            value={`${stats.rePurchase.conversionRate}%`}
            icon="🔄"
          />
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
      </div>

      {/* 전체 평균 데이터 */}
      {stats.averages && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">📊 전체 평균 데이터</h3>
            <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
              지니AI 가이드
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">평균 여행 횟수</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgTripCountPerUser}회</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">평균 채팅 메시지</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgChatMessagesPerUser}개</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">평균 체크리스트 항목</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgChecklistItemsPerUser}개</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">체크리스트 완료율</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgChecklistCompletionRate}%</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">평균 지출 항목</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgExpensesPerUser}개</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">평균 지출 금액</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgExpenseAmountPerUser.toLocaleString()}원</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">번역기 사용률</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgTranslationUsageRate}%</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 mb-1">평균 기능 사용</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averages.avgFeatureUsagePerUser}회</p>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 증가 추이 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">사용자 증가 추이</h3>
          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        {trends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-lg font-medium">추이 데이터가 없습니다</p>
            <p className="text-sm mt-1">선택한 기간에 데이터가 없습니다</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('ko-KR');
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#8884d8"
                name="신규 가입자"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#82ca9d"
                name="활성 사용자"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 기능 사용 분포 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">기능 사용 분포</h3>
          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        {featureData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📱</div>
            <p className="text-lg font-medium">기능 사용 데이터가 없습니다</p>
            <p className="text-sm mt-1">선택한 기간에 기능 사용 기록이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {featureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {featureData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">활성: {item.activeUsers}명</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 기능별 사용 횟수 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">기능별 사용 횟수</h3>
          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        {featureData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📈</div>
            <p className="text-lg font-medium">기능 사용 데이터가 없습니다</p>
            <p className="text-sm mt-1">선택한 기간에 기능 사용 기록이 없습니다</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="사용 횟수" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 인기 여행지 Top 10 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-extrabold text-gray-900 drop-shadow-sm">인기 여행지 Top 10</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
              지니AI 가이드
            </span>
            <span className="text-xs text-gray-600">
              (온보딩 + 다이어리 통합)
            </span>
          </div>
        </div>
        {topDestinationsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🌍</div>
            <p className="text-lg font-medium">여행지 데이터가 없습니다</p>
            <p className="text-sm mt-1">선택한 기간에 여행 기록이 없습니다</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={topDestinationsData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                tick={{ fill: '#374151', fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150}
                tick={{ fill: '#374151', fontSize: 12 }}
                interval={0}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()}회`, '여행 수']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="count" name="여행 수" radius={[0, 8, 8, 0]}>
                {topDestinationsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 카테고리별 지출 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">카테고리별 지출 분포</h3>
          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        {expenseCategoryData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-lg font-medium">지출 데이터가 없습니다</p>
            <p className="text-sm mt-1">선택한 기간에 지출 기록이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                총 지출: {stats.expenses.totalKRW.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600 mt-1">
                평균 일일 지출: {stats.expenses.avgDaily.toLocaleString()}원
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                <Legend />
                <Bar dataKey="value" fill="#FF8042" name="지출 금액 (원)" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* 재구매 통계 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">재구매 전환 통계</h3>
          <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
            지니AI 가이드
          </span>
        </div>
        
        {/* 기본 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">전체 잠재 고객</p>
            <p className="text-2xl font-bold text-blue-600">{stats.rePurchase.total}</p>
            <p className="text-xs text-gray-500 mt-1">(1회 + 2회 이상)</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">전환 대기</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.rePurchase.pending}</p>
            <p className="text-xs text-gray-500 mt-1">(첫 번째 여행)</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">전환 완료</p>
            <p className="text-2xl font-bold text-green-600">{stats.rePurchase.converted}</p>
            <p className="text-xs text-gray-500 mt-1">(2회 이상)</p>
          </div>
        </div>
        
        {/* 전체 전환율 */}
        <div className="mb-6 text-center">
          <p className="text-3xl font-bold text-brand-red">
            전체 전환율: {stats.rePurchase.conversionRate}%
          </p>
          <p className="text-sm text-gray-600 mt-1">(1회 → 2회 이상)</p>
        </div>
        
        {/* tripCount별 분포 */}
        {stats.rePurchase.byTripCount && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-3">여행 횟수별 고객 분포</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">1회</p>
                <p className="text-xl font-bold text-gray-800">{stats.rePurchase.byTripCount.first || 0}명</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">2회</p>
                <p className="text-xl font-bold text-green-700">{stats.rePurchase.byTripCount.second || 0}명</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">3회</p>
                <p className="text-xl font-bold text-blue-700">{stats.rePurchase.byTripCount.third || 0}명</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">4회</p>
                <p className="text-xl font-bold text-purple-700">{stats.rePurchase.byTripCount.fourth || 0}명</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">5회 이상</p>
                <p className="text-xl font-bold text-indigo-700">{stats.rePurchase.byTripCount.fifthPlus || 0}명</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 단계별 전환율 */}
        {stats.rePurchase.conversionRates && (
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">단계별 전환율</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">1회 → 2회</p>
                <p className="text-xl font-bold text-yellow-700">{stats.rePurchase.conversionRates.firstToSecond || 0}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">2회 → 3회</p>
                <p className="text-xl font-bold text-green-700">{stats.rePurchase.conversionRates.secondToThird || 0}%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">3회 → 4회</p>
                <p className="text-xl font-bold text-blue-700">{stats.rePurchase.conversionRates.thirdToFourth || 0}%</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">4회 → 5회+</p>
                <p className="text-xl font-bold text-purple-700">{stats.rePurchase.conversionRates.fourthToFifth || 0}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 전체 고객 평균 통계 */}
      <GlobalAverageStats />
    </div>
  );
}

// 전체 고객 평균 통계 컴포넌트
function GlobalAverageStats() {
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics/global', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.data) {
          setGlobalStats(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load global stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold mb-4">전체 고객 평균 통계</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!globalStats) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📊 전체 고객 평균 통계</h3>
        <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
          지니AI 가이드
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">사용자당 평균 여행 수</p>
          <p className="text-2xl font-bold text-blue-600">{globalStats.평균_통계?.사용자당_평균_여행_수 || 0}회</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">사용자당 평균 대화 수</p>
          <p className="text-2xl font-bold text-green-600">{globalStats.평균_통계?.사용자당_평균_대화_수 || 0}회</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">사용자당 평균 메시지 수</p>
          <p className="text-2xl font-bold text-purple-600">{globalStats.평균_통계?.사용자당_평균_메시지_수 || 0}개</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">사용자당 평균 지출 금액</p>
          <p className="text-2xl font-bold text-orange-600">
            {globalStats.평균_통계?.사용자당_평균_지출_금액_원화?.toLocaleString() || 0}원
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">사용자당 평균 체크리스트 항목</p>
          <p className="text-2xl font-bold text-indigo-600">
            {globalStats.평균_통계?.사용자당_평균_체크리스트_항목_수 || 0}개
          </p>
        </div>
        <div className="bg-pink-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">평균 체크리스트 완료율</p>
          <p className="text-2xl font-bold text-pink-600">
            {globalStats.평균_통계?.평균_체크리스트_완료율_퍼센트 || 0}%
          </p>
        </div>
      </div>

      {globalStats.기능_사용_통계 && globalStats.기능_사용_통계.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">기능별 평균 사용 횟수</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {globalStats.기능_사용_통계.map((feature: any, idx: number) => {
              // 기능명 한국어 변환
              const featureKoreanName = feature.기능명 === 'ai_chat' ? 'AI 채팅' :
                                       feature.기능명 === 'checklist' ? '체크리스트' :
                                       feature.기능명 === 'wallet' ? '가계부' :
                                       feature.기능명 === 'map' ? '지도' :
                                       feature.기능명 === 'translator' ? '번역기' :
                                       feature.기능명;
              
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">{featureKoreanName}</p>
                  <p className="text-lg font-bold text-gray-600">{feature.사용자당_평균_사용_횟수}회</p>
                  <p className="text-xs text-gray-500 mt-1">사용자 {feature.사용한_사용자_수}명</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {globalStats.인기_방문_국가 && globalStats.인기_방문_국가.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">인기 방문 국가 Top 10</h4>
          <div className="flex flex-wrap gap-2">
            {globalStats.인기_방문_국가.map((country: any, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
              >
                {country.국가명} ({country.방문_횟수}회)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
