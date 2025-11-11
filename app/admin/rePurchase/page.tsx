'use client';

import { useState, useEffect, useCallback } from 'react';
import {
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

interface RePurchaseStats {
  total: number;
  pending: number; // tripCount = 1
  converted: number; // tripCount >= 2
  conversionRate: number;
  byTripCount: {
    first: number; // tripCount = 1
    second: number; // tripCount = 2
    third: number; // tripCount = 3
    fourth: number; // tripCount = 4
    fifthPlus: number; // tripCount >= 5
  };
  conversionRates: {
    firstToSecond: number; // 1회 → 2회 전환율
    secondToThird: number; // 2회 → 3회 전환율
    thirdToFourth: number; // 3회 → 4회 전환율
    fourthToFifth: number; // 4회 → 5회+ 전환율
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function RePurchasePage() {
  const [stats, setStats] = useState<RePurchaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/rePurchase/pattern', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '재구매 패턴 데이터를 불러올 수 없습니다.';

        if (response.status === 401) {
          errorMessage = '인증이 필요합니다. 다시 로그인해 주세요.';
        } else if (response.status === 403) {
          errorMessage = '접근 권한이 없습니다.';
        } else if (response.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        }

        console.error('[RePurchase Page] Failed to load pattern:', response.status, errorText);
        setError(errorMessage);
        setStats(null);
      } else {
        const data = await response.json();
        if (data.ok && data.stats) {
          setStats(data.stats);
          setError(null);
        } else {
          setError('데이터 형식이 올바르지 않습니다.');
          setStats(null);
        }
      }
    } catch (error) {
      console.error('[RePurchase Page] Error loading pattern:', error);
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      setError(
        isNetworkError
          ? '네트워크 연결을 확인하고 다시 시도해 주세요.'
          : '재구매 패턴 데이터를 불러오는 중 오류가 발생했습니다.'
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">재구매 전환 추적</h1>
            <p className="text-gray-600">고객의 재구매 패턴을 분석하세요</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-red border-t-transparent mb-4"></div>
          <p className="text-lg font-medium text-gray-700">데이터를 불러오는 중...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-5xl">🔄</span>
            재구매 전환 추적
          </h1>
          <p className="text-lg text-gray-600 font-medium">온보딩 기반 재구매 패턴 분석</p>
          <p className="text-sm text-gray-500 mt-1">
            첫 번째 여행 = 전환 대기 | 두 번째 이상 = 전환 완료
          </p>
        </div>
        <button
          onClick={loadData}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:scale-105"
        >
          새로고침
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="text-red-600 hover:text-red-800 text-sm font-medium underline"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {!stats ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg font-medium text-gray-600">재구매 패턴 데이터가 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">온보딩이 등록되면 여기에 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* 기본 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
              <p className="text-sm font-semibold text-gray-600 mb-2">전체 잠재 고객</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">(1회 + 2회 이상)</p>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
              <p className="text-sm font-semibold text-gray-600 mb-2">전환 대기</p>
              <p className="text-4xl font-extrabold text-yellow-600 mt-2">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">(첫 번째 여행)</p>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
              <p className="text-sm font-semibold text-gray-600 mb-2">전환 완료</p>
              <p className="text-4xl font-extrabold text-green-600 mt-2">{stats.converted}</p>
              <p className="text-xs text-gray-500 mt-1">(2회 이상)</p>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all">
              <p className="text-sm font-semibold text-gray-600 mb-2">전체 전환율</p>
              <p className="text-4xl font-extrabold text-red-600 mt-2">
                {stats.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">(1회 → 2회 이상)</p>
            </div>
          </div>

          {/* 여행 횟수별 고객 분포 */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">여행 횟수별 고객 분포</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">1회</p>
                <p className="text-3xl font-bold text-gray-800">{stats.byTripCount.first}</p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">2회</p>
                <p className="text-3xl font-bold text-green-700">{stats.byTripCount.second}</p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">3회</p>
                <p className="text-3xl font-bold text-blue-700">{stats.byTripCount.third}</p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">4회</p>
                <p className="text-3xl font-bold text-purple-700">{stats.byTripCount.fourth}</p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">5회 이상</p>
                <p className="text-3xl font-bold text-indigo-700">{stats.byTripCount.fifthPlus}</p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: '1회', value: stats.byTripCount.first, color: '#gray' },
                { name: '2회', value: stats.byTripCount.second, color: '#00C49F' },
                { name: '3회', value: stats.byTripCount.third, color: '#0088FE' },
                { name: '4회', value: stats.byTripCount.fourth, color: '#FF8042' },
                { name: '5회+', value: stats.byTripCount.fifthPlus, color: '#8884d8' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="고객 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 단계별 전환율 */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">단계별 전환율</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">1회 → 2회</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {stats.conversionRates.firstToSecond.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.byTripCount.first}명 중 {stats.byTripCount.second}명
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">2회 → 3회</p>
                <p className="text-3xl font-bold text-green-700">
                  {stats.conversionRates.secondToThird.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.byTripCount.second}명 중 {stats.byTripCount.third}명
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">3회 → 4회</p>
                <p className="text-3xl font-bold text-blue-700">
                  {stats.conversionRates.thirdToFourth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.byTripCount.third}명 중 {stats.byTripCount.fourth}명
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">4회 → 5회+</p>
                <p className="text-3xl font-bold text-purple-700">
                  {stats.conversionRates.fourthToFifth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.byTripCount.fourth}명 중 {stats.byTripCount.fifthPlus}명
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { step: '1회→2회', rate: stats.conversionRates.firstToSecond },
                { step: '2회→3회', rate: stats.conversionRates.secondToThird },
                { step: '3회→4회', rate: stats.conversionRates.thirdToFourth },
                { step: '4회→5회+', rate: stats.conversionRates.fourthToFifth },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="rate" fill="#ff8042" name="전환율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 파이 차트: 전환 대기 vs 전환 완료 */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">전환 상태 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: '전환 대기', value: stats.pending },
                    { name: '전환 완료', value: stats.converted },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#FFBB28" />
                  <Cell fill="#00C49F" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
